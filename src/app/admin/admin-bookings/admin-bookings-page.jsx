import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './admin-bookings-page.scss';
import { adminBookingService } from '../../../app-core/services/admin-booking-service';
import { toastError } from '../../../app-core/services/toast-service';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_META = {
	Pending: { bg: '#fff7ed', color: '#c2410c', dot: '#f97316', label: 'Pending' },
	Confirmed: { bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6', label: 'Confirmed' },
	AssignedToMechanic: { bg: '#f0f9ff', color: '#0369a1', dot: '#0ea5e9', label: 'Assigned' },
	InProgress: { bg: '#fefce8', color: '#a16207', dot: '#eab308', label: 'In Progress' },
	WaitingForParts: { bg: '#fdf4ff', color: '#7e22ce', dot: '#a855f7', label: 'Waiting Parts' },
	QualityCheck: { bg: '#fff7ed', color: '#c2410c', dot: '#f97316', label: 'Quality Check' },
	Completed: { bg: '#f0fdf4', color: '#15803d', dot: '#22c55e', label: 'Completed' },
	InvoiceGenerated: { bg: '#fefce8', color: '#854d0e', dot: '#f59e0b', label: 'Invoice Sent' },
	Paid: { bg: '#f0fdf4', color: '#15803d', dot: '#22c55e', label: 'Paid' },
	Cancelled: { bg: '#fef2f2', color: '#991b1b', dot: '#ef4444', label: 'Cancelled' },
};

const FILTERS = [
	{ key: 'all', label: 'All' },
	{ key: 'Pending', label: 'Pending' },
	{ key: 'Confirmed', label: 'Confirmed' },
	{ key: 'active', label: 'In Progress' },
	{ key: 'Completed', label: 'Completed' },
	{ key: 'Paid', label: 'Paid' },
];

const ACTIVE_STATUSES = ['AssignedToMechanic', 'InProgress', 'WaitingForParts', 'QualityCheck'];

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
	const m = STATUS_META[status] || { bg: '#f3f4f6', color: '#374151', dot: '#9ca3af', label: status };
	return (
		<span className="abp-badge" style={{ background: m.bg, color: m.color }}>
			<span className="abp-badge__dot" style={{ background: m.dot }} />
			{m.label}
		</span>
	);
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

// ─── Main Page ────────────────────────────────────────────────────────────────

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

	const filtered = bookings.filter((b) => {
		if (filter === 'all') return true;
		if (filter === 'active') return ACTIVE_STATUSES.includes(b.statusLabel?.replace(/ /g, ''));
		return b.statusLabel?.replace(/ /g, '') === filter || b.statusLabel === FILTERS.find((f) => f.key === filter)?.label;
	});

	const count = (key) => {
		if (key === 'all') return bookings.length;
		if (key === 'active') return bookings.filter((b) => ACTIVE_STATUSES.includes(b.statusLabel?.replace(/ /g, ''))).length;
		const f = FILTERS.find((f) => f.key === key);
		return bookings.filter((b) => b.statusLabel === f?.label || b.statusLabel?.replace(/ /g, '') === key).length;
	};

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

			{/* Filters */}
			<div className="abp-filters">
				{FILTERS.map((f) => (
					<button
						key={f.key}
						className={`abp-filter-btn ${filter === f.key ? 'abp-filter-btn--active' : ''}`}
						onClick={() => setFilter(f.key)}
					>
						{f.label}
						{!loading && <span className="abp-filter-count">{count(f.key)}</span>}
					</button>
				))}
			</div>

			{/* List */}
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
					filtered.map((b) => (
						<div key={b.id} className="abp-card" onClick={() => navigate(`/admin/bookings/${b.id}`)}>
							<div className="abp-card__top">
								<div className="abp-card__info">
									<h3 className="abp-card__service">{b.serviceType?.name}</h3>
									<p className="abp-card__customer">
										👤 {b.customerName || 'Customer'} · {b.customerEmail}
									</p>
									<p className="abp-card__vehicle">
										🚗 {b.vehicle?.make} {b.vehicle?.model} · {b.vehicle?.licensePlate}
									</p>
								</div>
								<StatusBadge status={b.statusLabel?.replace(/ /g, '')} />
							</div>

							<div className="abp-card__meta">
								<span>📅 {fmtDate(b.scheduledDate)}</span>
								{b.assignedMechanicName && <span>🔧 {b.assignedMechanicName}</span>}
								<span>₹{b.serviceType?.basePrice}</span>
							</div>

							<div className="abp-card__footer" onClick={(e) => e.stopPropagation()}>
								<button className="abp-view-btn" onClick={() => navigate(`/admin/bookings/${b.id}`)}>
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
