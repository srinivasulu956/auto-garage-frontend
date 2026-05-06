// import { useCallback, useEffect, useState } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { mechanicJobService, workLogService } from '../../../app-core/services/mechanic-service';
// import { toastError, toastSuccess } from '../../../app-core/services/toast-service';
// import './mechanic-job-details-page.scss';

// // ─── Constants ────────────────────────────────────────────────────────────────

// const STATUS_ENUM = {
// 	InProgress: 3,
// 	WaitingForParts: 4,
// 	QualityCheck: 5,
// };

// // Work log is locked (read-only) once job reaches QC or beyond
// const WORKLOG_LOCKED_STATES = ['QualityCheck', 'Completed', 'InvoiceGenerated', 'Paid', 'Cancelled'];
// const FINAL_STATES = ['Completed', 'InvoiceGenerated', 'Paid', 'Cancelled', 'QualityCheck'];

// const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

// const fmtCur = (v) => `₹${Number(v).toFixed(2)}`;

// // ─── Work Log Section ─────────────────────────────────────────────────────────

// function WorkLogSection({ bookingId, locked }) {
// 	const [items, setItems] = useState([]);
// 	const [loading, setLoading] = useState(true);
// 	const [saving, setSaving] = useState(null); // itemId being deleted, or 'new'

// 	// New item form state
// 	const [form, setForm] = useState({ description: '', quantity: 1, unitCost: '' });
// 	const [showForm, setShowForm] = useState(false);

// 	const loadItems = useCallback(async () => {
// 		try {
// 			setLoading(true);
// 			const data = await workLogService.getByBookingId(bookingId);
// 			setItems(data || []);
// 		} catch {
// 			toastError('Failed to load work log');
// 		} finally {
// 			setLoading(false);
// 		}
// 	}, [bookingId]);

// 	useEffect(() => {
// 		loadItems();
// 	}, [loadItems]);

// 	const handleAdd = async () => {
// 		if (!form.description.trim()) {
// 			toastError('Description is required');
// 			return;
// 		}
// 		if (!form.unitCost || parseFloat(form.unitCost) <= 0) {
// 			toastError('Enter a valid cost');
// 			return;
// 		}

// 		try {
// 			setSaving('new');
// 			await workLogService.add(bookingId, {
// 				description: form.description.trim(),
// 				quantity: parseInt(form.quantity) || 1,
// 				unitCost: parseFloat(form.unitCost),
// 			});
// 			toastSuccess('Item added to work log');
// 			setForm({ description: '', quantity: 1, unitCost: '' });
// 			setShowForm(false);
// 			loadItems();
// 		} catch (e) {
// 			toastError(e.message || 'Failed to add item');
// 		} finally {
// 			setSaving(null);
// 		}
// 	};

// 	const handleDelete = async (itemId) => {
// 		try {
// 			setSaving(itemId);
// 			await workLogService.delete(itemId);
// 			toastSuccess('Item removed');
// 			loadItems();
// 		} catch (e) {
// 			toastError(e.message || 'Failed to remove item');
// 		} finally {
// 			setSaving(null);
// 		}
// 	};

// 	const total = items.reduce((s, it) => s + it.lineTotal, 0);

// 	return (
// 		<div className="mjd-worklog">
// 			<div className="mjd-worklog__header">
// 				<h3 className="mjd-worklog__title">🔧 Work Log</h3>
// 				{locked ? (
// 					<span className="mjd-worklog__locked-badge">🔒 Locked — submitted for QC</span>
// 				) : (
// 					!showForm && (
// 						<button className="mjd-worklog__add-btn" onClick={() => setShowForm(true)}>
// 							+ Add Item
// 						</button>
// 					)
// 				)}
// 			</div>

// 			<p className="mjd-worklog__hint">
// 				{locked
// 					? 'These items have been submitted to the admin for invoice generation.'
// 					: 'Log all parts used and work done. Admin will use this to generate the invoice.'}
// 			</p>

