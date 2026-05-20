import { memo } from 'react';

function SkeletonCard() {
	return (
		<div className="vc vc--skeleton" aria-hidden="true">
			<div className="vc__top">
				<div className="sk sk-icon" />
			</div>
			<div className="vc__body">
				<div className="sk sk-title" />
				<div className="sk sk-sub" />
				<div className="sk sk-line" />
				<div className="sk sk-line sk-line--short" />
			</div>
			<div className="vc__footer">
				<div className="sk sk-pill" />
			</div>
		</div>
	);
}

export default memo(SkeletonCard);
