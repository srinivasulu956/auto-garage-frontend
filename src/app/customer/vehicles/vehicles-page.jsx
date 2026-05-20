import { useCallback, useEffect, useState } from 'react';
import SideDrawer from '../../../shared/components/side-drawer/side-drawer';
import ConfirmModal from './components/confirm-modal';
import EmptyState from './components/empty-state';
import SkeletonCard from './components/skeleton-card';
import VehicleCard from './components/vehicle-card';
import VehicleForm from './components/vehicle-form';
import { useVehicles } from './hooks/use-vehicles';
import './vehicles-page.scss';

export default function VehiclesPage() {
	const [activeTab, setActiveTab] = useState('active');

	const [panel, setPanel] = useState(null);
	const [deleteTarget, setDeleteTarget] = useState(null);
	const [reactivateTarget, setReactivateTarget] = useState(null);
	const editingVehicleId = panel?.vehicle?.id;
	const {
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
	} = useVehicles();

	useEffect(() => {
		loadActive();
	}, [loadActive]);

	const openAddPanel = useCallback(() => setPanel({ type: 'add' }), []);
	const openEditPanel = useCallback((vehicle) => setPanel({ type: 'edit', vehicle }), []);
	const closePanel = useCallback(() => setPanel(null), []);

	const handleTabChange = useCallback(
		(tab) => {
			setActiveTab(tab);
			if (tab === 'inactive' && !inactiveLoaded) loadInactive();
		},
		[inactiveLoaded, loadInactive]
	);

	const handleAdd = useCallback(
		async (data) => {
			const saved = await addVehicle(data);
			if (saved) closePanel();
		},
		[addVehicle, closePanel]
	);

	const handleEdit = useCallback(
		async (data) => {
			const saved = await updateVehicle(editingVehicleId, data);
			if (saved) closePanel();
		},
		[closePanel, editingVehicleId, updateVehicle]
	);

	const handleDelete = useCallback(async () => {
		const removed = await removeVehicle(deleteTarget);
		if (removed) setDeleteTarget(null);
	}, [deleteTarget, removeVehicle]);

	const handleReactivate = useCallback(async () => {
		const reactivated = await reactivateVehicle(reactivateTarget);
		if (reactivated) {
			setReactivateTarget(null);
			setActiveTab('active');
		}
	}, [reactivateTarget, reactivateVehicle]);

	const list = activeTab === 'active' ? activeVehicles : inactiveVehicles;
	const loading = activeTab === 'active' ? loadingActive : loadingInactive;

	return (
		<div className="dashboard-page vehicles-page">
			<section className="page-hero compact">
				<div>
					<p className="page-kicker">My Garage</p>
					<h1>My Vehicles</h1>
				</div>
				{activeTab === 'active' && (
					<button className="vp-add-btn" onClick={openAddPanel}>
						+ Add Vehicle
					</button>
				)}
			</section>

			<div className="vp-tabs" role="tablist">
				<button
					role="tab"
					aria-selected={activeTab === 'active'}
					className={`vp-tab ${activeTab === 'active' ? 'vp-tab--active' : ''}`}
					onClick={() => handleTabChange('active')}
				>
					🚗 Active Vehicles
					{activeVehicles.length > 0 && <span className="vp-tab__count">{activeVehicles.length}</span>}
				</button>
				<button
					role="tab"
					aria-selected={activeTab === 'inactive'}
					className={`vp-tab ${activeTab === 'inactive' ? 'vp-tab--active' : ''}`}
					onClick={() => handleTabChange('inactive')}
				>
					🗄️ Inactive
					{inactiveLoaded && inactiveVehicles.length > 0 && (
						<span className="vp-tab__count vp-tab__count--muted">{inactiveVehicles.length}</span>
					)}
				</button>
			</div>

			{activeTab === 'inactive' && (
				<p className="vp-inactive-hint">
					Removed vehicles are stored here. Their booking history is always preserved. Reactivate any time.
				</p>
			)}

			{loading ? (
				<div className="vp-grid">
					{[1, 2, 3].map((i) => (
						<SkeletonCard key={i} />
					))}
				</div>
			) : list.length === 0 ? (
				<EmptyState tab={activeTab} onAdd={openAddPanel} />
			) : (
				<div className={`vp-grid ${activeTab === 'inactive' ? 'vp-grid--inactive' : ''}`}>
					{list.map((vehicle) => (
						<VehicleCard
							key={vehicle.id}
							vehicle={vehicle}
							inactive={activeTab === 'inactive'}
							onEdit={openEditPanel}
							onDelete={setDeleteTarget}
							onReactivate={setReactivateTarget}
						/>
					))}
				</div>
			)}

			<SideDrawer
				isOpen={!!panel}
				onClose={closePanel}
				title={panel?.type === 'edit' ? 'Edit Vehicle' : 'Add New Vehicle'}
				disabled={submitting}
			>
				{panel && (
					<VehicleForm
						initial={panel.type === 'edit' ? panel.vehicle : null}
						onSubmit={panel.type === 'add' ? handleAdd : handleEdit}
						onCancel={closePanel}
						submitting={submitting}
					/>
				)}
			</SideDrawer>

			{deleteTarget && (
				<ConfirmModal
					icon="🗑️"
					title="Remove Vehicle?"
					body={
						<>
							<strong>
								{deleteTarget.make} {deleteTarget.model}
							</strong>{' '}
							({deleteTarget.licensePlate}) will be moved to inactive. You can reactivate it any time.
						</>
					}
					confirmLabel="Remove"
					confirmClass="sd-btn--danger"
					onConfirm={handleDelete}
					onCancel={() => setDeleteTarget(null)}
					submitting={submitting}
				/>
			)}

			{reactivateTarget && (
				<ConfirmModal
					icon="♻️"
					title="Reactivate Vehicle?"
					body={
						<>
							<strong>
								{reactivateTarget.make} {reactivateTarget.model}
							</strong>{' '}
							({reactivateTarget.licensePlate}) will be moved back to your active garage.
						</>
					}
					confirmLabel="Reactivate"
					confirmClass="sd-btn--success"
					onConfirm={handleReactivate}
					onCancel={() => setReactivateTarget(null)}
					submitting={submitting}
				/>
			)}
		</div>
	);
}
