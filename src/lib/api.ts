import type { KnowledgeMapData, SectorMapData } from '$lib/types/scanning';

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

export type GameMode = 'multiplayer' | 'single_player';

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

// Location types
export interface LocationSector {
	uuid: string;
	name: string;
	grid: { x: number; y: number };
	danger_level: 'low' | 'medium' | 'high' | 'extreme';
	display_name: string;
}

export interface LocationBody {
	type: 'planet' | 'moon' | 'station' | 'asteroid';
	uuid: string;
	name: string;
}

export interface LocationGate {
	destination_uuid: string;
	destination_name: string;
	distance: number;
}

export interface CurrentLocationResponse {
	location: string;
	system_name: string;
	system_uuid: string;
	coordinates: { x: number; y: number };
	sector: LocationSector;
	type: string;
	knowledge_level: 'none' | 'basic' | 'detailed' | 'complete';
	is_current_location: boolean;
	inhabited?: {
		is_inhabited: boolean;
		bodies: LocationBody[];
		planet_count: number;
		moon_count: number;
		station_count: number;
	};
	has?: {
		gates: Record<string, LocationGate>;
		gate_count: number;
		services: string[];
		trading_hub?: {
			uuid: string;
			name: string;
		};
	};
}

// Trading Hub types
export interface TradingHub {
	uuid: string;
	name: string;
	location: {
		uuid: string;
		name: string;
	};
	is_active: boolean;
	has_shipyard: boolean;
	has_repair_shop: boolean;
	has_cartographer: boolean;
	has_plans_shop: boolean;
}

export interface ShipTemplate {
	uuid: string;
	name: string;
	class: string;
	price: number;
	base_cargo: number;
	base_fuel: number;
	base_weapons: number;
	base_hull: number;
	description: string;
}

export interface ShipyardResponse {
	shipyard: {
		uuid: string;
		name: string;
	};
	available_ships: ShipTemplate[];
}

// Ship types
export interface Ship {
	uuid: string;
	name: string;
	class: string;
	is_active?: boolean;
}

export interface ShipClass {
	id: number;
	name: string;
	class: string;
}

export interface MyShipResponse {
	uuid: string;
	name: string;
	current_fuel: number;
	max_fuel: number;
	fuel_regen_rate: number;
	hull: number;
	max_hull: number;
	shields: number;
	max_shields: number;
	weapons: number;
	cargo_hold: number;
	sensors: number;
	warp_drive: number;
	status: string;
	ship_class: ShipClass;
}

export interface PurchaseShipRequest {
	ship_uuid: string;
	ship_name?: string;
}

export interface PurchaseShipResponse {
	purchased_ship: Ship;
	price_paid: number;
	credits_remaining: number;
}

export interface SwitchShipRequest {
	ship_uuid: string;
}

export interface SwitchShipResponse {
	active_ship: Ship;
	previous_ship: Ship;
}

// Player Location Response
export interface PlayerLocationBody {
	uuid: string;
	name: string;
	type: string;
	sub_type?: string;
	is_inhabited?: boolean;
	population?: number;
	services?: string[];
}

export interface PlayerLocationResponse {
	system: {
		uuid: string;
		name: string;
		type: string;
		coordinates: { x: number; y: number };
	};
	sector: {
		uuid: string;
		name: string;
		grid: { x: number; y: number };
		danger_level: string;
	};
	bodies: PlayerLocationBody[];
	gates: {
		uuid: string;
		destination_uuid: string;
		destination_name: string;
		distance: number;
	}[];
	services: string[];
}

// Local Bodies Response
export interface OrbitalBody {
	uuid: string;
	name: string;
	type: 'planet' | 'moon' | 'asteroid_belt' | 'station';
	sub_type?: string;
	type_label?: string;
	orbital_position: number;
	is_inhabited: boolean;
	population?: number;
	services?: string[];
	moons?: OrbitalBody[];

	// Physical characteristics
	size?: 'tiny' | 'small' | 'medium' | 'large' | 'giant' | 'massive';
	radius?: number;
	mass?: number;
	gravity?: number;
	atmosphere?: string;
	temperature?: number;
	temperature_class?: 'frozen' | 'cold' | 'temperate' | 'warm' | 'hot' | 'scorching';
	climate?: string;
	biome?: string;
	hydrosphere?: number; // Percentage of water coverage

