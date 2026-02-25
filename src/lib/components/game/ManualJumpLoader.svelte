<script lang="ts">
	interface Props {
		destinationName?: string;
		message?: string;
		status?: string;
	}

	let { destinationName, message, status }: Props = $props();
</script>

<div class="jump-overlay">
	<div class="jump-container">
		<!-- Starfield effect (amber tones) -->
		<div class="starfield">
			{#each Array(80) as _, i}
				<div
					class="star-streak"
					style="
						--delay: {Math.random() * 2}s;
						--duration: {0.6 + Math.random() * 0.6}s;
						--top: {Math.random() * 100}%;
						--left: {Math.random() * 100}%;
						--size: {1 + Math.random() * 2}px;
					"
				></div>
			{/each}
		</div>

		<!-- Scanning rings (expanding from center) -->
		<div class="scan-rings">
			<div class="scan-ring ring-1"></div>
			<div class="scan-ring ring-2"></div>
			<div class="scan-ring ring-3"></div>
			<div class="scan-ring ring-4"></div>
		</div>

		<!-- Center content -->
		<div class="jump-content">
			<div class="jump-icon">
				<!-- TODO(human): Crosshair/targeting reticle SVG for the manual jump interstitial -->
				<svg viewBox="0 0 80 80" class="crosshair-svg">
					<defs>
						<radialGradient id="jumpCore" cx="50%" cy="50%" r="50%">
							<stop offset="0%" stop-color="#f6ad55" stop-opacity="0.8" />
							<stop offset="60%" stop-color="#dd6b20" stop-opacity="0.4" />
							<stop offset="100%" stop-color="#dd6b20" stop-opacity="0" />
						</radialGradient>
					</defs>
					<circle cx="40" cy="40" r="36" fill="none" stroke="#f6ad55" stroke-width="1" opacity="0.3" />
					<circle cx="40" cy="40" r="22" fill="url(#jumpCore)" class="core-glow" />
				</svg>
			</div>

			<div class="jump-text">
				{#if message}
					<p class="jump-message">{message}</p>
				{:else}
					<p class="jump-status">ENGAGING DIRECT JUMP DRIVE</p>
					{#if destinationName}
						<p class="jump-destination">
							Target: <strong>{destinationName}</strong>
						</p>
					{/if}
				{/if}
			</div>

			<div class="jump-progress">
				<div class="progress-bar">
					<div class="progress-fill"></div>
				</div>
				<span class="progress-text">{status ?? 'Calculating jump vector...'}</span>
			</div>
		</div>
	</div>
</div>

<style>
	.jump-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: radial-gradient(ellipse at center, #0f0a1a 0%, #050208 100%);
		z-index: 20000;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.jump-container {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Starfield streaks — amber tones */
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
		background: linear-gradient(90deg, transparent, #f6ad55, transparent);
		animation: streak var(--duration) var(--delay) linear infinite;
		transform-origin: center;
	}

	@keyframes streak {
		0% {
			transform: translateX(0) scaleX(1);
			opacity: 0;
		}
		10% {
			opacity: 0.8;
		}
		100% {
			transform: translateX(200px) scaleX(50);
			opacity: 0;
		}
	}

	/* Scanning rings — amber expanding outward */
	.scan-rings {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 600px;
		height: 600px;
	}

	.scan-ring {
		position: absolute;
		top: 50%;
		left: 50%;
		border: 1.5px solid rgba(246, 173, 85, 0.3);
		border-radius: 50%;
		transform: translate(-50%, -50%);
		animation: scan-pulse 2s ease-out infinite;
	}

	.scan-ring.ring-1 {
		width: 120px;
		height: 120px;
		animation-delay: 0s;
	}
	.scan-ring.ring-2 {
		width: 240px;
		height: 240px;
		animation-delay: 0.5s;
	}
	.scan-ring.ring-3 {
		width: 360px;
		height: 360px;
		animation-delay: 1s;
	}
	.scan-ring.ring-4 {
		width: 480px;
		height: 480px;
		animation-delay: 1.5s;
	}

	@keyframes scan-pulse {
		0% {
			transform: translate(-50%, -50%) scale(0.5);
			opacity: 1;
			border-color: rgba(246, 173, 85, 0.6);
		}
		100% {
			transform: translate(-50%, -50%) scale(2);
			opacity: 0;
			border-color: rgba(221, 107, 32, 0);
		}
	}

	/* Center content */
	.jump-content {
		position: relative;
		z-index: 10;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}

	.jump-icon {
		width: 120px;
		height: 120px;
	}

	.crosshair-svg {
		width: 100%;
		height: 100%;
		filter: drop-shadow(0 0 20px rgba(246, 173, 85, 0.6));
	}

	.core-glow {
		animation: core-pulse 2s ease-in-out infinite;
	}

	@keyframes core-pulse {
		0%, 100% {
			opacity: 0.7;
		}
		50% {
			opacity: 1;
		}
	}

	.jump-text {
		text-align: center;
	}

	.jump-status {
		font-size: 1.25rem;
		font-weight: 700;
		color: #f6ad55;
		letter-spacing: 0.2em;
		margin: 0;
		text-shadow: 0 0 20px rgba(246, 173, 85, 0.6);
		animation: text-flicker 2s ease-in-out infinite;
	}

	.jump-message {
		font-size: 1.1rem;
		font-weight: 600;
		color: #e2e8f0;
		margin: 0;
		text-shadow: 0 0 10px rgba(226, 232, 240, 0.4);
	}

	.jump-destination {
		font-size: 1rem;
		color: #a0aec0;
		margin: 0.5rem 0 0 0;
	}

	.jump-destination strong {
		color: #ffd700;
	}

	@keyframes text-flicker {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.8;
		}
	}

	.jump-progress {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		width: 280px;
	}

	.progress-bar {
		width: 100%;
		height: 4px;
		background: rgba(246, 173, 85, 0.2);
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		width: 30%;
		background: linear-gradient(90deg, #dd6b20, #f6ad55, #dd6b20);
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
		color: #a0846b;
		animation: text-pulse 2s ease-in-out infinite;
	}

	@keyframes text-pulse {
		0%, 100% {
			opacity: 0.6;
		}
		50% {
			opacity: 1;
		}
	}
</style>
