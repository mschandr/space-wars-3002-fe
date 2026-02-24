<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { auth } from '$lib/auth.svelte';
	import { playerState } from '$lib/stores/playerState.svelte';
	import { api } from '$lib/api';
	import type { MapSystemData } from '$lib/types/scanning';
	import PlayerStats from '$lib/components/game/PlayerStats.svelte';
	import StarMap from '$lib/components/game/StarMap.svelte';
	import MapFilters from '$lib/components/game/MapFilters.svelte';
	import SpaceLoader from '$lib/components/SpaceLoader.svelte';
	import { tutorialState } from '$lib/stores/tutorialState.svelte';

	interface Props {
		data: { galaxyUuid: string };
	}

	let { data }: Props = $props();

	let isLoadingMap = $state(true);
	let mapError = $state<string | null>(null);
	let systems = $state<MapSystemData[]>([]);
	let galaxyBounds = $state({ width: 1000, height: 1000 });

	let selectedSystem = $state<string | null>(null);
	let zoom = $state(1);
	let filters = $state({
		gates: false,
		inhabited: false,
		hazards: false
	});

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

			// Initialize player state if not already done
			if (!playerState.playerUuid) {
				await playerState.initialize(data.galaxyUuid);
			}

			// If player needs to be created, redirect to play page
			if (playerState.needsCreation) {
				goto(`${base}/galaxies/${data.galaxyUuid}/play`);
				return;
			}

			// Load map data
			await loadMapData();
		});

		return () => {
			// Don't reset player state - it's shared with in-system view
		};
	});

	async function loadMapData() {
		isLoadingMap = true;
		mapError = null;

		try {
			const response = await api.galaxies.getMap(data.galaxyUuid);

			if (response.success && response.data) {
				const mapData = response.data as {
					systems?: MapSystemData[];
					galaxy_bounds?: { width: number; height: number };
					pois?: Array<{
						uuid: string;
						name: string;
						type: string;
						x: number;
						y: number;
					}>;
					width?: number;
					height?: number;
				};

				// Handle different API response formats
				if (mapData.systems) {
					systems = mapData.systems;
				} else if (mapData.pois) {
					// Convert POIs to MapSystemData format
					systems = mapData.pois.map((poi) => ({
						uuid: poi.uuid,
						name: poi.name,
						type: poi.type,
						position: { x: poi.x, y: poi.y },
						scan_level: 0,
						has_warp_gate: false,
						is_inhabited: false,
						is_hazardous: false
					}));
				}

				if (mapData.galaxy_bounds) {
					galaxyBounds = mapData.galaxy_bounds;
				} else if (mapData.width && mapData.height) {
					galaxyBounds = { width: mapData.width, height: mapData.height };
				}

				// Load scan levels for visible systems
				if (playerState.playerUuid && systems.length > 0) {
					const uuids = systems.map((s) => s.uuid);
					await playerState.loadBulkScanLevels(uuids);
				}
			} else {
				mapError = response.error?.message || 'Failed to load map data';
			}
		} catch (err) {
			mapError = err instanceof Error ? err.message : 'Unknown error loading map';
		} finally {
			isLoadingMap = false;
		}
	}

	function handleSystemClick(uuid: string) {
		if (uuid !== selectedSystem) {
			tutorialState.completeAction('click_nearby_star');
		}
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
			// Travel logic would go here
		}
	}

	function closeMap() {
		goto(`${base}/galaxies/${data.galaxyUuid}/play`);
	}

<<<<<<< Updated upstream
	// Player position for map centering
	const playerPosition = $derived(() => {
		const currentUuid = playerState.currentSystem?.uuid;
		const currentSystem = systems.find((s) => s.uuid === currentUuid);
		return {
			x: currentSystem?.position.x ?? galaxyBounds.width / 2,
			y: currentSystem?.position.y ?? galaxyBounds.height / 2,
			systemUuid: currentUuid ?? ''
		};
	});
