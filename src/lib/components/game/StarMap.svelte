<script lang="ts">
	import SystemNode from './SystemNode.svelte';
	import MapLegend from './MapLegend.svelte';
	import type { MapSystemData } from '$lib/types/scanning';

	interface SystemService {
		type: string;
		name: string;
		accessible: boolean;
	}

	interface HoveredSystem {
		uuid: string;
		name: string;
		x: number;
		y: number;
		scanLevel: number;
		hasWarpGate: boolean;
		isInhabited: boolean;
		isHazardous: boolean;
		services: SystemService[];
	}

	interface Props {
		systems: MapSystemData[];
		playerPosition: { x: number; y: number; systemUuid: string };
		galaxyBounds: { width: number; height: number };
		selectedSystem: string | null;
		zoom: number;
		filters: { gates: boolean; inhabited: boolean; hazards: boolean };
		scanLevels: Record<string, number>;
		onSystemClick: (uuid: string) => void;
	}

	let {
		systems,
		playerPosition,
		galaxyBounds,
		selectedSystem,
		zoom,
		filters,
		scanLevels,
		onSystemClick
	}: Props = $props();

	let svgElement: SVGSVGElement | null = $state(null);
	let containerElement: HTMLDivElement | null = $state(null);
	let isPanning = $state(false);
	let panOffset = $state({ x: 0, y: 0 });
	let startPan = $state({ x: 0, y: 0 });

	// Tooltip state
	let hoveredSystem = $state<HoveredSystem | null>(null);
	let tooltipPosition = $state({ x: 0, y: 0 });

	function handleSystemHover(data: HoveredSystem) {
		hoveredSystem = data;
		// Convert SVG coordinates to screen position
		if (svgElement && containerElement) {
			const rect = containerElement.getBoundingClientRect();
			const svgRect = svgElement.getBoundingClientRect();
			const viewBoxParts = viewBox().split(' ').map(Number);
			const vbX = viewBoxParts[0];
			const vbY = viewBoxParts[1];
			const vbW = viewBoxParts[2];
			const vbH = viewBoxParts[3];

			// Calculate screen position from SVG coordinates
			const screenX = ((data.x - vbX) / vbW) * svgRect.width;
			const screenY = ((data.y - vbY) / vbH) * svgRect.height;

			tooltipPosition = {
				x: Math.min(screenX + 20, rect.width - 200),
				y: Math.max(screenY - 10, 10)
			};
		}
	}

	function handleSystemLeave() {
		hoveredSystem = null;
	}

	// Generate services based on scan level and system features
	function getSystemServices(system: MapSystemData, scanLevel: number): SystemService[] {
		const services: SystemService[] = [];

		// Trading Hub - visible at scan level 1+
		if (scanLevel >= 1) {
			services.push({
				type: 'trading',
				name: 'Trading Hub',
				accessible: system.is_inhabited && scanLevel >= 2
			});
		}

		// Warp Gate - visible at scan level 2+
		if (system.has_warp_gate && scanLevel >= 2) {
			services.push({
				type: 'warp',
				name: 'Warp Gate',
				accessible: scanLevel >= 3
			});
		}

		// Salvage Yard - visible at scan level 3+
		if (scanLevel >= 3) {
			services.push({
				type: 'salvage',
				name: 'Salvage Yard',
				accessible: scanLevel >= 4
			});
		}

		// Shipyard - visible at scan level 4+ and only in inhabited systems
		if (system.is_inhabited && scanLevel >= 4) {
			services.push({
				type: 'shipyard',
				name: 'Shipyard',
				accessible: scanLevel >= 5
			});
		}

		// Cartographer - visible at scan level 5+
		if (scanLevel >= 5) {
			services.push({
				type: 'cartographer',
				name: 'Cartographer',
				accessible: scanLevel >= 6
			});
		}

		return services;
	}

	// Get risk level description
	function getRiskLevel(isHazardous: boolean, scanLevel: number): { level: string; color: string } {
		if (scanLevel < 4) {
			return { level: 'Unknown', color: '#718096' };
		}
		if (isHazardous) {
			return { level: 'High Risk', color: '#ef4444' };
		}
		return { level: 'Low Risk', color: '#22c55e' };
	}

	// Service icons
	const SERVICE_ICONS: Record<string, string> = {
		trading: '\u{1F4B0}',
		warp: '\u{1F300}',
		salvage: '\u{1F527}',
		shipyard: '\u{1F680}',
		cartographer: '\u{1F5FA}',
		default: '\u2022'
	};

	const ICONS = {
		warning: '\u26A0',
		check: '\u2714',
		lock: '\u{1F512}'
	};

	function getServiceIcon(type: string): string {
		return SERVICE_ICONS[type] ?? SERVICE_ICONS.default;
	}

	// Calculate viewBox to center on player position
	const viewBoxWidth = $derived(galaxyBounds.width / zoom);
	const viewBoxHeight = $derived(galaxyBounds.height / zoom);

	const viewBox = $derived(() => {
		const centerX = playerPosition.x - viewBoxWidth / 2 + panOffset.x;
		const centerY = playerPosition.y - viewBoxHeight / 2 + panOffset.y;
		return `${centerX} ${centerY} ${viewBoxWidth} ${viewBoxHeight}`;
	});

	function handleMouseDown(e: MouseEvent) {
		if (e.button === 0) {
			isPanning = true;
			startPan = { x: e.clientX, y: e.clientY };
		}
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isPanning || !svgElement) return;

		const dx = (e.clientX - startPan.x) / zoom;
		const dy = (e.clientY - startPan.y) / zoom;

		panOffset = {
			x: panOffset.x - dx,
			y: panOffset.y - dy
		};

		startPan = { x: e.clientX, y: e.clientY };
	}

	function handleMouseUp() {
		isPanning = false;
	}

	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		// Zoom handling is done via parent component
	}

	function getScanLevel(uuid: string): number {
		return scanLevels[uuid] ?? 0;
	}