// 			{/* Add item form */}
// 			{!locked && showForm && (
// 				<div className="mjd-worklog__form">
// 					<input
// 						className="mjd-input"
// 						placeholder="Description (e.g. Brake pad – front left)"
// 						value={form.description}
// 						onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
// 						maxLength={300}
// 					/>
// 					<div className="mjd-worklog__form-row">
// 						<div className="mjd-field">
// 							<label className="mjd-label">Quantity</label>
// 							<input
// 								className="mjd-input"
// 								type="number"
// 								min={1}
// 								value={form.quantity}
// 								onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
// 							/>
// 						</div>
// 						<div className="mjd-field">
// 							<label className="mjd-label">Unit Cost (₹)</label>
// 							<input
// 								className="mjd-input"
// 								type="number"
// 								min={0}
// 								placeholder="0.00"
// 								value={form.unitCost}
// 								onChange={(e) => setForm((f) => ({ ...f, unitCost: e.target.value }))}
// 							/>
// 						</div>
// 					</div>
// 					<div className="mjd-worklog__form-actions">
// 						<button
// 							className="mjd-btn mjd-btn--ghost"
// 							onClick={() => {
// 								setShowForm(false);
// 								setForm({ description: '', quantity: 1, unitCost: '' });
// 							}}
// 						>
// 							Cancel
// 						</button>
// 						<button className="mjd-btn mjd-btn--primary" onClick={handleAdd} disabled={saving === 'new'}>
// 							{saving === 'new' ? 'Saving…' : '✓ Add'}
// 						</button>
// 					</div>
// 				</div>
// 			)}

// 			{/* Items list */}
// 			{loading ? (
// 				<div className="mjd-worklog__loading">Loading…</div>
// 			) : items.length === 0 ? (
// 				<div className="mjd-worklog__empty">
// 					{locked ? 'No work log items were submitted.' : 'No items yet. Add parts and labour above.'}
// 				</div>
// 			) : (
// 				<>
// 					<div className="mjd-worklog__table">
// 						<div className="mjd-worklog__table-head">
// 							<span>Description</span>
// 							<span>Qty</span>
// 							<span>Unit Cost</span>
// 							<span>Total</span>
// 							{!locked && <span />}
// 						</div>
// 						{items.map((item) => (
// 							<div key={item.id} className="mjd-worklog__table-row">
// 								<span>{item.description}</span>
// 								<span>{item.quantity}</span>
// 								<span>{fmtCur(item.unitCost)}</span>
// 								<span>{fmtCur(item.lineTotal)}</span>
// 								{!locked && (
// 									<button
// 										className="mjd-worklog__delete-btn"
// 										onClick={() => handleDelete(item.id)}
// 										disabled={saving === item.id}
// 										title="Remove"
// 									>
// 										{saving === item.id ? '…' : '✕'}
// 									</button>
// 								)}
// 							</div>
// 						))}
// 					</div>
// 					<div className="mjd-worklog__total">
// 						Work Log Total: <strong>{fmtCur(total)}</strong>
// 					</div>
// 				</>
// 			)}
// 		</div>
// 	);
// }

// // ─── Main Page ────────────────────────────────────────────────────────────────

// export default function MechanicJobDetails() {
// 	const { id } = useParams();
// 	const navigate = useNavigate();

// 	const [job, setJob] = useState(null);
// 	const [loading, setLoading] = useState(true);
// 	const [updating, setUpdating] = useState(false);
// 	const [notes, setNotes] = useState('');

// 	const load = useCallback(async () => {
// 		try {
// 			setLoading(true);
// 			const data = await mechanicJobService.getById(id);
// 			setJob(data);
// 		} catch {
// 			toastError('Failed to load job');
// 		} finally {
// 			setLoading(false);
// 		}
// 	}, [id]);

// 	useEffect(() => {
// 		load();
// 	}, [load]);

// 	const rawStatus = job?.statusLabel?.replace(/ /g, '');
// 	const isFinalState = FINAL_STATES.includes(rawStatus);
// 	const isWorklogLocked = WORKLOG_LOCKED_STATES.includes(rawStatus);

// 	const updateStatus = async (statusKey) => {
// 		try {
// 			setUpdating(true);
// 			await mechanicJobService.updateStatus(id, {
// 				newStatus: STATUS_ENUM[statusKey],
// 				notes: notes || `Updated to ${statusKey}`,
// 			});
// 			toastSuccess('Status updated');
// 			setNotes('');
// 			load();
// 		} catch (err) {
// 			toastError(err?.message || 'Update failed');
// 		} finally {
// 			setUpdating(false);
// 		}
// 	};

