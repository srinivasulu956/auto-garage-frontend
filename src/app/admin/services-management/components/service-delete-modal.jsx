export default function ServiceDeleteModal({ service, onCancel, onConfirm }) {
	return (
		<div className="st-overlay">
			<div className="st-modal">
				<div className="vd-modal__icon">🗑️</div>
				<p>
					Delete <b>{service.name}</b>? <p>It will be moved to inactive. You can reactivate it any time.</p>
				</p>

				<div className="st-actions confirm-actions">
					<button className="btn-cancel" onClick={onCancel}>
						Cancel
					</button>

					<button className="btn-delete" onClick={onConfirm}>
						Delete
					</button>
				</div>
			</div>
		</div>
	);
}
