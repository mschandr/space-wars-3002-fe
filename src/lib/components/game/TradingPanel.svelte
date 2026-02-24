<script lang="ts">
	import { playerState } from '$lib/stores/playerState.svelte';
<<<<<<< Updated upstream
=======

	import type { MarketEvent } from '$lib/api';
	import { recordPrices, getHistory } from '$lib/priceHistory';
>>>>>>> Stashed changes
	import MineralRow from './MineralRow.svelte';
	import CargoManifest from './CargoManifest.svelte';
	import PriceDisplay from './PriceDisplay.svelte';

	interface Props {
		hubUuid: string;
		hubName?: string;
	}

	let { hubUuid, hubName = 'Trading Hub' }: Props = $props();

	let isLoading = $state(true);
	let error = $state<string | null>(null);

	// Load data on mount
	$effect(() => {
		loadTradingData();
	});

	async function loadTradingData() {
		isLoading = true;
		error = null;
		try {
			await Promise.all([playerState.loadTradingHubInventory(hubUuid), playerState.loadCargo()]);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load trading data';
		} finally {
			isLoading = false;
		}
	}

	async function handleBuy(mineralUuid: string, quantity: number) {
		await playerState.buyMineral(hubUuid, mineralUuid, quantity);
	}

	async function handleSell(mineralUuid: string, quantity: number) {
		await playerState.sellMineral(hubUuid, mineralUuid, quantity);
	}

	const availableSpace = $derived(playerState.cargoCapacity - playerState.cargoUsed);
</script>

<div class="trading-panel">
	<div class="panel-header">
		<div class="header-title">
			<span class="hub-icon">&#x2692;</span>
			<span class="hub-name">{hubName}</span>
		</div>
		<div class="player-credits">
			<span class="credits-label">Credits:</span>
			<PriceDisplay price={playerState.credits} size="lg" />
		</div>
	</div>

	{#if isLoading}
		<div class="loading-state">
			<div class="loading-spinner"></div>
			<span>Loading inventory...</span>
		</div>
	{:else if error}
		<div class="error-state">
			<span class="error-icon">!</span>
			<span class="error-text">{error}</span>
			<button type="button" onclick={loadTradingData} class="retry-btn"> Retry </button>
		</div>
	{:else}
		<div class="trading-content">
			<div class="inventory-section">
				<div class="section-header">
					<span class="section-title">AVAILABLE GOODS</span>
					<span class="section-count">{playerState.tradingHubInventory.length} items</span>
				</div>

				{#if playerState.tradingHubInventory.length > 0}
					<div class="inventory-list">
						{#each playerState.tradingHubInventory as item (item.mineral.uuid)}
							<MineralRow
								{item}
								playerCredits={playerState.credits}
								cargoSpace={availableSpace}
								cargoItem={playerState.getCargoItem(item.mineral.uuid)}
								onBuy={handleBuy}
								onSell={handleSell}
							/>
						{/each}
					</div>
				{:else}
					<div class="empty-inventory">
						<span>No goods available for trade</span>
					</div>
				{/if}
			</div>

			<div class="cargo-section">
				<CargoManifest
					cargo={playerState.cargo}
					capacity={playerState.cargoCapacity}
					used={playerState.cargoUsed}
				/>
			</div>
		</div>
	{/if}
</div>

<style>
	.trading-panel {
		background: rgba(26, 32, 44, 0.95);
		border: 1px solid #4a5568;
		border-radius: 8px;
		padding: 1rem;
		height: 100%;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid #4a5568;
		margin-bottom: 1rem;
	}

	.header-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.hub-icon {
		font-size: 1.25rem;
		color: #f6ad55;
	}

	.hub-name {
		font-size: 1.1rem;
		font-weight: 600;
		color: #e2e8f0;
	}

	.player-credits {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.credits-label {
		font-size: 0.75rem;
		color: #718096;
		text-transform: uppercase;
	}

	.loading-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		color: #a0aec0;
	}

	.loading-spinner {
		width: 32px;
		height: 32px;
		border: 3px solid #4a5568;
		border-top-color: #4299e1;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
	}

	.error-icon {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: rgba(239, 68, 68, 0.2);
		color: #fc8181;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		font-weight: bold;
	}

	.error-text {
		color: #fc8181;
		font-size: 0.9rem;
	}

	.retry-btn {
		padding: 0.5rem 1rem;
		background: rgba(66, 153, 225, 0.2);
		border: 1px solid #4299e1;
		border-radius: 4px;
		color: #63b3ed;
		cursor: pointer;
		transition: all 0.15s;
	}

	.retry-btn:hover {
		background: rgba(66, 153, 225, 0.3);
	}

	.trading-content {
		flex: 1;
		display: grid;
		grid-template-columns: 1fr 280px;
		gap: 1rem;
		overflow: hidden;
	}

	.inventory-section {
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.section-title {
		font-size: 0.7rem;
		font-weight: 600;
		color: #718096;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.section-count {
		font-size: 0.7rem;
		color: #a0aec0;
	}

	.inventory-list {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		overflow-y: auto;
		padding-right: 0.5rem;
	}

	.inventory-list::-webkit-scrollbar {
		width: 6px;
	}

	.inventory-list::-webkit-scrollbar-track {
		background: #2d3748;
		border-radius: 3px;
	}

	.inventory-list::-webkit-scrollbar-thumb {
		background: #4a5568;
		border-radius: 3px;
	}

	.inventory-list::-webkit-scrollbar-thumb:hover {
		background: #718096;
	}

	.empty-inventory {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #718096;
		font-style: italic;
	}

	.cargo-section {
		display: flex;
		flex-direction: column;
	}

	@media (max-width: 768px) {
		.trading-content {
			grid-template-columns: 1fr;
			grid-template-rows: 1fr auto;
		}

		.cargo-section {
			order: -1;
		}
	}
</style>
