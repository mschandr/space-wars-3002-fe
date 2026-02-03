<script lang="ts">
	import { playerState } from '$lib/stores/playerState.svelte';
	import { api, type ShipTemplate } from '$lib/api';

	interface Props {
		activeItem: 'planets' | 'trading' | 'salvage' | 'warp' | null;
		onAction: (action: string, targetUuid?: string) => void;
	}

	let { activeItem, onAction }: Props = $props();

	// Shipyard state
	let isLoadingShipyard = $state(false);
	let availableShips = $state<ShipTemplate[]>([]);
	let shipyardError = $state<string | null>(null);
	let isPurchasing = $state(false);
	let purchaseMessage = $state<string | null>(null);

	// Get location details from player state
	const locationDetails = $derived(playerState.locationDetails);
	const services = $derived(locationDetails?.has?.services ?? []);
	const gates = $derived(locationDetails?.has?.gates ?? {});
	const inhabitedBodies = $derived(locationDetails?.inhabited?.bodies ?? []);
	const isLoading = $derived(!locationDetails && playerState.currentSystem);

	const panelTitles: Record<string, string> = {
		planets: 'Local Planets',
		trading: 'Services',
		salvage: 'Salvage Yard',
		warp: 'Warp Gates'
	};

	// Service icons and labels
	const serviceInfo: Record<string, { icon: string; label: string }> = {
		trading_hub: { icon: '\u{1F4B0}', label: 'Trading Hub' },
		cartography: { icon: '\u{1F5FA}', label: 'Cartographer' },
		ship_shop: { icon: '\u{1F680}', label: 'Shipyard' },
		repair_yard: { icon: '\u{1F527}', label: 'Repair Yard' },
		plans_shop: { icon: '\u{1F4DC}', label: 'Ship Plans' }
	};

	// Body type icons
	const bodyIcons: Record<string, string> = {
		planet: '\u{1F30D}',
		moon: '\u{1F319}',
		station: '\u{1F6F0}',
		asteroid: '\u2B50'
	};

	async function loadShipyard() {
		isLoadingShipyard = true;
		shipyardError = null;
		availableShips = [];

		// Get the trading hub UUID from location details
		const tradingHub = locationDetails?.has?.trading_hub;

		if (!tradingHub?.uuid) {
			// No trading hub in location details - try using the POI UUID as fallback
			// Some APIs might use the location UUID directly
			const fallbackUuid = playerState.currentSystem?.uuid;

			if (!fallbackUuid) {
				shipyardError = 'No trading hub found at this location';
				isLoadingShipyard = false;
				return;
			}

			console.log('[ActionPanel] No trading hub UUID, trying POI UUID:', fallbackUuid);

			try {
				const response = await api.tradingHubs.getShipyard(fallbackUuid);
				if (response.success && response.data) {
					availableShips = response.data.available_ships;
				} else {
					shipyardError = response.error?.message ?? 'No shipyard available at this location';
				}
			} catch {
				shipyardError = 'Failed to connect to shipyard';
			} finally {
				isLoadingShipyard = false;
			}
			return;
		}

		console.log('[ActionPanel] Loading shipyard for trading hub:', tradingHub.uuid);

		try {
			const response = await api.tradingHubs.getShipyard(tradingHub.uuid);
			if (response.success && response.data) {
				availableShips = response.data.available_ships;
			} else {
				shipyardError = response.error?.message ?? 'Failed to load shipyard';
			}
		} catch {
			shipyardError = 'Failed to connect to shipyard';
		} finally {
			isLoadingShipyard = false;
		}
	}

	async function handlePurchaseShip(ship: ShipTemplate) {
		if (isPurchasing) return;

		if (playerState.credits < ship.price) {
			purchaseMessage = `Insufficient credits. You need ${ship.price.toLocaleString()} credits.`;
			return;
		}

		isPurchasing = true;
		purchaseMessage = null;

		const result = await playerState.purchaseShip(ship.uuid);

		if (result) {
			purchaseMessage = `Successfully purchased ${result.purchased_ship.name}! Credits remaining: ${result.credits_remaining.toLocaleString()}`;
			await loadShipyard();
		} else {
			purchaseMessage = 'Failed to purchase ship. Please try again.';
		}

		isPurchasing = false;
	}

	function handleServiceClick(service: string) {
		if (service === 'ship_shop') {
			loadShipyard();
		} else {
			onAction(service);
		}
	}
</script>

