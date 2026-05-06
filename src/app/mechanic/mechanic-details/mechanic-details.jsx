import { useState } from 'react';
import './mechanic-details.scss';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile } from '../../../app-core/services/user-services';
import { setLoggedUserData, setThemeData } from '../../../app-core/reducers/common-slice';
import { toastError, toastSuccess } from '../../../app-core/services/toast-service';
import SideDrawer from '../../../app-core/shared/side-drawer/side-drawer';

const MechanicDetailsPage = () => {
	const userData = useSelector((state) => state.commonState.loggedUserData);
	const dispatch = useDispatch();

	const [isOpen, setIsOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		themeName: '',
	});

	const openPanel = () => {
		setFormData({
			firstName: userData?.user?.firstName || '',
			lastName: userData?.user?.lastName || '',
			themeName: userData?.user?.theme || '',
		});
		setIsOpen(true);
	};

	const closePanel = () => {
		if (submitting) return;
		setIsOpen(false);
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			setSubmitting(true);
			const response = await updateUserProfile(formData);

			const user = response.user;
			const roles = user.roles ?? user.Roles ?? [];
			const role = roles[0]?.toLowerCase() ?? '';

			dispatch(setLoggedUserData({ role, user }));
			dispatch(setThemeData(user.theme));

			toastSuccess('Profile updated successfully');
			setIsOpen(false);
		} catch (error) {
			toastError(error?.message || 'Failed to update user');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="user-page">
			{/* ── View Card ── */}
			<div className="user-card">
				<div className="user-card__header">
					<h4>User Profile</h4>
					<button className="ud-btn ud-btn--primary" onClick={openPanel}>
						Edit Profile
					</button>
				</div>

				<div className="user-grid">
					<div className="user-field">
						<label>First Name</label>
						<div className="read-only">{userData?.user?.firstName}</div>
					</div>

					<div className="user-field">
						<label>Last Name</label>
						<div className="read-only">{userData?.user?.lastName}</div>
					</div>

					<div className="user-field">
						<label>Email</label>
						<div className="read-only">{userData?.user?.email}</div>
					</div>

					<div className="user-field">
						<label>Role</label>
						<div className="read-only">{userData?.role}</div>
					</div>

					<div className="user-field">
						<label>Theme</label>
						<div className="read-only">{userData?.user?.theme}</div>
					</div>
				</div>
			</div>

			{/* ── Side Drawer (Edit Profile) ── */}
			<SideDrawer isOpen={isOpen} onClose={closePanel} title="Edit Profile" disabled={submitting}>
				<form onSubmit={handleSubmit} className="sd-form">
					<div className="sd-field">
						<label className="sd-label">First Name</label>
						<input className="sd-input" name="firstName" value={formData.firstName} onChange={handleChange} />
					</div>

					<div className="sd-field">
						<label className="sd-label">Last Name</label>
						<input className="sd-input" name="lastName" value={formData.lastName} onChange={handleChange} />
					</div>

					<div className="sd-field">
						<label className="sd-label">Theme</label>
						<select className="sd-input" name="themeName" value={formData.themeName} onChange={handleChange}>
							<option value="light">Light</option>
							<option value="dark">Dark</option>
						</select>
					</div>

					<div className="sd-footer">
						<button type="button" className="sd-btn sd-btn--ghost" onClick={closePanel} disabled={submitting}>
							Cancel
						</button>
						<button type="submit" className="sd-btn sd-btn--primary" disabled={submitting}>
							{submitting ? 'Saving...' : 'Update'}
						</button>
					</div>
				</form>
			</SideDrawer>
		</div>
	);
};

export default MechanicDetailsPage;
