const API_BASE = '/api';

export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	message?: string;
	error?: {
		code: string;
		message: string;
		details: Record<string, string[]> | null;
	};
	meta: {
		timestamp: string;
		request_id: string;
	};
}

export interface User {
	id: number;
	name: string;
	email: string;
	is_admin?: boolean;
}

export interface AuthData {
	user: User;
	access_token: string;
	token_type: string;
}

export type GameMode = 'multiplayer' | 'single_player' | 'mixed';

export type NpcArchetype = 'trader' | 'merchant' | 'explorer' | 'miner' | 'pirate_hunter';

export type NpcDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type SizeTier = 'small' | 'medium' | 'large' | 'massive';

// Dehydrated galaxy summary for list endpoint (lightweight)
export interface GalaxySummary {
	uuid: string;
	name: string;
	size: SizeTier;
	players: number;
	mode: GameMode;
}

export interface GalaxyListResponse {
	my_games: GalaxySummary[];
	open_games: GalaxySummary[];
	cached_at: string;
}

export interface Galaxy {
	uuid: string;
	name: string;
	width: number;
	height: number;
	stars: number;
	game_mode: GameMode;
	is_mirror: boolean;
	size_tier?: SizeTier;
	core_bounds?: {
		x_min: number;
		x_max: number;
		y_min: number;
		y_max: number;
	};
	status?: number | string;
	created_at: string;
	updated_at: string;
}

export interface CreatedNpc {
	uuid: string;
	call_sign: string;
	archetype: NpcArchetype;
	difficulty: NpcDifficulty;
}

export interface GeneratorMetrics {
	success: boolean;
	metrics: {
		elapsed_ms: number;
		elapsed_seconds?: number;
		counts: Record<string, number>;
	};
	data?: Record<string, unknown>;
	error?: string;
}

export interface GalaxyCreationStatistics {
	total_pois: number;
	total_stars: number;
	core_stars: number;
	outer_stars: number;
	inhabited_systems: number;
	fortified_systems: number;
	warp_gates: number;
	active_gates: number;
	dormant_gates: number;
	trading_hubs: number;
}

export interface GalaxyCreationResult {
	galaxy: {
		id: number;
		uuid: string;
		name: string;
		status: string;
	};
	statistics: GalaxyCreationStatistics;
	metrics: {
		total_elapsed_ms: number;
		total_elapsed_seconds: number;
		generators: Record<string, GeneratorMetrics>;
	};
	config: {
		tier: SizeTier;
		game_mode: GameMode;
		dimensions: {
			width: number;
			height: number;
		};
		star_counts: {
			core: number;
			outer: number;
			total: number;
		};
	};
}

export interface SizeTierInfo {
	value: SizeTier;
	label: string;
	outer_bounds: number;
	core_bounds: number;
	core_stars: number;
	outer_stars: number;
	total_stars: number;
}

export interface SizeTiersResponse {
	tiers: SizeTierInfo[];
}

