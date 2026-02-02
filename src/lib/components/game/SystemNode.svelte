<script lang="ts">
	import { SCAN_COLORS } from '$lib/types/scanning';

	interface SystemService {
		type: string;
		name: string;
		accessible: boolean;
	}

	interface Props {
		uuid: string;
		name: string;
		x: number;
		y: number;
		scanLevel: number;
		hasWarpGate: boolean;
		isInhabited: boolean;
		isHazardous: boolean;
		isSelected: boolean;
		isPlayerLocation: boolean;
		showGates: boolean;
		showInhabited: boolean;
		showHazards: boolean;
		services?: SystemService[];
		onClick: (uuid: string) => void;
		onHover?: (data: {
			uuid: string;
			name: string;
			x: number;
			y: number;
			scanLevel: number;
			hasWarpGate: boolean;
			isInhabited: boolean;
			isHazardous: boolean;
			services: SystemService[];
		}) => void;
		onLeave?: () => void;
	}

	let {
		uuid,
		name,
		x,
		y,
		scanLevel,
		hasWarpGate,
		isInhabited,
		isHazardous,
		isSelected,
		isPlayerLocation,
		showGates,
		showInhabited,
		showHazards,
		services = [],
		onClick,
		onHover,
		onLeave
	}: Props = $props();

	function handleMouseEnter() {
		onHover?.({
			uuid,
			name,
			x,
			y,
			scanLevel,
			hasWarpGate,
			isInhabited,
			isHazardous,
			services
		});
	}

	function handleMouseLeave() {
		onLeave?.();
	}

	const scanColor = $derived(SCAN_COLORS[scanLevel] ?? SCAN_COLORS[0]);

	// Determine if node should be visible based on filters
	const isVisible = $derived(() => {
		if (scanLevel === 0) return false; // Unscanned systems not shown
		if (showGates && !hasWarpGate) return false;
		if (showInhabited && !isInhabited) return false;
		if (showHazards && !isHazardous) return false;
		return true;
	});

	// Calculate node size based on scan level
	const nodeSize = $derived(isPlayerLocation ? 8 : 4 + Math.min(scanLevel, 5));
</script>

{#if isVisible()}
	<g
		class="system-node"
		class:selected={isSelected}
		class:player-location={isPlayerLocation}
		transform="translate({x}, {y})"
		onclick={() => onClick(uuid)}
		onkeydown={(e) => e.key === 'Enter' && onClick(uuid)}
		onmouseenter={handleMouseEnter}
		onmouseleave={handleMouseLeave}
		role="button"
		tabindex="0"
		aria-label="{name}, scan level {scanLevel}"
	>
		<!-- Outer glow for selected/player -->
		{#if isSelected || isPlayerLocation}
			<circle
				r={nodeSize + 4}
				fill="none"
				stroke={isPlayerLocation ? '#ef4444' : '#4299e1'}
				stroke-width="2"
				opacity="0.5"
				class="pulse-ring"
			/>
		{/if}

		<!-- Main star circle -->
		<circle
			r={nodeSize}
			fill={scanColor.color}
			opacity={scanColor.opacity}
			stroke={isSelected ? '#4299e1' : 'rgba(255,255,255,0.2)'}
			stroke-width={isSelected ? 2 : 1}
		/>

		<!-- Feature indicators -->
		{#if hasWarpGate && scanLevel >= 2}
			<circle
				r={nodeSize + 2}
				fill="none"
				stroke="#a855f7"
				stroke-width="1"
				stroke-dasharray="2,2"
				opacity="0.7"
			/>
		{/if}

		{#if isInhabited && scanLevel >= 3}
			<circle cx={nodeSize + 2} cy={-nodeSize - 2} r="2" fill="#22c55e" />
		{/if}

		{#if isHazardous && scanLevel >= 4}
			<circle cx={-nodeSize - 2} cy={-nodeSize - 2} r="2" fill="#ef4444" />
		{/if}

		<!-- Player location marker -->
		{#if isPlayerLocation}
			<!-- Animated beacon rings -->
			<circle
				r={nodeSize + 12}
				fill="none"
				stroke="#ef4444"
				stroke-width="1"
				opacity="0.3"
				class="beacon-ring"
			/>
			<circle
				r={nodeSize + 20}
				fill="none"
				stroke="#ef4444"
				stroke-width="0.5"
				opacity="0.2"
				class="beacon-ring-outer"
			/>

			<!-- Label with background -->
			<rect
				x={-35}
				y={-nodeSize - 22}
				width="70"
				height="14"
				rx="2"
				fill="rgba(239, 68, 68, 0.9)"
			/>
			<text y={-nodeSize - 12} text-anchor="middle" fill="white" font-size="9" font-weight="bold">
				YOU ARE HERE
			</text>
		{/if}
	</g>
{/if}

<style>
	.system-node {
		cursor: pointer;
		transition: transform 0.15s ease-out;
	}

	.system-node:hover {
		transform: scale(1.2);
	}

	.system-node:focus {
		outline: none;
	}

	.system-node:focus circle {
		stroke: #63b3ed;
		stroke-width: 2;
	}

	.pulse-ring {
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.3;
			transform: scale(1);
		}
		50% {
			opacity: 0.6;
			transform: scale(1.1);
		}
	}

	.beacon-ring {
		animation: beacon 3s ease-out infinite;
	}

	.beacon-ring-outer {
		animation: beacon 3s ease-out infinite 1.5s;
	}

	@keyframes beacon {
		0% {
			opacity: 0.4;
			transform: scale(0.8);
		}
		100% {
			opacity: 0;
			transform: scale(1.5);
		}
	}
</style>
