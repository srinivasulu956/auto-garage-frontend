import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService, serviceTypeService } from '../../../../app-core/services/booking-service';
import vehicleService from '../../../../app-core/services/vehicle-service';
import { toastError, toastSuccess } from '../../../../app-core/services/toast-service';
import './new-booking-page.scss';

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = ['Vehicle', 'Service', 'Schedule', 'Confirm'];
const TODAY = new Date().toISOString().split('T')[0];

const SERVICE_ICONS = {
	'Oil Change': '🛢️',
	'Tyre Rotation': '🔄',
	'Brake Service': '🛑',
	'Battery Check & Replacement': '🔋',
	'AC Service': '❄️',
	'Full Service': '🔧',
};

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }) {
	return (
		<div className="nb-steps">
			{STEPS.map((label, i) => {
				const done = i < current;
				const active = i === current;
				return (
					<div key={label} className={`nb-step ${active ? 'nb-step--active' : done ? 'nb-step--done' : ''}`}>
						<div className="nb-step__circle">{done ? '✓' : i + 1}</div>
						<span className="nb-step__label">{label}</span>
						{i < STEPS.length - 1 && <div className="nb-step__line" />}
					</div>
				);
			})}
		</div>
	);
}

// ─── Step 1 — Vehicle ─────────────────────────────────────────────────────────

function StepVehicle({ selected, onSelect, vehicles, busyIds, loading }) {
	const navigate = useNavigate();

	if (loading)
		return (
			<div className="nb-loading">
				<div className="nb-spinner" />
			</div>
		);

	if (vehicles.length === 0)
		return (
			<div className="nb-empty">
				<span>🚗</span>
				<h3>No vehicles found</h3>
				<p>Add a vehicle first before booking a service.</p>
				<button className="sd-btn sd-btn--primary" onClick={() => navigate('/customer/vehicles')}>
					Add Vehicle
				</button>
			</div>
		);

	const allBusy = vehicles.length > 0 && vehicles.every((v) => busyIds.includes(v.id));

	return (
		<div className="nb-step-body">
			<p className="nb-step-hint">Select the vehicle for this service visit</p>

			{allBusy && (
				<div className="nb-alert nb-alert--warning">
					⚠️ All your vehicles currently have an active service in progress. You can book a new service once the ongoing one is
					completed.
				</div>
			)}

			<div className="nb-option-grid">
				{vehicles.map((v) => {
					const isBusy = busyIds.includes(v.id);
					const isSelected = selected?.id === v.id;

					return (
						<div
							key={v.id}
							className={`nb-option ${isSelected ? 'nb-option--selected' : ''} ${isBusy ? 'nb-option--disabled' : ''}`}
							onClick={() => !isBusy && onSelect(v)}
							title={isBusy ? 'This vehicle already has an active service booking' : undefined}
						>
							<div className="nb-option__icon">🚗</div>
							<div className="nb-option__body">
								<strong>
									{v.make} {v.model}
								</strong>
								<span>
									{v.year} · {v.licensePlate} · {v.fuelType}
								</span>
							</div>

							{isBusy ? (
								<span className="nb-option__status nb-option__status--busy">🔧 In Service</span>
							) : isSelected ? (
								<span className="nb-option__check">✓</span>
							) : null}
						</div>
					);
				})}
			</div>

			{vehicles.some((v) => busyIds.includes(v.id)) && !allBusy && (
				<p className="nb-hint-text">
					🔧 Vehicles marked <strong>In Service</strong> are unavailable until their current booking is completed.
				</p>
			)}
		</div>
	);
}

// ─── Step 2 — Service ─────────────────────────────────────────────────────────

function StepService({ selected, onSelect, serviceTypes, loading }) {
	if (loading)
		return (
			<div className="nb-loading">
				<div className="nb-spinner" />
			</div>
		);

	return (
		<div className="nb-step-body">
			<p className="nb-step-hint">Choose the type of service you need</p>
			<div className="nb-option-grid">
				{serviceTypes.map((s) => (
					<div
						key={s.id}
						className={`nb-option nb-option--service ${selected?.id === s.id ? 'nb-option--selected' : ''}`}
						onClick={() => onSelect(s)}
					>
						<div className="nb-option__icon nb-option__icon--service">{SERVICE_ICONS[s.name] || '🔧'}</div>
						<div className="nb-option__body">
							<strong>{s.name}</strong>
							<span>{s.description}</span>
							<div className="nb-option__tags">
								<span className="nb-tag">₹{s.basePrice}</span>
								<span className="nb-tag">~{s.estimatedHours}h</span>
							</div>
						</div>
						{selected?.id === s.id && <span className="nb-option__check">✓</span>}
					</div>
				))}
			</div>
		</div>
	);
}

