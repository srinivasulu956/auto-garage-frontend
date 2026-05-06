import { useCallback, useEffect, useState } from 'react';
import serviceTypeService from '../../../app-core/services/service-type-service';
import { toastError, toastSuccess } from '../../../app-core/services/toast-service';
import SideDrawer from '../../../app-core/shared/side-drawer/side-drawer';
import './service-types-page.scss';

const EMPTY_FORM = {
	name: '',
	description: '',
	basePrice: '',
	estimatedHours: '',
};

function ServiceForm({ initial, onSubmit, onCancel, submitting }) {
	const isEdit = !!initial?.id;

	const [form, setForm] = useState(initial || EMPTY_FORM);
	const [errors, setErrors] = useState({});

	const set = (k, v) => {
		setForm((p) => ({ ...p, [k]: v }));

		if (errors[k]) {
			setErrors((p) => ({ ...p, [k]: '' }));
		}
	};

	const validate = () => {
		const e = {};

		if (!form.name.trim()) e.name = 'Required';
		if (!form.basePrice) e.basePrice = 'Required';
		if (!form.estimatedHours) e.estimatedHours = 'Required';

		return e;
	};

	const submit = (e) => {
		e.preventDefault();

		const errs = validate();

		if (Object.keys(errs).length) {
			setErrors(errs);

			const first = Object.keys(errs)[0];
			document.querySelector(`[name="${first}"]`)?.focus();

			return;
		}

		onSubmit({
			name: form.name,
			description: form.description || null,
			basePrice: Number(form.basePrice),
			estimatedHours: Number(form.estimatedHours),
		});
	};

	return (
		<form className="sd-form" onSubmit={submit}>
			<div className="sd-section-label">Service Details</div>

			<div className="sd-field">
				<label className="required">Name</label>

				<input
					name="name"
					className={`sd-input ${errors.name ? 'has-error' : ''}`}
					value={form.name}
					onChange={(e) => set('name', e.target.value)}
				/>

				{errors.name && <span className="sd-error">{errors.name}</span>}
			</div>

			<div className="sd-field">
				<label>Description</label>

				<textarea className="sd-input sd-textarea" value={form.description} onChange={(e) => set('description', e.target.value)} />
			</div>

			<div className="sd-row">
				<div className="sd-field">
					<label className="required">Base Price</label>

					<input
						name="basePrice"
						type="number"
						className={`sd-input ${errors.basePrice ? 'has-error' : ''}`}
						value={form.basePrice}
						onChange={(e) => set('basePrice', e.target.value)}
					/>

					{errors.basePrice && <span className="sd-error">{errors.basePrice}</span>}
				</div>

				<div className="sd-field">
					<label className="required">Hours</label>

					<input
						name="estimatedHours"
						type="number"
						className={`sd-input ${errors.estimatedHours ? 'has-error' : ''}`}
						value={form.estimatedHours}
						onChange={(e) => set('estimatedHours', e.target.value)}
					/>

					{errors.estimatedHours && <span className="sd-error">{errors.estimatedHours}</span>}
				</div>
			</div>

			<div className="sd-footer">
				<button type="button" className="sd-btn sd-btn--ghost" onClick={onCancel}>
					Cancel
				</button>

				<button type="submit" className="sd-btn sd-btn--primary" disabled={submitting}>
					{submitting ? 'Saving...' : isEdit ? 'Update' : 'Add'}
				</button>
			</div>
		</form>
	);
}

function ServiceCard({ item, onEdit, onDelete, onReactivate, inactive }) {
	return (
		<div className={`st-card ${inactive ? 'st-card--inactive' : ''}`}>
			<div className="st-top">
				<div className="vc__icon">🔧</div>

				<div className="st-actions">
					{inactive ? (
						<button className="st-btn-reactivate" onClick={() => onReactivate(item)}>
							♻ Reactivate
						</button>
					) : (
						<div className="d-flex gap-2">
							<button onClick={() => onEdit(item)}>✏️</button>
							<button onClick={() => onDelete(item)}>🗑️</button>
						</div>
					)}
				</div>
			</div>

			<div className="st-body">
				<h5 className="fw-bold mt-2">{item.name}</h5> <p>{item.description || 'No description'}</p>
			</div>

			<div className="st-footer">
				<span>₹ {item.basePrice}</span>

				<span className={inactive ? 'status-inactive' : 'status-active'}>{item.estimatedHours} hrs</span>
			</div>
		</div>
	);
}

