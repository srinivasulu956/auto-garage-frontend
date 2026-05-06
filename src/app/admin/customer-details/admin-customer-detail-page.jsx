import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminCustomerService } from '../../../app-core/services/admin-user-service';
import { toastError } from '../../../app-core/services/toast-service';
import './admin-customer-detail-page.scss';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalise = (s) => s?.replace(/ /g, '') ?? '';

const FUEL_META = {
	Petrol: { color: '#f59e0b' },
	Diesel: { color: '#6b7280' },
	Electric: { color: '#10b981' },
	Hybrid: { color: '#3b82f6' },
	CNG: { color: '#8b5cf6' },
};

// ✅ FIX: Complete status map covering all possible statuses
const STATUS_STYLES = {
	Pending: { bg: '#fff7ed', color: '#c2410c', label: 'Pending' },
	Confirmed: { bg: '#eff6ff', color: '#1d4ed8', label: 'Confirmed' },
	AssignedToMechanic: { bg: '#f0f9ff', color: '#0369a1', label: 'Assigned' },
	InProgress: { bg: '#fefce8', color: '#a16207', label: 'In Progress' },
	WaitingForParts: { bg: '#fdf4ff', color: '#7e22ce', label: 'Waiting for Parts' },
	QualityCheck: { bg: '#fff7ed', color: '#c2410c', label: 'Quality Check' },
	Completed: { bg: '#f0fdf4', color: '#15803d', label: 'Completed' },
	InvoiceGenerated: { bg: '#fefce8', color: '#854d0e', label: 'Invoice Sent' },
	Paid: { bg: '#f0fdf4', color: '#15803d', label: 'Paid' },
	Cancelled: { bg: '#fef2f2', color: '#991b1b', label: 'Cancelled' },
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const fmtCurrency = (n) => '₹' + (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminCustomerDetailPage() {
	const { id } = useParams();
	const navigate = useNavigate();

	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);

	const load = useCallback(async () => {
		try {
			setLoading(true);
			const res = await adminCustomerService.getById(id);
			setData(res);
		} catch (err) {
			toastError(err?.message || 'Failed to load customer');
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading) return <div className="acd-loading">Loading...</div>;
	if (!data) return <div className="acd-loading">Customer not found.</div>;

	const { vehicles = [], bookings = [], invoices = [] } = data;

	return (
		<div className="dashboard-page acd-page">
			{/* Header */}
			<section className="page-hero compact">
				<div>
					<p className="page-kicker">Customer</p>
					<h1>
						{data.firstName} {data.lastName}
					</h1>
					<p>{data.email}</p>
				</div>
				<div className="acd-header-right">
					<button className="acd-back-btn" onClick={() => navigate('/admin/customers')}>
						← Back
					</button>
					<span className={`acd-status ${data.isActive ? 'active' : 'inactive'}`}>{data.isActive ? 'Active' : 'Inactive'}</span>
				</div>
			</section>

			{/* Stats */}
			<div className="acd-stats">
				<div className="acd-stat">
					<h3>{vehicles.length}</h3>
					<p>Vehicles</p>
				</div>
				<div className="acd-stat">
					<h3>{bookings.length}</h3>
					<p>Bookings</p>
				</div>
				<div className="acd-stat">
					<h3>{invoices.length}</h3>
					<p>Invoices</p>
				</div>
			</div>

			{/* Vehicles */}
			<section className="acd-section">
				<h2>Vehicles</h2>
				{vehicles.length === 0 ? (
					<p className="acd-empty">No vehicles registered.</p>
				) : (
					<div className="acd-grid">
						{vehicles.map((v, i) => (
							<div key={v.id} className="acd-card" style={{ animationDelay: `${i * 0.05}s` }}>
								<h3>
									{v.make} {v.model}
								</h3>
								<p>
									{v.licensePlate} · {v.year}
								</p>
								<span className="acd-fuel" style={{ color: FUEL_META[v.fuelType]?.color }}>
									{v.fuelType}
								</span>
							</div>
						))}
					</div>
				)}
			</section>

			{/* Bookings */}
			<section className="acd-section">
				<h2>Bookings</h2>
				{bookings.length === 0 ? (
					<p className="acd-empty">No bookings yet.</p>
				) : (
					<div className="acd-list">
						{bookings.map((b, i) => {
							const key = normalise(b.statusLabel);
							const style = STATUS_STYLES[key] || STATUS_STYLES.Pending;
							return (
								<div
									key={b.id}
									className="acd-row clickable"
									style={{ animationDelay: `${i * 0.05}s` }}
									onClick={() => navigate(`/admin/bookings/${b.id}`)}
								>
									<div>
										<strong>{b.serviceName}</strong>
										<p>{b.vehiclePlate}</p>
										<small>{fmtDate(b.scheduledDate)}</small>
									</div>
									<div className="acd-actions">
										<span className="acd-badge" style={{ background: style.bg, color: style.color }}>
											{style.label}
										</span>
										{/* ✅ FIX: removed dead console.log stub — navigate handles all actions */}
										<button
											className="acd-action-btn"
											onClick={(e) => {
												e.stopPropagation();
												navigate(`/admin/bookings/${b.id}`);
											}}
										>
											Manage →
										</button>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</section>

			{/* Invoices */}
			<section className="acd-section">
				<h2>Invoices</h2>
				{invoices.length === 0 ? (
					<p className="acd-empty">No invoices yet.</p>
				) : (
					<div className="acd-list">
						{/* ✅ FIX: use statusLabel (not isPaid) and issuedAt (not createdAt) */}
						{invoices.map((inv, idx) => {
							const isPaid = inv.statusLabel === 'Paid';
							return (
								<div key={inv.id} className="acd-row" style={{ animationDelay: `${idx * 0.05}s` }}>
									<div>
										<strong>{fmtCurrency(inv.totalAmount)}</strong>
										<p>Issued {fmtDate(inv.issuedAt)}</p>
										{isPaid && inv.paidAt && (
											<small>
												Paid {fmtDate(inv.paidAt)} · {inv.paymentMethod}
											</small>
										)}
									</div>
									<span className={`acd-badge ${isPaid ? 'paid' : 'unpaid'}`}>{isPaid ? 'Paid' : 'Unpaid'}</span>
								</div>
							);
						})}
					</div>
				)}
			</section>
		</div>
	);
}
