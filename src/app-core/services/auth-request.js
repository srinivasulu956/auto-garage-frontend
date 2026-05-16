export const AUTH_TOKEN_KEY = 'ag_access_token';
const AUTH_BASE_URL = import.meta.env.VITE_AUTH_BASE_URL;

export const defaultApiHeaders = {
	'Content-Type': 'application/json',
	'ngrok-skip-browser-warning': 'true',
};

export const withAuthRequestDefaults = (options = {}) => ({
	credentials: 'include',
	...options,
	headers: {
		...defaultApiHeaders,
		...options.headers,
	},
});

export const getStoredToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

export const setStoredToken = (token) => {
	if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearStoredToken = () => localStorage.removeItem(AUTH_TOKEN_KEY);

// Silent refresh depends on the HttpOnly refresh-token cookie.
// The caller decides whether a failed refresh should also clear Redux state.
export const refreshAccessToken = async () => {
	try {
		const response = await fetch(`${AUTH_BASE_URL}/refresh`, withAuthRequestDefaults({ method: 'POST' }));

		if (!response.ok) return null;

		const data = await response.json();
		const accessToken = data.accessToken ?? data.AccessToken;

		if (!accessToken) return null;

		setStoredToken(accessToken);
		return accessToken;
	} catch {
		return null;
	}
};
