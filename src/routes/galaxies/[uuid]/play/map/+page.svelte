<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { auth } from '$lib/auth.svelte';
	import { playerState } from '$lib/stores/playerState.svelte';
	import type { KnownSystem, KnownLane, DangerZone, SectorMapEntry, SectorViewEntry } from '$lib/types/scanning';
	import { KNOWLEDGE_COLORS, STELLAR_COLORS, stellarColor, normalizeKnownSystem } from '$lib/types/scanning';
	import PlayerStats from '$lib/components/game/PlayerStats.svelte';
	import StarMap from '$lib/components/game/StarMap.svelte';
	import SectorMap from '$lib/components/game/SectorMap.svelte';
	import SectorStarMap from '$lib/components/game/SectorStarMap.svelte';
	import MapFilters from '$lib/components/game/MapFilters.svelte';
	import SpaceLoader from '$lib/components/SpaceLoader.svelte';

	interface Props {
		data: { galaxyUuid: string };
	}

	let { data }: Props = $props();

	// Shared loading state
	let isLoading = $state(true);
	let loadError = $state<string | null>(null);

	// Data from knowledge-map + sector-map endpoints
	let knownSystems = $state<KnownSystem[]>([]);
	let knownLanes = $state<KnownLane[]>([]);
	let dangerZones = $state<DangerZone[]>([]);
	let sensorRange = $state(0);
	let playerMapPos = $state<{ x: number; y: number; systemUuid: string }>({ x: 500, y: 500, systemUuid: '' });
	let galaxyBounds = $state({ width: 1000, height: 1000 });
	let sectorEntries = $state<SectorMapEntry[]>([]);
	let gridDims = $state({ cols: 5, rows: 5 });

	// View toggle: sectors (default) vs stars
	let mapView = $state<'sectors' | 'stars'>('sectors');

	// Star map interaction state
	let selectedSystem = $state<string | null>(null);
	let zoom = $state(1);
	let filters = $state({
		gates: false,
		inhabited: false,
		hazards: false
	});

	// Sector map star info (from SectorMap callbacks)
	let hoveredMapStar = $state<KnownSystem | null>(null);
	let selectedMapStar = $state<KnownSystem | null>(null);
	const displayMapStar = $derived(selectedMapStar ?? hoveredMapStar);

	// Drill-down overlay
	let drilldownSectorUuid = $state<string | null>(null);
	let drilldownSectorName = $state('');

	onMount(() => {
		const token = localStorage.getItem('auth_token');
		if (!token) {
			goto(`${base}/login`);
			return;
		}

		auth.initialize().then(async () => {
			if (!auth.isAuthenticated) {
				goto(`${base}/login`);
				return;
			}

			if (!playerState.playerUuid) {
				await playerState.initialize(data.galaxyUuid);
			}

			if (playerState.needsCreation) {
				goto(`${base}/galaxies/${data.galaxyUuid}/play`);
				return;
			}

			await loadMapData();
		});
	});

	async function loadMapData() {
		isLoading = true;
		loadError = null;

		try {
			const [kmResult, smResult] = await Promise.all([
				playerState.loadKnowledgeMap(),
				playerState.loadSectorMap()
			]);

			if (kmResult) {
				knownSystems = kmResult.known_systems.map(normalizeKnownSystem);
				knownLanes = kmResult.known_lanes;
				dangerZones = kmResult.danger_zones;
				sensorRange = kmResult.player.sensor_range_ly;
				playerMapPos = {
					x: kmResult.player.x,
					y: kmResult.player.y,
					systemUuid: kmResult.player.system_uuid
				};
				galaxyBounds = {
					width: kmResult.galaxy.width,
					height: kmResult.galaxy.height
				};

				// Ensure the player's current system is at least knowledge level 4
				const curSys = playerState.currentSystem;
				if (curSys) {
					const idx = knownSystems.findIndex(s => s.poi_uuid === curSys.uuid);
					if (idx !== -1 && knownSystems[idx].knowledge_level < 4) {
						knownSystems[idx] = {
							...knownSystems[idx],
							knowledge_level: 4,
							knowledge_label: 'Visited',
							freshness: 1.0,
							name: knownSystems[idx].name ?? curSys.name
						};
					} else if (idx === -1) {
						// Player's system missing from knowledge map — add it
						knownSystems = [...knownSystems, {
							poi_uuid: curSys.uuid,
							x: curSys.position.x,
							y: curSys.position.y,
							knowledge_level: 4,
							knowledge_label: 'Visited',
							freshness: 1.0,
							source: 'visit',
							name: curSys.name
						}];
					}
				}
			} else {
				loadError = 'Failed to load knowledge map';
			}

			if (smResult) {
				sectorEntries = smResult.sectors;
				gridDims = smResult.grid_size;
			}
		} catch (err) {
			loadError = err instanceof Error ? err.message : 'Unknown error loading map';
		} finally {
			isLoading = false;
		}
	}

	// --- Derive enriched sector data with fog of war ---
	const sectorGridSize = $derived(Math.max(gridDims.cols, gridDims.rows));

	const sectorViewEntries = $derived.by((): SectorViewEntry[] => {
		if (sectorEntries.length === 0) return [];

		const playerSectorUuid = playerState.currentSector?.uuid;

		// Build a set of sector UUIDs that contain at least one known system
		const sectorSystemCounts = new Map<string, { known: number; inhabited: number }>();
		for (const sys of knownSystems) {
			for (const sector of sectorEntries) {
				const b = sector.bounds;
				if (sys.x >= b.x_min && sys.x <= b.x_max && sys.y >= b.y_min && sys.y <= b.y_max) {
					const counts = sectorSystemCounts.get(sector.uuid) ?? { known: 0, inhabited: 0 };
					counts.known++;
					if (sys.is_inhabited) counts.inhabited++;
					sectorSystemCounts.set(sector.uuid, counts);
					break;
				}
			}
		}

		// Build entries — grid positions come from the server (grid_x/grid_y)
		const entries: SectorViewEntry[] = sectorEntries.map((sector) => {
			const counts = sectorSystemCounts.get(sector.uuid);
			return {
				uuid: sector.uuid,
				name: sector.name,
				bounds: sector.bounds,
				gridX: sector.grid_x,
				gridY: sector.grid_y,
				danger_level: sector.danger_level,
				total_systems: sector.total_systems,
				scanned_systems: counts?.known ?? 0,
				inhabited_systems: counts?.inhabited ?? sector.inhabited_systems,
				has_warp_gate: false, // Not in sector-map response; derived from lanes if needed
				has_trading: sector.has_trading,
				player_count: sector.player_count,
				fog: 'hidden' as const
			};
		});

		// --- Compute fog of war ---
		const gridLookup = new Map<string, SectorViewEntry>();

		for (const entry of entries) {
			gridLookup.set(`${entry.gridX},${entry.gridY}`, entry);

			// Revealed: player's sector OR sector has known systems
			if (entry.uuid === playerSectorUuid || (sectorSystemCounts.get(entry.uuid)?.known ?? 0) > 0) {
				entry.fog = 'revealed';
			}
		}

		// Mark adjacent sectors
		for (const entry of entries) {
			if (entry.fog === 'revealed') {
				for (let dx = -1; dx <= 1; dx++) {
					for (let dy = -1; dy <= 1; dy++) {
						if (dx === 0 && dy === 0) continue;
						const neighbor = gridLookup.get(`${entry.gridX + dx},${entry.gridY + dy}`);
						if (neighbor && neighbor.fog === 'hidden') {
							neighbor.fog = 'adjacent';
						}
					}
				}
			}
		}

		return entries;
	});

	// Star color — stellar class when available, knowledge level fallback
	function starColor(sys: KnownSystem): string {
		return stellarColor(sys);
	}

	function handleSectorClick(sectorUuid: string) {
		const sector = sectorViewEntries.find((s) => s.uuid === sectorUuid);
		if (sector) {
			drilldownSectorUuid = sectorUuid;
			drilldownSectorName = sector.name;
		}
	}

	function closeDrilldown() {
		drilldownSectorUuid = null;
		drilldownSectorName = '';
	}

	function handleSystemClick(uuid: string) {
		selectedSystem = uuid === selectedSystem ? null : uuid;
	}

	function handleZoomChange(newZoom: number) {
		zoom = newZoom;
	}

	function handleFilterChange(filter: 'gates' | 'inhabited' | 'hazards', value: boolean) {
		filters = { ...filters, [filter]: value };
	}

	function handleTravel() {
		if (selectedSystem) {
			console.log('Traveling to:', selectedSystem);
		}
	}

	function closeMap() {
		goto(`${base}/galaxies/${data.galaxyUuid}/play`);
	}

	function renderSystemInfo(sys: KnownSystem): { label: string; value: string; color?: string }[] {
		const rows: { label: string; value: string; color?: string }[] = [];
		const level = sys.knowledge_level;

		switch (level) {
			case 4:
				if (sys.scan_level != null) {
					rows.push({ label: 'Scan Level', value: `${sys.scan_level}/9`, color: '#f59e0b' });
				}
				// falls through

			case 3:
				if (sys.temperature_k != null) {
					rows.push({ label: 'Temperature', value: `${sys.temperature_k} K` });
				}
				if (sys.luminosity != null) {
					rows.push({ label: 'Luminosity', value: `${sys.luminosity} L☉` });
				}
				if (sys.goldilocks_zone) {
					rows.push({ label: 'Habitable Zone', value: `${sys.goldilocks_zone.inner}–${sys.goldilocks_zone.outer} AU`, color: '#22c55e' });
				}
				if (sys.planet_count != null) {
					rows.push({ label: 'Planets', value: String(sys.planet_count) });
				}
				if (sys.services) {
					const active = Object.entries(sys.services)
						.filter(([, v]) => v)
						.map(([k]) => k);
					if (active.length > 0) {
						rows.push({ label: 'Services', value: active.join(', '), color: '#10b981' });
					}
				}
				// falls through

			case 2:
				rows.push({ label: 'Name', value: sys.name ?? 'Unknown' });
				if (sys.temperature_range_k) {
					rows.push({ label: 'Temp Range', value: `${sys.temperature_range_k.min}–${sys.temperature_range_k.max} K` });
				}
				rows.push({
					label: 'Inhabited',
					value: sys.is_inhabited ? 'Yes' : 'No',
					color: sys.is_inhabited ? '#22c55e' : undefined
				});
				// falls through

			case 1:
				if (sys.stellar_class) {
					const spectral = sys.stellar_class.charAt(0).toUpperCase();
					rows.push({
						label: 'Star Type',
						value: `${sys.stellar_class}${sys.stellar_description ? ' — ' + sys.stellar_description : ''}`,
						color: STELLAR_COLORS[spectral]
					});
				}
				rows.push({ label: 'Coordinates', value: `${sys.x} x ${sys.y}` });
				if (sys.freshness < 0.3) {
					rows.push({ label: 'Data Age', value: 'Stale', color: '#718096' });
				}
				break;

			case 0:
			default:
				rows.push({ label: 'Unknown', value: 'No Data', color: '#1a1a2e' });
				break;
		}

		return rows.reverse();
	}
