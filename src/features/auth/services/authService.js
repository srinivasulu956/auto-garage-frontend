const BASE_URL = import.meta.env.VITE_AUTH_BASE_URL;

export const loginRequest = ({ email, password, role }) =>
	fetch(`${BASE_URL}/login`, {
		method: 'POST',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			email,
			password,
			role,
		}),
	});

export const registerCustomerRequest = ({ firstName, lastName, email, password }) =>
	fetch(`${BASE_URL}/register`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			firstName,
			lastName,
			email,
			password,
			roles: ['Customer'],
		}),
	});

export const fetchCurrentUserRequest = (token) =>
	fetch(`${BASE_URL}/currentUserData`, {
		method: 'GET',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
	});

export const refreshTokenRequest = () =>
	fetch(`${BASE_URL}/refresh`, {
		method: 'POST',
		credentials: 'include',
	});
