// PayModal.jsx
import { useState } from 'react';

const PAYMENT_METHODS = ['UPI', 'Card'];

function PayModal({ invoice, onPay, onClose, submitting }) {
	const [method, setMethod] = useState('UPI');
	const [upiId, setUpiId] = useState('');
	const [cardLast4, setCardLast4] = useState('');

	const handleSubmit = () => {
		if (method === 'UPI' && !upiId.trim()) return;
		if (method === 'Card' && cardLast4.length !== 4) return;

		onPay({
			paymentMethod: method,
			upiId: upiId || undefined,
			cardLastFour: cardLast4 || undefined,
		});
	};

	return (
		<div className="inv-overlay" onClick={(e) => e.target === e.currentTarget && !submitting && onClose()}>
			<div className="inv-modal">
				<div className="inv-modal__header">
					<h3>💳 Pay Invoice</h3>
					<button className="inv-modal__close" onClick={onClose} disabled={submitting}>
						✕
					</button>
				</div>

				<div className="inv-modal__amount">
					<span>Total Due</span>
					<strong>₹{(invoice.totalAmount || 0).toLocaleString('en-IN')}</strong>
				</div>

				<div className="inv-modal__body">
					<div className="sd-field">
						<label className="sd-label">Payment Method</label>
						<div className="inv-method-grid">
							{PAYMENT_METHODS.map((m) => (
								<button
									key={m}
									className={`inv-method-btn ${method === m ? 'inv-method-btn--active' : ''}`}
									onClick={() => setMethod(m)}
								>
									{m === 'UPI' ? '📲' : m === 'Card' ? '💳' : '💵'} {m}
								</button>
							))}
						</div>
					</div>

					{method === 'UPI' && (
						<div className="sd-field">
							<label className="sd-label">UPI ID</label>
							<input
								className="sd-input"
								placeholder="e.g. name@upi"
								value={upiId}
								onChange={(e) => setUpiId(e.target.value)}
							/>
						</div>
					)}

					{method === 'Card' && (
						<div className="sd-field">
							<label className="sd-label">Last 4 digits of card</label>
							<input
								className="sd-input"
								placeholder="e.g. 4242"
								maxLength={4}
								value={cardLast4}
								onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ''))}
							/>
						</div>
					)}

					{method === 'Cash' && (
						<div className="inv-cash-note">💵 Please pay at the service counter. Mark as paid after receiving cash.</div>
					)}
				</div>

				<div className="inv-modal__footer">
					<button className="sd-btn sd-btn--ghost" onClick={onClose} disabled={submitting}>
						Cancel
					</button>
					<button className="sd-btn sd-btn--primary" onClick={handleSubmit} disabled={submitting}>
						{submitting ? 'Processing…' : `Pay ₹${(invoice.totalAmount || 0).toLocaleString('en-IN')}`}
					</button>
				</div>
			</div>
		</div>
	);
}

export default PayModal;
