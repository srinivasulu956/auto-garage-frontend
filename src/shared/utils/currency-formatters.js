export const formatCurrencyIN = (value, options = {}) =>
	'₹' +
	(value || 0).toLocaleString('en-IN', {
		minimumFractionDigits: options.minimumFractionDigits,
		maximumFractionDigits: options.maximumFractionDigits ?? 0,
	});