</script>

<svelte:head>
	<title>{mapView === 'sectors' ? 'Sector Map' : 'Star Map'} - Space Wars 3002</title>
</svelte:head>

<div class="map-page">
	<header class="map-header">
		<div class="header-title">
			<span class="title-text">{mapView === 'sectors' ? 'Sector Map' : 'Star Map'}</span>
		</div>
		<div class="view-toggle">
			<button
				class="toggle-btn"
				class:active={mapView === 'sectors'}
				onclick={() => mapView = 'sectors'}
			>Sectors</button>
			<button
				class="toggle-btn"
				class:active={mapView === 'stars'}
				onclick={() => mapView = 'stars'}
			>Stars</button>
		</div>
		<button class="btn-close" onclick={closeMap} aria-label="Close map"> &#x2715; </button>
	</header>

	{#if isLoading || playerState.isLoading}
		<div class="loading-container">
			<SpaceLoader message="Loading galaxy map..." />
		</div>
	{:else if loadError || playerState.error}
		<div class="error-container">
			<p class="error-message">{loadError || playerState.error}</p>
			<button class="btn-retry" onclick={loadMapData}> Retry </button>
		</div>
	{:else if mapView === 'sectors'}
		<main class="map-main">
			<div class="map-area">
				<SectorMap
					sectors={sectorViewEntries}
					knownSystems={knownSystems}
					knownLanes={knownLanes}
					gridSize={sectorGridSize}
					playerSectorUuid={playerState.currentSector?.uuid}
					playerSystemUuid={playerState.currentSystem?.uuid}
					onSectorClick={handleSectorClick}
					onStarHover={(star) => hoveredMapStar = star}
					onStarSelect={(star) => selectedMapStar = star}
				/>
			</div>

			<div class="map-sidebar">
				<PlayerStats
					hasShip={!!playerState.activeShip}
					hull={playerState.ship?.hull}
					shield={playerState.ship?.shield}
					fuel={playerState.ship?.fuel}
					compact={true}
				/>

				<!-- System info panel -->
				<div class="system-info-panel">
					{#if displayMapStar}
						<div class="sip-header">
							<span class="sip-name" style="color: {starColor(displayMapStar)}">{displayMapStar.knowledge_level >= 2 && displayMapStar.name ? displayMapStar.name : 'Unknown System'}</span>
							{#if displayMapStar.poi_uuid === playerState.currentSystem?.uuid}
								<span class="sip-tag you">YOU</span>
							{/if}
							{#if selectedMapStar}
								<span class="sip-tag locked">LOCKED</span>
							{/if}
						</div>
						<div class="sip-details">
							{#each renderSystemInfo(displayMapStar) as row}
								<div class="sip-row">
									<span class="sip-label">{row.label}</span>
									<span class="sip-value" style={row.color ? `color: ${row.color}` : ''}>{row.value}</span>
								</div>
							{/each}
							{#if displayMapStar.freshness < 0.3}
								<div class="sip-stale">STALE DATA</div>
							{/if}
							{#if displayMapStar.pirate_warning}
								<div class="sip-pirate">PIRATE ACTIVITY</div>
							{/if}
						</div>
					{:else}
						<div class="sip-empty">
							<span class="sip-empty-label">SYSTEM INFO</span>
							<span class="sip-empty-hint">Hover or click a star</span>
						</div>
					{/if}
				</div>

				<!-- Legend -->
				<div class="map-legend-compact">
					<span class="legend-title">LEGEND</span>
					<div class="legend-entries">
						{#each Object.entries(STELLAR_COLORS) as [cls, color]}
							<span class="legend-entry"><span class="legend-dot" style="background: {color}"></span> {cls} Type Star</span>
						{/each}
						<span class="legend-entry"><span class="legend-line"></span> Warp Lane</span>
						<span class="legend-entry"><span class="legend-line pirate"></span> Pirate Lane</span>
						<span class="legend-entry"><span class="legend-circle danger"></span> Danger Zone</span>
						<span class="legend-entry"><span class="legend-circle sensor"></span> Sensor Range</span>
					</div>
				</div>
			</div>
		</main>

		<!-- Sector drill-down overlay -->
		{#if drilldownSectorUuid}
			<div class="drilldown-overlay" role="dialog" aria-label="Sector detail">
				<SectorStarMap
					sectorUuid={drilldownSectorUuid}
					sectorName={drilldownSectorName}
					currentSystemUuid={playerState.currentSystem?.uuid}
					onClose={closeDrilldown}
				/>
			</div>
		{/if}
	{:else}
		<main class="map-main">
			<div class="map-area">
				<StarMap
					{knownSystems}
					{knownLanes}
					{dangerZones}
					{sensorRange}
					playerPosition={playerMapPos}
					{galaxyBounds}
					{selectedSystem}
					{zoom}
					{filters}
					onSystemClick={handleSystemClick}
				/>
			</div>

			<PlayerStats
				hasShip={!!playerState.activeShip}
				hull={playerState.ship?.hull}
				shield={playerState.ship?.shield}
				fuel={playerState.ship?.fuel}
				distance={45.2}
				cooldown={0}
				collision={false}
				clamp={false}
			/>
		</main>

		<MapFilters
			{zoom}
			showGates={filters.gates}
			showInhabited={filters.inhabited}
			showHazards={filters.hazards}
			{selectedSystem}
			onZoomChange={handleZoomChange}
			onFilterChange={handleFilterChange}
			onTravel={handleTravel}
		/>
	{/if}
</div>

<style>
	.map-page {
		min-height: 100vh;
		background: #0a0a14;
		display: flex;
		flex-direction: column;
	}

	.map-header {
		background: linear-gradient(to bottom, #2d3748, #1a202c);
		border-bottom: 1px solid #4a5568;
		padding: 0.5rem 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.header-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.title-text {
		color: #e2e8f0;
		font-weight: 600;
		font-size: 1rem;
	}

	.btn-close {
		background: transparent;
		border: 1px solid #4a5568;
		color: #a0aec0;
		width: 28px;
		height: 28px;
		border-radius: 4px;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.15s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-close:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #e2e8f0;
	}

	.loading-container,
	.error-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	.error-message {
		color: #fc8181;
		font-size: 1rem;
		background: rgba(239, 68, 68, 0.1);
		padding: 1rem 2rem;
		border-radius: 8px;
		border: 1px solid rgba(239, 68, 68, 0.3);
	}

	.btn-retry {
		background: linear-gradient(to bottom, #4299e1, #3182ce);
		border: 1px solid #2b6cb0;
		color: white;
		padding: 0.5rem 1.5rem;
		border-radius: 4px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-retry:hover {
		background: linear-gradient(to bottom, #63b3ed, #4299e1);
	}

	.map-main {
		flex: 1;
		display: flex;
		gap: 1rem;
		padding: 1rem;
		overflow: hidden;
	}

	.map-area {
		flex: 1;
		display: flex;
		border: 1px solid #4a5568;
		border-radius: 8px;
		overflow: hidden;
	}

	.view-toggle {
		display: flex;
		background: rgba(45, 55, 72, 0.6);
		border: 1px solid #4a5568;
		border-radius: 6px;
		overflow: hidden;
	}

	.toggle-btn {
		padding: 0.25rem 0.75rem;
		background: transparent;
		border: none;
		color: #718096;
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}

	.toggle-btn.active {
		background: rgba(66, 153, 225, 0.3);
		color: #63b3ed;
	}

	.toggle-btn:hover:not(.active) {
		background: rgba(255, 255, 255, 0.05);
		color: #a0aec0;
	}

	.drilldown-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 50;
	}

	/* --- Right sidebar (sector view) --- */
	.map-sidebar {
		width: 200px;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		overflow-y: auto;
	}

	/* --- System info panel --- */
	.system-info-panel {
		background: rgba(26, 32, 44, 0.95);
		border: 1px solid #4a5568;
		border-radius: 8px;
		padding: 0.5rem 0.6rem;
	}

	.sip-header {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		margin-bottom: 0.375rem;
		flex-wrap: wrap;
	}

	.sip-name {
		font-size: 0.8rem;
		font-weight: 600;
	}

	.sip-tag {
		padding: 0.05rem 0.25rem;
		font-size: 0.5rem;
		font-weight: 700;
		border-radius: 3px;
		text-transform: uppercase;
	}

	.sip-tag.you {
		background: rgba(239, 68, 68, 0.2);
		color: #ef4444;
	}

	.sip-tag.locked {
		background: rgba(251, 191, 36, 0.15);
		color: #fbbf24;
	}

	.sip-details {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.sip-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.7rem;
	}

	.sip-label {
		color: #718096;
	}

	.sip-value {
		color: #e2e8f0;
		font-weight: 500;
	}

	.sip-stale {
		font-size: 0.6rem;
		font-weight: 600;
		color: #f6ad55;
		background: rgba(246, 173, 85, 0.1);
		padding: 0.1rem 0.3rem;
		border-radius: 3px;
		text-align: center;
		margin-top: 0.2rem;
	}

	.sip-pirate {
		font-size: 0.6rem;
		font-weight: 600;
		color: #fc8181;
		background: rgba(252, 129, 129, 0.1);
		padding: 0.1rem 0.3rem;
		border-radius: 3px;
		text-align: center;
		margin-top: 0.2rem;
	}

	.sip-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem 0;
	}

	.sip-empty-label {
		font-size: 0.6rem;
		font-weight: 600;
		color: #4a5568;
		letter-spacing: 0.05em;
	}

	.sip-empty-hint {
		font-size: 0.65rem;
		color: #2d3748;
		font-style: italic;
	}

	/* --- Compact legend --- */
	.map-legend-compact {
		background: rgba(26, 32, 44, 0.95);
		border: 1px solid #4a5568;
		border-radius: 8px;
		padding: 0.4rem 0.6rem;
	}

	.legend-title {
		font-size: 0.55rem;
		font-weight: 600;
		color: #4a5568;
		letter-spacing: 0.08em;
		display: block;
		margin-bottom: 0.25rem;
	}

	.legend-entries {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.legend-entry {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.6rem;
		color: #718096;
	}

	.legend-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.legend-line {
		width: 12px;
		height: 1px;
		background: #3b82f6;
		flex-shrink: 0;
	}

	.legend-line.pirate {
		background: #ef4444;
	}

	.legend-circle {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
		background: transparent;
	}

	.legend-circle.danger {
		border: 1px dashed #ef4444;
		background: rgba(239, 68, 68, 0.15);
	}

	.legend-circle.sensor {
		border: 1px dashed #3b82f6;
	}
</style>
