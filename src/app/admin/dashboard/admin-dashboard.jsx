import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { adminBookingService, invoiceService } from '../../../app-core/services/admin-booking-service';
import { adminCustomerService } from '../../../app-core/services/admin-user-service';
import { toastError } from '../../../app-core/services/toast-service';
import './admin-dashboard.scss';

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

const ACTIVE_STATUSES = ['Pending', 'Confirmed', 'AssignedToMechanic', 'InProgress', 'WaitingForParts', 'QualityCheck'];

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const fmtCurrency = (n) => '₹' + (n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
	const raw = status?.replace(/ /g, '');
	const m = STATUS_META[raw] || STATUS_META[status] || { bg: '#f3f4f6', color: '#374151', dot: '#9ca3af', label: status };
	return (
		<span className="ad-badge" style={{ background: m.bg, color: m.color }}>
			<span className="ad-badge__dot" style={{ background: m.dot }} />
			{m.label}
		</span>
	);
}

function MetricCard({ icon, label, value, sub, accent, onClick }) {
	return (
		<div className={`metric-card ad-metric ${onClick ? 'ad-metric--clickable' : ''}`} style={{ '--accent': accent }} onClick={onClick}>
			<div className="ad-metric__icon">{icon}</div>
			<div className="ad-metric__body">
				<strong className="ad-metric__value">{value ?? '—'}</strong>
				<span className="ad-metric__label">{label}</span>
				{sub && <small className="ad-metric__sub">{sub}</small>}
			</div>
			{onClick && <span className="ad-metric__arrow">→</span>}
		</div>
	);
}

function SkeletonRow() {
	return (
		<div className="ad-row ad-row--skeleton">
			<div className="sk" style={{ width: '40%', height: 13, borderRadius: 4 }} />
			<div className="sk" style={{ width: '25%', height: 11, borderRadius: 4 }} />
			<div className="sk" style={{ width: 68, height: 22, borderRadius: 12 }} />
		</div>
	);
}

