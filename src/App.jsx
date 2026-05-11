import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import './App.scss';
import store from './app-core/reducers/store';
import { router } from './app/routes/app-router';
import AuthInitializer from './features/auth/providers/AuthInitializer';

export { router };

function App() {
	return (
		<Provider store={store}>
			<AuthInitializer>
				<RouterProvider router={router} />
			</AuthInitializer>
		</Provider>
	);
}

export default App;
