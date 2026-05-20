import { memo } from 'react';
import { FUEL_META } from '../../../../shared/data-modals/vehicle-data';
import { formatDateIN } from '../../../../shared/utils/date-formatters';

function VehicleCard({ vehicle, onEdit, onDelete, onReactivate, inactive = false }) {
	const fuel = FUEL_META[vehicle.fuelType] ?? FUEL_META.Petrol;

	return (
		<div className={`vc ${inactive ? 'vc--inactive' : ''}`}>
			<div className="vc__top">
				<div className="vc__icon-wrap">
					<span className="vc__icon">{inactive ? '🚘' : '🚗'}</span>
					{vehicle.hasBookingHistory && !inactive && (
						<span className="vc__lock-pip" title="Core details locked — has booking history" />
					)}
				</div>
				<div className="vc__actions">
					{inactive ? (
						<button className="vc__btn vc__btn--reactivate" onClick={() => onReactivate(vehicle)}>
							♻️ Reactivate
						</button>
					) : (
						<>
							<button className="vc__btn vc__btn--edit" onClick={() => onEdit(vehicle)} title="Edit">
								✏️
							</button>
							<button className="vc__btn vc__btn--delete" onClick={() => onDelete(vehicle)} title="Remove">
								🗑️
							</button>
						</>
					)}
				</div>
			</div>

			<div className="vc__body">
				<h3 className="vc__name">
					{vehicle.make} {vehicle.model}
				</h3>
				{vehicle.nickname && <p className="vc__nickname">{vehicle.nickname}</p>}
				<p className="vc__year">{vehicle.year}</p>

				<div className="vc__meta">
					<div className="vc__meta-row">
						<span className="vc__meta-label">Plate</span>
						<span className="vc__plate">{vehicle.licensePlate}</span>
					</div>
					{vehicle.vin && (
						<div className="vc__meta-row">
							<span className="vc__meta-label">VIN</span>
							<span className="vc__vin">{vehicle.vin}</span>
						</div>
					)}
					<div className="vc__meta-row">
						<span className="vc__meta-label">Added</span>
						<span className="vc__meta-value">{formatDateIN(vehicle.createdAt)}</span>
					</div>
				</div>

				{vehicle.notes && (
					<p className="vc__notes" title={vehicle.notes}>
						{vehicle.notes}
					</p>
				)}
			</div>

			<div className="vc__footer">
				<span className="vc__fuel" style={{ '--fuel-clr': fuel.color }}>
					<span className="vc__fuel-dot" />
					{vehicle.fuelType}
				</span>
				<div className="vc__badges">
					{inactive && <span className="vc__badge vc__badge--inactive">Inactive</span>}
					{vehicle.hasBookingHistory && !inactive && <span className="vc__badge vc__badge--history">Has bookings</span>}
				</div>
			</div>
		</div>
	);
}

export default memo(VehicleCard);
