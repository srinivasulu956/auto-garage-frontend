import { useCallback, useEffect, useState } from 'react';
import { toastError, toastSuccess } from '../../../app-core/services/toast-service';
import vehicleService from '../../../app-core/services/vehicle-service';
import SideDrawer from '../../../app-core/shared/side-drawer/side-drawer';
import './vehicles-page.scss';

// ─── Constants ────────────────────────────────────────────────────────────────

const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'];

const FUEL_META = {
	Petrol: { color: '#f59e0b' },
	Diesel: { color: '#6b7280' },
	Electric: { color: '#10b981' },
	Hybrid: { color: '#3b82f6' },
	CNG: { color: '#8b5cf6' },
};

const EMPTY_FORM = {
	make: '',
	model: '',
	year: '',
	licensePlate: '',
	vin: '',
	fuelType: 'Petrol',
	nickname: '',
	notes: '',
};

const CURRENT_YEAR = new Date().getFullYear();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

// ─── Vehicle Form ─────────────────────────────────────────────────────────────

function VehicleForm({ initial, onSubmit, onCancel, submitting }) {
	const isEdit = !!initial?.id;
	// hasBookingHistory comes from the backend via VehicleResponseDto
	const hasHistory = isEdit && !!initial?.hasBookingHistory;

	const [form, setForm] = useState(
		initial
			? {
					make: initial.make ?? '',
					model: initial.model ?? '',
					year: initial.year ?? '',
					licensePlate: initial.licensePlate ?? '',
					vin: initial.vin ?? '',
					fuelType: initial.fuelType ?? 'Petrol',
					nickname: initial.nickname ?? '',
					notes: initial.notes ?? '',
				}
			: EMPTY_FORM
	);
	const [errors, setErrors] = useState({});

	const set = (field, value) => {
		setForm((p) => ({ ...p, [field]: value }));
		if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
	};

	const validate = () => {
		const e = {};
		if (!hasHistory) {
			if (!form.make.trim()) e.make = 'Make is required';
			if (!form.model.trim()) e.model = 'Model is required';
			if (!form.year) e.year = 'Year is required';
			else if (form.year < 1980 || form.year > CURRENT_YEAR + 1) e.year = `Between 1980–${CURRENT_YEAR + 1}`;
			if (!form.licensePlate.trim()) e.licensePlate = 'License plate is required';
		}
		if (form.nickname && form.nickname.length > 50) e.nickname = 'Max 50 characters';
		if (form.notes && form.notes.length > 250) e.notes = 'Max 250 characters';
		return e;
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		const errs = validate();
		if (Object.keys(errs).length) {
			setErrors(errs);
			return;
		}

		if (hasHistory) {
			onSubmit({ nickname: form.nickname || null, notes: form.notes || null });
		} else {
			onSubmit({
				make: form.make,
				model: form.model,
				year: parseInt(form.year),
				licensePlate: form.licensePlate.toUpperCase(),
				vin: form.vin || null,
				fuelType: form.fuelType,
				nickname: form.nickname || null,
				notes: form.notes || null,
			});
		}
	};

	return (
		<form onSubmit={handleSubmit} className="sd-form" noValidate>
			{hasHistory && (
				<div className="sd-banner sd-banner--warning">
					<span className="sd-banner__icon">🔒</span>
					<div>
						<strong>Core details are locked</strong>
						<p>
							This vehicle has booking history. Make, Model, Year, Plate, VIN and Fuel Type cannot be changed — only nickname
							and notes.
						</p>
					</div>
				</div>
			)}

			<div className="sd-section-label">Vehicle Details</div>

			<div className="sd-row">
				<div className="sd-field">
					<label className="sd-label">Make {!hasHistory && <span className="sd-req">*</span>}</label>
					<input
						className={`sd-input ${errors.make ? 'sd-input--error' : ''} ${hasHistory ? 'sd-input--locked' : ''}`}
						value={form.make}
						placeholder="e.g. Toyota"
						disabled={hasHistory}
						onChange={(e) => set('make', e.target.value)}
					/>
					{errors.make && <span className="sd-error">{errors.make}</span>}
				</div>
				<div className="sd-field">
					<label className="sd-label">Model {!hasHistory && <span className="sd-req">*</span>}</label>
					<input
						className={`sd-input ${errors.model ? 'sd-input--error' : ''} ${hasHistory ? 'sd-input--locked' : ''}`}
						value={form.model}
						placeholder="e.g. Corolla"
						disabled={hasHistory}
						onChange={(e) => set('model', e.target.value)}
					/>
					{errors.model && <span className="sd-error">{errors.model}</span>}
				</div>
			</div>

			<div className="sd-row">
				<div className="sd-field">
					<label className="sd-label">Year {!hasHistory && <span className="sd-req">*</span>}</label>
					<input
						className={`sd-input ${errors.year ? 'sd-input--error' : ''} ${hasHistory ? 'sd-input--locked' : ''}`}
						type="number"
						value={form.year}
						placeholder="e.g. 2022"
						disabled={hasHistory}
						onChange={(e) => set('year', e.target.value)}
					/>
					{errors.year && <span className="sd-error">{errors.year}</span>}
				</div>
				<div className="sd-field">
					<label className="sd-label">Fuel Type {!hasHistory && <span className="sd-req">*</span>}</label>
					<select
						className={`sd-input ${hasHistory ? 'sd-input--locked' : ''}`}
						value={form.fuelType}
						disabled={hasHistory}
						onChange={(e) => set('fuelType', e.target.value)}
					>
						{FUEL_TYPES.map((f) => (
							<option key={f}>{f}</option>
						))}
					</select>
				</div>
			</div>

			<div className="sd-field">
				<label className="sd-label">License Plate {!hasHistory && <span className="sd-req">*</span>}</label>
				<input
					className={`sd-input ${errors.licensePlate ? 'sd-input--error' : ''} ${hasHistory ? 'sd-input--locked' : ''}`}
					value={form.licensePlate?.toUpperCase?.() ?? form.licensePlate}
					placeholder="e.g. KA01AB1234"
					disabled={hasHistory}
					onChange={(e) => set('licensePlate', e.target.value)}
				/>
				{errors.licensePlate && <span className="sd-error">{errors.licensePlate}</span>}
			</div>

			<div className="sd-field">
				<label className="sd-label">
					VIN <span className="sd-optional">(optional)</span>
				</label>
				<input
					className={`sd-input ${hasHistory ? 'sd-input--locked' : ''}`}
					value={form.vin}
					placeholder="17-character Vehicle Identification Number"
					disabled={hasHistory}
					onChange={(e) => set('vin', e.target.value)}
				/>
			</div>

			<div className="sd-divider">
				<span>Personal Details</span>
			</div>

			<div className="sd-field">
				<label className="sd-label">
					Nickname <span className="sd-optional">(optional)</span>
				</label>
				<input
					className={`sd-input ${errors.nickname ? 'sd-input--error' : ''}`}
					value={form.nickname}
					placeholder='e.g. "My Daily Driver"'
					maxLength={50}
					onChange={(e) => set('nickname', e.target.value)}
				/>
				<div className="sd-hint">{form.nickname.length}/50</div>
				{errors.nickname && <span className="sd-error">{errors.nickname}</span>}
			</div>

			<div className="sd-field">
				<label className="sd-label">
					Notes <span className="sd-optional">(optional)</span>
				</label>
				<textarea
					className={`sd-input sd-textarea ${errors.notes ? 'sd-input--error' : ''}`}
					value={form.notes}
					placeholder="e.g. Needs oil change every 5,000 km"
					maxLength={250}
					rows={3}
					onChange={(e) => set('notes', e.target.value)}
				/>
				<div className="sd-hint">{form.notes.length}/250</div>
				{errors.notes && <span className="sd-error">{errors.notes}</span>}
			</div>

			<div className="sd-footer">
				<button type="button" className="sd-btn sd-btn--ghost" onClick={onCancel} disabled={submitting}>
					Cancel
				</button>
				<button type="submit" className="sd-btn sd-btn--primary" disabled={submitting}>
					{submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Vehicle'}
				</button>
			</div>
		</form>
	);
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

function ConfirmModal({ icon, title, body, confirmLabel, confirmClass, onConfirm, onCancel, submitting }) {
	return (
		<div className="vd-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
			<div className="vd-modal">
				<div className="vd-modal__icon">{icon}</div>
				<h3 className="vd-modal__title">{title}</h3>
				<div className="vd-modal__body">{body}</div>
				<div className="vd-modal__actions">
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

// ─── Vehicle Card ─────────────────────────────────────────────────────────────

function VehicleCard({ vehicle, onEdit, onDelete, onReactivate, inactive = false }) {
	const fuel = FUEL_META[vehicle.fuelType] ?? FUEL_META.Petrol;

	return (
		<div className={`vc ${inactive ? 'vc--inactive' : ''}`}>
			<div className="vc__top">
				<div className="vc__icon-wrap">
					<span className="vc__icon">{inactive ? '🚘' : '🚗'}</span>
					{vehicle.hasBookingHistory && !inactive && (
						<span className="vc__lock-pip" title="Core details locked — has booking history" />
					)}
				</div>
				<div className="vc__actions">
					{inactive ? (
						<button className="vc__btn vc__btn--reactivate" onClick={() => onReactivate(vehicle)}>
							♻️ Reactivate
						</button>
					) : (
						<>
							<button className="vc__btn vc__btn--edit" onClick={() => onEdit(vehicle)} title="Edit">
								✏️
							</button>
							<button className="vc__btn vc__btn--delete" onClick={() => onDelete(vehicle)} title="Remove">
								🗑️
							</button>
						</>
					)}
				</div>
			</div>

			<div className="vc__body">
				<h3 className="vc__name">
					{vehicle.make} {vehicle.model}
				</h3>
				{vehicle.nickname && <p className="vc__nickname">{vehicle.nickname}</p>}
				<p className="vc__year">{vehicle.year}</p>

				<div className="vc__meta">
					<div className="vc__meta-row">
						<span className="vc__meta-label">Plate</span>
						<span className="vc__plate">{vehicle.licensePlate}</span>
					</div>
					{vehicle.vin && (
						<div className="vc__meta-row">
							<span className="vc__meta-label">VIN</span>
							<span className="vc__vin">{vehicle.vin}</span>
						</div>
					)}
					<div className="vc__meta-row">
						<span className="vc__meta-label">Added</span>
						<span className="vc__meta-value">{fmtDate(vehicle.createdAt)}</span>
					</div>
				</div>

				{vehicle.notes && (
					<p className="vc__notes" title={vehicle.notes}>
						{vehicle.notes}
					</p>
				)}
			</div>

			<div className="vc__footer">
				<span className="vc__fuel" style={{ '--fuel-clr': fuel.color }}>
					<span className="vc__fuel-dot" />
					{vehicle.fuelType}
				</span>
				<div className="vc__badges">
					{inactive && <span className="vc__badge vc__badge--inactive">Inactive</span>}
					{vehicle.hasBookingHistory && !inactive && <span className="vc__badge vc__badge--history">Has bookings</span>}
				</div>
			</div>
		</div>
	);
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
	return (
		<div className="vc vc--skeleton" aria-hidden="true">
			<div className="vc__top">
				<div className="sk sk-icon" />
			</div>
			<div className="vc__body">
				<div className="sk sk-title" />
				<div className="sk sk-sub" />
				<div className="sk sk-line" />
				<div className="sk sk-line sk-line--short" />
			</div>
			<div className="vc__footer">
				<div className="sk sk-pill" />
			</div>
		</div>
	);
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ tab, onAdd }) {
	if (tab === 'inactive')
		return (
			<div className="vp-empty">
				<span className="vp-empty__icon">🗄️</span>
				<p className="vp-empty__title">No inactive vehicles</p>
				<p className="vp-empty__sub">Vehicles you remove will appear here — their booking history is always preserved.</p>
			</div>
		);
	return (
		<div className="vp-empty">
			<span className="vp-empty__icon">🚗</span>
			<p className="vp-empty__title">Your garage is empty</p>
			<p className="vp-empty__sub">Add your first vehicle to start booking services.</p>
			<button className="vp-add-btn" onClick={onAdd}>
				+ Add Vehicle
			</button>
		</div>
	);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VehiclesPage() {
	const [activeVehicles, setActiveVehicles] = useState([]);
	const [inactiveVehicles, setInactiveVehicles] = useState([]);
	const [loadingActive, setLoadingActive] = useState(false);
	const [loadingInactive, setLoadingInactive] = useState(false);
	const [inactiveLoaded, setInactiveLoaded] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [activeTab, setActiveTab] = useState('active');

	const [panel, setPanel] = useState(null);
	const [deleteTarget, setDeleteTarget] = useState(null);
	const [reactivateTarget, setReactivateTarget] = useState(null);

	// ─── Loaders ──────────────────────────────────────────────────────────────

	const loadActive = useCallback(async () => {
		try {
			setLoadingActive(true);
			setActiveVehicles(await vehicleService.getAll());
		} catch {
			toastError('Failed to load vehicles');
		} finally {
			setLoadingActive(false);
		}
	}, []);

	const loadInactive = useCallback(async () => {
		try {
			setLoadingInactive(true);
			setInactiveVehicles(await vehicleService.getInactive());
			setInactiveLoaded(true);
		} catch {
			toastError('Failed to load inactive vehicles');
		} finally {
			setLoadingInactive(false);
		}
	}, []);

	useEffect(() => {
		loadActive();
	}, [loadActive]);

	const handleTabChange = (tab) => {
		setActiveTab(tab);
		if (tab === 'inactive' && !inactiveLoaded) loadInactive();
	};

	// ─── Handlers ─────────────────────────────────────────────────────────────

	const handleAdd = async (data) => {
		try {
			setSubmitting(true);
			const created = await vehicleService.create(data);
			setActiveVehicles((p) => [created, ...p]);
			toastSuccess('Vehicle added');
			setPanel(null);
		} catch (e) {
			toastError(e.message || 'Failed to add vehicle');
		} finally {
			setSubmitting(false);
		}
	};

	const handleEdit = async (data) => {
		try {
			setSubmitting(true);
			const updated = await vehicleService.update(panel.vehicle.id, data);
			setActiveVehicles((p) => p.map((v) => (v.id === updated.id ? updated : v)));
			toastSuccess('Vehicle updated');
			setPanel(null);
		} catch (e) {
			toastError(e.message || 'Failed to update vehicle');
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async () => {
		try {
			setSubmitting(true);
			await vehicleService.delete(deleteTarget.id);
			const removed = { ...deleteTarget, isActive: false };
			setActiveVehicles((p) => p.filter((v) => v.id !== deleteTarget.id));
			if (inactiveLoaded) setInactiveVehicles((p) => [removed, ...p]);
			toastSuccess('Vehicle moved to inactive');
			setDeleteTarget(null);
		} catch (e) {
			toastError(e.message || 'Failed to remove vehicle');
		} finally {
			setSubmitting(false);
		}
	};

	const handleReactivate = async () => {
		try {
			setSubmitting(true);
			const updated = await vehicleService.reactivate(reactivateTarget.id);
			setInactiveVehicles((p) => p.filter((v) => v.id !== reactivateTarget.id));
			setActiveVehicles((p) => [updated, ...p]);
			toastSuccess('Vehicle reactivated');
			setReactivateTarget(null);
			setActiveTab('active');
		} catch (e) {
			toastError(e.message || 'Failed to reactivate vehicle');
		} finally {
			setSubmitting(false);
		}
	};

	// ─── Render ───────────────────────────────────────────────────────────────

	const list = activeTab === 'active' ? activeVehicles : inactiveVehicles;
	const loading = activeTab === 'active' ? loadingActive : loadingInactive;

	return (
		<div className="dashboard-page vehicles-page">
			<section className="page-hero compact">
				<div>
					<p className="page-kicker">My Garage</p>
					<h1>My Vehicles</h1>
				</div>
				{activeTab === 'active' && (
					<button className="vp-add-btn" onClick={() => setPanel({ type: 'add' })}>
						+ Add Vehicle
					</button>
				)}
			</section>

			{/* ── Tabs ── */}
			<div className="vp-tabs" role="tablist">
				<button
					role="tab"
					aria-selected={activeTab === 'active'}
					className={`vp-tab ${activeTab === 'active' ? 'vp-tab--active' : ''}`}
					onClick={() => handleTabChange('active')}
				>
					🚗 Active Vehicles
					{activeVehicles.length > 0 && <span className="vp-tab__count">{activeVehicles.length}</span>}
				</button>
				<button
					role="tab"
					aria-selected={activeTab === 'inactive'}
					className={`vp-tab ${activeTab === 'inactive' ? 'vp-tab--active' : ''}`}
					onClick={() => handleTabChange('inactive')}
				>
					🗄️ Inactive
					{inactiveLoaded && inactiveVehicles.length > 0 && (
						<span className="vp-tab__count vp-tab__count--muted">{inactiveVehicles.length}</span>
					)}
				</button>
			</div>

			{activeTab === 'inactive' && (
				<p className="vp-inactive-hint">
					Removed vehicles are stored here. Their booking history is always preserved. Reactivate any time.
				</p>
			)}

			{/* ── Content ── */}
			{loading ? (
				<div className="vp-grid">
					{[1, 2, 3].map((i) => (
						<SkeletonCard key={i} />
					))}
				</div>
			) : list.length === 0 ? (
				<EmptyState tab={activeTab} onAdd={() => setPanel({ type: 'add' })} />
			) : (
				<div className={`vp-grid ${activeTab === 'inactive' ? 'vp-grid--inactive' : ''}`}>
					{list.map((v) => (
						<VehicleCard
							key={v.id}
							vehicle={v}
							inactive={activeTab === 'inactive'}
							onEdit={(vehicle) => setPanel({ type: 'edit', vehicle })}
							onDelete={setDeleteTarget}
							onReactivate={setReactivateTarget}
						/>
					))}
				</div>
			)}

			{/* ── Side Drawer ── */}
			<SideDrawer
				isOpen={!!panel}
				onClose={() => setPanel(null)}
				title={panel?.type === 'edit' ? 'Edit Vehicle' : 'Add New Vehicle'}
				disabled={submitting}
			>
				{panel && (
					<VehicleForm
						initial={panel.type === 'edit' ? panel.vehicle : null}
						onSubmit={panel.type === 'add' ? handleAdd : handleEdit}
						onCancel={() => setPanel(null)}
						submitting={submitting}
					/>
				)}
			</SideDrawer>

			{/* ── Delete Modal ── */}
			{deleteTarget && (
				<ConfirmModal
					icon="🗑️"
					title="Remove Vehicle?"
					body={
						<>
							<strong>
								{deleteTarget.make} {deleteTarget.model}
							</strong>{' '}
							({deleteTarget.licensePlate}) will be moved to inactive. You can reactivate it any time.
						</>
					}
					confirmLabel="Remove"
					confirmClass="sd-btn--danger"
					onConfirm={handleDelete}
					onCancel={() => setDeleteTarget(null)}
					submitting={submitting}
				/>
			)}

			{/* ── Reactivate Modal ── */}
			{reactivateTarget && (
				<ConfirmModal
					icon="♻️"
					title="Reactivate Vehicle?"
					body={
						<>
							<strong>
								{reactivateTarget.make} {reactivateTarget.model}
							</strong>{' '}
							({reactivateTarget.licensePlate}) will be moved back to your active garage.
						</>
					}
					confirmLabel="Reactivate"
					confirmClass="sd-btn--success"
					onConfirm={handleReactivate}
					onCancel={() => setReactivateTarget(null)}
					submitting={submitting}
				/>
			)}
		</div>
	);
}
