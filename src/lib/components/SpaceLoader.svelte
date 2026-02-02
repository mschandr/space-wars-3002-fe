<script lang="ts">
	interface Props {
		message?: string;
	}

	let { message = 'Loading...' }: Props = $props();
</script>

<div class="loader-container">
	<div class="galaxy-loader">
		<div class="core"></div>
		<div class="orbit orbit-1">
			<div class="planet planet-1"></div>
		</div>
		<div class="orbit orbit-2">
			<div class="planet planet-2"></div>
		</div>
		<div class="orbit orbit-3">
			<div class="planet planet-3"></div>
		</div>
		<div class="stars">
			{#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as i (i)}
				<div class="star" style="--delay: {i * 0.2}s; --angle: {i * 30}deg"></div>
			{/each}
		</div>
	</div>
	<p class="loader-message">{message}</p>
</div>

<style>
	.loader-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	.galaxy-loader {
		position: relative;
		width: 120px;
		height: 120px;
	}

	.core {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 20px;
		height: 20px;
		margin: -10px 0 0 -10px;
		background: radial-gradient(circle, #f6ad55 0%, #ed8936 50%, #dd6b20 100%);
		border-radius: 50%;
		box-shadow:
			0 0 20px #f6ad55,
			0 0 40px rgba(246, 173, 85, 0.5);
		animation: pulse-core 2s ease-in-out infinite;
	}

	@keyframes pulse-core {
		0%,
		100% {
			transform: scale(1);
			box-shadow:
				0 0 20px #f6ad55,
				0 0 40px rgba(246, 173, 85, 0.5);
		}
		50% {
			transform: scale(1.1);
			box-shadow:
				0 0 30px #f6ad55,
				0 0 60px rgba(246, 173, 85, 0.7);
		}
	}

	.orbit {
		position: absolute;
		top: 50%;
		left: 50%;
		border: 1px solid rgba(99, 179, 237, 0.3);
		border-radius: 50%;
		animation: rotate linear infinite;
	}

	.orbit-1 {
		width: 50px;
		height: 50px;
		margin: -25px 0 0 -25px;
		animation-duration: 3s;
	}

	.orbit-2 {
		width: 80px;
		height: 80px;
		margin: -40px 0 0 -40px;
		animation-duration: 5s;
		animation-direction: reverse;
	}

	.orbit-3 {
		width: 110px;
		height: 110px;
		margin: -55px 0 0 -55px;
		animation-duration: 7s;
	}

	@keyframes rotate {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.planet {
		position: absolute;
		border-radius: 50%;
	}

	.planet-1 {
		width: 8px;
		height: 8px;
		top: -4px;
		left: 50%;
		margin-left: -4px;
		background: radial-gradient(circle at 30% 30%, #63b3ed, #3182ce);
		box-shadow: 0 0 8px rgba(99, 179, 237, 0.8);
	}

	.planet-2 {
		width: 10px;
		height: 10px;
		top: -5px;
		left: 50%;
		margin-left: -5px;
		background: radial-gradient(circle at 30% 30%, #68d391, #38a169);
		box-shadow: 0 0 8px rgba(104, 211, 145, 0.8);
	}

	.planet-3 {
		width: 6px;
		height: 6px;
		top: -3px;
		left: 50%;
		margin-left: -3px;
		background: radial-gradient(circle at 30% 30%, #fc8181, #e53e3e);
		box-shadow: 0 0 8px rgba(252, 129, 129, 0.8);
	}

	.stars {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	.star {
		position: absolute;
		width: 2px;
		height: 2px;
		background: white;
		border-radius: 50%;
		top: 50%;
		left: 50%;
		transform: rotate(var(--angle)) translateY(-58px);
		animation: twinkle 1.5s ease-in-out infinite;
		animation-delay: var(--delay);
	}

	@keyframes twinkle {
		0%,
		100% {
			opacity: 0.3;
			transform: rotate(var(--angle)) translateY(-58px) scale(1);
		}
		50% {
			opacity: 1;
			transform: rotate(var(--angle)) translateY(-58px) scale(1.5);
		}
	}

	.loader-message {
		margin-top: 1.5rem;
		color: #a0aec0;
		font-size: 0.9rem;
		text-align: center;
		animation: fade-pulse 2s ease-in-out infinite;
	}

	@keyframes fade-pulse {
		0%,
		100% {
			opacity: 0.7;
		}
		50% {
			opacity: 1;
		}
	}
</style>