	// Resources and economy
	resources?: PlanetResource[];
	resource_richness?: 'barren' | 'poor' | 'moderate' | 'rich' | 'abundant';
	economy_type?: string;
	tech_level?: number;
	trade_goods?: string[];

	// Political/social
	government_type?: string;
	faction?: string;
	allegiance?: string;
	security_level?: 'lawless' | 'low' | 'medium' | 'high' | 'maximum';

	// Hazards and features
	hazards?: string[];
	special_features?: string[];
	anomalies?: string[];
	points_of_interest?: PointOfInterest[];

	// Description
	description?: string;
	discovered_by?: string;
	discovered_at?: string;

	// Station-specific
	station_type?: string;
	docking_fee?: number;
	max_landing_pad_size?: 'small' | 'medium' | 'large';
}

export interface PlanetResource {
	name: string;
	type: string;
	abundance: 'trace' | 'low' | 'moderate' | 'high' | 'very_high';
	extractable: boolean;
}

export interface PointOfInterest {
	uuid: string;
	name: string;
	type: string;
	description?: string;
}

export interface LocalBodiesResponse {
	system: {
		uuid: string;
		name: string;
		type: string;
		stellar_class?: string;
		stellar_size?: string;
		luminosity?: number;
		temperature?: number;
		age?: number;
	};
	sector: {
		uuid: string;
		name: string;
		display_name: string;
		grid: { x: number; y: number };
		danger_level: 'low' | 'medium' | 'high' | 'extreme';
	};
	bodies: {
		planets: OrbitalBody[];
		asteroid_belts: OrbitalBody[];
		stations: OrbitalBody[];
	};
	warp_gates?: StarSystemWarpGate[];
	summary: {
		total_bodies: number;
		planet_count: number;
		moon_count: number;
		asteroid_belt_count: number;
		station_count: number;
		inhabited_count: number;
	};
	// Comprehensive features summary
	features?: SystemFeaturesSummary;
}

// Star System Feature Summary types
export interface SystemServiceSummary {
	type: string;
	name: string;
	location_uuid: string;
	location_name: string;
}

export interface SystemResourceSummary {
	name: string;
	type: string;
	abundance: 'trace' | 'low' | 'moderate' | 'high' | 'very_high';
	locations: string[]; // Body names where found
}

export interface SystemFactionPresence {
	faction_uuid: string;
	faction_name: string;
	influence: number; // 0-100
	is_controlling: boolean;
}

export interface SystemFeaturesSummary {
	// Services available in the system
	services: SystemServiceSummary[];
	has_trading_hub: boolean;
	has_shipyard: boolean;
	has_repair_shop: boolean;
	has_cartographer: boolean;
	has_refueling: boolean;
	has_black_market: boolean;

	// Resources
	resources: SystemResourceSummary[];
	resource_richness: 'barren' | 'poor' | 'moderate' | 'rich' | 'abundant';
	mineable_asteroids: number;

	// Hazards and dangers
	hazards: string[];
	danger_level: 'safe' | 'low' | 'medium' | 'high' | 'extreme';
	pirate_activity: 'none' | 'low' | 'moderate' | 'high' | 'infested';

	// Political/faction
	factions: SystemFactionPresence[];
	controlling_faction?: string;
	security_level: 'lawless' | 'low' | 'medium' | 'high' | 'maximum';

	// Points of interest
	anomalies: string[];
	special_features: string[];
	landmarks: string[];

	// Economy
	economy_types: string[];
	trade_routes: number;
	market_demand: string[]; // Goods in demand
	market_surplus: string[]; // Goods in surplus

	// Exploration
	unexplored_bodies: number;
	scan_completion: number; // 0-100 percentage
	discoveries_available: boolean;
}

// Star System types
export interface StarSystemSummary {
	uuid: string;
	name: string;
	type: string;
	stellar_class?: string;
	position: { x: number; y: number };
	sector: {
		uuid: string;
		name: string;
		display_name?: string;
	};
	is_inhabited: boolean;
	is_known: boolean;
	is_charted: boolean;
	scan_level: number;
	distance?: number;
	// Quick feature flags for list views
	features?: {
		has_services: boolean;
		has_trading: boolean;
		has_hazards: boolean;
		has_resources: boolean;
		has_anomalies: boolean;
	};
}

