import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { logoutUser } from '../../app-core/actions/auth-actions';
import { getStoredToken } from '../../app-core/services/api-client';

const ProtectedRoute = ({ children, allowedRoles }) => {
	const dispatch = useDispatch();
	const token = getStoredToken();
	const loggedUserData = useSelector((state) => state.commonState.loggedUserData);

	useEffect(() => {
		// Keep logout side effects out of render. This avoids duplicate logout
		// requests while still clearing any stale Redux state for anonymous users.
		if (!token) {
			dispatch(logoutUser());
		}
	}, [dispatch, token]);

	if (!token) {
		return <Navigate to="/login" replace />;
	}

	if (!loggedUserData) {
		return null;
	}

	if (!allowedRoles.includes(loggedUserData.role)) {
		return <Navigate to="/unauthorized" replace />;
	}

	return children;
};

export default ProtectedRoute;
