import { useEffect, useState, useCallback } from 'react';
import { adminStaffService } from '../../../app-core/services/admin-user-service';
import { toastError, toastSuccess } from '../../../app-core/services/toast-service';
import SideDrawer from '../../../shared/components/side-drawer/side-drawer';
import { EMPTY_STAFF_FORM, getRoleMeta } from '../../../shared/data-modals/staff-role';
import { formatDateIN } from '../../../shared/utils/date-formatters';
import './admin-staff-page.scss';
import { useSelector } from 'react-redux';

// ─── Constants ────────────────────────────────────────────────────────────────

const fmtDate = formatDateIN;

// ─── Sub-components ───────────────────────────────────────────────────────────

function RoleBadge({ role }) {
	const m = getRoleMeta(role);
	return (
		<span className="sp-role-badge" style={{ background: m.bg, color: m.color }}>
			{m.label}
		</span>
	);
}

function SkeletonCard() {
	return (
		<div className="sp-card sp-card--skeleton">
			<div className="sk" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
			<div style={{ flex: 1 }}>
				<div className="sk" style={{ width: '55%', height: 14, marginBottom: 6 }} />
				<div className="sk" style={{ width: '70%', height: 11 }} />
			</div>
		</div>
	);
}

function ConfirmModal({ message, confirmLabel, confirmClass = 'sd-btn--danger', onConfirm, onCancel, submitting }) {
	return (
		<div className="sp-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
			<div className="sp-modal">
				<p className="sp-modal__message">{message}</p>
				<div className="sp-modal__actions">
					<button className="sd-btn sd-btn--ghost" onClick={onCancel} disabled={submitting}>
						Cancel
					</button>
					<button className={`sd-btn ${confirmClass}`} onClick={onConfirm} disabled={submitting}>
						{submitting ? 'Please wait…' : confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminStaffPage() {
	const [staff, setStaff] = useState([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [filter, setFilter] = useState('all'); // 'all' | 'Admin' | 'Mechanic'
	const [search, setSearch] = useState('');

	const [addOpen, setAddOpen] = useState(false);
	const [toggleTarget, setToggleTarget] = useState(null);
	const [form, setForm] = useState(EMPTY_STAFF_FORM);
	const [formErrors, setFormErrors] = useState({});

	const loggedInEmail = useSelector((state) => state.commonState.loggedUserData?.user?.email);

	const load = useCallback(async () => {
		try {
			setLoading(true);
			const data = await adminStaffService.getAll();
			setStaff(data || []);
		} catch {
			toastError('Failed to load staff');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	// ── Filtering ─────────────────────────────────────────────────────────────

	const filtered = staff.filter((s) => {
		const matchRole = filter === 'all' || s.role === filter;
		const q = search.toLowerCase();
		const matchSearch = !q || `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(q);
		return matchRole && matchSearch;
	});

	// ── Add staff ─────────────────────────────────────────────────────────────

	const set = (field, val) => {
		setForm((p) => ({ ...p, [field]: val }));
		if (formErrors[field]) setFormErrors((p) => ({ ...p, [field]: '' }));
	};

	const validate = () => {
		const e = {};
		if (!form.firstName.trim()) e.firstName = 'Required';
		if (!form.lastName.trim()) e.lastName = 'Required';
		if (!form.email.trim()) e.email = 'Required';
		else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
		if (!form.password || form.password.length < 8) e.password = 'Min 8 characters';
		return e;
	};

	const handleAdd = async (e) => {
		e.preventDefault();
		const errs = validate();
		if (Object.keys(errs).length) {
			setFormErrors(errs);
			return;
		}
		try {
			setSubmitting(true);
			await adminStaffService.registerStaff({
				firstName: form.firstName,
				lastName: form.lastName,
				email: form.email,
				password: form.password,
				roles: [form.role],
			});
			toastSuccess(`${form.role} account created`);
			setAddOpen(false);
			setForm(EMPTY_STAFF_FORM);
			await load();
		} catch (err) {
			toastError(err.message || 'Failed to create staff account');
		} finally {
			setSubmitting(false);
		}
	};

	// ── Toggle active ─────────────────────────────────────────────────────────

	const handleToggle = async () => {
		try {
			setSubmitting(true);
			const updated = await adminStaffService.toggleActive(toggleTarget.id);
			setStaff((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
			toastSuccess(`${updated.firstName} ${updated.isActive ? 'activated' : 'deactivated'}`);
			setToggleTarget(null);
		} catch (err) {
			toastError(err.message || 'Failed to update status');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="dashboard-page">
			{/* Hero */}
			<section className="page-hero compact">
				<div>
					<p className="page-kicker">Admin</p>
					<h1>Staff Management</h1>
					<p>
						{staff.length} staff member{staff.length !== 1 ? 's' : ''}
					</p>
				</div>
				<button
					className="sp-add-btn"
					onClick={() => {
						setForm(EMPTY_STAFF_FORM);
						setAddOpen(true);
					}}
				>
					+ Add Staff
				</button>
			</section>

			{/* Search + filter bar */}
			<div className="sp-toolbar">
				<input
					className="sp-search"
					placeholder="Search name or email…"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
				<div className="sp-filters">
					{['all', 'Admin', 'Mechanic'].map((f) => (
						<button
							key={f}
							className={`sp-filter-btn ${filter === f ? 'sp-filter-btn--active' : ''}`}
							onClick={() => setFilter(f)}
						>
							{f === 'all' ? 'All' : f}
							{!loading && (
								<span className="sp-filter-count">
									{f === 'all' ? staff.length : staff.filter((s) => s.role === f).length}
								</span>
							)}
						</button>
					))}
				</div>
			</div>

			{/* Grid */}
			<div className="sp-grid">
				{loading ? (
					Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
				) : filtered.length === 0 ? (
					<div className="empty-panel" style={{ gridColumn: '1 / -1' }}>
						<div className="empty-panel-icon">👤</div>
						<h2>No staff found</h2>
						<p>{search ? 'Try a different search.' : 'Add your first staff member.'}</p>
					</div>
				) : (
					filtered.map((s) => (
						<div key={s.id} className={`sp-card ${!s.isActive ? 'sp-card--inactive' : ''}`}>
							<div className="sp-card__avatar">{(s.firstName?.[0] || '?').toUpperCase()}</div>

							<div className="sp-card__info">
								<h3 className="sp-card__name">
									{s.firstName} {s.lastName}
								</h3>
								<p className="sp-card__email">{s.email}</p>
								{s.role === 'Mechanic' && s.activeJobCount > 0 && (
									<p className="sp-card__jobs">
										🔧 {s.activeJobCount} active job{s.activeJobCount > 1 ? 's' : ''}
									</p>
								)}
							</div>

							<div className="sp-card__meta">
								<RoleBadge role={s.role} />
								<span className={`sp-status ${s.isActive ? 'sp-status--active' : 'sp-status--inactive'}`}>
									{s.isActive ? 'Active' : 'Inactive'}
								</span>
							</div>

							<div className="sp-card__footer">
								<span className="sp-card__date">Since {fmtDate(s.createdAt)}</span>

								{s.email === loggedInEmail ? (
									<button className="sd-btn sd-btn--self" disabled title="You cannot deactivate your own account">
										Current User
									</button>
								) : (
									<button
										className={`sd-btn ${s.isActive ? 'sd-btn--danger' : 'sp-btn--activate'}`}
										onClick={() => setToggleTarget(s)}
									>
										{s.isActive ? 'Deactivate' : 'Activate'}
									</button>
								)}
							</div>
						</div>
					))
				)}
			</div>

			{/* ── Add Staff drawer ── */}
			<SideDrawer isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Staff Member" disabled={submitting}>
				<form className="sd-form" onSubmit={handleAdd} noValidate>
					<div className="sd-row">
						<div className="sd-field">
							<label className="sd-label">
								First Name <span>*</span>
							</label>
							<input
								className={`sd-input ${formErrors.firstName ? 'sd-input--error' : ''}`}
								value={form.firstName}
								onChange={(e) => set('firstName', e.target.value)}
							/>
							{formErrors.firstName && <span className="sd-error">{formErrors.firstName}</span>}
						</div>
						<div className="sd-field">
							<label className="sd-label">
								Last Name <span>*</span>
							</label>
							<input
								className={`sd-input ${formErrors.lastName ? 'sd-input--error' : ''}`}
								value={form.lastName}
								onChange={(e) => set('lastName', e.target.value)}
							/>
							{formErrors.lastName && <span className="sd-error">{formErrors.lastName}</span>}
						</div>
					</div>

					<div className="sd-field">
						<label className="sd-label">
							Email <span>*</span>
						</label>
						<input
							type="email"
							className={`sd-input ${formErrors.email ? 'sd-input--error' : ''}`}
							value={form.email}
							onChange={(e) => set('email', e.target.value)}
						/>
						{formErrors.email && <span className="sd-error">{formErrors.email}</span>}
					</div>

					<div className="sd-field">
						<label className="sd-label">
							Password <span>*</span>
						</label>
						<input
							type="password"
							className={`sd-input ${formErrors.password ? 'sd-input--error' : ''}`}
							placeholder="Min 8 characters"
							value={form.password}
							onChange={(e) => set('password', e.target.value)}
						/>
						{formErrors.password && <span className="sd-error">{formErrors.password}</span>}
					</div>

					<div className="sd-field">
						<label className="sd-label">
							Role <span>*</span>
						</label>
						<select className="sd-input" value={form.role} onChange={(e) => set('role', e.target.value)}>
							<option value="Mechanic">Mechanic</option>
							<option value="Admin">Admin</option>
						</select>
					</div>

					<div className="sd-footer">
						<button type="button" className="sd-btn sd-btn--ghost" onClick={() => setAddOpen(false)} disabled={submitting}>
							Cancel
						</button>
						<button type="submit" className="sd-btn sd-btn--primary" disabled={submitting}>
							{submitting ? 'Creating…' : 'Create Account'}
						</button>
					</div>
				</form>
			</SideDrawer>

			{/* ── Toggle active confirm ── */}
			{toggleTarget && (
				<ConfirmModal
					message={
						toggleTarget.isActive
							? `Deactivate ${toggleTarget.firstName} ${toggleTarget.lastName}? They will lose access.`
							: `Reactivate ${toggleTarget.firstName} ${toggleTarget.lastName}?`
					}
					confirmLabel={toggleTarget.isActive ? 'Deactivate' : 'Activate'}
					confirmClass={toggleTarget.isActive ? 'sd-btn--danger' : 'sp-btn--activate'}
					onConfirm={handleToggle}
					onCancel={() => !submitting && setToggleTarget(null)}
					submitting={submitting}
				/>
			)}
		</div>
	);
}
