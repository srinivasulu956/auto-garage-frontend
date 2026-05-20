import { memo } from 'react';
import { getBookingStatusMeta } from '../../data-modals/booking-status';

function StatusBadge({ status, className, dotClassName, variant = 'default', showDot = true, children }) {
	const meta = getBookingStatusMeta(status, variant);

	return (
		<span className={className} style={{ background: meta.bg, color: meta.color }}>
			{showDot && dotClassName && <span className={dotClassName} style={{ background: meta.dot }} />}
			{children || meta.label}
		</span>
	);
}

export default memo(StatusBadge);
