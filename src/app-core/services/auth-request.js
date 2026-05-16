export const AUTH_TOKEN_KEY = 'ag_access_token';

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
