<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import {
		api,
		type GalaxySummary,
		type GameMode,
		type SizeTier,
		type GalaxyCreationStatistics
	} from '$lib/api';
	import { auth } from '$lib/auth.svelte';
	import GalaxyCard from '$lib/components/GalaxyCard.svelte';
	import SpaceLoader from '$lib/components/SpaceLoader.svelte';
	import { getCachedGalaxyList, cacheGalaxyList } from '$lib/galaxyCache';
	import { tutorialState } from '$lib/stores/tutorialState.svelte';

	let myGames = $state<GalaxySummary[]>([]);
	let openGames = $state<GalaxySummary[]>([]);
	let isLoading = $state(true);
	let error = $state('');

	// Create galaxy modal state
	let showCreateModal = $state(false);
	let createForm = $state({
		size_tier: 'small' as SizeTier,
		game_mode: 'single_player' as GameMode,
		name: ''
	});

	let isCreating = $state(false);
	let createError = $state('');
	let creationStats = $state<GalaxyCreationStatistics | null>(null);
	let creationTime = $state<number | null>(null);

	let refreshInterval = $state<ReturnType<typeof setInterval> | null>(null);
	let consecutiveFailures = 0;

	const gameModes: { id: GameMode; label: string; icon: string; desc: string }[] = [
		{ id: 'multiplayer', label: 'Multiplayer', icon: '\u{1F465}', desc: 'Open to all players' },
		{ id: 'single_player', label: 'Solo', icon: '\u{1F464}', desc: 'Private game' }
	];

	// Size tier options with graphics
	const tierOptions: { value: SizeTier; label: string; icon: string }[] = [
		{ value: 'small', label: 'Small', icon: '\u{2B50}' },
		{ value: 'medium', label: 'Medium', icon: '\u{1F31F}' },
		{ value: 'large', label: 'Large', icon: '\u{1F4AB}' }
	];

	// Track number of games before creation to detect first galaxy
	let gamesBeforeCreate = $state<number | null>(null);
	let shouldStartTutorial = $state(false);

	const isTutorialMode = $derived(
		tutorialState.active && tutorialState.currentStep?.page === 'galaxies'
	);

	onMount(() => {
		tutorialState.resume();

		// Show cached data immediately (no loading state)
		const cached = getCachedGalaxyList();
		if (cached && (cached.my_games.length > 0 || cached.open_games.length > 0)) {
			myGames = cached.my_games;
			openGames = cached.open_games;
			isLoading = false;
		}

		// Start auth check and galaxy load in parallel
		(async () => {
			// Quick check: if no token, redirect immediately
			const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
			if (!token) {
				goto(`${base}/login`);
				return;
			}

			// Start loading galaxies immediately (API will include auth token)
			const galaxyPromise = loadGalaxies();

			// Initialize auth in background (validates token)
			auth.initialize().then(() => {
				if (!auth.isAuthenticated) {
					goto(`${base}/login`);
				}
			});

			await galaxyPromise;

			// Refresh galaxy list every 10 seconds (lightweight endpoint)
			refreshInterval = setInterval(refreshGalaxyList, 10000);
		})();

		return () => {
			if (refreshInterval) {
				clearInterval(refreshInterval);
			}
		};
	});

	async function loadGalaxies() {
		// Only show loading if we have no data yet
		if (myGames.length === 0 && openGames.length === 0) {
			isLoading = true;
		}
		error = '';

		const response = await api.galaxies.list();

		if (response.success && response.data) {
			myGames = response.data.my_games;
			openGames = response.data.open_games;
			cacheGalaxyList(response.data);
		} else if (myGames.length === 0 && openGames.length === 0) {
			error = response.error?.message || 'Failed to load galaxies';
		}

		isLoading = false;
	}

	async function refreshGalaxyList() {
		const response = await api.galaxies.list();
		if (response.success && response.data) {
			myGames = response.data.my_games;
			openGames = response.data.open_games;
			cacheGalaxyList(response.data);
			// Reset failures on success — restore fast polling if we slowed down
			if (consecutiveFailures >= 3) {
				consecutiveFailures = 0;
				switchPollingInterval(10000);
			}
			consecutiveFailures = 0;
		} else {
			consecutiveFailures++;
			if (consecutiveFailures >= 3) {
				switchPollingInterval(60000);
			}
		}
	}

	function switchPollingInterval(ms: number) {
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
		refreshInterval = setInterval(refreshGalaxyList, ms);
	}

	function handleEnterGalaxy(galaxy: GalaxySummary) {
		tutorialState.completeAction('enter_game');
		goto(`${base}/galaxies/${galaxy.uuid}/play`);
	}

	function handleViewMap(galaxy: GalaxySummary) {
		goto(`${base}/galaxies/${galaxy.uuid}/play/map`);
	}

	function openCreateModal() {
		createForm = {
			size_tier: 'small',
			game_mode: 'single_player',
			name: ''
		};
		createError = '';
		creationStats = null;
		creationTime = null;
		showCreateModal = true;
	}

	function closeCreateModal() {
		showCreateModal = false;
		isCreating = false;
		if (shouldStartTutorial) {
			shouldStartTutorial = false;
			tutorialState.start();
		}
	}

	async function handleCreateGalaxy(e: Event) {
		e.preventDefault();
		createError = '';
		creationStats = null;
		creationTime = null;
		isCreating = true;
		gamesBeforeCreate = myGames.length;

		const payload = {
			size_tier: createForm.size_tier,
			game_mode: createForm.game_mode,
			...(createForm.name && { name: createForm.name })
		};

		console.log('[CreateGalaxy] Submitting payload:', payload);

		const response = await api.galaxies.create(payload);

		console.log('[CreateGalaxy] Response:', response);

		if (response.success && response.data) {
			// Show creation stats
			creationStats = response.data.statistics;
			creationTime = response.data.metrics.total_elapsed_seconds;
			isCreating = false;

			// Refresh galaxy list
			await loadGalaxies();

			// Flag tutorial to start when the modal closes (so galaxy card is visible)
			if (!tutorialState.isCompleted() && gamesBeforeCreate === 0) {
				shouldStartTutorial = true;
			}
		} else {
			createError = response.error?.message ?? response.message ?? 'Failed to create galaxy';
			console.log('[CreateGalaxy] Error details:', response.error);
			isCreating = false;
		}
	}

	function handleLogout() {
		auth.logout();
		goto(`${base}/login`);
	}
