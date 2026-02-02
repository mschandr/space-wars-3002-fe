<script lang="ts">
	interface Props {
		showNebula?: boolean;
	}

	let { showNebula = true }: Props = $props();
</script>

<div class="space-backdrop" class:with-nebula={showNebula}>
	<div class="layer nebula-layer"></div>
	<div class="layer stars-layer"></div>
	<div class="layer dust-layer"></div>
</div>

<style>
	.space-backdrop {
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: -1;
		overflow: hidden;
		background: #0a0a14;
	}

	.layer {
		position: absolute;
		inset: -50%;
		width: 200%;
		height: 200%;
	}

	/* Base nebula layer - static */
	.nebula-layer {
		background-image: url('/nursery.jpg.webp');
		background-size: cover;
		background-position: center;
		opacity: 0.6;
	}

	.space-backdrop:not(.with-nebula) .nebula-layer {
		display: none;
	}

	/* Star speckle layer - slow drift */
	.stars-layer {
		background-image:
			radial-gradient(1px 1px at 20px 30px, white, transparent),
			radial-gradient(1px 1px at 40px 70px, rgba(255, 255, 255, 0.8), transparent),
			radial-gradient(1px 1px at 50px 160px, rgba(255, 255, 255, 0.6), transparent),
			radial-gradient(1px 1px at 90px 40px, white, transparent),
			radial-gradient(1px 1px at 130px 80px, rgba(255, 255, 255, 0.7), transparent),
			radial-gradient(1px 1px at 160px 120px, white, transparent),
			radial-gradient(1.5px 1.5px at 200px 50px, rgba(200, 220, 255, 0.9), transparent),
			radial-gradient(1px 1px at 220px 140px, rgba(255, 255, 255, 0.6), transparent),
			radial-gradient(1px 1px at 260px 90px, white, transparent),
			radial-gradient(1.5px 1.5px at 300px 170px, rgba(255, 200, 150, 0.8), transparent),
			radial-gradient(1px 1px at 340px 30px, rgba(255, 255, 255, 0.7), transparent),
			radial-gradient(1px 1px at 380px 110px, white, transparent),
			radial-gradient(1px 1px at 420px 60px, rgba(255, 255, 255, 0.5), transparent),
			radial-gradient(1.5px 1.5px at 460px 150px, rgba(150, 200, 255, 0.9), transparent),
			radial-gradient(1px 1px at 500px 100px, white, transparent);
		background-size: 520px 180px;
		background-repeat: repeat;
		opacity: 0.5;
		animation: drift-stars 120s linear infinite;
	}

	/* Dust layer - different direction, slower */
	.dust-layer {
		background-image:
			radial-gradient(ellipse 100px 60px at 100px 100px, rgba(100, 120, 180, 0.03), transparent),
			radial-gradient(ellipse 80px 50px at 300px 200px, rgba(180, 100, 120, 0.02), transparent),
			radial-gradient(ellipse 120px 70px at 500px 150px, rgba(100, 180, 150, 0.02), transparent);
		background-size: 600px 300px;
		background-repeat: repeat;
		opacity: 0.4;
		animation: drift-dust 180s linear infinite reverse;
	}

	@keyframes drift-stars {
		0% {
			transform: translate3d(0, 0, 0);
		}
		100% {
			transform: translate3d(-260px, -90px, 0);
		}
	}

	@keyframes drift-dust {
		0% {
			transform: translate3d(0, 0, 0);
		}
		100% {
			transform: translate3d(150px, -75px, 0);
		}
	}

	/* Respect prefers-reduced-motion */
	@media (prefers-reduced-motion: reduce) {
		.stars-layer,
		.dust-layer {
			animation: none;
			transform: none;
		}
	}
</style>
