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
</script>

<svelte:head>
	<title>Star Map - Space Wars 3002</title>
</svelte:head>

<div class="map-page">
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
	{:else}
		<main class="map-main">
			<div class="map-area">
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
