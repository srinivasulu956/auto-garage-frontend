import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../../../app-core/services/booking-service';
import vehicleService from '../../../app-core/services/vehicle-service';
import { toastError } from '../../../app-core/services/toast-service';
import './customer-dashboard.scss';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalise = (s) => s?.replace(/ /g, '') ?? '';

const STATUS_STYLES = {
	Pending: { bg: '#fff7ed', color: '#c2410c', label: 'Pending' },
	Confirmed: { bg: '#eff6ff', color: '#1d4ed8', label: 'Confirmed' },
	AssignedToMechanic: { bg: '#f0f9ff', color: '#0369a1', label: 'Assigned' },
	InProgress: { bg: '#fefce8', color: '#a16207', label: 'In Progress' },
	WaitingForParts: { bg: '#fdf4ff', color: '#7e22ce', label: 'Waiting for Parts' },
	QualityCheck: { bg: '#fff7ed', color: '#c2410c', label: 'Quality Check' },
	Completed: { bg: '#f0fdf4', color: '#15803d', label: 'Completed' },
	InvoiceGenerated: { bg: '#fefce8', color: '#854d0e', label: 'Invoice Ready' },
	Paid: { bg: '#f0fdf4', color: '#15803d', label: 'Paid' },
	Cancelled: { bg: '#fef2f2', color: '#991b1b', label: 'Cancelled' },
};

function StatusBadge({ statusLabel }) {
	const style = STATUS_STYLES[normalise(statusLabel)] || { bg: '#f3f4f6', color: '#374151', label: statusLabel };
	return (
		<span className="cd-badge" style={{ background: style.bg, color: style.color }}>
			{style.label}
		</span>
	);
}

function MetricCard({ icon, label, value, sub, onClick }) {
	return (
		<div className={`metric-card cd-metric ${onClick ? 'cd-metric--clickable' : ''}`} onClick={onClick}>
			<div className="cd-metric__icon">{icon}</div>
			<div className="cd-metric__body">
				<span className="cd-metric__label">{label}</span>
				<strong className="cd-metric__value">{value}</strong>
				<small className="cd-metric__sub">{sub}</small>
			</div>
		</div>
	);
}

function SkeletonRow() {
	return (
		<div className="cd-booking-row cd-booking-row--skeleton">
			<div className="sk-box" style={{ width: '40%', height: 14 }} />
			<div className="sk-box" style={{ width: '25%', height: 14 }} />
			<div className="sk-box" style={{ width: '60px', height: 22, borderRadius: '1rem' }} />
		</div>
	);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const CustomerDashboard = () => {
	const navigate = useNavigate();
	const userData = useSelector((s) => s.commonState.loggedUserData);
	const firstName = userData?.user?.firstName || 'there';

	const [vehicles, setVehicles] = useState([]);
	const [bookings, setBookings] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadAll = async () => {
			setLoading(true);
			await Promise.allSettled([
				vehicleService
					.getAll()
					.then((v) => setVehicles(v || []))
					.catch(() => toastError('Failed to load vehicles')),
				bookingService
					.getAll()
					.then((b) => setBookings(b || []))
					.catch(() => toastError('Failed to load bookings')),
			]);
			setLoading(false);
		};
		loadAll();
	}, []);

	// Active = everything except Cancelled and Paid
	const activeBookings = bookings.filter((b) => !['Cancelled', 'Paid'].includes(normalise(b.statusLabel)));

	// Pending invoice = InvoiceGenerated (awaiting customer payment)
	const pendingInvoices = bookings.filter((b) => normalise(b.statusLabel) === 'InvoiceGenerated');

	const recentBookings = [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

	return (
		<div className="dashboard-page">
			<section className="page-hero">
				<div>
					<p className="page-kicker">Customer Dashboard</p>
					<h1>Welcome back, {firstName} 👋</h1>
					<p>Your garage at a glance — vehicles, bookings, and service activity.</p>
				</div>
				<button className="cd-cta" onClick={() => navigate('/customer/bookings/new')}>
					+ Book a Service
				</button>
			</section>

			<div className="metric-grid">
				<MetricCard
					icon="🚗"
					label="Vehicles"
					value={loading ? '—' : vehicles.length}
					sub="Registered in your garage"
					onClick={() => navigate('/customer/vehicles')}
				/>
				<MetricCard
					icon="📋"
					label="Active Bookings"
					value={loading ? '—' : activeBookings.length}
					sub="Currently in progress"
					onClick={() => navigate('/customer/bookings')}
				/>
				<MetricCard
					icon="🧾"
					label="Pending Invoices"
					value={loading ? '—' : pendingInvoices.length}
					sub="Awaiting payment"
					onClick={() => navigate('/customer/invoices')}
				/>
			</div>

			<div className="cd-section">
				<div className="cd-section__header">
					<h2 className="cd-section__title">Recent Bookings</h2>
					<button className="cd-link" onClick={() => navigate('/customer/bookings')}>
						View all →
					</button>
				</div>

				<div className="cd-bookings-list">
					{loading ? (
						Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
					) : recentBookings.length === 0 ? (
						<div className="cd-empty">
							<span>📋</span>
							<p>
								No bookings yet.{' '}
								<button className="cd-link" onClick={() => navigate('/customer/bookings/new')}>
									Book your first service →
								</button>
							</p>
						</div>
					) : (
						recentBookings.map((b) => (
							<div key={b.id} className="cd-booking-row" onClick={() => navigate(`/customer/bookings/${b.id}`)}>
								<div className="cd-booking-row__info">
									<span className="cd-booking-row__service">{b.serviceType?.name}</span>
									<span className="cd-booking-row__vehicle">
										{b.vehicle?.make} {b.vehicle?.model} · {b.vehicle?.licensePlate}
									</span>
								</div>
								<div className="cd-booking-row__date">
									{new Date(b.scheduledDate).toLocaleDateString('en-IN', {
										day: 'numeric',
										month: 'short',
										year: 'numeric',
									})}
								</div>
								<StatusBadge statusLabel={b.statusLabel} />
							</div>
						))
					)}
				</div>
			</div>

			{!loading && vehicles.length === 0 && (
				<div className="cd-section">
					<div className="cd-alert">
						<span>🚗</span>
						<div>
							<strong>Add your first vehicle</strong>
							<p>You need to register a vehicle before you can book a service.</p>
						</div>
						<button className="cd-cta cd-cta--sm" onClick={() => navigate('/customer/vehicles')}>
							Add Vehicle
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default CustomerDashboard;