export interface StarSystemWarpGate {
	uuid: string;
	destination_uuid: string;
	destination_name: string;
	distance: number;
	is_active: boolean;
}

export interface StarSystemDetails {
	uuid: string;
	name: string;
	type: string;
	stellar_class?: string;
	stellar_size?: string;
	luminosity?: number;
	temperature?: number;
	age?: number;
	position: { x: number; y: number };
	sector: {
		uuid: string;
		name: string;
		display_name?: string;
		grid: { x: number; y: number };
		danger_level: 'low' | 'medium' | 'high' | 'extreme';
	};
	is_inhabited: boolean;
	is_known: boolean;
	is_charted: boolean;
	scan_level: number;
	bodies: {
		planets: OrbitalBody[];
		asteroid_belts: OrbitalBody[];
		stations: OrbitalBody[];
	};
	warp_gates: StarSystemWarpGate[];
	trading_hub?: {
		uuid: string;
		name: string;
	};
	summary: {
		total_bodies: number;
		planet_count: number;
		moon_count: number;
		asteroid_belt_count: number;
		station_count: number;
		inhabited_count: number;
	};
	// Comprehensive features summary
	features?: SystemFeaturesSummary;
	visibility: {
		full_visibility: boolean;
		visible_scan_levels: number[];
	};
}

export interface StarSystemListResponse {
	systems: StarSystemSummary[];
	filters: {
		known?: boolean;
		inhabited?: boolean;
		scanned?: boolean;
		charted?: boolean;
	};
	total: number;
}

// Travel types
export interface TravelResponse {
	success: boolean;
	status?: 'complete' | 'generating';
	message?: string;
	destination: {
		uuid: string;
		name: string;
		type: string;
		position: { x: number; y: number };
	};
	sector: {
		uuid: string;
		name: string;
		display_name?: string;
		grid: { x: number; y: number };
		danger_level: 'low' | 'medium' | 'high' | 'extreme';
	};
	fuel_used: number;
	fuel_remaining: number;
	travel_time?: number;
}

// System generation status response
export interface SystemGenerationStatus {
	status: 'generating' | 'complete' | 'error';
	message?: string;
	progress?: number;
}

// Facilities types
export interface Facility {
	uuid: string;
	name: string;
	type?: string;
	location?: string;
	description?: string;
	services?: string[];
	endpoint?: string;
}

export interface FacilityAction {
	id: string;
	label: string;
	endpoint: string;
	facility_uuid?: string;
}

export interface FacilitiesSummary {
	total_trading_hubs: number;
	total_trading_stations: number;
	total_shipyards: number;
	total_salvage_yards: number;
	total_bars: number;
	total_cartographers: number;
	total_defense_platforms: number;
	has_trading: boolean;
	has_ship_services: boolean;
	has_salvage: boolean;
	has_cartographer: boolean;
	has_bar: boolean;
}

export interface FacilitiesResponse {
	system: {
		uuid: string;
		name: string;
		is_inhabited: boolean;
	};
	facilities: {
		trading_hubs: Facility[];
		trading_stations: Facility[];
		shipyards: Facility[];
		salvage_yards: Facility[];
		cartographers: Facility[];
		bars: Facility[];
		defense_platforms: Facility[];
		summary: FacilitiesSummary;
		available_actions: FacilityAction[];
	};
}

export interface BarVisitResponse {
	bar: {
		uuid: string;
		name: string;
		location: string;
	};
	rumors: {
		id: string;
		text: string;
		source?: string;
		reliability?: 'unreliable' | 'questionable' | 'reliable' | 'verified';
	}[];
	patrons?: {
		name: string;
		description?: string;
		has_mission?: boolean;
	}[];
}

// Ship Catalog Response
export interface ShipCatalogItem {
	uuid: string;
	name: string;
	class: string;
	description: string;
	price: number;
	base_hull: number;
	base_shield: number;
	base_fuel: number;
	base_cargo: number;
	base_weapons: number;
	tier: string;
	available: boolean;
}

// Mineral types
export interface Mineral {
	uuid: string;
	name: string;
	description?: string;
	rarity: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary';
	base_price: number;
}

export interface HubInventoryItem {
	mineral: Mineral;
	quantity: number;
	buy_price: number;
	sell_price: number;
}

