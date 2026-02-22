<script lang="ts">
	import type { MarketEvent, MarketEventType } from '$lib/api';
	import MarketEventCard from './MarketEventCard.svelte';

	interface Props {
		mode: 'hub' | 'galaxy';
		events?: MarketEvent[];
		isLoading?: boolean;
		onFilterChange?: (filters: { event_type?: MarketEventType; mineral?: string }) => void;
	}

	let { mode, events = [], isLoading = false, onFilterChange }: Props = $props();

	// Galaxy mode filter state
	let filterEventType = $state<MarketEventType | ''>('');
	let filterMineral = $state('');

	function applyFilters() {
		onFilterChange?.({
			event_type: filterEventType || undefined,
			mineral: filterMineral || undefined
		});
	}

	function clearFilters() {
		filterEventType = '';
		filterMineral = '';
		onFilterChange?.({});
	}

	const hasActiveFilters = $derived(filterEventType !== '' || filterMineral !== '');
</script>

<div class="market-events-panel" class:hub-mode={mode === 'hub'} class:galaxy-mode={mode === 'galaxy'}>
	<div class="panel-header">
		<span class="header-icon">&#x1F4C8;</span>
		<span class="header-title">
			{mode === 'hub' ? 'ACTIVE MARKET EVENTS' : 'GALAXY MARKET NEWS'}
		</span>
		<span class="event-count">({events.length})</span>
	</div>

	{#if mode === 'galaxy'}
		<div class="filter-controls">
			<div class="filter-row">
				<select
					class="filter-select"
					bind:value={filterEventType}
					onchange={applyFilters}
				>
					<option value="">All Events</option>
					<option value="shortage">Shortage</option>
					<option value="surplus">Surplus</option>
					<option value="boom">Boom</option>
					<option value="bust">Bust</option>
				</select>

				<input
					type="text"
					class="filter-input"
					placeholder="Filter by mineral..."
					bind:value={filterMineral}
					onkeyup={(e) => e.key === 'Enter' && applyFilters()}
				/>

				<button
					type="button"
					class="filter-btn"
					onclick={applyFilters}
				>
					Search
				</button>

				{#if hasActiveFilters}
					<button
						type="button"
						class="clear-btn"
						onclick={clearFilters}
					>
						Clear
					</button>
				{/if}
			</div>
		</div>
	{/if}

	{#if isLoading}
		<div class="loading-state">
			<div class="loading-spinner"></div>
			<span>Loading market events...</span>
		</div>
	{:else if events.length === 0}
		<div class="empty-state">
			{#if mode === 'hub'}
				<span class="empty-text">No active market events at this hub</span>
			{:else}
				<span class="empty-text">No market events at this time</span>
			{/if}
		</div>
	{:else}
		<div class="events-list">
			{#each events as event (event.uuid)}
				<MarketEventCard
					{event}
					showHubName={mode === 'galaxy'}
					compact={mode === 'hub'}
				/>
			{/each}
		</div>
	{/if}
</div>

<style>
	.market-events-panel {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.galaxy-mode {
		background: rgba(26, 32, 44, 0.95);
		border: 1px solid #4a5568;
		border-radius: 8px;
		padding: 1rem;
		height: 100%;
		overflow: hidden;
	}

	.panel-header {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.header-icon {
		font-size: 0.85rem;
	}

	.header-title {
		font-size: 0.7rem;
		font-weight: 600;
		color: #718096;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.event-count {
		font-size: 0.7rem;
		color: #a0aec0;
	}

	.filter-controls {
		padding: 0.5rem 0;
		border-bottom: 1px solid rgba(74, 85, 104, 0.5);
	}

	.filter-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-wrap: wrap;
	}

	.filter-select {
		padding: 0.3rem 0.5rem;
		background: #1a202c;
		border: 1px solid #4a5568;
		border-radius: 4px;
		color: #e2e8f0;
		font-size: 0.75rem;
	}

	.filter-input {
		flex: 1;
		min-width: 100px;
		padding: 0.3rem 0.5rem;
		background: #1a202c;
		border: 1px solid #4a5568;
		border-radius: 4px;
		color: #e2e8f0;
		font-size: 0.75rem;
	}

	.filter-input::placeholder {
		color: #718096;
	}

	.filter-btn {
		padding: 0.3rem 0.625rem;
		background: rgba(66, 153, 225, 0.2);
		border: 1px solid #4299e1;
		border-radius: 4px;
		color: #63b3ed;
		font-size: 0.7rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}

	.filter-btn:hover {
		background: rgba(66, 153, 225, 0.3);
	}

	.clear-btn {
		padding: 0.3rem 0.625rem;
		background: rgba(160, 174, 192, 0.1);
		border: 1px solid #4a5568;
		border-radius: 4px;
		color: #a0aec0;
		font-size: 0.7rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.clear-btn:hover {
		background: rgba(160, 174, 192, 0.2);
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 2rem;
		color: #a0aec0;
		font-size: 0.8rem;
	}

	.loading-spinner {
		width: 24px;
		height: 24px;
		border: 2px solid #4a5568;
		border-top-color: #4299e1;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.empty-state {
		padding: 1rem;
		text-align: center;
	}

	.empty-text {
		font-size: 0.75rem;
		color: #718096;
		font-style: italic;
	}

	.events-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		overflow-y: auto;
		flex: 1;
	}

	.events-list::-webkit-scrollbar {
		width: 6px;
	}

	.events-list::-webkit-scrollbar-track {
		background: #2d3748;
		border-radius: 3px;
	}

	.events-list::-webkit-scrollbar-thumb {
		background: #4a5568;
		border-radius: 3px;
	}
</style>
