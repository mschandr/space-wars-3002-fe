<script lang="ts">
	import type { SectorViewEntry, KnownSystem, KnownLane } from '$lib/types/scanning';
	import { KNOWLEDGE_COLORS, stellarColor } from '$lib/types/scanning';

	interface Props {
		sectors: SectorViewEntry[];
		knownSystems: KnownSystem[];
		knownLanes: KnownLane[];
		gridSize: number;
		playerSectorUuid: string | undefined;
		playerSystemUuid: string | undefined;
		onSectorClick?: (sectorUuid: string) => void;
		onStarHover?: (star: KnownSystem | null) => void;
		onStarSelect?: (star: KnownSystem | null) => void;
	}

	let { sectors, knownSystems, knownLanes, gridSize, playerSectorUuid, playerSystemUuid, onSectorClick, onStarHover, onStarSelect }: Props = $props();

	// Detail view interaction state
	let hoveredStar = $state<KnownSystem | null>(null);
	let selectedStar = $state<KnownSystem | null>(null);

	// Grid view interaction state
	let hoveredSector = $state<SectorViewEntry | null>(null);
	let mousePos = $state({ x: 0, y: 0 });

	// View mode: 'detail' shows stars on flat plane, 'grid' shows sector overview
	let viewMode = $state<'detail' | 'grid'>('detail');
	let focusedSectorUuid = $state<string | null>(null);

	// Grid zoom level
	let gridZoom = $state(1);
	let gridFocusX = $state(0);
	let gridFocusY = $state(0);

	// --- Grid layout constants ---
	const cellSize = 72;
	const cellGap = 2;
	const gridPad = 28;

	// --- Detail layout constants ---
	const detailW = 620;
	const detailH = 540;
	const detailPad = 50;
	const plotW = detailW - detailPad * 2;
	const plotH = detailH - detailPad - 44; // 44px for title area at top
	const plotTop = 44;

	// --- Grid derived values ---
	const gridSvgW = $derived(gridPad * 2 + gridSize * (cellSize + cellGap));
	const gridSvgH = $derived(gridPad * 2 + gridSize * (cellSize + cellGap) + 40);
	const legendY = $derived(gridPad + gridSize * (cellSize + cellGap) + 12);
	const maxGridZoom = $derived(Math.min(Math.max(Math.round(gridSize / 3), 2), 4));

	// Initialize focused sector to player's sector
	$effect(() => {
		if (!focusedSectorUuid && playerSectorUuid) {
			focusedSectorUuid = playerSectorUuid;
		}
	});

	// Focused sector entry
	const focusedSector = $derived(
		sectors.find(s => s.uuid === focusedSectorUuid) ??
		sectors.find(s => s.uuid === playerSectorUuid) ??
		null
	);

	// Systems within the focused sector (from knownSystems, using flat x/y coords)
	const sectorStars = $derived.by((): KnownSystem[] => {
		if (!focusedSector) return [];
		const b = focusedSector.bounds;
		return knownSystems.filter(s =>
			s.x >= b.x_min && s.x <= b.x_max &&
			s.y >= b.y_min && s.y <= b.y_max &&
			s.knowledge_level > 0
		);
	});

	// Star positions — all known systems in sector are shown (server already filtered)
	// Apply freshness as opacity multiplier
	const starPlots = $derived.by(() => {
		if (!focusedSector || sectorStars.length === 0) return [];
		const b = focusedSector.bounds;
		const bw = b.x_max - b.x_min || 1;
		const bh = b.y_max - b.y_min || 1;

		return sectorStars.map(sys => ({
			sys,
			x: detailPad + ((sys.x - b.x_min) / bw) * plotW,
			y: plotTop + (1 - (sys.y - b.y_min) / bh) * plotH,
			knowledgeLevel: sys.knowledge_level,
			freshness: sys.freshness,
			isPlayer: sys.poi_uuid === playerSystemUuid
		}));
	});

	// Warp lanes in this sector — clip cross-sector lanes at the plot boundary
	const detailLanes = $derived.by(() => {
		if (!focusedSector || starPlots.length === 0) return [];
		const b = focusedSector.bounds;
		const bw = b.x_max - b.x_min || 1;
		const bh = b.y_max - b.y_min || 1;

		const sectorUuids = new Set(sectorStars.map(s => s.poi_uuid));

		// Convert world coords to plot coords
		const toPlot = (wx: number, wy: number) => ({
			x: detailPad + ((wx - b.x_min) / bw) * plotW,
			y: plotTop + (1 - (wy - b.y_min) / bh) * plotH
		});

		// Look up a destination label for an external system
		const exitLabel = (poiUuid: string, wx: number, wy: number): string => {
			const sys = knownSystems.find(s => s.poi_uuid === poiUuid);
			if (sys?.name && sys.knowledge_level >= 2) return `\u2192 ${sys.name}`;
			const sectorName = findSectorForPoint(wx, wy);
			if (sectorName) return `\u2192 ${sectorName}`;
			return '\u2192 Unknown';
		};

		type LaneResult = {
			from: { x: number; y: number };
			to: { x: number; y: number };
			hasPirate: boolean;
			exit?: { point: { x: number; y: number }; label: string; edge: Edge };
		};

		return knownLanes
			.filter(lane => sectorUuids.has(lane.from_poi_uuid) || sectorUuids.has(lane.to_poi_uuid))
			.reduce<LaneResult[]>((acc, lane) => {
				const fromIn = sectorUuids.has(lane.from_poi_uuid);
				const toIn = sectorUuids.has(lane.to_poi_uuid);
				// Skip lanes where both endpoints are outside (shouldn't happen after filter, but guard)
				if (!fromIn && !toIn) return acc;

				const fromPlot = toPlot(lane.from.x, lane.from.y);
				const toPlot_ = toPlot(lane.to.x, lane.to.y);

				const result: LaneResult = { from: fromPlot, to: toPlot_, hasPirate: lane.has_pirate };

				if (!fromIn) {
					// from is external — clip it
					const clip = clipToPlot(toPlot_, fromPlot);
					if (clip) {
						result.from = clip.point;
						result.exit = { point: clip.point, label: exitLabel(lane.from_poi_uuid, lane.from.x, lane.from.y), edge: clip.edge };
					}
				} else if (!toIn) {
					// to is external — clip it
					const clip = clipToPlot(fromPlot, toPlot_);
					if (clip) {
						result.to = clip.point;
						result.exit = { point: clip.point, label: exitLabel(lane.to_poi_uuid, lane.to.x, lane.to.y), edge: clip.edge };
					}
				}

				acc.push(result);
				return acc;
			}, []);
	});

	// Grid lookup by position
	const sectorGrid = $derived.by(() => {
		const map = new Map<string, SectorViewEntry>();
		for (const s of sectors) map.set(`${s.gridX},${s.gridY}`, s);
		return map;
	});

	// Grid viewBox with zoom
	const gridViewBox = $derived.by(() => {
		if (gridZoom <= 1) return `0 0 ${gridSvgW} ${gridSvgH}`;
		const vw = gridSvgW / gridZoom;
		const vh = gridSvgH / gridZoom;
		let vx = gridFocusX - vw / 2;
		let vy = gridFocusY - vh / 2;
		vx = Math.max(0, Math.min(vx, gridSvgW - vw));
		vy = Math.max(0, Math.min(vy, gridSvgH - vh));
		return `${vx} ${vy} ${vw} ${vh}`;
	});

	// --- Helper functions ---

	// Clip a line segment to the plot rectangle boundary.
	// Given a line from `inside` (within the plot) to `outside` (beyond it),
	// returns the intersection point on the boundary and which edge was hit.
	type Edge = 'left' | 'right' | 'top' | 'bottom';
	function clipToPlot(
		inside: { x: number; y: number },
		outside: { x: number; y: number }
	): { point: { x: number; y: number }; edge: Edge } | null {
        const xMin = detailPad;
        const xMax = detailPad + plotW;
        const yMin = plotTop;
        const yMax = plotTop + plotH;
        const dx = outside.x - inside.x;
        const dy = outside.y - inside.y;
        let bestT = Infinity;
        let best: { point: { x: number; y: number }; edge: Edge } | null = null;

        if (dx !== 0) {
            let t = (xMin - inside.x) / dx;
            if (t > 0 && t <= 1) {
                const y = inside.y + t * dy;
                if (y >= yMin && y <= yMax && t < bestT) {
                    bestT = t;
                    best = { point: { x: xMin, y }, edge: 'left' };
                }
            }
            t = (xMax - inside.x) / dx;
            if (t > 0 && t <= 1) {
                const y = inside.y + t * dy;
                if (y >= yMin && y <= yMax && t < bestT) {
                    bestT = t;
                    best = { point: { x: xMax, y }, edge: 'right' };
                }
            }
        }
        if (dy !== 0) {
            let t = (yMin - inside.y) / dy;
            if (t > 0 && t <= 1) {
                const x = inside.x + t * dx;
                if (x >= xMin && x <= xMax && t < bestT) {
                    bestT = t;
                    best = { point: { x, y: yMin }, edge: 'top' };
                }
            }
            t = (yMax - inside.y) / dy;
            if (t > 0 && t <= 1) {
                const x = inside.x + t * dx;
                if (x >= xMin && x <= xMax && t < bestT) {
                    bestT = t;
                    best = { point: { x, y: yMax }, edge: 'bottom' };
                }
            }
        }
        return best;
	}

	// Find which sector contains a given world coordinate point
	function findSectorForPoint(wx: number, wy: number): string | null {
		const match = sectors.find(s =>
			wx >= s.bounds.x_min && wx <= s.bounds.x_max &&
			wy >= s.bounds.y_min && wy <= s.bounds.y_max
		);
		return match?.name ?? null;
	}

	function cellX(gx: number) { return gridPad + gx * (cellSize + cellGap); }
	function cellY(gy: number) { return gridPad + (gridSize - 1 - gy) * (cellSize + cellGap); }

	function dangerColor(level: number): string {
		if (level <= 2) return '#48bb78';
		if (level <= 4) return '#ecc94b';
		if (level <= 6) return '#f6ad55';
		if (level <= 8) return '#fc8181';
		return '#b794f4';
	}

	function dangerLabel(level: number): string {
		if (level <= 2) return 'Low';
		if (level <= 4) return 'Medium';
		if (level <= 6) return 'Elevated';
		if (level <= 8) return 'High';
		return 'Extreme';
	}

	function knowledgeStarColor(sys: KnownSystem): string {
		return stellarColor(sys);
	}

	function starSize(knowledgeLevel: number): number {
		if (knowledgeLevel <= 1) return 4;
		if (knowledgeLevel <= 2) return 5;
		if (knowledgeLevel <= 3) return 6;
		return 7;
	}

	function fogFill(fog: SectorViewEntry['fog']): string {
		switch (fog) {
			case 'revealed': return 'rgba(30, 41, 59, 0.9)';
			case 'adjacent': return 'rgba(20, 27, 40, 0.7)';
			case 'hidden': return 'rgba(8, 10, 18, 0.95)';
		}
	}

	function fogTextOpacity(fog: SectorViewEntry['fog']): number {
		switch (fog) {
			case 'revealed': return 1;
			case 'adjacent': return 0.4;
			case 'hidden': return 0.1;
		}
	}

	// Mouse tracking for grid tooltips
	function trackMouse(event: MouseEvent) {
		const svg = (event.target as Element).closest('svg');
		if (svg) {
			const r = svg.getBoundingClientRect();
			mousePos = { x: event.clientX - r.left, y: event.clientY - r.top };
		}
	}

	function handleSectorHover(sector: SectorViewEntry | null, event?: MouseEvent) {
		hoveredSector = sector;
		if (event) trackMouse(event);
	}

	function handleGridClick(sector: SectorViewEntry) {
		if (sector.fog !== 'hidden') {
			focusedSectorUuid = sector.uuid;
			gridFocusX = cellX(sector.gridX) + cellSize / 2;
			gridFocusY = cellY(sector.gridY) + cellSize / 2;
			onSectorClick?.(sector.uuid);
		}
	}

	// Detail view star click — toggle selection
	function handleStarClick(sys: KnownSystem) {
		const next = selectedStar?.poi_uuid === sys.poi_uuid ? null : sys;
		selectedStar = next;
		onStarSelect?.(next);
	}

	// Click on empty space in detail view — deselect
	function handleDetailBgClick() {
		selectedStar = null;
		onStarSelect?.(null);
	}

	// --- Zoom controls ---
	function zoomIn() {
		if (viewMode === 'grid') {
			if (gridZoom >= maxGridZoom) {
				viewMode = 'detail';
				selectedStar = null;
			} else {
				gridZoom = Math.min(gridZoom + 0.5, maxGridZoom);
			}
		}
	}

	function zoomOut() {
		if (viewMode === 'detail') {
			viewMode = 'grid';
			selectedStar = null;
			if (focusedSector) {
				gridFocusX = cellX(focusedSector.gridX) + cellSize / 2;
				gridFocusY = cellY(focusedSector.gridY) + cellSize / 2;
				gridZoom = maxGridZoom;
			}
		} else {
			gridZoom = Math.max(gridZoom - 0.5, 1);
		}
	}

	function resetView() {
		focusedSectorUuid = playerSectorUuid ?? null;
		viewMode = 'detail';
		selectedStar = null;
	}
