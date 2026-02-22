<script lang="ts">
	interface SectorData {
		uuid?: string;
		name?: string;
		grid?: { x: number; y: number };
		display_name?: string;
		danger_level?: 'low' | 'medium' | 'high' | 'extreme';
	}

	// Menu item types
	type MenuItemId =
		| 'planets'
		| 'warp'
		| 'manual_jump'
		| 'market_news'
		| 'trading_hub'
		| 'shipyard'
		| 'salvage'
		| 'cartographer'
		| 'bar'
		| 'repair_shop'
		| 'refuel'
		| 'black_market';

	interface Props {
		systemName: string;
		systemType: string;
		sector?: SectorData | null;
		availableServices?: string[];
		activeItem: MenuItemId | null;
		onSelect: (item: MenuItemId) => void;
	}

	let { systemName, systemType, sector, availableServices = [], activeItem, onSelect }: Props =
		$props();

	// Service to menu item mapping (handles various naming conventions from backend)
	const serviceMenuMap: Record<string, { id: MenuItemId; label: string; icon: string }> = {
		// Trading Hub variants
		trading_hub: { id: 'trading_hub', label: 'Trading Hub', icon: '\u{1F4B0}' },
		'trading hub': { id: 'trading_hub', label: 'Trading Hub', icon: '\u{1F4B0}' },
		commerce_hub: { id: 'trading_hub', label: 'Trading Hub', icon: '\u{1F4B0}' },
		'commerce hub': { id: 'trading_hub', label: 'Trading Hub', icon: '\u{1F4B0}' },
		trading_post: { id: 'trading_hub', label: 'Trading Hub', icon: '\u{1F4B0}' },
		'trading post': { id: 'trading_hub', label: 'Trading Hub', icon: '\u{1F4B0}' },
		mineral_trading: { id: 'trading_hub', label: 'Trading Hub', icon: '\u{1F4B0}' },
		'mineral trading': { id: 'trading_hub', label: 'Trading Hub', icon: '\u{1F4B0}' },
		mineral_trading_post: { id: 'trading_hub', label: 'Trading Hub', icon: '\u{1F4B0}' },
		'mineral trading post': { id: 'trading_hub', label: 'Trading Hub', icon: '\u{1F4B0}' },
		trading_station: { id: 'trading_hub', label: 'Trading Hub', icon: '\u{1F4B0}' },
		'trading station': { id: 'trading_hub', label: 'Trading Hub', icon: '\u{1F4B0}' },

		// Salvage Yard variants
		salvage_yard: { id: 'salvage', label: 'Salvage Yard', icon: '\u{1F527}' },
		'salvage yard': { id: 'salvage', label: 'Salvage Yard', icon: '\u{1F527}' },
		salvage: { id: 'salvage', label: 'Salvage Yard', icon: '\u{1F527}' },
		salvage_and_reclamation: { id: 'salvage', label: 'Salvage Yard', icon: '\u{1F527}' },
		'salvage and reclamation': { id: 'salvage', label: 'Salvage Yard', icon: '\u{1F527}' },
		junk_yard: { id: 'salvage', label: 'Salvage Yard', icon: '\u{1F527}' },
		'junk yard': { id: 'salvage', label: 'Salvage Yard', icon: '\u{1F527}' },
		junkyard: { id: 'salvage', label: 'Salvage Yard', icon: '\u{1F527}' },

		// Shipyard variants
		shipyard: { id: 'shipyard', label: 'Shipyard', icon: '\u{1F680}' },
		ship_yard: { id: 'shipyard', label: 'Shipyard', icon: '\u{1F680}' },
		'ship yard': { id: 'shipyard', label: 'Shipyard', icon: '\u{1F680}' },
		ship_yards: { id: 'shipyard', label: 'Shipyard', icon: '\u{1F680}' },
		'ship yards': { id: 'shipyard', label: 'Shipyard', icon: '\u{1F680}' },
		ship_shop: { id: 'shipyard', label: 'Shipyard', icon: '\u{1F680}' },
		'ship shop': { id: 'shipyard', label: 'Shipyard', icon: '\u{1F680}' },
		ship_builders: { id: 'shipyard', label: 'Shipyard', icon: '\u{1F680}' },
		'ship builders': { id: 'shipyard', label: 'Shipyard', icon: '\u{1F680}' },
		ship_construction: { id: 'shipyard', label: 'Shipyard', icon: '\u{1F680}' },
		'ship construction': { id: 'shipyard', label: 'Shipyard', icon: '\u{1F680}' },

		// Drinking Establishment variants
		bar: { id: 'bar', label: 'Cantina', icon: '\u{1F37A}' },
		pub: { id: 'bar', label: 'Cantina', icon: '\u{1F37A}' },
		cantina: { id: 'bar', label: 'Cantina', icon: '\u{1F37A}' },
		nightclub: { id: 'bar', label: 'Cantina', icon: '\u{1F37A}' },
		'night club': { id: 'bar', label: 'Cantina', icon: '\u{1F37A}' },
		tavern: { id: 'bar', label: 'Cantina', icon: '\u{1F37A}' },
		lounge: { id: 'bar', label: 'Cantina', icon: '\u{1F37A}' },

		// Cartographer/Star Charts variants
		cartographer: { id: 'cartographer', label: 'Stellar Cartographer', icon: '\u{1F5FA}' },
		cartography: { id: 'cartographer', label: 'Stellar Cartographer', icon: '\u{1F5FA}' },
		stellar_cartographers: { id: 'cartographer', label: 'Stellar Cartographer', icon: '\u{1F5FA}' },
		'stellar cartographers': { id: 'cartographer', label: 'Stellar Cartographer', icon: '\u{1F5FA}' },
		stellar_cartographer: { id: 'cartographer', label: 'Stellar Cartographer', icon: '\u{1F5FA}' },
		'stellar cartographer': { id: 'cartographer', label: 'Stellar Cartographer', icon: '\u{1F5FA}' },
		star_charts: { id: 'cartographer', label: 'Stellar Cartographer', icon: '\u{1F5FA}' },
		'star charts': { id: 'cartographer', label: 'Stellar Cartographer', icon: '\u{1F5FA}' },
		plans_shop: { id: 'cartographer', label: 'Stellar Cartographer', icon: '\u{1F5FA}' },
		'plans shop': { id: 'cartographer', label: 'Stellar Cartographer', icon: '\u{1F5FA}' },

		// Repair Shop variants
		repair_shop: { id: 'repair_shop', label: 'Repair Shop', icon: '\u{1F6E0}' },
		'repair shop': { id: 'repair_shop', label: 'Repair Shop', icon: '\u{1F6E0}' },
		repair_yard: { id: 'repair_shop', label: 'Repair Shop', icon: '\u{1F6E0}' },
		'repair yard': { id: 'repair_shop', label: 'Repair Shop', icon: '\u{1F6E0}' },
		repairs: { id: 'repair_shop', label: 'Repair Shop', icon: '\u{1F6E0}' },

		// Refueling variants
		refuel: { id: 'refuel', label: 'Refueling Station', icon: '\u{26FD}' },
		refueling: { id: 'refuel', label: 'Refueling Station', icon: '\u{26FD}' },
		refueling_station: { id: 'refuel', label: 'Refueling Station', icon: '\u{26FD}' },
		'refueling station': { id: 'refuel', label: 'Refueling Station', icon: '\u{26FD}' },
		fuel_depot: { id: 'refuel', label: 'Refueling Station', icon: '\u{26FD}' },
		'fuel depot': { id: 'refuel', label: 'Refueling Station', icon: '\u{26FD}' },

		// Black Market variants
		black_market: { id: 'black_market', label: 'Black Market', icon: '\u{1F5DD}' },
		'black market': { id: 'black_market', label: 'Black Market', icon: '\u{1F5DD}' },
		blackmarket: { id: 'black_market', label: 'Black Market', icon: '\u{1F5DD}' }
	};

	// Always-visible menu items
	const coreMenuItems: { id: MenuItemId; label: string; icon: string }[] = [
		{ id: 'planets', label: 'Star System', icon: '\u{1F30D}' },
		{ id: 'warp', label: 'Warp Gates', icon: '\u{2728}' },
		{ id: 'manual_jump', label: 'Manual Jump', icon: '\u{2604}' },
		{ id: 'market_news', label: 'Market News', icon: '\u{1F4F0}' }
	];

	// Dynamically build menu items based on available services
	const dynamicMenuItems = $derived.by(() => {
		const serviceItems: { id: MenuItemId; label: string; icon: string }[] = [];
		const addedIds = new Set<MenuItemId>();

		for (const service of availableServices) {
			const menuItem = serviceMenuMap[service.toLowerCase()];
			if (menuItem && !addedIds.has(menuItem.id)) {
				serviceItems.push(menuItem);
				addedIds.add(menuItem.id);
			}
		}

		// Sort service items by a predefined order
		const serviceOrder: MenuItemId[] = [
			'trading_hub',
			'shipyard',
			'salvage',
			'repair_shop',
			'refuel',
			'cartographer',
			'bar',
			'black_market'
		];
		serviceItems.sort(
			(a, b) => serviceOrder.indexOf(a.id) - serviceOrder.indexOf(b.id)
		);

		return serviceItems;
	});

	// Combined menu items
	const allMenuItems = $derived([...coreMenuItems, ...dynamicMenuItems]);
