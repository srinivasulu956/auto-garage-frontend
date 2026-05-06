// InvoiceCard.jsx

import StatusBadge from './invoice-utils/status-badge';

export const downloadInvoicePDF = (invoice) => {
	// Full PDF generation logic (kept exactly as you had it)
	const items = invoice.items || [];
	const itemRows = items
		.map(
			(it) => `
    <tr>
      <td>${it.description}</td>
      <td style="text-align:center">${it.quantity}</td>
      <td style="text-align:right">₹${(it.unitPrice || 0).toLocaleString('en-IN')}</td>
      <td style="text-align:right">₹${(it.total || 0).toLocaleString('en-IN')}</td>
    </tr>`
		)
		.join('');

	const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Invoice #${invoice.id?.slice(0, 8).toUpperCase()}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 40px; }
    h1 { font-size: 26px; color: #1e3a5f; margin-bottom: 4px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 32px; }
    .brand { font-size: 22px; font-weight: 800; color: #1e3a5f; }
    .meta { text-align: right; color: #555; }
    .section-title { font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #888; margin: 24px 0 8px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 32px; margin-bottom: 24px; }
    .info-row label { font-size: 11px; color: #888; display: block; }
    .info-row span { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { background: #f1f5f9; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #555; }
    td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
    .totals { margin-top: 16px; margin-left: auto; width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
    .totals-row.total { font-weight: 800; font-size: 16px; border-top: 2px solid #1e3a5f; padding-top: 10px; margin-top: 4px; }
    .badge { padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
    .footer { margin-top: 48px; text-align: center; color: #aaa; font-size: 11px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">🔧 AutoFix</div>
      <div style="color:#555;margin-top:4px">Auto Garage Service</div>
    </div>
    <div class="meta">
      <div style="font-weight:700;font-size:16px">INVOICE</div>
      <div>#${invoice.id?.slice(0, 8).toUpperCase()}</div>
      <div>Issued: ${invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString('en-IN') : '—'}</div>
      ${invoice.paidAt ? `<div>Paid: ${new Date(invoice.paidAt).toLocaleDateString('en-IN')}</div>` : ''}
    </div>
  </div>

  <div class="section-title">Booking Details</div>
  <div class="info-grid">
    <div class="info-row"><label>Service</label><span>${invoice.booking?.serviceName || '—'}</span></div>
    <div class="info-row"><label>Scheduled Date</label><span>${invoice.booking?.scheduledDate ? new Date(invoice.booking.scheduledDate).toLocaleDateString('en-IN') : '—'}</span></div>
    <div class="info-row"><label>Vehicle</label><span>${invoice.booking?.vehicleMake} ${invoice.booking?.vehicleModel}</span></div>
    <div class="info-row"><label>License Plate</label><span>${invoice.booking?.licensePlate || '—'}</span></div>
  </div>

  <div class="section-title">Line Items</div>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="totals">
    <div class="totals-row"><span>Subtotal</span><span>₹${(invoice.subTotal || 0).toLocaleString('en-IN')}</span></div>
    <div class="totals-row"><span>GST (${invoice.taxRate}%)</span><span>₹${(invoice.taxAmount || 0).toLocaleString('en-IN')}</span></div>
    <div class="totals-row total"><span>Total</span><span>₹${(invoice.totalAmount || 0).toLocaleString('en-IN')}</span></div>
  </div>

  <div class="footer">Thank you for choosing AutoFix · This is a computer-generated invoice</div>
</body>
</html>`;

	const win = window.open('', '_blank');
	win.document.write(html);
	win.document.close();
	win.onload = () => win.print();
};

function InvoiceCard({ invoice, onViewDetails, onPay, fmtDate, fmtCurrency }) {
	const isPaid = invoice.statusLabel === 'Paid';

	return (
		<div className={`inv-card ${isPaid ? 'inv-card--paid' : 'inv-card--unpaid'}`} onClick={() => onViewDetails(invoice)}>
			<div className="inv-card__top">
				<div className="inv-card__info">
					<h3 className="inv-card__service">{invoice.booking?.serviceName}</h3>
					<p className="inv-card__vehicle">
						{invoice.booking?.vehicleMake} {invoice.booking?.vehicleModel} · {invoice.booking?.licensePlate}
					</p>
					<p className="inv-card__date">
						📅 {fmtDate(invoice.booking?.scheduledDate)} · Issued {fmtDate(invoice.issuedAt)}
					</p>
				</div>

				<div className="inv-card__right">
					<StatusBadge status={invoice.statusLabel} />
					<span className="inv-card__amount">{fmtCurrency(invoice.totalAmount)}</span>
				</div>
			</div>

			<div className="inv-card__footer" onClick={(e) => e.stopPropagation()}>
				<button className="inv-detail-btn" onClick={() => onViewDetails(invoice)}>
					View Details →
				</button>

				<div style={{ display: 'flex', gap: '0.5rem' }}>
					{isPaid && (
						<button
							className="sd-btn sd-btn--ghost inv-sm-btn"
							onClick={(e) => {
								e.stopPropagation();
								downloadInvoicePDF(invoice);
							}}
						>
							⬇️ PDF
						</button>
					)}

					{!isPaid && (
						<button
							className="sd-btn sd-btn--primary inv-sm-btn"
							onClick={(e) => {
								e.stopPropagation();
								onPay(invoice);
							}}
						>
							💳 Pay
						</button>
					)}
				</div>
			</div>
		</div>
	);
}

export default InvoiceCard;