</script>

<div class="sector-map-wrapper">
	<!-- Zoom controls -->
	<div class="zoom-controls">
		<button class="zoom-btn" onclick={zoomIn} disabled={viewMode === 'detail'} aria-label="Zoom in">+</button>
		<button class="zoom-btn" onclick={zoomOut} disabled={viewMode === 'grid' && gridZoom <= 1} aria-label="Zoom out">&minus;</button>
		<button class="zoom-btn zoom-home" onclick={resetView} aria-label="Center on player sector">&#x2302;</button>
	</div>

	{#if viewMode === 'detail' && focusedSector}
		<!-- ===== DETAIL VIEW: Stars in a single sector ===== -->
		<svg
			viewBox="0 0 {detailW} {detailH}"
			class="sector-map-svg detail-svg"
			role="img"
			aria-label="Sector detail: {focusedSector.name}"
		>
			<defs>
				<!-- Background gradient for depth -->
				<radialGradient id="space-bg" cx="50%" cy="50%" r="60%">
					<stop offset="0%" stop-color="#0c1222" />
					<stop offset="100%" stop-color="#060810" />
				</radialGradient>
				<!-- Selected star glow -->
				<filter id="star-glow">
					<feGaussianBlur stdDeviation="3" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>

			<!-- Background with gradient -->
			<rect x="0" y="0" width={detailW} height={detailH} fill="url(#space-bg)" rx="6" />

			<!-- Coordinate grid -->
			{#each Array(11) as _, i}
				{@const gx = detailPad + plotW * i / 10}
				{@const gy = plotTop + plotH * i / 10}
				<line x1={gx} y1={plotTop} x2={gx} y2={plotTop + plotH} stroke="#1a2540" stroke-width="0.5" opacity="0.6" />
				<line x1={detailPad} y1={gy} x2={detailPad + plotW} y2={gy} stroke="#1a2540" stroke-width="0.5" opacity="0.6" />
			{/each}

			<!-- Plot area border with subtle glow -->
			<rect x={detailPad} y={plotTop} width={plotW} height={plotH}
				fill="none" stroke="#1e3a5f" stroke-width="1" rx="3" opacity="0.6" />

			<!-- Sector title -->
			<text x={detailW / 2} y="18" text-anchor="middle" fill="#e2e8f0" font-size="14" font-weight="600">
				{focusedSector.name}
			</text>
			<text x={detailW / 2} y="34" text-anchor="middle" fill={dangerColor(focusedSector.danger_level)} font-size="10">
				Danger: {dangerLabel(focusedSector.danger_level)} &middot; {starPlots.length} discovered
			</text>

			<!-- Clickable background to deselect -->
			<rect x={detailPad} y={plotTop} width={plotW} height={plotH}
				fill="transparent" onclick={handleDetailBgClick} />

			<!-- Warp lanes (clipped at boundary for cross-sector lanes) -->
			{#each detailLanes as lane}
				{@const laneColor = lane.hasPirate ? '#ef4444' : '#3b82f6'}
				<line
					x1={lane.from.x} y1={lane.from.y}
					x2={lane.to.x} y2={lane.to.y}
					stroke={laneColor}
					stroke-width="1.2"
					stroke-dasharray={lane.hasPirate ? '4 2' : 'none'}
					opacity="0.35"
					pointer-events="none"
				/>
				{#if lane.exit}
					<!-- Exit marker at boundary -->
					<circle
						cx={lane.exit.point.x} cy={lane.exit.point.y} r="3"
						fill={laneColor} opacity="0.5" pointer-events="none"
					/>
					<!-- Destination label -->
					<text
						x={lane.exit.edge === 'left' ? lane.exit.point.x - 6 : lane.exit.edge === 'right' ? lane.exit.point.x + 6 : lane.exit.point.x}
						y={lane.exit.edge === 'top' ? lane.exit.point.y - 6 : lane.exit.edge === 'bottom' ? lane.exit.point.y + 10 : lane.exit.point.y + 3}
						text-anchor={lane.exit.edge === 'left' ? 'end' : lane.exit.edge === 'right' ? 'start' : 'middle'}
						fill="#a0aec0" font-size="7" pointer-events="none"
					>{lane.exit.label}</text>
				{/if}
			{/each}

			<!-- Stars (all known in sector — server already filtered by knowledge) -->
			{#each starPlots as star}
				{@const isSelected = selectedStar?.poi_uuid === star.sys.poi_uuid}
				<g
					class="star-node"
					class:clickable={true}
					onmouseenter={() => { hoveredStar = star.sys; onStarHover?.(star.sys); }}
					onmouseleave={() => { hoveredStar = null; onStarHover?.(null); }}
					onclick={() => handleStarClick(star.sys)}
				>
					<!-- Invisible hit target -->
					<circle cx={star.x} cy={star.y} r="14" fill="transparent" />

					<!-- Player system pulse ring -->
					{#if star.isPlayer}
						<circle cx={star.x} cy={star.y} r={starSize(star.knowledgeLevel) + 5}
							fill="none" stroke="#ef4444" stroke-width="1.5" class="pulse-border"
							pointer-events="none" />
					{/if}

					<!-- Selection ring -->
					{#if isSelected}
						<circle cx={star.x} cy={star.y} r={starSize(star.knowledgeLevel) + 4}
							fill="none" stroke="#fbbf24" stroke-width="1.5"
							pointer-events="none" filter="url(#star-glow)" />
					{/if}

					<!-- Star body — opacity modulated by freshness -->
					<circle cx={star.x} cy={star.y} r={starSize(star.knowledgeLevel)}
						fill={knowledgeStarColor(star.sys)}
						opacity={Math.max(0.3, star.freshness)}
						pointer-events="none"
					/>

					<!-- Name label (knowledge_level >= 2) -->
					{#if star.knowledgeLevel >= 2 && star.sys.name}
						<text x={star.x} y={star.y - starSize(star.knowledgeLevel) - 5}
							text-anchor="middle" fill="#cbd5e0" font-size="8"
							pointer-events="none"
						>{star.sys.name}</text>
					{/if}

					<!-- Inhabited marker (knowledge_level >= 2) -->
					{#if star.sys.is_inhabited && star.knowledgeLevel >= 2}
						<circle cx={star.x - starSize(star.knowledgeLevel) - 5} cy={star.y}
							r="2.5" fill="#48bb78" pointer-events="none" />
					{/if}

					<!-- Pirate warning marker -->
					{#if star.sys.pirate_warning}
						<text x={star.x + starSize(star.knowledgeLevel) + 4} y={star.y + 3}
							fill="#fc8181" font-size="8" font-weight="bold" pointer-events="none">!</text>
					{/if}
				</g>
			{/each}
		</svg>


	{:else}
		<!-- ===== GRID VIEW: Sector overview with fog of war ===== -->
		<svg
			viewBox={gridViewBox}
			class="sector-map-svg"
			role="img"
			aria-label="Sector map with fog of war"
		>
			<!-- Background -->
			<rect x="0" y="0" width={gridSvgW} height={gridSvgH} fill="#060810" rx="6" />

			<!-- Axis labels -->
			{#each Array(gridSize) as _, i}
				<text x={cellX(i) + cellSize / 2} y={gridPad - 10}
					text-anchor="middle" fill="#4a5568" font-size="9" font-family="monospace">{i}</text>
				<text x={gridPad - 12} y={cellY(i) + cellSize / 2 + 3}
					text-anchor="middle" fill="#4a5568" font-size="9" font-family="monospace">{i}</text>
			{/each}

			<!-- Sector cells -->
			{#each Array(gridSize) as _, gy}
				{#each Array(gridSize) as _, gx}
					{@const sector = sectorGrid.get(`${gx},${gy}`)}
					{@const cx = cellX(gx)}
					{@const cy = cellY(gy)}
					{@const isPlayer = sector?.uuid === playerSectorUuid}
					{@const isFocused = sector?.uuid === focusedSectorUuid}

					<g
						class="sector-cell"
						class:clickable={sector && sector.fog !== 'hidden'}
						role={sector && sector.fog !== 'hidden' ? 'button' : 'presentation'}
						tabindex={sector && sector.fog !== 'hidden' ? 0 : -1}
						onmouseenter={(e) => sector && handleSectorHover(sector, e)}
						onmousemove={(e) => sector && handleSectorHover(sector, e)}
						onmouseleave={() => handleSectorHover(null)}
						onclick={() => sector && handleGridClick(sector)}
						onkeydown={(e) => e.key === 'Enter' && sector && handleGridClick(sector)}
					>
						<rect
							x={cx} y={cy} width={cellSize} height={cellSize}
							fill={sector ? fogFill(sector.fog) : '#0a0c14'}
							stroke={isPlayer ? '#ef4444' : isFocused ? '#63b3ed' : sector && sector.fog !== 'hidden' ? dangerColor(sector.danger_level) : '#111827'}
							stroke-width={isPlayer ? 2 : isFocused ? 1.5 : 0.5}
							stroke-opacity={sector ? (sector.fog === 'hidden' ? 0.2 : sector.fog === 'adjacent' ? 0.4 : 0.8) : 0.2}
							rx="3"
						/>

						{#if sector}
							{@const textOpacity = fogTextOpacity(sector.fog)}

							{#if sector.fog === 'hidden'}
								<text x={cx + cellSize / 2} y={cy + cellSize / 2 + 4}
									text-anchor="middle" fill="#1e293b" font-size="14" font-weight="bold">?</text>
							{:else}
								<text x={cx + cellSize / 2} y={cy + 14}
									text-anchor="middle" fill="#a0aec0" font-size="7" opacity={textOpacity}
								>{sector.name.length > 10 ? sector.name.slice(0, 9) + '\u2026' : sector.name}</text>

								<text x={cx + cellSize / 2} y={cy + 30}
									text-anchor="middle" fill={dangerColor(sector.danger_level)}
									font-size="14" font-weight="bold" font-family="monospace" opacity={textOpacity}
								>{sector.total_systems}</text>

								<text x={cx + cellSize / 2} y={cy + 39}
									text-anchor="middle" fill="#4a5568" font-size="6" opacity={textOpacity}>systems</text>

								{#if sector.fog === 'revealed'}
									<text x={cx + 6} y={cy + cellSize - 6}
										fill="#718096" font-size="7" font-family="monospace"
									>{sector.scanned_systems}/{sector.total_systems}</text>
								{/if}

								{#if sector.inhabited_systems > 0}
									<circle cx={cx + cellSize / 2} cy={cy + cellSize - 10} r="3.5"
										fill="#48bb78" opacity={textOpacity * 0.8} />
									<text x={cx + cellSize / 2} y={cy + cellSize - 7.5}
										text-anchor="middle" fill="#1a202c" font-size="5" font-weight="bold"
									>{sector.inhabited_systems}</text>
								{/if}

								{#if sector.has_trading}
									<text x={cx + cellSize - 8} y={cy + cellSize - 6}
										text-anchor="middle" fill="#f59e0b" font-size="7" opacity={textOpacity}>$</text>
								{/if}
							{/if}

							{#if isPlayer}
								<rect x={cx} y={cy} width={cellSize} height={cellSize}
									fill="none" stroke="#ef4444" stroke-width="2" rx="3" class="pulse-border" />
							{/if}
						{/if}
					</g>
				{/each}
			{/each}

			<!-- Legend row -->
			<text x={gridPad} y={legendY} fill="#718096" font-size="8" font-weight="600">FOG:</text>
			<rect x={gridPad + 28} y={legendY - 8} width={10} height={10} fill="rgba(30, 41, 59, 0.9)" stroke="#48bb78" stroke-width="0.5" rx="2" />
			<text x={gridPad + 42} y={legendY} fill="#718096" font-size="7">Explored</text>
			<rect x={gridPad + 82} y={legendY - 8} width={10} height={10} fill="rgba(20, 27, 40, 0.7)" stroke="#4a5568" stroke-width="0.5" rx="2" />
			<text x={gridPad + 96} y={legendY} fill="#718096" font-size="7">Adjacent</text>
			<rect x={gridPad + 138} y={legendY - 8} width={10} height={10} fill="rgba(8, 10, 18, 0.95)" stroke="#111827" stroke-width="0.5" rx="2" />
			<text x={gridPad + 152} y={legendY} fill="#718096" font-size="7">Unknown</text>

			<text x={gridPad + 200} y={legendY} fill="#718096" font-size="8" font-weight="600">ICONS:</text>
			<circle cx={gridPad + 237} cy={legendY - 3} r="3.5" fill="#48bb78" />
			<text x={gridPad + 244} y={legendY} fill="#718096" font-size="7">Inhabited</text>
			<text x={gridPad + 286} y={legendY + 1} fill="#f59e0b" font-size="8">$</text>
			<text x={gridPad + 296} y={legendY} fill="#718096" font-size="7">Trading</text>
			<rect x={gridPad + 340} y={legendY - 8} width={10} height={10} fill="none" stroke="#ef4444" stroke-width="1.5" rx="2" />
			<text x={gridPad + 354} y={legendY} fill="#718096" font-size="7">You</text>
		</svg>

		<!-- Sector hover tooltip (grid view only) -->
		{#if hoveredSector && hoveredSector.fog !== 'hidden'}
			<div class="sector-tooltip" style="left: {mousePos.x + 14}px; top: {mousePos.y - 10}px;">
				<div class="tooltip-name">{hoveredSector.name}</div>
				<div class="tooltip-coords">Sector ({hoveredSector.gridX}, {hoveredSector.gridY})</div>
				<div class="tooltip-row">
					<span class="tooltip-label">Danger</span>
					<span class="tooltip-value" style="color: {dangerColor(hoveredSector.danger_level)}">
						{dangerLabel(hoveredSector.danger_level)} ({hoveredSector.danger_level})
					</span>
				</div>
				<div class="tooltip-row">
					<span class="tooltip-label">Systems</span>
					<span class="tooltip-value">{hoveredSector.total_systems}</span>
				</div>
				{#if hoveredSector.fog === 'revealed'}
					<div class="tooltip-row">
						<span class="tooltip-label">Known</span>
						<span class="tooltip-value">{hoveredSector.scanned_systems} / {hoveredSector.total_systems}</span>
					</div>
					<div class="tooltip-row">
						<span class="tooltip-label">Inhabited</span>
						<span class="tooltip-value">{hoveredSector.inhabited_systems}</span>
					</div>
					{#if hoveredSector.has_trading}
						<div class="tooltip-row">
							<span class="tooltip-label">Trading</span>
							<span class="tooltip-value" style="color: #f59e0b">Yes</span>
						</div>
					{/if}
					{#if hoveredSector.player_count && hoveredSector.player_count > 0}
						<div class="tooltip-row">
							<span class="tooltip-label">Players</span>
							<span class="tooltip-value">{hoveredSector.player_count}</span>
						</div>
					{/if}
				{:else}
					<div class="tooltip-partial">Partial sensor data — explore to reveal</div>
				{/if}
				{#if hoveredSector.uuid === playerSectorUuid}
					<div class="tooltip-tag-you">YOUR SECTOR</div>
				{/if}
				<div class="tooltip-hint">Click to select &middot; + to view stars</div>
			</div>
		{:else if hoveredSector}
			<div class="sector-tooltip" style="left: {mousePos.x + 14}px; top: {mousePos.y - 10}px;">
				<div class="tooltip-name">Unknown Sector</div>
				<div class="tooltip-partial">Unexplored — travel closer to reveal</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.sector-map-wrapper {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		overflow: auto;
	}

	.sector-map-svg {
		width: 100%;
		height: auto;
		max-width: 760px;
		max-height: 760px;
	}

	.detail-svg {
		max-height: 580px;
	}

	/* --- Zoom controls --- */
	.zoom-controls {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		z-index: 5;
	}

	.zoom-btn {
		width: 30px;
		height: 30px;
		border-radius: 4px;
		background: rgba(26, 32, 44, 0.9);
		border: 1px solid #4a5568;
		color: #e2e8f0;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s;
		line-height: 1;
	}

	.zoom-btn:hover:not(:disabled) {
		background: rgba(66, 153, 225, 0.3);
		border-color: #63b3ed;
	}

	.zoom-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.zoom-home {
		font-size: 0.95rem;
		margin-top: 0.25rem;
	}

	/* --- Star nodes --- */
	.star-node {
		cursor: default;
	}

	.star-node.clickable {
		cursor: pointer;
	}

	/* --- Grid cells --- */
	.sector-cell.clickable {
		cursor: pointer;
		outline: none;
	}

	.sector-cell.clickable:hover rect:first-child {
		filter: brightness(1.3);
	}

	.sector-cell.clickable:focus-visible rect:first-child {
		stroke: #63b3ed;
		stroke-width: 2;
	}

	.pulse-border {
		animation: sector-pulse 1.5s ease-in-out infinite;
	}

	@keyframes sector-pulse {
		0%, 100% { stroke-opacity: 0.5; }
		50% { stroke-opacity: 1; }
	}

	/* --- Grid tooltips --- */
	.sector-tooltip {
		position: absolute;
		background: rgba(26, 32, 44, 0.97);
		border: 1px solid #4a5568;
		border-radius: 6px;
		padding: 0.5rem 0.75rem;
		min-width: 160px;
		pointer-events: none;
		z-index: 10;
	}

	.tooltip-name {
		font-size: 0.85rem;
		font-weight: 600;
		color: #e2e8f0;
		margin-bottom: 0.125rem;
	}

	.tooltip-coords {
		font-size: 0.7rem;
		color: #718096;
		font-family: monospace;
		margin-bottom: 0.375rem;
		padding-bottom: 0.375rem;
		border-bottom: 1px solid #2d3748;
	}

	.tooltip-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.7rem;
		padding: 0.1rem 0;
	}

	.tooltip-label { color: #718096; }
	.tooltip-value { color: #e2e8f0; font-weight: 500; }

	.tooltip-partial {
		font-size: 0.65rem;
		color: #4a5568;
		font-style: italic;
		padding: 0.25rem 0;
	}

	.tooltip-tag-you {
		margin-top: 0.375rem;
		padding: 0.125rem 0.375rem;
		background: rgba(239, 68, 68, 0.2);
		color: #ef4444;
		font-size: 0.6rem;
		font-weight: 600;
		text-align: center;
		border-radius: 3px;
		text-transform: uppercase;
	}

	.tooltip-hint {
		margin-top: 0.375rem;
		font-size: 0.6rem;
		color: #4a5568;
		text-align: center;
		font-style: italic;
	}
</style>
