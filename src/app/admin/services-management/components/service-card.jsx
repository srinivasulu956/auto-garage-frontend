import { memo } from 'react';

function ServiceCard({ item, onEdit, onDelete, onReactivate, inactive }) {
	return (
		<div className={`st-card ${inactive ? 'st-card--inactive' : ''}`}>
			<div className="st-top">
				<div className="vc__icon">🔧</div>

				<div className="st-actions">
					{inactive ? (
						<button className="st-btn-reactivate" onClick={() => onReactivate(item)}>
							♻ Reactivate
						</button>
					) : (
						<div className="d-flex gap-2">
							<button onClick={() => onEdit(item)}>✏️</button>
							<button onClick={() => onDelete(item)}>🗑️</button>
						</div>
					)}
				</div>
			</div>

			<div className="st-body">
				<h5 className="fw-bold mt-2">{item.name}</h5> <p>{item.description || 'No description'}</p>
			</div>

			<div className="st-footer">
				<span>₹ {item.basePrice}</span>

				<span className={inactive ? 'status-inactive' : 'status-active'}>{item.estimatedHours} hrs</span>
			</div>
		</div>
	);
}

export default memo(ServiceCard);
