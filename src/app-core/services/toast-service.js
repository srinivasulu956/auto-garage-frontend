import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import store from '../reducers/store';

const getTheme = () => {
	const state = store.getState();
	const theme = state?.commonState?.theme;
	return theme;
};

const getToastSettings = () => ({
	position: 'bottom-right',
	autoClose: 3000,
	hideProgressBar: false,
	newestOnTop: true,
	closeOnClick: true,
	pauseOnHover: true,
	draggable: false,
	theme: getTheme(),
});

export const toastSuccess = (message) => {
	toast.success(message, getToastSettings());
};

export const toastError = (message) => {
	toast.error(message, getToastSettings());
};

export const toastWarning = (message) => {
	toast.warning(message, getToastSettings());
};

export const toastInfo = (message) => {
	toast.info(message, getToastSettings());
};