// 	if (loading) return <div className="mjd-loading">Loading...</div>;
// 	if (!job) return <div className="mjd-loading">Job not found</div>;

// 	return (
// 		<div className="mjd-page">
// 			{/* Header */}
// 			<div className="mjd-header">
// 				<button onClick={() => navigate(-1)} className="mjd-back">
// 					← Back
// 				</button>
// 				<h1>{job.serviceType?.name}</h1>
// 			</div>

// 			{/* Info card */}
// 			<div className="mjd-card">
// 				<p>
// 					<strong>Vehicle:</strong> {job.vehicle?.make} {job.vehicle?.model} ({job.vehicle?.licensePlate})
// 				</p>
// 				<p>
// 					<strong>Date:</strong> {fmtDate(job.scheduledDate)}
// 				</p>
// 				<p>
// 					<strong>Status:</strong> <span className="mjd-status">{job.statusLabel}</span>
// 				</p>
// 				{job.customerNotes && (
// 					<p>
// 						<strong>Customer notes:</strong> {job.customerNotes}
// 					</p>
// 				)}
// 			</div>

// 			{/* ── Work Log section ─────────────────────────────────────── */}
// 			<WorkLogSection bookingId={id} locked={isWorklogLocked} />

// 			{/* ── Status actions / history ─────────────────────────────── */}
// 			<div className="mjd-actions">
// 				<h3>{isFinalState ? 'Booking History' : 'Update Status'}</h3>

// 				{!isFinalState ? (
// 					<>
// 						<textarea
// 							className="mjd-notes"
// 							placeholder="Enter notes (optional)..."
// 							value={notes}
// 							onChange={(e) => setNotes(e.target.value)}
// 						/>
// 						<div className="mjd-btn-grid">
// 							<button onClick={() => updateStatus('InProgress')} disabled={updating}>
// 								🚀 Start Work
// 							</button>
// 							<button onClick={() => updateStatus('WaitingForParts')} disabled={updating}>
// 								🧩 Waiting Parts
// 							</button>
// 							<button onClick={() => updateStatus('QualityCheck')} disabled={updating}>
// 								🔍 Send QC
// 							</button>
// 						</div>
// 					</>
// 				) : (
// 					<div className="mjd-history">
// 						{job.statusHistory?.length === 0 ? (
// 							<p className="mjd-empty">No history available</p>
// 						) : (
// 							job.statusHistory.map((h, i) => (
// 								<div key={i} className="mjd-history-row">
// 									<div>
// 										<strong>{h.statusLabel}</strong>
// 										<p>{h.notes || '—'}</p>
// 									</div>
// 									<span>{fmtDate(h.changedAt)}</span>
// 								</div>
// 							))
// 						)}
// 					</div>
// 				)}
// 			</div>
// 		</div>
// 	);
// }
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mechanicJobService, workLogService } from '../../../app-core/services/mechanic-service';
import { toastError, toastSuccess } from '../../../app-core/services/toast-service';
import './mechanic-job-details-page.scss';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_ENUM = {
	InProgress: 3,
	WaitingForParts: 4,
	QualityCheck: 5,
};

// Work log is locked (read-only) once job reaches QC or beyond
const WORKLOG_LOCKED_STATES = ['QualityCheck', 'Completed', 'InvoiceGenerated', 'Paid', 'Cancelled'];
const FINAL_STATES = ['Completed', 'InvoiceGenerated', 'Paid', 'Cancelled', 'QualityCheck'];

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const fmtCur = (v) => `₹${Number(v).toFixed(2)}`;

// ─── Work Log Section ─────────────────────────────────────────────────────────

