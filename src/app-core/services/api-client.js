import { logoutUser } from '../actions/auth-actions';
import store from '../reducers/store';
import { handleResponse } from './api-response';
import { clearStoredToken, getStoredToken, setStoredToken } from './api-token-storage';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const defaultHeaders = {
	'Content-Type': 'application/json',
};

let refreshPromise = null;

export { clearStoredToken, getStoredToken, setStoredToken };

const clearSession = () => {
	clearStoredToken();
	store.dispatch(logoutUser());
};

const refreshAccessToken = async () => {
	try {
		const response = await fetch(`${BASE_URL}/Auth/refresh`, {
			method: 'POST',
			credentials: 'include',
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
			...defaultHeaders,
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
