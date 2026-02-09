<script lang="ts">
	import { api, type SectorSystem, type SectorWarpGate } from '$lib/api';

	interface Props {
		sectorUuid: string;
		sectorName: string;
		currentSystemUuid?: string;
		onClose: () => void;
	}

	let { sectorUuid, sectorName, currentSystemUuid, onClose }: Props = $props();

	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let systems = $state<SectorSystem[]>([]);
	let warpGates = $state<SectorWarpGate[]>([]);
	let bounds = $state({ x_min: 0, x_max: 100, y_min: 0, y_max: 100 });
	let hoveredSystemUuid = $state<string | null>(null);

	// SVG viewport settings
	const viewportSize = 300;
	const padding = 20;
	const starRadius = 6;

	// Load sector data
	$effect(() => {
		loadSectorData();
	});

	async function loadSectorData() {
		isLoading = true;
		error = null;

		try {
			const response = await api.sectors.get(sectorUuid);

			if (response.success && response.data) {
				systems = response.data.systems || [];
				warpGates = response.data.warp_gates || [];
				bounds = response.data.bounds;
			} else {
				error = response.error?.message || 'Failed to load sector data';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to connect to server';
		} finally {
			isLoading = false;
		}
	}

	// Convert game coordinates to SVG coordinates
	function toSvgX(gameX: number): number {
		const range = bounds.x_max - bounds.x_min || 1;
		return padding + ((gameX - bounds.x_min) / range) * (viewportSize - 2 * padding);
	}

	function toSvgY(gameY: number): number {
		const range = bounds.y_max - bounds.y_min || 1;
		// Invert Y-axis so Y=0 is at the bottom (SVG Y increases downward)
		return viewportSize - padding - ((gameY - bounds.y_min) / range) * (viewportSize - 2 * padding);
	}

	// Get connections for a system
	function getSystemConnections(systemUuid: string): SectorWarpGate[] {
		return warpGates.filter(
			(gate) => gate.from_system_uuid === systemUuid || gate.to_system_uuid === systemUuid
		);
	}

	// Check if a gate connects to hovered system
	function isGateHighlighted(gate: SectorWarpGate): boolean {
		if (!hoveredSystemUuid) return false;
		return gate.from_system_uuid === hoveredSystemUuid || gate.to_system_uuid === hoveredSystemUuid;
	}

	// Get star color based on status
	function getStarColor(system: SectorSystem): string {
		if (system.uuid === currentSystemUuid) return '#ef4444'; // Current location - red
		if (system.is_known) return '#4ade80'; // In charts - green
		if (system.is_detected) return '#fbbf24'; // Detected - yellow
		if (system.is_inhabited) return '#60a5fa'; // Inhabited - blue
		return '#9ca3af'; // Unknown - gray
	}

	// Get star glow based on status
	function getStarGlow(system: SectorSystem): string {
		if (system.uuid === currentSystemUuid) return 'url(#glow-red)';
		if (system.is_known) return 'url(#glow-green)';
		if (system.is_detected) return 'url(#glow-yellow)';
		return '';
	}

	function handleStarHover(systemUuid: string | null) {
		hoveredSystemUuid = systemUuid;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="sector-star-map">
	<div class="map-header">
		<span class="map-title">{sectorName}</span>
		<button type="button" class="close-btn" onclick={onClose} title="Close (Esc)">
			&times;
		</button>
	</div>

	{#if isLoading}
		<div class="loading-state">
			<div class="loading-spinner"></div>
			<span>Loading sector map...</span>
		</div>
	{:else if error}
		<div class="error-state">
			<span class="error-text">{error}</span>
			<button type="button" class="retry-btn" onclick={loadSectorData}>Retry</button>
		</div>
	{:else}
		<div class="map-container">
			<svg
				viewBox="0 0 {viewportSize} {viewportSize}"
				class="star-map-svg"
				role="img"
				aria-label="Sector star map"
			>
				<!-- Gradient definitions for glow effects -->
				<defs>
					<radialGradient id="glow-red">
						<stop offset="0%" stop-color="#ef4444" stop-opacity="0.8" />
						<stop offset="100%" stop-color="#ef4444" stop-opacity="0" />
					</radialGradient>
					<radialGradient id="glow-green">
						<stop offset="0%" stop-color="#4ade80" stop-opacity="0.6" />
						<stop offset="100%" stop-color="#4ade80" stop-opacity="0" />
					</radialGradient>
					<radialGradient id="glow-yellow">
						<stop offset="0%" stop-color="#fbbf24" stop-opacity="0.6" />
						<stop offset="100%" stop-color="#fbbf24" stop-opacity="0" />
					</radialGradient>
					<filter id="line-glow" x="-50%" y="-50%" width="200%" height="200%">
						<feGaussianBlur stdDeviation="2" result="blur" />
						<feMerge>
							<feMergeNode in="blur" />
							<feMergeNode in="SourceGraphic" />
						</feMerge>
					</filter>
				</defs>

				<!-- Background grid -->
				<rect x="0" y="0" width={viewportSize} height={viewportSize} fill="#0f1419" />
				{#each Array(5) as _, i}
					<line
						x1={padding + (i + 1) * ((viewportSize - 2 * padding) / 5)}
						y1={padding}
						x2={padding + (i + 1) * ((viewportSize - 2 * padding) / 5)}
						y2={viewportSize - padding}
						stroke="#1e293b"
						stroke-width="0.5"
					/>
					<line
						x1={padding}
						y1={padding + (i + 1) * ((viewportSize - 2 * padding) / 5)}
						x2={viewportSize - padding}
						y2={padding + (i + 1) * ((viewportSize - 2 * padding) / 5)}
						stroke="#1e293b"
						stroke-width="0.5"
					/>
				{/each}

				<!-- Warp lanes (background - not highlighted) -->
				{#each warpGates as gate (gate.uuid)}
					{#if !isGateHighlighted(gate)}
						<line
							x1={toSvgX(gate.from.x)}
							y1={toSvgY(gate.from.y)}
							x2={toSvgX(gate.to.x)}
							y2={toSvgY(gate.to.y)}
							stroke="#374151"
							stroke-width="1"
							stroke-opacity="0.5"
							stroke-dasharray={gate.is_active ? 'none' : '4,2'}
						/>
					{/if}
				{/each}

				<!-- Warp lanes (highlighted) -->
				{#each warpGates as gate (gate.uuid)}
					{#if isGateHighlighted(gate)}
						<line
							x1={toSvgX(gate.from.x)}
							y1={toSvgY(gate.from.y)}
							x2={toSvgX(gate.to.x)}
							y2={toSvgY(gate.to.y)}
							stroke="#60a5fa"
							stroke-width="2"
							filter="url(#line-glow)"
							stroke-dasharray={gate.is_active ? 'none' : '4,2'}
						/>
					{/if}
				{/each}

				<!-- Stars -->
				{#each systems as system (system.uuid)}
					{@const isHovered = hoveredSystemUuid === system.uuid}
					{@const isConnectedToHovered =
						hoveredSystemUuid &&
						getSystemConnections(hoveredSystemUuid).some(
							(g) => g.from_system_uuid === system.uuid || g.to_system_uuid === system.uuid
						)}
					{@const color = getStarColor(system)}
					{@const glow = getStarGlow(system)}

					<!-- Glow circle for special stars -->
					{#if glow}
						<circle
							cx={toSvgX(system.x)}
							cy={toSvgY(system.y)}
							r={starRadius * 2.5}
							fill={glow}
						/>
					{/if}

					<!-- Hover highlight ring -->
					{#if isHovered || isConnectedToHovered}
						<circle
							cx={toSvgX(system.x)}
							cy={toSvgY(system.y)}
							r={starRadius + 4}
							fill="none"
							stroke={isHovered ? '#60a5fa' : '#60a5fa'}
							stroke-width="2"
							stroke-opacity={isHovered ? 1 : 0.5}
						/>
					{/if}

					<!-- Star circle -->
					<circle
						cx={toSvgX(system.x)}
						cy={toSvgY(system.y)}
						r={system.uuid === currentSystemUuid ? starRadius + 2 : starRadius}
						fill={color}
						class="star-circle"
						role="button"
						tabindex="0"
						onmouseenter={() => handleStarHover(system.uuid)}
						onmouseleave={() => handleStarHover(null)}
						onfocus={() => handleStarHover(system.uuid)}
						onblur={() => handleStarHover(null)}
					>
						<title>{system.name}</title>
					</circle>

					<!-- Current location pulse animation -->
					{#if system.uuid === currentSystemUuid}
						<circle
							cx={toSvgX(system.x)}
							cy={toSvgY(system.y)}
							r={starRadius + 2}
							fill="none"
							stroke="#ef4444"
							stroke-width="2"
							class="pulse-ring"
						/>
					{/if}
				{/each}
			</svg>

			<!-- Hover info tooltip -->
			{#if hoveredSystemUuid}
				{@const hoveredSystem = systems.find((s) => s.uuid === hoveredSystemUuid)}
				{@const connections = getSystemConnections(hoveredSystemUuid)}
				{#if hoveredSystem}
					<div class="system-tooltip">
						<div class="tooltip-name">{hoveredSystem.name}</div>
						<div class="tooltip-info">
							{#if hoveredSystem.uuid === currentSystemUuid}
								<span class="tooltip-tag current">YOU ARE HERE</span>
							{/if}
							{#if hoveredSystem.is_inhabited}
								<span class="tooltip-tag inhabited">Inhabited</span>
							{/if}
							{#if hoveredSystem.is_known}
								<span class="tooltip-tag charted">Charted</span>
							{:else if hoveredSystem.is_detected}
								<span class="tooltip-tag detected">Sensor Contact</span>
							{/if}
						</div>
						{#if connections.length > 0}
							<div class="tooltip-connections">
								{connections.length} warp lane{connections.length !== 1 ? 's' : ''}
							</div>
						{/if}
					</div>
				{/if}
			{/if}
		</div>

		<!-- Legend -->
		<div class="map-legend">
			<div class="legend-item">
				<span class="legend-dot current"></span>
				<span>Current</span>
			</div>
			<div class="legend-item">
				<span class="legend-dot charted"></span>
				<span>Charted</span>
			</div>
			<div class="legend-item">
				<span class="legend-dot detected"></span>
				<span>Detected</span>
			</div>
			<div class="legend-item">
				<span class="legend-dot unknown"></span>
				<span>Unknown</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.sector-star-map {
		background: rgba(15, 20, 25, 0.98);
		border: 1px solid #4a5568;
		border-radius: 8px;
		padding: 0.75rem;
		width: 320px;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.map-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #4a5568;
	}

	.map-title {
		font-size: 0.85rem;
		font-weight: 600;
		color: #e2e8f0;
	}

	.close-btn {
		background: none;
		border: none;
		color: #718096;
		font-size: 1.25rem;
		cursor: pointer;
		padding: 0;
		line-height: 1;
		transition: color 0.15s;
	}

	.close-btn:hover {
		color: #e2e8f0;
	}

	.loading-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 200px;
		gap: 0.75rem;
		color: #718096;
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
		to {
			transform: rotate(360deg);
		}
	}

	.error-text {
		color: #fc8181;
	}

	.retry-btn {
		padding: 0.375rem 0.75rem;
		background: rgba(66, 153, 225, 0.2);
		border: 1px solid #4299e1;
		border-radius: 4px;
		color: #63b3ed;
		cursor: pointer;
		font-size: 0.75rem;
	}

	.map-container {
		position: relative;
	}

	.star-map-svg {
		width: 100%;
		height: auto;
		border-radius: 4px;
	}

	.star-circle {
		cursor: pointer;
		transition: r 0.15s;
	}

	.star-circle:hover {
		filter: brightness(1.3);
	}

	.pulse-ring {
		animation: pulse-expand 1.5s ease-in-out infinite;
	}

	@keyframes pulse-expand {
		0%,
		100% {
			r: 8;
			opacity: 1;
		}
		50% {
			r: 14;
			opacity: 0.3;
		}
	}

	.system-tooltip {
		position: absolute;
		bottom: 0.5rem;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(26, 32, 44, 0.95);
		border: 1px solid #4a5568;
		border-radius: 4px;
		padding: 0.5rem 0.75rem;
		min-width: 150px;
		text-align: center;
	}

	.tooltip-name {
		font-size: 0.85rem;
		font-weight: 600;
		color: #e2e8f0;
		margin-bottom: 0.25rem;
	}

	.tooltip-info {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		justify-content: center;
		margin-bottom: 0.25rem;
	}

	.tooltip-tag {
		font-size: 0.6rem;
		padding: 0.1rem 0.3rem;
		border-radius: 2px;
		text-transform: uppercase;
		font-weight: 600;
	}

	.tooltip-tag.current {
		background: rgba(239, 68, 68, 0.3);
		color: #ef4444;
	}

	.tooltip-tag.inhabited {
		background: rgba(96, 165, 250, 0.2);
		color: #60a5fa;
	}

	.tooltip-tag.charted {
		background: rgba(74, 222, 128, 0.2);
		color: #4ade80;
	}

	.tooltip-tag.detected {
		background: rgba(251, 191, 36, 0.2);
		color: #fbbf24;
	}

	.tooltip-connections {
		font-size: 0.7rem;
		color: #718096;
	}

	.map-legend {
		display: flex;
		justify-content: center;
		gap: 0.75rem;
		padding-top: 0.5rem;
		border-top: 1px solid #4a5568;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.65rem;
		color: #718096;
	}

	.legend-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}

	.legend-dot.current {
		background: #ef4444;
	}

	.legend-dot.charted {
		background: #4ade80;
	}

	.legend-dot.detected {
		background: #fbbf24;
	}

	.legend-dot.unknown {
		background: #9ca3af;
	}
</style>
