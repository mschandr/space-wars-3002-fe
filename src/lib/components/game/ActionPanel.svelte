<script lang="ts">
	import { playerState } from '$lib/stores/playerState.svelte';
	import { api, type ShipyardItem, type ShipCatalogItem, type LocalBodiesResponse, type OrbitalBody, type SalvageYardResponse, type SalvageInventoryItem, type MarketEventType } from '$lib/api';
	import TradingPanel from './TradingPanel.svelte';
	import WarpLoader from './WarpLoader.svelte';
<<<<<<< HEAD
<<<<<<< Updated upstream
=======
	import MarketEventsPanel from './MarketEventsPanel.svelte';
	import { tutorialState } from '$lib/stores/tutorialState.svelte';
>>>>>>> Stashed changes
=======
	import MarketEventsPanel from './MarketEventsPanel.svelte';
>>>>>>> origin/Feat/SectorMap-tng

	// Menu item types matching SystemMenu
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
		activeItem: MenuItemId | null;
		onAction: (action: string, targetUuid?: string) => void;
		onTravelComplete?: () => void;
	}

	let { activeItem, onAction, onTravelComplete }: Props = $props();

	// Trading panel state
	let showTradingPanel = $state(false);

	// Shipyard state (for trading hub)
	let isLoadingShipyard = $state(false);
	let availableShips = $state<ShipyardItem[]>([]);
	let shipyardHubUuid = $state<string | null>(null);
	let shipyardError = $state<string | null>(null);

	// Local bodies state (for local planets)
	let isLoadingBodies = $state(false);
	let localBodies = $state<LocalBodiesResponse | null>(null);
	let bodiesError = $state<string | null>(null);
	let selectedBodyUuid = $state<string | null>(null);

	// Combined and sorted orbital bodies for solar system view
	const sortedBodies = $derived.by(() => {
		if (!localBodies) return [];
		const allBodies: OrbitalBody[] = [
			...(localBodies.bodies.planets || []),
			...(localBodies.bodies.asteroid_belts || []),
			...(localBodies.bodies.stations || [])
		];
		return allBodies.sort((a, b) => a.orbital_position - b.orbital_position);
	});

	// Ship catalog state (for salvage yard)
	let isLoadingCatalog = $state(false);
	let shipCatalog = $state<ShipCatalogItem[]>([]);
	let catalogError = $state<string | null>(null);

	// Salvage yard inventory state
	let isLoadingSalvage = $state(false);
	let salvageData = $state<SalvageYardResponse | null>(null);
	let salvageError = $state<string | null>(null);

	// Purchase state
	let isPurchasing = $state(false);
	let purchaseMessage = $state<string | null>(null);

	// Ship detail modal state
	let inspectedShip = $state<ShipyardItem | null>(null);

	// Warp gate sort state
	type GateSortKey = 'distance' | 'name';
	type GateSortDir = 'asc' | 'desc';
	let gateSortKey = $state<GateSortKey>('distance');
	let gateSortDir = $state<GateSortDir>('asc');

	function toggleGateSort(key: GateSortKey) {
		if (gateSortKey === key) {
			gateSortDir = gateSortDir === 'asc' ? 'desc' : 'asc';
		} else {
			gateSortKey = key;
			gateSortDir = 'asc';
		}
	}

	// Post-purchase naming state
	let showNamingPrompt = $state(false);
	let namingShipUuid = $state<string | null>(null);
	let newShipName = $state('');
	let isNaming = $state(false);
	let namingMessage = $state<string | null>(null);

	function formatPrice(value: number | string): string {
		const num = typeof value === 'string' ? parseFloat(value) : value;
		if (isNaN(num)) return '0.00';
		return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}

	// Rarity → star rating system
	const RARITY_STARS: Record<string, { stars: number; max: number; color: string; label: string }> = {
		common:   { stars: 1, max: 5, color: '#a0aec0', label: 'Common' },
		uncommon: { stars: 2, max: 5, color: '#68d391', label: 'Uncommon' },
		rare:     { stars: 3, max: 5, color: '#63b3ed', label: 'Rare' },
		epic:     { stars: 4, max: 5, color: '#b794f4', label: 'Epic' },
		unique:   { stars: 5, max: 5, color: '#f6ad55', label: 'Unique' },
		exotic:   { stars: 6, max: 5, color: '#ffd700', label: 'Exotic' }
	};

	function getRarityInfo(rarity?: string) {
		if (!rarity) return RARITY_STARS.common;
		return RARITY_STARS[rarity.toLowerCase()] ?? RARITY_STARS.common;
	}

	// Travel confirmation state
	interface TravelDestination {
		gateUuid: string;
		destinationUuid: string;
		name: string;
		type: 'gate';
		distance?: number;
		fuelCost?: number;
	}
	let pendingTravel = $state<TravelDestination | null>(null);

	function showTravelConfirmation(destination: TravelDestination) {
		pendingTravel = destination;
	}

	async function confirmTravel() {
		if (!pendingTravel) return;

		const destination = pendingTravel;
		pendingTravel = null;

		// Call the gate travel API through playerState
		const result = await playerState.travelViaGate(destination.gateUuid, destination.name);

		if (result) {
			// Clear local bodies cache since we've moved to a new system
			localBodies = null;

			// Notify parent that travel is complete
			onTravelComplete?.();
		}
	}

	function cancelTravel() {
		pendingTravel = null;
	}

	// Derived state for travel status
	const isTraveling = $derived(playerState.isTraveling);
	const travelDestination = $derived(playerState.travelDestination);
	const travelStatus = $derived(playerState.travelStatus);

	// Get location details from player state
	const locationDetails = $derived(playerState.locationDetails);
	const services = $derived(locationDetails?.has?.services ?? []);
	const gates = $derived(locationDetails?.has?.gates ?? {});
	const isLoading = $derived(!locationDetails && playerState.currentSystem);

	// Watch for activeItem changes to load data
	$effect(() => {
		if (activeItem === 'planets' && !localBodies && !isLoadingBodies) {
			loadLocalBodies();
		} else if (activeItem === 'salvage' && !salvageData && !isLoadingSalvage) {
			loadSalvageYard();
		} else if (activeItem === 'shipyard' && availableShips.length === 0 && !isLoadingShipyard) {
			loadShipyard();
		} else if (activeItem === 'market_news' && !playerState.isLoadingMarketEvents) {
			playerState.loadGalaxyMarketEvents();
		}
	});

	// Reset selected body when changing panels
	$effect(() => {
		if (activeItem !== 'planets') {
			selectedBodyUuid = null;
		}
	});

	const panelTitles: Record<string, string> = {
		planets: 'Star System',
		market_news: 'Galaxy Market News',
		trading_hub: 'Trading Hub',
		shipyard: 'Shipyard',
		salvage: 'Salvage Yard',
		cartographer: 'Cartographer',
		bar: 'Cantina',
		repair_shop: 'Repair Shop',
		refuel: 'Refueling Station',
		black_market: 'Black Market',
		warp: 'Warp Gates'
	};

	// Service icons and labels (handles various naming conventions)
	const serviceInfo: Record<string, { icon: string; label: string }> = {
		// Trading Hub
		trading_hub: { icon: '\u{1F4B0}', label: 'Trading Hub' },
		'trading hub': { icon: '\u{1F4B0}', label: 'Trading Hub' },
		commerce_hub: { icon: '\u{1F4B0}', label: 'Trading Hub' },
		'commerce hub': { icon: '\u{1F4B0}', label: 'Trading Hub' },
		trading_post: { icon: '\u{1F4B0}', label: 'Trading Hub' },
		'trading post': { icon: '\u{1F4B0}', label: 'Trading Hub' },
		mineral_trading: { icon: '\u{1F4B0}', label: 'Trading Hub' },
		'mineral trading': { icon: '\u{1F4B0}', label: 'Trading Hub' },
		mineral_trading_post: { icon: '\u{1F4B0}', label: 'Trading Hub' },
		'mineral trading post': { icon: '\u{1F4B0}', label: 'Trading Hub' },
		trading_station: { icon: '\u{1F4B0}', label: 'Trading Hub' },
		'trading station': { icon: '\u{1F4B0}', label: 'Trading Hub' },

		// Salvage Yard
		salvage_yard: { icon: '\u{1F527}', label: 'Salvage Yard' },
		'salvage yard': { icon: '\u{1F527}', label: 'Salvage Yard' },
		salvage: { icon: '\u{1F527}', label: 'Salvage Yard' },
		'salvage and reclamation': { icon: '\u{1F527}', label: 'Salvage Yard' },
		junk_yard: { icon: '\u{1F527}', label: 'Salvage Yard' },
		junkyard: { icon: '\u{1F527}', label: 'Salvage Yard' },

		// Shipyard
		shipyard: { icon: '\u{1F680}', label: 'Shipyard' },
		ship_yard: { icon: '\u{1F680}', label: 'Shipyard' },
		'ship yard': { icon: '\u{1F680}', label: 'Shipyard' },
		ship_shop: { icon: '\u{1F680}', label: 'Shipyard' },
		ship_builders: { icon: '\u{1F680}', label: 'Shipyard' },
		ship_construction: { icon: '\u{1F680}', label: 'Shipyard' },

		// Cantina/Bar
		bar: { icon: '\u{1F37A}', label: 'Cantina' },
		pub: { icon: '\u{1F37A}', label: 'Cantina' },
		cantina: { icon: '\u{1F37A}', label: 'Cantina' },
		nightclub: { icon: '\u{1F37A}', label: 'Cantina' },
		tavern: { icon: '\u{1F37A}', label: 'Cantina' },

		// Stellar Cartographer
		cartographer: { icon: '\u{1F5FA}', label: 'Stellar Cartographer' },
		cartography: { icon: '\u{1F5FA}', label: 'Stellar Cartographer' },
		stellar_cartographers: { icon: '\u{1F5FA}', label: 'Stellar Cartographer' },
		'stellar cartographers': { icon: '\u{1F5FA}', label: 'Stellar Cartographer' },
		star_charts: { icon: '\u{1F5FA}', label: 'Stellar Cartographer' },
		plans_shop: { icon: '\u{1F5FA}', label: 'Stellar Cartographer' },

		// Repair Shop
		repair_shop: { icon: '\u{1F6E0}', label: 'Repair Shop' },
		repair_yard: { icon: '\u{1F6E0}', label: 'Repair Shop' },
		repairs: { icon: '\u{1F6E0}', label: 'Repair Shop' },

		// Refueling
		refuel: { icon: '\u{26FD}', label: 'Refueling Station' },
		refueling: { icon: '\u{26FD}', label: 'Refueling Station' },
		fuel_depot: { icon: '\u{26FD}', label: 'Refueling Station' },

		// Black Market
		black_market: { icon: '\u{1F5DD}', label: 'Black Market' },
		blackmarket: { icon: '\u{1F5DD}', label: 'Black Market' }
	};

	// Body type icons
	const bodyIcons: Record<string, string> = {
		planet: '\u{1F30D}',
		moon: '\u{1F319}',
		station: '\u{1F6F0}',
		asteroid: '\u2B50',
		gas_giant: '\u{1FA90}',
		rocky: '\u{1F30D}',
		terrestrial: '\u{1F30E}'
	};

	// Planet type colors - returns gradient colors for the planet
	function getPlanetColors(body: OrbitalBody): { primary: string; secondary: string; accent: string } {
		// Check multiple fields for the planet type
		const typeLabel = body.type_label?.toLowerCase() ?? '';
		const subType = body.sub_type?.toLowerCase() ?? '';
		const climate = body.climate?.toLowerCase() ?? '';

		// Combine all type information
		const typeInfo = `${typeLabel} ${subType} ${climate}`;

		// Lava/Volcanic worlds
		if (typeInfo.includes('lava') || typeInfo.includes('volcanic') || typeInfo.includes('magma') || typeInfo.includes('molten')) {
			return { primary: '#cc3300', secondary: '#8b2500', accent: '#ff6600' }; // Volcanic red/orange
		}

		// Gas giants
		if (typeInfo.includes('gas') || typeInfo.includes('jovian') || typeInfo.includes('gas_giant')) {
			return { primary: '#d4a574', secondary: '#c4956a', accent: '#e8c49a' }; // Jupiter-like tan/orange
		}
		if (typeInfo.includes('ice_giant') || typeInfo.includes('ice giant')) {
			return { primary: '#7bc8e8', secondary: '#5ba8d0', accent: '#a0daf0' }; // Neptune-like blue
		}

		// Rocky/terrestrial types
		if (typeInfo.includes('desert') || typeInfo.includes('arid')) {
			return { primary: '#c9a86c', secondary: '#a88a50', accent: '#e0c090' }; // Sandy tan
		}
		if (typeInfo.includes('ice') || typeInfo.includes('frozen') || typeInfo.includes('tundra') || typeInfo.includes('glacial')) {
			return { primary: '#b8d4e8', secondary: '#98c4d8', accent: '#d8eaf4' }; // Icy white-blue
		}
		if (typeInfo.includes('ocean') || typeInfo.includes('water') || typeInfo.includes('aquatic') || typeInfo.includes('marine')) {
			return { primary: '#2277aa', secondary: '#1a5580', accent: '#44aadd' }; // Deep blue
		}
		if (typeInfo.includes('terran') || typeInfo.includes('earth') || typeInfo.includes('temperate') || typeInfo.includes('garden')) {
			return { primary: '#4a8b4a', secondary: '#357035', accent: '#6bab6b' }; // Earth-like green
		}
		if (typeInfo.includes('jungle') || typeInfo.includes('forest') || typeInfo.includes('tropical')) {
			return { primary: '#2d6b2d', secondary: '#1a4a1a', accent: '#4a9b4a' }; // Dense green
		}
		if (typeInfo.includes('barren') || typeInfo.includes('rocky') || typeInfo.includes('dead') || typeInfo.includes('airless')) {
			return { primary: '#6b6b6b', secondary: '#4a4a4a', accent: '#8b8b8b' }; // Gray rocky
		}
		if (typeInfo.includes('toxic') || typeInfo.includes('venusian') || typeInfo.includes('acidic')) {
			return { primary: '#c9a055', secondary: '#a08040', accent: '#e0c080' }; // Venus-like yellow
		}
		if (typeInfo.includes('iron') || typeInfo.includes('metal')) {
			return { primary: '#8b7355', secondary: '#6b5545', accent: '#ab9375' }; // Metallic brown
		}
		if (typeInfo.includes('carbon') || typeInfo.includes('diamond')) {
			return { primary: '#3a3a4a', secondary: '#2a2a3a', accent: '#5a5a6a' }; // Dark carbon
		}

		// Default rocky planet
		return { primary: '#7a6b5a', secondary: '#5a4b3a', accent: '#9a8b7a' };
	}

	// Determine if planet should have rings
	function hasRings(subType?: string, typeLabel?: string): boolean {
		const type = `${subType?.toLowerCase() ?? ''} ${typeLabel?.toLowerCase() ?? ''}`;
		return type.includes('gas') || type.includes('giant') || type.includes('jovian') || type.includes('ringed');
	}

	// Get selected body details
	const selectedBody = $derived.by(() => {
		if (!selectedBodyUuid || !localBodies) return null;
		for (const body of sortedBodies) {
			if (body.uuid === selectedBodyUuid) return body;
		}
		return null;
	});

	// Load local orbital bodies at player's star system
	async function loadLocalBodies() {
		if (!playerState.playerUuid) {
			bodiesError = 'No player found';
			return;
		}

		isLoadingBodies = true;
		bodiesError = null;

		try {
			console.log('[ActionPanel] Loading local bodies for:', playerState.playerUuid);
			const response = await api.players.getLocalBodies(playerState.playerUuid);

			if (response.success && response.data) {
				localBodies = response.data;
				console.log('[ActionPanel] Local bodies loaded:', response.data);
			} else {
				bodiesError = response.error?.message ?? 'Failed to load local bodies';
				console.error('[ActionPanel] Local bodies error:', response.error);
			}
		} catch (err) {
			bodiesError = 'Failed to connect to server';
			console.error('[ActionPanel] Local bodies fetch error:', err);
		} finally {
			isLoadingBodies = false;
		}
	}

	// Load ship catalog for salvage yard
	async function loadShipCatalog() {
		isLoadingCatalog = true;
		catalogError = null;

		try {
			console.log('[ActionPanel] Loading ship catalog');
			const response = await api.ships.getCatalog();

			if (response.success && response.data) {
				shipCatalog = response.data;
				console.log('[ActionPanel] Ship catalog loaded:', response.data.length, 'ships');
			} else {
				catalogError = response.error?.message ?? 'Failed to load ship catalog';
				console.error('[ActionPanel] Catalog error:', response.error);
			}
		} catch (err) {
			catalogError = 'Failed to connect to server';
			console.error('[ActionPanel] Catalog fetch error:', err);
		} finally {
			isLoadingCatalog = false;
		}
	}

	// Load salvage yard inventory
	async function loadSalvageYard() {
		console.log('[ActionPanel] loadSalvageYard called, playerUuid:', playerState.playerUuid);
		if (!playerState.playerUuid) {
			salvageError = 'Player not initialized';
			return;
		}

		isLoadingSalvage = true;
		salvageError = null;

		try {
			console.log('[ActionPanel] Loading salvage yard inventory');
			const response = await api.salvageYard.getInventory(playerState.playerUuid);
			console.log('[ActionPanel] Salvage yard response:', JSON.stringify(response).slice(0, 500));

			if (response.success && response.data) {
				salvageData = response.data;
				console.log('[ActionPanel] Salvage yard loaded:', response.data.hub.name, 'weapons:', response.data.inventory?.weapons?.length, 'utilities:', response.data.inventory?.utilities?.length);
			} else {
				salvageError = response.error?.message ?? 'Failed to load salvage yard';
				console.log('[ActionPanel] Salvage yard error:', salvageError);
			}
		} catch (err) {
			salvageError = 'Failed to connect to salvage yard';
			console.error('[ActionPanel] Salvage yard exception:', err);
		} finally {
			isLoadingSalvage = false;
		}
	}

	async function handlePurchaseSalvage(item: SalvageInventoryItem) {
		if (isPurchasing || !playerState.playerUuid) return;

		isPurchasing = true;
		purchaseMessage = null;

		try {
			// Default to slot 1; API will error if occupied
			const response = await api.salvageYard.purchase(playerState.playerUuid, item.id, 1);

			if (response.success) {
				purchaseMessage = `Successfully installed ${item.component.name}!`;
				// Refresh salvage inventory and player state
				salvageData = null;
				loadSalvageYard();
				playerState.loadMyShip();
			} else {
				purchaseMessage = response.error?.message ?? 'Purchase failed';
			}
		} catch {
			purchaseMessage = 'Failed to complete purchase';
		} finally {
			isPurchasing = false;
		}
	}

	// Purchase ship from catalog
	async function handlePurchaseCatalogShip(ship: ShipCatalogItem) {
		if (isPurchasing) return;

		if (playerState.credits < ship.price) {
			purchaseMessage = `Insufficient credits. You need ${ship.price.toLocaleString()} credits.`;
			return;
		}

		if (!shipyardHubUuid) {
			purchaseMessage = 'No shipyard hub available for purchase.';
			return;
		}

		isPurchasing = true;
		purchaseMessage = null;

		const result = await playerState.purchaseShip(ship.uuid, shipyardHubUuid);

		if (result) {
			purchaseMessage = `Successfully purchased ${result.ship.name}! Credits remaining: ${result.remaining_credits.toLocaleString()}`;
			namingShipUuid = result.ship.uuid;
			newShipName = '';
			namingMessage = null;
			showNamingPrompt = true;
		} else {
			purchaseMessage = 'Failed to purchase ship. Please try again.';
		}

		isPurchasing = false;
	}

	async function loadShipyard() {
		isLoadingShipyard = true;
		shipyardError = null;
		availableShips = [];

		// Get hub UUID from facilities (preferred) or trading hub data
		const hubUuid = tradingHub?.uuid;

		if (!hubUuid) {
			shipyardError = 'No trading hub found at this location';
			isLoadingShipyard = false;
			return;
		}

		console.log('[ActionPanel] Loading shipyard for hub:', hubUuid);

		try {
			const response = await api.tradingHubs.getShipyard(hubUuid);
			if (response.success && response.data) {
				if (!response.data.has_shipyard) {
					shipyardError = 'No shipyard available at this trading hub';
				} else {
					availableShips = response.data.available_ships;
					shipyardHubUuid = hubUuid;
				}
			} else {
				shipyardError = response.error?.message ?? 'Failed to load shipyard';
			}
		} catch {
			shipyardError = 'Failed to connect to shipyard';
		} finally {
			isLoadingShipyard = false;
		}
	}

	async function handlePurchaseShip(item: ShipyardItem) {
		if (isPurchasing || !shipyardHubUuid) return;

		if (playerState.credits < item.current_price) {
			purchaseMessage = `Insufficient credits. You need ${item.current_price.toLocaleString()} credits.`;
			return;
		}

		isPurchasing = true;
		purchaseMessage = null;

		const result = await playerState.purchaseShip(item.ship.uuid, shipyardHubUuid);

		if (result) {
			purchaseMessage = `Successfully purchased ${result.ship.name}! Credits remaining: ${result.remaining_credits.toLocaleString()}`;
			namingShipUuid = result.ship.uuid;
			newShipName = '';
			namingMessage = null;
			showNamingPrompt = true;
			await loadShipyard();
		} else {
			purchaseMessage = 'Failed to purchase ship. Please try again.';
		}

		isPurchasing = false;
	}

