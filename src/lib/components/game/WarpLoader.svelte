<script lang="ts">
	interface Props {
		destinationName?: string;
		message?: string;
		status?: string;
	}

	let { destinationName, message, status }: Props = $props();
</script>

<div class="warp-overlay">
	<div class="warp-container">
		<!-- Starfield effect -->
		<div class="starfield">
			{#each Array(100) as _, i}
				<div
					class="star-streak"
					style="
						--delay: {Math.random() * 2}s;
						--duration: {0.5 + Math.random() * 0.5}s;
						--top: {Math.random() * 100}%;
						--left: {Math.random() * 100}%;
						--size: {1 + Math.random() * 2}px;
					"
				></div>
			{/each}
		</div>

		<!-- Warp tunnel effect -->
		<div class="warp-tunnel">
			<div class="tunnel-ring ring-1"></div>
			<div class="tunnel-ring ring-2"></div>
			<div class="tunnel-ring ring-3"></div>
			<div class="tunnel-ring ring-4"></div>
			<div class="tunnel-ring ring-5"></div>
		</div>

		<!-- Center content -->
		<div class="warp-content">
			<div class="warp-icon">
				<svg viewBox="0 0 80 80" class="warp-gate-svg">
					<!-- Outer spinning ring -->
					<circle
						cx="40"
						cy="40"
						r="36"
						fill="none"
						stroke="url(#warpGradient)"
						stroke-width="3"
						class="outer-ring"
					/>
					<!-- Inner ring -->
					<circle cx="40" cy="40" r="28" fill="none" stroke="#6bb8cc" stroke-width="2" />
					<!-- Chevrons -->
					{#each Array(9) as _, i}
						{@const angle = (i * 40 - 90) * (Math.PI / 180)}
						{@const x = 40 + 32 * Math.cos(angle)}
						{@const y = 40 + 32 * Math.sin(angle)}
						<polygon
							points="{x},{y - 4} {x - 3},{y + 3} {x + 3},{y + 3}"
							fill="#f6ad55"
							transform="rotate({i * 40}, {x}, {y})"
							class="chevron"
							style="--chevron-delay: {i * 0.1}s"
						/>
					{/each}
					<!-- Event horizon -->
					<circle cx="40" cy="40" r="22" fill="url(#warpEventHorizon)" class="event-horizon" />
					<!-- Gradients -->
					<defs>
						<linearGradient id="warpGradient" x1="0%" y1="0%" x2="100%" y2="100%">
							<stop offset="0%" stop-color="#4a90a4">
								<animate
									attributeName="stop-color"
									values="#4a90a4;#6bb8cc;#4a90a4"
									dur="2s"
									repeatCount="indefinite"
								/>
							</stop>
							<stop offset="100%" stop-color="#6bb8cc">
								<animate
									attributeName="stop-color"
									values="#6bb8cc;#4a90a4;#6bb8cc"
									dur="2s"
									repeatCount="indefinite"
								/>
							</stop>
						</linearGradient>
						<radialGradient id="warpEventHorizon">
							<stop offset="0%" stop-color="#0a1520" />
							<stop offset="40%" stop-color="#1a3a4a" />
							<stop offset="70%" stop-color="#2a5a6a" />
							<stop offset="100%" stop-color="#4a90a4" />
						</radialGradient>
					</defs>
				</svg>
			</div>

			<div class="warp-text">
				{#if message}
					<p class="warp-message">{message}</p>
				{:else}
					<p class="warp-status">INITIATING WARP DRIVE</p>
					{#if destinationName}
						<p class="warp-destination">
							Destination: <strong>{destinationName}</strong>
						</p>
					{/if}
				{/if}
			</div>

			<div class="warp-progress">
				<div class="progress-bar">
					<div class="progress-fill"></div>
				</div>
				<span class="progress-text">{status ?? 'Calculating jump coordinates...'}</span>
			</div>
		</div>
	</div>
</div>

<style>
	.warp-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: radial-gradient(ellipse at center, #0a1520 0%, #000508 100%);
		z-index: 20000;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.warp-container {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Starfield streaks */
	.starfield {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		overflow: hidden;
		perspective: 500px;
	}

	.star-streak {
		position: absolute;
		top: var(--top);
		left: var(--left);
		width: var(--size);
		height: 1px;
		background: linear-gradient(90deg, transparent, #fff, transparent);
		animation: streak var(--duration) var(--delay) linear infinite;
		transform-origin: center;
	}

	@keyframes streak {
		0% {
			transform: translateX(0) scaleX(1);
			opacity: 0;
		}
		10% {
			opacity: 1;
		}
		100% {
			transform: translateX(200px) scaleX(50);
			opacity: 0;
		}
	}

	/* Warp tunnel */
	.warp-tunnel {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 600px;
		height: 600px;
	}

	.tunnel-ring {
		position: absolute;
		top: 50%;
		left: 50%;
		border: 2px solid rgba(74, 144, 164, 0.3);
		border-radius: 50%;
		transform: translate(-50%, -50%);
		animation: tunnel-pulse 1.5s ease-out infinite;
	}

	.tunnel-ring.ring-1 {
		width: 100px;
		height: 100px;
		animation-delay: 0s;
	}

	.tunnel-ring.ring-2 {
		width: 200px;
		height: 200px;
		animation-delay: 0.3s;
	}

	.tunnel-ring.ring-3 {
		width: 300px;
		height: 300px;
		animation-delay: 0.6s;
	}

	.tunnel-ring.ring-4 {
		width: 400px;
		height: 400px;
		animation-delay: 0.9s;
	}

	.tunnel-ring.ring-5 {
		width: 500px;
		height: 500px;
		animation-delay: 1.2s;
	}

	@keyframes tunnel-pulse {
		0% {
			transform: translate(-50%, -50%) scale(0.5);
			opacity: 1;
			border-color: rgba(107, 184, 204, 0.6);
		}
		100% {
			transform: translate(-50%, -50%) scale(2);
			opacity: 0;
			border-color: rgba(74, 144, 164, 0);
		}
	}

	/* Center content */
	.warp-content {
		position: relative;
		z-index: 10;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}

	.warp-icon {
		width: 120px;
		height: 120px;
	}

	.warp-gate-svg {
		width: 100%;
		height: 100%;
		filter: drop-shadow(0 0 20px rgba(74, 144, 164, 0.6));
	}

	.outer-ring {
		animation: spin 4s linear infinite;
		transform-origin: center;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.chevron {
		animation: chevron-glow 1s ease-in-out infinite;
		animation-delay: var(--chevron-delay);
	}

	@keyframes chevron-glow {
		0%,
		100% {
			fill: #f6ad55;
			filter: drop-shadow(0 0 2px rgba(246, 173, 85, 0.5));
		}
		50% {
			fill: #ffd700;
			filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.8));
		}
	}

	.event-horizon {
		animation: horizon-pulse 2s ease-in-out infinite;
	}

	@keyframes horizon-pulse {
		0%,
		100% {
			opacity: 0.8;
		}
		50% {
			opacity: 1;
		}
	}

	.warp-text {
		text-align: center;
	}

	.warp-status {
		font-size: 1.25rem;
		font-weight: 700;
		color: #6bb8cc;
		letter-spacing: 0.2em;
		margin: 0;
		text-shadow: 0 0 20px rgba(107, 184, 204, 0.6);
		animation: text-flicker 2s ease-in-out infinite;
	}

	.warp-message {
		font-size: 1.1rem;
		font-weight: 600;
		color: #e2e8f0;
		margin: 0;
		text-shadow: 0 0 10px rgba(226, 232, 240, 0.4);
	}

	.warp-destination {
		font-size: 1rem;
		color: #a0aec0;
		margin: 0.5rem 0 0 0;
	}

	.warp-destination strong {
		color: #f6ad55;
	}

	@keyframes text-flicker {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.8;
		}
	}

	.warp-progress {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		width: 280px;
	}

	.progress-bar {
		width: 100%;
		height: 4px;
		background: rgba(74, 144, 164, 0.2);
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		width: 30%;
		background: linear-gradient(90deg, #4a90a4, #6bb8cc, #4a90a4);
		background-size: 200% 100%;
		border-radius: 2px;
		animation: progress-slide 1.5s ease-in-out infinite;
	}

	@keyframes progress-slide {
		0% {
			width: 0%;
			margin-left: 0%;
			background-position: 0% 0%;
		}
		50% {
			width: 60%;
			margin-left: 20%;
			background-position: 100% 0%;
		}
		100% {
			width: 0%;
			margin-left: 100%;
			background-position: 0% 0%;
		}
	}

	.progress-text {
		font-size: 0.75rem;
		color: #718096;
		animation: text-pulse 2s ease-in-out infinite;
	}

	@keyframes text-pulse {
		0%,
		100% {
			opacity: 0.6;
		}
		50% {
			opacity: 1;
		}
	}
</style>
