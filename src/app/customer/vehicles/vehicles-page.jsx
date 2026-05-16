import { useCallback, useEffect, useState } from 'react';
import { toastError, toastSuccess } from '../../../app-core/services/toast-service';
import vehicleService from '../../../app-core/services/vehicle-service';
import VehicleCard from '../../../features/vehicles/components/VehicleCard';
import VehicleConfirmModal from '../../../features/vehicles/components/VehicleConfirmModal';
import VehicleEmptyState from '../../../features/vehicles/components/VehicleEmptyState';
import VehicleForm from '../../../features/vehicles/components/VehicleForm';
import VehicleSkeletonCard from '../../../features/vehicles/components/VehicleSkeletonCard';
import SideDrawer from '../../../shared/components/SideDrawer/SideDrawer';
import './vehicles-page.scss';

export default function VehiclesPage() {
	const [activeVehicles, setActiveVehicles] = useState([]);
	const [inactiveVehicles, setInactiveVehicles] = useState([]);
	const [loadingActive, setLoadingActive] = useState(false);
	const [loadingInactive, setLoadingInactive] = useState(false);
	const [inactiveLoaded, setInactiveLoaded] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [activeTab, setActiveTab] = useState('active');

	const [panel, setPanel] = useState(null);
	const [deleteTarget, setDeleteTarget] = useState(null);
	const [reactivateTarget, setReactivateTarget] = useState(null);

	// ─── Loaders ──────────────────────────────────────────────────────────────

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

	useEffect(() => {
		loadActive();
	}, [loadActive]);

	const handleTabChange = (tab) => {
		setActiveTab(tab);
		if (tab === 'inactive' && !inactiveLoaded) loadInactive();
	};

	// ─── Handlers ─────────────────────────────────────────────────────────────

	const handleAdd = async (data) => {
		try {
			setSubmitting(true);
			const created = await vehicleService.create(data);
			setActiveVehicles((p) => [created, ...p]);
			toastSuccess('Vehicle added');
			setPanel(null);
		} catch (e) {
			toastError(e.message || 'Failed to add vehicle');
		} finally {
			setSubmitting(false);
		}
	};

	const handleEdit = async (data) => {
		try {
			setSubmitting(true);
			const updated = await vehicleService.update(panel.vehicle.id, data);
			setActiveVehicles((p) => p.map((v) => (v.id === updated.id ? updated : v)));
			toastSuccess('Vehicle updated');
			setPanel(null);
		} catch (e) {
			toastError(e.message || 'Failed to update vehicle');
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async () => {
		try {
			setSubmitting(true);
			await vehicleService.delete(deleteTarget.id);
			const removed = { ...deleteTarget, isActive: false };
			setActiveVehicles((p) => p.filter((v) => v.id !== deleteTarget.id));
			if (inactiveLoaded) setInactiveVehicles((p) => [removed, ...p]);
			toastSuccess('Vehicle moved to inactive');
			setDeleteTarget(null);
		} catch (e) {
			toastError(e.message || 'Failed to remove vehicle');
		} finally {
			setSubmitting(false);
		}
	};

	const handleReactivate = async () => {
		try {
			setSubmitting(true);
			const updated = await vehicleService.reactivate(reactivateTarget.id);
			setInactiveVehicles((p) => p.filter((v) => v.id !== reactivateTarget.id));
			setActiveVehicles((p) => [updated, ...p]);
			toastSuccess('Vehicle reactivated');
			setReactivateTarget(null);
			setActiveTab('active');
		} catch (e) {
			toastError(e.message || 'Failed to reactivate vehicle');
		} finally {
			setSubmitting(false);
		}
	};

	// ─── Render ───────────────────────────────────────────────────────────────

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
					<button className="vp-add-btn" onClick={() => setPanel({ type: 'add' })}>
						+ Add Vehicle
					</button>
				)}
			</section>

			{/* ── Tabs ── */}
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

			{/* ── Content ── */}
			{loading ? (
				<div className="vp-grid">
					{[1, 2, 3].map((i) => (
						<VehicleSkeletonCard key={i} />
					))}
				</div>
			) : list.length === 0 ? (
				<VehicleEmptyState tab={activeTab} onAdd={() => setPanel({ type: 'add' })} />
			) : (
				<div className={`vp-grid ${activeTab === 'inactive' ? 'vp-grid--inactive' : ''}`}>
					{list.map((v) => (
						<VehicleCard
							key={v.id}
							vehicle={v}
							inactive={activeTab === 'inactive'}
							onEdit={(vehicle) => setPanel({ type: 'edit', vehicle })}
							onDelete={setDeleteTarget}
							onReactivate={setReactivateTarget}
						/>
					))}
				</div>
			)}

			{/* ── Side Drawer ── */}
			<SideDrawer
				isOpen={!!panel}
				onClose={() => setPanel(null)}
				title={panel?.type === 'edit' ? 'Edit Vehicle' : 'Add New Vehicle'}
				disabled={submitting}
			>
				{panel && (
					<VehicleForm
						initial={panel.type === 'edit' ? panel.vehicle : null}
						onSubmit={panel.type === 'add' ? handleAdd : handleEdit}
						onCancel={() => setPanel(null)}
						submitting={submitting}
					/>
				)}
			</SideDrawer>

			{/* ── Delete Modal ── */}
			{deleteTarget && (
				<VehicleConfirmModal
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

			{/* ── Reactivate Modal ── */}
			{reactivateTarget && (
				<VehicleConfirmModal
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
