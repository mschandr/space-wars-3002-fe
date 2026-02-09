import type { GalaxySummary, GalaxyListResponse } from './api';

const CACHE_KEY = 'galaxy_list_cache';
const CACHE_VERSION = 3;

interface GalaxyListCache {
	version: number;
	my_games: GalaxySummary[];
	open_games: GalaxySummary[];
	cachedAt: string;
}

function getCache(): GalaxyListCache | null {
	if (typeof localStorage === 'undefined') {
		return null;
	}

	try {
		const cached = localStorage.getItem(CACHE_KEY);
		if (cached) {
			const parsed = JSON.parse(cached) as GalaxyListCache;
			if (parsed.version === CACHE_VERSION) {
				return parsed;
			}
		}
	} catch {
		// Invalid cache
	}

	return null;
}

function saveCache(cache: GalaxyListCache): void {
	if (typeof localStorage === 'undefined') return;

	try {
		localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
	} catch {
		// Storage full or unavailable
	}
}

export function getCachedGalaxyList(): GalaxyListResponse | null {
	const cache = getCache();
	if (!cache) return null;
	return {
		my_games: cache.my_games,
		open_games: cache.open_games,
		cached_at: cache.cachedAt
	};
}

export function cacheGalaxyList(data: GalaxyListResponse): void {
	saveCache({
		version: CACHE_VERSION,
		my_games: data.my_games,
		open_games: data.open_games,
		cachedAt: data.cached_at
	});
}

export function clearGalaxyCache(): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.removeItem(CACHE_KEY);
}

export function getGalaxyFromCache(uuid: string): GalaxySummary | null {
	const cache = getCache();
	if (!cache) return null;

	// Search in my_games first, then open_games
	const found =
		cache.my_games.find((g) => g.uuid === uuid) || cache.open_games.find((g) => g.uuid === uuid);

	return found || null;
}
