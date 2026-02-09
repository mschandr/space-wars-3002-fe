<script lang="ts">
	import type { CargoItem } from '$lib/api';

	interface Props {
		cargo: CargoItem[];
		capacity: number;
		used: number;
	}

	let { cargo, capacity, used }: Props = $props();

	const usedPercent = $derived(capacity > 0 ? Math.round((used / capacity) * 100) : 0);
	const available = $derived(capacity - used);

	const rarityColors: Record<string, string> = {
		common: 'rarity-common',
		uncommon: 'rarity-uncommon',
		rare: 'rarity-rare',
		very_rare: 'rarity-very-rare',
		legendary: 'rarity-legendary'
	};
</script>

<div class="cargo-manifest">
	<div class="cargo-header">
		<span class="cargo-title">CARGO HOLD</span>
		<span class="cargo-stats">
			{used}/{capacity} units
			<span class="cargo-percent">({usedPercent}%)</span>
		</span>
	</div>

	<div class="cargo-bar-container">
		<div
			class="cargo-bar-fill"
			class:warning={usedPercent >= 75 && usedPercent < 90}
			class:critical={usedPercent >= 90}
			style="width: {usedPercent}%"
		></div>
	</div>

	<div class="cargo-available">
		<span class="available-label">Available:</span>
		<span class="available-value">{available} units</span>
	</div>

	{#if cargo.length > 0}
		<div class="cargo-list">
			{#each cargo as item (item.mineral.uuid)}
				<div class="cargo-item">
					<div class="cargo-item-info">
						<span class="cargo-item-name">{item.mineral.name}</span>
						<span class="cargo-item-rarity {rarityColors[item.mineral.rarity] || 'rarity-common'}">
							{item.mineral.rarity.replace('_', ' ')}
						</span>
					</div>
					<span class="cargo-item-quantity">{item.quantity}</span>
				</div>
			{/each}
		</div>
	{:else}
		<div class="cargo-empty">
			<span class="empty-message">Cargo hold is empty</span>
		</div>
	{/if}
</div>

<style>
	.cargo-manifest {
		background: rgba(26, 32, 44, 0.95);
		border: 1px solid #4a5568;
		border-radius: 8px;
		padding: 0.75rem;
	}

	.cargo-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.cargo-title {
		font-size: 0.7rem;
		font-weight: 600;
		color: #718096;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.cargo-stats {
		font-size: 0.8rem;
		color: #e2e8f0;
		font-family: monospace;
	}

	.cargo-percent {
		color: #a0aec0;
		font-size: 0.7rem;
	}

	.cargo-bar-container {
		height: 6px;
		background: rgba(45, 55, 72, 0.8);
		border-radius: 3px;
		overflow: hidden;
		margin-bottom: 0.5rem;
	}

	.cargo-bar-fill {
		height: 100%;
		background: linear-gradient(to right, #4299e1, #3182ce);
		transition: width 0.3s ease-out;
		border-radius: 3px;
	}

	.cargo-bar-fill.warning {
		background: linear-gradient(to right, #ed8936, #dd6b20);
	}

	.cargo-bar-fill.critical {
		background: linear-gradient(to right, #fc8181, #f56565);
	}

	.cargo-available {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #4a5568;
		margin-bottom: 0.5rem;
	}

	.available-label {
		color: #718096;
	}

	.available-value {
		color: #68d391;
		font-family: monospace;
	}

	.cargo-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		max-height: 200px;
		overflow-y: auto;
	}

	.cargo-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.375rem 0.5rem;
		background: rgba(45, 55, 72, 0.5);
		border-radius: 4px;
	}

	.cargo-item-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.cargo-item-name {
		color: #e2e8f0;
		font-size: 0.8rem;
	}

	.cargo-item-rarity {
		font-size: 0.55rem;
		padding: 0.1rem 0.25rem;
		border-radius: 2px;
		text-transform: uppercase;
		font-weight: 600;
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

	.cargo-item-quantity {
		color: #f6ad55;
		font-family: monospace;
		font-size: 0.85rem;
		font-weight: 600;
	}

	.cargo-empty {
		padding: 1rem;
		text-align: center;
	}

	.empty-message {
		color: #718096;
		font-size: 0.8rem;
		font-style: italic;
	}
</style>
