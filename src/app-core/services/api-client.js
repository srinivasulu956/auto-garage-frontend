import { logoutUser } from '../actions/auth-actions';
import store from '../reducers/store';
import { AUTH_TOKEN_KEY, defaultApiHeaders, withAuthRequestDefaults } from './auth-request';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

let refreshPromise = null;

export const getStoredToken = () => localStorage.getItem(AUTH_TOKEN_KEY);
export const setStoredToken = (token) => {
	if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
};
export const clearStoredToken = () => localStorage.removeItem(AUTH_TOKEN_KEY);

const clearSession = () => {
	clearStoredToken();
	store.dispatch(logoutUser());
};

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

const refreshAccessToken = async () => {
	try {
		const response = await fetch(`${BASE_URL}/Auth/refresh`, withAuthRequestDefaults({ method: 'POST' }));

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

const getRefreshedToken = async () => {
	if (!refreshPromise) {
		refreshPromise = refreshAccessToken().finally(() => {
			refreshPromise = null;
		});
	}
	return refreshPromise;
};

const sendRequest = (url, options, token) =>
	fetch(`${BASE_URL}${url}`, {
		credentials: 'include',
		...options,
		headers: {
			...defaultApiHeaders,
			...(token && { Authorization: `Bearer ${token}` }),
			...options.headers,
		},
	});

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

const api = {
	get: (url) => request(url, { method: 'GET' }),
	post: (url, data) => request(url, { method: 'POST', body: JSON.stringify(data) }),
	put: (url, data) => request(url, { method: 'PUT', body: JSON.stringify(data) }),
	patch: (url, data) => request(url, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
	delete: (url) => request(url, { method: 'DELETE' }),
};

export default api;
