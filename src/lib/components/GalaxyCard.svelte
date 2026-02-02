<script lang="ts">
	import type { GalaxySummary } from '$lib/api';

	interface Props {
		galaxy: GalaxySummary;
		onEnter: (galaxy: GalaxySummary) => void;
		onViewMap: (galaxy: GalaxySummary) => void;
	}

	let { galaxy, onEnter, onViewMap }: Props = $props();

	function getSizeLabel(size: string): string {
		return size.charAt(0).toUpperCase() + size.slice(1);
	}

	function getModeLabel(mode: string): string {
		switch (mode) {
			case 'single_player':
				return 'Solo';
			case 'multiplayer':
				return 'Multiplayer';
			case 'mixed':
				return 'Mixed';
			default:
				return mode;
		}
	}

	// Generate a pseudo-random hue based on galaxy name for the image gradient
	function getGalaxyHue(name: string): number {
		let hash = 0;
		for (let i = 0; i < name.length; i++) {
			hash = name.charCodeAt(i) + ((hash << 5) - hash);
		}
		return Math.abs(hash) % 360;
	}

	const hue = getGalaxyHue(galaxy.name);
</script>

<div class="galaxy-card">
	<div class="galaxy-image" style="--hue: {hue}">
		<div class="galaxy-spiral"></div>
	</div>

	<div class="galaxy-info">
		<h3 class="galaxy-name">{galaxy.name}</h3>

		<div class="galaxy-meta">
			<span class="size-badge">{getSizeLabel(galaxy.size)}</span>
			<span class="mode-badge">{getModeLabel(galaxy.mode)}</span>
		</div>

		<div class="galaxy-stats">
			<span class="player-count">{galaxy.players} Players</span>
		</div>

		<div class="button-row">
			<button class="btn btn-continue" onclick={() => onEnter(galaxy)}>Continue</button>
			<button class="btn btn-map" onclick={() => onViewMap(galaxy)}>View Map</button>
		</div>
	</div>
</div>

<style>
	.galaxy-card {
		background: rgba(26, 32, 44, 0.95);
		border: 1px solid #4a5568;
		border-radius: 8px;
		overflow: hidden;
		transition: all 0.2s;
	}

	.galaxy-card:hover {
		border-color: #63b3ed;
		box-shadow: 0 0 20px rgba(99, 179, 237, 0.2);
	}

	.galaxy-image {
		height: 140px;
		background:
			radial-gradient(
				ellipse at center,
				hsl(var(--hue), 60%, 30%) 0%,
				hsl(var(--hue), 40%, 15%) 50%,
				#1a202c 100%
			),
			linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
		position: relative;
		overflow: hidden;
	}

	.galaxy-spiral {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 100px;
		height: 100px;
		transform: translate(-50%, -50%);
		background: radial-gradient(
			ellipse at center,
			rgba(255, 255, 255, 0.3) 0%,
			rgba(255, 255, 255, 0.1) 30%,
			transparent 70%
		);
		border-radius: 50%;
		animation: pulse 4s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.6;
			transform: translate(-50%, -50%) scale(1);
		}
		50% {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1.1);
		}
	}

	.galaxy-info {
		padding: 1rem;
	}

	.galaxy-name {
		font-size: 1.1rem;
		font-weight: 600;
		color: #e2e8f0;
		margin-bottom: 0.5rem;
	}

	.galaxy-meta {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.size-badge,
	.mode-badge {
		font-size: 0.7rem;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		font-weight: 600;
		text-transform: uppercase;
	}

	.size-badge {
		background: rgba(99, 179, 237, 0.2);
		color: #63b3ed;
		border: 1px solid rgba(99, 179, 237, 0.4);
	}

	.mode-badge {
		background: rgba(160, 174, 192, 0.2);
		color: #a0aec0;
		border: 1px solid rgba(160, 174, 192, 0.4);
	}

	.galaxy-stats {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.player-count {
		font-size: 0.85rem;
		color: #a0aec0;
	}

	.button-row {
		display: flex;
		gap: 0.5rem;
	}

	.btn {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border-radius: 4px;
		font-weight: 600;
		font-size: 0.85rem;
		text-align: center;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
	}

	.btn-continue {
		background: linear-gradient(to bottom, #4299e1, #3182ce);
		color: white;
		border: 1px solid #2b6cb0;
	}

	.btn-continue:hover {
		background: linear-gradient(to bottom, #63b3ed, #4299e1);
	}

	.btn-map {
		background: linear-gradient(to bottom, #4a5568, #2d3748);
		color: #e2e8f0;
		border: 1px solid #1a202c;
	}

	.btn-map:hover {
		background: linear-gradient(to bottom, #718096, #4a5568);
	}
</style>
