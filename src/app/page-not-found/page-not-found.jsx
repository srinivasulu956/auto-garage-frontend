import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../app-core/actions/auth-actions';
import { getStoredToken } from '../../app-core/services/api-client';

const PageNotFound = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const token = getStoredToken();

	useEffect(() => {
		if (!getStoredToken()) {
			navigate('/login', { replace: true });
		}
	}, [navigate]);

	const onClickLogout = () => {
		dispatch(logoutUser());
		navigate('/login', { replace: true });
	};

	const handleGoBack = () => {
		if (window.history.length > 1) {
			navigate(-1);
			return;
		}

		navigate('/login', { replace: true });
	};

	return (
		<div className="state-page">
			<div className="state-panel">
				<h1>404</h1>
				<h2>Page Not Found</h2>
				<p>The page you are looking for does not exist.</p>

				<div className="state-actions">
					<button onClick={handleGoBack}>Go Back</button>
					{token && <button onClick={onClickLogout}>Logout</button>}
				</div>
			</div>
		</div>
	);
};

export default PageNotFound;
