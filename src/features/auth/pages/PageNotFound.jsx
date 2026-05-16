import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../../app-core/actions/auth-actions';
import AuthStatePanel from '../components/AuthStatePanel';

const PageNotFoundPage = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const token = localStorage.getItem('ag_access_token');

	useEffect(() => {
		if (!localStorage.getItem('ag_access_token')) {
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
		<AuthStatePanel>
			<h1>404</h1>
			<h2>Page Not Found</h2>
			<p>The page you are looking for does not exist.</p>

			<div className="state-actions">
				<button onClick={handleGoBack}>Go Back</button>
				{token && <button onClick={onClickLogout}>Logout</button>}
			</div>
		</AuthStatePanel>
	);
};

export default PageNotFoundPage;
