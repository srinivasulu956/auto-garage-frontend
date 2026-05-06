import api from './api-client';

const MECHANIC_BASE = '/mechanic/jobs';

export const mechanicJobService = {
	getAll() {
		return api.get(MECHANIC_BASE);
	},
	getById(id) {
		return api.get(`${MECHANIC_BASE}/${id}`);
	},
	updateStatus(id, data) {
		return api.patch(`${MECHANIC_BASE}/${id}/status`, data);
	},
};

// ── Work Log ──────────────────────────────────────────────────────────────────

export const workLogService = {
	// Get all work log items for a booking (mechanic view)
	getByBookingId(bookingId) {
		return api.get(`${MECHANIC_BASE}/${bookingId}/worklog`);
	},
	// Add a new work log item
	add(bookingId, data) {
		return api.post(`${MECHANIC_BASE}/${bookingId}/worklog`, data);
	},
	// Delete a work log item
	delete(itemId) {
		return api.delete(`${MECHANIC_BASE}/worklog/${itemId}`);
	},
};