</script>

<div class="star-map-container" bind:this={containerElement}>
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<svg
		bind:this={svgElement}
		class="star-map"
		viewBox={viewBox()}
		preserveAspectRatio="xMidYMid meet"
		onmousedown={handleMouseDown}
		onmousemove={handleMouseMove}
		onmouseup={handleMouseUp}
		onmouseleave={handleMouseUp}
		onwheel={handleWheel}
		role="img"
		aria-label="Galaxy star map"
	>
		<!-- Background -->
		<rect x="0" y="0" width={galaxyBounds.width} height={galaxyBounds.height} fill="#0a0a14" />

		<!-- Grid lines (subtle) -->
		<defs>
			<pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
				<path
					d="M 100 0 L 0 0 0 100"
					fill="none"
					stroke="rgba(74, 85, 104, 0.2)"
					stroke-width="0.5"
				/>
			</pattern>
		</defs>
		<rect x="0" y="0" width={galaxyBounds.width} height={galaxyBounds.height} fill="url(#grid)" />

		<!-- System nodes -->
		{#each systems as system (system.uuid)}
			{@const scanLevel = getScanLevel(system.uuid)}
			<SystemNode
				uuid={system.uuid}
				name={system.name}
				x={system.position.x}
				y={system.position.y}
				{scanLevel}
				hasWarpGate={system.has_warp_gate}
				isInhabited={system.is_inhabited}
				isHazardous={system.is_hazardous}
				isSelected={selectedSystem === system.uuid}
				isPlayerLocation={playerPosition.systemUuid === system.uuid}
				showGates={filters.gates}
				showInhabited={filters.inhabited}
				showHazards={filters.hazards}
				services={getSystemServices(system, scanLevel)}
				onClick={onSystemClick}
				onHover={handleSystemHover}
				onLeave={handleSystemLeave}
			/>
		{/each}
	</svg>

	<!-- Selected system info overlay -->
	{#if selectedSystem}
		{@const selected = systems.find((s) => s.uuid === selectedSystem)}
		{#if selected}
			<div class="system-info-overlay">
				<h4>{selected.name}</h4>
				<p class="system-type">{selected.type}</p>
				<p class="scan-level">Scan Level: {getScanLevel(selected.uuid)}</p>
			</div>
		{/if}
	{/if}

	<!-- Legend -->
	<MapLegend />

	<!-- Hover Tooltip -->
	{#if hoveredSystem}
		{@const risk = getRiskLevel(hoveredSystem.isHazardous, hoveredSystem.scanLevel)}
		<div class="system-tooltip" style="left: {tooltipPosition.x}px; top: {tooltipPosition.y}px;">
			<div class="tooltip-header">
				<h4>{hoveredSystem.name}</h4>
				<span class="scan-badge">L{hoveredSystem.scanLevel}</span>
			</div>

			<!-- Risk indicator -->
			<div class="tooltip-risk" style="color: {risk.color}">
				<span class="risk-icon">{hoveredSystem.isHazardous ? ICONS.warning : ICONS.check}</span>
				<span>{risk.level}</span>
			</div>

			<!-- Services list -->
			{#if hoveredSystem.services.length > 0}
				<div class="tooltip-services">
					<div class="services-label">Services</div>
					{#each hoveredSystem.services as service (service.type)}
						<div class="service-item" class:locked={!service.accessible}>
							<span class="service-icon">{getServiceIcon(service.type)}</span>
							<span class="service-name">{service.name}</span>
							{#if !service.accessible}
								<span class="lock-icon">{ICONS.lock}</span>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<div class="no-services">No services discovered</div>
			{/if}

			<!-- Features -->
			<div class="tooltip-features">
				{#if hoveredSystem.hasWarpGate && hoveredSystem.scanLevel >= 2}
					<span class="feature-badge warp">Warp Gate</span>
				{/if}
				{#if hoveredSystem.isInhabited && hoveredSystem.scanLevel >= 3}
					<span class="feature-badge inhabited">Inhabited</span>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.star-map-container {
		position: relative;
		flex: 1;
		background: #0a0a14;
		border-radius: 4px;
		overflow: hidden;
	}

	.star-map {
		width: 100%;
		height: 100%;
		cursor: grab;
	}

	.star-map:active {
		cursor: grabbing;
	}

	.system-info-overlay {
		position: absolute;
		top: 1rem;
		left: 1rem;
		background: rgba(26, 32, 44, 0.95);
		border: 1px solid #4a5568;
		border-radius: 6px;
		padding: 0.75rem 1rem;
		min-width: 150px;
	}

	.system-info-overlay h4 {
		margin: 0 0 0.25rem 0;
		color: #e2e8f0;
		font-size: 0.9rem;
		font-weight: 600;
	}

	.system-type {
		margin: 0;
		font-size: 0.75rem;
		color: #718096;
		text-transform: uppercase;
	}

	.scan-level {
		margin: 0.5rem 0 0 0;
		font-size: 0.8rem;
		color: #a0aec0;
	}

	/* Hover Tooltip */
	.system-tooltip {
		position: absolute;
		background: rgba(26, 32, 44, 0.98);
		border: 1px solid #4a5568;
		border-radius: 6px;
		padding: 0.75rem;
		min-width: 180px;
		max-width: 220px;
		z-index: 20;
		pointer-events: none;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
	}

	.tooltip-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #4a5568;
	}

	.tooltip-header h4 {
		margin: 0;
		color: #e2e8f0;
		font-size: 0.9rem;
		font-weight: 600;
	}

	.scan-badge {
		background: rgba(99, 179, 237, 0.2);
		color: #63b3ed;
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
		font-size: 0.7rem;
		font-weight: 600;
	}

	.tooltip-risk {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8rem;
		font-weight: 500;
		margin-bottom: 0.5rem;
	}

	.risk-icon {
		font-size: 0.9rem;
	}

	.tooltip-services {
		margin-bottom: 0.5rem;
	}

	.services-label {
		font-size: 0.65rem;
		color: #718096;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.375rem;
	}

	.service-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0;
		font-size: 0.8rem;
		color: #e2e8f0;
	}

	.service-item.locked {
		color: #718096;
	}

	.service-icon {
		font-size: 0.85rem;
		width: 1.25rem;
		text-align: center;
	}

	.service-name {
		flex: 1;
	}

	.lock-icon {
		font-size: 0.7rem;
		opacity: 0.7;
	}

	.no-services {
		font-size: 0.75rem;
		color: #718096;
		font-style: italic;
		margin-bottom: 0.5rem;
	}

	.tooltip-features {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.feature-badge {
		font-size: 0.65rem;
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
		font-weight: 600;
		text-transform: uppercase;
	}

	.feature-badge.warp {
		background: rgba(168, 85, 247, 0.2);
		color: #a855f7;
	}

	.feature-badge.inhabited {
		background: rgba(34, 197, 94, 0.2);
		color: #22c55e;
	}
</style>
