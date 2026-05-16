import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { logoutUser } from '../../../app-core/actions/auth-actions';

const ProtectedRoute = ({ children, allowedRoles }) => {
	const dispatch = useDispatch();
	const token = localStorage.getItem('ag_access_token');
	const loggedUserData = useSelector((state) => state.commonState.loggedUserData);

	useEffect(() => {
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
