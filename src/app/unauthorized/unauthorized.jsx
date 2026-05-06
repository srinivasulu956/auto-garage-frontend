import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../app-core/actions/auth-actions';

const Unauthorized = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();

	useEffect(() => {
		const timer = setTimeout(() => {
			dispatch(logoutUser());
			navigate('/login', { replace: true });
		}, 2000);

		return () => clearTimeout(timer);
	}, [navigate, dispatch]);

	return (
		<div className="state-page">
			<div className="state-panel">
				<h2>Access Denied</h2>
				<p>You do not have permission for that page. You will be redirected to login.</p>
			</div>
		</div>
	);
};

export default Unauthorized;
