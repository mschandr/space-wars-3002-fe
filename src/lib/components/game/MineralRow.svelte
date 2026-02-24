<script lang="ts">
	import PriceDisplay from './PriceDisplay.svelte';
	import PriceSparkline from './PriceSparkline.svelte';
	import PriceChart from './PriceChart.svelte';
	import type { HubInventoryItem, CargoItem, MarketEvent } from '$lib/api';
	import type { PriceSnapshot } from '$lib/priceHistory';

	interface Props {
		item: HubInventoryItem;
		playerCredits: number;
		cargoSpace: number;
		cargoItem?: CargoItem;
		activeEvent?: MarketEvent;
		priceHistory?: PriceSnapshot[];
		onBuy: (mineralUuid: string, quantity: number) => Promise<void>;
		onSell: (mineralUuid: string, quantity: number) => Promise<void>;
		onError?: (message: string) => void;
	}

	let { item, playerCredits, cargoSpace, cargoItem, activeEvent, priceHistory, onBuy, onSell, onError }: Props = $props();

	const eventBadgeColors: Record<string, { bg: string; text: string }> = {
		shortage: { bg: 'rgba(239, 68, 68, 0.25)', text: '#fca5a5' },
		surplus: { bg: 'rgba(34, 197, 94, 0.25)', text: '#86efac' },
		boom: { bg: 'rgba(245, 158, 11, 0.25)', text: '#fcd34d' },
		bust: { bg: 'rgba(59, 130, 246, 0.25)', text: '#93c5fd' }
	};

	const eventBadgeText = $derived(() => {
		if (!activeEvent) return '';
		const pct = activeEvent.price_change_percent
			?? (activeEvent.price_multiplier - 1) * 100;
		const sign = pct >= 0 ? '+' : '';
		return `${activeEvent.event_type.toUpperCase()} ${sign}${pct.toFixed(0)}%`;
	});

	let showChart = $state(false);
	let buyQuantity = $state(1);
	let sellQuantity = $state(1);
	let isBuying = $state(false);
	let isSelling = $state(false);
	let error = $state<string | null>(null);

	const maxBuyQuantity = $derived(() => {
		const affordableQuantity = Math.floor(playerCredits / item.sell_price);
		const fitQuantity = cargoSpace;
		const availableQuantity = item.quantity;
		return Math.min(affordableQuantity, fitQuantity, availableQuantity);
	});

	const maxSellQuantity = $derived(cargoItem?.quantity ?? 0);

	const canBuy = $derived(
		buyQuantity > 0 &&
			buyQuantity <= maxBuyQuantity() &&
			playerCredits >= item.sell_price * buyQuantity &&
			cargoSpace >= buyQuantity
	);

	const canSell = $derived(sellQuantity > 0 && sellQuantity <= maxSellQuantity);

	const buyTotal = $derived(item.sell_price * buyQuantity);
	const sellTotal = $derived(item.buy_price * sellQuantity);

	const rarityColors: Record<string, string> = {
		common: 'rarity-common',
		uncommon: 'rarity-uncommon',
		rare: 'rarity-rare',
		very_rare: 'rarity-very-rare',
		legendary: 'rarity-legendary'
	};

	async function handleBuy() {
		if (!canBuy || isBuying) return;
		isBuying = true;
		error = null;
		try {
			await onBuy(item.mineral.uuid, buyQuantity);
			buyQuantity = 1;
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Purchase failed';
			error = msg;
			onError?.(msg);
		} finally {
			isBuying = false;
		}
	}

	async function handleSell() {
		if (!canSell || isSelling) return;
		isSelling = true;
		error = null;
		try {
			await onSell(item.mineral.uuid, sellQuantity);
			sellQuantity = 1;
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Sale failed';
			error = msg;
			onError?.(msg);
		} finally {
			isSelling = false;
		}
	}

	function setMaxBuy() {
		buyQuantity = maxBuyQuantity();
	}

	function setMaxSell() {
		sellQuantity = maxSellQuantity;
	}
</script>