export interface CreationStatusStep {
	step: number;
	name: string;
	percentage: number;
	status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface CreationStatus {
	galaxy_id: number;
	galaxy_uuid: string;
	galaxy_name: string;
	status: string;
	size_tier?: SizeTier;
	current_progress: number;
	is_complete: boolean;
	generation_started_at: string;
	generation_completed_at: string | null;
	steps: Record<string, CreationStatusStep>;
}

export interface NpcArchetypeInfo {
	id: NpcArchetype;
	name: string;
	description: string;
}

export interface Npc {
	uuid: string;
	galaxy_uuid: string;
	call_sign: string;
	archetype: NpcArchetype;
	level: number;
	credits: number;
	created_at: string;
}

export interface GalaxyStatistics {
	player_count: number;
	active_players: number;
	total_sectors: number;
	inhabited_sectors: number;
	total_trade_volume: number;
}

export interface VictoryLeader {
	player_uuid: string;
	call_sign: string;
	victory_path: string;
	progress: number;
	rank: number;
}

// Player/scanning response types
export interface ScanSystemResponse {
	scan_level: number;
	poi_uuid: string;
	poi_name: string;
	poi_type: string;
	new_discoveries: Discovery[];
	already_known: Discovery[];
	max_level_reached: boolean;
}

export interface Discovery {
	type: string;
	name: string;
	uuid: string;
	details?: Record<string, unknown>;
}

export interface GetScanResultsResponse {
	poi_uuid: string;
	poi_name: string;
	poi_type: string;
	scan_level: number;
	discoveries: Discovery[];
	scanned_at: string;
}

export interface ExplorationLogResponse {
	entries: ExplorationLogEntry[];
	total_systems_scanned: number;
	total_discoveries: number;
}

export interface ExplorationLogEntry {
	poi_uuid: string;
	poi_name: string;
	poi_type: string;
	scan_level: number;
	first_scanned_at: string;
	last_scanned_at: string;
}

export interface BulkScanLevelsResponse {
	scan_levels: BulkScanLevelEntry[];
}

export interface BulkScanLevelEntry {
	poi_uuid: string;
	scan_level: number;
}

export interface SystemDataResponse {
	poi_uuid: string;
	poi_name: string;
	poi_type: string;
	position: { x: number; y: number };
	scan_level: number;
	visible_features: VisibleFeature[];
	connections: SystemConnection[];
}

export interface VisibleFeature {
	type: string;
	name: string;
	uuid: string;
	details?: Record<string, unknown>;
}

export interface SystemConnection {
	target_uuid: string;
	target_name: string;
	connection_type: 'warp_gate' | 'hyperlane';
	distance: number;
}

export interface PlayerData {
	uuid: string;
	galaxy_uuid: string;
	call_sign: string;
	level?: number;
	experience?: number;
	current_system_uuid: string;
	current_system_name: string;
	current_system_type: string;
	ship: {
		hull: { current: number; max: number };
		shield: { current: number; max: number; grade?: string };
		fuel: { current: number; max: number };
		cargo_capacity: number;
		cargo_used: number;
	};
	credits: number;
	status?: string;
	created_at: string;
}

export interface PlayerListItem {
	uuid: string;
	galaxy_uuid: string;
	galaxy_name?: string;
	call_sign: string;
	level?: number;
	credits?: number;
	status?: string;
	created_at: string;
}

export interface PlayerStatus {
	uuid: string;
	call_sign: string;
	level: number;
	experience: number;
	credits: number;
	current_location: {
		name: string;
		coordinates: { x: number; y: number };
	};
	active_ship: {
		name: string;
		hull: number;
		fuel: number;
	};
	status: string;
}

export interface PlayerStats {
	uuid: string;
	call_sign: string;
	systems_visited: number;
	total_distance_traveled: number;
	enemies_defeated: number;
	trades_completed: number;
	total_credits_earned: number;
}

// Galaxy membership types
export interface JoinGalaxyRequest {
	call_sign?: string; // Required only if creating new player
}

export interface JoinGalaxyResponse {
	player: PlayerData;
	created: boolean;
}

export type JoinGalaxyErrorCode =
	| 'GALAXY_NOT_ACTIVE'
	| 'GALAXY_FULL'
	| 'SINGLE_PLAYER_GALAXY'
	| 'DUPLICATE_CALL_SIGN'
	| 'NO_STARTING_LOCATION';

const DEFAULT_TIMEOUT = 10000; // 10 seconds

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
	const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;

	const headers: HeadersInit = {
		Accept: 'application/json',
		'Content-Type': 'application/json',
		...(token && { Authorization: `Bearer ${token}` }),
		...options.headers
	};

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

	try {
		const response = await fetch(`${API_BASE}${endpoint}`, {
			...options,
			headers,
			signal: controller.signal
		});
		clearTimeout(timeoutId);
		return response.json();
	} catch (error) {
		clearTimeout(timeoutId);
		if (error instanceof Error && error.name === 'AbortError') {
			return {
				success: false,
				error: { code: 'TIMEOUT', message: 'Request timed out', details: null },
				meta: { timestamp: new Date().toISOString(), request_id: '' }
			} as ApiResponse<T>;
		}
		throw error;
	}
}

