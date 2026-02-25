// Scanning system types

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

export interface ExplorationLogEntry {
	poi_uuid: string;
	poi_name: string;
	poi_type: string;
	scan_level: number;
	first_scanned_at: string;
	last_scanned_at: string;
}

export interface ExplorationLogResponse {
	entries: ExplorationLogEntry[];
	total_systems_scanned: number;
	total_discoveries: number;
}

export interface BulkScanLevelEntry {
	poi_uuid: string;
	scan_level: number;
}

export interface BulkScanLevelsResponse {
	scan_levels: BulkScanLevelEntry[];
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

// Warp lane for galaxy map rendering
export interface MapWarpLane {
	from_system_uuid: string;
	to_system_uuid: string;
	is_active: boolean;
}

// Map data types
export interface MapSystemData {
	uuid: string;
	name: string;
	type: string;
	position: { x: number; y: number };
	scan_level: number;
	has_warp_gate: boolean;
	is_inhabited: boolean;
	is_hazardous: boolean;
}

export interface MapData {
	systems: MapSystemData[];
	galaxy_bounds: {
		width: number;
		height: number;
	};
	player_position: {
		system_uuid: string;
		x: number;
		y: number;
	};
	warp_lanes?: MapWarpLane[];
}

// Sector data from galaxy map endpoint
export interface MapSector {
	uuid: string;
	name: string;
	x_min: number;
	x_max: number;
	y_min: number;
	y_max: number;
	danger_level: number;
}

// Enriched sector for the sector map view (derived client-side)
export interface SectorViewEntry {
	uuid: string;
	name: string;
	bounds: { x_min: number; x_max: number; y_min: number; y_max: number };
	gridX: number;
	gridY: number;
	danger_level: number;
	total_systems: number;
	scanned_systems: number;
	inhabited_systems: number;
	has_warp_gate: boolean;
	has_trading?: boolean;
	player_count?: number;
	fog: 'revealed' | 'adjacent' | 'hidden';
}

// Ship and player types
export interface ShipStats {
	hull: { current: number; max: number };
	shield: { current: number; max: number; grade?: string };
	fuel: { current: number; max: number };
	cargo_capacity: number;
	cargo_used: number;
}

export interface SystemInfo {
	uuid: string;
	name: string;
	type: string;
	position: { x: number; y: number };
	features: SystemFeature[];
}

export interface SystemFeature {
	type: 'planet' | 'trading_hub' | 'salvage_yard' | 'warp_gate' | 'asteroid_field' | 'anomaly';
	name: string;
	uuid: string;
	available: boolean;
}

// --- Knowledge System Types (fog-of-war from server) ---

export interface KnownSystem {
	uuid: string;
	x: number;
	y: number;
	knowledge_level: number; // 0-4: UNKNOWN, DETECTED, BASIC, SURVEYED, VISITED
	knowledge_label: string;
	freshness: number; // 0.0 - 1.0
	source: string;
	// Server sends stellar data nested under `star` — normalize on receive to flat fields
	star?: {
		type?: string;
		stellar_class?: string;
		stellar_description?: string;
		temperature_range_k?: { min: number; max: number };
	};
	// Flat fields (populated by normalizeKnownSystem from star.*)
	name?: string; // level >= 2
	stellar_class?: string; // level >= 1 (e.g. "G", "M", "K")
	stellar_description?: string; // level >= 1 (e.g. "Yellow dwarf")
	temperature_range_k?: { min: number; max: number }; // level >= 2 (class-based range)
	is_inhabited?: boolean; // level >= 2
	temperature_k?: number; // level >= 3 (precise)
	luminosity?: number; // level >= 3
	goldilocks_zone?: { inner: number; outer: number }; // level >= 3
	planet_count?: number; // level >= 3
	services?: Record<string, boolean>; // level >= 3
	pirate_warning?: boolean;
	scan_level?: number; // independent 0-9 detail scan
	has_scan_data?: boolean;
}

/** Normalize a KnownSystem from the API response:
 *  - Flatten nested `star.*` fields onto top-level
 *  - Map legacy `poi_uuid` → `uuid` (BE migration in progress) */
export function normalizeKnownSystem(sys: KnownSystem): KnownSystem {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const raw = sys as any;
	const uuid = sys.uuid ?? raw.poi_uuid;
	const base = uuid !== sys.uuid ? { ...sys, uuid } : sys;
	if (!base.star) return base;
	return {
		...base,
		stellar_class: base.stellar_class ?? base.star.stellar_class,
		stellar_description: base.stellar_description ?? base.star.stellar_description,
		temperature_range_k: base.temperature_range_k ?? base.star.temperature_range_k
	};
}

/** Normalize a KnownLane from the API response:
 *  - Map legacy `from_poi_uuid`/`to_poi_uuid` → `from_uuid`/`to_uuid` (BE migration in progress) */
export function normalizeKnownLane(lane: KnownLane): KnownLane {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const raw = lane as any;
	return {
		...lane,
		from_uuid: lane.from_uuid ?? raw.from_poi_uuid,
		to_uuid: lane.to_uuid ?? raw.to_poi_uuid
	};
}

export interface KnownLane {
	gate_uuid: string;
	from_uuid: string;
	to_uuid: string;
	from_name?: string;
	to_name?: string;
	from: { x: number; y: number };
	to: { x: number; y: number };
	distance: number;
	has_pirate: boolean;
	pirate_freshness?: number;
	discovery_method: string;
}

export interface DangerZone {
	center: { x: number; y: number };
	radius_ly: number;
	source: string;
	confidence: number;
}

export interface KnowledgeMapData {
	galaxy: { uuid: string; name: string; width: number; height: number };
	player: {
		uuid: string;
		x: number;
		y: number;
		system_uuid: string;
		sector_uuid?: string;
		sensor_range_ly: number;
		sensor_level?: number;
	};
	known_systems: KnownSystem[];
	known_lanes: KnownLane[];
	danger_zones: DangerZone[];
	statistics: { total_known: number; total_visited: number; total_lanes: number };
}

export interface SectorMapEntry {
	uuid: string;
	name: string;
	grid_x: number;
	grid_y: number;
	bounds: { x_min: number; x_max: number; y_min: number; y_max: number };
	danger_level: number;
	total_systems: number;
	inhabited_systems: number;
	has_trading: boolean;
	player_count: number;
}

export interface SectorMapData {
	sectors: SectorMapEntry[];
	grid_size: { cols: number; rows: number };
	player_sector_uuid?: string;
	player_location?: { x: number; y: number; system_uuid: string };
}

// Knowledge level color/opacity mapping (replaces SCAN_COLORS for map view)
export const KNOWLEDGE_COLORS: Record<number, { color: string; opacity: number; label: string }> = {
	0: { color: '#1a1a2e', opacity: 0.0, label: 'Unknown' },
	1: { color: '#4a5568', opacity: 0.3, label: 'Detected' },
	2: { color: '#3b82f6', opacity: 0.5, label: 'Basic' },
	3: { color: '#10b981', opacity: 0.8, label: 'Surveyed' },
	4: { color: '#f59e0b', opacity: 1.0, label: 'Visited' }
};

// Stellar spectral class colors (for star dots on the map)
export const STELLAR_COLORS: Record<string, string> = {
	O: '#6b8bff', // Blue
	B: '#9bb0ff', // Blue-white
	A: '#cad8ff', // White
	F: '#f8f0d0', // Yellow-white
	G: '#ffd700', // Yellow (Sol-like)
	K: '#ff8c00', // Orange
	M: '#e05030', // Red
};

// Returns the color for a stellar class, falling back to knowledge-level color
export function stellarColor(sys: KnownSystem): string {
	if (sys.stellar_class) {
		// Match first letter (e.g. "G2V" → "G")
		const spectral = sys.stellar_class.charAt(0).toUpperCase();
		if (STELLAR_COLORS[spectral]) return STELLAR_COLORS[spectral];
	}
	return KNOWLEDGE_COLORS[sys.knowledge_level]?.color ?? '#4a5568';
}

// Scan level color mapping for fog-of-war
export const SCAN_COLORS: Record<number, { color: string; opacity: number }> = {
	0: { color: '#1a1a2e', opacity: 0.2 }, // Unscanned - nearly invisible
	1: { color: '#4a4a6a', opacity: 0.4 }, // Basic
	2: { color: '#4a4a6a', opacity: 0.4 },
	3: { color: '#3366aa', opacity: 0.6 }, // Resources
	4: { color: '#3366aa', opacity: 0.6 },
	5: { color: '#33aa66', opacity: 0.8 }, // Hidden features
	6: { color: '#33aa66', opacity: 0.8 },
	7: { color: '#aa9933', opacity: 0.9 }, // Deep intel
	8: { color: '#aa9933', opacity: 0.9 },
	9: { color: '#ff6600', opacity: 1.0 } // Precursor secrets
};