export default function ServiceTypesPage() {
	const [activeList, setActiveList] = useState([]);
	const [inactiveList, setInactiveList] = useState([]);

	const [loadingActive, setLoadingActive] = useState(false);
	const [loadingInactive, setLoadingInactive] = useState(false);
	const [inactiveLoaded, setInactiveLoaded] = useState(false);

	const [activeTab, setActiveTab] = useState('active');

	const [panel, setPanel] = useState(null);
	const [deleteTarget, setDeleteTarget] = useState(null);
	const [submitting, setSubmitting] = useState(false);

	const loadActive = useCallback(async () => {
		try {
			setLoadingActive(true);
			setActiveList(await serviceTypeService.getAll());
		} catch {
			toastError('Failed to load services');
		} finally {
			setLoadingActive(false);
		}
	}, []);

	const loadInactive = async () => {
		try {
			setLoadingInactive(true);
			setInactiveList(await serviceTypeService.getInactive());
			setInactiveLoaded(true);
		} catch {
			toastError('Failed to load inactive services');
		} finally {
			setLoadingInactive(false);
		}
	};

	useEffect(() => {
		loadActive();
	}, [loadActive]);

	const handleTab = (tab) => {
		setActiveTab(tab);

		if (tab === 'inactive' && !inactiveLoaded) {
			loadInactive();
		}
	};

	const create = async (data) => {
		try {
			setSubmitting(true);

			const res = await serviceTypeService.create(data);

			setActiveList((p) => [res, ...p]);

			toastSuccess('Service added');
			setPanel(null);
		} catch {
			toastError('Create failed');
		} finally {
			setSubmitting(false);
		}
	};

	const update = async (data) => {
		try {
			setSubmitting(true);

			const res = await serviceTypeService.update(panel.item.id, data);

			setActiveList((p) => p.map((x) => (x.id === res.id ? res : x)));

			toastSuccess('Updated');
			setPanel(null);
		} catch {
			toastError('Update failed');
		} finally {
			setSubmitting(false);
		}
	};

	const remove = async () => {
		try {
			setSubmitting(true);

			await serviceTypeService.delete(deleteTarget.id);

			setActiveList((p) => p.filter((x) => x.id !== deleteTarget.id));

			setInactiveList((p) => [{ ...deleteTarget }, ...p]);

			toastSuccess('Moved to inactive');
			setDeleteTarget(null);
		} catch {
			toastError('Delete failed');
		} finally {
			setSubmitting(false);
		}
	};

	const reactivate = async (item) => {
		try {
			await serviceTypeService.reactivate(item.id);

			setInactiveList((p) => p.filter((x) => x.id !== item.id));

			setActiveList((p) => [item, ...p]);

			toastSuccess('Reactivated');
		} catch {
			toastError('Reactivate failed');
		}
	};

	const list = activeTab === 'active' ? activeList : inactiveList;

	const loading = activeTab === 'active' ? loadingActive : loadingInactive;

	return (
		<div className="service-page">
			<div className="page-header">
				<h1>Service Types</h1>

				<button className="add-btn" onClick={() => setPanel({ type: 'add' })}>
					+ Add Service
				</button>
			</div>

			<div className="st-tabs">
				<button className={activeTab === 'active' ? 'active' : ''} onClick={() => handleTab('active')}>
					Active ({activeList.length})
				</button>

				<button className={activeTab === 'inactive' ? 'active' : ''} onClick={() => handleTab('inactive')}>
					Inactive ({inactiveList.length})
				</button>
			</div>

			{loading ? (
				<div className="st-grid">
					{[1, 2, 3].map((i) => (
						<div key={i} className="st-skeleton" />
					))}
				</div>
			) : (
				<div className="st-grid">
					{list.map((item) => (
						<ServiceCard
							key={item.id}
							item={item}
							inactive={activeTab === 'inactive'}
							onEdit={(i) =>
								setPanel({
									type: 'edit',
									item: i,
								})
							}
							onDelete={setDeleteTarget}
							onReactivate={reactivate}
						/>
					))}
				</div>
			)}

			<SideDrawer isOpen={!!panel} onClose={() => setPanel(null)} title={panel?.type === 'edit' ? 'Edit Service' : 'Add Service'}>
				{panel && (
					<ServiceForm
						initial={panel.type === 'edit' ? panel.item : null}
						onSubmit={panel.type === 'add' ? create : update}
						onCancel={() => setPanel(null)}
						submitting={submitting}
					/>
				)}
			</SideDrawer>

			{deleteTarget && (
				<div className="st-overlay">
					<div className="st-modal">
						<div className="vd-modal__icon">🗑️</div>
						<p>
							Delete <b>{deleteTarget.name}</b>? <p>It will be moved to inactive. You can reactivate it any time.</p>
						</p>

						<div className="st-actions confirm-actions">
							<button className="btn-cancel" onClick={() => setDeleteTarget(null)}>
								Cancel
							</button>

							<button className="btn-delete" onClick={remove}>
								Delete
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
