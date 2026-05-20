import { memo } from 'react';
import './loading-page.scss';

const LoadingPage = () => {
	return (
		<div className="loading-page">
			<img src="/autofixlogo.png" alt="Logo" className="loading-logo" />
		</div>
	);
};

export default memo(LoadingPage);
