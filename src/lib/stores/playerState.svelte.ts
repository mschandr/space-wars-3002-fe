import { api, type CurrentLocationResponse, type Ship } from '$lib/api';

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
	hull: { current: number; max: number };
	shield: { current: number; max: number; grade?: string };
	fuel: { current: number; max: number };
	cargo_capacity: number;
	cargo_used: number;
}

interface PlayerState {
	playerUuid: string | null;
	galaxyUuid: string | null;
	callSign: string | null;
	currentSystem: SystemInfo | null;
	locationDetails: CurrentLocationResponse | null;
	activeShip: ShipInfo | null;
	ships: ShipInfo[];
	ship: ShipStats | null;
	credits: number;
	level: number;
	experience: number;
	scanLevels: Record<string, number>;
	isLoading: boolean;
	needsCreation: boolean;
	error: string | null;
}

function createPlayerState() {
	const state = $state<PlayerState>({
		playerUuid: null,
		galaxyUuid: null,
		callSign: null,
		currentSystem: null,
		locationDetails: null,
		activeShip: null,
		ships: [],
		ship: null,
		credits: 0,
		level: 1,
		experience: 0,
		scanLevels: {},
		isLoading: false,
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

	async function initialize(galaxyUuid: string) {
		state.isLoading = true;
		state.error = null;
		state.needsCreation = false;
		state.galaxyUuid = galaxyUuid;

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

	function reset() {
		state.playerUuid = null;
		state.galaxyUuid = null;
		state.callSign = null;
		state.currentSystem = null;
		state.locationDetails = null;
		state.activeShip = null;
		state.ships = [];
		state.ship = null;
		state.credits = 0;
		state.level = 1;
		state.experience = 0;
		state.scanLevels = {};
		state.isLoading = false;
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
		get callSign() {
			return state.callSign;
		},
		get currentSystem() {
			return state.currentSystem;
		},
		get locationDetails() {
			return state.locationDetails;
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
		get isLoading() {
			return state.isLoading;
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
		scanSystem,
		loadBulkScanLevels,
		getScanLevel,
		purchaseShip,
		switchShip,
		loadShips,
		reset
	};
}

export const playerState = createPlayerState();
