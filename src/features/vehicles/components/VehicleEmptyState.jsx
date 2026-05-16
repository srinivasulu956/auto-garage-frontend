export default function VehicleEmptyState({ tab, onAdd }) {
	if (tab === 'inactive')
		return (
			<div className="vp-empty">
				<span className="vp-empty__icon">🗄️</span>
				<p className="vp-empty__title">No inactive vehicles</p>
				<p className="vp-empty__sub">Vehicles you remove will appear here — their booking history is always preserved.</p>
			</div>
		);
	return (
		<div className="vp-empty">
			<span className="vp-empty__icon">🚗</span>
			<p className="vp-empty__title">Your garage is empty</p>
			<p className="vp-empty__sub">Add your first vehicle to start booking services.</p>
			<button className="vp-add-btn" onClick={onAdd}>
				+ Add Vehicle
			</button>
		</div>
	);
}
