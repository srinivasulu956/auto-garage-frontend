import { logoutUser } from '../actions/auth-actions';
import store from '../reducers/store';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const defaultHeaders = {
	'Content-Type': 'application/json',
	'ngrok-skip-browser-warning': 'true',
};

let refreshPromise = null;

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

const parseErrorMessage = async (response) => {
	const contentType = response.headers.get('content-type') ?? '';

	if (!contentType.includes('application/json')) {
		const text = await response.text().catch(() => '');
		return text || `Request failed with status ${response.status}`;
	}

	const error = await response.json().catch(() => ({}));

	if (Array.isArray(error)) {
		return error.join('\n');
	}

	if (error?.errors) {
		return Object.values(error.errors).flat().join('\n');
	}

	return error.error || error.message || error.title || `Request failed with status ${response.status}`;
};

const handleResponse = async (response) => {
	if (response.status === 204) {
		return null;
	}

	if (!response.ok) {
		throw new Error(await parseErrorMessage(response));
	}

	return response.json();
};

const TOKEN_KEY = 'ag_access_token';

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

export const setStoredToken = (token) => {
	if (token) localStorage.setItem(TOKEN_KEY, token);
};

export const clearStoredToken = () => localStorage.removeItem(TOKEN_KEY);

const clearSession = () => {
	clearStoredToken();
	store.dispatch(logoutUser());
};

// ─────────────────────────────────────────
// Refresh Logic
// ─────────────────────────────────────────

const refreshAccessToken = async () => {
	try {
		const response = await fetch(`${BASE_URL}/Auth/refresh`, {
			method: 'POST',
			credentials: 'include', // sends the HttpOnly refresh cookie automatically
		});

		if (!response.ok) {
			// Refresh token is expired or revoked — user must log in again
			clearSession();
			return null;
		}

		const data = await response.json();
		const accessToken = data.accessToken ?? data.AccessToken;

		if (!accessToken) {
			clearSession();
			return null;
		}

		setStoredToken(accessToken);
		return accessToken;
	} catch {
		clearSession();
		return null;
	}
};

// De-duplicate: if multiple requests fire at the same time and all get 401,
// only one refresh call goes to the backend. All others wait for it.
const getRefreshedToken = async () => {
	if (!refreshPromise) {
		refreshPromise = refreshAccessToken().finally(() => {
			refreshPromise = null;
		});
	}
	return refreshPromise;
};

// ─────────────────────────────────────────
// HTTP Request Sender
// ─────────────────────────────────────────

const sendRequest = (url, options, token) =>
	fetch(`${BASE_URL}${url}`, {
		credentials: 'include',
		...options,
		headers: {
			...defaultHeaders,
			...(token && { Authorization: `Bearer ${token}` }),
			...options.headers,
		},
	});

// ─────────────────────────────────────────
// Main Request Wrapper
// ─────────────────────────────────────────

const request = async (url, options = {}, retried = false) => {
	const token = getStoredToken();

	let response = await sendRequest(url, options, token);

	// Forbidden — wrong role, deactivated account etc. Clear session immediately.
	if (response.status === 403) {
		clearSession();
		throw new Error('Access denied. Session terminated.');
	}

	// Success or non-auth error — return as-is
	if (response.status !== 401) {
		return handleResponse(response);
	}

	// Got 401 — prevent infinite loop on second attempt
	if (retried) {
		clearSession();
		throw new Error('Session expired. Please log in again.');
	}

	// Access token expired — try to silently refresh using the cookie
	const newToken = await getRefreshedToken();

	if (!newToken) {
		// Refresh also failed (cookie expired or revoked) — must log in
		throw new Error('Session expired. Please log in again.');
	}

	// Retry the original request once with the new token
	response = await sendRequest(url, options, newToken);

	if (response.status === 403) {
		clearSession();
		throw new Error('Access denied. Session terminated.');
	}

	return handleResponse(response);
};

// ─────────────────────────────────────────
// API Methods
// ─────────────────────────────────────────

const api = {
	get: (url) => request(url, { method: 'GET' }),

	post: (url, data) =>
		request(url, {
			method: 'POST',
			body: JSON.stringify(data),
		}),

	put: (url, data) =>
		request(url, {
			method: 'PUT',
			body: JSON.stringify(data),
		}),

	patch: (url, data) =>
		request(url, {
			method: 'PATCH',
			body: data ? JSON.stringify(data) : undefined,
		}),

	delete: (url) => request(url, { method: 'DELETE' }),
};

export default api;
