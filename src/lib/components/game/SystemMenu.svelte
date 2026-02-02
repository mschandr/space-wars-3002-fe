<script lang="ts">
	interface Props {
		systemName: string;
		systemType: string;
		activeItem: 'planets' | 'trading' | 'salvage' | 'warp' | null;
		onSelect: (item: 'planets' | 'trading' | 'salvage' | 'warp') => void;
	}

	let { systemName, systemType, activeItem, onSelect }: Props = $props();

	const menuItems = [
		{ id: 'planets' as const, label: 'Local Planets', icon: '\u{1F30D}' },
		{ id: 'trading' as const, label: 'Trading Hub', icon: '\u{1F4B0}' },
		{ id: 'salvage' as const, label: 'Salvage Yard', icon: '\u{1F527}' },
		{ id: 'warp' as const, label: 'Warp Gates', icon: '\u{2728}' }
	];
</script>

<nav class="system-menu">
	<div class="menu-header">
		<h2 class="system-name">{systemName}</h2>
		<span class="system-type">- {systemType}</span>
	</div>

	<ul class="menu-items">
		{#each menuItems as item (item.id)}
			<li>
				<button
					class="menu-item"
					class:active={activeItem === item.id}
					onclick={() => onSelect(item.id)}
				>
					<span class="item-icon">{item.icon}</span>
					<span class="item-label">{item.label}</span>
				</button>
			</li>
		{/each}
	</ul>
</nav>

<style>
	.system-menu {
		width: 200px;
		background: rgba(26, 32, 44, 0.95);
		border: 1px solid #4a5568;
		border-radius: 8px;
		overflow: hidden;
	}

	.menu-header {
		padding: 1rem;
		border-bottom: 1px solid #4a5568;
	}

	.system-name {
		font-size: 1.1rem;
		font-weight: 600;
		color: #e2e8f0;
		margin: 0;
		line-height: 1.2;
	}

	.system-type {
		font-size: 0.8rem;
		color: #718096;
		text-transform: uppercase;
	}

	.menu-items {
		list-style: none;
		margin: 0;
		padding: 0.5rem 0;
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.625rem 1rem;
		background: transparent;
		border: none;
		color: #a0aec0;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.15s;
		text-align: left;
	}

	.menu-item:hover {
		background: rgba(66, 153, 225, 0.1);
		color: #e2e8f0;
	}

	.menu-item.active {
		background: rgba(66, 153, 225, 0.2);
		color: #63b3ed;
		border-left: 3px solid #4299e1;
		padding-left: calc(1rem - 3px);
	}

	.item-icon {
		font-size: 1rem;
		width: 1.25rem;
		text-align: center;
	}

	.item-label {
		flex: 1;
	}
</style>
