<script lang="ts">
	import { KNOWLEDGE_COLORS, STELLAR_COLORS } from '$lib/types/scanning';

	let isExpanded = $state(false);

	// Knowledge level categories for legend
	const knowledgeCategories = [
		{
			label: KNOWLEDGE_COLORS[1].label,
			level: 1,
			color: KNOWLEDGE_COLORS[1].color,
			opacity: KNOWLEDGE_COLORS[1].opacity
		},
		{
			label: KNOWLEDGE_COLORS[2].label,
			level: 2,
			color: KNOWLEDGE_COLORS[2].color,
			opacity: KNOWLEDGE_COLORS[2].opacity
		},
		{
			label: KNOWLEDGE_COLORS[3].label,
			level: 3,
			color: KNOWLEDGE_COLORS[3].color,
			opacity: KNOWLEDGE_COLORS[3].opacity
		},
		{
			label: KNOWLEDGE_COLORS[4].label,
			level: 4,
			color: KNOWLEDGE_COLORS[4].color,
			opacity: KNOWLEDGE_COLORS[4].opacity
		}
	];

	// Stellar class colors for legend
	const stellarCategories = Object.entries(STELLAR_COLORS).map(([cls, color]) => ({
		cls,
		color
	}));
</script>

<div class="map-legend" class:expanded={isExpanded}>
	<button class="legend-toggle" onclick={() => (isExpanded = !isExpanded)}>
		<span class="toggle-icon">{isExpanded ? '\u25BC' : '\u25B2'}</span>
		<span>Legend</span>
	</button>

	{#if isExpanded}
		<div class="legend-content">
			<div class="legend-section">
				<h4>Knowledge Levels</h4>
				<div class="scan-levels">
					{#each knowledgeCategories as category (category.label)}
						<div class="legend-item">
							<svg width="16" height="16" viewBox="0 0 16 16">
								<circle cx="8" cy="8" r="6" fill={category.color} opacity={category.opacity} />
							</svg>
							<span class="item-label">{category.label}</span>
							<span class="item-levels">L{category.level}</span>
						</div>
					{/each}
				</div>
			</div>

			<div class="legend-section">
				<h4>Star Types</h4>
				<div class="scan-levels">
					{#each stellarCategories as star (star.cls)}
						<div class="legend-item">
							<svg width="16" height="16" viewBox="0 0 16 16">
								<circle cx="8" cy="8" r="5" fill={star.color} />
							</svg>
							<span class="item-label">{star.cls} Type Star</span>
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
							<circle cx="8" cy="8" r="3" fill="#22c55e" />
						</svg>
						<span class="item-label">Inhabited</span>
					</div>
					<div class="legend-item">
						<svg width="16" height="16" viewBox="0 0 16 16">
							<line x1="2" y1="8" x2="14" y2="8" stroke="#374151" stroke-width="2" />
						</svg>
						<span class="item-label">Warp Lane</span>
					</div>
					<div class="legend-item">
						<svg width="16" height="16" viewBox="0 0 16 16">
							<line x1="2" y1="8" x2="14" y2="8" stroke="#dc2626" stroke-width="2" stroke-dasharray="3,2" />
						</svg>
						<span class="item-label">Pirate Lane</span>
					</div>
					<div class="legend-item">
						<svg width="16" height="16" viewBox="0 0 16 16">
							<circle cx="8" cy="8" r="6" fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" stroke-width="1" stroke-dasharray="2,1" />
						</svg>
						<span class="item-label">Danger Zone</span>
					</div>
					<div class="legend-item">
						<svg width="16" height="16" viewBox="0 0 16 16">
							<circle cx="8" cy="8" r="6" fill="none" stroke="#3b82f6" stroke-width="1" stroke-dasharray="2,1" />
						</svg>
						<span class="item-label">Sensor Range</span>
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
