import { useCallback, useEffect, useState } from 'react';
import serviceTypeService from '../../../app-core/services/service-type-service';
import { toastError, toastSuccess } from '../../../app-core/services/toast-service';
import ServiceTypeCard from '../../../features/service-types/components/ServiceTypeCard';
import ServiceTypeDeleteModal from '../../../features/service-types/components/ServiceTypeDeleteModal';
import ServiceTypeForm from '../../../features/service-types/components/ServiceTypeForm';
import ServiceTypeSkeletonGrid from '../../../features/service-types/components/ServiceTypeSkeletonGrid';
import SideDrawer from '../../../shared/components/SideDrawer/SideDrawer';
import './service-types-page.scss';

export default function ServiceTypesPage() {
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

	const loadInactive = async () => {
		try {
			setLoadingInactive(true);
			setInactiveList(await serviceTypeService.getInactive());
			setInactiveLoaded(true);
		} catch {
			toastError('Failed to load inactive services');
		} finally {
			setLoadingInactive(false);
		}
	};

	useEffect(() => {
		loadActive();
	}, [loadActive]);

	const handleTab = (tab) => {
		setActiveTab(tab);

		if (tab === 'inactive' && !inactiveLoaded) {
			loadInactive();
		}
	};

	const create = async (data) => {
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
	};

	const update = async (data) => {
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
	};

	const remove = async () => {
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
	};

	const reactivate = async (item) => {
		try {
			await serviceTypeService.reactivate(item.id);

			setInactiveList((p) => p.filter((x) => x.id !== item.id));

			setActiveList((p) => [item, ...p]);

			toastSuccess('Reactivated');
		} catch {
			toastError('Reactivate failed');
		}
	};

	const list = activeTab === 'active' ? activeList : inactiveList;

	const loading = activeTab === 'active' ? loadingActive : loadingInactive;

	return (
		<div className="service-page">
			<div className="page-header">
				<h1>Service Types</h1>

				<button className="add-btn" onClick={() => setPanel({ type: 'add' })}>
					+ Add Service
				</button>
			</div>

			<div className="st-tabs">
				<button className={activeTab === 'active' ? 'active' : ''} onClick={() => handleTab('active')}>
					Active ({activeList.length})
				</button>

				<button className={activeTab === 'inactive' ? 'active' : ''} onClick={() => handleTab('inactive')}>
					Inactive ({inactiveList.length})
				</button>
			</div>

			{loading ? (
				<ServiceTypeSkeletonGrid />
			) : (
				<div className="st-grid">
					{list.map((item) => (
						<ServiceTypeCard
							key={item.id}
							item={item}
							inactive={activeTab === 'inactive'}
							onEdit={(i) =>
								setPanel({
									type: 'edit',
									item: i,
								})
							}
							onDelete={setDeleteTarget}
							onReactivate={reactivate}
						/>
					))}
				</div>
			)}

			<SideDrawer isOpen={!!panel} onClose={() => setPanel(null)} title={panel?.type === 'edit' ? 'Edit Service' : 'Add Service'}>
				{panel && (
					<ServiceTypeForm
						initial={panel.type === 'edit' ? panel.item : null}
						onSubmit={panel.type === 'add' ? create : update}
						onCancel={() => setPanel(null)}
						submitting={submitting}
					/>
				)}
			</SideDrawer>

			{deleteTarget && (
				<ServiceTypeDeleteModal item={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={remove} />
			)}
		</div>
	);
}
