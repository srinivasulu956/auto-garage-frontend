import api from './api-client';

const SERVICE_TYPE_BASE = '/servicetype';

const serviceTypeService = {
	getAll: async () => {
		const res = await api.get(SERVICE_TYPE_BASE);
		return res;
	},

	create: async (data) => {
		const res = await api.post(SERVICE_TYPE_BASE, data);
		return res;
	},

	update: async (id, data) => {
		const res = await api.put(`${SERVICE_TYPE_BASE}/${id}`, data);
		return res;
	},

	delete: async (id) => {
		const res = await api.delete(`${SERVICE_TYPE_BASE}/${id}`);
		return res;
	},

	// ─────────────────────────────
	// NEW (inactive services)
	// ─────────────────────────────
	getInactive: async () => {
		const res = await api.get(`${SERVICE_TYPE_BASE}/inactive`);
		return res;
	},

	// ─────────────────────────────
	// NEW (reactivate service)
	// ─────────────────────────────
	reactivate: async (id) => {
		const res = await api.put(`${SERVICE_TYPE_BASE}/${id}/reactivate`);
		return res;
	},
};

export default serviceTypeService;
