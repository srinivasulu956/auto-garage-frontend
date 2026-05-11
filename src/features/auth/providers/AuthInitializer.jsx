import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../../app-core/actions/auth-actions';
import { setAuthInitialized, setLoggedUserData, setThemeData } from '../../../app-core/reducers/common-slice';
import { getStoredToken, setStoredToken } from '../../../app-core/services/api-client';
import LoadingPage from '../../../app-core/shared/loading-page/loading-page';
import { fetchCurrentUserRequest, refreshTokenRequest } from '../services/authService';
import { getAccessToken } from '../utils/authResponse';
import '../styles/AuthInitializer.scss';

const fetchCurrentUser = async (token) => {
	const response = await fetchCurrentUserRequest(token);

	if (!response.ok) return null;
	return response.json();
};

const tryRefresh = async () => {
	try {
		const response = await refreshTokenRequest();

		if (!response.ok) return null;

		const data = await response.json();
		const token = getAccessToken(data);
		if (!token) return null;

		setStoredToken(token);
		return token;
	} catch {
		return null;
	}
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

			if (!user) {
				token = await tryRefresh();

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
	}, []);

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
