// InvoiceDetailPanel.jsx

import { downloadInvoicePDF } from './invoice-card';
import StatusBadge from './invoice-utils/status-badge';

function InvoiceDetailPanel({ invoice, onClose, onPay, fmtDate, fmtCurrency }) {
	const isPaid = invoice.statusLabel === 'Paid';

	return (
		<div className="inv-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
			<div className="inv-detail-modal">
				{/* Header */}
				<div className="inv-detail__header">
					<div>
						<h2 className="inv-detail__title">Invoice #{invoice.id?.slice(0, 8).toUpperCase()}</h2>
						<p className="inv-detail__subtitle">Issued on {fmtDate(invoice.issuedAt)}</p>
					</div>
					<div className="inv-detail__header-right">
						<StatusBadge status={invoice.statusLabel} />
						<button className="inv-detail__close" onClick={onClose}>
							✕
						</button>
					</div>
				</div>

				<div className="inv-detail__content">
					{/* Booking Details */}
					<div className="inv-detail__section">
						<p className="inv-detail__section-title">Booking Details</p>
						<div className="inv-detail__info-grid">
							<div className="inv-detail__info-item">
								<span className="inv-detail__label">Service</span>
								<span className="inv-detail__value">{invoice.booking?.serviceName || '—'}</span>
							</div>
							<div className="inv-detail__info-item">
								<span className="inv-detail__label">Scheduled Date</span>
								<span className="inv-detail__value">{fmtDate(invoice.booking?.scheduledDate)}</span>
							</div>
							<div className="inv-detail__info-item">
								<span className="inv-detail__label">Vehicle</span>
								<span className="inv-detail__value">
									{invoice.booking?.vehicleMake} {invoice.booking?.vehicleModel}
								</span>
							</div>
							<div className="inv-detail__info-item">
								<span className="inv-detail__label">License Plate</span>
								<span className="inv-detail__value">{invoice.booking?.licensePlate || '—'}</span>
							</div>
						</div>
					</div>

					{/* Line Items */}
					<div className="inv-detail__section">
						<p className="inv-detail__section-title">Line Items</p>
						<div className="inv-items-table-wrapper">
							<table className="inv-items-table">
								<thead>
									<tr>
										<th>Description</th>
										<th className="qty-col">Qty</th>
										<th className="price-col">Unit Price</th>
										<th className="total-col">Total</th>
									</tr>
								</thead>
								<tbody>
									{(invoice.items || []).map((it, index) => (
										<tr key={it.id || index}>
											<td>{it.description}</td>
											<td className="qty-col">{it.quantity}</td>
											<td className="price-col">{fmtCurrency(it.unitPrice)}</td>
											<td className="total-col">{fmtCurrency(it.total)}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					{/* Totals */}
					<div className="inv-detail__totals">
						<div className="inv-detail__totals-row">
							<span>Subtotal</span>
							<span>{fmtCurrency(invoice.subTotal)}</span>
						</div>
						<div className="inv-detail__totals-row">
							<span>GST ({invoice.taxRate}%)</span>
							<span>{fmtCurrency(invoice.taxAmount)}</span>
						</div>
						<div className="inv-detail__totals-row inv-detail__totals-row--total">
							<span>Total Amount</span>
							<span>{fmtCurrency(invoice.totalAmount)}</span>
						</div>
					</div>

					{/* Payment Status */}
					{isPaid && invoice.paymentMethod && (
						<div className="inv-detail__paid-info">
							✅ Payment Successful via <strong>{invoice.paymentMethod}</strong>
							{invoice.paymentReference && (
								<>
									{' '}
									• Ref: <code>{invoice.paymentReference}</code>
								</>
							)}
							{invoice.paidAt && <> • {fmtDate(invoice.paidAt)}</>}
						</div>
					)}
				</div>

				{/* Footer Actions */}
				<div className="inv-detail__footer">
					<button className="sd-btn sd-btn--ghost" onClick={() => downloadInvoicePDF(invoice)} disabled={!isPaid}>
						⬇️ Download PDF
					</button>

					{!isPaid && (
						<button className="sd-btn sd-btn--primary" onClick={() => onPay(invoice)}>
							💳 Pay Now • {fmtCurrency(invoice.totalAmount)}
						</button>
					)}
				</div>
			</div>
		</div>
	);
}

export default InvoiceDetailPanel;
