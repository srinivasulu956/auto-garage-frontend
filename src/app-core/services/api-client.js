import { logoutUser } from '../actions/auth-actions';
import store from '../reducers/store';
import {
	clearStoredToken,
	defaultApiHeaders,
	getStoredToken,
	refreshAccessToken,
	setStoredToken,
} from './auth-request';

// Two backends, two base URLs. Auth is its own service now, so a call's path is no longer
// enough to say where it goes — the caller has to pick the client.
//
// In development both resolve through the Vite proxy and either one would appear to work.
// In production they are different hosts, and sending an auth call to the garage API is a
// 404 that only shows up after deployment. Hence two exported clients rather than one.
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AUTH_URL = import.meta.env.VITE_AUTH_BASE_URL;

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

const sendRequest = (base, url, options, token) =>
	fetch(`${base}${url}`, {
		credentials: 'include',
		...options,
		headers: {
			...defaultApiHeaders,
			...(token && { Authorization: `Bearer ${token}` }),
			...options.headers,
		},
	});

const request = async (base, url, options = {}, retried = false) => {
	const token = getStoredToken();

	if (!token) {
		throw new Error('Session expired. Please log in again.');
	}

	let response = await sendRequest(base, url, options, token);

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

	response = await sendRequest(base, url, options, newToken);

	if (response.status === 403) {
		clearSession();
		throw new Error('Access denied. Session terminated.');
	}

	return handleResponse(response);
};

const clientFor = (base) => ({
	get: (url) => request(base, url, { method: 'GET' }),
	post: (url, data) => request(base, url, { method: 'POST', body: JSON.stringify(data) }),
	put: (url, data) => request(base, url, { method: 'PUT', body: JSON.stringify(data) }),
	patch: (url, data) => request(base, url, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
	delete: (url) => request(base, url, { method: 'DELETE' }),
});

/** The garage API — bookings, vehicles, invoices, staff admin, the AI assistant. */
const api = clientFor(BASE_URL);

/**
 * The auth service — profile, current user, staff registration. Paths are relative to
 * the auth base, which already ends in /Auth, so pass '/currentUserData' not
 * '/Auth/currentUserData'.
 *
 * Both clients share the same token handling and the same single-flight refresh, so a
 * 401 on either one is recovered the same way.
 */
const authApi = clientFor(AUTH_URL);

export { authApi };
export default api;