export interface HubInventoryResponse {
	hub: {
		uuid: string;
		name: string;
	};
	inventory: HubInventoryItem[];
}

export interface NearbyHub {
	uuid: string;
	name: string;
	type: 'major' | 'minor';
	location: {
		uuid: string;
		name: string;
		distance: number;
	};
}

export interface NearbyHubsResponse {
	hubs: NearbyHub[];
	search_radius: number;
}

export interface BuyMineralRequest {
	player_uuid: string;
	mineral_uuid: string;
	quantity: number;
}

export interface BuyMineralResponse {
	mineral: string;
	quantity_bought: number;
	price_per_unit: number;
	total_cost: number;
	remaining_credits: number;
	cargo_used: number;
	cargo_remaining: number;
}

export interface SellMineralRequest {
	player_uuid: string;
	mineral_uuid: string;
	quantity: number;
}

export interface SellMineralResponse {
	mineral: string;
	quantity_sold: number;
	price_per_unit: number;
	total_earned: number;
	new_credits: number;
	cargo_freed: number;
}

// Cargo types
export interface CargoItem {
	mineral: {
		uuid: string;
		name: string;
		rarity: string;
	};
	quantity: number;
}

export interface CargoResponse {
	cargo_hold: number;
	current_cargo: number;
	available_space: number;
	items: CargoItem[];
}

// Sector types
export interface SectorSystem {
	uuid: string;
	name: string;
	type: string;
	x: number;
	y: number;
	is_inhabited: boolean;
	is_known?: boolean; // In player's star charts
	is_detected?: boolean; // Detected by sensors but not in charts
}

export interface SectorWarpGate {
	uuid: string;
	from_system_uuid: string;
	to_system_uuid: string;
	from: { x: number; y: number };
	to: { x: number; y: number };
	is_active: boolean;
}

export interface SectorDetailsResponse {
	uuid: string;
	name: string;
	display_name?: string;
	galaxy: {
		uuid: string;
		name: string;
	};
	bounds: {
		x_min: number;
		x_max: number;
		y_min: number;
		y_max: number;
	};
	danger_level: number;
	grid: { x: number; y: number };
	statistics: {
		total_systems: number;
		inhabited_systems: number;
		active_players: number;
		pirate_fleets: number;
	};
	systems: SectorSystem[];
	warp_gates?: SectorWarpGate[];
}

const DEFAULT_TIMEOUT = 10000; // 10 seconds
const LONG_TIMEOUT = 600000; // 10 minutes for long-running operations like galaxy creation

interface RequestOptions extends RequestInit {
	timeout?: number;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
	const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
	const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;

