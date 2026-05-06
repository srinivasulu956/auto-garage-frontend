import 'bootstrap/dist/css/bootstrap.min.css';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { Provider } from 'react-redux';
import store from './app-core/reducers/store.js';
import App from './App.jsx';
import './index.scss';

const savedTheme = localStorage.getItem('autofix-theme');
const preferredTheme = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark-theme' : 'light-theme';
document.documentElement.setAttribute('data-theme', savedTheme || preferredTheme);

createRoot(document.getElementById('root')).render(
	<Provider store={store}>
		<App />
	</Provider>
);
