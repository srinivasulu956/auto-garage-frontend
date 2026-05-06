import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminCustomerService } from '../../../app-core/services/admin-user-service';
import { toastError, toastSuccess } from '../../../app-core/services/toast-service';
import './admin-customers-page.scss';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

function SkeletonCard() {
	return (
		<div className="ac-card ac-card--skeleton">
			<div className="sk" style={{ width: 48, height: 48, borderRadius: '50%' }} />
			<div style={{ flex: 1 }}>
				<div className="sk" style={{ width: '45%', height: 14, marginBottom: 8 }} />
				<div className="sk" style={{ width: '65%', height: 11 }} />
			</div>
		</div>
	);
}

export default function AdminCustomersPage() {
	const navigate = useNavigate();
	const [customers, setCustomers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [filter, setFilter] = useState('all');
	const [togglingId, setTogglingId] = useState(null);

	const load = useCallback(async () => {
		try {
			setLoading(true);
			const data = await adminCustomerService.getAll();
			setCustomers(data || []);
		} catch {
			toastError('Failed to load customers');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const handleToggle = async (e, customer) => {
		e.stopPropagation();
		try {
			setTogglingId(customer.id);
			const updated = await adminCustomerService.toggleActive(customer.id);
			setCustomers((prev) => prev.map((c) => (c.id === customer.id ? updated : c)));
			toastSuccess(`Customer ${updated.isActive ? 'activated' : 'deactivated'}`);
		} catch (err) {
			toastError(err.message || 'Failed to update');
		} finally {
			setTogglingId(null);
		}
	};

	const filtered = customers.filter((c) => {
		const q = search.toLowerCase();
		const matchSearch =
			!q ||
			`${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
			c.email?.toLowerCase().includes(q) ||
			c.id?.toLowerCase().includes(q);
		const matchFilter = filter === 'all' || (filter === 'active' && c.isActive) || (filter === 'inactive' && !c.isActive);
		return matchSearch && matchFilter;
	});

	const activeCount = customers.filter((c) => c.isActive).length;

	return (
		<div className="dashboard-page">
			{/* Hero */}
			<section className="page-hero compact">
				<div>
					<p className="page-kicker">Admin</p>
					<h1>All Customers</h1>
					<p>
						{customers.length} registered · {activeCount} active · {customers.length - activeCount} inactive
					</p>
				</div>
			</section>

			{/* Search + filter */}
			<div className="ac-toolbar">
				<div className="ac-search-wrap">
					<span className="ac-search-icon">🔍</span>
					<input
						className="ac-search"
						placeholder="Search by name, email or ID..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
					{search && (
						<button className="ac-clear" onClick={() => setSearch('')}>
							✕
						</button>
					)}
				</div>
				<div className="ac-filters">
					{['all', 'active', 'inactive'].map((f) => (
						<button
							key={f}
							className={`ac-filter-btn ${filter === f ? 'ac-filter-btn--active' : ''}`}
							onClick={() => setFilter(f)}
						>
							{f === 'all'
								? `All (${customers.length})`
								: f === 'active'
									? `Active (${activeCount})`
									: `Inactive (${customers.length - activeCount})`}
						</button>
					))}
				</div>
			</div>

			{/* List */}
			<div className="ac-list">
				{loading ? (
					Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
				) : filtered.length === 0 ? (
					<div className="empty-panel">
						<div className="empty-panel-icon">👥</div>
						<h2>{search ? 'No results found' : 'No customers'}</h2>
						<p>{search ? `No customers match "${search}"` : 'No customers registered yet.'}</p>
					</div>
				) : (
					filtered.map((c) => (
						<div key={c.id} className="ac-card" onClick={() => navigate(`/admin/customer/${c.id}`)}>
							{/* Avatar */}
							<div className="ac-avatar" style={{ background: c.isActive ? 'var(--primary-soft)' : '#f3f4f6' }}>
								<span style={{ color: c.isActive ? 'var(--primary-color)' : '#9ca3af' }}>
									{c.firstName?.[0]?.toUpperCase()}
									{c.lastName?.[0]?.toUpperCase()}
								</span>
							</div>

							{/* Info */}
							<div className="ac-card__body">
								<div className="ac-card__name-row">
									<h3 className="ac-card__name">
										{c.firstName} {c.lastName}
									</h3>
									<span className={`ac-status ${c.isActive ? 'ac-status--active' : 'ac-status--inactive'}`}>
										{c.isActive ? 'Active' : 'Inactive'}
									</span>
								</div>
								<p className="ac-card__email">{c.email}</p>
								<div className="ac-card__stats">
									<span>
										🚗 {c.vehicleCount} vehicle{c.vehicleCount !== 1 ? 's' : ''}
									</span>
									<span>
										📋 {c.bookingCount} booking{c.bookingCount !== 1 ? 's' : ''}
									</span>
									<span>
										🧾 {c.invoiceCount} invoice{c.invoiceCount !== 1 ? 's' : ''}
									</span>
									<span>📅 Joined {fmtDate(c.createdAt)}</span>
								</div>
							</div>

							{/* Actions */}
							<div className="ac-card__actions" onClick={(e) => e.stopPropagation()}>
								<button
									className={`ac-toggle ${c.isActive ? 'ac-toggle--deactivate' : 'ac-toggle--activate'}`}
									onClick={(e) => handleToggle(e, c)}
									disabled={togglingId === c.id}
								>
									{togglingId === c.id ? '...' : c.isActive ? 'Deactivate' : 'Activate'}
								</button>
								<button className="ac-detail-btn" onClick={() => navigate(`/admin/customer/${c.id}`)}>
									View →
								</button>
							</div>
						</div>
					))
				)}
			</div>

			{!loading && filtered.length > 0 && (
				<p className="ac-count-note">
					Showing {filtered.length} of {customers.length} customers
				</p>
			)}
		</div>
	);
}