export const api = {
	auth: {
		async register(data: {
			name: string;
			email: string;
			password: string;
			password_confirmation: string;
		}) {
			return request<AuthData>('/auth/register', {
				method: 'POST',
				body: JSON.stringify(data)
			});
		},

		async login(data: { email: string; password: string }) {
			return request<AuthData>('/auth/login', {
				method: 'POST',
				body: JSON.stringify(data)
			});
		},

		async logout() {
			return request<null>('/auth/logout', {
				method: 'POST'
			});
		},

		async me() {
			return request<User>('/auth/me');
		},

		async refresh() {
			return request<AuthData>('/auth/refresh', {
				method: 'POST'
			});
		}
	},

	galaxies: {
		// List galaxies - returns my_games and open_games
		async list(): Promise<ApiResponse<GalaxyListResponse>> {
			const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;

			const headers: HeadersInit = {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				...(token && { Authorization: `Bearer ${token}` })
			};

			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

			try {
				const response = await fetch(`${API_BASE}/galaxies/list`, {
					headers,
					signal: controller.signal
				});
				clearTimeout(timeoutId);
				const data = await response.json();

				// Expected format: { success: true, data: { my_games: [...], open_games: [...] } }
				if (data.success && data.data) {
					return {
						success: true,
						data: {
							my_games: Array.isArray(data.data.my_games) ? data.data.my_games : [],
							open_games: Array.isArray(data.data.open_games) ? data.data.open_games : [],
							cached_at: data.meta?.timestamp || new Date().toISOString()
						},
						meta: data.meta || { timestamp: new Date().toISOString(), request_id: '' }
					};
				}

				// Error response
				return data;
			} catch (error) {
				clearTimeout(timeoutId);
				if (error instanceof Error && error.name === 'AbortError') {
					return {
						success: false,
						error: { code: 'TIMEOUT', message: 'Request timed out', details: null },
						meta: { timestamp: new Date().toISOString(), request_id: '' }
					};
				}
				return {
					success: false,
					error: { code: 'NETWORK_ERROR', message: String(error), details: null },
					meta: { timestamp: new Date().toISOString(), request_id: '' }
				};
			}
		},

		// Hydrated list - full galaxy objects
		// Hydrated list - full galaxy objects (fallback, combines my_games + open_games)
		async listFull(): Promise<ApiResponse<Galaxy[]>> {
			const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;

			const headers: HeadersInit = {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				...(token && { Authorization: `Bearer ${token}` })
			};

			try {
				const response = await fetch(`${API_BASE}/galaxies`, { headers });
				const data = await response.json();

				if (data.success && data.data) {
					// Handle { my_games: [...], open_games: [...] } structure
					if (data.data.my_games || data.data.open_games) {
						const myGames = Array.isArray(data.data.my_games) ? data.data.my_games : [];
						const openGames = Array.isArray(data.data.open_games) ? data.data.open_games : [];
						return {
							success: true,
							data: [...myGames, ...openGames] as Galaxy[],
							meta: data.meta || { timestamp: new Date().toISOString(), request_id: '' }
						};
					}
					// Direct array
					if (Array.isArray(data.data)) {
						return data;
					}
				}

				return data;
			} catch (error) {
				return {
					success: false,
					error: { code: 'NETWORK_ERROR', message: String(error), details: null },
					meta: { timestamp: new Date().toISOString(), request_id: '' }
				};
			}
		},

		async get(uuid: string) {
			return request<Galaxy>(`/galaxies/${uuid}`);
		},

		async getStatistics(uuid: string) {
			return request<GalaxyStatistics>(`/galaxies/${uuid}/statistics`);
		},

		async getVictoryLeaders(uuid: string) {
			return request<VictoryLeader[]>(`/galaxies/${uuid}/victory-leaders`);
		},

		async getMap(uuid: string) {
			return request<unknown>(`/galaxies/${uuid}/map`);
		},

		async create(data: {
			size_tier: SizeTier;
			game_mode: GameMode;
			name?: string;
			skip_mirror?: boolean;
			skip_precursors?: boolean;
			npc_count?: number;
			npc_difficulty?: NpcDifficulty;
		}) {
			return request<GalaxyCreationResult>('/galaxies/create', {
				method: 'POST',
				body: JSON.stringify(data)
			});
		},

		async getSizeTiers() {
			return request<SizeTiersResponse>('/galaxies/size-tiers');
		},

		async getCreationStatus(uuid: string) {
			return request<CreationStatus>(`/galaxies/${uuid}/creation-status`);
		},

		async getNpcs(galaxyUuid: string) {
			return request<Npc[]>(`/galaxies/${galaxyUuid}/npcs`);
		},

		async addNpcs(galaxyUuid: string, data: { archetypes: NpcArchetype[]; count?: number }) {
			return request<Npc[]>(`/galaxies/${galaxyUuid}/npcs`, {
				method: 'POST',
				body: JSON.stringify(data)
			});
		},

		// Galaxy membership
		async getMyPlayer(galaxyUuid: string) {
			return request<PlayerData>(`/galaxies/${galaxyUuid}/my-player`);
		},

		async join(galaxyUuid: string, data?: JoinGalaxyRequest) {
			return request<JoinGalaxyResponse>(`/galaxies/${galaxyUuid}/join`, {
				method: 'POST',
				body: JSON.stringify(data ?? {})
			});
		}
	},

	npcs: {
		async get(uuid: string) {
			return request<Npc>(`/npcs/${uuid}`);
		},

		async delete(uuid: string) {
			return request<null>(`/npcs/${uuid}`, {
				method: 'DELETE'
			});
		},

		async getArchetypes() {
			return request<NpcArchetypeInfo[]>('/npcs/archetypes');
		}
	},

	players: {
		// Player management
		async list() {
			return request<PlayerListItem[]>('/players');
		},

		async create(data: { galaxy_uuid: string; call_sign: string }) {
			return request<PlayerData>('/players', {
				method: 'POST',
				body: JSON.stringify(data)
			});
		},

		async get(playerUuid: string) {
			return request<PlayerData>(`/players/${playerUuid}`);
		},

		async update(playerUuid: string, data: Partial<{ call_sign: string }>) {
			return request<PlayerData>(`/players/${playerUuid}`, {
				method: 'PATCH',
				body: JSON.stringify(data)
			});
		},

		async delete(playerUuid: string) {
			return request<null>(`/players/${playerUuid}`, {
				method: 'DELETE'
			});
		},

		async getStatus(playerUuid: string) {
			return request<PlayerStatus>(`/players/${playerUuid}/status`);
		},

		async getStats(playerUuid: string) {
			return request<PlayerStats>(`/players/${playerUuid}/stats`);
		},

		// Find player by galaxy (returns null if not found)
		async findByGalaxy(galaxyUuid: string) {
			return request<PlayerData>(`/galaxies/${galaxyUuid}/player`);
		},

		// Scanning and exploration
		async scanSystem(playerUuid: string, poiUuid?: string, force?: boolean) {
			return request<ScanSystemResponse>(`/players/${playerUuid}/scan-system`, {
				method: 'POST',
				body: JSON.stringify({ poi_uuid: poiUuid, force })
			});
		},

		async getScanResults(playerUuid: string, poiUuid: string) {
			return request<GetScanResultsResponse>(`/players/${playerUuid}/scan-results/${poiUuid}`);
		},

		async getExplorationLog(playerUuid: string) {
			return request<ExplorationLogResponse>(`/players/${playerUuid}/exploration-log`);
		},

		async getBulkScanLevels(playerUuid: string, poiUuids: string[]) {
			return request<BulkScanLevelsResponse>(`/players/${playerUuid}/bulk-scan-levels`, {
				method: 'POST',
				body: JSON.stringify({ poi_uuids: poiUuids })
			});
		},

		async getSystemData(playerUuid: string, poiUuid: string) {
			return request<SystemDataResponse>(`/players/${playerUuid}/system-data/${poiUuid}`);
		}
	}
};
