import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './admin-booking-detail-page.scss';
import { adminBookingService, invoiceService } from '../../../app-core/services/admin-booking-service';
import { toastError, toastSuccess } from '../../../app-core/services/toast-service';
import SideDrawer from '../../../app-core/shared/side-drawer/side-drawer';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_META = {
	Pending: { bg: '#fff7ed', color: '#c2410c', dot: '#f97316', label: 'Pending' },
	Confirmed: { bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6', label: 'Confirmed' },
	AssignedToMechanic: { bg: '#f0f9ff', color: '#0369a1', dot: '#0ea5e9', label: 'Assigned to Mechanic' },
	InProgress: { bg: '#fefce8', color: '#a16207', dot: '#eab308', label: 'In Progress' },
	WaitingForParts: { bg: '#fdf4ff', color: '#7e22ce', dot: '#a855f7', label: 'Waiting for Parts' },
	QualityCheck: { bg: '#fff7ed', color: '#c2410c', dot: '#f97316', label: 'Quality Check' },
	Completed: { bg: '#f0fdf4', color: '#15803d', dot: '#22c55e', label: 'Completed' },
	InvoiceGenerated: { bg: '#fefce8', color: '#854d0e', dot: '#f59e0b', label: 'Invoice Sent' },
	Paid: { bg: '#f0fdf4', color: '#15803d', dot: '#22c55e', label: 'Paid' },
	Cancelled: { bg: '#fef2f2', color: '#991b1b', dot: '#ef4444', label: 'Cancelled' },
};

const STATUS_STEPS = ['Pending', 'Confirmed', 'AssignedToMechanic', 'InProgress', 'QualityCheck', 'Completed', 'InvoiceGenerated', 'Paid'];

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const fmtDateTime = (d) =>
	d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
	const raw = status?.replace(/ /g, '');
	const m = STATUS_META[raw] || STATUS_META[status] || { bg: '#f3f4f6', color: '#374151', dot: '#9ca3af', label: status };
	return (
		<span className="abd-badge" style={{ background: m.bg, color: m.color }}>
			<span className="abd-badge__dot" style={{ background: m.dot }} />
			{m.label}
		</span>
	);
}

function ProgressBar({ statusLabel }) {
	const raw = statusLabel?.replace(/ /g, '');
	const idx = STATUS_STEPS.indexOf(raw);
	const pct = idx < 0 ? 0 : Math.round(((idx + 1) / STATUS_STEPS.length) * 100);
	return (
		<div className="abd-progress">
			<div className="abd-progress__bar" style={{ width: `${pct}%` }} />
		</div>
	);
}

function InvoiceItemRow({ item, idx, onChange, onRemove, locked }) {
	return (
		<div className={`inv-item-row ${locked ? 'inv-item-row--locked' : ''}`}>
			<div className="inv-item-row__locked-icon" title={locked ? 'Base service price locked at booking time' : undefined}>
				{locked ? '🔒' : ''}
			</div>
			<input
				className="sd-input inv-item-row__desc"
				placeholder="e.g. Labour – Oil Change"
				value={item.description}
				onChange={(e) => onChange(idx, 'description', e.target.value)}
				disabled={locked}
			/>
			<input
				className="sd-input inv-item-row__qty"
				type="number"
				min={1}
				placeholder="Qty"
				value={item.quantity}
				onChange={(e) => onChange(idx, 'quantity', e.target.value)}
				disabled={locked}
			/>
			<input
				className="sd-input inv-item-row__price"
				type="number"
				min={0}
				placeholder="₹ Unit price"
				value={item.unitPrice}
				onChange={(e) => onChange(idx, 'unitPrice', e.target.value)}
				disabled={locked}
			/>
			<button
				type="button"
				className="inv-item-row__remove"
				onClick={() => onRemove(idx)}
				title="Remove"
				disabled={locked}
				style={{ visibility: locked ? 'hidden' : 'visible' }}
			>
				✕
			</button>
		</div>
	);
}

