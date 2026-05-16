import { logoutUser } from '../actions/auth-actions';
import store from '../reducers/store';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const defaultHeaders = {
	'Content-Type': 'application/json',
	'ngrok-skip-browser-warning': 'true',
};

let refreshPromise = null;

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
// Helpers
// ─────────────────────────────────────────

const parseErrorMessage = async (response) => {
	const contentType = response.headers.get('content-type') ?? '';

	if (!contentType.includes('application/json')) {
		const text = await response.text().catch(() => '');
		return text || `Request failed with status ${response.status}`;
	}

	const error = await response.json().catch(() => ({}));

	if (Array.isArray(error)) return error.join('\n');
	if (error?.errors) return Object.values(error.errors).flat().join('\n');

	return error.error || error.message || error.title || `Request failed with status ${response.status}`;
};

const handleResponse = async (response) => {
	if (response.status === 204) return null;
	if (!response.ok) throw new Error(await parseErrorMessage(response));
	return response.json();
};

// ─────────────────────────────────────────
// Refresh Logic
// ─────────────────────────────────────────

const refreshAccessToken = async () => {
	try {
		const response = await fetch(`${BASE_URL}/Auth/refresh`, {
			method: 'POST',
			credentials: 'include',
			headers: { ...defaultHeaders }, // ✅ fixed: ngrok header included
		});

		if (!response.ok) {
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

// De-duplicate parallel 401s — only one refresh call goes to backend
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

	if (response.status === 403) {
		clearSession();
		throw new Error('Access denied. Session terminated.');
	}

	if (response.status !== 401) {
		return handleResponse(response);
	}

	if (retried) {
		clearSession();
		throw new Error('Session expired. Please log in again.');
	}

	const newToken = await getRefreshedToken();

	if (!newToken) {
		throw new Error('Session expired. Please log in again.');
	}

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
	post: (url, data) => request(url, { method: 'POST', body: JSON.stringify(data) }),
	put: (url, data) => request(url, { method: 'PUT', body: JSON.stringify(data) }),
	patch: (url, data) => request(url, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
	delete: (url) => request(url, { method: 'DELETE' }),
};

export default api;
