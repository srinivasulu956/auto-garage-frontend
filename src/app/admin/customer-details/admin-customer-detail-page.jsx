import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminCustomerService } from '../../../app-core/services/admin-user-service';
import { toastError } from '../../../app-core/services/toast-service';
import { getBookingStatusMeta } from '../../../shared/data-modals/booking-status';
import { FUEL_META } from '../../../shared/data-modals/vehicle-data';
import { formatCurrencyIN } from '../../../shared/utils/currency-formatters';
import { formatDateIN } from '../../../shared/utils/date-formatters';
import { normalizeStatusKey } from '../../../shared/utils/status';
import './admin-customer-detail-page.scss';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalise = normalizeStatusKey;
const fmtDate = formatDateIN;
const fmtCurrency = (value) => formatCurrencyIN(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
							const style = getBookingStatusMeta(key, 'compact');
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
