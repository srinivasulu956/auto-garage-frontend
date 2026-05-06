import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../app-core/actions/auth-actions';
import { setAuthInitialized, setLoggedUserData, setThemeData } from '../../app-core/reducers/common-slice';
import { getStoredToken, setStoredToken } from '../../app-core/services/api-client';
import LoadingPage from '../../app-core/shared/loading-page/loading-page';

const BASE_URL = import.meta.env.VITE_AUTH_BASE_URL;

// ── Fetch current user data with a given token ────────────────────────────────

const fetchCurrentUser = async (token) => {
	const response = await fetch(`${BASE_URL}/currentUserData`, {
		method: 'GET',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
	});

	if (!response.ok) return null;
	return response.json();
};

// ── Attempt silent refresh using the HttpOnly cookie ─────────────────────────

const tryRefresh = async () => {
	try {
		const response = await fetch(`${BASE_URL}/refresh`, {
			method: 'POST',
			credentials: 'include', // sends the refresh cookie automatically
		});

		if (!response.ok) return null;

		const data = await response.json();
		const token = data.accessToken ?? data.AccessToken;
		if (!token) return null;

		setStoredToken(token);
		return token;
	} catch {
		return null;
	}
};

// ─────────────────────────────────────────────────────────────────────────────

const AuthInitializer = ({ children }) => {
	const dispatch = useDispatch();
	const authInitialized = useSelector((state) => state.commonState.authInitialized);

	useEffect(() => {
		const restoreAuth = async () => {
			let token = getStoredToken();

			// ── Case 1: No token in localStorage ─────────────────────────────
			// The user may have closed the tab — the access token is gone but
			// the refresh cookie may still be valid (7 day window).
			// Attempt a silent refresh BEFORE deciding to log out.
			if (!token) {
				token = await tryRefresh();

				if (!token) {
					// Refresh also failed — no valid session at all
					dispatch(setAuthInitialized());
					return;
				}
			}

			// ── Case 2: Token exists (or was just refreshed) ──────────────────
			// Call /currentUserData to validate the token and get user info.
			let user = await fetchCurrentUser(token);

			// ── Case 3: currentUserData returned 401 (token expired) ──────────
			// Access token expired mid-session. Try a silent refresh once.
			if (!user) {
				token = await tryRefresh();

				if (token) {
					user = await fetchCurrentUser(token);
				}
			}

			// ── Case 4: Both token and refresh are dead ───────────────────────
			// Genuine session expiry — user must log in again.
			if (!user) {
				dispatch(logoutUser());
				return;
			}

			// ── Success: restore session ──────────────────────────────────────
			const roles = user.roles ?? user.Roles ?? [];
			const role = roles[0]?.toLowerCase() ?? '';

			dispatch(setLoggedUserData({ role, user }));
			dispatch(setThemeData(user.theme ?? user.Theme));
			dispatch(setAuthInitialized());
		};

		restoreAuth();
	}, []);

	if (!authInitialized) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
				<LoadingPage />
			</div>
		);
	}

	return children;
};

export default AuthInitializer;
