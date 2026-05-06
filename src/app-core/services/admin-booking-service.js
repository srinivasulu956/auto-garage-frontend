import api from './api-client';

const ADMIN_BASE = '/admin/bookings';

// ── Admin Bookings ────────────────────────────────────────────────────────────

export const adminBookingService = {
	getAll() {
		return api.get(ADMIN_BASE);
	},
	getById(id) {
		return api.get(`${ADMIN_BASE}/${id}`);
	},
	getMechanics() {
		return api.get(`${ADMIN_BASE}/mechanics`);
	},
	confirm(id, data) {
		return api.patch(`${ADMIN_BASE}/${id}/confirm`, data);
	},
	assignMechanic(id, data) {
		return api.patch(`${ADMIN_BASE}/${id}/assign`, data);
	},
	// QualityCheck → AssignedToMechanic (send back for rework)
	reassignMechanic(id, data) {
		return api.patch(`${ADMIN_BASE}/${id}/reassign`, data);
	},
	updateStatus(id, data) {
		return api.patch(`${ADMIN_BASE}/${id}/status`, data);
	},
	// Get mechanic work log for a booking (admin view)
	getWorkLog(bookingId) {
		return api.get(`${ADMIN_BASE}/${bookingId}/worklog`);
	},
};

// ── Invoice ───────────────────────────────────────────────────────────────────

export const invoiceService = {
	getAll() {
		return api.get('/invoice');
	},
	getById(id) {
		return api.get(`/invoice/${id}`);
	},
	getByBookingId(bId) {
		return api.get(`/invoice/booking/${bId}`);
	},
	pay(id, data) {
		return api.post(`/invoice/${id}/pay`, data);
	},
	// Admin only
	generate(data) {
		return api.post('/invoice', data);
	},
	getAllAdmin() {
		return api.get('/invoice/admin/all');
	},
	// Admin: get invoice by booking id (no customer ownership check)
	getByBookingIdAdmin(bId) {
		return api.get(`/invoice/admin/booking/${bId}`);
	},
};
