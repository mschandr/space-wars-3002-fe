<script lang="ts">
	import { SCAN_COLORS } from '$lib/types/scanning';

	let isExpanded = $state(false);

	// Group scan levels by category for legend
	const scanCategories = [
		{
			label: 'Unscanned',
			levels: [0],
			color: SCAN_COLORS[0].color,
			opacity: SCAN_COLORS[0].opacity
		},
		{
			label: 'Basic',
			levels: [1, 2],
			color: SCAN_COLORS[1].color,
			opacity: SCAN_COLORS[1].opacity
		},
		{
			label: 'Resources',
			levels: [3, 4],
			color: SCAN_COLORS[3].color,
			opacity: SCAN_COLORS[3].opacity
		},
		{
			label: 'Hidden',
			levels: [5, 6],
			color: SCAN_COLORS[5].color,
			opacity: SCAN_COLORS[5].opacity
		},
		{
			label: 'Deep Intel',
			levels: [7, 8],
			color: SCAN_COLORS[7].color,
			opacity: SCAN_COLORS[7].opacity
		},
		{
			label: 'Precursor',
			levels: [9],
			color: SCAN_COLORS[9].color,
			opacity: SCAN_COLORS[9].opacity
		}
	];
</script>

<div class="map-legend" class:expanded={isExpanded}>
	<button class="legend-toggle" onclick={() => (isExpanded = !isExpanded)}>
		<span class="toggle-icon">{isExpanded ? '\u25BC' : '\u25B2'}</span>
		<span>Legend</span>
	</button>

	{#if isExpanded}
		<div class="legend-content">
			<div class="legend-section">
				<h4>Scan Levels (Fog of War)</h4>
				<div class="scan-levels">
					{#each scanCategories as category (category.label)}
						<div class="legend-item">
							<svg width="16" height="16" viewBox="0 0 16 16">
								<circle cx="8" cy="8" r="6" fill={category.color} opacity={category.opacity} />
							</svg>
							<span class="item-label">{category.label}</span>
							<span class="item-levels">L{category.levels.join('-')}</span>
						</div>
					{/each}
				</div>
			</div>

			<div class="legend-section">
				<h4>Markers</h4>
				<div class="markers-list">
					<div class="legend-item">
						<svg width="16" height="16" viewBox="0 0 16 16">
							<circle cx="8" cy="8" r="5" fill="#ef4444" />
							<circle
								cx="8"
								cy="8"
								r="7"
								fill="none"
								stroke="#ef4444"
								stroke-width="1.5"
								opacity="0.5"
							/>
						</svg>
						<span class="item-label">Your Location</span>
					</div>
					<div class="legend-item">
						<svg width="16" height="16" viewBox="0 0 16 16">
							<circle cx="8" cy="8" r="4" fill="#4299e1" />
							<circle cx="8" cy="8" r="6" fill="none" stroke="#4299e1" stroke-width="1.5" />
						</svg>
						<span class="item-label">Selected System</span>
					</div>
				</div>
			</div>

			<div class="legend-section">
				<h4>Features</h4>
				<div class="features-list">
					<div class="legend-item">
						<svg width="16" height="16" viewBox="0 0 16 16">
							<circle
								cx="8"
								cy="8"
								r="6"
								fill="none"
								stroke="#a855f7"
								stroke-width="1"
								stroke-dasharray="2,2"
							/>
						</svg>
						<span class="item-label">Warp Gate</span>
					</div>
					<div class="legend-item">
						<svg width="16" height="16" viewBox="0 0 16 16">
							<circle cx="8" cy="8" r="3" fill="#22c55e" />
						</svg>
						<span class="item-label">Inhabited</span>
					</div>
					<div class="legend-item">
						<svg width="16" height="16" viewBox="0 0 16 16">
							<circle cx="8" cy="8" r="3" fill="#ef4444" />
						</svg>
						<span class="item-label">Hazardous</span>
					</div>
					<div class="legend-item">
						<svg width="16" height="16" viewBox="0 0 16 16">
							<line x1="2" y1="8" x2="14" y2="8" stroke="#dc2626" stroke-width="2" />
						</svg>
						<span class="item-label">Pirate Lane</span>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.map-legend {
		position: absolute;
		bottom: 1rem;
		right: 1rem;
		background: rgba(26, 32, 44, 0.95);
		border: 1px solid #4a5568;
		border-radius: 6px;
		min-width: 160px;
		max-width: 220px;
		z-index: 10;
	}

	.legend-toggle {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: transparent;
		border: none;
		color: #a0aec0;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		transition: color 0.15s;
	}

	.legend-toggle:hover {
		color: #e2e8f0;
	}

	.toggle-icon {
		font-size: 0.6rem;
	}

	.legend-content {
		border-top: 1px solid #4a5568;
		padding: 0.75rem;
	}

	.legend-section {
		margin-bottom: 0.75rem;
	}

	.legend-section:last-child {
		margin-bottom: 0;
	}

	.legend-section h4 {
		font-size: 0.7rem;
		font-weight: 600;
		color: #718096;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 0.5rem 0;
	}

	.scan-levels,
	.markers-list,
	.features-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.legend-item svg {
		flex-shrink: 0;
	}

	.item-label {
		font-size: 0.75rem;
		color: #e2e8f0;
		flex: 1;
	}

	.item-levels {
		font-size: 0.65rem;
		color: #718096;
		font-family: monospace;
	}
</style>
