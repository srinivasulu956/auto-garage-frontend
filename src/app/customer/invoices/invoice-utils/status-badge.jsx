// StatusBadge.jsx
const STATUS_META = {
	Pending: { bg: '#fff7ed', color: '#c2410c', dot: '#f97316', label: 'Unpaid' },
	Paid: { bg: '#f0fdf4', color: '#15803d', dot: '#22c55e', label: 'Paid' },
};

function StatusBadge({ status }) {
	const meta = STATUS_META[status] || {
		bg: '#f3f4f6',
		color: '#374151',
		dot: '#9ca3af',
		label: status || 'Unknown',
	};

	return (
		<span className="inv-badge" style={{ background: meta.bg, color: meta.color }}>
			<span className="inv-badge__dot" style={{ background: meta.dot }} />
			{meta.label}
		</span>
	);
}

export default StatusBadge;