// ─── Invoice Detail Panel ─────────────────────────────────────────────────────

function InvoiceDetailPanel({ invoice, booking }) {
	if (!invoice) return <div className="inv-detail-loading">Loading invoice…</div>;

	return (
		<div className="inv-detail">
			{/* Header */}
			<div className="inv-detail__header">
				<div>
					<div className="inv-detail__label">Invoice ID</div>
					<div className="inv-detail__mono">{invoice.id}</div>
				</div>
				<div>
					<div className="inv-detail__label">Issued</div>
					<div>{fmtDate(invoice.issuedAt)}</div>
				</div>
				{invoice.paidAt && (
					<div>
						<div className="inv-detail__label">Paid on</div>
						<div>{fmtDate(invoice.paidAt)}</div>
					</div>
				)}
			</div>

			{/* Booking summary */}
			<div className="inv-detail__section">
				<div className="inv-detail__section-title">Booking Summary</div>
				<div className="inv-detail__row">
					<span>Service</span>
					<span>{invoice.booking?.serviceName}</span>
				</div>
				<div className="inv-detail__row">
					<span>Vehicle</span>
					<span>
						{invoice.booking?.vehicleMake} {invoice.booking?.vehicleModel}
					</span>
				</div>
				<div className="inv-detail__row">
					<span>Plate</span>
					<span>{invoice.booking?.licensePlate}</span>
				</div>
				<div className="inv-detail__row">
					<span>Scheduled</span>
					<span>{fmtDate(invoice.booking?.scheduledDate)}</span>
				</div>
			</div>

			{/* Line items */}
			<div className="inv-detail__section">
				<div className="inv-detail__section-title">Line Items</div>
				<div className="inv-items-table">
					<div className="inv-items-table__head">
						<span>Description</span>
						<span>Qty</span>
						<span>Unit Price</span>
						<span>Total</span>
					</div>
					{invoice.items?.map((item) => (
						<div key={item.id} className="inv-items-table__row">
							<span>{item.description}</span>
							<span>{item.quantity}</span>
							<span>₹{item.unitPrice.toFixed(2)}</span>
							<span>₹{item.total.toFixed(2)}</span>
						</div>
					))}
				</div>
			</div>

			{/* Totals */}
			<div className="inv-detail__totals">
				<div className="inv-detail__row">
					<span>Subtotal</span>
					<span>₹{invoice.subTotal?.toFixed(2)}</span>
				</div>
				<div className="inv-detail__row">
					<span>GST ({invoice.taxRate}%)</span>
					<span>₹{invoice.taxAmount?.toFixed(2)}</span>
				</div>
				<div className="inv-detail__row inv-detail__row--total">
					<span>Total</span>
					<span>₹{invoice.totalAmount?.toFixed(2)}</span>
				</div>
			</div>

			{/* Payment info */}
			{invoice.paymentMethod && (
				<div className="inv-detail__section">
					<div className="inv-detail__section-title">Payment Details</div>
					<div className="inv-detail__row">
						<span>Method</span>
						<span>{invoice.paymentMethod}</span>
					</div>
					<div className="inv-detail__row">
						<span>Reference</span>
						<span className="inv-detail__mono">{invoice.paymentReference}</span>
					</div>
				</div>
			)}
		</div>
	);
}

// ─── Download Invoice as PDF (via print dialog) ───────────────────────────────

