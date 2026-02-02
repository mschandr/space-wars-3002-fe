<script lang="ts">
	interface Props {
		zoom: number;
		showGates: boolean;
		showInhabited: boolean;
		showHazards: boolean;
		selectedSystem: string | null;
		onZoomChange: (zoom: number) => void;
		onFilterChange: (filter: 'gates' | 'inhabited' | 'hazards', value: boolean) => void;
		onTravel: () => void;
	}

	let {
		zoom,
		showGates,
		showInhabited,
		showHazards,
		selectedSystem,
		onZoomChange,
		onFilterChange,
		onTravel
	}: Props = $props();

	function handleZoomIn() {
		onZoomChange(Math.min(zoom + 0.25, 3));
	}

	function handleZoomOut() {
		onZoomChange(Math.max(zoom - 0.25, 0.5));
	}
</script>

<div class="map-filters">
	<div class="filter-group zoom-controls">
		<button class="zoom-btn" onclick={handleZoomOut} aria-label="Zoom out">-</button>
		<span class="zoom-label">Zoom</span>
		<button class="zoom-btn" onclick={handleZoomIn} aria-label="Zoom in">+</button>
	</div>

	<div class="filter-group toggle-filters">
		<label class="filter-toggle" class:active={showGates}>
			<input
				type="checkbox"
				checked={showGates}
				onchange={(e) => onFilterChange('gates', e.currentTarget.checked)}
			/>
			<span class="toggle-icon">&#x2728;</span>
			<span class="toggle-label">Gates</span>
		</label>

		<label class="filter-toggle" class:active={showInhabited}>
			<input
				type="checkbox"
				checked={showInhabited}
				onchange={(e) => onFilterChange('inhabited', e.currentTarget.checked)}
			/>
			<span class="toggle-icon">&#x1F3E0;</span>
			<span class="toggle-label">Inhabited</span>
		</label>

		<label class="filter-toggle" class:active={showHazards}>
			<input
				type="checkbox"
				checked={showHazards}
				onchange={(e) => onFilterChange('hazards', e.currentTarget.checked)}
			/>
			<span class="toggle-icon">&#x26A0;</span>
			<span class="toggle-label">Hazards</span>
		</label>
	</div>

	<div class="filter-group actions">
		<button class="travel-btn" disabled={!selectedSystem} onclick={onTravel}> Travel </button>
	</div>
</div>

<style>
	.map-filters {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1rem;
		background: rgba(26, 32, 44, 0.95);
		border-top: 1px solid #4a5568;
	}

	.filter-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.zoom-controls {
		gap: 0.25rem;
	}

	.zoom-btn {
		width: 28px;
		height: 28px;
		background: linear-gradient(to bottom, #4a5568, #2d3748);
		border: 1px solid #1a202c;
		border-radius: 4px;
		color: #e2e8f0;
		font-size: 1rem;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.15s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.zoom-btn:hover {
		background: linear-gradient(to bottom, #718096, #4a5568);
	}

	.zoom-label {
		font-size: 0.75rem;
		color: #a0aec0;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0 0.25rem;
	}

	.toggle-filters {
		gap: 0.75rem;
	}

	.filter-toggle {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.625rem;
		background: rgba(45, 55, 72, 0.8);
		border: 1px solid #4a5568;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.15s;
	}

	.filter-toggle:hover {
		background: rgba(74, 85, 104, 0.8);
	}

	.filter-toggle.active {
		background: rgba(66, 153, 225, 0.2);
		border-color: #4299e1;
	}

	.filter-toggle input {
		display: none;
	}

	.toggle-icon {
		font-size: 0.875rem;
	}

	.toggle-label {
		font-size: 0.75rem;
		color: #e2e8f0;
		font-weight: 500;
	}

	.travel-btn {
		padding: 0.5rem 1.5rem;
		background: linear-gradient(to bottom, #48bb78, #38a169);
		border: 1px solid #276749;
		border-radius: 4px;
		color: white;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}

	.travel-btn:hover:not(:disabled) {
		background: linear-gradient(to bottom, #68d391, #48bb78);
	}

	.travel-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