// ─── Step 3 — Schedule ────────────────────────────────────────────────────────

function StepSchedule({ date, notes, onDateChange, onNotesChange }) {
	return (
		<div className="nb-step-body">
			<p className="nb-step-hint">Pick a date and leave notes for the mechanic</p>
			<div className="sd-field" style={{ marginBottom: '1.25rem' }}>
				<label className="sd-label">
					Preferred Date <span style={{ color: 'var(--danger-color)' }}>*</span>
				</label>
				<input type="date" className="sd-input" min={TODAY} value={date} onChange={(e) => onDateChange(e.target.value)} />
				<small style={{ color: 'var(--muted-text-color)', marginTop: 4, fontSize: '0.78rem' }}>
					We will confirm availability after booking.
				</small>
			</div>
			<div className="sd-field">
				<label className="sd-label">
					Notes for Mechanic <span style={{ color: 'var(--muted-text-color)', fontWeight: 400 }}>(optional)</span>
				</label>
				<textarea
					className="sd-input nb-textarea"
					rows={4}
					placeholder="e.g. Noise from front left wheel, AC not cooling properly..."
					value={notes}
					onChange={(e) => onNotesChange(e.target.value)}
					maxLength={500}
				/>
				<small style={{ color: 'var(--muted-text-color)', textAlign: 'right', fontSize: '0.78rem' }}>{notes.length}/500</small>
			</div>
		</div>
	);
}

// ─── Step 4 — Confirm ─────────────────────────────────────────────────────────

function StepConfirm({ vehicle, service, date, notes }) {
	const formatted = new Date(date).toLocaleDateString('en-IN', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});

	return (
		<div className="nb-step-body">
			<p className="nb-step-hint">Review your booking before confirming</p>
			<div className="nb-confirm-card">
				<div className="nb-confirm-row">
					<span className="nb-confirm-label">🚗 Vehicle</span>
					<span className="nb-confirm-value">
						{vehicle.make} {vehicle.model} ({vehicle.year})
					</span>
				</div>
				<div className="nb-confirm-row">
					<span className="nb-confirm-label">🏷️ Plate</span>
					<span className="nb-confirm-value">{vehicle.licensePlate}</span>
				</div>
				<hr className="nb-divider" />
				<div className="nb-confirm-row">
					<span className="nb-confirm-label">🔧 Service</span>
					<span className="nb-confirm-value">{service.name}</span>
				</div>
				<div className="nb-confirm-row">
					<span className="nb-confirm-label">💰 Est. Price</span>
					<span className="nb-confirm-value">₹{service.basePrice}</span>
				</div>
				<div className="nb-confirm-row">
					<span className="nb-confirm-label">⏱️ Est. Time</span>
					<span className="nb-confirm-value">~{service.estimatedHours} hours</span>
				</div>
				<hr className="nb-divider" />
				<div className="nb-confirm-row">
					<span className="nb-confirm-label">📅 Date</span>
					<span className="nb-confirm-value">{formatted}</span>
				</div>
				{notes && (
					<div className="nb-confirm-row nb-confirm-row--notes">
						<span className="nb-confirm-label">💬 Notes</span>
						<span className="nb-confirm-value nb-confirm-value--muted">{notes}</span>
					</div>
				)}
			</div>
			<div className="nb-notice">
				ℹ️ Final price may vary based on parts required. Invoice will be generated after service completion.
			</div>
		</div>
	);
}

// ─── Success Screen ───────────────────────────────────────────────────────────

