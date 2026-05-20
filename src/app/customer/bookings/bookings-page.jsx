import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../../../app-core/services/booking-service';
import { toastError, toastSuccess } from '../../../app-core/services/toast-service';
import StatusBadgeBase from '../../../shared/components/status-badge/status-badge';
import {
	COMPLETED_BOOKING_STATUSES,
	CUSTOMER_ACTIVE_BOOKING_STATUSES,
	CUSTOMER_BOOKING_FILTERS,
} from '../../../shared/data-modals/booking-status';
import { normalizeStatusKey } from '../../../shared/utils/status';
import './bookings-page.scss';

// ─── Constants ────────────────────────────────────────────────────────────────

// statusLabel from backend comes with spaces e.g. "Assigned to Mechanic"
// normalise by stripping spaces for map lookup
const normalise = normalizeStatusKey;

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge = memo(function StatusBadge({ statusLabel }) {
	return (
		<StatusBadgeBase className="bp-badge" status={statusLabel} showDot={false}>
			{statusLabel}
		</StatusBadgeBase>
	);
});

const CancelModal = memo(function CancelModal({ booking, onConfirm, onCancel, submitting }) {
	return (
		<div className="vd-overlay">
			<div className="vd-modal">
				<div className="vd-modal__icon">⚠️</div>
				<h3 className="vd-modal__title">Cancel Booking?</h3>
				<p className="vd-modal__body">
					Cancel <strong>{booking.serviceType?.name}</strong> for{' '}
					<strong>
						{booking.vehicle?.make} {booking.vehicle?.model}
					</strong>
					?
					<br />
					<small>Only pending bookings can be cancelled.</small>
				</p>
				<div className="vd-modal__actions">
					<button className="sd-btn sd-btn--ghost" onClick={onCancel} disabled={submitting}>
						Keep
					</button>
					<button className="sd-btn sd-btn--danger" onClick={onConfirm} disabled={submitting}>
						{submitting ? 'Cancelling...' : 'Yes, Cancel'}
					</button>
				</div>
			</div>
		</div>
	);
});

const SkeletonCard = memo(function SkeletonCard() {
	return (
		<div className="bp-card bp-card--skeleton">
			<div className="sk-box" style={{ width: '50%', height: 16, marginBottom: 8 }} />
			<div className="sk-box" style={{ width: '35%', height: 12, marginBottom: 16 }} />
			<div className="sk-box" style={{ width: '100%', height: 12, marginBottom: 6 }} />
			<div className="sk-box" style={{ width: '60%', height: 12 }} />
		</div>
	);
});

// ─── Main Page ────────────────────────────────────────────────────────────────

