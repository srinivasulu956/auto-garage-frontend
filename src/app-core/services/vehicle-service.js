import api from './api-client';

const BASE = '/vehicle';

const vehicleService = {
	/** All ACTIVE vehicles for the logged-in customer */
	getAll() {
		return api.get(BASE);
	},

	/** All INACTIVE (soft-deleted) vehicles for the logged-in customer */
	getInactive() {
		return api.get(`${BASE}/inactive`);
	},

	getById(id) {
		return api.get(`${BASE}/${id}`);
	},

	/**
	 * Returns an array of vehicleId (Guid strings) that currently have
	 * an active booking (not Paid, not Cancelled).
	 * Used by the new-booking wizard to disable those vehicle cards.
	 */
	getBusyIds() {
		return api.get(`${BASE}/busy-ids`);
	},

	create(vehicleData) {
		return api.post(BASE, vehicleData);
	},

	update(id, vehicleData) {
		return api.put(`${BASE}/${id}`, vehicleData);
	},

	/** Dedicated PATCH endpoint — cleaner than update({ isActive: true }) */
	reactivate(id) {
		return api.patch(`${BASE}/${id}/reactivate`);
	},

	delete(id) {
		return api.delete(`${BASE}/${id}`);
	},
};

export default vehicleService;