function SuccessScreen({ vehicle, service, onViewBookings, onDashboard }) {
	return (
		<div className="nb-success">
			<div className="nb-success__icon">✅</div>
			<h2>Booking Confirmed!</h2>
			<p>
				Your <strong>{service.name}</strong> for{' '}
				<strong>
					{vehicle.make} {vehicle.model}
				</strong>{' '}
				has been booked.
				<br />
				We will confirm your appointment shortly.
			</p>
			<div className="nb-success__actions">
				<button className="sd-btn sd-btn--ghost" onClick={onDashboard}>
					Go to Dashboard
				</button>
				<button className="sd-btn sd-btn--primary" onClick={onViewBookings}>
					View My Bookings
				</button>
			</div>
		</div>
	);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const NewBookingPage = () => {
	const navigate = useNavigate();

	const [step, setStep] = useState(0);
	const [vehicle, setVehicle] = useState(null);
	const [service, setService] = useState(null);
	const [date, setDate] = useState('');
	const [notes, setNotes] = useState('');
	const [success, setSuccess] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const [vehicles, setVehicles] = useState([]);
	const [busyIds, setBusyIds] = useState([]);
	const [serviceTypes, setServiceTypes] = useState([]);
	const [loadingVehicles, setLoadingVehicles] = useState(true);
	const [loadingServices, setLoadingServices] = useState(true);

	useEffect(() => {
		// Fetch vehicles and their busy status in parallel
		Promise.allSettled([vehicleService.getAll(), vehicleService.getBusyIds()])
			.then(([vehiclesRes, busyRes]) => {
				if (vehiclesRes.status === 'fulfilled') setVehicles(vehiclesRes.value || []);
				else toastError('Failed to load vehicles');

				if (busyRes.status === 'fulfilled') setBusyIds(busyRes.value || []);
				// busyIds failure is silent — worst case all vehicles are selectable
				// (backend still blocks duplicate bookings on submit)
			})
			.finally(() => setLoadingVehicles(false));

		serviceTypeService
			.getAll()
			.then((d) => setServiceTypes(d || []))
			.catch(() => toastError('Failed to load service types'))
			.finally(() => setLoadingServices(false));
	}, []);

	const canNext = () => {
		if (step === 0) return !!vehicle && !busyIds.includes(vehicle?.id);
		if (step === 1) return !!service;
		if (step === 2) return !!date;
		return true;
	};

	const handleSubmit = async () => {
		try {
			setSubmitting(true);
			await bookingService.create({
				vehicleId: vehicle.id,
				serviceTypeId: service.id,
				scheduledDate: date,
				customerNotes: notes,
			});
			toastSuccess('Booking confirmed!');
			setSuccess(true);
		} catch (e) {
			toastError(e.message || 'Failed to create booking');
		} finally {
			setSubmitting(false);
		}
	};

	if (success) {
		return (
			<div className="dashboard-page">
				<SuccessScreen
					vehicle={vehicle}
					service={service}
					onViewBookings={() => navigate('/customer/bookings')}
					onDashboard={() => navigate('/customer/dashboard')}
				/>
			</div>
		);
	}

	return (
		<div className="dashboard-page">
			{/* Hero */}
			<section className="page-hero compact">
				<div>
					<p className="page-kicker">New Booking</p>
					<h1>Book a Service</h1>
					<p>
						Step {step + 1} of {STEPS.length} — {STEPS[step]}
					</p>
				</div>
				<button className="sd-btn sd-btn--ghost" onClick={() => navigate('/customer/bookings')}>
					← Back
				</button>
			</section>

			{/* Step Indicator */}
			<StepIndicator current={step} />

			{/* Step Content */}
			<div className="nb-card">
				{step === 0 && (
					<StepVehicle selected={vehicle} onSelect={setVehicle} vehicles={vehicles} busyIds={busyIds} loading={loadingVehicles} />
				)}
				{step === 1 && (
					<StepService selected={service} onSelect={setService} serviceTypes={serviceTypes} loading={loadingServices} />
				)}
				{step === 2 && <StepSchedule date={date} notes={notes} onDateChange={setDate} onNotesChange={setNotes} />}
				{step === 3 && <StepConfirm vehicle={vehicle} service={service} date={date} notes={notes} />}

				{/* Navigation */}
				<div className="nb-nav">
					<button className="sd-btn sd-btn--ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
						← Back
					</button>
					{step < STEPS.length - 1 ? (
						<button className="sd-btn sd-btn--primary" onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
							Next →
						</button>
					) : (
						<button className="sd-btn sd-btn--primary" onClick={handleSubmit} disabled={submitting}>
							{submitting ? 'Confirming...' : '✓ Confirm Booking'}
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default NewBookingPage;
