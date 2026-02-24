<script lang="ts">
	import SectorStarMap from './SectorStarMap.svelte';

	interface SectorData {
		uuid?: string;
		name?: string;
		grid?: { x: number; y: number };
		display_name?: string;
		danger_level?: 'low' | 'medium' | 'high' | 'extreme';
	}

	interface Props {
		sector: SectorData | null;
		gridSize?: number;
		currentSystemUuid?: string;
		onSectorClick?: (x: number, y: number) => void;
		onNavigateToMap?: () => void;
	}

	let { sector, gridSize = 5, currentSystemUuid, onSectorClick, onNavigateToMap }: Props = $props();

	// Expanded state - shows the star map when true
	let isExpanded = $state(false);

	// Ensure gridSize is valid (positive integer)
	const safeGridSize = $derived(() => {
		const size = Math.round(gridSize);
		if (!Number.isFinite(size) || size < 1) return 5;
		if (size > 20) return 20; // Cap at 20 for performance
		return size;
	});

	// Current position from sector data
	const currentX = $derived(sector?.grid?.x ?? -1);
	const currentY = $derived(sector?.grid?.y ?? -1);

	// Generate grid cells (Y-axis is inverted so Y=0 appears at bottom)
	const cells = $derived.by(() => {
		const size = safeGridSize();
		const result: { x: number; y: number; isCurrent: boolean }[] = [];
		// Start from highest Y value so it renders at the top, Y=0 at the bottom
		for (let row = size - 1; row >= 0; row--) {
			for (let x = 0; x < size; x++) {
				result.push({
					x,
					y: row,
					isCurrent: x === currentX && row === currentY
				});
			}
		}
		return result;
	});

	function handleCellClick(cell: { x: number; y: number; isCurrent: boolean }) {
		if (cell.isCurrent) {
			if (onNavigateToMap) {
				onNavigateToMap();
			} else {
				isExpanded = true;
			}
		}
	}

	function handleCloseStarMap() {
		isExpanded = false;
	}
</script>

