export const BOOKING_STATUS_META = {
	Pending: { bg: '#fff7ed', color: '#c2410c', dot: '#f97316', label: 'Pending' },
	Confirmed: { bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6', label: 'Confirmed' },
	AssignedToMechanic: { bg: '#f0f9ff', color: '#0369a1', dot: '#0ea5e9', label: 'Assigned to Mechanic' },
	InProgress: { bg: '#fefce8', color: '#a16207', dot: '#eab308', label: 'In Progress' },
	WaitingForParts: { bg: '#fdf4ff', color: '#7e22ce', dot: '#a855f7', label: 'Waiting for Parts' },
	QualityCheck: { bg: '#fff7ed', color: '#c2410c', dot: '#f97316', label: 'Quality Check' },
	Completed: { bg: '#f0fdf4', color: '#15803d', dot: '#22c55e', label: 'Completed' },
	InvoiceGenerated: { bg: '#fefce8', color: '#854d0e', dot: '#f59e0b', label: 'Invoice Sent' },
	Paid: { bg: '#f0fdf4', color: '#15803d', dot: '#22c55e', label: 'Paid' },
	Cancelled: { bg: '#fef2f2', color: '#991b1b', dot: '#ef4444', label: 'Cancelled' },
};

const BOOKING_STATUS_LABEL_VARIANTS = {
	compact: {
		AssignedToMechanic: 'Assigned',
		WaitingForParts: 'Waiting Parts',
	},
	mechanic: {
		AssignedToMechanic: 'Assigned',
	},
	customerDashboard: {
		AssignedToMechanic: 'Assigned',
		InvoiceGenerated: 'Invoice Ready',
	},
};

export const UNKNOWN_BOOKING_STATUS_META = {
	bg: '#f3f4f6',
	color: '#374151',
	dot: '#9ca3af',
	label: 'Unknown',
};

export const BOOKING_STATUS_STEPS = [
	'Pending',
	'Confirmed',
	'AssignedToMechanic',
	'InProgress',
	'QualityCheck',
	'Completed',
	'InvoiceGenerated',
	'Paid',
];

export const ADMIN_BOOKING_FILTERS = [
	{ key: 'all', label: 'All' },
	{ key: 'Pending', label: 'Pending' },
	{ key: 'Confirmed', label: 'Confirmed' },
	{ key: 'active', label: 'In Progress' },
	{ key: 'Completed', label: 'Completed' },
	{ key: 'Paid', label: 'Paid' },
];

export const CUSTOMER_BOOKING_FILTERS = [
	{ key: 'all', label: 'All' },
	{ key: 'active', label: 'Active' },
	{ key: 'completed', label: 'Completed' },
	{ key: 'cancelled', label: 'Cancelled' },
];

export const MECHANIC_JOB_FILTERS = [
	{ key: 'all', label: 'All' },
	{ key: 'active', label: 'Active' },
	{ key: 'qc', label: 'Quality Check' },
	{ key: 'done', label: 'Completed' },
];

export const ADMIN_ACTIVE_BOOKING_STATUSES = ['AssignedToMechanic', 'InProgress', 'WaitingForParts', 'QualityCheck'];

export const ADMIN_DASHBOARD_ACTIVE_BOOKING_STATUSES = [
	'Pending',
	'Confirmed',
	'AssignedToMechanic',
	'InProgress',
	'WaitingForParts',
	'QualityCheck',
];

export const CUSTOMER_ACTIVE_BOOKING_STATUSES = [
	'Pending',
	'Confirmed',
	'AssignedToMechanic',
	'InProgress',
	'WaitingForParts',
	'QualityCheck',
	'InvoiceGenerated',
];

export const CUSTOMER_DASHBOARD_INACTIVE_BOOKING_STATUSES = ['Cancelled', 'Paid'];
export const COMPLETED_BOOKING_STATUSES = ['Completed', 'Paid'];
export const MECHANIC_ACTIVE_JOB_STATUSES = ['AssignedToMechanic', 'InProgress', 'WaitingForParts'];
export const MECHANIC_DONE_JOB_STATUSES = ['Completed', 'Paid'];
export const ADMIN_ACTION_REQUIRED_STATUSES = ['Pending', 'Confirmed', 'QualityCheck'];

export const MECHANIC_STATUS_ENUM = {
	InProgress: 3,
	WaitingForParts: 4,
	QualityCheck: 5,
};

export const WORKLOG_LOCKED_STATUSES = ['QualityCheck', 'Completed', 'InvoiceGenerated', 'Paid', 'Cancelled'];
export const MECHANIC_FINAL_STATUSES = ['Completed', 'InvoiceGenerated', 'Paid', 'Cancelled', 'QualityCheck'];

export const getBookingStatusMeta = (status, variant = 'default') => {
	const key = status?.replace(/ /g, '') ?? '';
	const base = BOOKING_STATUS_META[key] ||
		BOOKING_STATUS_META[status] || {
			...UNKNOWN_BOOKING_STATUS_META,
			label: status || UNKNOWN_BOOKING_STATUS_META.label,
		};
	const variantLabel = BOOKING_STATUS_LABEL_VARIANTS[variant]?.[key];

	return {
		...base,
		label: variantLabel || base.label,
	};
};
