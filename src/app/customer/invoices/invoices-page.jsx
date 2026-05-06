import { useEffect, useState, useCallback } from 'react';
// ✅ FIX: customer invoices come from booking-service, not admin-booking-service
import { invoiceService } from '../../../app-core/services/booking-service';
import { toastError, toastSuccess } from '../../../app-core/services/toast-service';
import './invoices-page.scss';
import SkeletonCard from './invoice-utils/skeleton-card';
import InvoiceCard from './invoice-card';
import InvoiceDetailPanel from './invoice-detail-panel';
import PayModal from './invoice-utils/pay-modal';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const fmtCurrency = (n) => '₹' + (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function InvoicesPage() {
	const [invoices, setInvoices] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState('all');
	const [selectedInvoice, setSelectedInvoice] = useState(null);
	const [payTarget, setPayTarget] = useState(null);
	const [paying, setPaying] = useState(false);

	const loadInvoices = useCallback(async () => {
		try {
			setLoading(true);
			const data = await invoiceService.getAll();
			setInvoices(data || []);
		} catch {
			toastError('Failed to load invoices');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadInvoices();
	}, [loadInvoices]);

	const handlePay = async (paymentData) => {
		if (!payTarget) return;
		try {
			setPaying(true);
			const result = await invoiceService.pay(payTarget.id, paymentData);
			toastSuccess('Payment successful! 🎉');
			// Update the invoice in list + close modal
			setInvoices((prev) => prev.map((inv) => (inv.id === payTarget.id ? result.invoice : inv)));
			setPayTarget(null);
			setSelectedInvoice(result.invoice);
		} catch (e) {
			toastError(e.message || 'Payment failed');
		} finally {
			setPaying(false);
		}
	};

	// ✅ FIX: backend returns statusLabel 'Unpaid' for unpaid invoices (not 'Pending')
	const unpaid = invoices.filter((i) => i.statusLabel === 'Unpaid');
	const paid = invoices.filter((i) => i.statusLabel === 'Paid');
	const displayedInvoices = filter === 'Unpaid' ? unpaid : filter === 'Paid' ? paid : invoices;

	const totalDue = unpaid.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

	return (
		<div className="dashboard-page">
			<section className="page-hero compact">
				<div>
					<p className="page-kicker">Invoices</p>
					<h1>Billing History</h1>
					<p>
						{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
						{unpaid.length > 0 && <span className="inv-due-pill"> · {fmtCurrency(totalDue)} due</span>}
					</p>
				</div>
			</section>

			{/* Unpaid alert banner */}
			{!loading && unpaid.length > 0 && (
				<div className="inv-alert">
					<span>⚠️</span>
					<div>
						<strong>
							{unpaid.length} unpaid invoice{unpaid.length > 1 ? 's' : ''}
						</strong>
						<span> — Total due: {fmtCurrency(totalDue)}</span>
					</div>
				</div>
			)}

			{/* Filters */}
			<div className="inv-filters">
				{[
					{ key: 'all', label: 'All', count: invoices.length },
					{ key: 'Unpaid', label: 'Unpaid', count: unpaid.length },
					{ key: 'Paid', label: 'Paid', count: paid.length },
				].map((f) => (
					<button
						key={f.key}
						className={`inv-filter-btn ${filter === f.key ? 'inv-filter-btn--active' : ''}`}
						onClick={() => setFilter(f.key)}
					>
						{f.label}
						{!loading && <span className="inv-filter-count">{f.count}</span>}
					</button>
				))}
			</div>

			{/* Invoice list */}
			<div className="inv-list">
				{loading ? (
					Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
				) : displayedInvoices.length === 0 ? (
					<div className="empty-panel">
						<div className="empty-panel-icon">🧾</div>
						<h2>{filter === 'all' ? 'No invoices yet' : `No ${filter.toLowerCase()} invoices`}</h2>
						<p>
							{filter === 'all'
								? 'Your invoices will appear here after a service is completed.'
								: `You have no ${filter.toLowerCase()} invoices right now.`}
						</p>
					</div>
				) : (
					displayedInvoices.map((invoice) => (
						<InvoiceCard
							key={invoice.id}
							invoice={invoice}
							onViewDetails={setSelectedInvoice}
							onPay={setPayTarget}
							fmtDate={fmtDate}
							fmtCurrency={fmtCurrency}
						/>
					))
				)}
			</div>

			{/* Detail panel */}
			{selectedInvoice && (
				<InvoiceDetailPanel
					invoice={selectedInvoice}
					onClose={() => setSelectedInvoice(null)}
					onPay={(inv) => {
						setSelectedInvoice(null);
						setPayTarget(inv);
					}}
					fmtDate={fmtDate}
					fmtCurrency={fmtCurrency}
				/>
			)}

			{/* Pay modal */}
			{payTarget && (
				<PayModal invoice={payTarget} onPay={handlePay} onClose={() => !paying && setPayTarget(null)} submitting={paying} />
			)}
		</div>
	);
}
