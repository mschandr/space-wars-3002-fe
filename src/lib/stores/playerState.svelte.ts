import {
	api,
	type CurrentLocationResponse,
	type Ship,
	type CargoItem,
	type HubInventoryItem,
	type MyShipResponse,
	type TravelResponse,
	type FacilitiesResponse
} from '$lib/api';
import { getGalaxyFromCache } from '$lib/galaxyCache';

export interface SystemInfo {
	uuid: string;
	name: string;
	type: string;
	position: { x: number; y: number };
}

export interface ShipInfo {
	uuid: string;
	name: string;
	class: string;
	isActive: boolean;
}

export interface ShipStats {
	uuid: string;
	name: string;
	hull: { current: number; max: number };
	shield: { current: number; max: number };
	fuel: { current: number; max: number; regenRate: number };
	weapons: number;
	sensors: number;
	warpDrive: number;
	cargo_capacity: number;
	cargo_used: number;
	status: string;
	shipClass: { id: number; name: string; class: string };
}

interface SectorInfo {
	uuid: string;
	name: string;
	grid: { x: number; y: number };
	display_name?: string;
	danger_level?: 'low' | 'medium' | 'high' | 'extreme';
}

interface PlayerState {
	playerUuid: string | null;
	galaxyUuid: string | null;
	galaxyName: string | null;
	galaxyGridSize: number;
	currentSector: SectorInfo | null;
	callSign: string | null;
	currentSystem: SystemInfo | null;
	locationDetails: CurrentLocationResponse | null;
	facilities: FacilitiesResponse | null;
	activeShip: ShipInfo | null;
	ships: ShipInfo[];
	ship: ShipStats | null;
	credits: number;
	level: number;
	experience: number;
	scanLevels: Record<string, number>;
	cargo: CargoItem[];
	cargoCapacity: number;
	cargoUsed: number;
	tradingHubInventory: HubInventoryItem[];
	currentTradingHubUuid: string | null;
	isLoading: boolean;
	isTraveling: boolean;
	travelDestination: string | null;
	travelStatus: string | null;
	needsCreation: boolean;
	error: string | null;
}