=======
	// Auto-navigate back to play when tutorial advances past map steps
	$effect(() => {
		if (tutorialState.active && tutorialState.currentStep?.page === 'play') {
			goto(`${base}/galaxies/${data.galaxyUuid}/play`);
		}
	});

	async function handleRenameShip(uuid: string, name: string): Promise<boolean> {
		const result = await playerState.renameShip(uuid, name);
		return !!result;
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
>>>>>>> Stashed changes
</script>

<svelte:head>
	<title>Star Map - Space Wars 3002</title>
</svelte:head>

<div class="map-page" data-tutorial="map-container">
	<header class="map-header">
		<div class="header-title">
			<span class="title-text">Star Map</span>
		</div>
		<button class="btn-close" onclick={closeMap} aria-label="Close map"> &#x2715; </button>
	</header>

	{#if isLoadingMap || playerState.isLoading}
		<div class="loading-container">
			<SpaceLoader message="Loading star map..." />
		</div>
	{:else if mapError || playerState.error}
		<div class="error-container">
			<p class="error-message">{mapError || playerState.error}</p>
			<button class="btn-retry" onclick={loadMapData}> Retry </button>
		</div>
<<<<<<< Updated upstream
=======
	{:else if mapView === 'sectors'}
		<main class="map-main">
			<div class="map-area" data-tutorial="map-area">
				<SectorMap
					sectors={sectorViewEntries}
					knownSystems={knownSystems}
					knownLanes={knownLanes}
					gridSize={sectorGridSize}
					playerSectorUuid={apiPlayerSectorUuid ?? playerState.currentSector?.uuid}
					playerSystemUuid={playerState.currentSystem?.uuid}
					onSectorClick={handleSectorClick}
					onStarHover={(star) => hoveredMapStar = star}
					onStarSelect={(star) => { selectedMapStar = star; if (star) tutorialState.completeAction('click_nearby_star'); }}
				/>
			</div>

			<div class="map-sidebar">
				<PlayerStats
					hasShip={!!playerState.activeShip}
					hull={playerState.ship?.hull}
					shield={playerState.ship?.shield}
					fuel={playerState.ship?.fuel}
					cargo={playerState.ship ? { used: playerState.ship.cargo_used, capacity: playerState.ship.cargo_capacity } : undefined}
					compact={true}
					shipName={playerState.activeShip?.name}
					shipUuid={playerState.activeShip?.uuid}
					onRename={handleRenameShip}
				/>

				<!-- System info panel -->
				<div class="system-info-panel" data-tutorial="system-info-panel">
					{#if displayMapStar}
						<div class="sip-header">
							<span class="sip-name" style="color: {starColor(displayMapStar)}">{displayMapStar.name ?? 'Unknown System'}</span>
							{#if displayMapStar.uuid === playerState.currentSystem?.uuid}
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

						<!-- Travel info section -->
						{#if selectedMapStar && displayMapStar.uuid !== playerMapPos.systemUuid}
							<div class="sip-travel">
								<span class="sip-travel-title">TRAVEL</span>
								{#if fuelCostLoading}
									<div class="sip-row">
										<span class="sip-label">Distance</span>
										<span class="sip-value" style="color: #718096">calculating...</span>
									</div>
								{:else if fuelCostData}
									<div class="sip-row">
										<span class="sip-label">Distance</span>
										<span class="sip-value" style="color: #6bb8cc">{fuelCostData.distance.toFixed(1)} LY</span>
									</div>
									<div class="sip-row">
										<span class="sip-label">Fuel Cost</span>
										<span class="sip-value" style="color: #f6ad55">{fuelCostData.cheapest_fuel_cost ?? 'N/A'}</span>
									</div>
									<!-- TODO(human): Implement dual-option fuel cost breakdown showing warp_gate vs direct_jump details -->
									{#if fuelCostData.cheapest_option}
										<div class="sip-row">
											<span class="sip-label">Via</span>
											<span class="sip-value" style="color: #718096">{fuelCostData.cheapest_option === 'warp_gate' ? 'Warp Gate' : 'Direct Jump'}</span>
										</div>
									{/if}
									<div class="sip-row">
										<span class="sip-label">Can Reach</span>
										<span class="sip-value" style="color: {fuelCostData.can_reach ? '#48bb78' : '#fc8181'}">
											{fuelCostData.can_reach ? 'Yes' : 'No'} ({fuelCostData.ship.current_fuel} fuel)
										</span>
									</div>
								{:else}
									<div class="sip-row">
										<span class="sip-label">Fuel Cost</span>
										<span class="sip-value" style="color: #718096">unavailable</span>
									</div>
								{/if}
							</div>
						{/if}
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
>>>>>>> Stashed changes
	{:else}
		<main class="map-main">
			<div class="map-area" data-tutorial="map-area">
				<StarMap
					{systems}
					playerPosition={playerPosition()}
					{galaxyBounds}
					{selectedSystem}
					{zoom}
					{filters}
					scanLevels={playerState.scanLevels}
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
</style>
