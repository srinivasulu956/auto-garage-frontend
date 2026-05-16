import './LoadingPage.scss';
import logo from '../../../../public/autofixlogo.png';

const LoadingPage = () => {
	return (
		<div className="loading-page">
			<img src={logo} alt="Logo" className="loading-logo" />
		</div>
	);
};

export default LoadingPage;
