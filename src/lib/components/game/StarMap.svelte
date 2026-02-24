<script lang="ts">
	import SystemNode from './SystemNode.svelte';
	import MapLegend from './MapLegend.svelte';
	import type { KnownSystem, KnownLane, DangerZone } from '$lib/types/scanning';
	import { KNOWLEDGE_COLORS, stellarColor } from '$lib/types/scanning';

	interface HoveredSystem {
		uuid: string;
		name: string;
		x: number;
		y: number;
		scanLevel: number;
		hasWarpGate: boolean;
		isInhabited: boolean;
		isHazardous: boolean;
		services: { type: string; name: string; accessible: boolean }[];
		knowledgeLabel?: string;
		freshness?: number;
	}

	interface Props {
		knownSystems: KnownSystem[];
		knownLanes?: KnownLane[];
		dangerZones?: DangerZone[];
		sensorRange?: number;
		playerPosition: { x: number; y: number; systemUuid: string };
		galaxyBounds: { width: number; height: number };
		selectedSystem: string | null;
		zoom: number;
		filters: { gates: boolean; inhabited: boolean; hazards: boolean };
		onSystemClick: (uuid: string) => void;
	}

	let {
		knownSystems,
		knownLanes = [],
		dangerZones = [],
		sensorRange = 0,
		playerPosition,
		galaxyBounds,
		selectedSystem,
		zoom,
		filters,
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

	// Derive services from KnownSystem.services object (knowledge_level 3+)
	function getSystemServices(sys: KnownSystem): { type: string; name: string; accessible: boolean }[] {
		if (!sys.services || sys.knowledge_level < 3) return [];
		const result: { type: string; name: string; accessible: boolean }[] = [];
		for (const [key, available] of Object.entries(sys.services)) {
			result.push({
				type: key,
				name: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
				accessible: available
			});
		}
		return result;
	}

	// Build set of systems that have warp gates (appear in any known lane)
	const systemsWithGates = $derived.by(() => {
		const s = new Set<string>();
		for (const lane of knownLanes) {
			s.add(lane.from_uuid);
			s.add(lane.to_uuid);
		}
		return s;
	});

	// Get risk level description
	function getRiskLevel(sys: KnownSystem): { level: string; color: string } {
		if (sys.knowledge_level < 3) {
			return { level: 'Unknown', color: '#718096' };
		}
		if (sys.pirate_warning) {
			return { level: 'High Risk', color: '#ef4444' };
		}
		return { level: 'Low Risk', color: '#22c55e' };
	}

	// Service icons
	const SERVICE_ICONS: Record<string, string> = {
		trading_hub: '\u{1F4B0}',
		trading: '\u{1F4B0}',
		warp_gate: '\u{1F300}',
		warp: '\u{1F300}',
		salvage_yard: '\u{1F527}',
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

	// Lane highlight check
	function isLaneHighlighted(lane: KnownLane): boolean {
		if (!hoveredSystem) return false;
		return lane.from_uuid === hoveredSystem.uuid || lane.to_uuid === hoveredSystem.uuid;
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
			<filter id="line-glow" x="-50%" y="-50%" width="200%" height="200%">
				<feGaussianBlur stdDeviation="2" result="blur" />
				<feMerge>
					<feMergeNode in="blur" />
					<feMergeNode in="SourceGraphic" />
				</feMerge>
			</filter>
		</defs>
		<rect x="0" y="0" width={galaxyBounds.width} height={galaxyBounds.height} fill="url(#grid)" />

		<!-- Danger zones (translucent red circles) -->
		{#each dangerZones as zone}
			<circle
				cx={zone.center.x}
				cy={zone.center.y}
				r={zone.radius_ly}
				fill="rgba(239, 68, 68, 0.08)"
				stroke="#ef4444"
				stroke-width="1"
				stroke-dasharray="6,3"
				stroke-opacity={zone.confidence * 0.6}
				pointer-events="none"
			/>
		{/each}

		<!-- Sensor range circle (blue dashed, centered on player) -->
		{#if sensorRange > 0}
			<circle
				cx={playerPosition.x}
				cy={playerPosition.y}
				r={sensorRange}
				fill="none"
				stroke="#3b82f6"
				stroke-width="1"
				stroke-dasharray="8,4"
				stroke-opacity="0.4"
				pointer-events="none"
			/>
		{/if}

		<!-- Warp lanes (background — non-highlighted) -->
		{#each knownLanes as lane (lane.gate_uuid)}
			{#if !isLaneHighlighted(lane)}
				<line
					x1={lane.from.x}
					y1={lane.from.y}
					x2={lane.to.x}
					y2={lane.to.y}
					stroke={lane.has_pirate ? '#dc2626' : '#374151'}
					stroke-width={lane.has_pirate ? 1.5 : 1}
					stroke-opacity={lane.has_pirate ? 0.6 : 0.5}
					stroke-dasharray={lane.has_pirate ? '4,2' : 'none'}
				/>
			{/if}
		{/each}

		<!-- Warp lanes (highlighted — connected to hovered system) -->
		{#each knownLanes as lane (lane.gate_uuid)}
			{#if isLaneHighlighted(lane)}
				<line
					x1={lane.from.x}
					y1={lane.from.y}
					x2={lane.to.x}
					y2={lane.to.y}
					stroke={lane.has_pirate ? '#ef4444' : '#60a5fa'}
					stroke-width="2"
					filter="url(#line-glow)"
					stroke-dasharray={lane.has_pirate ? '4,2' : 'none'}
				/>
			{/if}
		{/each}

		<!-- System nodes -->
		{#each knownSystems as sys (sys.uuid)}
			<SystemNode
				uuid={sys.uuid}
				name={sys.name ?? '???'}
				x={sys.x}
				y={sys.y}
				scanLevel={sys.knowledge_level}
				color={stellarColor(sys)}
				hasWarpGate={systemsWithGates.has(sys.uuid)}
				isInhabited={sys.is_inhabited ?? false}
				isHazardous={sys.pirate_warning ?? false}
				isSelected={selectedSystem === sys.uuid}
				isPlayerLocation={playerPosition.systemUuid === sys.uuid}
				showGates={filters.gates}
				showInhabited={filters.inhabited}
				showHazards={filters.hazards}
				services={getSystemServices(sys)}
				onClick={onSystemClick}
				onHover={(data) => handleSystemHover({ ...data, knowledgeLabel: sys.knowledge_label, freshness: sys.freshness })}
				onLeave={handleSystemLeave}
			/>
		{/each}
	</svg>

	<!-- Selected system info overlay -->
	{#if selectedSystem}
		{@const selected = knownSystems.find((s) => s.uuid === selectedSystem)}
		{#if selected}
			<div class="system-info-overlay">
				<h4>{selected.name ?? '???'}</h4>
				<p class="system-type">{selected.knowledge_label}</p>
				{#if selected.stellar_class}
					<p class="scan-level">{selected.stellar_class}{selected.stellar_description ? ' — ' + selected.stellar_description : ''}</p>
				{/if}
			</div>
		{/if}
	{/if}

	<!-- Legend -->
	<MapLegend />

	<!-- Hover Tooltip -->
	{#if hoveredSystem}
		{@const risk = getRiskLevel(knownSystems.find(s => s.uuid === hoveredSystem?.uuid) ?? { knowledge_level: 0, pirate_warning: false } as KnownSystem)}
		<div class="system-tooltip" style="left: {tooltipPosition.x}px; top: {tooltipPosition.y}px;">
			<div class="tooltip-header">
				<h4>{hoveredSystem.name}</h4>
				<span class="scan-badge">{hoveredSystem.knowledgeLabel ?? `L${hoveredSystem.scanLevel}`}</span>
			</div>

			<!-- Freshness indicator -->
			{#if hoveredSystem.freshness !== undefined && hoveredSystem.freshness < 0.3}
				<div class="tooltip-stale">Stale intel</div>
			{/if}

			<!-- Risk indicator -->
			<div class="tooltip-risk" style="color: {risk.color}">
				<span class="risk-icon">{risk.level === 'High Risk' ? ICONS.warning : ICONS.check}</span>
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
				{#if hoveredSystem.isInhabited && hoveredSystem.scanLevel >= 2}
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

	.tooltip-stale {
		font-size: 0.65rem;
		color: #f6ad55;
		font-style: italic;
		margin-bottom: 0.25rem;
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

	.feature-badge.inhabited {
		background: rgba(34, 197, 94, 0.2);
		color: #22c55e;
	}
</style>
