<script lang="ts">
	interface Props {
		price: number;
		basePrice?: number;
		showIndicator?: boolean;
		size?: 'sm' | 'md' | 'lg';
	}

	let { price, basePrice, showIndicator = false, size = 'md' }: Props = $props();

	const priceDiff = $derived(basePrice ? price - basePrice : 0);
	const diffPercent = $derived(basePrice ? Math.round((priceDiff / basePrice) * 100) : 0);

	const indicatorClass = $derived(() => {
		if (!showIndicator || !basePrice) return '';
		if (priceDiff > 0) return 'price-high';
		if (priceDiff < 0) return 'price-low';
		return 'price-neutral';
	});

	const sizeClass = $derived(() => {
		switch (size) {
			case 'sm':
				return 'text-sm';
			case 'lg':
				return 'text-lg';
			default:
				return 'text-md';
		}
	});

	function formatPrice(value: number): string {
		return value.toLocaleString();
	}
</script>

<span class="price-display {sizeClass()} {indicatorClass()}">
	<span class="credits-symbol">C</span>
	<span class="credits-value">{formatPrice(price)}</span>
	{#if showIndicator && basePrice && priceDiff !== 0}
		<span class="price-indicator">
			{priceDiff > 0 ? '+' : ''}{diffPercent}%
		</span>
	{/if}
</span>

<style>
	.price-display {
		display: inline-flex;
		align-items: center;
		gap: 0.125rem;
		font-family: monospace;
	}

	.credits-symbol {
		color: #f6ad55;
		font-weight: 600;
	}

	.credits-value {
		color: #e2e8f0;
	}

	.price-indicator {
		font-size: 0.7em;
		margin-left: 0.25rem;
		padding: 0.1rem 0.25rem;
		border-radius: 3px;
	}

	.price-high .price-indicator {
		background: rgba(239, 68, 68, 0.2);
		color: #fc8181;
	}

	.price-low .price-indicator {
		background: rgba(72, 187, 120, 0.2);
		color: #68d391;
	}

	.price-neutral .price-indicator {
		background: rgba(160, 174, 192, 0.2);
		color: #a0aec0;
	}

	.text-sm {
		font-size: 0.75rem;
	}

	.text-md {
		font-size: 0.875rem;
	}

	.text-lg {
		font-size: 1rem;
	}
</style>