function createPlayerState() {
	const state = $state<PlayerState>({
		playerUuid: null,
		galaxyUuid: null,
		galaxyName: null,
		galaxyGridSize: 5, // Default, will be updated from my-player response
		currentSector: null,
		callSign: null,
		currentSystem: null,
		locationDetails: null,
		facilities: null,
		activeShip: null,
		ships: [],
		ship: null,
		credits: 0,
		level: 1,
		experience: 0,
		scanLevels: {},
		cargo: [],
		cargoCapacity: 0,
		cargoUsed: 0,
		tradingHubInventory: [],
		currentTradingHubUuid: null,
		isLoading: false,
		isTraveling: false,
		travelDestination: null,
		travelStatus: null,
		needsCreation: false,
		error: null
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function setPlayerData(player: any) {
		console.log('[PlayerState] Setting player data:', player);

		if (!player) {
			console.error('[PlayerState] setPlayerData called with null/undefined player');
			return;
		}

		state.playerUuid = player.uuid;
		state.callSign = player.call_sign;
		state.credits = player.credits ?? 0;
		state.level = player.level ?? 1;
		state.experience = player.experience ?? 0;

		// Handle active_ship from API
		if (player.active_ship) {
			state.activeShip = {
				uuid: player.active_ship.uuid,
				name: player.active_ship.name,
				class: player.active_ship.class,
				isActive: true
			};
			console.log('[PlayerState] Active ship set:', state.activeShip);
		} else {
			state.activeShip = null;
		}

		// Handle current_location structure from API
		const location = player.current_location;
		if (location) {
			const systemName = location.name || location.system_name || 'Unknown System';
			state.currentSystem = {
				uuid: location.uuid,
				name: systemName,
				type: getSystemTypeLabel(location.type),
				position: { x: location.x ?? 0, y: location.y ?? 0 }
			};
			console.log('[PlayerState] Current system set:', state.currentSystem);
			console.log('[PlayerState] System name:', systemName);
		} else {
			console.warn('[PlayerState] No current_location in player data');
			state.currentSystem = null;
		}

		state.needsCreation = false;
	}

	// Convert numeric type to readable label
	function getSystemTypeLabel(type: number | string): string {
		if (typeof type === 'string') return type;
		// Map numeric types to labels (adjust based on actual API values)
		const typeLabels: Record<number, string> = {
			17: 'STAR SYSTEM'
		};
		return typeLabels[type] ?? 'STAR SYSTEM';
	}

	// Load detailed location information
	async function loadLocationDetails() {
		if (!state.currentSystem?.uuid) {
			console.log('[PlayerState] No current system UUID for location details');
			return null;
		}

		try {
			console.log('[PlayerState] Loading location details for:', state.currentSystem.uuid);
			const response = await api.location.getCurrent(state.currentSystem.uuid);
			console.log(
				'[PlayerState] Location details raw response:',
				JSON.stringify(response, null, 2)
			);

			if (response.success && response.data) {
				state.locationDetails = response.data;
				console.log('[PlayerState] Location details loaded successfully');
				console.log('[PlayerState] Services available:', response.data.has?.services);
				console.log('[PlayerState] Trading hub:', response.data.has?.trading_hub);
				return response.data;
			} else {
				console.error('[PlayerState] Failed to load location details:', response.error);
				// Don't let this error affect the current system data
			}
		} catch (err) {
			console.error('[PlayerState] Error loading location details:', err);
		}
		return null;
	}

	// Load facilities for current location
	async function loadFacilities() {
		if (!state.playerUuid) {
			console.log('[PlayerState] No player UUID for facilities');
			return null;
		}

		try {
			console.log('[PlayerState] Loading facilities for player:', state.playerUuid);
			const response = await api.players.getFacilities(state.playerUuid);
			console.log('[PlayerState] Facilities response:', JSON.stringify(response, null, 2));

			if (response.success && response.data) {
				state.facilities = response.data;
				console.log('[PlayerState] Facilities loaded successfully');
				console.log('[PlayerState] Summary:', response.data.facilities?.summary);
				return response.data;
			} else {
				console.error('[PlayerState] Failed to load facilities:', response.error);
			}
		} catch (err) {
			console.error('[PlayerState] Error loading facilities:', err);
		}
		return null;
	}

	// Purchase a ship
	async function purchaseShip(shipUuid: string, shipName?: string) {
		if (!state.playerUuid) return null;

		try {
			const response = await api.players.purchaseShip(state.playerUuid, {
				ship_uuid: shipUuid,
				ship_name: shipName
			});

			if (response.success && response.data) {
				state.credits = response.data.credits_remaining;
				// Add to ships list
				state.ships = [
					...state.ships,
					{
						uuid: response.data.purchased_ship.uuid,
						name: response.data.purchased_ship.name,
						class: response.data.purchased_ship.class,
						isActive: response.data.purchased_ship.is_active ?? false
					}
				];
				return response.data;
			} else {
				console.error('[PlayerState] Failed to purchase ship:', response.error);
				return null;
			}
		} catch (err) {
			console.error('[PlayerState] Error purchasing ship:', err);
			return null;
		}
	}

	// Switch active ship
	async function switchShip(shipUuid: string) {
		if (!state.playerUuid) return null;

		try {
			const response = await api.players.switchShip(state.playerUuid, {
				ship_uuid: shipUuid
			});

			if (response.success && response.data) {
				state.activeShip = {
					uuid: response.data.active_ship.uuid,
					name: response.data.active_ship.name,
					class: response.data.active_ship.class,
					isActive: true
				};
				// Update ships list
				state.ships = state.ships.map((s) => ({
					...s,
					isActive: s.uuid === response.data!.active_ship.uuid
				}));
				return response.data;
			} else {
				console.error('[PlayerState] Failed to switch ship:', response.error);
				return null;
			}
		} catch (err) {
			console.error('[PlayerState] Error switching ship:', err);
			return null;
		}
	}

	// Load player's ships
	async function loadShips() {
		if (!state.playerUuid) return [];

		try {
			const response = await api.players.getShips(state.playerUuid);

			if (response.success && response.data) {
				state.ships = response.data.map((s: Ship) => ({
					uuid: s.uuid,
					name: s.name,
					class: s.class,
					isActive: s.is_active ?? false
				}));
				return state.ships;
			}
		} catch (err) {
			console.error('[PlayerState] Error loading ships:', err);
		}
		return [];
	}

	// Load current ship stats using the my-ship endpoint
	async function loadMyShip() {
		if (!state.galaxyUuid) {
			console.log('[PlayerState] loadMyShip: No galaxy UUID');
			return null;
		}

		try {
			console.log('[PlayerState] Loading my ship for galaxy:', state.galaxyUuid);
			const response = await api.galaxies.getMyShip(state.galaxyUuid);

			if (response.success && response.data) {
				const shipData = response.data;
				state.ship = {
					uuid: shipData.uuid,
					name: shipData.name,
					hull: { current: shipData.hull, max: shipData.max_hull },
					shield: { current: shipData.shields, max: shipData.max_shields },
					fuel: {
						current: shipData.current_fuel,
						max: shipData.max_fuel,
						regenRate: shipData.fuel_regen_rate
					},
					weapons: shipData.weapons,
					sensors: shipData.sensors,
					warpDrive: shipData.warp_drive,
					cargo_capacity: shipData.cargo_hold,
					cargo_used: state.cargoUsed, // Preserve from cargo load
					status: shipData.status,
					shipClass: shipData.ship_class
				};

				// Also update activeShip info
				state.activeShip = {
					uuid: shipData.uuid,
					name: shipData.name,
					class: shipData.ship_class.class,
					isActive: true
				};

				console.log('[PlayerState] Ship loaded:', state.ship.name);
				return response.data;
			} else {
				const errorCode = response.error?.code;
				if (errorCode === 'NO_SHIP') {
					console.log('[PlayerState] Player has no ship');
					state.ship = null;
					state.activeShip = null;
				} else if (errorCode === 'NOT_IN_GALAXY') {
					console.log('[PlayerState] Player not in this galaxy');
				} else {
					console.error('[PlayerState] Failed to load ship:', response.error);
				}
			}
		} catch (err) {
			console.error('[PlayerState] Error loading ship:', err);
		}
		return null;
	}

	// Load player's cargo
	async function loadCargo() {
		if (!state.playerUuid) return null;

		try {
			const response = await api.players.getCargo(state.playerUuid);

			if (response.success && response.data) {
				state.cargo = response.data.items;
				state.cargoCapacity = response.data.cargo_hold;
				state.cargoUsed = response.data.current_cargo;
				console.log('[PlayerState] Cargo loaded:', state.cargo.length, 'items');
				return response.data;
			} else {
				console.error('[PlayerState] Failed to load cargo:', response.error);
			}
		} catch (err) {
			console.error('[PlayerState] Error loading cargo:', err);
		}
		return null;
	}

	// Load trading hub inventory
	async function loadTradingHubInventory(hubUuid: string) {
		try {
			const response = await api.tradingHubs.getInventory(hubUuid);

			if (response.success && response.data) {
				state.tradingHubInventory = response.data.inventory;
				state.currentTradingHubUuid = hubUuid;
				console.log(
					'[PlayerState] Hub inventory loaded:',
					state.tradingHubInventory.length,
					'items'
				);
				return response.data;
			} else {
				console.error('[PlayerState] Failed to load hub inventory:', response.error);
			}
		} catch (err) {
			console.error('[PlayerState] Error loading hub inventory:', err);
		}
		return null;
	}

	// Buy minerals from a trading hub
	async function buyMineral(hubUuid: string, mineralUuid: string, quantity: number) {
		if (!state.playerUuid) return null;

		try {
			const response = await api.tradingHubs.buy(hubUuid, {
				player_uuid: state.playerUuid,
				mineral_uuid: mineralUuid,
				quantity
			});

			if (response.success && response.data) {
				// Update credits
				state.credits = response.data.remaining_credits;
				state.cargoUsed = response.data.cargo_used;
				// Reload cargo to get updated manifest
				await loadCargo();
				// Reload hub inventory to get updated quantities
				await loadTradingHubInventory(hubUuid);
				console.log('[PlayerState] Purchase successful:', response.data);
				return response.data;
			} else {
				console.error('[PlayerState] Buy failed:', response.error);
				throw new Error(response.error?.message || 'Purchase failed');
			}
		} catch (err) {
			console.error('[PlayerState] Error buying mineral:', err);
			throw err;
		}
	}

	// Sell minerals to a trading hub
	async function sellMineral(hubUuid: string, mineralUuid: string, quantity: number) {
		if (!state.playerUuid) return null;

		try {
			const response = await api.tradingHubs.sell(hubUuid, {
				player_uuid: state.playerUuid,
				mineral_uuid: mineralUuid,
				quantity
			});

			if (response.success && response.data) {
				// Update credits
				state.credits = response.data.new_credits;
				// Reload cargo to get updated manifest
				await loadCargo();
				// Reload hub inventory to get updated quantities
				await loadTradingHubInventory(hubUuid);
				console.log('[PlayerState] Sale successful:', response.data);
				return response.data;
			} else {
				console.error('[PlayerState] Sell failed:', response.error);
				throw new Error(response.error?.message || 'Sale failed');
			}
		} catch (err) {
			console.error('[PlayerState] Error selling mineral:', err);
			throw err;
		}
	}

	// Get cargo item by mineral UUID
	function getCargoItem(mineralUuid: string): CargoItem | undefined {
		return state.cargo.find((item) => item.mineral.uuid === mineralUuid);
	}

	// Calculate available cargo space
	function getAvailableCargoSpace(): number {
		return state.cargoCapacity - state.cargoUsed;
	}

	async function initialize(galaxyUuid: string) {
		state.isLoading = true;
		state.error = null;
		state.needsCreation = false;
		state.galaxyUuid = galaxyUuid;

		// Try to get galaxy name from cache
		const cachedGalaxy = getGalaxyFromCache(galaxyUuid);
		if (cachedGalaxy) {
			state.galaxyName = cachedGalaxy.name;
		}

		try {
			// Use the new my-player endpoint to check if user has a player in this galaxy
			const response = await api.galaxies.getMyPlayer(galaxyUuid);
			console.log('[PlayerState] my-player raw response:', JSON.stringify(response, null, 2));

			if (response.success && response.data) {
				// Handle both wrapped { player: {...} } and direct player data formats
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const data = response.data as any;
				const playerData = data.player ?? data;
				console.log('[PlayerState] Extracted player data:', JSON.stringify(playerData, null, 2));
				console.log('[PlayerState] current_location field:', playerData.current_location);
				setPlayerData(playerData);
				console.log('[PlayerState] After setPlayerData, currentSystem:', state.currentSystem);

				// Extract sector and total_sectors from my-player response
				if (data.sector) {
					state.currentSector = data.sector;
					console.log('[PlayerState] Current sector:', data.sector);
				}

				if (data.total_sectors) {
					state.galaxyGridSize = Math.round(Math.sqrt(data.total_sectors));
					console.log(
						'[PlayerState] Galaxy grid size:',
						state.galaxyGridSize,
						'from total sectors:',
						data.total_sectors
					);
				}

				// Get galaxy name from player data if available
				if (playerData.galaxy?.name) {
					state.galaxyName = playerData.galaxy.name;
				}

				// Load ship data using the my-ship endpoint
				await loadMyShip();
			} else {
				// Check if the error indicates no player in galaxy
				const errorCode = response.error?.code;
				console.log('[PlayerState] my-player error:', errorCode, response.error);

				if (errorCode === 'NO_PLAYER_IN_GALAXY' || errorCode === 'NOT_FOUND') {
					// Player doesn't exist for this galaxy - need to create one
					state.needsCreation = true;
				} else {
					state.error = response.error?.message || 'Failed to load player data';
				}
			}
		} catch (err) {
			console.error('[PlayerState] initialize error:', err);
			state.error = err instanceof Error ? err.message : 'Unknown error';
		} finally {
			state.isLoading = false;
		}
	}

	async function joinGalaxy(callSign: string) {
		if (!state.galaxyUuid) {
			state.error = 'No galaxy selected';
			return false;
		}

		state.isLoading = true;
		state.error = null;

		try {
			// Use the idempotent join endpoint - it will return existing player or create new one
			const response = await api.galaxies.join(state.galaxyUuid, { call_sign: callSign });

			if (response.success && response.data) {
				setPlayerData(response.data.player);
				return true;
			} else {
				// Handle specific error codes
				const errorCode = response.error?.code;
				switch (errorCode) {
					case 'GALAXY_NOT_ACTIVE':
						state.error = 'This galaxy is not accepting new players';
						break;
					case 'GALAXY_FULL':
						state.error = 'This galaxy has reached maximum capacity';
						break;
					case 'SINGLE_PLAYER_GALAXY':
						state.error = 'This is a single-player galaxy';
						break;
					case 'DUPLICATE_CALL_SIGN':
						state.error = 'This call sign is already taken';
						break;
					case 'NO_STARTING_LOCATION':
						state.error = 'Unable to find a starting location';
						break;
					default:
						state.error = response.error?.message || 'Failed to join galaxy';
				}
				return false;
			}
		} catch (err) {
			state.error = err instanceof Error ? err.message : 'Unknown error';
			return false;
		} finally {
			state.isLoading = false;
		}
	}

	async function loadSystemData(poiUuid?: string) {
		if (!state.playerUuid) {
			console.log('[PlayerState] loadSystemData: No player UUID');
			return null;
		}

		const targetUuid = poiUuid || state.currentSystem?.uuid;
		if (!targetUuid) {
			console.log('[PlayerState] loadSystemData: No target UUID');
			return null;
		}

		console.log('[PlayerState] Loading system data for:', targetUuid);

		try {
			const response = await api.players.getSystemData(state.playerUuid, targetUuid);
			console.log('[PlayerState] System data response:', response);

			if (response.success && response.data) {
				// Update current system info if this is the current system or if we don't have the name yet
				const isCurrentSystem =
					state.currentSystem?.uuid === response.data.poi_uuid ||
					state.currentSystem?.uuid === targetUuid;
				const needsUpdate = !state.currentSystem?.name || state.currentSystem.name === 'Loading...';

				if (isCurrentSystem || needsUpdate) {
					console.log('[PlayerState] Updating current system with:', response.data.poi_name);
					state.currentSystem = {
						uuid: response.data.poi_uuid,
						name: response.data.poi_name,
						type: response.data.poi_type,
						position: response.data.position
					};
				}
				return response.data;
			} else {
				console.error('[PlayerState] System data request failed:', response.error);
			}
		} catch (err) {
			console.error('[PlayerState] Failed to load system data:', err);
		}
		return null;
	}

	async function scanSystem(poiUuid?: string, force = false) {
		if (!state.playerUuid) return null;

		try {
			const response = await api.players.scanSystem(state.playerUuid, poiUuid, force);
			if (response.success && response.data) {
				// Update local scan level cache
				state.scanLevels[response.data.poi_uuid] = response.data.scan_level;
				return response.data;
			}
		} catch (err) {
			console.error('Failed to scan system:', err);
		}
		return null;
	}

	async function loadBulkScanLevels(poiUuids: string[]) {
		if (!state.playerUuid || poiUuids.length === 0) return;

		try {
			const response = await api.players.getBulkScanLevels(state.playerUuid, poiUuids);
			if (response.success && response.data) {
				for (const entry of response.data.scan_levels) {
					state.scanLevels[entry.poi_uuid] = entry.scan_level;
				}
			}
		} catch (err) {
			console.error('Failed to load bulk scan levels:', err);
		}
	}

	function getScanLevel(poiUuid: string): number {
		return state.scanLevels[poiUuid] ?? 0;
	}

	// Travel to a destination (warp gate or star system)
	async function travel(destinationUuid: string, destinationName?: string): Promise<TravelResponse | null> {
		if (!state.playerUuid) {
			console.log('[PlayerState] travel: No player UUID');
			return null;
		}

		state.isTraveling = true;
		state.travelDestination = destinationName ?? destinationUuid;
		state.travelStatus = 'Initiating warp drive...';
		state.error = null;

		// Minimum display time for the warp animation (for visual effect)
		const minDisplayTime = 2000;
		const startTime = Date.now();

		try {
			console.log('[PlayerState] Traveling to:', destinationUuid);
			state.travelStatus = 'Calculating jump coordinates...';

			const response = await api.players.travel(state.playerUuid, destinationUuid);

			// Check if the system is still generating
			if (response.success && response.data) {
				const data = response.data;

				// Handle "generating" status - poll until complete
				if (data.status === 'generating' || data.message === 'generating') {
					console.log('[PlayerState] System is generating, polling for completion...');
					state.travelStatus = 'Generating star system...';

					// Poll for system generation completion
					const maxPolls = 60; // Max 60 attempts (about 2 minutes with 2s intervals)
					const pollInterval = 2000; // 2 seconds between polls

					for (let i = 0; i < maxPolls; i++) {
						await new Promise(resolve => setTimeout(resolve, pollInterval));

						// Update status message with progress indication
						const dots = '.'.repeat((i % 3) + 1);
						state.travelStatus = `Generating star system${dots}`;

						// Try to get the current system data
						try {
							const systemResponse = await api.players.getCurrentSystem(state.playerUuid!);

							if (systemResponse.success && systemResponse.data) {
								// Check if it's no longer generating
								const systemData = systemResponse.data as { status?: string; message?: string };
								if (systemData.status !== 'generating' && systemData.message !== 'generating') {
									console.log('[PlayerState] System generation complete');
									state.travelStatus = 'Arriving at destination...';

									// Update state with the new system data
									state.currentSystem = {
										uuid: systemResponse.data.uuid,
										name: systemResponse.data.name,
										type: systemResponse.data.type,
										position: systemResponse.data.position
									};

									if (systemResponse.data.sector) {
										state.currentSector = {
											uuid: systemResponse.data.sector.uuid,
											name: systemResponse.data.sector.name,
											display_name: systemResponse.data.sector.display_name,
											grid: systemResponse.data.sector.grid,
											danger_level: systemResponse.data.sector.danger_level
										};
									}

									// Update fuel if available in original response
									if (state.ship && data.fuel_remaining !== undefined) {
										state.ship = {
											...state.ship,
											fuel: {
												...state.ship.fuel,
												current: data.fuel_remaining
											}
										};
									}

									state.locationDetails = null;
								state.facilities = null;

									// Ensure minimum display time
									const elapsed = Date.now() - startTime;
									if (elapsed < minDisplayTime) {
										await new Promise(resolve => setTimeout(resolve, minDisplayTime - elapsed));
									}

									return data;
								}
							}
						} catch (pollErr) {
							console.log('[PlayerState] Poll attempt', i + 1, 'failed:', pollErr);
							// Continue polling
						}
					}

					// If we've exhausted polls, return what we have
					console.warn('[PlayerState] System generation polling timed out');
					state.travelStatus = 'System generation taking longer than expected...';
				}

				// Normal travel completion (not generating)
				console.log('[PlayerState] Travel successful:', data);
				state.travelStatus = 'Arriving at destination...';

				// Update current system
				if (data.destination) {
					state.currentSystem = {
						uuid: data.destination.uuid,
						name: data.destination.name,
						type: data.destination.type,
						position: data.destination.position
					};
				}

				// Update current sector
				if (data.sector) {
					state.currentSector = {
						uuid: data.sector.uuid,
						name: data.sector.name,
						display_name: data.sector.display_name,
						grid: data.sector.grid,
						danger_level: data.sector.danger_level
					};
				}

				// Update fuel in ship stats
				if (state.ship && data.fuel_remaining !== undefined) {
					state.ship = {
						...state.ship,
						fuel: {
							...state.ship.fuel,
							current: data.fuel_remaining
						}
					};
				}

				// Clear location details and facilities - will need to reload for new location
				state.locationDetails = null;
				state.facilities = null;

				// Ensure minimum display time for the warp animation
				const elapsed = Date.now() - startTime;
				if (elapsed < minDisplayTime) {
					await new Promise(resolve => setTimeout(resolve, minDisplayTime - elapsed));
				}

				return data;
			} else {
				const errorMsg = response.error?.message || 'Travel failed';
				console.error('[PlayerState] Travel failed:', response.error);
				state.error = errorMsg;
				return null;
			}
		} catch (err) {
			console.error('[PlayerState] Travel error:', err);
			state.error = err instanceof Error ? err.message : 'Travel failed';
			return null;
		} finally {
			state.isTraveling = false;
			state.travelDestination = null;
			state.travelStatus = null;
		}
	}

	function reset() {
		state.playerUuid = null;
		state.galaxyUuid = null;
		state.galaxyName = null;
		state.galaxyGridSize = 5;
		state.currentSector = null;
		state.callSign = null;
		state.currentSystem = null;
		state.locationDetails = null;
		state.facilities = null;
		state.activeShip = null;
		state.ships = [];
		state.ship = null;
		state.credits = 0;
		state.level = 1;
		state.experience = 0;
		state.scanLevels = {};
		state.cargo = [];
		state.cargoCapacity = 0;
		state.cargoUsed = 0;
		state.tradingHubInventory = [];
		state.currentTradingHubUuid = null;
		state.isLoading = false;
		state.isTraveling = false;
		state.travelDestination = null;
		state.travelStatus = null;
		state.needsCreation = false;
		state.error = null;
	}

	return {
		get playerUuid() {
			return state.playerUuid;
		},
		get galaxyUuid() {
			return state.galaxyUuid;
		},
		get galaxyName() {
			return state.galaxyName;
		},
		get galaxyGridSize() {
			return state.galaxyGridSize;
		},
		get currentSector() {
			return state.currentSector;
		},
		get callSign() {
			return state.callSign;
		},
		get currentSystem() {
			return state.currentSystem;
		},
		get locationDetails() {
			return state.locationDetails;
		},
		get facilities() {
			return state.facilities;
		},
		get activeShip() {
			return state.activeShip;
		},
		get ships() {
			return state.ships;
		},
		get ship() {
			return state.ship;
		},
		get credits() {
			return state.credits;
		},
		get level() {
			return state.level;
		},
		get experience() {
			return state.experience;
		},
		get scanLevels() {
			return state.scanLevels;
		},
		get cargo() {
			return state.cargo;
		},
		get cargoCapacity() {
			return state.cargoCapacity;
		},
		get cargoUsed() {
			return state.cargoUsed;
		},
		get tradingHubInventory() {
			return state.tradingHubInventory;
		},
		get currentTradingHubUuid() {
			return state.currentTradingHubUuid;
		},
		get isLoading() {
			return state.isLoading;
		},
		get isTraveling() {
			return state.isTraveling;
		},
		get travelDestination() {
			return state.travelDestination;
		},
		get travelStatus() {
			return state.travelStatus;
		},
		get needsCreation() {
			return state.needsCreation;
		},
		get error() {
			return state.error;
		},
		initialize,
		joinGalaxy,
		loadSystemData,
		loadLocationDetails,
		loadFacilities,
		scanSystem,
		loadBulkScanLevels,
		getScanLevel,
		purchaseShip,
		switchShip,
		loadShips,
		loadMyShip,
		loadCargo,
		loadTradingHubInventory,
		buyMineral,
		sellMineral,
		getCargoItem,
		getAvailableCargoSpace,
		travel,
		reset
	};
}

export const playerState = createPlayerState();