const BookingsPage = () => {
	const navigate = useNavigate();
	const [bookings, setBookings] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState('all');
	const [cancelTarget, setCancelTarget] = useState(null);
	const [submitting, setSubmitting] = useState(false);

	const loadBookings = useCallback(async () => {
		try {
			setLoading(true);
			const data = await bookingService.getAll();
			setBookings(data || []);
		} catch {
			toastError('Failed to load bookings');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadBookings();
	}, [loadBookings]);

	const handleCancel = useCallback(async () => {
		try {
			setSubmitting(true);
			await bookingService.cancel(cancelTarget.id);
			setBookings((prev) => prev.map((b) => (b.id === cancelTarget.id ? { ...b, statusLabel: 'Cancelled' } : b)));
			toastSuccess('Booking cancelled');
			setCancelTarget(null);
		} catch (e) {
			toastError(e.message || 'Failed to cancel booking');
		} finally {
			setSubmitting(false);
		}
	}, [cancelTarget]);

	const filterCounts = useMemo(
		() => ({
			all: bookings.length,
			active: bookings.filter((b) => CUSTOMER_ACTIVE_BOOKING_STATUSES.includes(normalise(b.statusLabel))).length,
			completed: bookings.filter((b) => COMPLETED_BOOKING_STATUSES.includes(normalise(b.statusLabel))).length,
			cancelled: bookings.filter((b) => normalise(b.statusLabel) === 'Cancelled').length,
		}),
		[bookings]
	);

	const filtered = useMemo(
		() =>
			bookings.filter((b) => {
				const raw = normalise(b.statusLabel);
				if (filter === 'active') return CUSTOMER_ACTIVE_BOOKING_STATUSES.includes(raw);
				if (filter === 'completed') return COMPLETED_BOOKING_STATUSES.includes(raw);
				if (filter === 'cancelled') return raw === 'Cancelled';
				return true;
			}),
		[bookings, filter]
	);

	return (
		<div className="dashboard-page">
			<section className="page-hero compact">
				<div>
					<p className="page-kicker">Bookings</p>
					<h1>Service Schedule</h1>
					<p>
						{bookings.length} booking{bookings.length !== 1 ? 's' : ''} total
					</p>
				</div>
				<button className="vp-add-btn" onClick={() => navigate('/customer/bookings/new')}>
					+ New Booking
				</button>
			</section>

			<div className="bp-filters">
				{CUSTOMER_BOOKING_FILTERS.map((f) => (
					<button
						key={f.key}
						className={`bp-filter-btn ${filter === f.key ? 'bp-filter-btn--active' : ''}`}
						onClick={() => setFilter(f.key)}
					>
						{f.label}
						{!loading && <span className="bp-filter-count">{filterCounts[f.key] ?? 0}</span>}
					</button>
				))}
			</div>

			<div className="bp-list">
				{loading ? (
					Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
				) : filtered.length === 0 ? (
					<div className="empty-panel">
						<div className="empty-panel-icon">📋</div>
						<h2>{filter === 'all' ? 'No bookings yet' : `No ${filter} bookings`}</h2>
						<p>{filter === 'all' ? 'Book a service to get started.' : `You have no ${filter} bookings right now.`}</p>
					</div>
				) : (
					filtered.map((b) => {
						const raw = normalise(b.statusLabel);
						const isPending = raw === 'Pending';
						const isPaid = raw === 'Paid';
						const isInvoiceGenerated = raw === 'InvoiceGenerated';

						return (
							<div key={b.id} className="bp-card" onClick={() => navigate(`/customer/bookings/${b.id}`)}>
								<div className="bp-card__top">
									<div className="bp-card__info">
										<h3 className="bp-card__service">{b.serviceType?.name}</h3>
										<p className="bp-card__vehicle">
											{b.vehicle?.make} {b.vehicle?.model} · {b.vehicle?.year} · {b.vehicle?.licensePlate}
										</p>
									</div>
									<StatusBadge statusLabel={b.statusLabel} />
								</div>

								<div className="bp-card__meta">
									<span>📅 {new Date(b.scheduledDate).toLocaleDateString('en-IN')}</span>
									<span>⛽ {b.vehicle?.fuelType}</span>
									{b.serviceType?.bookedBasePrice ? (
										<span>₹{b.serviceType.bookedBasePrice}</span>
									) : (
										b.serviceType?.basePrice && <span>₹{b.serviceType.basePrice}</span>
									)}
								</div>

								{b.customerNotes && <p className="bp-card__notes">💬 {b.customerNotes}</p>}

								<div className="bp-card__footer" onClick={(e) => e.stopPropagation()}>
									<button className="bp-view-btn" onClick={() => navigate(`/customer/bookings/${b.id}`)}>
										View Details →
									</button>

									{/* Show invoice button when invoice is ready or paid */}
									{(isInvoiceGenerated || isPaid) && (
										<button
											className="bp-invoice-btn"
											onClick={(e) => {
												e.stopPropagation();
												navigate('/customer/invoices');
											}}
										>
											🧾 {isPaid ? 'View Invoice' : 'Pay Invoice'}
										</button>
									)}

									{isPending && (
										<button
											className="bp-cancel-btn"
											onClick={(e) => {
												e.stopPropagation();
												setCancelTarget(b);
											}}
										>
											Cancel
										</button>
									)}
								</div>
							</div>
						);
					})
				)}
			</div>

			{cancelTarget && (
				<CancelModal
					booking={cancelTarget}
					onConfirm={handleCancel}
					onCancel={() => !submitting && setCancelTarget(null)}
					submitting={submitting}
				/>
			)}
		</div>
	);
};

export default BookingsPage;
