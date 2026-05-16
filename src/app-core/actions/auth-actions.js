import { setAuthInitialized } from '../reducers/common-slice';
import { clearStoredToken, getStoredToken, withAuthRequestDefaults } from '../services/auth-request';

export const RESET_STORE = 'RESET_STORE';
const BASE_URL = import.meta.env.VITE_AUTH_BASE_URL;

export const logoutUser = () => async (dispatch) => {
	const token = getStoredToken();

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

	clearStoredToken();
	dispatch({ type: RESET_STORE });
	dispatch(setAuthInitialized());
};