function SkeletonMetric() {
	return (
		<div className="metric-card ad-metric">
			<div className="sk" style={{ width: 44, height: 44, borderRadius: '0.65rem', flexShrink: 0 }} />
			<div className="ad-metric__body" style={{ flex: 1 }}>
				<div className="sk" style={{ width: '35%', height: 22, marginBottom: 6 }} />
				<div className="sk" style={{ width: '60%', height: 11 }} />
			</div>
		</div>
	);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
	const navigate = useNavigate();
	const userData = useSelector((s) => s.commonState.loggedUserData);
	const firstName = userData?.user?.firstName || 'Admin';

	const [bookings, setBookings] = useState([]);
	const [invoices, setInvoices] = useState([]);
	const [customers, setCustomers] = useState([]);
	const [loading, setLoading] = useState(true);

	const load = useCallback(async () => {
		setLoading(true);
		await Promise.allSettled([
			adminBookingService
				.getAll()
				.then((d) => setBookings(d || []))
				.catch(() => toastError('Failed to load bookings')),
			invoiceService
				.getAllAdmin()
				.then((d) => setInvoices(d || []))
				.catch(() => {}),
			adminCustomerService
				.getAll()
				.then((d) => setCustomers(d || []))
				.catch(() => {}),
		]);
		setLoading(false);
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	// ── Derived metrics ───────────────────────────────────────────────────────

	const activeBookings = bookings.filter((b) => ACTIVE_STATUSES.includes(b.statusLabel?.replace(/ /g, '')));
	const needsAction = bookings.filter((b) => ['Pending', 'Confirmed', 'QualityCheck'].includes(b.statusLabel?.replace(/ /g, ''))).length;

	const paidInvoices = invoices.filter((i) => i.statusLabel === 'Paid');
	const unpaidInvoices = invoices.filter((i) => i.statusLabel === 'Unpaid');
	const totalRevenue = paidInvoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
	const pendingRevenue = unpaidInvoices.reduce((s, i) => s + (i.totalAmount || 0), 0);

	const recentBookings = [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);

	const hour = new Date().getHours();
	const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

	return (
		<div className="dashboard-page">
			{/* ── Hero ── */}
			<section className="page-hero">
				<div>
					<p className="page-kicker">Admin Control Panel</p>
					<h1>
						{greeting}, {firstName} 👋
					</h1>
					<p>Here is what is happening across your garage today.</p>
				</div>
			</section>

			{/* ── Metrics ── */}
			<div className="metric-grid ad-metric-grid">
				{loading ? (
					Array.from({ length: 5 }).map((_, i) => <SkeletonMetric key={i} />)
				) : (
					<>
						<MetricCard
							icon="📋"
							label="Active Bookings"
							value={activeBookings.length}
							sub="In progress right now"
							accent="#3b82f6"
							onClick={() => navigate('/admin/bookings')}
						/>
						<MetricCard
							icon="⏳"
							label="Needs Action"
							value={needsAction}
							sub="Pending confirm / QC"
							accent="#f97316"
							onClick={() => navigate('/admin/bookings')}
						/>
						<MetricCard
							icon="💰"
							label="Revenue Collected"
							value={fmtCurrency(totalRevenue)}
							sub={`${paidInvoices.length} paid invoices`}
							accent="#22c55e"
						/>
						<MetricCard
							icon="🧾"
							label="Pending Revenue"
							value={fmtCurrency(pendingRevenue)}
							sub={`${unpaidInvoices.length} unpaid invoices`}
							accent="#f59e0b"
							onClick={() => navigate('/admin/bookings')}
						/>
						<MetricCard
							icon="👥"
							label="Total Customers"
							value={customers.length}
							sub="Registered accounts"
							accent="#a855f7"
							onClick={() => navigate('/admin/customers')}
						/>
					</>
				)}
			</div>

			{/* ── Two-column body ── */}
			<div className="ad-body">
				{/* ── Recent bookings ── */}
				<div className="ad-panel">
					<div className="ad-panel__header">
						<h2 className="ad-panel__title">Recent Bookings</h2>
						<button className="ad-link" onClick={() => navigate('/admin/bookings')}>
							View all →
						</button>
					</div>
					<div className="ad-panel__content">
						{loading ? (
							Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
						) : recentBookings.length === 0 ? (
							<div className="ad-empty-inline">No bookings yet.</div>
						) : (
							recentBookings.map((b) => (
								<div key={b.id} className="ad-row" onClick={() => navigate(`/admin/bookings/${b.id}`)}>
									<div className="ad-row__info">
										<span className="ad-row__primary">{b.serviceType?.name}</span>
										<span className="ad-row__secondary">
											{b.customerName} · {b.vehicle?.licensePlate}
										</span>
									</div>
									<span className="ad-row__date">{fmtDate(b.scheduledDate)}</span>
									<StatusBadge status={b.statusLabel} />
								</div>
							))
						)}
					</div>
				</div>

				{/* ── Right column ── */}
				<div className="ad-side">
					{/* Needs-action panel */}
					{!loading && needsAction > 0 && (
						<div className="ad-panel ad-panel--accent">
							<div className="ad-panel__header">
								<h2 className="ad-panel__title">Needs Your Action</h2>
								<span className="ad-live-dot" />
							</div>
							<div className="ad-panel__content">
								{bookings
									.filter((b) => ['Pending', 'Confirmed', 'QualityCheck'].includes(b.statusLabel?.replace(/ /g, '')))
									.slice(0, 4)
									.map((b) => (
										<div key={b.id} className="ad-action-row" onClick={() => navigate(`/admin/bookings/${b.id}`)}>
											<div className="ad-action-row__info">
												<span className="ad-action-row__service">{b.serviceType?.name}</span>
												<span className="ad-action-row__customer">{b.customerName}</span>
											</div>
											<StatusBadge status={b.statusLabel} />
										</div>
									))}
							</div>
						</div>
					)}

					{/* Revenue snapshot */}
					{!loading && (
						<div className="ad-panel">
							<div className="ad-panel__header">
								<h2 className="ad-panel__title">Revenue Snapshot</h2>
							</div>
							<div className="ad-revenue">
								<div className="ad-revenue__row">
									<span>Total Invoices</span>
									<strong>{invoices.length}</strong>
								</div>
								<div className="ad-revenue__row">
									<span>Paid</span>
									<strong className="ad-revenue__paid">{fmtCurrency(totalRevenue)}</strong>
								</div>
								<div className="ad-revenue__row">
									<span>Pending</span>
									<strong className="ad-revenue__pending">{fmtCurrency(pendingRevenue)}</strong>
								</div>
								<div className="ad-revenue__bar-wrap">
									<div className="ad-revenue__bar-track">
										<div
											className="ad-revenue__bar-fill"
											style={{
												width:
													totalRevenue + pendingRevenue > 0
														? `${(totalRevenue / (totalRevenue + pendingRevenue)) * 100}%`
														: '0%',
											}}
										/>
									</div>
									<span className="ad-revenue__bar-label">
										{totalRevenue + pendingRevenue > 0
											? `${Math.round((totalRevenue / (totalRevenue + pendingRevenue)) * 100)}% collected`
											: 'No invoices yet'}
									</span>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