function downloadInvoice(invoice, booking) {
	const fmtCur = (v) => `₹${Number(v).toFixed(2)}`;
	const fmtD = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

	const itemRows = invoice.items
		?.map(
			(it) => `
		<tr>
			<td>${it.description}</td>
			<td style="text-align:center">${it.quantity}</td>
			<td style="text-align:right">${fmtCur(it.unitPrice)}</td>
			<td style="text-align:right">${fmtCur(it.total)}</td>
		</tr>`
		)
		.join('');

	const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Invoice – ${invoice.id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #111; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
    .brand { font-size: 22px; font-weight: 700; color: #1d4ed8; }
    .brand span { display: block; font-size: 12px; font-weight: 400; color: #6b7280; margin-top: 2px; }
    .inv-meta { text-align: right; }
    .inv-meta .inv-id { font-size: 11px; color: #6b7280; word-break: break-all; }
    h2 { font-size: 18px; margin-bottom: 4px; }
    .status-paid { display: inline-block; background: #dcfce7; color: #15803d; padding: 2px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
    .meta-item label { font-size: 11px; color: #6b7280; }
    .meta-item p { font-weight: 500; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f9fafb; text-align: left; padding: 8px 10px; font-size: 11px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; }
    td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
    .totals { margin-left: auto; width: 260px; margin-top: 16px; }
    .totals tr td { border: none; padding: 4px 10px; }
    .totals tr:last-child td { font-weight: 700; font-size: 14px; border-top: 2px solid #111; padding-top: 8px; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #9ca3af; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">AutoFix Garage<span>Professional Auto Services</span></div>
    </div>
    <div class="inv-meta">
      <h2>INVOICE</h2>
      <div class="inv-id">${invoice.id}</div>
      <div style="margin-top:6px">Issued: ${fmtD(invoice.issuedAt)}</div>
      ${invoice.paidAt ? `<div>Paid: ${fmtD(invoice.paidAt)}</div>` : ''}
      ${invoice.statusLabel === 'Paid' ? '<div style="margin-top:6px"><span class="status-paid">✓ PAID</span></div>' : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Booking Details</div>
    <div class="meta-grid">
      <div class="meta-item"><label>Service</label><p>${invoice.booking?.serviceName || '—'}</p></div>
      <div class="meta-item"><label>Vehicle</label><p>${invoice.booking?.vehicleMake} ${invoice.booking?.vehicleModel}</p></div>
      <div class="meta-item"><label>License Plate</label><p>${invoice.booking?.licensePlate || '—'}</p></div>
      <div class="meta-item"><label>Scheduled Date</label><p>${fmtD(invoice.booking?.scheduledDate)}</p></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Line Items</div>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align:center">Qty</th>
          <th style="text-align:right">Unit Price</th>
          <th style="text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    <table class="totals">
      <tr><td>Subtotal</td><td style="text-align:right">${fmtCur(invoice.subTotal)}</td></tr>
      <tr><td>GST (${invoice.taxRate}%)</td><td style="text-align:right">${fmtCur(invoice.taxAmount)}</td></tr>
      <tr><td>Total Amount</td><td style="text-align:right">${fmtCur(invoice.totalAmount)}</td></tr>
    </table>
  </div>

  ${
		invoice.paymentMethod
			? `
  <div class="section">
    <div class="section-title">Payment Details</div>
    <div class="meta-grid">
      <div class="meta-item"><label>Method</label><p>${invoice.paymentMethod}</p></div>
      <div class="meta-item"><label>Reference</label><p>${invoice.paymentReference || '—'}</p></div>
    </div>
  </div>`
			: ''
  }

  <div class="footer">Thank you for choosing AutoFix Garage. This is a computer-generated invoice.</div>
</body>
</html>`;

	const win = window.open('', '_blank');
	win.document.write(html);
	win.document.close();
	win.focus();
	setTimeout(() => win.print(), 500);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminBookingDetailPage() {
	const { id } = useParams();
	const navigate = useNavigate();

	const [booking, setBooking] = useState(null);
	const [mechanics, setMechanics] = useState([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);

	// invoice for view/download
	const [invoiceData, setInvoiceData] = useState(null);
	const [invoiceLoading, setInvoiceLoading] = useState(false);

	// Panel: null | 'confirm' | 'assign' | 'reassign' | 'complete' | 'invoice' | 'view-invoice'
	const [panel, setPanel] = useState(null);

	const [selectedMechanic, setSelectedMechanic] = useState('');
	const [actionNotes, setActionNotes] = useState('');

	// Invoice generation form
	const [invoiceItems, setInvoiceItems] = useState([]);
	const [taxRate, setTaxRate] = useState(18);

	const load = useCallback(async () => {
		try {
			setLoading(true);
			const [bData, mData] = await Promise.allSettled([adminBookingService.getById(id), adminBookingService.getMechanics()]);
			if (bData.status === 'fulfilled') setBooking(bData.value);
			if (mData.status === 'fulfilled') setMechanics(mData.value || []);
		} catch {
			toastError('Failed to load booking');
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		load();
	}, [load]);

	// Load invoice when viewing
	const openViewInvoice = useCallback(async () => {
		setPanel('view-invoice');
		setInvoiceLoading(true);
		try {
			const data = await invoiceService.getByBookingIdAdmin(id);
			setInvoiceData(data);
		} catch {
			toastError('Failed to load invoice');
		} finally {
			setInvoiceLoading(false);
		}
	}, [id]);

	const openInvoicePanel = useCallback(async (currentBooking) => {
		// Always start with the locked base service row
		const baseItem = {
			description: `${currentBooking.serviceType?.name} – Base Service`,
			quantity: 1,
			unitPrice: String(currentBooking.serviceType?.bookedBasePrice ?? currentBooking.serviceType?.basePrice ?? ''),
			locked: true,
		};

		// Pre-fetch mechanic work log — map to editable invoice rows
		let workLogRows = [];
		try {
			const workLog = await adminBookingService.getWorkLog(currentBooking.id);
			workLogRows = (workLog || []).map((item) => ({
				description: item.description,
				quantity: item.quantity,
				unitPrice: String(item.unitCost),
				locked: false,
			}));
		} catch {
			// Work log fetch failure is non-blocking — admin can add items manually
		}

		// Base item first, then mechanic work log rows, then one blank row
		setInvoiceItems([baseItem, ...workLogRows, { description: '', quantity: 1, unitPrice: '' }]);
		setPanel('invoice');
	}, []);

	// ── Actions ───────────────────────────────────────────────────────────────

	const handleConfirm = async () => {
		try {
			setSubmitting(true);
			await adminBookingService.confirm(id, { notes: actionNotes });
			toastSuccess('Booking confirmed');
			setPanel(null);
			setActionNotes('');
		} catch (e) {
			toastError(e.message || 'Failed');
		} finally {
			setSubmitting(false);
			load();
		}
	};

	const handleAssign = async () => {
		if (!selectedMechanic) {
			toastError('Please select a mechanic');
			return;
		}
		try {
			setSubmitting(true);
			await adminBookingService.assignMechanic(id, { mechanicId: selectedMechanic, notes: actionNotes });
			toastSuccess('Mechanic assigned');
			setPanel(null);
			setActionNotes('');
			setSelectedMechanic('');
		} catch (e) {
			toastError(e.message || 'Failed');
		} finally {
			setSubmitting(false);
			load();
		}
	};

	const handleReassign = async () => {
		if (!selectedMechanic) {
			toastError('Please select a mechanic');
			return;
		}
		try {
			setSubmitting(true);
			await adminBookingService.reassignMechanic(id, { mechanicId: selectedMechanic, notes: actionNotes });
			toastSuccess('Job sent back for rework');
			setPanel(null);
			setActionNotes('');
			setSelectedMechanic('');
		} catch (e) {
			toastError(e.message || 'Failed');
		} finally {
			setSubmitting(false);
			load();
		}
	};

	const handleMarkComplete = async () => {
		try {
			setSubmitting(true);
			await adminBookingService.updateStatus(id, { newStatus: 6, notes: actionNotes });
			toastSuccess('Marked as Completed');
			setPanel(null);
			setActionNotes('');
		} catch (e) {
			toastError(e.message || 'Failed');
		} finally {
			setSubmitting(false);
			load();
		}
	};

	const updateItem = (idx, field, val) => setInvoiceItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: val } : it)));
	const addItem = () => setInvoiceItems((p) => [...p, { description: '', quantity: 1, unitPrice: '' }]);
	const removeItem = (idx) => {
		if (invoiceItems[idx]?.locked) return;
		setInvoiceItems((p) => p.filter((_, i) => i !== idx));
	};

	const subTotal = invoiceItems.reduce((s, it) => s + (parseFloat(it.unitPrice) || 0) * (parseInt(it.quantity) || 0), 0);
	const taxAmt = Math.round(((subTotal * taxRate) / 100) * 100) / 100;
	const total = subTotal + taxAmt;

	const handleGenerateInvoice = async () => {
		const items = invoiceItems.filter((it) => it.description.trim() && it.unitPrice);
		if (!items.length) {
			toastError('Add at least one invoice item');
			return;
		}
		try {
			setSubmitting(true);
			await invoiceService.generate({
				bookingId: id,
				taxRate,
				items: items.map((it) => ({
					description: it.description,
					quantity: parseInt(it.quantity) || 1,
					unitPrice: parseFloat(it.unitPrice),
				})),
			});
			toastSuccess('Invoice generated and sent to customer');
			await load();
			setPanel(null);
		} catch (e) {
			toastError(e.message || 'Failed to generate invoice');
		} finally {
			setSubmitting(false);
		}
	};

	// ── Render ────────────────────────────────────────────────────────────────

	if (loading) return <div className="abd-loading">Loading…</div>;
	if (!booking) return <div className="abd-loading">Booking not found.</div>;

	const raw = booking.statusLabel?.replace(/ /g, '');
	const canConfirm = raw === 'Pending';
	const canAssign = raw === 'Confirmed';
	const canReassign = raw === 'QualityCheck';
	const canComplete = raw === 'QualityCheck';
	const canInvoice = raw === 'Completed';
	const hasInvoice = raw === 'InvoiceGenerated' || raw === 'Paid';
	const isDone = ['InvoiceGenerated', 'Paid', 'Cancelled'].includes(raw);

	return (
		<div className="abd-page">
			<div className="abd-header">
				<button className="sd-btn sd-btn--ghost" onClick={() => navigate('/admin/bookings')}>
					← Back
				</button>
				<h1 className="abd-header__title">Booking Details</h1>
			</div>

			<ProgressBar statusLabel={booking.statusLabel} />

			<div className="abd-layout">
				<div className="abd-main">
					<div className="abd-card">
						<div className="abd-card__row">
							<h2 className="abd-card__heading">{booking.serviceType?.name}</h2>
							<StatusBadge status={booking.statusLabel} />
						</div>

						<div className="abd-info-grid">
							<div className="abd-info-item">
								<span className="abd-info-label">Customer</span>
								<span className="abd-info-value">{booking.customerName}</span>
								<span className="abd-info-sub">{booking.customerEmail}</span>
							</div>
							<div className="abd-info-item">
								<span className="abd-info-label">Vehicle</span>
								<span className="abd-info-value">
									{booking.vehicle?.make} {booking.vehicle?.model} ({booking.vehicle?.year})
								</span>
								<span className="abd-info-sub">{booking.vehicle?.licensePlate}</span>
							</div>
							<div className="abd-info-item">
								<span className="abd-info-label">Scheduled</span>
								<span className="abd-info-value">{fmtDate(booking.scheduledDate)}</span>
							</div>
							<div className="abd-info-item">
								<span className="abd-info-label">Base Price (at booking)</span>
								<span className="abd-info-value">
									₹{booking.serviceType?.bookedBasePrice ?? booking.serviceType?.basePrice}
								</span>
							</div>
							{booking.assignedMechanicName && (
								<div className="abd-info-item">
									<span className="abd-info-label">Mechanic</span>
									<span className="abd-info-value">{booking.assignedMechanicName}</span>
								</div>
							)}
							<div className="abd-info-item">
								<span className="abd-info-label">Booked on</span>
								<span className="abd-info-value">{fmtDate(booking.createdAt)}</span>
							</div>
						</div>

						{booking.customerNotes && (
							<div className="abd-notes">
								<span className="abd-notes__label">Customer notes</span>
								<p className="abd-notes__text">{booking.customerNotes}</p>
							</div>
						)}

						{/* Action buttons */}
						<div className="abd-actions">
							{!isDone && (
								<>
									{canConfirm && (
										<button className="sd-btn sd-btn--primary" onClick={() => setPanel('confirm')}>
											✅ Confirm Booking
										</button>
									)}
									{canAssign && (
										<button className="sd-btn sd-btn--primary" onClick={() => setPanel('assign')}>
											🔧 Assign Mechanic
										</button>
									)}
									{canReassign && (
										<button
											className="sd-btn sd-btn--warning"
											onClick={() => {
												setSelectedMechanic(booking.assignedMechanicId || '');
												setPanel('reassign');
											}}
										>
											↩ Send Back for Rework
										</button>
									)}
									{canComplete && (
										<button className="sd-btn sd-btn--primary" onClick={() => setPanel('complete')}>
											✔️ Mark as Completed
										</button>
									)}
									{canInvoice && (
										<button className="sd-btn sd-btn--primary" onClick={() => openInvoicePanel(booking)}>
											🧾 Generate Invoice
										</button>
									)}
								</>
							)}

							{/* View / Download — visible for InvoiceGenerated and Paid */}
							{hasInvoice && (
								<>
									<button className="sd-btn sd-btn--secondary" onClick={openViewInvoice}>
										🧾 View Invoice
									</button>
									<button
										className="sd-btn sd-btn--ghost"
										onClick={async () => {
											if (invoiceData) {
												downloadInvoice(invoiceData, booking);
											} else {
												try {
													const data = await invoiceService.getByBookingIdAdmin(id);
													setInvoiceData(data);
													downloadInvoice(data, booking);
												} catch {
													toastError('Failed to load invoice for download');
												}
											}
										}}
									>
										⬇️ Download Invoice
									</button>
								</>
							)}
						</div>

						{raw === 'InvoiceGenerated' && (
							<div className="abd-info-banner abd-info-banner--info">
								🧾 Invoice has been generated and sent to the customer.
							</div>
						)}
						{raw === 'Paid' && (
							<div className="abd-info-banner abd-info-banner--success">✅ Invoice paid. This booking is complete.</div>
						)}
					</div>
				</div>

				{/* Timeline */}
				<div className="abd-side">
					<div className="abd-card">
						<h3 className="abd-card__heading">Status Timeline</h3>
						<div className="abd-timeline">
							{(booking.statusHistory || []).map((h, i) => {
								const sm = STATUS_META[h.statusLabel?.replace(/ /g, '')] || STATUS_META[h.statusLabel] || {};
								return (
									<div key={i} className="abd-tl-item">
										<div className="abd-tl-item__dot" style={{ background: sm.dot || '#9ca3af' }} />
										<div className="abd-tl-item__body">
											<span className="abd-tl-item__label">{h.statusLabel}</span>
											<span className="abd-tl-item__role">{h.changedByRole}</span>
											{h.notes && <p className="abd-tl-item__notes">{h.notes}</p>}
											<span className="abd-tl-item__time">{fmtDateTime(h.changedAt)}</span>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>

			{/* ── Confirm drawer ── */}
			<SideDrawer isOpen={panel === 'confirm'} onClose={() => setPanel(null)} title="Confirm Booking" disabled={submitting}>
				<div className="sd-form">
					<div className="sd-field">
						<label className="sd-label">Notes (optional)</label>
						<textarea
							className="sd-input sd-textarea"
							rows={3}
							value={actionNotes}
							onChange={(e) => setActionNotes(e.target.value)}
						/>
					</div>
					<div className="sd-footer">
						<button className="sd-btn sd-btn--ghost" onClick={() => setPanel(null)} disabled={submitting}>
							Cancel
						</button>
						<button className="sd-btn sd-btn--primary" onClick={handleConfirm} disabled={submitting}>
							{submitting ? 'Confirming…' : '✅ Confirm'}
						</button>
					</div>
				</div>
			</SideDrawer>

			{/* ── Assign drawer ── */}
			<SideDrawer isOpen={panel === 'assign'} onClose={() => setPanel(null)} title="Assign Mechanic" disabled={submitting}>
				<div className="sd-form">
					<div className="sd-field">
						<label className="sd-label">
							Select Mechanic <span className="sd-req">*</span>
						</label>
						<select className="sd-input" value={selectedMechanic} onChange={(e) => setSelectedMechanic(e.target.value)}>
							<option value="">— choose mechanic —</option>
							{mechanics.map((m) => (
								<option key={m.id} value={m.id}>
									{m.name} ({m.email})
								</option>
							))}
						</select>
					</div>
					<div className="sd-field">
						<label className="sd-label">Notes (optional)</label>
						<textarea
							className="sd-input sd-textarea"
							rows={3}
							value={actionNotes}
							onChange={(e) => setActionNotes(e.target.value)}
						/>
					</div>
					<div className="sd-footer">
						<button className="sd-btn sd-btn--ghost" onClick={() => setPanel(null)} disabled={submitting}>
							Cancel
						</button>
						<button className="sd-btn sd-btn--primary" onClick={handleAssign} disabled={submitting}>
							{submitting ? 'Assigning…' : '🔧 Assign'}
						</button>
					</div>
				</div>
			</SideDrawer>

			{/* ── Reassign drawer ── */}
			<SideDrawer
				isOpen={panel === 'reassign'}
				onClose={() => {
					setPanel(null);
					setSelectedMechanic('');
					setActionNotes('');
				}}
				title="Send Back for Rework"
				disabled={submitting}
			>
				<div className="sd-form">
					<div className="abd-info-banner abd-info-banner--warning" style={{ marginBottom: '1rem' }}>
						⚠️ This will send the job back from Quality Check to the selected mechanic for further work.
					</div>
					<div className="sd-field">
						<label className="sd-label">
							Assign to Mechanic <span className="sd-req">*</span>
						</label>
						<select className="sd-input" value={selectedMechanic} onChange={(e) => setSelectedMechanic(e.target.value)}>
							<option value="">— choose mechanic —</option>
							{mechanics.map((m) => (
								<option key={m.id} value={m.id}>
									{m.name} ({m.email}){m.id === booking.assignedMechanicId ? ' (current)' : ''}
								</option>
							))}
						</select>
					</div>
					<div className="sd-field">
						<label className="sd-label">
							Reason / Notes <span className="sd-req">*</span>
						</label>
						<textarea
							className="sd-input sd-textarea"
							rows={4}
							placeholder="e.g. Brake noise still present. Please re-check front left caliper."
							value={actionNotes}
							onChange={(e) => setActionNotes(e.target.value)}
						/>
					</div>
					<div className="sd-footer">
						<button
							className="sd-btn sd-btn--ghost"
							onClick={() => {
								setPanel(null);
								setSelectedMechanic('');
								setActionNotes('');
							}}
							disabled={submitting}
						>
							Cancel
						</button>
						<button className="sd-btn sd-btn--warning" onClick={handleReassign} disabled={submitting || !selectedMechanic}>
							{submitting ? 'Sending back…' : '↩ Send Back'}
						</button>
					</div>
				</div>
			</SideDrawer>

			{/* ── Mark complete drawer ── */}
			<SideDrawer isOpen={panel === 'complete'} onClose={() => setPanel(null)} title="Mark as Completed" disabled={submitting}>
				<div className="sd-form">
					<div className="abd-info-banner abd-info-banner--info" style={{ marginBottom: '1rem' }}>
						This will mark the booking as Completed. You can then generate an invoice.
					</div>
					<div className="sd-field">
						<label className="sd-label">Notes (optional)</label>
						<textarea
							className="sd-input sd-textarea"
							rows={3}
							value={actionNotes}
							onChange={(e) => setActionNotes(e.target.value)}
						/>
					</div>
					<div className="sd-footer">
						<button className="sd-btn sd-btn--ghost" onClick={() => setPanel(null)} disabled={submitting}>
							Cancel
						</button>
						<button className="sd-btn sd-btn--primary" onClick={handleMarkComplete} disabled={submitting}>
							{submitting ? 'Saving…' : '✔️ Mark Complete'}
						</button>
					</div>
				</div>
			</SideDrawer>

			{/* ── Generate invoice drawer ── */}
			<SideDrawer isOpen={panel === 'invoice'} onClose={() => setPanel(null)} title="Generate Invoice" disabled={submitting}>
				<div className="sd-form">
					<div className="sd-section-label">Line Items</div>
					<p className="sd-hint" style={{ marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--muted-text-color)' }}>
						🔒 The base service charge is locked at the price agreed when the customer booked. Pre-filled rows below are from
						the mechanic&apos;s work log — you can edit or remove them before generating.
					</p>
					{invoiceItems.map((item, i) => (
						<InvoiceItemRow key={i} item={item} idx={i} onChange={updateItem} onRemove={removeItem} locked={!!item.locked} />
					))}
					<button type="button" className="inv-add-btn" onClick={addItem}>
						+ Add Item
					</button>
					<div className="sd-divider">
						<span>Tax</span>
					</div>
					<div className="sd-field">
						<label className="sd-label">GST Rate (%)</label>
						<input
							className="sd-input"
							type="number"
							min={0}
							max={100}
							value={taxRate}
							onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
						/>
					</div>
					<div className="inv-totals">
						<div className="inv-totals__row">
							<span>Subtotal</span>
							<span>₹{subTotal.toFixed(2)}</span>
						</div>
						<div className="inv-totals__row">
							<span>GST ({taxRate}%)</span>
							<span>₹{taxAmt.toFixed(2)}</span>
						</div>
						<div className="inv-totals__row inv-totals__row--total">
							<span>Total</span>
							<span>₹{total.toFixed(2)}</span>
						</div>
					</div>
					<div className="sd-footer">
						<button className="sd-btn sd-btn--ghost" onClick={() => setPanel(null)} disabled={submitting}>
							Cancel
						</button>
						<button className="sd-btn sd-btn--primary" onClick={handleGenerateInvoice} disabled={submitting}>
							{submitting ? 'Generating…' : '🧾 Generate & Send'}
						</button>
					</div>
				</div>
			</SideDrawer>

			{/* ── View Invoice drawer ── */}
			<SideDrawer isOpen={panel === 'view-invoice'} onClose={() => setPanel(null)} title="Invoice Details">
				<div className="sd-form">
					{invoiceLoading ? (
						<div className="inv-detail-loading">Loading invoice…</div>
					) : (
						<InvoiceDetailPanel invoice={invoiceData} booking={booking} />
					)}
					{invoiceData && (
						<div className="sd-footer" style={{ marginTop: '1.5rem' }}>
							<button className="sd-btn sd-btn--ghost" onClick={() => setPanel(null)}>
								Close
							</button>
							<button className="sd-btn sd-btn--primary" onClick={() => downloadInvoice(invoiceData, booking)}>
								⬇️ Download PDF
							</button>
						</div>
					)}
				</div>
			</SideDrawer>
		</div>
	);
}
