import api from './api-client';

const BOOKING_BASE = '/booking';
const SERVICE_TYPE_BASE = '/servicetype';
const INVOICE_BASE = '/invoice';

export const bookingService = {
	getAll() {
		return api.get(BOOKING_BASE);
	},
	getById(id) {
		return api.get(`${BOOKING_BASE}/${id}`);
	},
	create(data) {
		return api.post(BOOKING_BASE, data);
	},
	update(id, data) {
		return api.put(`${BOOKING_BASE}/${id}`, data);
	},
	cancel(id) {
		return api.delete(`${BOOKING_BASE}/${id}`);
	},
};

export const serviceTypeService = {
	getAll() {
		return api.get(SERVICE_TYPE_BASE);
	},
};

// ── Customer invoice service ───────────────────────────────────────────────────
// Keep customer invoice calls here (separate from admin-booking-service)

export const invoiceService = {
	getAll() {
		return api.get(INVOICE_BASE);
	},
	getById(id) {
		return api.get(`${INVOICE_BASE}/${id}`);
	},
	getByBookingId(bookingId) {
		return api.get(`${INVOICE_BASE}/booking/${bookingId}`);
	},
	pay(id, data) {
		return api.post(`${INVOICE_BASE}/${id}/pay`, data);
	},
};