<div class="action-panel">
	{#if !activeItem}
		<div class="panel-placeholder">
			<p>Select a destination from the menu</p>
		</div>
	{:else}
		<div class="panel-content">
			<h3 class="panel-title">{panelTitles[activeItem] ?? activeItem}</h3>

			{#if activeItem === 'planets'}
				<!-- Planets/Bodies Panel -->
				{#if isLoading}
					<div class="loading">Loading location data...</div>
				{:else if inhabitedBodies.length > 0}
					<div class="action-buttons">
						{#each inhabitedBodies as body (body.uuid)}
							<button class="action-btn body-btn" onclick={() => onAction('visit', body.uuid)}>
								<span class="body-icon">{bodyIcons[body.type] ?? '\u2022'}</span>
								<span class="body-name">{body.name}</span>
								<span class="body-type">{body.type}</span>
							</button>
						{/each}
					</div>
				{:else if locationDetails}
					<p class="no-features">No planets or stations found at this location.</p>
				{:else}
					<p class="no-features">Location data not available.</p>
				{/if}
			{:else if activeItem === 'trading'}
				<!-- Services Panel -->
				{#if isLoading}
					<div class="loading">Loading services...</div>
				{:else if services.length > 0}
					<div class="services-grid">
						{#each services as service (service)}
							{@const info = serviceInfo[service] ?? { icon: '\u2022', label: service }}
							<button class="service-btn" onclick={() => handleServiceClick(service)}>
								<span class="service-icon">{info.icon}</span>
								<span class="service-label">{info.label}</span>
							</button>
						{/each}
					</div>
				{:else if locationDetails}
					<p class="no-features">No services available at this location.</p>
				{:else}
					<p class="no-features">Location data not available.</p>
				{/if}

				<!-- Shipyard Panel (shown when loaded) -->
				{#if isLoadingShipyard}
					<div class="shipyard-section">
						<h4 class="section-title">Shipyard</h4>
						<div class="loading">Loading available ships...</div>
					</div>
				{:else if availableShips.length > 0}
					<div class="shipyard-section">
						<h4 class="section-title">Available Ships</h4>
						<div class="credits-display">
							Your Credits: <span class="credits-value">{playerState.credits.toLocaleString()}</span
							>
						</div>

						{#if purchaseMessage}
							<div
								class="purchase-message"
								class:success={purchaseMessage.includes('Successfully')}
							>
								{purchaseMessage}
							</div>
						{/if}

						<div class="ships-list">
							{#each availableShips as ship (ship.uuid)}
								<div class="ship-card">
									<div class="ship-header">
										<span class="ship-name">{ship.name}</span>
										<span class="ship-class">{ship.class}</span>
									</div>
									<p class="ship-desc">{ship.description}</p>
									<div class="ship-stats">
										<span>Cargo: {ship.base_cargo}</span>
										<span>Fuel: {ship.base_fuel}</span>
										<span>Hull: {ship.base_hull}</span>
										<span>Weapons: {ship.base_weapons}</span>
									</div>
									<div class="ship-footer">
										<span class="ship-price">{ship.price.toLocaleString()} credits</span>
										<button
											class="buy-btn"
											disabled={isPurchasing || playerState.credits < ship.price}
											onclick={() => handlePurchaseShip(ship)}
										>
											{#if isPurchasing}
												Purchasing...
											{:else if playerState.credits < ship.price}
												Insufficient Credits
											{:else}
												Purchase
											{/if}
										</button>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{:else if shipyardError}
					<div class="shipyard-section">
						<h4 class="section-title">Shipyard</h4>
						<p class="error-message">{shipyardError}</p>
					</div>
				{/if}
			{:else if activeItem === 'warp'}
				<!-- Warp Gates Panel -->
				{@const gateEntries = Object.entries(gates)}
				{#if isLoading}
					<div class="loading">Loading warp gates...</div>
				{:else if gateEntries.length > 0}
					<div class="action-buttons">
						{#each gateEntries as [gateUuid, gate] (gateUuid)}
							<button
								class="action-btn connection-btn"
								onclick={() => onAction('travel', gate.destination_uuid)}
							>
								<span class="connection-name">{gate.destination_name}</span>
								<span class="connection-distance">{gate.distance.toFixed(1)} LY</span>
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
				{#if isLoading}
					<div class="loading">Loading salvage yard...</div>
				{:else if services.includes('salvage_yard')}
					<div class="action-buttons">
						<button class="action-btn" onclick={() => onAction('salvage')}>
							Enter Salvage Yard
						</button>
					</div>
				{:else if locationDetails}
					<p class="no-features">No salvage yard at this location.</p>
				{:else}
					<p class="no-features">Location data not available.</p>
				{/if}
			{/if}
		</div>
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
		max-height: calc(100vh - 200px);
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

	.action-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
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

	.body-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.75rem 1rem;
	}

	.body-icon {
		font-size: 1.25rem;
	}

	.body-name {
		font-weight: 600;
	}

	.body-type {
		font-size: 0.7rem;
		color: #a0aec0;
		text-transform: capitalize;
	}

	.connection-btn {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.125rem;
	}

	.connection-name {
		font-weight: 600;
	}

	.connection-distance {
		font-size: 0.7rem;
		color: #a0aec0;
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

	.ship-class {
		font-size: 0.7rem;
		padding: 0.125rem 0.375rem;
		background: rgba(99, 179, 237, 0.2);
		color: #63b3ed;
		border-radius: 3px;
		text-transform: uppercase;
	}

	.ship-desc {
		font-size: 0.75rem;
		color: #a0aec0;
		margin: 0 0 0.5rem 0;
	}

	.ship-stats {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		font-size: 0.7rem;
		color: #718096;
		margin-bottom: 0.5rem;
	}

	.ship-stats span {
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

	.ship-price {
		font-weight: 600;
		color: #f6ad55;
		font-size: 0.85rem;
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

	.error-message {
		color: #fc8181;
		font-size: 0.85rem;
		margin: 0;
	}
</style>