<<<<<<< HEAD
<<<<<<< Updated upstream
=======
=======
>>>>>>> origin/Feat/SectorMap-tng
	async function handleChristenShip() {
		if (!namingShipUuid || !newShipName.trim() || isNaming) return;

		isNaming = true;
		namingMessage = null;

		const result = await playerState.renameShip(namingShipUuid, newShipName.trim());

		if (result) {
			namingMessage = `Ship christened: ${result.ship.name}!`;
<<<<<<< HEAD
			tutorialState.completeAction('take_free_ship');
=======
>>>>>>> origin/Feat/SectorMap-tng
			setTimeout(() => {
				showNamingPrompt = false;
				namingMessage = null;
			}, 2000);
		} else {
			namingMessage = 'Failed to name ship. You can rename it later from the ship panel.';
		}

		isNaming = false;
	}

	function skipNaming() {
		showNamingPrompt = false;
		namingShipUuid = null;
		newShipName = '';
		namingMessage = null;
<<<<<<< HEAD
		tutorialState.completeAction('take_free_ship');
	}

>>>>>>> Stashed changes
=======
	}

>>>>>>> origin/Feat/SectorMap-tng
	function handleServiceClick(service: string) {
		if (service === 'ship_shop') {
			loadShipyard();
		} else if (service === 'trading_hub') {
			showTradingPanel = true;
		} else {
			onAction(service);
		}
	}

	function closeTradingPanel() {
		showTradingPanel = false;
	}

	// Reset trading panel when changing tabs
	$effect(() => {
		if (activeItem !== 'trading_hub') {
			showTradingPanel = false;
		}
	});

	// Derive facility UUIDs from facilities endpoint (primary) or locationDetails (fallback)
	const facilities = $derived(playerState.facilities);
	const tradingHub = $derived.by(() => {
		const hubs = facilities?.facilities?.trading_hubs;
		if (hubs && hubs.length > 0) return hubs[0];
		return locationDetails?.has?.trading_hub ?? null;
	});
	const shipyardFacility = $derived.by(() => {
		const yards = facilities?.facilities?.shipyards;
		if (yards && yards.length > 0) return yards[0];
		return null;
	});
	const salvageYardFacility = $derived.by(() => {
		const yards = facilities?.facilities?.salvage_yards;
		if (yards && yards.length > 0) return yards[0];
		return null;
	});
</script>

