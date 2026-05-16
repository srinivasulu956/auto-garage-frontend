import { useState } from 'react';
import { CURRENT_YEAR, EMPTY_FORM, FUEL_TYPES } from '../constants/vehicleConstants';

export default function VehicleForm({ initial, onSubmit, onCancel, submitting }) {
	const isEdit = !!initial?.id;
	// hasBookingHistory comes from the backend via VehicleResponseDto
	const hasHistory = isEdit && !!initial?.hasBookingHistory;

	const [form, setForm] = useState(
		initial
			? {
					make: initial.make ?? '',
					model: initial.model ?? '',
					year: initial.year ?? '',
					licensePlate: initial.licensePlate ?? '',
					vin: initial.vin ?? '',
					fuelType: initial.fuelType ?? 'Petrol',
					nickname: initial.nickname ?? '',
					notes: initial.notes ?? '',
				}
			: EMPTY_FORM
	);
	const [errors, setErrors] = useState({});

	const set = (field, value) => {
		setForm((p) => ({ ...p, [field]: value }));
		if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
	};

	const validate = () => {
		const e = {};
		if (!hasHistory) {
			if (!form.make.trim()) e.make = 'Make is required';
			if (!form.model.trim()) e.model = 'Model is required';
			if (!form.year) e.year = 'Year is required';
			else if (form.year < 1980 || form.year > CURRENT_YEAR + 1) e.year = `Between 1980–${CURRENT_YEAR + 1}`;
			if (!form.licensePlate.trim()) e.licensePlate = 'License plate is required';
		}
		if (form.nickname && form.nickname.length > 50) e.nickname = 'Max 50 characters';
		if (form.notes && form.notes.length > 250) e.notes = 'Max 250 characters';
		return e;
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		const errs = validate();
		if (Object.keys(errs).length) {
			setErrors(errs);
			return;
		}

		if (hasHistory) {
			onSubmit({ nickname: form.nickname || null, notes: form.notes || null });
		} else {
			onSubmit({
				make: form.make,
				model: form.model,
				year: parseInt(form.year),
				licensePlate: form.licensePlate.toUpperCase(),
				vin: form.vin || null,
				fuelType: form.fuelType,
				nickname: form.nickname || null,
				notes: form.notes || null,
			});
		}
	};

	return (
		<form onSubmit={handleSubmit} className="sd-form" noValidate>
			{hasHistory && (
				<div className="sd-banner sd-banner--warning">
					<span className="sd-banner__icon">🔒</span>
					<div>
						<strong>Core details are locked</strong>
						<p>
							This vehicle has booking history. Make, Model, Year, Plate, VIN and Fuel Type cannot be changed — only nickname
							and notes.
						</p>
					</div>
				</div>
			)}

			<div className="sd-section-label">Vehicle Details</div>

			<div className="sd-row">
				<div className="sd-field">
					<label className="sd-label">Make {!hasHistory && <span className="sd-req">*</span>}</label>
					<input
						className={`sd-input ${errors.make ? 'sd-input--error' : ''} ${hasHistory ? 'sd-input--locked' : ''}`}
						value={form.make}
						placeholder="e.g. Toyota"
						disabled={hasHistory}
						onChange={(e) => set('make', e.target.value)}
					/>
					{errors.make && <span className="sd-error">{errors.make}</span>}
				</div>
				<div className="sd-field">
					<label className="sd-label">Model {!hasHistory && <span className="sd-req">*</span>}</label>
					<input
						className={`sd-input ${errors.model ? 'sd-input--error' : ''} ${hasHistory ? 'sd-input--locked' : ''}`}
						value={form.model}
						placeholder="e.g. Corolla"
						disabled={hasHistory}
						onChange={(e) => set('model', e.target.value)}
					/>
					{errors.model && <span className="sd-error">{errors.model}</span>}
				</div>
			</div>

			<div className="sd-row">
				<div className="sd-field">
					<label className="sd-label">Year {!hasHistory && <span className="sd-req">*</span>}</label>
					<input
						className={`sd-input ${errors.year ? 'sd-input--error' : ''} ${hasHistory ? 'sd-input--locked' : ''}`}
						type="number"
						value={form.year}
						placeholder="e.g. 2022"
						disabled={hasHistory}
						onChange={(e) => set('year', e.target.value)}
					/>
					{errors.year && <span className="sd-error">{errors.year}</span>}
				</div>
				<div className="sd-field">
					<label className="sd-label">Fuel Type {!hasHistory && <span className="sd-req">*</span>}</label>
					<select
						className={`sd-input ${hasHistory ? 'sd-input--locked' : ''}`}
						value={form.fuelType}
						disabled={hasHistory}
						onChange={(e) => set('fuelType', e.target.value)}
					>
						{FUEL_TYPES.map((f) => (
							<option key={f}>{f}</option>
						))}
					</select>
				</div>
			</div>

			<div className="sd-field">
				<label className="sd-label">License Plate {!hasHistory && <span className="sd-req">*</span>}</label>
				<input
					className={`sd-input ${errors.licensePlate ? 'sd-input--error' : ''} ${hasHistory ? 'sd-input--locked' : ''}`}
					value={form.licensePlate?.toUpperCase?.() ?? form.licensePlate}
					placeholder="e.g. KA01AB1234"
					disabled={hasHistory}
					onChange={(e) => set('licensePlate', e.target.value)}
				/>
				{errors.licensePlate && <span className="sd-error">{errors.licensePlate}</span>}
			</div>

			<div className="sd-field">
				<label className="sd-label">
					VIN <span className="sd-optional">(optional)</span>
				</label>
				<input
					className={`sd-input ${hasHistory ? 'sd-input--locked' : ''}`}
					value={form.vin}
					placeholder="17-character Vehicle Identification Number"
					disabled={hasHistory}
					onChange={(e) => set('vin', e.target.value)}
				/>
			</div>

			<div className="sd-divider">
				<span>Personal Details</span>
			</div>

			<div className="sd-field">
				<label className="sd-label">
					Nickname <span className="sd-optional">(optional)</span>
				</label>
				<input
					className={`sd-input ${errors.nickname ? 'sd-input--error' : ''}`}
					value={form.nickname}
					placeholder='e.g. "My Daily Driver"'
					maxLength={50}
					onChange={(e) => set('nickname', e.target.value)}
				/>
				<div className="sd-hint">{form.nickname.length}/50</div>
				{errors.nickname && <span className="sd-error">{errors.nickname}</span>}
			</div>

			<div className="sd-field">
				<label className="sd-label">
					Notes <span className="sd-optional">(optional)</span>
				</label>
				<textarea
					className={`sd-input sd-textarea ${errors.notes ? 'sd-input--error' : ''}`}
					value={form.notes}
					placeholder="e.g. Needs oil change every 5,000 km"
					maxLength={250}
					rows={3}
					onChange={(e) => set('notes', e.target.value)}
				/>
				<div className="sd-hint">{form.notes.length}/250</div>
				{errors.notes && <span className="sd-error">{errors.notes}</span>}
			</div>

			<div className="sd-footer">
				<button type="button" className="sd-btn sd-btn--ghost" onClick={onCancel} disabled={submitting}>
					Cancel
				</button>
				<button type="submit" className="sd-btn sd-btn--primary" disabled={submitting}>
					{submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Vehicle'}
				</button>
			</div>
		</form>
	);
}
