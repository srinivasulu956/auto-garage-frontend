import api, { authApi } from './api-client';

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
	// Creating a staff account writes a user, so it belongs to the Auth service — the
	// garage API cannot create users any more. Everything above it on this screen is
	// still the garage API, which reads staff through its auth gateway.
	registerStaff(data) {
		return authApi.post('/register-staff', data);
	},
};
