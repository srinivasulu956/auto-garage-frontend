export const TOKEN_KEY = 'ag_access_token';

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

export const setStoredToken = (token) => {
	if (token) localStorage.setItem(TOKEN_KEY, token);
};

export const clearStoredToken = () => localStorage.removeItem(TOKEN_KEY);
