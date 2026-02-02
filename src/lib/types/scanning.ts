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
