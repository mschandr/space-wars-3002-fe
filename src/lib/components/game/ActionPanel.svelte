<script lang="ts">
	import type { SystemDataResponse } from '$lib/api';

	interface Props {
		activeItem: 'planets' | 'trading' | 'salvage' | 'warp' | null;
		systemData: SystemDataResponse | null;
		onAction: (action: string, targetUuid?: string) => void;
	}

	let { activeItem, systemData, onAction }: Props = $props();

	const featuresByType = $derived(() => {
		if (!systemData?.visible_features) return {};
		const grouped: Record<string, typeof systemData.visible_features> = {};
		for (const feature of systemData.visible_features) {
			const type = feature.type;
			if (!grouped[type]) grouped[type] = [];
			grouped[type].push(feature);
		}
		return grouped;
	});

	const panelTitles: Record<string, string> = {
		planets: 'Local Planets',
		trading: 'Trading Hub',
		salvage: 'Salvage Yard',
		warp: 'Warp Gates'
	};

	const featureTypeMapping: Record<string, string> = {
		planets: 'planet',
		trading: 'trading_hub',
		salvage: 'salvage_yard',
		warp: 'warp_gate'
	};
</script>

<div class="action-panel">
	{#if !activeItem}
		<div class="panel-placeholder">
			<p>Select a destination from the menu</p>
		</div>
	{:else}
		<div class="panel-content">
			<h3 class="panel-title">{panelTitles[activeItem] ?? activeItem}</h3>

			{#if systemData}
				{@const relevantType = featureTypeMapping[activeItem]}
				{@const features = featuresByType()[relevantType] ?? []}

				{#if features.length > 0}
					<div class="action-buttons">
						{#each features as feature (feature.uuid)}
							<button class="action-btn" onclick={() => onAction(activeItem, feature.uuid)}>
								{feature.name}
							</button>
						{/each}
					</div>
				{:else}
					<p class="no-features">
						No {panelTitles[activeItem]?.toLowerCase() ?? 'features'} available in this system.
					</p>
				{/if}

				{#if activeItem === 'warp' && systemData.connections?.length > 0}
					<div class="connections-section">
						<h4 class="section-title">Connected Systems</h4>
						<div class="action-buttons">
							{#each systemData.connections as connection (connection.target_uuid)}
								<button
									class="action-btn connection-btn"
									onclick={() => onAction('travel', connection.target_uuid)}
								>
									<span class="connection-name">{connection.target_name}</span>
									<span class="connection-distance">{connection.distance.toFixed(1)} LY</span>
								</button>
							{/each}
						</div>
					</div>
				{/if}
			{:else}
				<div class="loading">Loading system data...</div>
			{/if}

			{#if activeItem === 'trading'}
				<button class="action-btn primary" onclick={() => onAction('cartographer')}>
					Cartographer
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.action-panel {
		flex: 1;
		background: rgba(26, 32, 44, 0.85);
		border: 1px solid #4a5568;
		border-radius: 8px;
		padding: 1rem;
		min-height: 200px;
	}

	.panel-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		min-height: 150px;
		color: #718096;
		font-size: 0.9rem;
	}

	.panel-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.panel-title {
		font-size: 1rem;
		font-weight: 600;
		color: #e2e8f0;
		margin: 0;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #4a5568;
	}

	.action-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.action-btn {
		padding: 0.5rem 1rem;
		background: linear-gradient(to bottom, #4a5568, #2d3748);
		border: 1px solid #1a202c;
		border-radius: 4px;
		color: #e2e8f0;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}

	.action-btn:hover {
		background: linear-gradient(to bottom, #718096, #4a5568);
		border-color: #4a5568;
	}

	.action-btn.primary {
		background: linear-gradient(to bottom, #4299e1, #3182ce);
		border-color: #2b6cb0;
	}

	.action-btn.primary:hover {
		background: linear-gradient(to bottom, #63b3ed, #4299e1);
	}

	.connection-btn {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.125rem;
	}

	.connection-name {
		font-weight: 600;
	}

	.connection-distance {
		font-size: 0.7rem;
		color: #a0aec0;
	}

	.connections-section {
		margin-top: 0.5rem;
		padding-top: 0.75rem;
		border-top: 1px solid #4a5568;
	}

	.section-title {
		font-size: 0.8rem;
		font-weight: 600;
		color: #a0aec0;
		margin: 0 0 0.5rem 0;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.no-features {
		color: #718096;
		font-size: 0.85rem;
		font-style: italic;
		margin: 0;
	}

	.loading {
		color: #718096;
		font-size: 0.85rem;
	}
</style>
