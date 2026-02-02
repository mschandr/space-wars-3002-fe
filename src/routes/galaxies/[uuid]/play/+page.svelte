<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { auth } from '$lib/auth.svelte';
	import { playerState } from '$lib/stores/playerState.svelte';
	import type { SystemDataResponse } from '$lib/api';
	import PlayerStats from '$lib/components/game/PlayerStats.svelte';
	import SystemMenu from '$lib/components/game/SystemMenu.svelte';
	import ActionPanel from '$lib/components/game/ActionPanel.svelte';
	import SpaceLoader from '$lib/components/SpaceLoader.svelte';

	interface Props {
		data: { galaxyUuid: string };
	}

	let { data }: Props = $props();

	let activeMenuItem = $state<'planets' | 'trading' | 'salvage' | 'warp' | null>(null);
	let systemData = $state<SystemDataResponse | null>(null);

	// Player creation form state
	let callSignInput = $state('');
	let isCreatingPlayer = $state(false);
	let createError = $state('');

	onMount(() => {
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
		if (!playerState.currentSystem) return;

		const loadedData = await playerState.loadSystemData();
		if (loadedData) {
			systemData = loadedData;
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
			loadCurrentSystemData();
		} else {
			createError = playerState.error || 'Failed to join galaxy';
		}
	}

	function handleMenuSelect(item: 'planets' | 'trading' | 'salvage' | 'warp') {
		activeMenuItem = item;
	}

	function handleAction(action: string, targetUuid?: string) {
		console.log('Action:', action, 'Target:', targetUuid);
		// Handle various actions - to be implemented
	}

	function navigateToMap() {
		goto(`${base}/galaxies/${data.galaxyUuid}/play/map`);
	}

	function navigateBack() {
		goto(`${base}/galaxies`);
	}

	// Default ship stats for loading state
	const defaultShip = {
		hull: { current: 100, max: 100 },
		shield: { current: 50, max: 100, grade: 'F2.36' },
		fuel: { current: 80, max: 100 }
	};
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
			<a href="{base}/galaxies" class="link-secondary">Change galaxy</a>
		</div>
		<div class="header-right">
			{#if playerState.playerUuid}
				<button class="btn-map" onclick={navigateToMap}> Star Map </button>
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
							<button type="submit" class="btn btn-submit" disabled={isCreatingPlayer}>
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
		<main class="game-main">
			<SystemMenu
				systemName={playerState.currentSystem?.name ?? 'Unknown System'}
				systemType={playerState.currentSystem?.type ?? 'STAR SYSTEM'}
				activeItem={activeMenuItem}
				onSelect={handleMenuSelect}
			/>

			<ActionPanel activeItem={activeMenuItem} {systemData} onAction={handleAction} />

			<PlayerStats
				hull={playerState.ship?.hull ?? defaultShip.hull}
				shield={playerState.ship?.shield ?? defaultShip.shield}
				fuel={playerState.ship?.fuel ?? defaultShip.fuel}
				distance={45.2}
				cooldown={0}
				collision={false}
				clamp={false}
			/>
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

	.btn-map:hover {
		background: linear-gradient(to bottom, #718096, #4a5568);
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
