import api from './api-client';

const BASE = '/admin';

// ── Customers ─────────────────────────────────────────────────────────────────

export const adminCustomerService = {
	getAll() {
		return api.get(`${BASE}/customers`);
	},
	getById(id) {
		return api.get(`${BASE}/customers/${id}`);
	},
	toggleActive(id) {
		return api.patch(`${BASE}/customers/${id}/toggle-active`);
	},
};

// ── Staff ─────────────────────────────────────────────────────────────────────

export const adminStaffService = {
	getAll() {
		return api.get(`${BASE}/staff`);
	},
	toggleActive(id) {
		return api.patch(`${BASE}/staff/${id}/toggle-active`);
	},
	// Staff creation goes through Auth — POST /api/auth/register-staff
	registerStaff(data) {
		return api.post('/Auth/register-staff', data);
	},
};