function WorkLogSection({ bookingId, locked }) {
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(null); // itemId being deleted, or 'new'

	// New item form state
	const [form, setForm] = useState({ description: '', quantity: 1, unitCost: '' });
	const [showForm, setShowForm] = useState(false);

	const loadItems = useCallback(async () => {
		try {
			setLoading(true);
			const data = await workLogService.getByBookingId(bookingId);
			setItems(data || []);
		} catch {
			toastError('Failed to load work log');
		} finally {
			setLoading(false);
		}
	}, [bookingId]);

	useEffect(() => {
		loadItems();
	}, [loadItems]);

	const handleAdd = async () => {
		if (!form.description.trim()) {
			toastError('Description is required');
			return;
		}
		if (!form.unitCost || parseFloat(form.unitCost) <= 0) {
			toastError('Enter a valid cost');
			return;
		}

		try {
			setSaving('new');
			await workLogService.add(bookingId, {
				description: form.description.trim(),
				quantity: parseInt(form.quantity) || 1,
				unitCost: parseFloat(form.unitCost),
			});
			toastSuccess('Item added to work log');
			setForm({ description: '', quantity: 1, unitCost: '' });
			setShowForm(false);
			loadItems();
		} catch (e) {
			toastError(e.message || 'Failed to add item');
		} finally {
			setSaving(null);
		}
	};

	const handleDelete = async (itemId) => {
		try {
			setSaving(itemId);
			await workLogService.delete(itemId);
			toastSuccess('Item removed');
			loadItems();
		} catch (e) {
			toastError(e.message || 'Failed to remove item');
		} finally {
			setSaving(null);
		}
	};

	const total = items.reduce((s, it) => s + it.lineTotal, 0);

	return (
		<div className="mjd-worklog">
			<div className="mjd-worklog__header">
				<h3 className="mjd-worklog__title">🔧 Work Log</h3>
				{locked ? (
					<span className="mjd-worklog__locked-badge">🔒 Locked — submitted for QC</span>
				) : (
					!showForm && (
						<button className="mjd-worklog__add-btn" onClick={() => setShowForm(true)}>
							+ Add Item
						</button>
					)
				)}
			</div>

			<p className="mjd-worklog__hint">
				{locked
					? 'These items have been submitted to the admin for invoice generation.'
					: 'Log all parts used and work done. Admin will use this to generate the invoice.'}
			</p>

			{/* Add item form */}
			{!locked && showForm && (
				<div className="mjd-worklog__form">
					<input
						className="mjd-input"
						placeholder="Description (e.g. Brake pad – front left)"
						value={form.description}
						onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
						maxLength={300}
					/>
					<div className="mjd-worklog__form-row">
						<div className="mjd-field">
							<label className="mjd-label">Quantity</label>
							<input
								className="mjd-input"
								type="number"
								min={1}
								value={form.quantity}
								onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
							/>
						</div>
						<div className="mjd-field">
							<label className="mjd-label">Unit Cost (₹)</label>
							<input
								className="mjd-input"
								type="number"
								min={0}
								placeholder="0.00"
								value={form.unitCost}
								onChange={(e) => setForm((f) => ({ ...f, unitCost: e.target.value }))}
							/>
						</div>
					</div>
					<div className="mjd-worklog__form-actions">
						<button
							className="mjd-btn mjd-btn--ghost"
							onClick={() => {
								setShowForm(false);
								setForm({ description: '', quantity: 1, unitCost: '' });
							}}
						>
							Cancel
						</button>
						<button className="mjd-btn mjd-btn--primary" onClick={handleAdd} disabled={saving === 'new'}>
							{saving === 'new' ? 'Saving…' : '✓ Add'}
						</button>
					</div>
				</div>
			)}

			{/* Items list */}
			{loading ? (
				<div className="mjd-worklog__loading">Loading…</div>
			) : items.length === 0 ? (
				<div className="mjd-worklog__empty">
					{locked ? 'No work log items were submitted.' : 'No items yet. Add parts and labour above.'}
				</div>
			) : (
				<>
					<div className="mjd-worklog__table">
						<div className="mjd-worklog__table-head">
							<span>Description</span>
							<span>Qty</span>
							<span>Unit Cost</span>
							<span>Total</span>
							{!locked && <span />}
						</div>
						{items.map((item) => (
							<div key={item.id} className="mjd-worklog__table-row">
								<span>{item.description}</span>
								<span>{item.quantity}</span>
								<span>{fmtCur(item.unitCost)}</span>
								<span>{fmtCur(item.lineTotal)}</span>
								{!locked && (
									<button
										className="mjd-worklog__delete-btn"
										onClick={() => handleDelete(item.id)}
										disabled={saving === item.id}
										title="Remove"
									>
										{saving === item.id ? '…' : '✕'}
									</button>
								)}
							</div>
						))}
					</div>
					<div className="mjd-worklog__total">
						Work Log Total: <strong>{fmtCur(total)}</strong>
					</div>
				</>
			)}
		</div>
	);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MechanicJobDetails() {
	const { id } = useParams();
	const navigate = useNavigate();

	const [job, setJob] = useState(null);
	const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState(false);
	const [notes, setNotes] = useState('');

	const load = useCallback(async () => {
		try {
			setLoading(true);
			const data = await mechanicJobService.getById(id);
			setJob(data);
		} catch {
			toastError('Failed to load job');
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		load();
	}, [load]);

	const rawStatus = job?.statusLabel?.replace(/ /g, '');
	const isFinalState = FINAL_STATES.includes(rawStatus);
	const isWorklogLocked = WORKLOG_LOCKED_STATES.includes(rawStatus);

	const updateStatus = async (statusKey) => {
		try {
			setUpdating(true);
			await mechanicJobService.updateStatus(id, {
				newStatus: STATUS_ENUM[statusKey],
				notes: notes || `Updated to ${statusKey}`,
			});
			toastSuccess('Status updated');
			setNotes('');
			load();
		} catch (err) {
			toastError(err?.message || 'Update failed');
		} finally {
			setUpdating(false);
		}
	};

	if (loading) return <div className="mjd-loading">Loading...</div>;
	if (!job) return <div className="mjd-loading">Job not found</div>;

	return (
		<div className="mjd-page">
			{/* Header */}
			<div className="mjd-header">
				<button onClick={() => navigate(-1)} className="mjd-back">
					← Back
				</button>
				<h1>{job.serviceType?.name}</h1>
			</div>

			{/* Info card */}
			<div className="mjd-card">
				<p>
					<strong>Vehicle:</strong> {job.vehicle?.make} {job.vehicle?.model} ({job.vehicle?.licensePlate})
				</p>
				<p>
					<strong>Date:</strong> {fmtDate(job.scheduledDate)}
				</p>
				<p>
					<strong>Status:</strong> <span className="mjd-status">{job.statusLabel}</span>
				</p>
				{job.customerNotes && (
					<p>
						<strong>Customer notes:</strong> {job.customerNotes}
					</p>
				)}
			</div>

			{/* ── Work Log section ─────────────────────────────────────── */}
			<WorkLogSection bookingId={id} locked={isWorklogLocked} />

			{/* ── Status actions / history ─────────────────────────────── */}
			<div className="mjd-actions">
				<h3>{isFinalState ? 'Booking History' : 'Update Status'}</h3>

				{!isFinalState ? (
					<>
						<textarea
							className="mjd-notes"
							placeholder="Enter notes (optional)..."
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
						/>
						<div className="mjd-btn-grid">
							{/* Start Work: enabled from "Assigned to Mechanic" or "Waiting for Parts" */}
							<button
								onClick={() => updateStatus('InProgress')}
								disabled={updating || !['Assigned to Mechanic', 'Waiting for Parts'].includes(job.statusLabel)}
							>
								🚀 Start Work
							</button>

							{/* Waiting Parts: enabled only from "In Progress" */}
							<button
								onClick={() => updateStatus('WaitingForParts')}
								disabled={updating || job.statusLabel !== 'In Progress'}
							>
								🧩 Waiting Parts
							</button>

							{/* Send QC: enabled only from "In Progress" */}
							<button onClick={() => updateStatus('QualityCheck')} disabled={updating || job.statusLabel !== 'In Progress'}>
								🔍 Send QC
							</button>
						</div>
					</>
				) : (
					<div className="mjd-history">
						{job.statusHistory?.length === 0 ? (
							<p className="mjd-empty">No history available</p>
						) : (
							job.statusHistory.map((h, i) => (
								<div key={i} className="mjd-history-row">
									<div>
										<strong>{h.statusLabel}</strong>
										<p>{h.notes || '—'}</p>
									</div>
									<span>{fmtDate(h.changedAt)}</span>
								</div>
							))
						)}
					</div>
				)}
			</div>
		</div>
	);
}
