import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminBookingService } from '../../../app-core/services/admin-booking-service';
import { toastError } from '../../../app-core/services/toast-service';
import StatusBadgeBase from '../../../shared/components/status-badge/status-badge';
import { ADMIN_ACTIVE_BOOKING_STATUSES, ADMIN_BOOKING_FILTERS } from '../../../shared/data-modals/booking-status';
import { formatDateIN } from '../../../shared/utils/date-formatters';
import { normalizeStatusKey } from '../../../shared/utils/status';
import './admin-bookings-page.scss';

function StatusBadge({ status }) {
	return <StatusBadgeBase className="abp-badge" dotClassName="abp-badge__dot" status={status} variant="compact" />;
}

function SkeletonCard() {
	return (
		<div className="abp-card abp-card--skeleton">
			<div className="sk" style={{ width: '45%', height: 14, marginBottom: 8 }} />
			<div className="sk" style={{ width: '30%', height: 11, marginBottom: 16 }} />
			<div className="sk" style={{ width: '100%', height: 11, marginBottom: 6 }} />
			<div className="sk" style={{ width: '60%', height: 11 }} />
		</div>
	);
}

export default function AdminBookingsPage() {
	const navigate = useNavigate();
	const [bookings, setBookings] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState('all');

	const load = useCallback(async () => {
		try {
			setLoading(true);
			const data = await adminBookingService.getAll();
			setBookings(data || []);
		} catch {
			toastError('Failed to load bookings');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const filtered = useMemo(
		() =>
			bookings.filter((booking) => {
				if (filter === 'all') return true;

				const statusKey = normalizeStatusKey(booking.statusLabel);

				if (filter === 'active') return ADMIN_ACTIVE_BOOKING_STATUSES.includes(statusKey);

				return statusKey === filter || booking.statusLabel === ADMIN_BOOKING_FILTERS.find((item) => item.key === filter)?.label;
			}),
		[bookings, filter]
	);

	const filterCounts = useMemo(() => {
		const counts = { all: bookings.length };

		ADMIN_BOOKING_FILTERS.forEach(({ key, label }) => {
			if (key === 'all') return;

			if (key === 'active') {
				counts[key] = bookings.filter((booking) =>
					ADMIN_ACTIVE_BOOKING_STATUSES.includes(normalizeStatusKey(booking.statusLabel))
				).length;
				return;
			}

			counts[key] = bookings.filter(
				(booking) => booking.statusLabel === label || normalizeStatusKey(booking.statusLabel) === key
			).length;
		});

		return counts;
	}, [bookings]);

	return (
		<div className="dashboard-page">
			<section className="page-hero compact">
				<div>
					<p className="page-kicker">Admin</p>
					<h1>All Bookings</h1>
					<p>
						{bookings.length} booking{bookings.length !== 1 ? 's' : ''} total
					</p>
				</div>
			</section>

			<div className="abp-filters">
				{ADMIN_BOOKING_FILTERS.map((item) => (
					<button
						key={item.key}
						className={`abp-filter-btn ${filter === item.key ? 'abp-filter-btn--active' : ''}`}
						onClick={() => setFilter(item.key)}
					>
						{item.label}
						{!loading && <span className="abp-filter-count">{filterCounts[item.key] ?? 0}</span>}
					</button>
				))}
			</div>

			<div className="abp-list">
				{loading ? (
					Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
				) : filtered.length === 0 ? (
					<div className="empty-panel">
						<div className="empty-panel-icon">📋</div>
						<h2>No bookings</h2>
						<p>No bookings match this filter.</p>
					</div>
				) : (
					filtered.map((booking) => (
						<div key={booking.id} className="abp-card" onClick={() => navigate(`/admin/bookings/${booking.id}`)}>
							<div className="abp-card__top">
								<div className="abp-card__info">
									<h3 className="abp-card__service">{booking.serviceType?.name}</h3>
									<p className="abp-card__customer">
										👤 {booking.customerName || 'Customer'} · {booking.customerEmail}
									</p>
									<p className="abp-card__vehicle">
										🚗 {booking.vehicle?.make} {booking.vehicle?.model} · {booking.vehicle?.licensePlate}
									</p>
								</div>
								<StatusBadge status={booking.statusLabel} />
							</div>

							<div className="abp-card__meta">
								<span>📅 {formatDateIN(booking.scheduledDate)}</span>
								{booking.assignedMechanicName && <span>🔧 {booking.assignedMechanicName}</span>}
								<span>₹{booking.serviceType?.basePrice}</span>
							</div>

							<div className="abp-card__footer" onClick={(event) => event.stopPropagation()}>
								<button className="abp-view-btn" onClick={() => navigate(`/admin/bookings/${booking.id}`)}>
									Manage →
								</button>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
