<script lang="ts">
	import type { PriceSnapshot } from '$lib/priceHistory';

	interface Props {
		snapshots: PriceSnapshot[];
		mineralName: string;
		onClose: () => void;
	}

	let { snapshots, mineralName, onClose }: Props = $props();

	// --- Constants ---
	const WIDTH = 300;
	const HEIGHT = 150;
	const PAD = { top: 28, right: 12, bottom: 24, left: 48 };
	const CHART_W = WIDTH - PAD.left - PAD.right;
	const CHART_H = HEIGHT - PAD.top - PAD.bottom;
	const BUY_COLOR = '#4299e1';
	const SELL_COLOR = '#68d391';

	// --- Derived data ---
	const allPrices = $derived(snapshots.flatMap((s) => [s.buy_price, s.sell_price]));
	const rawMin = $derived(Math.min(...allPrices));
	const rawMax = $derived(Math.max(...allPrices));
	const yPadding = $derived((rawMax - rawMin) * 0.05 || 1);
	const yMin = $derived(rawMin - yPadding);
	const yMax = $derived(rawMax + yPadding);
	const yRange = $derived(yMax - yMin || 1);

	function toX(i: number): number {
		return PAD.left + (i / (snapshots.length - 1)) * CHART_W;
	}

	function toY(val: number): number {
		return PAD.top + CHART_H - ((val - yMin) / yRange) * CHART_H;
	}

	const buyPoints = $derived(
		snapshots.map((s, i) => `${toX(i).toFixed(1)},${toY(s.buy_price).toFixed(1)}`).join(' ')
	);

	const sellPoints = $derived(
		snapshots.map((s, i) => `${toX(i).toFixed(1)},${toY(s.sell_price).toFixed(1)}`).join(' ')
	);

	// --- Y-axis ticks ---
	const yTicks = $derived.by(() => {
		const count = 4;
		const ticks: { value: number; y: number }[] = [];
		for (let i = 0; i <= count; i++) {
			const value = yMin + (yRange * i) / count;
			ticks.push({ value, y: toY(value) });
		}
		return ticks;
	});

	// --- X-axis labels ---
	const xLabels = $derived.by(() => {
		const count = Math.min(4, snapshots.length);
		const labels: { text: string; x: number }[] = [];
		for (let i = 0; i < count; i++) {
			const idx = Math.round((i / (count - 1)) * (snapshots.length - 1));
			const d = new Date(snapshots[idx].timestamp);
			labels.push({
				text: `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`,
				x: toX(idx)
			});
		}
		return labels;
	});

	// --- Hover state ---
	let hoveredIndex = $state<number | null>(null);
	let mouseX = $state(0);
	let mouseY = $state(0);

	function handleMouseMove(e: MouseEvent) {
		const svg = e.currentTarget as SVGSVGElement;
		const rect = svg.getBoundingClientRect();
		const relX = e.clientX - rect.left;
		const relY = e.clientY - rect.top;
		// Scale from DOM coords to viewBox coords
		const scaleX = WIDTH / rect.width;
		const scaleY = HEIGHT / rect.height;
		mouseX = relX * scaleX;
		mouseY = relY * scaleY;

		// Find nearest data index
		const chartX = mouseX - PAD.left;
		if (chartX < 0 || chartX > CHART_W) {
			hoveredIndex = null;
			return;
		}
		const ratio = chartX / CHART_W;
		const idx = Math.round(ratio * (snapshots.length - 1));
		hoveredIndex = Math.max(0, Math.min(idx, snapshots.length - 1));
	}

	function handleMouseLeave() {
		hoveredIndex = null;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}

	function formatPrice(n: number): string {
		if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
		if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
		return n.toFixed(0);
	}

	function formatDate(iso: string): string {
		const d = new Date(iso);
		return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Backdrop -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="chart-backdrop" onclick={onClose} onkeydown={() => {}}>
	<!-- Panel (stop propagation so clicking panel doesn't close) -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="chart-panel" onclick={(e) => e.stopPropagation()} onkeydown={() => {}}>
		<!-- Header -->
		<div class="chart-header">
			<span class="chart-title">{mineralName} — Price History</span>
			<div class="chart-legend">
				<span class="legend-item">
					<span class="legend-line" style="background: {BUY_COLOR};"></span> Buy
				</span>
				<span class="legend-item">
					<span class="legend-line" style="background: {SELL_COLOR};"></span> Sell
				</span>
			</div>
			<button class="chart-close" onclick={onClose} title="Close (Esc)">&times;</button>
		</div>

		<!-- SVG Chart -->
		<svg
			width="100%"
			viewBox="0 0 {WIDTH} {HEIGHT}"
			class="chart-svg"
			onmousemove={handleMouseMove}
			onmouseleave={handleMouseLeave}
		>
			<!-- Gridlines -->
			{#each yTicks as tick}
				<line
					x1={PAD.left}
					y1={tick.y}
					x2={WIDTH - PAD.right}
					y2={tick.y}
					stroke="#4a5568"
					stroke-width="0.5"
					stroke-dasharray="3,3"
				/>
				<text
					x={PAD.left - 4}
					y={tick.y + 3}
					text-anchor="end"
					fill="#718096"
					font-size="8"
				>
					{formatPrice(tick.value)}
				</text>
			{/each}

			<!-- X-axis labels -->
			{#each xLabels as label}
				<text
					x={label.x}
					y={HEIGHT - 4}
					text-anchor="middle"
					fill="#718096"
					font-size="7"
				>
					{label.text}
				</text>
			{/each}

			<!-- Data lines -->
			<polyline
				points={buyPoints}
				fill="none"
				stroke={BUY_COLOR}
				stroke-width="1.8"
				stroke-linejoin="round"
				stroke-linecap="round"
			/>
			<polyline
				points={sellPoints}
				fill="none"
				stroke={SELL_COLOR}
				stroke-width="1.8"
				stroke-linejoin="round"
				stroke-linecap="round"
			/>

			<!-- Hover crosshair + data points -->
			{#if hoveredIndex !== null}
				{@const snap = snapshots[hoveredIndex]}
				{@const cx = toX(hoveredIndex)}
				<!-- Vertical crosshair -->
				<line
					x1={cx}
					y1={PAD.top}
					x2={cx}
					y2={PAD.top + CHART_H}
					stroke="#a0aec0"
					stroke-width="0.5"
					stroke-dasharray="2,2"
				/>
				<!-- Buy dot -->
				<circle cx={cx} cy={toY(snap.buy_price)} r="3" fill={BUY_COLOR} />
				<!-- Sell dot -->
				<circle cx={cx} cy={toY(snap.sell_price)} r="3" fill={SELL_COLOR} />
			{/if}
		</svg>

		<!-- HTML Tooltip (positioned below chart) -->
		{#if hoveredIndex !== null}
			{@const snap = snapshots[hoveredIndex]}
			<!-- TODO(human): Design the tooltip content layout -->
			<div class="chart-tooltip">
				Implement tooltip here
			</div>
		{/if}
	</div>
</div>

<style>
	.chart-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 50;
	}

	.chart-panel {
		background: rgba(26, 32, 44, 0.97);
		border: 1px solid #4a5568;
		border-radius: 8px;
		padding: 0.75rem;
		width: 340px;
		max-width: 95vw;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
	}

	.chart-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.chart-title {
		font-size: 0.8rem;
		font-weight: 600;
		color: #e2e8f0;
		flex: 1;
	}

	.chart-legend {
		display: flex;
		gap: 0.6rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.65rem;
		color: #a0aec0;
	}

	.legend-line {
		display: inline-block;
		width: 12px;
		height: 2px;
		border-radius: 1px;
	}

	.chart-close {
		background: none;
		border: none;
		color: #718096;
		font-size: 1.1rem;
		cursor: pointer;
		padding: 0 0.25rem;
		line-height: 1;
		transition: color 0.15s;
	}

	.chart-close:hover {
		color: #e2e8f0;
	}

	.chart-svg {
		display: block;
		width: 100%;
		height: auto;
	}

	.chart-tooltip {
		background: rgba(45, 55, 72, 0.95);
		border: 1px solid #4a5568;
		border-radius: 4px;
		padding: 0.4rem 0.6rem;
		font-size: 0.7rem;
		color: #e2e8f0;
		margin-top: 0.35rem;
	}
</style>
