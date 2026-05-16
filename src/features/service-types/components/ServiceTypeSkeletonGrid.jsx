export default function ServiceTypeSkeletonGrid() {
	return (
		<div className="st-grid">
			{[1, 2, 3].map((i) => (
				<div key={i} className="st-skeleton" />
			))}
		</div>
	);
}
