import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getStoredToken } from '../../app-core/services/api-client';

const Unauthorized = () => {
	const navigate = useNavigate();
	const role = useSelector((state) => state.commonState.loggedUserData?.role);

	useEffect(() => {
		const timer = setTimeout(() => {
			// A role mismatch is not the same as an invalid session. Keep the user
			// signed in and return them to the dashboard their role can access.
			if (getStoredToken() && role) {
				navigate(`/${role}/dashboard`, { replace: true });
				return;
			}

			navigate('/login', { replace: true });
		}, 2000);

		return () => clearTimeout(timer);
	}, [navigate, role]);

	return (
		<div className="state-page">
			<div className="state-panel">
				<h2>Access Denied</h2>
				<p>You do not have permission for that page. You will be redirected.</p>
			</div>
		</div>
	);
};

export default Unauthorized;
