const DEFAULT_DATE_OPTIONS = { day: '2-digit', month: 'short', year: 'numeric' };

export const formatDateIN = (date, options = DEFAULT_DATE_OPTIONS, fallback = '—') =>
	date ? new Date(date).toLocaleDateString('en-IN', options) : fallback;

export const formatDateTimeIN = (date, options = { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }, fallback = '—') =>
	date ? new Date(date).toLocaleString('en-IN', options) : fallback;