<div class="action-panel" data-tutorial="action-panel">
	{#if !activeItem}
		<div class="panel-placeholder">
			<p>Select a destination from the menu</p>
		</div>
	{:else}
		<div class="panel-content">
			<h3 class="panel-title">{panelTitles[activeItem] ?? activeItem}</h3>

			{#if activeItem === 'planets'}
				<!-- Local Bodies Panel - Solar System View -->
				{#if isLoadingBodies}
					<div class="loading">Loading local bodies...</div>
				{:else if bodiesError}
					<p class="error-message">{bodiesError}</p>
					<button class="retry-btn" onclick={loadLocalBodies}>Retry</button>
				{:else if localBodies}
					<!-- Solar System Visualization -->
					<div class="solar-system-container">
						<!-- Star -->
						<div class="star-container">
							<div
								class="star"
								class:class-o={localBodies.system.stellar_class === 'O'}
								class:class-b={localBodies.system.stellar_class === 'B'}
								class:class-a={localBodies.system.stellar_class === 'A'}
								class:class-f={localBodies.system.stellar_class === 'F'}
								class:class-g={localBodies.system.stellar_class === 'G'}
								class:class-k={localBodies.system.stellar_class === 'K'}
								class:class-m={localBodies.system.stellar_class === 'M'}
							>
								<span class="star-icon">&#x2605;</span>
							</div>
							<span class="star-label">{localBodies.system.name}</span>
							{#if localBodies.system.stellar_class}
								<span class="star-class">Class {localBodies.system.stellar_class}</span>
							{/if}
						</div>

						<!-- Orbital Track -->
						<div class="orbital-track">
							{#each sortedBodies as body, index (body.uuid)}
								{@const colors = getPlanetColors(body)}
								{@const showRings = hasRings(body.sub_type, body.type_label)}
								{@const moonCount = body.moons?.length ?? 0}
								{@const isSelected = selectedBodyUuid === body.uuid}
								{@const isEven = index % 2 === 0}
								<div
									class="orbital-body-wrapper"
									class:label-above={isEven}
									class:label-below={!isEven}
								>
									<!-- Name label with connector line -->
									<div class="body-label-container" class:above={isEven} class:below={!isEven}>
										<span class="body-name" class:selected={isSelected}>{body.name}</span>
										<div class="connector-line"></div>
									</div>

									<div
										class="orbital-body"
										class:planet={body.type === 'planet'}
										class:asteroid={body.type === 'asteroid_belt'}
										class:station={body.type === 'station'}
										class:inhabited={body.is_inhabited}
										class:selected={isSelected}
										role="button"
										tabindex="0"
										onclick={() => (selectedBodyUuid = isSelected ? null : body.uuid)}
										onkeydown={(e) => e.key === 'Enter' && (selectedBodyUuid = isSelected ? null : body.uuid)}
									>
										<!-- Planet with custom colors -->
										{#if body.type === 'planet'}
											<svg class="planet-svg" viewBox="0 0 40 40" width="36" height="36">
												{#if showRings}
													<!-- Rings behind planet -->
													<ellipse cx="20" cy="20" rx="18" ry="5" fill="none" stroke="rgba(200,180,140,0.4)" stroke-width="2" transform="rotate(-15 20 20)" />
													<ellipse cx="20" cy="20" rx="16" ry="4" fill="none" stroke="rgba(180,160,120,0.3)" stroke-width="1.5" transform="rotate(-15 20 20)" />
												{/if}
												<!-- Planet sphere -->
												<defs>
													<radialGradient id="planet-grad-{body.uuid}" cx="30%" cy="30%">
														<stop offset="0%" stop-color="{colors.accent}" />
														<stop offset="50%" stop-color="{colors.primary}" />
														<stop offset="100%" stop-color="{colors.secondary}" />
													</radialGradient>
												</defs>
												<circle cx="20" cy="20" r="14" fill="url(#planet-grad-{body.uuid})" />
												<!-- Highlight -->
												<circle cx="14" cy="14" r="4" fill="rgba(255,255,255,0.2)" />
												{#if showRings}
													<!-- Rings in front of planet -->
													<ellipse cx="20" cy="20" rx="18" ry="5" fill="none" stroke="rgba(200,180,140,0.4)" stroke-width="2" stroke-dasharray="0 28 30 0" transform="rotate(-15 20 20)" />
												{/if}
											</svg>
										{:else if body.type === 'asteroid_belt'}
											<span class="orbital-icon">&#x2B50;</span>
										{:else if body.type === 'station'}
											<span class="orbital-icon">{bodyIcons.station}</span>
										{/if}
										{#if moonCount > 0}
											<span class="moon-indicator">{moonCount}</span>
										{/if}
										{#if body.is_inhabited}
											<span class="inhabited-indicator"></span>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>

					<!-- Selected Body Details Panel -->
					{#if selectedBody}
						<div class="body-details-panel">
							<div class="details-header">
								<div class="details-title-row">
									<h4 class="details-title">{selectedBody.name}</h4>
									<span class="details-type">{selectedBody.type_label ?? selectedBody.sub_type ?? selectedBody.type}</span>
									{#if selectedBody.is_inhabited}
										<span class="details-tag inhabited">Inhabited</span>
									{/if}
								</div>
								<button class="close-details" onclick={() => (selectedBodyUuid = null)} aria-label="Close details">
									&#x2715;
								</button>
							</div>

							{#if selectedBody.description}
								<p class="details-description">{selectedBody.description}</p>
							{/if}

							<div class="details-content">
								<!-- Planet Properties -->
								<div class="details-section properties-section">
									<h5 class="section-title">Properties</h5>
									<div class="property-list">
										{#if selectedBody.type_label}
											<div class="property-row">
												<span class="property-label">Type</span>
												<span class="property-value capitalize">{selectedBody.type_label}</span>
											</div>
										{/if}
										<div class="property-row">
											<span class="property-label">Orbit</span>
											<span class="property-value">{selectedBody.orbital_position}</span>
										</div>
										{#if selectedBody.size}
											<div class="property-row">
												<span class="property-label">Size</span>
												<span class="property-value capitalize">{selectedBody.size}</span>
											</div>
										{/if}
										{#if selectedBody.gravity}
											<div class="property-row">
												<span class="property-label">Gravity</span>
												<span class="property-value">{selectedBody.gravity.toFixed(2)}g</span>
											</div>
										{/if}
										{#if selectedBody.atmosphere}
											<div class="property-row">
												<span class="property-label">Atmosphere</span>
												<span class="property-value capitalize">{selectedBody.atmosphere}</span>
											</div>
										{/if}
										{#if selectedBody.temperature_class || selectedBody.temperature}
											<div class="property-row">
												<span class="property-label">Temperature</span>
												<span class="property-value temp-{selectedBody.temperature_class ?? 'temperate'}">
													{selectedBody.temperature_class ?? ''}{selectedBody.temperature ? ` (${selectedBody.temperature}K)` : ''}
												</span>
											</div>
										{/if}
										{#if selectedBody.climate}
											<div class="property-row">
												<span class="property-label">Climate</span>
												<span class="property-value capitalize">{selectedBody.climate}</span>
											</div>
										{/if}
										{#if selectedBody.resource_richness}
											<div class="property-row">
												<span class="property-label">Resources</span>
												<span class="property-value resource-{selectedBody.resource_richness}">{selectedBody.resource_richness}</span>
											</div>
										{/if}
										{#if selectedBody.is_inhabited && selectedBody.population}
											<div class="property-row">
												<span class="property-label">Population</span>
												<span class="property-value">{selectedBody.population.toLocaleString()}</span>
											</div>
										{/if}
									</div>
								</div>

								<!-- Moons Section -->
								{#if selectedBody.moons && selectedBody.moons.length > 0}
									<div class="details-section moons-section">
										<h5 class="section-title">Moons ({selectedBody.moons.length})</h5>
										<div class="moons-list">
											{#each selectedBody.moons as moon}
												{@const moonColors = getPlanetColors(moon)}
												<div class="moon-card" class:inhabited={moon.is_inhabited}>
													<div class="moon-visual" style="--moon-primary: {moonColors.primary}; --moon-secondary: {moonColors.secondary};"></div>
													<div class="moon-info">
														<span class="moon-card-name">{moon.name}</span>
														<div class="moon-properties">
															{#if moon.size}
																<span class="moon-prop">{moon.size}</span>
															{/if}
															{#if moon.sub_type}
																<span class="moon-prop">{moon.sub_type}</span>
															{/if}
															{#if moon.is_inhabited}
																<span class="moon-prop inhabited">Inhabited</span>
															{/if}
															{#if moon.resource_richness}
																<span class="moon-prop resource-{moon.resource_richness}">{moon.resource_richness}</span>
															{/if}
														</div>
														{#if moon.services && moon.services.length > 0}
															<div class="moon-services">
																{#each moon.services as service}
																	<span class="moon-service">{serviceInfo[service]?.label ?? service}</span>
																{/each}
															</div>
														{/if}
													</div>
												</div>
											{/each}
										</div>
									</div>
								{/if}

								<!-- Hazards -->
								{#if selectedBody.hazards && selectedBody.hazards.length > 0}
									<div class="details-section hazards-section">
										<h5 class="section-title hazard-title">Hazards</h5>
										<div class="hazard-tags">
											{#each selectedBody.hazards as hazard}
												<span class="hazard-tag">{hazard}</span>
											{/each}
										</div>
									</div>
								{/if}

								<!-- Services -->
								{#if selectedBody.services && selectedBody.services.length > 0}
									<div class="details-section">
										<h5 class="section-title">Services</h5>
										<div class="services-tags">
											{#each selectedBody.services as service}
												<span class="service-tag">{serviceInfo[service]?.icon ?? ''} {serviceInfo[service]?.label ?? service}</span>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						</div>
					{/if}

					<!-- Sector Info -->
					<div class="sector-info-bar">
						<span class="sector-name"
							>{localBodies.sector.display_name ?? localBodies.sector.name}</span
						>
						<span
							class="danger-badge"
							class:low={localBodies.sector.danger_level === 'low'}
							class:medium={localBodies.sector.danger_level === 'medium'}
							class:high={localBodies.sector.danger_level === 'high'}
							class:extreme={localBodies.sector.danger_level === 'extreme'}
						>
							{localBodies.sector.danger_level} risk
						</span>
					</div>

					{#if localBodies.summary.total_bodies === 0}
						<p class="no-features">No orbital bodies found in this system.</p>
					{/if}
				{:else}
					<p class="no-features">Click to load local bodies.</p>
					<button class="action-btn" onclick={loadLocalBodies}>Load Bodies</button>
				{/if}
			{:else if activeItem === 'market_news'}
				<!-- Galaxy Market News Panel -->
				<MarketEventsPanel
					mode="galaxy"
					events={playerState.galaxyMarketEvents}
					isLoading={playerState.isLoadingMarketEvents}
					onFilterChange={(filters) => playerState.loadGalaxyMarketEvents(filters)}
				/>
			{:else if activeItem === 'trading_hub'}
				<!-- Trading Hub Panel -->
				{#if tradingHub}
					<TradingPanel hubUuid={tradingHub.uuid} hubName={tradingHub.name} />
				{:else if isLoading}
					<div class="loading">Loading trading hub...</div>
				{:else}
					<p class="no-features">No trading hub available at this location.</p>
				{/if}
			{:else if activeItem === 'shipyard'}
				<!-- Shipyard Panel -->
				{#if isLoadingShipyard}
					<div class="loading">Loading available ships...</div>
				{:else if availableShips.length > 0}
					<div class="credits-display">
						Your Credits: <span class="credits-value">{formatPrice(playerState.credits)}</span>
					</div>

					{#if purchaseMessage}
						<div
							class="purchase-message"
							class:success={purchaseMessage.includes('Successfully')}
						>
							{purchaseMessage}
						</div>
					{/if}

					{#if showNamingPrompt}
						<div class="naming-prompt">
							<div class="naming-header">
								<span class="naming-icon">&#9998;</span>
								<span>Christen Your Ship</span>
							</div>
							<p class="naming-hint">First naming is free!</p>
							{#if namingMessage}
								<div class="naming-message" class:success={namingMessage.includes('christened')}>
									{namingMessage}
								</div>
							{:else}
								<div class="naming-controls">
									<input
										class="naming-input"
										type="text"
										placeholder="Enter ship name..."
										bind:value={newShipName}
										maxlength={100}
										disabled={isNaming}
										onkeydown={(e) => { if (e.key === 'Enter') handleChristenShip(); }}
									/>
									<div class="naming-buttons">
										<button class="christen-btn" onclick={handleChristenShip} disabled={isNaming || !newShipName.trim()}>
											{#if isNaming}Naming...{:else}Christen{/if}
										</button>
										<button class="skip-btn" onclick={skipNaming} disabled={isNaming}>Skip</button>
									</div>
								</div>
							{/if}
						</div>
					{/if}

					<div class="ships-list">
						{#each availableShips as item (item.ship.uuid)}
							{@const isStarterFreebie = item.current_price <= 0 && playerState.ships.length === 0}
							{@const isStarterOwned = item.current_price <= 0 && playerState.ships.length > 0}
							{@const displayPrice = isStarterOwned ? 500 : item.current_price}
							{@const canAfford = playerState.credits >= displayPrice}
							{@const meetsLevel = !item.ship.requirements || playerState.level >= item.ship.requirements.level}
							{@const shipRarity = getRarityInfo(item.ship.rarity)}
							{#if isStarterFreebie}
								<!-- Desperate shipyard owner pitch for shipless players -->
								<div class="ship-card starter-pitch">
									<div class="pitch-dialogue">
										<span class="pitch-speaker">Shipyard Owner:</span>
										<p class="pitch-text">
											{#if item.owner_commentary}
												"{item.owner_commentary}"
											{:else}
												"Look, I'm gonna level with you. This thing's been sitting on my lot for months.
												Nobody wants it. The nav computer glitches, the hull rattles above half-throttle,
												and I'm pretty sure something is living in the cargo hold.
												But hey — you need a ship, I need the dock space. She's yours. Free.
												Just... get it out of here."
											{/if}
										</p>
									</div>
									<div class="ship-header">
										<span class="ship-name">{item.ship.name}</span>
										<span class="starter-tag">FREE</span>
									</div>
									<button class="ship-class-btn" onclick={() => { inspectedShip = item; }}>
										{item.ship.class_info?.label ?? item.ship.class}
										{#if item.ship.class_info?.role}
											<span class="class-role">({item.ship.class_info.role})</span>
										{/if}
										<span class="inspect-hint">View Details &#x276F;</span>
									</button>
									{#if item.ship.stats}
										<div class="ship-stats-brief">
											<span title="Hull">&#x1F6E1; {item.ship.stats.hull_strength.toLocaleString()}</span>
											<span title="Shields">&#x26A1; {item.ship.stats.shield_strength.toLocaleString()}</span>
											<span title="Cargo">&#x1F4E6; {item.ship.stats.cargo_capacity.toLocaleString()}</span>
											<span title="Speed">&#x1F680; {item.ship.stats.speed}</span>
										</div>
									{/if}
									<div class="ship-footer">
										<span class="ship-price affordable">FREE — Just take it. Please.</span>
										<button
											class="buy-btn"
											disabled={isPurchasing || item.quantity <= 0}
											onclick={() => handlePurchaseShip(item)}
										>
											{#if isPurchasing}
												Acquiring...
											{:else}
												Take the Ship
											{/if}
										</button>
									</div>
								</div>
							{:else}
								<!-- Standard ship card -->
								<div class="ship-card" class:unavailable={!canAfford || !meetsLevel}>
									<div class="ship-header">
										<span class="ship-name">{item.ship.name}</span>
										<div class="rarity-stars" title="{shipRarity.label}">
											{#each Array(Math.min(shipRarity.stars, 5)) as _}
												<span class="r-star filled" style="color: {shipRarity.color}">{'\u2605'}</span>
											{/each}
											{#each Array(Math.max(0, 5 - shipRarity.stars)) as _}
												<span class="r-star empty">{'\u2606'}</span>
											{/each}
											{#if shipRarity.stars > 5}
												<span class="r-star overflow" style="color: {shipRarity.color}">+{'\u2605'}</span>
											{/if}
										</div>
									</div>
									<button class="ship-class-btn" onclick={() => { inspectedShip = item; }}>
										{item.ship.class_info?.label ?? item.ship.class}
										{#if item.ship.class_info?.role}
											<span class="class-role">({item.ship.class_info.role})</span>
										{/if}
										<span class="inspect-hint">View Details &#x276F;</span>
									</button>
									{#if item.ship.stats}
										<div class="ship-stats-brief">
											<span title="Hull">&#x1F6E1; {item.ship.stats.hull_strength.toLocaleString()}</span>
											<span title="Shields">&#x26A1; {item.ship.stats.shield_strength.toLocaleString()}</span>
											<span title="Cargo">&#x1F4E6; {item.ship.stats.cargo_capacity.toLocaleString()}</span>
											<span title="Speed">&#x1F680; {item.ship.stats.speed}</span>
										</div>
									{/if}
									{#if item.owner_commentary}
										<p class="merchant-commentary">"{item.owner_commentary}"</p>
									{/if}
									<div class="ship-footer">
										<div class="ship-price-block">
											<span class="ship-price" class:affordable={canAfford} class:expensive={!canAfford}>
												{formatPrice(displayPrice)} credits
												{#if isStarterOwned}
													<span class="price-note">(yard fee)</span>
												{/if}
											</span>
											<span class="ship-stock">Stock: {item.quantity.toLocaleString()}</span>
										</div>
										{#if !meetsLevel && item.ship.requirements}
											<span class="level-req">Requires Lv.{item.ship.requirements.level}</span>
										{:else}
											<button
												class="buy-btn"
												disabled={isPurchasing || !canAfford || item.quantity <= 0}
												onclick={() => handlePurchaseShip(item)}
											>
												{#if isPurchasing}
													Purchasing...
												{:else if item.quantity <= 0}
													Out of Stock
												{:else if !canAfford}
													Can't Afford
												{:else}
													Purchase
												{/if}
											</button>
										{/if}
									</div>
								</div>
							{/if}
						{/each}
					</div>
				{:else if shipyardError}
					<p class="error-message">{shipyardError}</p>
					<button class="retry-btn" onclick={loadShipyard}>Retry</button>
				{:else}
					<p class="no-features">No ships available at this shipyard.</p>
					<button class="action-btn" onclick={loadShipyard}>Load Ships</button>
				{/if}
			{:else if activeItem === 'warp'}
				<!-- Warp Gates Panel -->
				{@const gateEntries = Object.entries(gates)}
				{@const sortedGates = [...gateEntries].sort((a, b) => {
					const dir = gateSortDir === 'asc' ? 1 : -1;
					if (gateSortKey === 'distance') return (a[1].distance - b[1].distance) * dir;
					return a[1].destination_name.localeCompare(b[1].destination_name) * dir;
				})}
				{#if isLoading}
					<div class="loading">Loading warp gates...</div>
				{:else if sortedGates.length > 0}
					<div class="gate-sort-bar">
						<span class="gate-sort-label">Sort</span>
						<button class="gate-sort-btn" class:active={gateSortKey === 'distance'} onclick={() => toggleGateSort('distance')}>
							Dist {#if gateSortKey === 'distance'}{gateSortDir === 'asc' ? '\u25B2' : '\u25BC'}{/if}
						</button>
						<button class="gate-sort-btn" class:active={gateSortKey === 'name'} onclick={() => toggleGateSort('name')}>
							Name {#if gateSortKey === 'name'}{gateSortDir === 'asc' ? '\u25B2' : '\u25BC'}{/if}
						</button>
					</div>
					<div class="warp-gates-list">
<<<<<<< HEAD
<<<<<<< Updated upstream
						{#each gateEntries as [gateUuid, gate] (gateUuid)}
=======
						{#each sortedGates as [gateUuid, gate], idx (gateUuid)}
>>>>>>> Stashed changes
=======
						{#each sortedGates as [gateUuid, gate] (gateUuid)}
>>>>>>> origin/Feat/SectorMap-tng
							<button
								class="warp-gate-item"
								data-tutorial={idx === 0 ? 'warp-gate-first' : undefined}
								onclick={() =>
									showTravelConfirmation({
										gateUuid: gateUuid,
										destinationUuid: gate.destination_uuid,
										name: gate.destination_name,
										type: 'gate',
										distance: gate.distance,
										fuelCost: gate.fuel_cost
									})}
							>
								<!-- Stargate-style icon -->
								<div class="gate-icon">
									<svg viewBox="0 0 48 48" class="stargate-svg">
										<!-- Outer ring -->
										<circle
											cx="24"
											cy="24"
											r="22"
											fill="none"
											stroke="#4a90a4"
											stroke-width="2"
										/>
										<!-- Inner ring with chevrons -->
										<circle
											cx="24"
											cy="24"
											r="18"
											fill="none"
											stroke="#6bb8cc"
											stroke-width="1.5"
										/>
										<!-- Chevrons (9 around the ring) -->
										{#each Array(9) as _, i}
											{@const angle = (i * 40 - 90) * (Math.PI / 180)}
											{@const x = 24 + 20 * Math.cos(angle)}
											{@const y = 24 + 20 * Math.sin(angle)}
											<polygon
												points="{x},{y - 3} {x - 2.5},{y + 2} {x + 2.5},{y + 2}"
												fill="#f6ad55"
												transform="rotate({i * 40}, {x}, {y})"
											/>
										{/each}
										<!-- Event horizon (center) -->
										<circle cx="24" cy="24" r="14" fill="url(#eventHorizon)" />
										<!-- Gradient definition -->
										<defs>
											<radialGradient id="eventHorizon">
												<stop offset="0%" stop-color="#1a3a4a" />
												<stop offset="50%" stop-color="#2a5a6a" />
												<stop offset="100%" stop-color="#4a90a4" stop-opacity="0.6" />
											</radialGradient>
										</defs>
									</svg>
									<span class="gate-pulse"></span>
								</div>
								<!-- Destination info -->
								<div class="gate-destination">
									<span class="destination-name">{gate.destination_name}</span>
									<span class="destination-distance">{gate.distance.toFixed(1)} light years</span>
								</div>
								<span class="gate-arrow">&#x276F;</span>
							</button>
						{/each}
					</div>
				{:else if locationDetails}
					<p class="no-features">No warp gates available at this location.</p>
				{:else}
					<p class="no-features">Location data not available.</p>
				{/if}
			{:else if activeItem === 'salvage'}
				<!-- Salvage Yard Panel -->
				{#if isLoadingSalvage}
					<div class="loading">Loading salvage yard...</div>
				{:else if salvageError}
					<p class="error-message">{salvageError}</p>
					<button class="retry-btn" onclick={loadSalvageYard}>Retry</button>
				{:else if salvageData}
					{@const allItems = Object.values(salvageData.inventory).flat()}
					<div class="credits-display">
						{salvageData.hub.name} ({salvageData.hub.tier})
						<br />Your Credits: <span class="credits-value">{playerState.credits.toLocaleString()}</span>
					</div>

					{#if purchaseMessage}
						<div class="purchase-message" class:success={purchaseMessage.includes('Successfully')}>
							{purchaseMessage}
						</div>
					{/if}

					{#if allItems.length > 0}
						<div class="salvage-list">
							{#each allItems as item (item.id)}
								{@const canAfford = playerState.credits >= item.price}
								{@const rInfo = getRarityInfo(item.component.rarity)}
								<div class="salvage-card" class:unavailable={!canAfford} class:exotic-glow={rInfo.stars > 5}>
									<div class="salvage-header">
										<span class="salvage-name">{item.component.name}</span>
										<div class="rarity-stars" title="{rInfo.label}">
											{#each Array(Math.min(rInfo.stars, 5)) as _}
												<span class="r-star filled" style="color: {rInfo.color}">{'\u2605'}</span>
											{/each}
											{#each Array(Math.max(0, 5 - rInfo.stars)) as _}
												<span class="r-star empty">{'\u2606'}</span>
											{/each}
											{#if rInfo.stars > 5}
												<span class="r-star overflow" style="color: {rInfo.color}">+{'\u2605'}</span>
											{/if}
										</div>
									</div>
									<div class="salvage-meta">
										<span class="salvage-type">{item.component.slot_type_label ?? (item.component.slot_type ?? 'unknown').replace(/_/g, ' ')}</span>
										<span class="salvage-condition">
											{item.condition_description ?? 'Unknown'}
											<span class="condition-pct">({item.condition ?? 0}%)</span>
										</span>
									</div>
									{#if item.owner_commentary}
										<p class="merchant-commentary">"{item.owner_commentary}"</p>
									{/if}
									<div class="salvage-footer">
										<div class="salvage-price-block">
											<span class="salvage-price" class:affordable={canAfford} class:expensive={!canAfford}>
												{formatPrice(item.price)} credits
											</span>
											<span class="salvage-stock">Stock: {(item.quantity ?? 0).toLocaleString()}</span>
										</div>
										<button
											class="buy-btn"
											disabled={isPurchasing || !canAfford || (item.quantity ?? 0) <= 0}
											onclick={() => handlePurchaseSalvage(item)}
										>
											{#if isPurchasing}
												Installing...
											{:else if (item.quantity ?? 0) <= 0}
												Out of Stock
											{:else if !canAfford}
												Can't Afford
											{:else}
												Buy & Install
											{/if}
										</button>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<p class="no-features">Salvage yard is empty.</p>
					{/if}
				{:else}
					<p class="no-features">No salvage yard available at this location.</p>
					<button class="action-btn" onclick={loadSalvageYard}>Retry</button>
				{/if}
			{:else if activeItem === 'cartographer'}
				<!-- Cartographer Panel -->
				<div class="service-panel">
					<div class="service-description">
						<span class="service-panel-icon">
							<svg viewBox="0 0 20 20" class="constellation-icon-lg" aria-hidden="true">
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
						</span>
						<p>The Cartographer can help you chart new star systems, update your navigation data, and sell star maps of the surrounding sectors.</p>
					</div>
					<div class="service-actions">
						<button class="action-btn" onclick={() => onAction('buy_maps')}>
							<span class="btn-icon">{'\u{1F4DC}'}</span>
							Buy Star Maps
						</button>
						<button class="action-btn" onclick={() => onAction('sell_exploration_data')}>
							<span class="btn-icon">{'\u{1F4B0}'}</span>
							Sell Exploration Data
						</button>
						<button class="action-btn" onclick={() => onAction('update_nav')}>
							<span class="btn-icon">{'\u{1F504}'}</span>
							Update Navigation
						</button>
					</div>
				</div>
			{:else if activeItem === 'bar'}
				<!-- Cantina Panel -->
				<div class="service-panel">
					<div class="service-description">
						<span class="service-panel-icon">{'\u{1F37A}'}</span>
						<p>The Cantina is a place to rest, gather rumors, recruit crew members, and find job postings from various factions.</p>
					</div>
					<div class="service-actions">
						<button class="action-btn" onclick={() => onAction('listen_rumors')}>
							<span class="btn-icon">{'\u{1F442}'}</span>
							Listen for Rumors
						</button>
						<button class="action-btn" onclick={() => onAction('recruit_crew')}>
							<span class="btn-icon">{'\u{1F464}'}</span>
							Recruit Crew
						</button>
						<button class="action-btn" onclick={() => onAction('view_jobs')}>
							<span class="btn-icon">{'\u{1F4CB}'}</span>
							Job Board
						</button>
						<button class="action-btn" onclick={() => onAction('gamble')}>
							<span class="btn-icon">{'\u{1F3B2}'}</span>
							Gambling Tables
						</button>
					</div>
				</div>
			{:else if activeItem === 'repair_shop'}
				<!-- Repair Shop Panel -->
				<div class="service-panel">
					<div class="service-description">
						<span class="service-panel-icon">{'\u{1F6E0}'}</span>
						<p>The Repair Shop can restore your ship's hull and systems to full functionality. Prices vary based on damage severity.</p>
					</div>
					<div class="ship-status">
						{#if playerState.ship}
							<div class="status-row">
								<span class="status-label">Hull Integrity:</span>
								<span class="status-value" class:damaged={playerState.ship.hull.current < playerState.ship.hull.max}>
									{playerState.ship.hull.current} / {playerState.ship.hull.max}
								</span>
							</div>
							<div class="status-row">
								<span class="status-label">Shield Status:</span>
								<span class="status-value">
									{playerState.ship.shield.current} / {playerState.ship.shield.max}
								</span>
							</div>
						{/if}
					</div>
					<div class="service-actions">
						<button class="action-btn" onclick={() => onAction('repair_hull')} disabled={!playerState.ship || playerState.ship.hull.current >= playerState.ship.hull.max}>
							<span class="btn-icon">{'\u{1F527}'}</span>
							Repair Hull
						</button>
						<button class="action-btn" onclick={() => onAction('repair_all')}>
							<span class="btn-icon">{'\u{2699}'}</span>
							Full Service
						</button>
					</div>
				</div>
			{:else if activeItem === 'refuel'}
				<!-- Refueling Station Panel -->
				<div class="service-panel">
					<div class="service-description">
						<span class="service-panel-icon">{'\u{26FD}'}</span>
						<p>Refuel your ship's tanks. Fuel is essential for warp travel between star systems.</p>
					</div>
					<div class="ship-status">
						{#if playerState.ship}
							<div class="status-row">
								<span class="status-label">Fuel Level:</span>
								<span class="status-value" class:low-fuel={playerState.ship.fuel.current < playerState.ship.fuel.max * 0.25}>
									{playerState.ship.fuel.current.toFixed(1)} / {playerState.ship.fuel.max}
								</span>
							</div>
						{/if}
					</div>
					<div class="service-actions">
						<button class="action-btn" onclick={() => onAction('refuel_full')}>
							<span class="btn-icon">{'\u{26FD}'}</span>
							Fill Tank
						</button>
						<button class="action-btn" onclick={() => onAction('refuel_half')}>
							<span class="btn-icon">{'\u{1F4A7}'}</span>
							Half Tank
						</button>
					</div>
				</div>
			{:else if activeItem === 'black_market'}
				<!-- Black Market Panel -->
				<div class="service-panel black-market">
					<div class="service-description">
						<span class="service-panel-icon">{'\u{1F5DD}'}</span>
						<p class="warning-text">The Black Market deals in contraband, stolen goods, and illegal modifications. Proceed with caution.</p>
					</div>
					<div class="service-actions">
						<button class="action-btn danger" onclick={() => onAction('buy_contraband')}>
							<span class="btn-icon">{'\u{1F4E6}'}</span>
							Buy Contraband
						</button>
						<button class="action-btn danger" onclick={() => onAction('sell_stolen')}>
							<span class="btn-icon">{'\u{1F4B8}'}</span>
							Fence Goods
						</button>
						<button class="action-btn danger" onclick={() => onAction('illegal_mods')}>
							<span class="btn-icon">{'\u{1F529}'}</span>
							Illegal Modifications
						</button>
						<button class="action-btn danger" onclick={() => onAction('hire_mercenary')}>
							<span class="btn-icon">{'\u{1F52B}'}</span>
							Hire Mercenaries
						</button>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Ship Detail Modal -->
	{#if inspectedShip}
		{@const ship = inspectedShip.ship}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="travel-modal-overlay" onclick={() => { inspectedShip = null; }} role="presentation">
			<!-- svelte-ignore a11y_interactive_supports_focus -->
			<div class="ship-detail-modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
				<button class="sdm-close" onclick={() => { inspectedShip = null; }}>&times;</button>

				<div class="sdm-header">
					<h3 class="sdm-name">{ship.name}</h3>
					<div class="sdm-meta">
						{#if ship.class_info}
							<span class="sdm-role">{ship.class_info.label} &mdash; {ship.class_info.role}</span>
						{:else}
							<span class="sdm-role">{ship.class}</span>
						{/if}
						<div class="rarity-stars" title="{getRarityInfo(ship.rarity).label}">
							{#each Array(Math.min(getRarityInfo(ship.rarity).stars, 5)) as _}
								<span class="r-star filled" style="color: {getRarityInfo(ship.rarity).color}">{'\u2605'}</span>
							{/each}
							{#each Array(Math.max(0, 5 - getRarityInfo(ship.rarity).stars)) as _}
								<span class="r-star empty">{'\u2606'}</span>
							{/each}
							{#if getRarityInfo(ship.rarity).stars > 5}
								<span class="r-star overflow" style="color: {getRarityInfo(ship.rarity).color}">+{'\u2605'}</span>
							{/if}
						</div>
					</div>
				</div>

				{#if ship.description}
					<p class="sdm-description">{ship.description}</p>
				{:else if ship.class_info?.description}
					<p class="sdm-description">{ship.class_info.description}</p>
				{/if}

				{#if ship.stats}
					<div class="sdm-section">
						<h4>Ship Stats</h4>
						<div class="sdm-stats-grid">
							<div class="sdm-stat">
								<span class="sdm-stat-label">Hull</span>
								<span class="sdm-stat-value">{ship.stats.hull_strength.toLocaleString()}</span>
							</div>
							<div class="sdm-stat">
								<span class="sdm-stat-label">Shields</span>
								<span class="sdm-stat-value">{ship.stats.shield_strength.toLocaleString()}</span>
							</div>
							<div class="sdm-stat">
								<span class="sdm-stat-label">Cargo</span>
								<span class="sdm-stat-value">{ship.stats.cargo_capacity.toLocaleString()}</span>
							</div>
							<div class="sdm-stat">
								<span class="sdm-stat-label">Speed</span>
								<span class="sdm-stat-value">{ship.stats.speed}</span>
							</div>
							<div class="sdm-stat">
								<span class="sdm-stat-label">Weapon Slots</span>
								<span class="sdm-stat-value">{ship.stats.weapon_slots}</span>
							</div>
							<div class="sdm-stat">
								<span class="sdm-stat-label">Utility Slots</span>
								<span class="sdm-stat-value">{ship.stats.utility_slots}</span>
							</div>
						</div>
					</div>
				{/if}

				{#if ship.fuel}
					<div class="sdm-section">
						<h4>Fuel</h4>
						<div class="sdm-stats-grid cols-3">
							<div class="sdm-stat">
								<span class="sdm-stat-label">Max Fuel</span>
								<span class="sdm-stat-value">{ship.fuel.max_fuel.toLocaleString()}</span>
							</div>
							<div class="sdm-stat">
								<span class="sdm-stat-label">Regen Rate</span>
								<span class="sdm-stat-value">{ship.fuel.regen_rate}</span>
							</div>
							<div class="sdm-stat">
								<span class="sdm-stat-label">Consumption</span>
								<span class="sdm-stat-value">{ship.fuel.consumption_rate}</span>
							</div>
						</div>
					</div>
				{/if}

				{#if ship.components}
					<div class="sdm-section">
						<h4>Components</h4>
						<div class="sdm-stats-grid cols-3">
							<div class="sdm-stat">
								<span class="sdm-stat-label">Weapons</span>
								<span class="sdm-stat-value">{ship.components.weapons}</span>
							</div>
							<div class="sdm-stat">
								<span class="sdm-stat-label">Sensors</span>
								<span class="sdm-stat-value">{ship.components.sensors}</span>
							</div>
							<div class="sdm-stat">
								<span class="sdm-stat-label">Warp Drive</span>
								<span class="sdm-stat-value">{ship.components.warp_drive}</span>
							</div>
						</div>
					</div>
				{/if}

				{#if ship.special_features && ship.special_features.length > 0}
					<div class="sdm-section">
						<h4>Special Features</h4>
						<div class="sdm-features">
							{#each ship.special_features as feat}
								<div class="sdm-feature">
									<span class="sdm-feature-name">{feat.name}</span>
									<span class="sdm-feature-value">
										{typeof feat.value === 'boolean' ? (feat.value ? 'Yes' : 'No') : feat.value}
									</span>
									<span class="sdm-feature-desc">{feat.description}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- TODO(human): Strengths & Weaknesses display section -->
				{#if ship.class_info?.strengths || ship.class_info?.weaknesses}
					<div class="sdm-section sdm-sw-section">
						<h4>Assessment</h4>
					</div>
				{/if}

				<div class="sdm-footer">
					{#if ship.requirements}
						<span class="sdm-req" class:met={playerState.level >= ship.requirements.level} class:unmet={playerState.level < ship.requirements.level}>
							Required Level: {ship.requirements.level}
						</span>
					{/if}
					<span class="sdm-price">{formatPrice(inspectedShip.current_price)} credits</span>
				</div>
			</div>
		</div>
	{/if}

	<!-- Travel Confirmation Modal -->
	{#if pendingTravel}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="travel-modal-overlay" onclick={cancelTravel} role="presentation">
			<!-- svelte-ignore a11y_interactive_supports_focus -->
			<div class="travel-modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
				<div class="modal-icon">
					{#if pendingTravel.type === 'gate'}
						<svg viewBox="0 0 64 64" class="modal-stargate">
							<circle cx="32" cy="32" r="29" fill="none" stroke="#4a90a4" stroke-width="2.5" />
							<circle cx="32" cy="32" r="24" fill="none" stroke="#6bb8cc" stroke-width="2" />
							{#each Array(9) as _, i}
								{@const angle = (i * 40 - 90) * (Math.PI / 180)}
								{@const x = 32 + 27 * Math.cos(angle)}
								{@const y = 32 + 27 * Math.sin(angle)}
								<polygon
									points="{x},{y - 4} {x - 3},{y + 3} {x + 3},{y + 3}"
									fill="#f6ad55"
									transform="rotate({i * 40}, {x}, {y})"
								/>
							{/each}
							<circle cx="32" cy="32" r="18" fill="url(#modalEventHorizon)" />
							<defs>
								<radialGradient id="modalEventHorizon">
									<stop offset="0%" stop-color="#1a3a4a" />
									<stop offset="40%" stop-color="#2a6a7a" />
									<stop offset="100%" stop-color="#4a90a4" />
								</radialGradient>
							</defs>
						</svg>
					{:else}
						<span class="modal-planet-icon">&#x1F30D;</span>
					{/if}
				</div>
				<h3 class="modal-title">Confirm Travel</h3>
				<p class="modal-message">
					Do you want to travel to <strong>{pendingTravel.name}</strong>?
				</p>
				{#if pendingTravel.distance}
					<p class="modal-distance">{pendingTravel.distance.toFixed(1)} light years away</p>
				{/if}
				{#if pendingTravel.fuelCost != null}
					<p class="modal-fuel-cost">Fuel cost: <strong>{pendingTravel.fuelCost}</strong></p>
				{/if}
				<!-- TODO(human): Add pirate warning display here -->
				<div class="modal-actions">
					<button class="modal-btn modal-btn-cancel" onclick={cancelTravel}>
						No
					</button>
					<button class="modal-btn modal-btn-confirm" onclick={confirmTravel}>
						Yes
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Warp Loader (shown during travel) -->
	{#if isTraveling}
		<WarpLoader
			destinationName={travelDestination ?? undefined}
			status={travelStatus ?? undefined}
		/>
	{/if}
</div>

<style>
	.action-panel {
		flex: 1;
		background: rgba(26, 32, 44, 0.85);
		border: 1px solid #4a5568;
		border-radius: 8px;
		padding: 1rem;
		min-height: 200px;
		overflow-y: auto;
		max-height: calc(100vh - 180px);
	}

	.action-panel::-webkit-scrollbar {
		width: 6px;
	}

	.action-panel::-webkit-scrollbar-track {
		background: rgba(74, 85, 104, 0.2);
		border-radius: 3px;
	}

	.action-panel::-webkit-scrollbar-thumb {
		background: #4a5568;
		border-radius: 3px;
	}

	.panel-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		min-height: 150px;
		color: #718096;
		font-size: 0.9rem;
	}

	.panel-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.panel-title {
		font-size: 1rem;
		font-weight: 600;
		color: #e2e8f0;
		margin: 0;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #4a5568;
	}

	.services-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: 0.5rem;
	}

	.service-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
		padding: 0.75rem;
		background: linear-gradient(to bottom, #4a5568, #2d3748);
		border: 1px solid #1a202c;
		border-radius: 6px;
		color: #e2e8f0;
		cursor: pointer;
		transition: all 0.15s;
	}

	.service-btn:hover {
		background: linear-gradient(to bottom, #718096, #4a5568);
		border-color: #4a5568;
	}

	.service-icon {
		font-size: 1.5rem;
	}

	.service-label {
		font-size: 0.75rem;
		font-weight: 500;
		text-align: center;
	}

	.action-btn {
		padding: 0.5rem 1rem;
		background: linear-gradient(to bottom, #4a5568, #2d3748);
		border: 1px solid #1a202c;
		border-radius: 4px;
		color: #e2e8f0;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}

	.action-btn:hover {
		background: linear-gradient(to bottom, #718096, #4a5568);
		border-color: #4a5568;
	}

	.section-title {
		font-size: 0.8rem;
		font-weight: 600;
		color: #a0aec0;
		margin: 0 0 0.5rem 0;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.no-features {
		color: #718096;
		font-size: 0.85rem;
		font-style: italic;
		margin: 0;
	}

	.loading {
		color: #718096;
		font-size: 0.85rem;
	}

	/* Shipyard styles */
	.shipyard-section {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #4a5568;
	}

	.credits-display {
		font-size: 0.85rem;
		color: #a0aec0;
		margin-bottom: 0.75rem;
	}

	.credits-value {
		color: #48bb78;
		font-weight: 600;
	}

	.purchase-message {
		padding: 0.5rem 0.75rem;
		border-radius: 4px;
		font-size: 0.8rem;
		margin-bottom: 0.75rem;
		background: rgba(239, 68, 68, 0.2);
		border: 1px solid rgba(239, 68, 68, 0.4);
		color: #fc8181;
	}

	.purchase-message.success {
		background: rgba(72, 187, 120, 0.2);
		border-color: rgba(72, 187, 120, 0.4);
		color: #68d391;
	}

	.ships-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.ship-card {
		background: rgba(45, 55, 72, 0.8);
		border: 1px solid #4a5568;
		border-radius: 6px;
		padding: 0.75rem;
	}

	.ship-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.375rem;
	}

	.ship-name {
		font-weight: 600;
		color: #e2e8f0;
		font-size: 0.9rem;
	}

	.ship-rarity {
		font-size: 0.65rem;
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
		text-transform: uppercase;
		font-weight: 600;
	}

	.ship-rarity.rarity-common {
		background: rgba(113, 128, 150, 0.2);
		color: #a0aec0;
	}

	.ship-rarity.rarity-uncommon {
		background: rgba(72, 187, 120, 0.2);
		color: #68d391;
	}

	.ship-rarity.rarity-rare {
		background: rgba(99, 179, 237, 0.2);
		color: #63b3ed;
	}

	.ship-rarity.rarity-epic {
		background: rgba(159, 122, 234, 0.2);
		color: #b794f4;
	}

	.ship-rarity.rarity-legendary {
		background: rgba(246, 173, 85, 0.2);
		color: #f6ad55;
	}

	.ship-class-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		width: 100%;
		padding: 0.375rem 0.5rem;
		margin-bottom: 0.5rem;
		background: rgba(26, 32, 44, 0.6);
		border: 1px solid #2d3748;
		border-radius: 4px;
		color: #63b3ed;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
		text-align: left;
		text-transform: capitalize;
	}

	.ship-class-btn:hover {
		background: rgba(49, 60, 80, 0.8);
		border-color: #4a5568;
		color: #90cdf4;
	}

	.class-role {
		color: #718096;
		font-weight: 400;
	}

	.inspect-hint {
		margin-left: auto;
		font-size: 0.7rem;
		color: #4a5568;
		font-weight: 400;
	}

	.ship-class-btn:hover .inspect-hint {
		color: #718096;
	}

	.ship-stats-brief {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		font-size: 0.7rem;
		color: #a0aec0;
		margin-bottom: 0.5rem;
	}

	.ship-stats-brief span {
		background: rgba(26, 32, 44, 0.6);
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
	}

	.ship-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(74, 85, 104, 0.5);
	}

	.ship-price-block {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.ship-price {
		font-weight: 600;
		color: #f6ad55;
		font-size: 0.85rem;
	}

	.ship-stock {
		font-size: 0.7rem;
		color: #718096;
	}

	.level-req {
		font-size: 0.75rem;
		font-weight: 600;
		color: #fc8181;
		padding: 0.25rem 0.5rem;
		background: rgba(239, 68, 68, 0.1);
		border-radius: 4px;
	}

	.buy-btn {
		padding: 0.375rem 0.75rem;
		background: linear-gradient(to bottom, #48bb78, #38a169);
		border: 1px solid #276749;
		border-radius: 4px;
		color: white;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}

	.buy-btn:hover:not(:disabled) {
		background: linear-gradient(to bottom, #68d391, #48bb78);
	}

	.buy-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background: linear-gradient(to bottom, #4a5568, #2d3748);
		border-color: #1a202c;
	}

	/* Ship Detail Modal */
	.ship-detail-modal {
		position: relative;
		background: linear-gradient(to bottom, #2d3748, #1a202c);
		border: 1px solid #4a5568;
		border-radius: 12px;
		padding: 1.5rem;
		max-width: 480px;
		width: 90%;
		max-height: 85vh;
		overflow-y: auto;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.5),
			0 0 0 1px rgba(100, 120, 140, 0.2);
	}

	.ship-detail-modal::-webkit-scrollbar {
		width: 6px;
	}

	.ship-detail-modal::-webkit-scrollbar-track {
		background: rgba(74, 85, 104, 0.2);
		border-radius: 3px;
	}

	.ship-detail-modal::-webkit-scrollbar-thumb {
		background: #4a5568;
		border-radius: 3px;
	}

	.sdm-close {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		background: none;
		border: none;
		color: #718096;
		font-size: 1.5rem;
		cursor: pointer;
		line-height: 1;
		padding: 0.25rem;
	}

	.sdm-close:hover {
		color: #e2e8f0;
	}

	.sdm-header {
		margin-bottom: 0.75rem;
	}

	.sdm-name {
		font-size: 1.2rem;
		font-weight: 700;
		color: #e2e8f0;
		margin: 0 0 0.25rem 0;
	}

	.sdm-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.sdm-role {
		font-size: 0.8rem;
		color: #a0aec0;
	}

	.sdm-description {
		font-size: 0.85rem;
		color: #a0aec0;
		line-height: 1.5;
		margin: 0 0 1rem 0;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid rgba(74, 85, 104, 0.5);
	}

	.sdm-section {
		margin-bottom: 0.75rem;
	}

	.sdm-section h4 {
		font-size: 0.7rem;
		font-weight: 600;
		color: #718096;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 0.5rem 0;
	}

	.sdm-stats-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.375rem;
	}

	.sdm-stats-grid.cols-3 {
		grid-template-columns: 1fr 1fr 1fr;
	}

	.sdm-stat {
		display: flex;
		justify-content: space-between;
		padding: 0.25rem 0.5rem;
		background: rgba(26, 32, 44, 0.6);
		border-radius: 4px;
		font-size: 0.8rem;
	}

	.sdm-stat-label {
		color: #a0aec0;
	}

	.sdm-stat-value {
		color: #e2e8f0;
		font-weight: 600;
	}

	.sdm-features {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.sdm-feature {
		display: grid;
		grid-template-columns: 1fr auto;
		grid-template-rows: auto auto;
		gap: 0.125rem 0.5rem;
		padding: 0.375rem 0.5rem;
		background: rgba(26, 32, 44, 0.6);
		border-radius: 4px;
		border-left: 2px solid #f6ad55;
	}

	.sdm-feature-name {
		font-size: 0.8rem;
		font-weight: 600;
		color: #e2e8f0;
	}

	.sdm-feature-value {
		font-size: 0.8rem;
		font-weight: 600;
		color: #f6ad55;
		text-align: right;
	}

	.sdm-feature-desc {
		grid-column: 1 / -1;
		font-size: 0.7rem;
		color: #718096;
	}

	.sdm-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 0.75rem;
		border-top: 1px solid rgba(74, 85, 104, 0.5);
		margin-top: 0.5rem;
	}

	.sdm-req {
		font-size: 0.8rem;
		font-weight: 600;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
	}

	.sdm-req.met {
		color: #68d391;
		background: rgba(72, 187, 120, 0.1);
	}

	.sdm-req.unmet {
		color: #fc8181;
		background: rgba(239, 68, 68, 0.1);
	}

	.sdm-price {
		font-size: 1rem;
		font-weight: 700;
		color: #f6ad55;
	}

	/* Salvage Yard Cards */
	.salvage-list {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.salvage-card {
		background: rgba(45, 55, 72, 0.8);
		border: 1px solid #4a5568;
		border-radius: 6px;
		padding: 0.75rem;
	}

	.salvage-card.unavailable {
		opacity: 0.7;
		border-color: #2d3748;
	}

	.salvage-card.exotic-glow {
		border-color: #ffd700;
		box-shadow: 0 0 8px rgba(255, 215, 0, 0.25), inset 0 0 8px rgba(255, 215, 0, 0.05);
		animation: exotic-shimmer 3s ease-in-out infinite;
	}

	@keyframes exotic-shimmer {
		0%, 100% { box-shadow: 0 0 8px rgba(255, 215, 0, 0.25), inset 0 0 8px rgba(255, 215, 0, 0.05); }
		50% { box-shadow: 0 0 14px rgba(255, 215, 0, 0.4), inset 0 0 12px rgba(255, 215, 0, 0.1); }
	}

	.salvage-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.375rem;
	}

	.salvage-name {
		font-weight: 600;
		color: #e2e8f0;
		font-size: 0.9rem;
	}

	.rarity-stars {
		display: flex;
		align-items: center;
		gap: 1px;
		flex-shrink: 0;
	}

	.r-star {
		font-size: 0.55rem;
		line-height: 1;
	}

	.r-star.filled {
		filter: drop-shadow(0 0 1px currentColor);
	}

	.r-star.empty {
		color: #4a5568;
	}

	.r-star.overflow {
		font-size: 0.5rem;
		font-weight: 700;
		animation: overflow-pulse 1.5s ease-in-out infinite;
	}

	@keyframes overflow-pulse {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.8; transform: scale(1.15); }
	}

	.salvage-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		font-size: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.salvage-type {
		color: #a0aec0;
		background: rgba(26, 32, 44, 0.6);
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
		text-transform: capitalize;
	}

	.salvage-condition {
		color: #a0aec0;
	}

	.condition-pct {
		color: #718096;
	}

	.salvage-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(74, 85, 104, 0.5);
	}

	.salvage-price-block {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.salvage-price {
		font-weight: 600;
		color: #f6ad55;
		font-size: 0.85rem;
	}

	.salvage-price.affordable {
		color: #48bb78;
	}

	.salvage-price.expensive {
		color: #fc8181;
	}

	.salvage-stock {
		font-size: 0.7rem;
		color: #718096;
	}

	.salvage-source {
		font-size: 0.7rem;
		color: #a0aec0;
		background: rgba(26, 32, 44, 0.6);
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
	}

	.error-message {
		color: #fc8181;
		font-size: 0.85rem;
		margin: 0;
	}

	.retry-btn {
		margin-top: 0.5rem;
		padding: 0.375rem 0.75rem;
		background: linear-gradient(to bottom, #4a5568, #2d3748);
		border: 1px solid #1a202c;
		border-radius: 4px;
		color: #e2e8f0;
		font-size: 0.8rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.retry-btn:hover {
		background: linear-gradient(to bottom, #718096, #4a5568);
	}

	.danger-badge {
		font-size: 0.65rem;
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
		text-transform: uppercase;
		font-weight: 600;
	}

	.danger-badge.low {
		background: rgba(72, 187, 120, 0.2);
		color: #68d391;
	}

	.danger-badge.medium {
		background: rgba(246, 173, 85, 0.2);
		color: #f6ad55;
	}

	.danger-badge.high {
		background: rgba(239, 68, 68, 0.2);
		color: #fc8181;
	}

	/* Ship card states */
	.ship-card.unavailable {
		opacity: 0.7;
		border-color: #2d3748;
	}

	.ship-price.affordable {
		color: #48bb78;
	}

	.ship-price.expensive {
		color: #fc8181;
	}

	.danger-badge.extreme {
		background: rgba(159, 122, 234, 0.2);
		color: #b794f4;
	}

	/* Trading Panel Wrapper */
	.trading-panel-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		height: 100%;
	}

	.back-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: rgba(45, 55, 72, 0.6);
		border: 1px solid #4a5568;
		border-radius: 4px;
		color: #a0aec0;
		font-size: 0.8rem;
		cursor: pointer;
		transition: all 0.15s;
		align-self: flex-start;
	}

	.back-btn:hover {
		background: rgba(45, 55, 72, 0.8);
		color: #e2e8f0;
	}

	.back-arrow {
		font-size: 1rem;
	}

	/* Solar System View Styles */
	.solar-system-container {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: 1rem;
		padding: 2.5rem 1.5rem;
		background: radial-gradient(ellipse at 10% 50%, rgba(30, 40, 60, 0.9), rgba(15, 20, 30, 0.95));
		border-radius: 8px;
		overflow: visible;
		min-height: 160px;
		position: relative;
	}

	.star-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
		padding: 0 1rem;
	}

	.star {
		width: 72px;
		height: 72px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: radial-gradient(circle at 30% 30%, #ffd700, #ff8c00, #ff4500);
		box-shadow:
			0 0 30px rgba(255, 165, 0, 0.7),
			0 0 60px rgba(255, 140, 0, 0.5),
			0 0 90px rgba(255, 100, 0, 0.3);
		animation: star-pulse 3s ease-in-out infinite;
	}

	/* O-class: Blue supergiants - largest */
	.star.class-o {
		width: 110px;
		height: 110px;
		background: radial-gradient(circle at 30% 30%, #9bb0ff, #6b8cff, #4a6fff);
		box-shadow:
			0 0 40px rgba(107, 140, 255, 0.8),
			0 0 80px rgba(74, 111, 255, 0.5),
			0 0 120px rgba(74, 111, 255, 0.3);
	}

	/* B-class: Blue giants - very large */
	.star.class-b {
		width: 100px;
		height: 100px;
		background: radial-gradient(circle at 30% 30%, #aabfff, #8aa7ff, #6b8cff);
		box-shadow:
			0 0 35px rgba(138, 167, 255, 0.7),
			0 0 70px rgba(107, 140, 255, 0.5),
			0 0 100px rgba(107, 140, 255, 0.3);
	}

	/* A-class: White stars - large */
	.star.class-a {
		width: 88px;
		height: 88px;
		background: radial-gradient(circle at 30% 30%, #cad8ff, #f8f7ff, #cad8ff);
		box-shadow:
			0 0 30px rgba(248, 247, 255, 0.8),
			0 0 60px rgba(202, 216, 255, 0.5),
			0 0 90px rgba(202, 216, 255, 0.3);
	}

	/* F-class: Yellow-white stars - medium-large */
	.star.class-f {
		width: 80px;
		height: 80px;
		background: radial-gradient(circle at 30% 30%, #f8f7ff, #fff4e8, #ffe9c4);
		box-shadow:
			0 0 25px rgba(255, 244, 232, 0.7),
			0 0 50px rgba(255, 233, 196, 0.5),
			0 0 80px rgba(255, 233, 196, 0.3);
	}

	/* G-class: Yellow stars (like our Sun) - medium */
	.star.class-g {
		width: 72px;
		height: 72px;
		background: radial-gradient(circle at 30% 30%, #fff4e8, #ffd700, #ffb300);
		box-shadow:
			0 0 25px rgba(255, 215, 0, 0.7),
			0 0 50px rgba(255, 179, 0, 0.5),
			0 0 75px rgba(255, 179, 0, 0.3);
	}

	/* K-class: Orange stars - smaller */
	.star.class-k {
		width: 64px;
		height: 64px;
		background: radial-gradient(circle at 30% 30%, #ffcc6f, #ff9d00, #ff7b00);
		box-shadow:
			0 0 20px rgba(255, 157, 0, 0.7),
			0 0 40px rgba(255, 123, 0, 0.5),
			0 0 60px rgba(255, 123, 0, 0.3);
	}

	/* M-class: Red dwarfs - smallest */
	.star.class-m {
		width: 54px;
		height: 54px;
		background: radial-gradient(circle at 30% 30%, #ffad6f, #ff5900, #cc2200);
		box-shadow:
			0 0 15px rgba(255, 89, 0, 0.7),
			0 0 30px rgba(204, 34, 0, 0.5),
			0 0 45px rgba(204, 34, 0, 0.3);
	}

	@keyframes star-pulse {
		0%,
		100% {
			transform: scale(1);
			filter: brightness(1);
		}
		50% {
			transform: scale(1.05);
			filter: brightness(1.1);
		}
	}

	.star-icon {
		font-size: 2.25rem;
		color: rgba(255, 255, 255, 0.9);
		text-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
	}

	.star-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #e2e8f0;
		text-align: center;
		max-width: 80px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.star-class {
		font-size: 0.6rem;
		color: #f6ad55;
		background: rgba(246, 173, 85, 0.2);
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
	}

	.orbital-track {
		display: flex;
		align-items: center;
		justify-content: space-evenly;
		padding: 0.5rem;
		position: relative;
		flex: 1;
		min-width: 0;
		gap: 0.5rem;
	}

	.orbital-track::before {
		content: '';
		position: absolute;
		top: 50%;
		left: -20px;
		right: 0;
		height: 2px;
		background: linear-gradient(to right, rgba(74, 85, 104, 0.6), rgba(74, 85, 104, 0.3), rgba(74, 85, 104, 0.1));
		z-index: 0;
		transform: translateY(-50%);
	}

	.orbital-body {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 0.375rem;
		border-radius: 50%;
		background: rgba(45, 55, 72, 0.9);
		border: 2px solid #4a5568;
		cursor: pointer;
		transition: all 0.2s;
		z-index: 1;
	}

	/* Orbit ring effect */
	.orbital-body::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 140%;
		height: 140%;
		transform: translate(-50%, -50%);
		border: 1px dashed rgba(100, 120, 140, 0.4);
		border-radius: 50%;
		pointer-events: none;
	}

	.orbital-body:hover {
		transform: scale(1.1);
		border-color: #63b3ed;
		box-shadow: 0 0 12px rgba(99, 179, 237, 0.5);
	}

	.orbital-body:hover::before {
		border-color: rgba(99, 179, 237, 0.5);
		border-style: solid;
	}

	.orbital-body.selected {
		transform: scale(1.15);
		border-color: #f6ad55;
		box-shadow: 0 0 16px rgba(246, 173, 85, 0.6);
	}

	.orbital-body.selected::before {
		border-color: rgba(246, 173, 85, 0.5);
		border-style: solid;
	}

	.orbital-body.planet {
		width: 52px;
		height: 52px;
		background: transparent;
		border: none;
	}

	.orbital-body.planet::before {
		display: none;
	}

	.orbital-body.asteroid {
		width: 36px;
		height: 36px;
		border-radius: 6px;
	}

	.orbital-body.asteroid::before {
		border-radius: 8px;
	}

	.orbital-body.station {
		width: 44px;
		height: 44px;
		border-radius: 8px;
		border-color: #63b3ed;
	}

	.orbital-body.station::before {
		border-radius: 10px;
		border-color: rgba(99, 179, 237, 0.3);
	}

	.orbital-body.inhabited {
		border-color: #48bb78;
	}

	.orbital-body.inhabited::before {
		border-color: rgba(72, 187, 120, 0.3);
	}

	.orbital-body.inhabited:hover {
		border-color: #68d391;
		box-shadow: 0 0 12px rgba(72, 187, 120, 0.5);
	}

	.orbital-body.inhabited:hover::before {
		border-color: rgba(72, 187, 120, 0.5);
	}

	.orbital-body.inhabited.selected {
		border-color: #f6ad55;
		box-shadow: 0 0 16px rgba(246, 173, 85, 0.6);
	}

	.orbital-icon {
		font-size: 1.5rem;
	}

	.moon-indicator {
		position: absolute;
		top: -4px;
		right: -4px;
		width: 16px;
		height: 16px;
		background: #4a5568;
		border: 1px solid #718096;
		border-radius: 50%;
		font-size: 0.55rem;
		color: #e2e8f0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
	}

	.inhabited-indicator {
		position: absolute;
		bottom: -2px;
		right: -2px;
		width: 8px;
		height: 8px;
		background: #48bb78;
		border-radius: 50%;
		box-shadow: 0 0 4px rgba(72, 187, 120, 0.8);
	}

	/* Planet Visual with custom colors */
	.planet-visual {
		position: relative;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.planet-sphere {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: radial-gradient(
			circle at 30% 30%,
			var(--planet-accent),
			var(--planet-primary) 50%,
			var(--planet-secondary) 100%
		);
		box-shadow:
			inset -4px -4px 8px rgba(0, 0, 0, 0.4),
			0 0 8px rgba(255, 255, 255, 0.1);
		position: relative;
		z-index: 2;
	}

	.planet-rings {
		position: absolute;
		width: 52px;
		height: 16px;
		border: 2px solid rgba(200, 180, 140, 0.6);
		border-radius: 50%;
		transform: rotateX(70deg);
		z-index: 1;
		box-shadow: 0 0 4px rgba(200, 180, 140, 0.3);
	}

	.planet-rings::before {
		content: '';
		position: absolute;
		top: 2px;
		left: 2px;
		right: 2px;
		bottom: 2px;
		border: 1px solid rgba(180, 160, 120, 0.4);
		border-radius: 50%;
	}

	.planet-rings::after {
		content: '';
		position: absolute;
		top: -3px;
		left: -3px;
		right: -3px;
		bottom: -3px;
		border: 1px solid rgba(220, 200, 160, 0.3);
		border-radius: 50%;
	}

	/* Orbital Body Wrapper - handles alternating label positions */
	.orbital-body-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;
		gap: 0;
		min-width: 52px;
	}

	.orbital-body-wrapper.label-above {
		flex-direction: column;
	}

	.orbital-body-wrapper.label-below {
		flex-direction: column-reverse;
	}

	/* Label container with connector line */
	.body-label-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0;
	}

	.body-label-container.above {
		flex-direction: column;
		padding-bottom: 4px;
	}

	.body-label-container.below {
		flex-direction: column-reverse;
		padding-top: 4px;
	}

	.body-name {
		font-size: 0.65rem;
		color: #a0aec0;
		white-space: nowrap;
		max-width: 70px;
		overflow: hidden;
		text-overflow: ellipsis;
		text-align: center;
		padding: 0 2px;
	}

	.body-name.selected {
		color: #f6ad55;
		font-weight: 600;
	}

	.connector-line {
		width: 1px;
		height: 12px;
		background: linear-gradient(to bottom, rgba(160, 174, 192, 0.6), rgba(160, 174, 192, 0.2));
	}

	.body-label-container.below .connector-line {
		background: linear-gradient(to top, rgba(160, 174, 192, 0.6), rgba(160, 174, 192, 0.2));
	}

	/* Planet SVG styling */
	.planet-svg {
		display: block;
		transition: filter 0.2s, transform 0.2s;
	}

	.orbital-body.planet:hover .planet-svg {
		filter: drop-shadow(0 0 8px rgba(99, 179, 237, 0.7));
		transform: scale(1.1);
	}

	.orbital-body.planet.selected .planet-svg {
		filter: drop-shadow(0 0 12px rgba(246, 173, 85, 0.8));
		transform: scale(1.15);
	}

	.orbital-body.planet.inhabited:hover .planet-svg {
		filter: drop-shadow(0 0 8px rgba(72, 187, 120, 0.7));
	}

	/* Body Details Panel - Below the solar system */
	.body-details-panel {
		background: rgba(20, 25, 35, 0.95);
		border: 1px solid #4a5568;
		border-radius: 8px;
		padding: 1rem;
		margin-top: 0.5rem;
		max-height: 400px;
		overflow-y: auto;
	}

	.body-details-panel::-webkit-scrollbar {
		width: 6px;
	}

	.body-details-panel::-webkit-scrollbar-track {
		background: rgba(74, 85, 104, 0.2);
		border-radius: 3px;
	}

	.body-details-panel::-webkit-scrollbar-thumb {
		background: #4a5568;
		border-radius: 3px;
	}

	.details-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #4a5568;
	}

	.details-title-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.details-title {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: #e2e8f0;
	}

	.details-type {
		font-size: 0.75rem;
		color: #718096;
		text-transform: capitalize;
		padding: 0.125rem 0.375rem;
		background: rgba(74, 85, 104, 0.4);
		border-radius: 3px;
	}

	.details-tag {
		font-size: 0.65rem;
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
		text-transform: uppercase;
		font-weight: 600;
	}

	.details-tag.inhabited {
		background: rgba(72, 187, 120, 0.25);
		color: #68d391;
	}

	.close-details {
		background: transparent;
		border: none;
		color: #718096;
		font-size: 1rem;
		cursor: pointer;
		padding: 0.25rem;
		line-height: 1;
		transition: color 0.15s;
	}

	.close-details:hover {
		color: #e2e8f0;
	}

	.details-description {
		font-size: 0.8rem;
		color: #a0aec0;
		margin: 0 0 0.75rem 0;
		line-height: 1.4;
		font-style: italic;
	}

	.details-grid,
	.details-content {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.details-section {
		padding: 0.5rem;
		background: rgba(45, 55, 72, 0.4);
		border-radius: 6px;
	}

	.details-section.properties-section {
		flex-shrink: 0;
	}

	.section-title {
		margin: 0 0 0.5rem 0;
		font-size: 0.75rem;
		font-weight: 600;
		color: #a0aec0;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.property-list {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.375rem;
	}

	.property-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.75rem;
		padding: 0.25rem 0.375rem;
		background: rgba(26, 32, 44, 0.5);
		border-radius: 3px;
	}

	.property-label {
		color: #718096;
	}

	.property-value {
		color: #e2e8f0;
		font-weight: 500;
	}

	/* Moons Section */
	.moons-section {
		background: rgba(74, 85, 104, 0.2);
		max-height: 280px;
		overflow-y: auto;
	}

	.moons-section::-webkit-scrollbar {
		width: 4px;
	}

	.moons-section::-webkit-scrollbar-track {
		background: rgba(74, 85, 104, 0.2);
		border-radius: 2px;
	}

	.moons-section::-webkit-scrollbar-thumb {
		background: #4a5568;
		border-radius: 2px;
	}

	.moons-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.moon-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
		background: rgba(26, 32, 44, 0.6);
		border-radius: 6px;
		border-left: 3px solid #4a5568;
	}

	.moon-card.inhabited {
		border-left-color: #48bb78;
	}

	.moon-visual {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: radial-gradient(
			circle at 30% 30%,
			var(--moon-primary),
			var(--moon-secondary)
		);
		box-shadow: inset -2px -2px 4px rgba(0, 0, 0, 0.3);
		flex-shrink: 0;
	}

	.moon-info {
		flex: 1;
		min-width: 0;
	}

	.moon-card-name {
		font-size: 0.85rem;
		font-weight: 600;
		color: #e2e8f0;
		display: block;
		margin-bottom: 0.25rem;
	}

	.moon-properties {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.moon-prop {
		font-size: 0.65rem;
		padding: 0.1rem 0.3rem;
		background: rgba(74, 85, 104, 0.5);
		border-radius: 2px;
		color: #a0aec0;
		text-transform: capitalize;
	}

	.moon-prop.inhabited {
		background: rgba(72, 187, 120, 0.25);
		color: #68d391;
	}

	.moon-services {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin-top: 0.25rem;
	}

	.moon-service {
		font-size: 0.6rem;
		padding: 0.1rem 0.3rem;
		background: rgba(99, 179, 237, 0.2);
		border: 1px solid rgba(99, 179, 237, 0.4);
		border-radius: 2px;
		color: #63b3ed;
	}

	/* Hazards Section */
	.hazards-section {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.2);
	}

	.hazard-title {
		color: #fc8181 !important;
	}

	.hazard-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.hazard-tag {
		font-size: 0.7rem;
		padding: 0.2rem 0.4rem;
		background: rgba(239, 68, 68, 0.2);
		border: 1px solid rgba(239, 68, 68, 0.4);
		border-radius: 3px;
		color: #fc8181;
	}

	/* Services Tags */
	.services-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.service-tag {
		font-size: 0.7rem;
		padding: 0.2rem 0.5rem;
		background: rgba(99, 179, 237, 0.15);
		border: 1px solid rgba(99, 179, 237, 0.3);
		border-radius: 3px;
		color: #63b3ed;
	}

	/* Tooltip Styles - kept for other uses */
	.body-tooltip {
		position: absolute;
		bottom: calc(100% + 12px);
		left: 50%;
		transform: translateX(-50%);
		background: rgba(20, 25, 35, 0.98);
		border: 1px solid #4a5568;
		border-radius: 8px;
		padding: 0.75rem;
		min-width: 220px;
		max-width: 320px;
		max-height: 400px;
		overflow-y: auto;
		z-index: 1000;
		box-shadow:
			0 4px 20px rgba(0, 0, 0, 0.5),
			0 0 0 1px rgba(100, 120, 140, 0.2);
		pointer-events: none;
		white-space: normal;
	}

	.body-tooltip::-webkit-scrollbar {
		width: 4px;
	}

	.body-tooltip::-webkit-scrollbar-track {
		background: rgba(74, 85, 104, 0.2);
		border-radius: 2px;
	}

	.body-tooltip::-webkit-scrollbar-thumb {
		background: #4a5568;
		border-radius: 2px;
	}

	.body-tooltip::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 8px solid transparent;
		border-top-color: #4a5568;
	}

	.tooltip-header {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #4a5568;
		margin-bottom: 0.5rem;
	}

	.tooltip-name {
		font-size: 0.95rem;
		font-weight: 600;
		color: #e2e8f0;
		line-height: 1.2;
	}

	.tooltip-type {
		font-size: 0.75rem;
		color: #a0aec0;
		text-transform: capitalize;
	}

	.tooltip-details {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.tooltip-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
	}

	.tooltip-row.services {
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
	}

	.tooltip-label {
		color: #718096;
		flex-shrink: 0;
	}

	.tooltip-value {
		color: #e2e8f0;
	}

	.tooltip-tag {
		font-size: 0.65rem;
		padding: 0.15rem 0.4rem;
		border-radius: 3px;
		text-transform: uppercase;
		font-weight: 600;
	}

	.tooltip-tag.inhabited {
		background: rgba(72, 187, 120, 0.25);
		color: #68d391;
	}

	.tooltip-moons {
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid #4a5568;
		font-size: 0.75rem;
	}

	.moon-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin-top: 0.25rem;
	}

	.moon-name {
		padding: 0.1rem 0.3rem;
		background: rgba(74, 85, 104, 0.5);
		border-radius: 2px;
		color: #a0aec0;
		font-size: 0.6rem;
	}

	.moon-name.inhabited {
		background: rgba(72, 187, 120, 0.2);
		color: #68d391;
	}

	/* Enhanced tooltip styles */
	.tooltip-description {
		font-size: 0.7rem;
		color: #a0aec0;
		font-style: italic;
		margin: 0 0 0.5rem 0;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid rgba(74, 85, 104, 0.5);
		line-height: 1.4;
	}

	.tooltip-section {
		padding-bottom: 0.375rem;
		margin-bottom: 0.375rem;
		border-bottom: 1px solid rgba(74, 85, 104, 0.3);
	}

	.tooltip-section:last-child {
		border-bottom: none;
		margin-bottom: 0;
		padding-bottom: 0;
	}

	.inhabited-section {
		background: rgba(72, 187, 120, 0.08);
		margin: 0.375rem -0.5rem;
		padding: 0.375rem 0.5rem;
		border-radius: 4px;
		border: none;
	}

	.tooltip-value.capitalize,
	.capitalize {
		text-transform: capitalize;
	}

	/* Temperature colors */
	.temp-frozen { color: #90cdf4; }
	.temp-cold { color: #63b3ed; }
	.temp-temperate { color: #68d391; }
	.temp-warm { color: #f6ad55; }
	.temp-hot { color: #fc8181; }
	.temp-scorching { color: #f56565; }

	/* Resource richness colors */
	.resource-barren { color: #718096; }
	.resource-poor { color: #a0aec0; }
	.resource-moderate { color: #68d391; }
	.resource-rich { color: #f6ad55; }
	.resource-abundant { color: #ffd700; }

	/* Security level colors */
	.security-lawless { color: #f56565; }
	.security-low { color: #fc8181; }
	.security-medium { color: #f6ad55; }
	.security-high { color: #68d391; }
	.security-maximum { color: #4299e1; }

	/* Resource list */
	.tooltip-resources {
		margin-top: 0.25rem;
	}

	.resource-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin-top: 0.25rem;
	}

	.resource-item {
		font-size: 0.6rem;
		padding: 0.1rem 0.3rem;
		background: rgba(74, 85, 104, 0.4);
		border-radius: 2px;
		color: #a0aec0;
	}

	.resource-item.abundance-trace { border-left: 2px solid #718096; }
	.resource-item.abundance-low { border-left: 2px solid #a0aec0; }
	.resource-item.abundance-moderate { border-left: 2px solid #68d391; }
	.resource-item.abundance-high { border-left: 2px solid #f6ad55; }
	.resource-item.abundance-very_high { border-left: 2px solid #ffd700; }

	/* Hazards */
	.tooltip-hazards {
		margin-top: 0.375rem;
		padding-top: 0.375rem;
		border-top: 1px solid rgba(239, 68, 68, 0.3);
	}

	.hazard-label {
		color: #fc8181 !important;
	}

	.hazard-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin-top: 0.25rem;
	}

	.hazard-item {
		font-size: 0.6rem;
		padding: 0.1rem 0.3rem;
		background: rgba(239, 68, 68, 0.2);
		border: 1px solid rgba(239, 68, 68, 0.4);
		border-radius: 2px;
		color: #fc8181;
	}

	/* Features */
	.tooltip-features {
		margin-top: 0.375rem;
	}

	.feature-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin-top: 0.25rem;
	}

	.feature-item {
		font-size: 0.6rem;
		padding: 0.1rem 0.3rem;
		background: rgba(99, 179, 237, 0.2);
		border: 1px solid rgba(99, 179, 237, 0.4);
		border-radius: 2px;
		color: #63b3ed;
	}

	/* Points of Interest */
	.tooltip-poi {
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid #4a5568;
	}

	.poi-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-top: 0.25rem;
	}

	.poi-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.65rem;
		padding: 0.2rem 0.3rem;
		background: rgba(246, 173, 85, 0.1);
		border-radius: 2px;
	}

	.poi-name {
		color: #f6ad55;
		font-weight: 500;
	}

	.poi-type {
		color: #718096;
		font-size: 0.55rem;
		text-transform: uppercase;
	}

	/* Summary Bar (commented out for now)
	.system-summary {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		padding: 0.5rem 0;
		border-bottom: 1px solid #4a5568;
	}

	.summary-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: #a0aec0;
	}

	.summary-item.inhabited {
		color: #68d391;
	}

	.summary-icon {
		font-size: 0.85rem;
	}
	*/

	/* Sector Info Bar */
	.sector-info-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.375rem 0;
	}

	.sector-name {
		font-size: 0.8rem;
		color: #a0aec0;
	}

	/* Warp Gate Sort Bar */
	.gate-sort-bar {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		margin-bottom: 0.5rem;
	}

	.gate-sort-label {
		font-size: 0.7rem;
		color: #718096;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin-right: 0.15rem;
	}

	.gate-sort-btn {
		background: rgba(45, 55, 72, 0.6);
		border: 1px solid #4a5568;
		border-radius: 4px;
		color: #a0aec0;
		font-size: 0.7rem;
		padding: 0.2rem 0.5rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.gate-sort-btn:hover {
		border-color: #6bb8cc;
		color: #e2e8f0;
	}

	.gate-sort-btn.active {
		background: rgba(74, 144, 164, 0.25);
		border-color: #4a90a4;
		color: #e2e8f0;
	}

	/* Warp Gates List Styles */
	.warp-gates-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.warp-gate-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.875rem 1rem;
		background: linear-gradient(to right, rgba(74, 144, 164, 0.15), rgba(45, 55, 72, 0.8));
		border: 1px solid #4a5568;
		border-left: 3px solid #4a90a4;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
	}

	.warp-gate-item:hover {
		background: linear-gradient(to right, rgba(74, 144, 164, 0.25), rgba(55, 65, 82, 0.9));
		border-color: #6bb8cc;
		border-left-color: #6bb8cc;
		transform: translateX(4px);
	}

	.gate-icon {
		position: relative;
		width: 48px;
		height: 48px;
		flex-shrink: 0;
	}

	.stargate-svg {
		width: 100%;
		height: 100%;
	}

	.gate-pulse {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 28px;
		height: 28px;
		transform: translate(-50%, -50%);
		border-radius: 50%;
		background: radial-gradient(circle, rgba(74, 144, 164, 0.4), transparent);
		animation: gate-pulse 2s ease-in-out infinite;
	}

	@keyframes gate-pulse {
		0%, 100% {
			transform: translate(-50%, -50%) scale(1);
			opacity: 0.6;
		}
		50% {
			transform: translate(-50%, -50%) scale(1.3);
			opacity: 0.2;
		}
	}

	.gate-destination {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.destination-name {
		font-size: 1rem;
		font-weight: 600;
		color: #e2e8f0;
	}

	.destination-distance {
		font-size: 0.8rem;
		color: #6bb8cc;
	}

	.gate-arrow {
		font-size: 1.25rem;
		color: #4a90a4;
		transition: transform 0.2s;
	}

	.warp-gate-item:hover .gate-arrow {
		transform: translateX(4px);
		color: #6bb8cc;
	}

	/* Travel Confirmation Modal */
	.travel-modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10000;
		backdrop-filter: blur(4px);
	}

	.travel-modal {
		background: linear-gradient(to bottom, #2d3748, #1a202c);
		border: 1px solid #4a5568;
		border-radius: 12px;
		padding: 1.5rem;
		max-width: 360px;
		width: 90%;
		text-align: center;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.5),
			0 0 0 1px rgba(100, 120, 140, 0.2);
	}

	.modal-icon {
		margin-bottom: 1rem;
	}

	.modal-stargate {
		width: 80px;
		height: 80px;
		margin: 0 auto;
		display: block;
	}

	.modal-planet-icon {
		font-size: 4rem;
		display: block;
	}

	.modal-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #e2e8f0;
		margin: 0 0 0.75rem 0;
	}

	.modal-message {
		font-size: 1rem;
		color: #a0aec0;
		margin: 0 0 0.5rem 0;
		line-height: 1.5;
	}

	.modal-message strong {
		color: #e2e8f0;
	}

	.modal-distance {
		font-size: 0.85rem;
		color: #6bb8cc;
		margin: 0 0 0.5rem 0;
	}

	.modal-fuel-cost {
		font-size: 0.85rem;
		color: #f6ad55;
		margin: 0 0 1.25rem 0;
	}

	.modal-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
	}

	.modal-btn {
		flex: 1;
		max-width: 120px;
		padding: 0.625rem 1.25rem;
		border-radius: 6px;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
		border: none;
	}

	.modal-btn-cancel {
		background: linear-gradient(to bottom, #4a5568, #2d3748);
		color: #e2e8f0;
		border: 1px solid #4a5568;
	}

	.modal-btn-cancel:hover {
		background: linear-gradient(to bottom, #718096, #4a5568);
	}

	.modal-btn-confirm {
		background: linear-gradient(to bottom, #4a90a4, #3a7a8a);
		color: white;
		border: 1px solid #3a7a8a;
	}

	.modal-btn-confirm:hover {
		background: linear-gradient(to bottom, #6bb8cc, #4a90a4);
	}

	/* Service Panel Styles */
	.service-panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.service-description {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 0.75rem;
		padding: 1rem;
		background: rgba(45, 55, 72, 0.5);
		border-radius: 8px;
		border: 1px solid #4a5568;
	}

	.service-panel-icon {
		font-size: 3rem;
	}

	.constellation-icon-lg {
		width: 3rem;
		height: 3rem;
	}

	.service-description p {
		margin: 0;
		font-size: 0.85rem;
		color: #a0aec0;
		line-height: 1.5;
	}

	.service-actions {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 0.5rem;
	}

	.service-actions .action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		font-size: 0.85rem;
	}

	.btn-icon {
		font-size: 1.1rem;
	}

	/* Ship Status Display */
	.ship-status {
		padding: 0.75rem;
		background: rgba(26, 32, 44, 0.8);
		border-radius: 6px;
		border: 1px solid #4a5568;
	}

	.status-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.375rem 0;
		font-size: 0.85rem;
	}

	.status-row:not(:last-child) {
		border-bottom: 1px solid rgba(74, 85, 104, 0.5);
	}

	.status-label {
		color: #718096;
	}

	.status-value {
		color: #68d391;
		font-weight: 600;
	}

	.status-value.damaged {
		color: #fc8181;
	}

	.status-value.low-fuel {
		color: #f6ad55;
	}

	/* Black Market Styles */
	.service-panel.black-market {
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 8px;
		padding: 0.5rem;
		background: rgba(239, 68, 68, 0.05);
	}

	.service-panel.black-market .service-description {
		border-color: rgba(239, 68, 68, 0.3);
		background: rgba(239, 68, 68, 0.1);
	}

	.warning-text {
		color: #fc8181 !important;
	}

	.action-btn.danger {
		background: linear-gradient(to bottom, #742a2a, #5a2020);
		border-color: #fc8181;
		color: #fed7d7;
	}

	.action-btn.danger:hover {
		background: linear-gradient(to bottom, #9b2c2c, #742a2a);
	}

	/* Selected body state */
	.orbital-body.selected {
		transform: scale(1.2);
		border-color: #f6ad55;
		box-shadow: 0 0 20px rgba(246, 173, 85, 0.6);
	}

	.orbital-body.selected::before {
		border-color: rgba(246, 173, 85, 0.5);
		border-style: solid;
	}

	/* Starter ship pitch card */
	.starter-pitch {
		border-color: rgba(246, 173, 85, 0.4) !important;
		background: linear-gradient(135deg, rgba(246, 173, 85, 0.08), rgba(221, 107, 32, 0.05)) !important;
	}

	.pitch-dialogue {
		padding: 0.75rem;
		margin-bottom: 0.5rem;
		border-left: 3px solid #f6ad55;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 0 6px 6px 0;
	}

	.pitch-speaker {
		display: block;
		font-size: 0.7rem;
		font-weight: 700;
		color: #f6ad55;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.35rem;
	}

	.pitch-text {
		font-size: 0.8rem;
		line-height: 1.5;
		color: #cbd5e0;
		font-style: italic;
		margin: 0;
	}

	.starter-tag {
		font-size: 0.65rem;
		font-weight: 700;
		color: #48bb78;
		background: rgba(72, 187, 120, 0.15);
		border: 1px solid rgba(72, 187, 120, 0.3);
		padding: 0.1rem 0.5rem;
		border-radius: 9999px;
		letter-spacing: 0.1em;
	}

	.price-note {
		font-size: 0.7rem;
		color: #a0aec0;
		font-style: italic;
		margin-left: 0.25rem;
	}

	/* Merchant commentary — dynamic sales pitch from backend */
	.merchant-commentary {
		font-size: 0.75rem;
		line-height: 1.4;
		color: #a0aec0;
		font-style: italic;
		margin: 0.375rem 0 0.25rem;
		padding: 0.35rem 0.5rem;
		border-left: 2px solid rgba(160, 174, 192, 0.3);
		background: rgba(0, 0, 0, 0.15);
		border-radius: 0 4px 4px 0;
	}

	/* Ship Naming Prompt */
	.naming-prompt {
		background: rgba(26, 32, 44, 0.8);
		border: 1px solid #4299e1;
		border-radius: 6px;
		padding: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.naming-header {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: #e2e8f0;
		margin-bottom: 0.35rem;
	}

	.naming-icon {
		color: #4299e1;
	}

	.naming-hint {
		font-size: 0.7rem;
		color: #68d391;
		margin: 0 0 0.5rem;
	}

	.naming-controls {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.naming-input {
		width: 100%;
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid #4a5568;
		border-radius: 4px;
		color: #e2e8f0;
		padding: 0.35rem 0.5rem;
		font-size: 0.8rem;
		outline: none;
		box-sizing: border-box;
	}

	.naming-input:focus {
		border-color: #4299e1;
	}

	.naming-buttons {
		display: flex;
		gap: 0.4rem;
	}

	.christen-btn {
		flex: 1;
		padding: 0.35rem;
		background: rgba(66, 153, 225, 0.3);
		border: 1px solid #4299e1;
		border-radius: 4px;
		color: #e2e8f0;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.christen-btn:hover:not(:disabled) {
		background: rgba(66, 153, 225, 0.5);
	}

	.christen-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.skip-btn {
		padding: 0.35rem 0.75rem;
		background: transparent;
		border: 1px solid #4a5568;
		border-radius: 4px;
		color: #a0aec0;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.skip-btn:hover:not(:disabled) {
		border-color: #718096;
		color: #e2e8f0;
	}

	.naming-message {
		font-size: 0.75rem;
		color: #fc8181;
		padding: 0.25rem;
	}

	.naming-message.success {
		color: #68d391;
	}
</style>
