import { getInvoiceStatusMeta } from '../../../../shared/data-modals/invoice-status';

function StatusBadge({ status }) {
	const meta = getInvoiceStatusMeta(status);

	return (
		<span className="inv-badge" style={{ background: meta.bg, color: meta.color }}>
			<span className="inv-badge__dot" style={{ background: meta.dot }} />
			{meta.label}
		</span>
	);
}

export default StatusBadge;
