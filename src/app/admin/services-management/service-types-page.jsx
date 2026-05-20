import SideDrawer from '../../../shared/components/side-drawer/side-drawer';
import ServiceCard from './components/service-card';
import ServiceDeleteModal from './components/service-delete-modal';
import ServiceForm from './components/service-form';
import ServiceSkeletonGrid from './components/service-skeleton-grid';
import { useServiceTypes } from './hooks/use-service-types';
import './service-types-page.scss';

export default function ServiceTypesPage() {
	const {
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
	} = useServiceTypes();

	return (
		<div className="service-page">
			<div className="page-header">
				<h1>Service Types</h1>

				<button className="add-btn" onClick={openAddPanel}>
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
				<ServiceSkeletonGrid />
			) : (
				<div className="st-grid">
					{list.map((item) => (
						<ServiceCard
							key={item.id}
							item={item}
							inactive={activeTab === 'inactive'}
							onEdit={openEditPanel}
							onDelete={setDeleteTarget}
							onReactivate={reactivate}
						/>
					))}
				</div>
			)}

			<SideDrawer isOpen={!!panel} onClose={closePanel} title={panel?.type === 'edit' ? 'Edit Service' : 'Add Service'}>
				{panel && (
					<ServiceForm
						initial={panel.type === 'edit' ? panel.item : null}
						onSubmit={panel.type === 'add' ? create : update}
						onCancel={closePanel}
						submitting={submitting}
					/>
				)}
			</SideDrawer>

			{deleteTarget && <ServiceDeleteModal service={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={remove} />}
		</div>
	);
}
