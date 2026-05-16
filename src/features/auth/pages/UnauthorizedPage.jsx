import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../../app-core/actions/auth-actions';
import AuthStatePanel from '../components/AuthStatePanel';

const UnauthorizedPage = () => {
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
		<AuthStatePanel>
			<h2>Access Denied</h2>
			<p>You do not have permission for that page. You will be redirected to login.</p>
		</AuthStatePanel>
	);
};

export default UnauthorizedPage;