	const headers: HeadersInit = {
		Accept: 'application/json',
		'Content-Type': 'application/json',
		...(token && { Authorization: `Bearer ${token}` }),
		...fetchOptions.headers
	};

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout);

	try {
		const response = await fetch(`${API_BASE}${endpoint}`, {
			...fetchOptions,
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
				body: JSON.stringify(data),
				timeout: LONG_TIMEOUT // Galaxy creation can take several minutes
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

		async getMyShip(galaxyUuid: string) {
			return request<MyShipResponse>(`/galaxies/${galaxyUuid}/my-ship`);
		},

		async join(galaxyUuid: string, data?: JoinGalaxyRequest) {
			return request<JoinGalaxyResponse>(`/galaxies/${galaxyUuid}/join`, {
				method: 'POST',
				body: JSON.stringify(data ?? {})
			});
		},

		async getSectorMap(galaxyUuid: string) {
			return request<SectorMapData>(`/galaxies/${galaxyUuid}/sector-map`);
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
		},

		// Ship management
		async purchaseShip(playerUuid: string, data: PurchaseShipRequest) {
			return request<PurchaseShipResponse>(`/players/${playerUuid}/ships/purchase`, {
				method: 'POST',
				body: JSON.stringify(data)
			});
		},

		async switchShip(playerUuid: string, data: SwitchShipRequest) {
			return request<SwitchShipResponse>(`/players/${playerUuid}/ships/switch`, {
				method: 'POST',
				body: JSON.stringify(data)
			});
		},

		async getShips(playerUuid: string) {
			return request<Ship[]>(`/players/${playerUuid}/ships`);
		},

		// Get player's current location with details
		async getLocation(playerUuid: string) {
			return request<PlayerLocationResponse>(`/players/${playerUuid}/location`);
		},

		// Get local orbital bodies at player's current star system
		async getLocalBodies(playerUuid: string) {
			return request<LocalBodiesResponse>(`/players/${playerUuid}/local-bodies`);
		},

		// Get player's cargo manifest
		async getCargo(playerUuid: string) {
			return request<CargoResponse>(`/players/${playerUuid}/cargo`);
		},

		// Star system endpoints
		async getStarSystems(
			playerUuid: string,
			filters?: { known?: boolean; inhabited?: boolean; scanned?: boolean; charted?: boolean }
		) {
			const params = new URLSearchParams();
			if (filters) {
				if (filters.known !== undefined) params.append('known', String(filters.known));
				if (filters.inhabited !== undefined) params.append('inhabited', String(filters.inhabited));
				if (filters.scanned !== undefined) params.append('scanned', String(filters.scanned));
				if (filters.charted !== undefined) params.append('charted', String(filters.charted));
			}
			const query = params.toString();
			return request<StarSystemListResponse>(
				`/players/${playerUuid}/star-systems${query ? `?${query}` : ''}`
			);
		},

		async getStarSystem(playerUuid: string, systemUuid: string) {
			return request<StarSystemDetails>(`/players/${playerUuid}/star-systems/${systemUuid}`);
		},

		async getCurrentSystem(playerUuid: string) {
			return request<StarSystemDetails>(`/players/${playerUuid}/current-system`);
		},

		// Travel to a destination (warp gate or star system)
		async travel(playerUuid: string, destinationUuid: string) {
			return request<TravelResponse>(`/players/${playerUuid}/travel`, {
				method: 'POST',
				body: JSON.stringify({ destination_uuid: destinationUuid })
			});
		},

		// Facilities endpoints
		async getFacilities(playerUuid: string) {
			return request<FacilitiesResponse>(`/players/${playerUuid}/facilities`);
		},

		async visitBar(playerUuid: string) {
			return request<BarVisitResponse>(`/players/${playerUuid}/facilities/bar`);
		},

		async getKnowledgeMap(playerUuid: string, sectorUuid?: string) {
			const params = sectorUuid ? `?sector_uuid=${sectorUuid}` : '';
			return request<KnowledgeMapData>(`/players/${playerUuid}/knowledge-map${params}`);
		}
	},

	// Ships endpoints
	ships: {
		async getCatalog() {
			return request<ShipCatalogItem[]>('/ships/catalog');
		}
	},

	// Location endpoints
	location: {
		async getCurrent(poiUuid: string) {
			return request<CurrentLocationResponse>(`/location/current/${poiUuid}`, {
				method: 'POST'
			});
		}
	},

	// Trading Hub endpoints
	tradingHubs: {
		async get(hubUuid: string) {
			return request<TradingHub>(`/trading-hubs/${hubUuid}`);
		},

		async getShipyard(hubUuid: string) {
			return request<ShipyardResponse>(`/trading-hubs/${hubUuid}/shipyard`);
		},

		async list(playerUuid: string, radius?: number) {
			const params = new URLSearchParams({ player_uuid: playerUuid });
			if (radius !== undefined) {
				params.append('radius', radius.toString());
			}
			return request<NearbyHubsResponse>(`/trading-hubs?${params.toString()}`);
		},

		async getInventory(hubUuid: string) {
			return request<HubInventoryResponse>(`/trading-hubs/${hubUuid}/inventory`);
		},

		async buy(hubUuid: string, data: BuyMineralRequest) {
			return request<BuyMineralResponse>(`/trading-hubs/${hubUuid}/buy`, {
				method: 'POST',
				body: JSON.stringify(data)
			});
		},

		async sell(hubUuid: string, data: SellMineralRequest) {
			return request<SellMineralResponse>(`/trading-hubs/${hubUuid}/sell`, {
				method: 'POST',
				body: JSON.stringify(data)
			});
		}
	},

	// Minerals endpoints
	minerals: {
		async list() {
			return request<Mineral[]>('/minerals');
		}
	},

	// Sectors endpoints
	sectors: {
		async get(sectorUuid: string) {
			return request<SectorDetailsResponse>(`/sectors/${sectorUuid}`);
		}
	}
};
