import { setAuthInitialized } from '../reducers/common-slice';
import { AUTH_TOKEN_KEY, withAuthRequestDefaults } from '../services/auth-request';

export const RESET_STORE = 'RESET_STORE';
const BASE_URL = import.meta.env.VITE_AUTH_BASE_URL;

export const logoutUser = () => async (dispatch) => {
	const token = localStorage.getItem(AUTH_TOKEN_KEY);

	// Tell the backend to blacklist this token + revoke the refresh cookie
	if (token) {
		try {
			await fetch(`${BASE_URL}/logout`, withAuthRequestDefaults({
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}));
		} catch {
			// Even if the request fails, still clear locally
			console.warn('Logout request failed, clearing session locally.');
		}
	}

	localStorage.removeItem(AUTH_TOKEN_KEY);
	dispatch({ type: RESET_STORE });
	dispatch(setAuthInitialized());
};
