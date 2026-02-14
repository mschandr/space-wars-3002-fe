<script lang="ts">
	import StatBar from './StatBar.svelte';

	interface Props {
		hasShip: boolean;
		hull?: { current: number; max: number };
		shield?: { current: number; max: number; grade?: string };
		fuel?: { current: number; max: number };
		distance?: number;
		cooldown?: number;
		collision?: boolean;
		clamp?: boolean;
		compact?: boolean;
	}

	let { hasShip, hull, shield, fuel, distance, cooldown, collision, clamp, compact = false }: Props = $props();
</script>

<aside class="player-stats" class:compact>
	<div class="stats-header">
		<span class="header-icon">&#9632;</span>
		<span>Ship Status</span>
	</div>

	{#if hasShip && hull && shield && fuel}
		<div class="stats-content">
			<StatBar label="Hull" current={hull.current} max={hull.max} color="red" />

			<StatBar
				label="Shield"
				current={shield.current}
				max={shield.max}
				color="blue"
				suffix={shield.grade}
			/>

			<StatBar label="Fuel" current={fuel.current} max={fuel.max} color="orange" />

			{#if !compact}
				<div class="nav-section">
					<div class="nav-header">Nav Status</div>

					<div class="nav-indicators">
						<div class="nav-item">
							<span class="nav-label">Distance</span>
							<span class="nav-value">{distance?.toFixed(1) ?? '0.0'}</span>
						</div>

						<div class="nav-item">
							<span class="nav-label">Cooldown</span>
							<span class="nav-value">{cooldown ?? 0}</span>
						</div>

						<div class="nav-item">
							<span class="nav-label">Collision</span>
							<span class="nav-indicator" class:active={collision} class:warning={collision}>
								{collision ? 'WARN' : 'OK'}
							</span>
						</div>

						<div class="nav-item">
							<span class="nav-label">Clamp</span>
							<span class="nav-indicator" class:active={clamp}>
								{clamp ? 'LOCKED' : 'FREE'}
							</span>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<div class="no-ship-content">
			<div class="no-ship-icon">🚀</div>
			<p class="no-ship-message">No Ship Assigned</p>
			<p class="no-ship-hint">Visit the Salvage Yard to purchase a ship</p>
		</div>
	{/if}
</aside>

<style>
	.player-stats {
		width: 220px;
		background: rgba(26, 32, 44, 0.95);
		border: 1px solid #4a5568;
		border-radius: 8px;
		overflow: hidden;
	}

	.player-stats.compact {
		width: 100%;
	}

	.player-stats.compact .stats-content {
		padding: 0.5rem;
	}

	.player-stats.compact .stats-header {
		padding: 0.35rem 0.6rem;
		font-size: 0.75rem;
	}

	.stats-header {
		background: linear-gradient(to bottom, #4a5568, #2d3748);
		padding: 0.5rem 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #e2e8f0;
		font-weight: 500;
		font-size: 0.85rem;
		border-bottom: 1px solid #1a202c;
	}

	.header-icon {
		color: #4299e1;
		font-size: 0.6rem;
	}

	.stats-content {
		padding: 0.75rem;
	}

	.nav-section {
		margin-top: 1rem;
		padding-top: 0.75rem;
		border-top: 1px solid #4a5568;
	}

	.nav-header {
		font-size: 0.7rem;
		font-weight: 600;
		color: #718096;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.5rem;
	}

	.nav-indicators {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}

	.nav-item {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.nav-label {
		font-size: 0.65rem;
		color: #718096;
		text-transform: uppercase;
	}

	.nav-value {
		font-size: 0.8rem;
		color: #e2e8f0;
		font-family: monospace;
	}

	.nav-indicator {
		font-size: 0.7rem;
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
		background: rgba(72, 187, 120, 0.2);
		color: #68d391;
		display: inline-block;
		width: fit-content;
	}

	.nav-indicator.active {
		background: rgba(66, 153, 225, 0.2);
		color: #63b3ed;
	}

	.nav-indicator.warning {
		background: rgba(245, 158, 11, 0.2);
		color: #fbbf24;
	}

	/* No Ship State */
	.no-ship-content {
		padding: 1.5rem 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 0.5rem;
	}

	.no-ship-icon {
		font-size: 2rem;
		opacity: 0.5;
	}

	.no-ship-message {
		font-size: 0.9rem;
		font-weight: 600;
		color: #e2e8f0;
		margin: 0;
	}

	.no-ship-hint {
		font-size: 0.75rem;
		color: #718096;
		margin: 0;
		line-height: 1.4;
	}
</style>
