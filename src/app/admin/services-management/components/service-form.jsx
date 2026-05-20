import { useState } from 'react';
import { EMPTY_SERVICE_TYPE_FORM } from '../../../../shared/data-modals/service-type-data';

export default function ServiceForm({ initial, onSubmit, onCancel, submitting }) {
	const isEdit = !!initial?.id;

	const [form, setForm] = useState(initial || EMPTY_SERVICE_TYPE_FORM);
	const [errors, setErrors] = useState({});

	const set = (k, v) => {
		setForm((p) => ({ ...p, [k]: v }));

		if (errors[k]) {
			setErrors((p) => ({ ...p, [k]: '' }));
		}
	};

	const validate = () => {
		const e = {};

		if (!form.name.trim()) e.name = 'Required';
		if (!form.basePrice) e.basePrice = 'Required';
		if (!form.estimatedHours) e.estimatedHours = 'Required';

		return e;
	};

	const submit = (e) => {
		e.preventDefault();

		const errs = validate();

		if (Object.keys(errs).length) {
			setErrors(errs);

			const first = Object.keys(errs)[0];
			document.querySelector(`[name="${first}"]`)?.focus();

			return;
		}

		onSubmit({
			name: form.name,
			description: form.description || null,
			basePrice: Number(form.basePrice),
			estimatedHours: Number(form.estimatedHours),
		});
	};

	return (
		<form className="sd-form" onSubmit={submit}>
			<div className="sd-section-label">Service Details</div>

			<div className="sd-field">
				<label className="required">Name</label>

				<input
					name="name"
					className={`sd-input ${errors.name ? 'has-error' : ''}`}
					value={form.name}
					onChange={(e) => set('name', e.target.value)}
				/>

				{errors.name && <span className="sd-error">{errors.name}</span>}
			</div>

			<div className="sd-field">
				<label>Description</label>

				<textarea className="sd-input sd-textarea" value={form.description} onChange={(e) => set('description', e.target.value)} />
			</div>

			<div className="sd-row">
				<div className="sd-field">
					<label className="required">Base Price</label>

					<input
						name="basePrice"
						type="number"
						className={`sd-input ${errors.basePrice ? 'has-error' : ''}`}
						value={form.basePrice}
						onChange={(e) => set('basePrice', e.target.value)}
					/>

					{errors.basePrice && <span className="sd-error">{errors.basePrice}</span>}
				</div>

				<div className="sd-field">
					<label className="required">Hours</label>

					<input
						name="estimatedHours"
						type="number"
						className={`sd-input ${errors.estimatedHours ? 'has-error' : ''}`}
						value={form.estimatedHours}
						onChange={(e) => set('estimatedHours', e.target.value)}
					/>

					{errors.estimatedHours && <span className="sd-error">{errors.estimatedHours}</span>}
				</div>
			</div>

			<div className="sd-footer">
				<button type="button" className="sd-btn sd-btn--ghost" onClick={onCancel}>
					Cancel
				</button>

				<button type="submit" className="sd-btn sd-btn--primary" disabled={submitting}>
					{submitting ? 'Saving...' : isEdit ? 'Update' : 'Add'}
				</button>
			</div>
		</form>
	);
}
