<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { auth } from '$lib/auth.svelte';
	import { playerState } from '$lib/stores/playerState.svelte';
	import PlayerStats from '$lib/components/game/PlayerStats.svelte';
	import SystemMenu from '$lib/components/game/SystemMenu.svelte';
	import ActionPanel from '$lib/components/game/ActionPanel.svelte';
	import SectorGrid from '$lib/components/game/SectorGrid.svelte';
	import CargoManifest from '$lib/components/game/CargoManifest.svelte';
	import SpaceLoader from '$lib/components/SpaceLoader.svelte';
	import { tutorialState } from '$lib/stores/tutorialState.svelte';

	// Menu item types matching SystemMenu
	type MenuItemId =
		| 'planets'
		| 'warp'
		| 'manual_jump'
		| 'market_news'
		| 'trading_hub'
		| 'shipyard'
		| 'salvage'
		| 'cartographer'
		| 'bar'
		| 'repair_shop'
		| 'refuel'
		| 'black_market';

	interface Props {
		data: { galaxyUuid: string };
	}

	let { data }: Props = $props();

	let activeMenuItem = $state<MenuItemId | null>(null);

	// Get available services from facilities (preferred) or location details (fallback)
	// Merges hub sub-services with top-level facility categories (bars, trading stations, etc.)
	const availableServices = $derived.by(() => {
		const facilities = playerState.facilities;
		const fac = facilities?.facilities;
		if (!fac) {
			return playerState.locationDetails?.has?.services ?? [];
		}

		const services = new Set<string>();

		// Hub sub-services (shipyard, salvage, cartography, etc.)
		const hubs = fac.trading_hubs;
		if (hubs && hubs.length > 0) {
			for (const hub of hubs) {
				if (hub.services) {
					for (const s of hub.services) services.add(s);
				}
			}
		}

		// Top-level facility categories not covered by hub sub-services
		if (fac.bars && fac.bars.length > 0) services.add('bar');
		if (fac.trading_stations && fac.trading_stations.length > 0) services.add('trading_station');

		if (services.size > 0) return [...services];

		return playerState.locationDetails?.has?.services ?? [];
	});

	// Player creation form state
	let callSignInput = $state('');
	let isCreatingPlayer = $state(false);
	let createError = $state('');

	onMount(() => {
		tutorialState.resume();

		const token = localStorage.getItem('auth_token');
		if (!token) {
			goto(`${base}/login`);
			return;
		}

		auth.initialize().then(() => {
			if (!auth.isAuthenticated) {
				goto(`${base}/login`);
				return;
			}
			playerState.initialize(data.galaxyUuid).then(() => {
				if (playerState.playerUuid) {
					loadCurrentSystemData();
				}
			});
		});

		return () => {
			playerState.reset();
		};
	});

	async function loadCurrentSystemData() {
		if (!playerState.currentSystem) {
			console.log('[PlayPage] No current system, skipping location load');
			return;
		}

		console.log('[PlayPage] Loading location details for:', playerState.currentSystem.uuid);

		// Load location details and facilities in parallel
		const [locationData, facilitiesData] = await Promise.all([
			playerState.loadLocationDetails(),
			playerState.loadFacilities()
		]);

		if (locationData) {
			console.log('[PlayPage] Location details loaded:', locationData);
		} else {
			console.log('[PlayPage] Failed to load location details');
		}

		if (facilitiesData) {
			console.log('[PlayPage] Facilities loaded:', facilitiesData);
		} else {
			console.log('[PlayPage] Failed to load facilities (or none available)');
		}
	}

	async function handleCreatePlayer(e: Event) {
		e.preventDefault();
		createError = '';

		if (!callSignInput.trim()) {
			createError = 'Please enter a call sign';
			return;
		}

		if (callSignInput.trim().length < 3) {
			createError = 'Call sign must be at least 3 characters';
			return;
		}

		if (callSignInput.trim().length > 20) {
			createError = 'Call sign must be 20 characters or less';
			return;
		}

		isCreatingPlayer = true;
		const success = await playerState.joinGalaxy(callSignInput.trim());
		isCreatingPlayer = false;

		if (success) {
			tutorialState.completeAction('submit_callsign');
			loadCurrentSystemData();
		} else {
			createError = playerState.error || 'Failed to join galaxy';
		}
	}

	function handleMenuSelect(item: MenuItemId) {
		activeMenuItem = item;
		// Notify tutorial — menu item IDs map to step completion
		tutorialState.completeAction(item);
	}

	function handleAction(action: string, targetUuid?: string) {
		console.log('Action:', action, 'Target:', targetUuid);
		// Handle various actions - to be implemented
	}

	async function handleTravelComplete() {
		console.log('[PlayPage] Travel complete, reloading location data');
		await loadCurrentSystemData();
		tutorialState.completeAction('warp_to_nearest');
	}

	function navigateToMap() {
		// If tutorial is behind the star map step, skip forward so it doesn't get stuck
		tutorialState.skipToStep('click_star_map');
		tutorialState.completeAction('click_star_map');
		goto(`${base}/galaxies/${data.galaxyUuid}/play/map`);
	}

	function navigateBack() {
		goto(`${base}/galaxies`);
	}

	async function handleRenameShip(uuid: string, name: string): Promise<boolean> {
		const result = await playerState.renameShip(uuid, name);
		return !!result;
	}