{#if isExpanded && sector?.uuid}
	<SectorStarMap
		sectorUuid={sector.uuid}
		sectorName={sector.display_name ?? sector.name ?? 'Unknown Sector'}
		{currentSystemUuid}
		onClose={handleCloseStarMap}
	/>
{:else}
	<div class="sector-grid-container">
		<div class="sector-header">
			<span class="sector-label">SECTOR</span>
			<span class="sector-name">{sector?.display_name ?? sector?.name ?? 'Unknown'}</span>
		</div>

		<div class="grid-wrapper">
			<div class="sector-grid" style="--grid-size: {safeGridSize()}">
				{#each cells as cell (cell.x + '-' + cell.y)}
					<div
						class="grid-cell"
						class:current={cell.isCurrent}
						class:explored={false}
						role={cell.isCurrent ? 'button' : 'presentation'}
						tabindex={cell.isCurrent ? 0 : -1}
						onclick={() => handleCellClick(cell)}
						onkeydown={(e) => e.key === 'Enter' && handleCellClick(cell)}
						title={cell.isCurrent
							? `Sector (${cell.x}, ${cell.y}) - Click to view star map`
							: `Sector (${cell.x}, ${cell.y})`}
					>
						{#if cell.isCurrent}
							<span class="current-marker"></span>
						{/if}
					</div>
				{/each}
			</div>

			<!-- Axis labels -->
			<div class="axis-labels x-axis">
				{#each Array(safeGridSize())
					.fill(0)
					.map((_, i) => i) as idx (idx)}
					<span class="axis-label">{idx}</span>
				{/each}
			</div>
			<div class="axis-labels y-axis">
				{#each Array(safeGridSize())
					.fill(0)
					.map((_, i) => safeGridSize() - 1 - i) as idx (idx)}
					<span class="axis-label">{idx}</span>
				{/each}
			</div>
		</div>

		{#if sector}
			<div class="sector-info">
				<span class="coordinates">({currentX}, {currentY})</span>
				<span
					class="danger-level"
					class:low={sector.danger_level === 'low'}
					class:medium={sector.danger_level === 'medium'}
					class:high={sector.danger_level === 'high'}
					class:extreme={sector.danger_level === 'extreme'}
				>
					{sector.danger_level?.toUpperCase() ?? 'UNKNOWN'} RISK
				</span>
			</div>
		{/if}

		<div class="expand-hint">
			<span class="hint-text">Click marker to open star map</span>
		</div>
	</div>
{/if}

<style>
	.sector-grid-container {
		background: rgba(26, 32, 44, 0.95);
		border: 1px solid #4a5568;
		border-radius: 8px;
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.sector-header {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #4a5568;
	}

	.sector-label {
		font-size: 0.65rem;
		font-weight: 600;
		color: #718096;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.sector-name {
		font-size: 0.9rem;
		font-weight: 600;
		color: #e2e8f0;
	}

	.grid-wrapper {
		position: relative;
		padding-left: 1rem;
		padding-bottom: 1rem;
	}

	.sector-grid {
		display: grid;
		grid-template-columns: repeat(var(--grid-size), 1fr);
		gap: 2px;
		aspect-ratio: 1;
		width: 100%;
		max-width: 200px;
	}

	.grid-cell {
		aspect-ratio: 1;
		background: #2d3748;
		border: 1px solid #4a5568;
		border-radius: 2px;
		cursor: default;
		transition: all 0.15s;
		position: relative;
		padding: 0;
	}

	.grid-cell.current {
		background: rgba(239, 68, 68, 0.3);
		border-color: #ef4444;
		animation: pulse-red 1.5s ease-in-out infinite;
		cursor: pointer;
	}

	.grid-cell.current:hover {
		background: rgba(239, 68, 68, 0.5);
		border-color: #f87171;
	}

	.grid-cell.explored {
		background: rgba(72, 187, 120, 0.2);
	}

	.current-marker {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 60%;
		height: 60%;
		transform: translate(-50%, -50%);
		background: #ef4444;
		border-radius: 50%;
		animation: blink 1s ease-in-out infinite;
	}

	@keyframes pulse-red {
		0%,
		100% {
			background: rgba(239, 68, 68, 0.2);
			border-color: rgba(239, 68, 68, 0.6);
		}
		50% {
			background: rgba(239, 68, 68, 0.4);
			border-color: #ef4444;
		}
	}

	@keyframes blink {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.3;
		}
	}

	.axis-labels {
		position: absolute;
		display: flex;
		color: #718096;
		font-size: 0.55rem;
		font-family: monospace;
	}

	.axis-labels.x-axis {
		bottom: 0;
		left: 1rem;
		right: 0;
		justify-content: space-around;
	}

	.axis-labels.y-axis {
		top: 0;
		left: 0;
		bottom: 1rem;
		flex-direction: column;
		justify-content: space-around;
		width: 1rem;
		text-align: right;
		padding-right: 0.25rem;
	}

	.axis-label {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.sector-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 0.5rem;
		border-top: 1px solid #4a5568;
	}

	.coordinates {
		font-size: 0.75rem;
		color: #a0aec0;
		font-family: monospace;
	}

	.danger-level {
		font-size: 0.65rem;
		font-weight: 600;
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
		text-transform: uppercase;
	}

	.danger-level.low {
		background: rgba(72, 187, 120, 0.2);
		color: #68d391;
	}

	.danger-level.medium {
		background: rgba(246, 173, 85, 0.2);
		color: #f6ad55;
	}

	.danger-level.high {
		background: rgba(239, 68, 68, 0.2);
		color: #fc8181;
	}

	.danger-level.extreme {
		background: rgba(159, 122, 234, 0.2);
		color: #b794f4;
	}

	.expand-hint {
		text-align: center;
		padding-top: 0.25rem;
	}

	.hint-text {
		font-size: 0.6rem;
		color: #4a5568;
		font-style: italic;
	}
</style>