</script>

<nav class="system-menu">
	<div class="menu-header">
		<h2 class="system-name">{systemName}</h2>
		<span class="system-type">- {systemType}</span>
		{#if sector}
			<div class="sector-info">
				<span class="sector-label">Sector:</span>
				<span class="sector-name">{sector.display_name ?? sector.name}</span>
			</div>
		{/if}
	</div>

	<ul class="menu-items">
		<!-- Core navigation items -->
		{#each coreMenuItems as item (item.id)}
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

		<!-- Separator if there are services -->
		{#if dynamicMenuItems.length > 0}
			<li class="menu-separator">
				<span class="separator-label">Trading Hub</span>
			</li>

			<!-- Dynamic service items -->
			{#each dynamicMenuItems as item (item.id)}
				<li>
					<button
						class="menu-item service-item"
						class:active={activeItem === item.id}
						onclick={() => onSelect(item.id)}
					>
						<span class="item-icon">
							{#if item.id === 'cartographer'}
								<svg viewBox="0 0 20 20" class="constellation-icon" aria-hidden="true">
									<circle cx="4" cy="4" r="1.5" fill="#e2e8f0" />
									<circle cx="12" cy="3" r="1" fill="#a0aec0" />
									<circle cx="17" cy="7" r="1.3" fill="#e2e8f0" />
									<circle cx="9" cy="10" r="1.8" fill="#fbbf24" />
									<circle cx="3" cy="14" r="1" fill="#a0aec0" />
									<circle cx="15" cy="15" r="1.2" fill="#e2e8f0" />
									<circle cx="7" cy="18" r="1" fill="#a0aec0" />
									<line x1="4" y1="4" x2="12" y2="3" stroke="#4a5568" stroke-width="0.5" />
									<line x1="12" y1="3" x2="17" y2="7" stroke="#4a5568" stroke-width="0.5" />
									<line x1="12" y1="3" x2="9" y2="10" stroke="#4a5568" stroke-width="0.5" />
									<line x1="4" y1="4" x2="9" y2="10" stroke="#4a5568" stroke-width="0.5" />
									<line x1="9" y1="10" x2="3" y2="14" stroke="#4a5568" stroke-width="0.5" />
									<line x1="9" y1="10" x2="15" y2="15" stroke="#4a5568" stroke-width="0.5" />
									<line x1="3" y1="14" x2="7" y2="18" stroke="#4a5568" stroke-width="0.5" />
								</svg>
							{:else}
								{item.icon}
							{/if}
						</span>
						<span class="item-label">{item.label}</span>
					</button>
				</li>
			{/each}
		{/if}

		<!-- No services message -->
		{#if dynamicMenuItems.length === 0}
			<li class="no-services">
				<span class="no-services-text">No services available</span>
			</li>
		{/if}
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

	.sector-info {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(74, 85, 104, 0.5);
	}

	.sector-label {
		font-size: 0.7rem;
		color: #718096;
		text-transform: uppercase;
	}

	.sector-name {
		font-size: 0.8rem;
		color: #f6ad55;
		font-weight: 500;
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
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.constellation-icon {
		width: 1.15rem;
		height: 1.15rem;
	}

	.item-label {
		flex: 1;
	}

	.menu-separator {
		padding: 0.5rem 1rem 0.25rem;
		margin-top: 0.25rem;
		border-top: 1px solid rgba(74, 85, 104, 0.5);
	}

	.separator-label {
		font-size: 0.65rem;
		color: #718096;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.service-item {
		padding-left: 1rem;
	}

	.service-item .item-icon {
		opacity: 0.9;
	}

	.no-services {
		padding: 0.75rem 1rem;
		margin-top: 0.25rem;
		border-top: 1px solid rgba(74, 85, 104, 0.5);
	}

	.no-services-text {
		font-size: 0.75rem;
		color: #718096;
		font-style: italic;
	}
</style>