</script>

<svelte:head>
	<title>{playerState.currentSystem?.name ?? 'Enter Galaxy'} - Space Wars 3002</title>
</svelte:head>

<div class="game-container">
	<header class="game-header">
		<div class="header-left">
			<div class="header-title">
				<span class="title-icon">&#9733;</span>
				<span>SPACE WARS 3002</span>
			</div>
			<div class="galaxy-info">
				{#if playerState.galaxyName}
					<span class="galaxy-name">{playerState.galaxyName}</span>
					<span class="separator">|</span>
				{/if}
				{#if !tutorialState.active || tutorialState.currentStep?.page !== 'play' || tutorialState.currentStep?.id === 'tutorial_complete'}
					<a href="{base}/galaxies" class="link-secondary">Change galaxy</a>
				{/if}
			</div>
		</div>
		<div class="header-right">
			{#if playerState.playerUuid}
				<button
					class="btn-map"
					data-tutorial="btn-star-map"
					onclick={navigateToMap}
					disabled={tutorialState.active && (tutorialState.currentStep?.id === 'enter_callsign' || tutorialState.currentStep?.id === 'submit_callsign')}
				>
					Star Map
				</button>
			{/if}
		</div>
	</header>

	{#if playerState.isLoading}
		<div class="loading-container">
			<SpaceLoader message="Initializing ship systems..." />
		</div>
	{:else if playerState.needsCreation}
		<!-- Player Creation Modal -->
		<div class="creation-container">
			<div class="creation-modal">
				<div class="modal-header">
					<span class="title-icon">&#9733;</span>
					<span>Create Your Pilot</span>
				</div>
				<div class="modal-body">
					<p class="intro-text">
						Welcome, Commander. You're about to enter a new galaxy. Choose your call sign wisely -
						it will be how you're known across the stars.
					</p>

					<form onsubmit={handleCreatePlayer}>
						{#if createError}
							<div class="error-banner">{createError}</div>
						{/if}

						<div class="form-group">
							<label for="call-sign">Call Sign</label>
							<input
								type="text"
								id="call-sign"
								data-tutorial="callsign-input"
								bind:value={callSignInput}
								placeholder="Enter your call sign"
								minlength="3"
								maxlength="20"
								disabled={isCreatingPlayer}
							/>
							<span class="input-hint">3-20 characters</span>
						</div>

						<div class="modal-actions">
							<button type="button" class="btn btn-cancel" onclick={navigateBack}>
								Back to Galaxies
							</button>
							<button type="submit" class="btn btn-submit" data-tutorial="callsign-submit" disabled={isCreatingPlayer}>
								{#if isCreatingPlayer}
									Creating...
								{:else}
									Launch
								{/if}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	{:else if playerState.error}
		<div class="error-container">
			<p class="error-message">{playerState.error}</p>
			<button class="btn-retry" onclick={() => playerState.initialize(data.galaxyUuid)}>
				Retry
			</button>
		</div>
	{:else}
		<main class="game-main" data-tutorial="game-main">
			<div class="left-panel">
				<SystemMenu
					systemName={playerState.currentSystem?.name ?? 'Unknown System'}
					systemType={playerState.currentSystem?.type ?? 'STAR SYSTEM'}
					sector={playerState.currentSector ?? playerState.locationDetails?.sector}
					availableServices={availableServices}
					activeItem={activeMenuItem}
					onSelect={handleMenuSelect}
					allowedItem={tutorialState.active && tutorialState.currentStep?.page === 'play' ? tutorialState.allowedMenuItem : null}
				/>

				<SectorGrid
					sector={playerState.currentSector ?? playerState.locationDetails?.sector ?? null}
					gridSize={playerState.galaxyGridSize}
					currentSystemUuid={playerState.currentSystem?.uuid}
					onNavigateToMap={navigateToMap}
				/>
			</div>

			<ActionPanel activeItem={activeMenuItem} onAction={handleAction} onTravelComplete={handleTravelComplete} />

			<div class="right-panel">
				<PlayerStats
					hasShip={!!playerState.activeShip}
					hull={playerState.ship?.hull}
					shield={playerState.ship?.shield}
					fuel={playerState.ship?.fuel}
					cargo={playerState.ship ? { used: playerState.ship.cargo_used, capacity: playerState.ship.cargo_capacity } : undefined}
					weapons={playerState.ship?.weapons}
					sensors={playerState.ship?.sensors}
					warpDrive={playerState.ship?.warpDrive}
					shipClass={playerState.ship?.shipClass?.class}
					shipStatus={playerState.ship?.status}
					shipName={playerState.activeShip?.name}
					shipUuid={playerState.activeShip?.uuid}
					onRename={handleRenameShip}
					credits={playerState.credits}
					level={playerState.level}
					experience={playerState.experience}
				/>

				<CargoManifest
					cargo={playerState.cargo}
					capacity={playerState.cargoCapacity}
					used={playerState.cargoUsed}
				/>
			</div>
		</main>
	{/if}

</div>

<style>
	.game-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.game-header {
		background: linear-gradient(to bottom, #2d3748, #1a202c);
		border-bottom: 1px solid #4a5568;
		padding: 0.5rem 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.header-left,
	.header-right {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.header-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #e2e8f0;
		font-weight: 600;
		font-size: 0.9rem;
	}

	.title-icon {
		color: #f6ad55;
	}

	.galaxy-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.galaxy-name {
		color: #f6ad55;
		font-size: 0.85rem;
		font-weight: 500;
	}

	.separator {
		color: #4a5568;
		font-size: 0.75rem;
	}

	.link-secondary {
		color: #718096;
		font-size: 0.75rem;
		text-decoration: none;
		transition: color 0.15s;
	}

	.link-secondary:hover {
		color: #a0aec0;
		text-decoration: underline;
	}

	.btn-map {
		background: linear-gradient(to bottom, #4a5568, #2d3748);
		border: 1px solid #1a202c;
		color: #e2e8f0;
		padding: 0.375rem 0.75rem;
		border-radius: 4px;
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-map:hover:not(:disabled) {
		background: linear-gradient(to bottom, #718096, #4a5568);
	}

	.btn-map:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.loading-container,
	.error-container,
	.creation-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 2rem;
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

	.game-main {
		flex: 1;
		display: flex;
		gap: 1rem;
		padding: 1rem;
		max-width: 1400px;
		margin: 0 auto;
		width: 100%;
	}

	.left-panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 220px;
		flex-shrink: 0;
	}

	.right-panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 240px;
		flex-shrink: 0;
	}

	/* Player Creation Modal */
	.creation-modal {
		width: 100%;
		max-width: 450px;
		border-radius: 8px;
		overflow: hidden;
		box-shadow:
			0 0 0 1px rgba(100, 120, 140, 0.5),
			0 4px 20px rgba(0, 0, 0, 0.5);
	}

	.modal-header {
		background: linear-gradient(to bottom, #4a5568, #2d3748);
		padding: 0.75rem 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #e2e8f0;
		font-weight: 500;
		font-size: 0.9rem;
		border-bottom: 1px solid #1a202c;
	}

	.modal-body {
		background: rgba(26, 32, 44, 0.98);
		padding: 1.5rem;
	}

	.intro-text {
		color: #a0aec0;
		font-size: 0.9rem;
		line-height: 1.5;
		margin: 0 0 1.5rem 0;
	}

	.error-banner {
		background: rgba(239, 68, 68, 0.2);
		border: 1px solid rgb(239, 68, 68);
		color: rgb(252, 165, 165);
		padding: 0.75rem;
		border-radius: 4px;
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		font-size: 0.85rem;
		font-weight: 500;
		color: #a0aec0;
		margin-bottom: 0.375rem;
	}

	.form-group input {
		width: 100%;
		background: #1a202c;
		border: 1px solid #4a5568;
		border-radius: 4px;
		padding: 0.625rem 0.75rem;
		color: #e2e8f0;
		font-size: 0.9rem;
		transition: border-color 0.2s;
	}

	.form-group input::placeholder {
		color: #718096;
	}

	.form-group input:focus {
		outline: none;
		border-color: #63b3ed;
	}

	.form-group input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.input-hint {
		display: block;
		font-size: 0.75rem;
		color: #718096;
		margin-top: 0.25rem;
	}

	.modal-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}

	.btn {
		flex: 1;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
	}

	.btn-cancel {
		background: linear-gradient(to bottom, #4a5568, #2d3748);
		color: #e2e8f0;
		border: 1px solid #1a202c;
	}

	.btn-cancel:hover {
		background: linear-gradient(to bottom, #718096, #4a5568);
	}

	.btn-submit {
		background: linear-gradient(to bottom, #48bb78, #38a169);
		color: white;
		border: 1px solid #276749;
	}

	.btn-submit:hover:not(:disabled) {
		background: linear-gradient(to bottom, #68d391, #48bb78);
	}

	.btn-submit:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
