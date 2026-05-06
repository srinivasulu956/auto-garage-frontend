import { setAuthInitialized } from '../reducers/common-slice';

export const RESET_STORE = 'RESET_STORE';
const BASE_URL = import.meta.env.VITE_AUTH_BASE_URL;

const TOKEN_KEY = 'ag_access_token'; // must match api-client.js

export const logoutUser = () => async (dispatch) => {
	const token = localStorage.getItem(TOKEN_KEY);

	// Tell the backend to blacklist this token + revoke the refresh cookie
	if (token) {
		try {
			await fetch(`${BASE_URL}/logout`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
				},
				credentials: 'include', // sends the refresh cookie so backend can revoke it
			});
		} catch {
			// Even if the request fails, still clear locally
			console.warn('Logout request failed, clearing session locally.');
		}
	}

	localStorage.removeItem(TOKEN_KEY);
	dispatch({ type: RESET_STORE });
	dispatch(setAuthInitialized());
};
