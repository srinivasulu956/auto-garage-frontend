import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../app-core/actions/auth-actions';
import { setAuthInitialized, setLoggedUserData, setThemeData } from '../../app-core/reducers/common-slice';
import { getStoredToken } from '../../app-core/services/api-client';
import { refreshAccessToken, withAuthRequestDefaults } from '../../app-core/services/auth-request';
import LoadingPage from '../../shared/components/loading-page/loading-page';

const BASE_URL = import.meta.env.VITE_AUTH_BASE_URL;

const fetchCurrentUser = async (token) => {
	const response = await fetch(
		`${BASE_URL}/currentUserData`,
		withAuthRequestDefaults({
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})
	);

	if (!response.ok) return null;
	return response.json();
};

const AuthInitializer = ({ children }) => {
	const dispatch = useDispatch();
	const authInitialized = useSelector((state) => state.commonState.authInitialized);

	useEffect(() => {
		const restoreAuth = async () => {
			let token = getStoredToken();

			if (!token) {
				dispatch(setAuthInitialized());
				return;
			}

			let user = await fetchCurrentUser(token);

			// If the stored access token expired, refresh once and validate again.
			if (!user) {
				token = await refreshAccessToken();

				if (token) {
					user = await fetchCurrentUser(token);
				}
			}

			if (!user) {
				dispatch(logoutUser());
				return;
			}

			const roles = user.roles ?? user.Roles ?? [];
			const role = roles[0]?.toLowerCase() ?? '';

			dispatch(setLoggedUserData({ role, user }));
			dispatch(setThemeData(user.theme ?? user.Theme));
			dispatch(setAuthInitialized());
		};

		restoreAuth();
	}, [dispatch]);

	if (!authInitialized) {
		return (
			<div className="auth-initializer-loading">
				<LoadingPage />
			</div>
		);
	}

	return children;
};

export default AuthInitializer;
