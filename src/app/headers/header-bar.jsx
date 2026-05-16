import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom'; // 👈 add this
import { logoutUser } from '../../app-core/actions/auth-actions';
import ThemeToggler from '../../shared/components/ThemeToggler/ThemeToggler';
import './header-bar.scss';

const HeaderBar = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate(); // 👈 init navigate

	const loggedUserData = useSelector((state) => state?.commonState?.loggedUserData);
	const user = loggedUserData?.user;

	const displayName = [user?.firstName ?? user?.FirstName, user?.lastName ?? user?.LastName].filter(Boolean).join(' ');

	const role = loggedUserData?.role ?? 'user';

	const handleLogout = () => {
		dispatch(logoutUser());
	};

	// 👇 NEW: handle click
	const handleUserClick = () => {
		if (!role) return;

		navigate(`/${role}/details`);
	};

	return (
		<div className="header-bar">
			<div className="header-title">
				<span className="title">Auto Garage Workspace</span>
				<span className="subtitle">Service operations dashboard</span>
			</div>

			<div className="header-actions">
				<ThemeToggler />

				{/* 👇 make clickable */}
				<div className="header-user" onClick={handleUserClick} style={{ cursor: 'pointer' }}>
					<span className="header-avatar">{(displayName || role).slice(0, 1).toUpperCase()}</span>

					<div className="header-user-copy">
						<span>{displayName || user?.email || user?.Email || 'Signed in'}</span>
						<small>{role}</small>
					</div>
				</div>

				<button className="logout-button" onClick={handleLogout}>
					Logout
				</button>
			</div>
		</div>
	);
};

export default HeaderBar;
