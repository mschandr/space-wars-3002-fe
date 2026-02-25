<script lang="ts">
	import type { PriceSnapshot } from '$lib/priceHistory';

	interface Props {
		snapshots: PriceSnapshot[];
		field: 'buy_price' | 'sell_price';
	}

	let { snapshots, field }: Props = $props();

	const color = $derived(field === 'buy_price' ? '#4299e1' : '#68d391');

	const WIDTH = 60;
	const HEIGHT = 24;
	const PADDING = 2;

	// Precompute sparkline geometry once — shared by polyline points and circle positions
	const sparkline = $derived.by(() => {
		if (snapshots.length < 2) return null;
		const values = snapshots.map((s) => s[field]);
		const min = Math.min(...values);
		const max = Math.max(...values);
		const range = max - min || 1;
		const usableW = WIDTH - PADDING * 2;
		const usableH = HEIGHT - PADDING * 2;

		const coords = snapshots.map((s, i) => ({
			x: PADDING + (i / (snapshots.length - 1)) * usableW,
			y: PADDING + usableH - ((s[field] - min) / range) * usableH
		}));

		const pointString = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');

		return { coords, pointString };
	});

	let hoveredIndex = $state<number | null>(null);

	function handlePointHover(index: number) {
		hoveredIndex = index;
	}

	function handlePointLeave() {
		hoveredIndex = null;
	}

	function formatDate(iso: string): string {
		const d = new Date(iso);
		return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
	}
</script>

{#if !sparkline}
	<span class="sparkline-empty">--</span>
{:else}
	<span class="sparkline-container">
		<svg
			width={WIDTH}
			height={HEIGHT}
			viewBox="0 0 {WIDTH} {HEIGHT}"
			class="sparkline-svg"
		>
			<polyline
				points={sparkline.pointString}
				fill="none"
				stroke={color}
				stroke-width="1.5"
				stroke-linejoin="round"
				stroke-linecap="round"
			/>
			{#each sparkline.coords as coord, i}
				<circle
					cx={coord.x}
					cy={coord.y}
					r={hoveredIndex === i ? 3 : 1.5}
					fill={color}
					opacity={hoveredIndex === i ? 1 : 0}
					role="img"
					aria-label="Price point"
					onmouseenter={() => handlePointHover(i)}
					onmouseleave={handlePointLeave}
					style="cursor: pointer;"
				/>
				<!-- Invisible larger hit target -->
				<circle
					cx={coord.x}
					cy={coord.y}
					r="5"
					fill="transparent"
					role="img"
					aria-label="Price point hover target"
					onmouseenter={() => handlePointHover(i)}
					onmouseleave={handlePointLeave}
					style="cursor: pointer;"
				/>
			{/each}
		</svg>
		{#if hoveredIndex !== null && snapshots[hoveredIndex]}
			{@const snap = snapshots[hoveredIndex]}
			<span class="sparkline-tooltip">
				<span class="tooltip-hub">{snap.hub_name}</span>
				<span class="tooltip-price">{snap[field].toLocaleString()} cr</span>
				<span class="tooltip-date">{formatDate(snap.timestamp)}</span>
			</span>
		{/if}
	</span>
{/if}

<style>
	.sparkline-empty {
		color: #4a5568;
		font-size: 0.7rem;
		font-family: monospace;
	}

	.sparkline-container {
		position: relative;
		display: inline-flex;
		align-items: center;
	}

	.sparkline-svg {
		display: block;
	}

	.sparkline-tooltip {
		position: absolute;
		bottom: calc(100% + 4px);
		left: 50%;
		transform: translateX(-50%);
		background: rgba(26, 32, 44, 0.95);
		border: 1px solid #4a5568;
		border-radius: 4px;
		padding: 0.3rem 0.45rem;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		white-space: nowrap;
		z-index: 20;
		pointer-events: none;
	}

	.tooltip-hub {
		font-size: 0.6rem;
		color: #e2e8f0;
		font-weight: 600;
	}

	.tooltip-price {
		font-size: 0.65rem;
		color: #fbd38d;
		font-family: monospace;
	}

	.tooltip-date {
		font-size: 0.55rem;
		color: #718096;
	}
</style>
