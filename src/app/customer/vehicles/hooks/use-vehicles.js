import { useCallback, useState } from 'react';
import { toastError, toastSuccess } from '../../../../app-core/services/toast-service';
import vehicleService from '../../../../app-core/services/vehicle-service';

export function useVehicles() {
	const [activeVehicles, setActiveVehicles] = useState([]);
	const [inactiveVehicles, setInactiveVehicles] = useState([]);
	const [loadingActive, setLoadingActive] = useState(false);
	const [loadingInactive, setLoadingInactive] = useState(false);
	const [inactiveLoaded, setInactiveLoaded] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const loadActive = useCallback(async () => {
		try {
			setLoadingActive(true);
			setActiveVehicles(await vehicleService.getAll());
		} catch {
			toastError('Failed to load vehicles');
		} finally {
			setLoadingActive(false);
		}
	}, []);

	const loadInactive = useCallback(async () => {
		try {
			setLoadingInactive(true);
			setInactiveVehicles(await vehicleService.getInactive());
			setInactiveLoaded(true);
		} catch {
			toastError('Failed to load inactive vehicles');
		} finally {
			setLoadingInactive(false);
		}
	}, []);

	const addVehicle = useCallback(async (data) => {
		try {
			setSubmitting(true);
			const created = await vehicleService.create(data);
			setActiveVehicles((p) => [created, ...p]);
			toastSuccess('Vehicle added');
			return true;
		} catch (e) {
			toastError(e.message || 'Failed to add vehicle');
			return false;
		} finally {
			setSubmitting(false);
		}
	}, []);

	const updateVehicle = useCallback(async (vehicleId, data) => {
		try {
			setSubmitting(true);
			const updated = await vehicleService.update(vehicleId, data);
			setActiveVehicles((p) => p.map((v) => (v.id === updated.id ? updated : v)));
			toastSuccess('Vehicle updated');
			return true;
		} catch (e) {
			toastError(e.message || 'Failed to update vehicle');
			return false;
		} finally {
			setSubmitting(false);
		}
	}, []);

	const removeVehicle = useCallback(
		async (vehicle) => {
			try {
				setSubmitting(true);
				await vehicleService.delete(vehicle.id);
				const removed = { ...vehicle, isActive: false };
				setActiveVehicles((p) => p.filter((v) => v.id !== vehicle.id));
				if (inactiveLoaded) setInactiveVehicles((p) => [removed, ...p]);
				toastSuccess('Vehicle moved to inactive');
				return true;
			} catch (e) {
				toastError(e.message || 'Failed to remove vehicle');
				return false;
			} finally {
				setSubmitting(false);
			}
		},
		[inactiveLoaded]
	);

	const reactivateVehicle = useCallback(async (vehicle) => {
		try {
			setSubmitting(true);
			const updated = await vehicleService.reactivate(vehicle.id);
			setInactiveVehicles((p) => p.filter((v) => v.id !== vehicle.id));
			setActiveVehicles((p) => [updated, ...p]);
			toastSuccess('Vehicle reactivated');
			return true;
		} catch (e) {
			toastError(e.message || 'Failed to reactivate vehicle');
			return false;
		} finally {
			setSubmitting(false);
		}
	}, []);

	return {
		activeVehicles,
		inactiveVehicles,
		loadingActive,
		loadingInactive,
		inactiveLoaded,
		submitting,
		loadActive,
		loadInactive,
		addVehicle,
		updateVehicle,
		removeVehicle,
		reactivateVehicle,
	};
}
