// SkeletonCard.jsx
function SkeletonCard() {
	return (
		<div className="inv-card inv-card--skeleton">
			<div className="sk" style={{ width: '55%', height: 15, marginBottom: 8 }} />
			<div className="sk" style={{ width: '35%', height: 11, marginBottom: 20 }} />
			<div className="sk" style={{ width: '100%', height: 1 }} />
			<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
				<div className="sk" style={{ width: '30%', height: 20 }} />
				<div className="sk" style={{ width: '22%', height: 20 }} />
			</div>
		</div>
	);
}

export default SkeletonCard;
