import { useCallback, useEffect, useMemo, useState } from 'react';
import serviceTypeService from '../../../../app-core/services/service-type-service';
import { toastError, toastSuccess } from '../../../../app-core/services/toast-service';

export function useServiceTypes() {
	const [activeList, setActiveList] = useState([]);
	const [inactiveList, setInactiveList] = useState([]);

	const [loadingActive, setLoadingActive] = useState(false);
	const [loadingInactive, setLoadingInactive] = useState(false);
	const [inactiveLoaded, setInactiveLoaded] = useState(false);

	const [activeTab, setActiveTab] = useState('active');

	const [panel, setPanel] = useState(null);
	const [deleteTarget, setDeleteTarget] = useState(null);
	const [submitting, setSubmitting] = useState(false);

	const loadActive = useCallback(async () => {
		try {
			setLoadingActive(true);
			setActiveList(await serviceTypeService.getAll());
		} catch {
			toastError('Failed to load services');
		} finally {
			setLoadingActive(false);
		}
	}, []);

	const loadInactive = useCallback(async () => {
		try {
			setLoadingInactive(true);
			setInactiveList(await serviceTypeService.getInactive());
			setInactiveLoaded(true);
		} catch {
			toastError('Failed to load inactive services');
		} finally {
			setLoadingInactive(false);
		}
	}, []);

	useEffect(() => {
		loadActive();
	}, [loadActive]);

	const handleTab = useCallback(
		(tab) => {
			setActiveTab(tab);

			if (tab === 'inactive' && !inactiveLoaded) {
				loadInactive();
			}
		},
		[inactiveLoaded, loadInactive]
	);

	const openAddPanel = useCallback(() => {
		setPanel({ type: 'add' });
	}, []);

	const openEditPanel = useCallback((item) => {
		setPanel({
			type: 'edit',
			item,
		});
	}, []);

	const closePanel = useCallback(() => {
		setPanel(null);
	}, []);

	const create = useCallback(async (data) => {
		try {
			setSubmitting(true);

			const res = await serviceTypeService.create(data);

			setActiveList((p) => [res, ...p]);

			toastSuccess('Service added');
			setPanel(null);
		} catch {
			toastError('Create failed');
		} finally {
			setSubmitting(false);
		}
	}, []);

	const update = useCallback(
		async (data) => {
			try {
				setSubmitting(true);

				const res = await serviceTypeService.update(panel.item.id, data);

				setActiveList((p) => p.map((x) => (x.id === res.id ? res : x)));

				toastSuccess('Updated');
				setPanel(null);
			} catch {
				toastError('Update failed');
			} finally {
				setSubmitting(false);
			}
		},
		[panel]
	);

	const remove = useCallback(async () => {
		if (!deleteTarget) return;

		try {
			setSubmitting(true);

			await serviceTypeService.delete(deleteTarget.id);

			setActiveList((p) => p.filter((x) => x.id !== deleteTarget.id));

			setInactiveList((p) => [{ ...deleteTarget }, ...p]);

			toastSuccess('Moved to inactive');
			setDeleteTarget(null);
		} catch {
			toastError('Delete failed');
		} finally {
			setSubmitting(false);
		}
	}, [deleteTarget]);

	const reactivate = useCallback(async (item) => {
		try {
			await serviceTypeService.reactivate(item.id);

			setInactiveList((p) => p.filter((x) => x.id !== item.id));

			setActiveList((p) => [item, ...p]);

			toastSuccess('Reactivated');
		} catch {
			toastError('Reactivate failed');
		}
	}, []);

	const list = useMemo(() => (activeTab === 'active' ? activeList : inactiveList), [activeList, activeTab, inactiveList]);
	const loading = activeTab === 'active' ? loadingActive : loadingInactive;

	return {
		activeList,
		inactiveList,
		activeTab,
		panel,
		deleteTarget,
		submitting,
		list,
		loading,
		handleTab,
		openAddPanel,
		openEditPanel,
		closePanel,
		create,
		update,
		remove,
		reactivate,
		setDeleteTarget,
	};
}