<div class="mineral-row" class:event-active={activeEvent}>
	<div class="mineral-info">
		<div class="mineral-header">
			<span class="mineral-name">{item.mineral.name}</span>
			<span class="rarity-badge {rarityColors[item.mineral.rarity] || 'rarity-common'}">
				{item.mineral.rarity.replace('_', ' ')}
			</span>
			{#if activeEvent}
				{@const badgeColor = eventBadgeColors[activeEvent.event_type] ?? eventBadgeColors.shortage}
				<span
					class="event-badge"
					style="background: {badgeColor.bg}; color: {badgeColor.text};"
				>
					{eventBadgeText()}
				</span>
			{/if}
		</div>
		<div class="mineral-stock">
			<span class="stock-label">Stock:</span>
			<span class="stock-value">{item.quantity}</span>
		</div>
	</div>

	<div class="price-section">
		<div class="price-row">
			<span class="price-label">Buy:</span>
			<PriceDisplay price={item.buy_price} basePrice={item.mineral.base_price} showIndicator />
		</div>
		<div class="price-row">
			<span class="price-label">Sell:</span>
			<PriceDisplay price={item.sell_price} basePrice={item.mineral.base_price} showIndicator />
		</div>
		{#if priceHistory && priceHistory.length >= 2}
			<div class="sparkline-row">
				<span class="sparkline-label">Buy:</span>
				<PriceSparkline snapshots={priceHistory} field="buy_price" />
				<span class="sparkline-label">Sell:</span>
				<PriceSparkline snapshots={priceHistory} field="sell_price" />
				<button
					class="chart-expand-btn"
					onclick={() => showChart = true}
					title="View combined price chart"
				>
					&#x1F4CA;
				</button>
			</div>
		{/if}
	</div>

	<div class="action-section">
		<div class="action-row">
			<div class="quantity-control">
				<input
					type="number"
					bind:value={buyQuantity}
					min="1"
					max={maxBuyQuantity()}
					disabled={isBuying || maxBuyQuantity() === 0}
					class="quantity-input"
				/>
				<button
					type="button"
					onclick={setMaxBuy}
					class="max-btn"
					disabled={maxBuyQuantity() === 0}
					title="Set max quantity"
				>
					MAX
				</button>
			</div>
			<button
				type="button"
				onclick={handleBuy}
				disabled={!canBuy || isBuying}
				class="action-btn buy-btn"
				data-testid="buy-{item.mineral.uuid}"
			>
				{isBuying ? '...' : 'BUY'}
			</button>
			<span class="total-price">
				<PriceDisplay price={buyTotal} size="sm" />
			</span>
		</div>

		{#if maxSellQuantity > 0}
			<div class="action-row">
				<div class="quantity-control">
					<input
						type="number"
						bind:value={sellQuantity}
						min="1"
						max={maxSellQuantity}
						disabled={isSelling}
						class="quantity-input"
					/>
					<button type="button" onclick={setMaxSell} class="max-btn" title="Set max quantity">
						MAX
					</button>
				</div>
				<button
					type="button"
					onclick={handleSell}
					disabled={!canSell || isSelling}
					class="action-btn sell-btn"
					data-testid="sell-{item.mineral.uuid}"
				>
					{isSelling ? '...' : 'SELL'}
				</button>
				<span class="total-price">
					<PriceDisplay price={sellTotal} size="sm" />
				</span>
			</div>
		{/if}
	</div>

	{#if error}
		<div class="error-message">{error}</div>
	{/if}
</div>

{#if showChart && priceHistory && priceHistory.length >= 2}
	<PriceChart
		snapshots={priceHistory}
		mineralName={item.mineral.name}
		onClose={() => showChart = false}
	/>
{/if}

<style>
	.mineral-row {
		background: rgba(45, 55, 72, 0.6);
		border: 1px solid #4a5568;
		border-radius: 6px;
		padding: 0.75rem;
		display: grid;
		grid-template-columns: 1fr auto auto;
		gap: 1rem;
		align-items: start;
		transition: border-color 0.3s, box-shadow 0.3s;
	}

	.mineral-row.event-active {
		border-color: #f59e0b;
		box-shadow: 0 0 8px rgba(245, 158, 11, 0.2);
		animation: event-pulse 3s ease-in-out infinite;
	}

	@keyframes event-pulse {
		0%, 100% { box-shadow: 0 0 8px rgba(245, 158, 11, 0.15); }
		50% { box-shadow: 0 0 12px rgba(245, 158, 11, 0.3); }
	}

	.event-badge {
		font-size: 0.55rem;
		padding: 0.1rem 0.35rem;
		border-radius: 3px;
		font-weight: 700;
		letter-spacing: 0.03em;
		white-space: nowrap;
	}

	.mineral-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.mineral-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.mineral-name {
		font-weight: 600;
		color: #e2e8f0;
		font-size: 0.9rem;
	}

	.rarity-badge {
		font-size: 0.6rem;
		padding: 0.1rem 0.375rem;
		border-radius: 3px;
		text-transform: uppercase;
		font-weight: 600;
		letter-spacing: 0.05em;
	}

	.rarity-common {
		background: rgba(160, 174, 192, 0.2);
		color: #a0aec0;
	}

	.rarity-uncommon {
		background: rgba(72, 187, 120, 0.2);
		color: #68d391;
	}

	.rarity-rare {
		background: rgba(66, 153, 225, 0.2);
		color: #63b3ed;
	}

	.rarity-very-rare {
		background: rgba(159, 122, 234, 0.2);
		color: #b794f4;
	}

	.rarity-legendary {
		background: rgba(246, 173, 85, 0.2);
		color: #f6ad55;
	}

	.mineral-stock {
		font-size: 0.75rem;
	}

	.stock-label {
		color: #718096;
	}

	.stock-value {
		color: #a0aec0;
		margin-left: 0.25rem;
	}

	.price-section {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 120px;
	}

	.price-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.price-label {
		font-size: 0.7rem;
		color: #718096;
		text-transform: uppercase;
		width: 30px;
	}

	.sparkline-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: 0.25rem;
		padding-top: 0.25rem;
		border-top: 1px solid rgba(74, 85, 104, 0.4);
	}

	.sparkline-label {
		font-size: 0.55rem;
		color: #718096;
		text-transform: uppercase;
		width: 24px;
		flex-shrink: 0;
	}

	.chart-expand-btn {
		background: none;
		border: 1px solid transparent;
		border-radius: 3px;
		cursor: pointer;
		font-size: 0.75rem;
		line-height: 1;
		padding: 0.1rem 0.2rem;
		margin-left: 0.15rem;
		opacity: 0.5;
		transition: opacity 0.15s, border-color 0.15s;
		flex-shrink: 0;
	}

	.chart-expand-btn:hover {
		opacity: 1;
		border-color: #4a5568;
	}

	.action-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.action-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.quantity-control {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.quantity-input {
		width: 50px;
		padding: 0.25rem 0.375rem;
		background: #1a202c;
		border: 1px solid #4a5568;
		border-radius: 4px;
		color: #e2e8f0;
		font-size: 0.8rem;
		text-align: center;
	}

	.quantity-input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.max-btn {
		padding: 0.25rem 0.375rem;
		background: #2d3748;
		border: 1px solid #4a5568;
		border-radius: 4px;
		color: #a0aec0;
		font-size: 0.6rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.max-btn:hover:not(:disabled) {
		background: #4a5568;
		color: #e2e8f0;
	}

	.max-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.action-btn {
		padding: 0.375rem 0.75rem;
		border-radius: 4px;
		font-size: 0.7rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
		text-transform: uppercase;
		min-width: 50px;
	}

	.buy-btn {
		background: rgba(72, 187, 120, 0.2);
		border: 1px solid #48bb78;
		color: #68d391;
	}

	.buy-btn:hover:not(:disabled) {
		background: rgba(72, 187, 120, 0.3);
	}

	.buy-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.sell-btn {
		background: rgba(246, 173, 85, 0.2);
		border: 1px solid #f6ad55;
		color: #fbd38d;
	}

	.sell-btn:hover:not(:disabled) {
		background: rgba(246, 173, 85, 0.3);
	}

	.sell-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.total-price {
		min-width: 70px;
		text-align: right;
	}

	.error-message {
		grid-column: 1 / -1;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 4px;
		padding: 0.5rem;
		color: #fc8181;
		font-size: 0.75rem;
		margin-top: 0.5rem;
	}
</style>
