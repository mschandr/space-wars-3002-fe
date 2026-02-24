<script lang="ts">
	import type { MarketEvent } from '$lib/api';

	interface Props {
		event: MarketEvent;
		showHubName?: boolean;
		compact?: boolean;
	}

	let { event, showHubName = false, compact = false }: Props = $props();

	// Live countdown state — ticks every second
	let remainingSeconds = $state(event.time_remaining_seconds);

	$effect(() => {
		remainingSeconds = event.time_remaining_seconds;
		if (remainingSeconds == null || remainingSeconds <= 0) return;

		const interval = setInterval(() => {
			if (remainingSeconds != null && remainingSeconds > 0) {
				remainingSeconds--;
			} else {
				clearInterval(interval);
			}
		}, 1000);

		return () => clearInterval(interval);
	});

	function formatTimeRemaining(seconds: number | null): string {
		if (seconds == null || seconds <= 0) return 'EXPIRED';
		const d = Math.floor(seconds / 86400);
		const h = Math.floor((seconds % 86400) / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = Math.floor(seconds % 60);
		if (d >= 1) return `${d}d ${h}h`;
		if (h >= 1) return `${h}h ${m}m`;
		if (m >= 1) return `${m}m ${s}s`;
		return `${s}s`;
	}

	const eventColors: Record<string, { bg: string; border: string; text: string }> = {
		shortage: { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#fca5a5' },
		surplus: { bg: 'rgba(34, 197, 94, 0.15)', border: '#22c55e', text: '#86efac' },
		boom: { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#fcd34d' },
		bust: { bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6', text: '#93c5fd' }
	};

	const colors = $derived(eventColors[event.event_type] ?? eventColors.shortage);

	const priceChangeDisplay = $derived.by(() => {
		if (event.price_change_percent != null) {
			const sign = event.price_change_percent >= 0 ? '+' : '';
			return `${sign}${event.price_change_percent.toFixed(0)}%`;
		}
		if (event.price_multiplier != null) {
			const pct = (event.price_multiplier - 1) * 100;
			const sign = pct >= 0 ? '+' : '';
			return `${sign}${pct.toFixed(0)}%`;
		}
		return '';
	});
</script>

<div
	class="event-card"
	class:compact
	style="background: {colors.bg}; border-color: {colors.border};"
>
	<div class="event-top">
		<span class="event-badge" style="background: {colors.border}; color: #1a202c;">
			{event.event_type.toUpperCase()}
		</span>
		<span class="mineral-name" style="color: {colors.text};">
			{event.mineral.name}
			{#if event.mineral.symbol}
				<span class="mineral-symbol">({event.mineral.symbol})</span>
			{/if}
		</span>
		{#if priceChangeDisplay}
			<span class="price-change" style="color: {colors.text};">
				{priceChangeDisplay}
			</span>
		{/if}
	</div>

	{#if !compact}
		<div class="event-description">{event.description}</div>
	{/if}

	<div class="event-bottom">
		{#if showHubName && event.trading_hub}
			<span class="hub-name">{event.trading_hub.name}</span>
		{/if}
		<span class="countdown" class:expired={remainingSeconds == null || remainingSeconds <= 0}>
			{formatTimeRemaining(remainingSeconds)}
		</span>
	</div>
</div>

<style>
	.event-card {
		border: 1px solid;
		border-radius: 6px;
		padding: 0.625rem 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.event-card.compact {
		padding: 0.375rem 0.5rem;
		gap: 0.25rem;
	}

	.event-top {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.event-badge {
		font-size: 0.6rem;
		font-weight: 700;
		padding: 0.1rem 0.375rem;
		border-radius: 3px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.mineral-name {
		font-weight: 600;
		font-size: 0.85rem;
	}

	.mineral-symbol {
		font-weight: 400;
		font-size: 0.75rem;
		opacity: 0.7;
	}

	.price-change {
		font-weight: 700;
		font-size: 0.85rem;
		margin-left: auto;
	}

	.event-description {
		font-size: 0.75rem;
		color: #a0aec0;
		line-height: 1.3;
	}

	.event-bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.hub-name {
		font-size: 0.7rem;
		color: #718096;
	}

	.countdown {
		font-size: 0.7rem;
		color: #a0aec0;
		font-variant-numeric: tabular-nums;
		margin-left: auto;
	}

	.countdown.expired {
		color: #ef4444;
	}
</style>
