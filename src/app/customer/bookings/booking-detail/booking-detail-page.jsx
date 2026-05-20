import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import vehicleService from '../../../../app-core/services/vehicle-service';
import { bookingService, serviceTypeService } from '../../../../app-core/services/booking-service';
import { toastError, toastSuccess } from '../../../../app-core/services/toast-service';
import './booking-details-page.scss';
import SideDrawer from '../../../../shared/components/side-drawer/side-drawer';
import { normalizeStatusKey } from '../../../../shared/utils/status';

const normalise = normalizeStatusKey;

const TODAY = new Date().toISOString().split('T')[0];

export default function BookingDetailsPage() {
	const { id } = useParams();
	const navigate = useNavigate();

	const [booking, setBooking] = useState(null);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);

	const [editOpen, setEditOpen] = useState(false);
	const [showCancel, setShowCancel] = useState(false);

	const [vehicles, setVehicles] = useState([]);
	const [services, setServices] = useState([]);

	const [form, setForm] = useState({ vehicleId: '', serviceTypeId: '', date: '', notes: '' });

	useEffect(() => {
		loadBooking();
		loadMeta();
	}, [id]);

	const loadBooking = async () => {
		try {
			const data = await bookingService.getById(id);
			setBooking(data);
			setForm({
				vehicleId: data.vehicle.id,
				serviceTypeId: data.serviceType.id,
				date: data.scheduledDate.split('T')[0],
				notes: data.customerNotes || '',
			});
		} catch {
			toastError('Failed to load booking');
		} finally {
			setLoading(false);
		}
	};

	const loadMeta = async () => {
		try {
			const [v, s] = await Promise.all([vehicleService.getAll(), serviceTypeService.getAll()]);
			setVehicles(v || []);
			setServices(s || []);
		} catch {
			toastError('Failed to load form data');
		}
	};

	const raw = normalise(booking?.statusLabel);
	const isPending = raw === 'Pending';
	const isPaid = raw === 'Paid';
	const isInvoiceGenerated = raw === 'InvoiceGenerated';

	const handleUpdate = async (e) => {
		e.preventDefault();
		try {
			setSubmitting(true);
			const updated = await bookingService.update(id, {
				vehicleId: form.vehicleId,
				serviceTypeId: form.serviceTypeId,
				scheduledDate: form.date,
				customerNotes: form.notes,
			});
			setBooking(updated);
			setEditOpen(false);
			toastSuccess('Booking updated');
		} catch (e) {
			toastError(e.message || 'Update failed');
		} finally {
			setSubmitting(false);
		}
	};

	const handleCancel = async () => {
		try {
			setSubmitting(true);
			await bookingService.cancel(id);
			toastSuccess('Booking cancelled');
			setBooking((prev) => ({ ...prev, statusLabel: 'Cancelled' }));
			setShowCancel(false);
		} catch (e) {
			toastError(e.message || 'Cancel failed');
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) return <p className="bd-loading">Loading...</p>;
	if (!booking) return <p>Booking not found</p>;

	return (
		<div className="bd-page">
			<div className="bd-header">
				<button className="sd-btn sd-btn--ghost" onClick={() => navigate('/customer/bookings')}>
					← Back
				</button>
				<h1>Booking Details</h1>
			</div>

			<div className="bd-card">
				{/* Status row — badge separate from action buttons */}
				<div className="bd-status-row">
					<span className={`bd-status bd-status--${raw.toLowerCase()}`}>{booking.statusLabel}</span>

					{/* Invoice actions shown clearly outside the badge */}
					{isInvoiceGenerated && (
						<button
							className="sd-btn sd-btn--primary"
							style={{ fontSize: '0.8rem', padding: '6px 14px' }}
							onClick={() => navigate('/customer/invoices')}
						>
							💳 Pay Invoice
						</button>
					)}
					{isPaid && (
						<button
							className="sd-btn sd-btn--ghost"
							style={{ fontSize: '0.8rem', padding: '6px 14px' }}
							onClick={() => navigate('/customer/invoices')}
						>
							🧾 View Invoice
						</button>
					)}
				</div>

				<h2>
					{booking.vehicle.make} {booking.vehicle.model}
				</h2>
				<p>{booking.serviceType.name}</p>

				<div className="bd-grid">
					<div>
						<strong>Date:</strong>{' '}
						{new Date(booking.scheduledDate).toLocaleDateString('en-IN', {
							day: '2-digit',
							month: 'short',
							year: 'numeric',
						})}
					</div>
					<div>
						<strong>Plate:</strong> {booking.vehicle.licensePlate}
					</div>
					<div>
						<strong>Fuel:</strong> {booking.vehicle.fuelType}
					</div>
					<div>
						<strong>Price (at booking):</strong> ₹{booking.serviceType.bookedBasePrice ?? booking.serviceType.basePrice}
					</div>
				</div>

				{booking.customerNotes && <p className="bd-notes">💬 {booking.customerNotes}</p>}

				{isPending && (
					<div className="bd-actions">
						<button className="sd-btn sd-btn--primary" onClick={() => setEditOpen(true)}>
							✏️ Edit
						</button>
						<button className="sd-btn sd-btn--danger" onClick={() => setShowCancel(true)}>
							❌ Cancel
						</button>
					</div>
				)}
			</div>

			{/* Edit drawer */}
			<SideDrawer isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Booking" disabled={submitting}>
				<form className="sd-form" onSubmit={handleUpdate}>
					<div className="sd-field">
						<label className="sd-label">Vehicle</label>
						<select
							className="sd-input"
							value={form.vehicleId}
							onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
						>
							{vehicles.map((v) => (
								<option key={v.id} value={v.id}>
									{v.make} {v.model} ({v.licensePlate})
								</option>
							))}
						</select>
					</div>

					<div className="sd-field">
						<label className="sd-label">Service Type</label>
						<select
							className="sd-input"
							value={form.serviceTypeId}
							onChange={(e) => setForm({ ...form, serviceTypeId: e.target.value })}
						>
							{services.map((s) => (
								<option key={s.id} value={s.id}>
									{s.name} (₹{s.basePrice})
								</option>
							))}
						</select>
					</div>

					<div className="sd-field">
						<label className="sd-label">Scheduled Date</label>
						<input
							type="date"
							className="sd-input"
							min={TODAY}
							value={form.date}
							onChange={(e) => setForm({ ...form, date: e.target.value })}
						/>
					</div>

					<div className="sd-field">
						<label className="sd-label">Notes</label>
						<textarea
							className="sd-input"
							rows={4}
							placeholder="Describe any issues or requests..."
							value={form.notes}
							onChange={(e) => setForm({ ...form, notes: e.target.value })}
						/>
					</div>

					<div className="sd-footer">
						<button type="button" className="sd-btn sd-btn--ghost" onClick={() => setEditOpen(false)} disabled={submitting}>
							Cancel
						</button>
						<button type="submit" className="sd-btn sd-btn--primary" disabled={submitting}>
							{submitting ? 'Saving...' : 'Update Booking'}
						</button>
					</div>
				</form>
			</SideDrawer>

			{/* Cancel confirm modal */}
			{showCancel && (
				<div className="bd-modal-overlay">
					<div className="bd-modal">
						<h3>Cancel Booking?</h3>
						<p>This cannot be undone. Only pending bookings can be cancelled.</p>
						<div className="bd-modal-actions">
							<button className="sd-btn sd-btn--ghost" onClick={() => setShowCancel(false)} disabled={submitting}>
								No, Keep It
							</button>
							<button className="sd-btn sd-btn--danger" onClick={handleCancel} disabled={submitting}>
								{submitting ? 'Cancelling...' : 'Yes, Cancel'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
