import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { adminBookingService, invoiceService } from '../../../app-core/services/admin-booking-service';
import { adminCustomerService } from '../../../app-core/services/admin-user-service';
import { toastError } from '../../../app-core/services/toast-service';
import StatusBadgeBase from '../../../shared/components/status-badge/status-badge';
import { ADMIN_ACTION_REQUIRED_STATUSES, ADMIN_DASHBOARD_ACTIVE_BOOKING_STATUSES } from '../../../shared/data-modals/booking-status';
import { formatCurrencyIN } from '../../../shared/utils/currency-formatters';
import { formatDateIN } from '../../../shared/utils/date-formatters';
import { normalizeStatusKey } from '../../../shared/utils/status';
import './admin-dashboard.scss';

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const fmtDate = formatDateIN;
const fmtCurrency = formatCurrencyIN;

function StatusBadge({ status }) {
	return <StatusBadgeBase className="ad-badge" dotClassName="ad-badge__dot" status={status} variant="compact" />;
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

// â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

	// â”€â”€ Derived metrics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

	const activeBookings = bookings.filter((b) => ADMIN_DASHBOARD_ACTIVE_BOOKING_STATUSES.includes(normalizeStatusKey(b.statusLabel)));
	const needsAction = bookings.filter((b) => ADMIN_ACTION_REQUIRED_STATUSES.includes(normalizeStatusKey(b.statusLabel))).length;

	const paidInvoices = invoices.filter((i) => i.statusLabel === 'Paid');
	const unpaidInvoices = invoices.filter((i) => i.statusLabel === 'Unpaid');
	const totalRevenue = paidInvoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
	const pendingRevenue = unpaidInvoices.reduce((s, i) => s + (i.totalAmount || 0), 0);

	const recentBookings = [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);

	const hour = new Date().getHours();
	const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

	return (
		<div className="dashboard-page">
			{/* Hero */}
			<section className="page-hero">
				<div>
					<p className="page-kicker">Admin Control Panel</p>
					<h1>
						{greeting}, {firstName}
					</h1>
					<p>Here is what is happening across your garage today.</p>
				</div>
			</section>

			{/* Metrics */}
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

			{/* Two-column body */}
			<div className="ad-body">
				{/* Recent bookings */}
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

				{/* Right column */}
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
									.filter((b) => ADMIN_ACTION_REQUIRED_STATUSES.includes(normalizeStatusKey(b.statusLabel)))
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
