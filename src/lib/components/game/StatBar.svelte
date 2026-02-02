<script lang="ts">
	interface Props {
		label: string;
		current: number;
		max: number;
		color: 'red' | 'blue' | 'orange' | 'green';
		suffix?: string;
	}

	let { label, current, max, color, suffix }: Props = $props();

	const percentage = $derived(max > 0 ? Math.round((current / max) * 100) : 0);

	const colorClasses: Record<string, { bg: string; fill: string }> = {
		red: { bg: 'bg-red-900/50', fill: 'bg-gradient-to-r from-red-700 to-red-500' },
		blue: { bg: 'bg-blue-900/50', fill: 'bg-gradient-to-r from-blue-700 to-blue-500' },
		orange: { bg: 'bg-orange-900/50', fill: 'bg-gradient-to-r from-orange-700 to-orange-500' },
		green: { bg: 'bg-green-900/50', fill: 'bg-gradient-to-r from-green-700 to-green-500' }
	};

	const colors = $derived(colorClasses[color] || colorClasses.blue);
</script>

<div class="stat-bar">
	<div class="stat-header">
		<span class="stat-label">{label}</span>
		<span class="stat-value">
			{current}/{max}{suffix ? ` ${suffix}` : ''}
		</span>
	</div>
	<div class="bar-container {colors.bg}">
		<div class="bar-fill {colors.fill}" style="width: {percentage}%"></div>
	</div>
</div>

<style>
	.stat-bar {
		margin-bottom: 0.75rem;
	}

	.stat-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.25rem;
	}

	.stat-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #a0aec0;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-value {
		font-size: 0.75rem;
		color: #e2e8f0;
		font-family: monospace;
	}

	.bar-container {
		height: 8px;
		border-radius: 4px;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.bar-fill {
		height: 100%;
		transition: width 0.3s ease-out;
		border-radius: 3px;
	}

	/* Tailwind-style utility classes */
	:global(.bg-red-900\/50) {
		background-color: rgba(127, 29, 29, 0.5);
	}
	:global(.bg-blue-900\/50) {
		background-color: rgba(30, 58, 138, 0.5);
	}
	:global(.bg-orange-900\/50) {
		background-color: rgba(124, 45, 18, 0.5);
	}
	:global(.bg-green-900\/50) {
		background-color: rgba(20, 83, 45, 0.5);
	}

	:global(.bg-gradient-to-r.from-red-700.to-red-500) {
		background: linear-gradient(to right, #b91c1c, #ef4444);
	}
	:global(.bg-gradient-to-r.from-blue-700.to-blue-500) {
		background: linear-gradient(to right, #1d4ed8, #3b82f6);
	}
	:global(.bg-gradient-to-r.from-orange-700.to-orange-500) {
		background: linear-gradient(to right, #c2410c, #f97316);
	}
	:global(.bg-gradient-to-r.from-green-700.to-green-500) {
		background: linear-gradient(to right, #15803d, #22c55e);
	}
</style>