</script>

<svelte:head>
	<title>Select Galaxy - Space Wars 3002</title>
</svelte:head>

<div class="page-container">
	<header class="header">
		<div class="header-title">
			<span class="title-icon">&#9733;</span>
			<span>SPACE WARS 3002</span>
		</div>
		<div class="header-actions">
			{#if tutorialState.isCompleted() && !tutorialState.active}
				<button class="btn-tutorial" onclick={() => tutorialState.restart()}>Restart Tutorial</button>
			{/if}
			<span class="user-name">{auth.user?.name}</span>
			<button class="btn-logout" onclick={handleLogout}>Logout</button>
		</div>
	</header>

	<main class="main-content">
		<div class="page-header">
			<h1>Select Your Galaxy</h1>
			<button class="btn-create" onclick={openCreateModal}>+ Create Galaxy</button>
		</div>

		{#if isLoading}
			<div class="loading">Loading galaxies...</div>
		{:else if error}
			<div class="error-message">{error}</div>
		{:else if myGames.length === 0 && openGames.length === 0}
			<div class="empty-state">
				<p>No galaxies available.</p>
				<button class="btn-create-large" onclick={openCreateModal}>Create Your First Galaxy</button>
			</div>
		{:else}
			{#if myGames.length > 0}
				<section class="galaxy-section">
					<h2 class="section-header">My Games</h2>
					<div class="galaxy-grid">
						{#each myGames as galaxy (galaxy.uuid)}
							<GalaxyCard {galaxy} onEnter={handleEnterGalaxy} onViewMap={handleViewMap} tutorialMode={isTutorialMode} />
						{/each}
					</div>
				</section>
			{/if}

			{#if openGames.length > 0}
				<section class="galaxy-section">
					<h2 class="section-header">Open Games</h2>
					<div class="galaxy-grid">
						{#each openGames as galaxy (galaxy.uuid)}
							<GalaxyCard {galaxy} onEnter={handleEnterGalaxy} onViewMap={handleViewMap} tutorialMode={isTutorialMode} />
						{/each}
					</div>
				</section>
			{/if}
		{/if}
	</main>
</div>

{#if showCreateModal}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="modal-overlay"
		class:locked={isCreating}
		onclick={() => !isCreating && closeCreateModal()}
		onkeydown={(e) => e.key === 'Escape' && !isCreating && closeCreateModal()}
	>
		<div
			class="modal"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div class="modal-header">
				<span class="title-icon">&#9733;</span>
				<span>Create New Galaxy</span>
			</div>
			<div class="modal-body">
				{#if isCreating}
					<SpaceLoader
						message="Generating galaxy... This may take up to 45 seconds for large galaxies."
					/>
				{:else if creationStats}
					<!-- Creation Success Summary -->
					<div class="creation-summary">
						<div class="summary-header">Galaxy Created Successfully!</div>
						{#if auth.isAdmin}
							<div class="summary-time">Generated in {creationTime?.toFixed(1)}s</div>
							<div class="summary-stats">
								<div class="stat-row">
									<span>Total Stars:</span>
									<span>{creationStats.total_stars.toLocaleString()}</span>
								</div>
								<div class="stat-row">
									<span>Core Systems:</span>
									<span>{creationStats.core_stars.toLocaleString()} (fortified)</span>
								</div>
								<div class="stat-row">
									<span>Frontier Systems:</span>
									<span>{creationStats.outer_stars.toLocaleString()}</span>
								</div>
								<div class="stat-row">
									<span>Warp Gates:</span>
									<span
										>{creationStats.warp_gates.toLocaleString()} ({creationStats.dormant_gates.toLocaleString()}
										dormant)</span
									>
								</div>
								<div class="stat-row">
									<span>Trading Hubs:</span>
									<span>{creationStats.trading_hubs.toLocaleString()}</span>
								</div>
								<div class="stat-row">
									<span>Points of Interest:</span>
									<span>{creationStats.total_pois.toLocaleString()}</span>
								</div>
							</div>
						{:else}
							<p class="summary-text">Your galaxy is ready to explore.</p>
						{/if}
						<div class="modal-actions">
							<button type="button" class="btn btn-submit" onclick={closeCreateModal}>Done</button>
						</div>
					</div>
				{:else}
					<form onsubmit={handleCreateGalaxy}>
						{#if createError}
							<div class="error-banner">{createError}</div>
						{/if}

						<div class="form-group">
							<label for="galaxy-name">Galaxy Name (optional)</label>
							<input
								type="text"
								id="galaxy-name"
								bind:value={createForm.name}
								placeholder="Auto-generated if empty"
							/>
						</div>

						<fieldset class="form-group">
							<legend>Galaxy Size</legend>
							<div class="tier-options">
								{#each tierOptions as tier (tier.value)}
									<label
										class="tier-option"
										class:selected={createForm.size_tier === tier.value}
										title={tier.label}
									>
										<input
											type="radio"
											name="size-tier"
											checked={createForm.size_tier === tier.value}
											onchange={() => (createForm.size_tier = tier.value)}
										/>
										<span class="tier-icon">{tier.icon}</span>
										<span class="tier-tooltip">{tier.label}</span>
									</label>
								{/each}
							</div>
						</fieldset>

						<fieldset class="form-group">
							<legend>Game Mode</legend>
							<div class="game-mode-options">
								{#each gameModes as mode (mode.id)}
									<label class="mode-option" class:selected={createForm.game_mode === mode.id}>
										<input
											type="radio"
											name="game-mode"
											checked={createForm.game_mode === mode.id}
											onchange={() => (createForm.game_mode = mode.id)}
										/>
										<span class="mode-icon">{mode.icon}</span>
										<span class="mode-label">{mode.label}</span>
										<span class="mode-desc">{mode.desc}</span>
									</label>
								{/each}
							</div>
						</fieldset>

						<div class="modal-actions">
							<button type="button" class="btn btn-cancel" onclick={closeCreateModal}>Cancel</button
							>
							<button type="submit" class="btn btn-submit">Create Galaxy</button>
						</div>
					</form>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.page-container {
		min-height: 100vh;
	}

	.header {
		background: linear-gradient(to bottom, #2d3748, #1a202c);
		border-bottom: 1px solid #4a5568;
		padding: 0.75rem 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.header-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #e2e8f0;
		font-weight: 600;
		font-size: 1rem;
	}

	.title-icon {
		color: #f6ad55;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.user-name {
		color: #a0aec0;
		font-size: 0.9rem;
	}

	.btn-tutorial {
		background: transparent;
		border: 1px solid #4a90a4;
		color: #4a90a4;
		padding: 0.375rem 0.75rem;
		border-radius: 4px;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-tutorial:hover {
		background: rgba(74, 144, 164, 0.15);
		color: #63b3ed;
	}

	.btn-logout {
		background: transparent;
		border: 1px solid #4a5568;
		color: #a0aec0;
		padding: 0.375rem 0.75rem;
		border-radius: 4px;
		font-size: 0.8rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-logout:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #e2e8f0;
	}

	.main-content {
		padding: 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.page-header h1 {
		color: #e2e8f0;
		font-size: 1.75rem;
		font-weight: 600;
	}

	.btn-create {
		background: linear-gradient(to bottom, #48bb78, #38a169);
		color: white;
		border: 1px solid #276749;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-create:hover {
		background: linear-gradient(to bottom, #68d391, #48bb78);
	}

	.loading {
		text-align: center;
		color: #a0aec0;
		padding: 3rem;
		font-size: 1.1rem;
	}

	.error-message {
		background: rgba(239, 68, 68, 0.2);
		border: 1px solid rgb(239, 68, 68);
		color: rgb(252, 165, 165);
		padding: 1rem;
		border-radius: 4px;
		text-align: center;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: #a0aec0;
	}

	.empty-state p {
		margin-bottom: 1.5rem;
		font-size: 1.1rem;
	}

	.btn-create-large {
		background: linear-gradient(to bottom, #48bb78, #38a169);
		color: white;
		border: 1px solid #276749;
		padding: 0.75rem 2rem;
		border-radius: 4px;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-create-large:hover {
		background: linear-gradient(to bottom, #68d391, #48bb78);
	}

	.galaxy-section {
		margin-bottom: 2.5rem;
	}

	.section-header {
		color: #a0aec0;
		font-size: 1.1rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #4a5568;
	}

	.galaxy-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	/* Modal styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		padding: 1rem;
	}

	.modal-overlay.locked {
		cursor: not-allowed;
	}

	.modal {
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

	fieldset.form-group {
		border: none;
		padding: 0;
		margin: 0 0 1rem 0;
	}

	fieldset.form-group legend {
		font-size: 0.85rem;
		font-weight: 500;
		color: #a0aec0;
		margin-bottom: 0.375rem;
	}

	.game-mode-options {
		display: flex;
		gap: 0.75rem;
	}

	.mode-option {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.75rem;
		background: #1a202c;
		border: 2px solid #4a5568;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.mode-option:hover {
		border-color: #718096;
	}

	.mode-option.selected {
		border-color: #4299e1;
		background: rgba(66, 153, 225, 0.1);
	}

	.mode-option input[type='radio'] {
		display: none;
	}

	.mode-icon {
		font-size: 1.5rem;
		margin-bottom: 0.25rem;
	}

	.mode-label {
		font-size: 0.9rem;
		font-weight: 600;
		color: #e2e8f0;
	}

	.mode-desc {
		font-size: 0.7rem;
		color: #718096;
	}

	.tier-options {
		display: flex;
		justify-content: center;
		gap: 1.5rem;
	}

	.tier-option {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 80px;
		height: 80px;
		background: #1a202c;
		border: 2px solid #4a5568;
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.2s;
	}

	.tier-option:hover {
		border-color: #718096;
		transform: scale(1.05);
	}

	.tier-option:hover .tier-tooltip {
		opacity: 1;
		visibility: visible;
	}

	.tier-option.selected {
		border-color: #48bb78;
		background: rgba(72, 187, 120, 0.15);
		box-shadow: 0 0 12px rgba(72, 187, 120, 0.4);
	}

	.tier-option input[type='radio'] {
		display: none;
	}

	.tier-icon {
		font-size: 2rem;
	}

	.tier-tooltip {
		position: absolute;
		bottom: -28px;
		left: 50%;
		transform: translateX(-50%);
		background: #2d3748;
		color: #e2e8f0;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		white-space: nowrap;
		opacity: 0;
		visibility: hidden;
		transition:
			opacity 0.2s,
			visibility 0.2s;
	}

	.creation-summary {
		text-align: center;
	}

	.summary-header {
		font-size: 1.25rem;
		font-weight: 600;
		color: #48bb78;
		margin-bottom: 0.5rem;
	}

	.summary-time {
		font-size: 0.85rem;
		color: #718096;
		margin-bottom: 1.5rem;
	}

	.summary-text {
		font-size: 0.9rem;
		color: #a0aec0;
		margin: 1rem 0 1.5rem 0;
	}

	.summary-stats {
		background: rgba(72, 187, 120, 0.1);
		border: 1px solid rgba(72, 187, 120, 0.3);
		border-radius: 6px;
		padding: 1rem;
		text-align: left;
	}

	.stat-row {
		display: flex;
		justify-content: space-between;
		padding: 0.375rem 0;
		font-size: 0.85rem;
		color: #a0aec0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.stat-row:last-child {
		border-bottom: none;
	}

	.stat-row span:last-child {
		color: #e2e8f0;
		font-weight: 500;
	}
</style>
