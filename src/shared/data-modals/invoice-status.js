export const INVOICE_STATUS_META = {
	Pending: { bg: '#fff7ed', color: '#c2410c', dot: '#f97316', label: 'Unpaid' },
	Unpaid: { bg: '#fff7ed', color: '#c2410c', dot: '#f97316', label: 'Unpaid' },
	Paid: { bg: '#f0fdf4', color: '#15803d', dot: '#22c55e', label: 'Paid' },
};

export const getInvoiceStatusMeta = (status) =>
	INVOICE_STATUS_META[status] || {
		bg: '#f3f4f6',
		color: '#374151',
		dot: '#9ca3af',
		label: status || 'Unknown',
	};
