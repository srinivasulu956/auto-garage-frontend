import { memo } from 'react';

function ConfirmModal({ icon, title, body, confirmLabel, confirmClass, onConfirm, onCancel, submitting }) {
	return (
		<div className="vd-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
			<div className="vd-modal">
				<div className="vd-modal__icon">{icon}</div>
				<h3 className="vd-modal__title">{title}</h3>
				<div className="vd-modal__body">{body}</div>
				<div className="vd-modal__actions">
					<button className="sd-btn sd-btn--ghost" onClick={onCancel} disabled={submitting}>
						Cancel
					</button>
					<button className={`sd-btn ${confirmClass}`} onClick={onConfirm} disabled={submitting}>
						{submitting ? 'Please wait…' : confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}

export default memo(ConfirmModal);
