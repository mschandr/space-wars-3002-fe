import type { HubInventoryItem } from './api';

const CACHE_KEY = 'price_history';
const CACHE_VERSION = 1;
const MAX_SNAPSHOTS_PER_MINERAL = 20;
const DEDUP_WINDOW_MS = 60_000; // 1 minute

export interface PriceSnapshot {
	hub_uuid: string;
	hub_name: string;
	buy_price: number;
	sell_price: number;
	timestamp: string;
}

interface MineralPriceHistory {
	[mineral_uuid: string]: PriceSnapshot[];
}

interface PriceHistoryCache {
	version: number;
	galaxy_uuid: string;
	history: MineralPriceHistory;
}

function getCache(galaxyUuid: string): PriceHistoryCache | null {
	if (typeof localStorage === 'undefined') return null;

	try {
		const raw = localStorage.getItem(CACHE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as PriceHistoryCache;
		if (parsed.version !== CACHE_VERSION || parsed.galaxy_uuid !== galaxyUuid) return null;
		return parsed;
	} catch {
		return null;
	}
}

function saveCache(cache: PriceHistoryCache): void {
	if (typeof localStorage === 'undefined') return;

	try {
		localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
	} catch {
		// Storage full or unavailable
	}
}

export function recordPrices(
	galaxyUuid: string,
	hubUuid: string,
	hubName: string,
	items: HubInventoryItem[]
): void {
	let cache = getCache(galaxyUuid);
	if (!cache) {
		cache = { version: CACHE_VERSION, galaxy_uuid: galaxyUuid, history: {} };
	}

	const now = new Date().toISOString();
	const nowMs = Date.now();

	for (const item of items) {
		const id = item.mineral.uuid;
		if (!cache.history[id]) {
			cache.history[id] = [];
		}

		const snapshots = cache.history[id];

		// Dedupe: skip if same hub recorded within the last minute
		const last = snapshots[snapshots.length - 1];
		if (last && last.hub_uuid === hubUuid) {
			const lastMs = new Date(last.timestamp).getTime();
			if (nowMs - lastMs < DEDUP_WINDOW_MS) continue;
		}

		snapshots.push({
			hub_uuid: hubUuid,
			hub_name: hubName,
			buy_price: item.buy_price,
			sell_price: item.sell_price,
			timestamp: now
		});

		// Prune oldest if over cap
		if (snapshots.length > MAX_SNAPSHOTS_PER_MINERAL) {
			cache.history[id] = snapshots.slice(-MAX_SNAPSHOTS_PER_MINERAL);
		}
	}

	saveCache(cache);
}

export function getHistory(galaxyUuid: string, mineralUuid: string): PriceSnapshot[] {
	const cache = getCache(galaxyUuid);
	if (!cache) return [];
	return cache.history[mineralUuid] ?? [];
}
