import { logoutUser } from '../actions/auth-actions';
import store from '../reducers/store';
import {
	clearStoredToken,
	defaultApiHeaders,
	getStoredToken,
	refreshAccessToken,
	setStoredToken,
} from './auth-request';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

let refreshPromise = null;

export { clearStoredToken, getStoredToken, setStoredToken };

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

const getRefreshedToken = async () => {
	if (!refreshPromise) {
		// Multiple API calls can fail with 401 at once. Share one refresh request,
		// then let every waiting request retry with the same new access token.
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
