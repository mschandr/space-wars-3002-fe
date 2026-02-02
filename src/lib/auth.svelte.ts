import { api, type User } from './api';

const AUTH_CACHE_KEY = 'auth_user_cache';
const AUTH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface AuthState {
	user: User | null;
	token: string | null;
	isAuthenticated: boolean;
	isLoading: boolean;
}

interface AuthCache {
	user: User;
	cachedAt: number;
}

function getCachedUser(): AuthCache | null {
	if (typeof localStorage === 'undefined') return null;
	try {
		const cached = localStorage.getItem(AUTH_CACHE_KEY);
		if (cached) {
			const parsed = JSON.parse(cached) as AuthCache;
			// Check if cache is still valid
			if (Date.now() - parsed.cachedAt < AUTH_CACHE_TTL) {
				return parsed;
			}
		}
	} catch {
		// Invalid cache
	}
	return null;
}

function cacheUser(user: User): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({ user, cachedAt: Date.now() }));
	} catch {
		// Storage full
	}
}

function clearUserCache(): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.removeItem(AUTH_CACHE_KEY);
}

function createAuthStore() {
	const state = $state<AuthState>({
		user: null,
		token: null,
		isAuthenticated: false,
		isLoading: true
	});

	function setAuth(user: User, token: string) {
		state.user = user;
		state.token = token;
		state.isAuthenticated = true;
		localStorage.setItem('auth_token', token);
		cacheUser(user);
	}

	function clearAuth() {
		state.user = null;
		state.token = null;
		state.isAuthenticated = false;
		localStorage.removeItem('auth_token');
		clearUserCache();
	}

	async function initialize() {
		// Skip if already authenticated
		if (state.isAuthenticated && state.user) {
			state.isLoading = false;
			return;
		}

		const token = localStorage.getItem('auth_token');

		// Clear invalid tokens (like "undefined" string)
		if (token && (token === 'undefined' || token === 'null' || token.length < 10)) {
			localStorage.removeItem('auth_token');
			clearUserCache();
			state.isLoading = false;
			return;
		}

		if (token) {
			state.token = token;

			// Try cached user first (avoids /auth/me call)
			const cached = getCachedUser();
			if (cached) {
				state.user = cached.user;
				state.isAuthenticated = true;
				state.isLoading = false;
				return;
			}

			// No cache, validate with API
			try {
				const response = await api.auth.me();
				if (response.success && response.data) {
					state.user = response.data;
					state.isAuthenticated = true;
					cacheUser(response.data);
				} else {
					clearAuth();
				}
			} catch (error) {
				console.error('[Auth] Network error during initialization:', error);
				clearAuth();
			}
		}
		state.isLoading = false;
	}

	async function login(email: string, password: string) {
		console.log('[Auth] Attempting login for:', email);
		const response = await api.auth.login({ email, password });
		console.log('[Auth] Login response:', response);
		if (response.success && response.data) {
			const token = response.data.access_token;
			console.log('[Auth] Login successful, setting auth state');
			setAuth(response.data.user, token);
		} else {
			console.log('[Auth] Login failed:', response.error);
		}
		return response;
	}

	async function register(name: string, email: string, password: string) {
		const response = await api.auth.register({
			name,
			email,
			password,
			password_confirmation: password
		});
		if (response.success && response.data) {
			setAuth(response.data.user, response.data.access_token);
		}
		return response;
	}

	async function logout() {
		await api.auth.logout();
		clearAuth();
	}

	return {
		get user() {
			return state.user;
		},
		get token() {
			return state.token;
		},
		get isAuthenticated() {
			return state.isAuthenticated;
		},
		get isLoading() {
			return state.isLoading;
		},
		get isAdmin() {
			return state.user?.is_admin ?? false;
		},
		initialize,
		login,
		register,
		logout
	};
}

export const auth = createAuthStore();
