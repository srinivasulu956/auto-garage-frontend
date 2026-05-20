import { SERVICE_TYPE_SKELETON_KEYS } from '../../../../shared/data-modals/service-type-data';

export default function ServiceSkeletonGrid() {
	return (
		<div className="st-grid">
			{SERVICE_TYPE_SKELETON_KEYS.map((i) => (
				<div key={i} className="st-skeleton" />
			))}
		</div>
	);
}
