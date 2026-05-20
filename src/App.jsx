import { lazy, Suspense } from 'react';
import { Provider } from 'react-redux';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import './App.scss';
import store from './app-core/reducers/store';
import AuthInitializer from './app/auth-provider/auth-initializer';
import MainLayout from './app/layout/main-layout';
import ProtectedRoute from './app/routes/protected-route';
import LoadingPage from './shared/components/loading-page/loading-page';

const Login = lazy(() => import('./app/login/login-page'));
const PageNotFound = lazy(() => import('./app/page-not-found/page-not-found'));
const Unauthorized = lazy(() => import('./app/unauthorized/unauthorized'));
const VehiclesPage = lazy(() => import('./app/customer/vehicles/vehicles-page'));
const CustomerDashboard = lazy(() => import('./app/customer/dashboard/customer-dashboard'));
const BookingsPage = lazy(() => import('./app/customer/bookings/bookings-page'));
const NewBookingPage = lazy(() => import('./app/customer/bookings/new-booking/new-booking-page'));
const InvoicesPage = lazy(() => import('./app/customer/invoices/invoices-page'));
const UserDetailsPage = lazy(() => import('./app/customer/user-details/user-details-page'));
const BookingDetailsPage = lazy(() => import('./app/customer/bookings/booking-detail/booking-detail-page'));
const AdminBookingsPage = lazy(() => import('./app/admin/admin-bookings/admin-bookings-page'));
const AdminBookingDetailPage = lazy(() => import('./app/admin/admin-booking-detail-page/admin-booking-detail-page'));
const AdminDetailsPage = lazy(() => import('./app/admin/admin-details/admin-details-page'));
const ServiceTypesPage = lazy(() => import('./app/admin/services-management/service-types-page'));
const AdminDashboard = lazy(() => import('./app/admin/dashboard/admin-dashboard'));
const AdminStaffPage = lazy(() => import('./app/admin/staff-management/admin-staff-page'));
const AdminCustomersPage = lazy(() => import('./app/admin/customer-details/admin-customers-page'));
const AdminCustomerDetailPage = lazy(() => import('./app/admin/customer-details/admin-customer-detail-page'));
const MechanicDashboard = lazy(() => import('./app/mechanic/dashboard/mechanic-dashboard'));
const MechanicDetailsPage = lazy(() => import('./app/mechanic/mechanic-details/mechanic-details'));
const MechanicJobs = lazy(() => import('./app/mechanic/mechanic-jobs/mechanic-jobs-page'));
const MechanicJobDetails = lazy(() => import('./app/mechanic/mechanic-job-details/mechanic-job-details-page'));

const withPageLoader = (element) => <Suspense fallback={<LoadingPage />}>{element}</Suspense>;

export const router = createBrowserRouter([
	{ path: '/', element: withPageLoader(<Login />) },
	{ path: '/login', element: withPageLoader(<Login />) },
	{
		path: '/admin',
		element: (
			<ProtectedRoute allowedRoles={['admin']}>
				<MainLayout />
			</ProtectedRoute>
		),
		children: [
			{ index: true, element: <Navigate to="dashboard" replace /> },
			{ path: 'dashboard', element: withPageLoader(<AdminDashboard />) },
			{ path: 'bookings', element: withPageLoader(<AdminBookingsPage />) },
			{ path: 'bookings/:id', element: withPageLoader(<AdminBookingDetailPage />) },
			{ path: 'services', element: withPageLoader(<ServiceTypesPage />) },
			{ path: 'staff', element: withPageLoader(<AdminStaffPage />) },
			{ path: 'details', element: withPageLoader(<AdminDetailsPage />) },
			{ path: 'customers', element: withPageLoader(<AdminCustomersPage />) },
			{ path: 'customer/:id', element: withPageLoader(<AdminCustomerDetailPage />) },
		],
	},
	{
		path: '/customer',
		element: (
			<ProtectedRoute allowedRoles={['customer']}>
				<MainLayout />
			</ProtectedRoute>
		),
		children: [
			{ index: true, element: <Navigate to="dashboard" replace /> },
			{ path: 'dashboard', element: withPageLoader(<CustomerDashboard />) },
			{ path: 'vehicles', element: withPageLoader(<VehiclesPage />) },
			{ path: 'bookings', element: withPageLoader(<BookingsPage />) },
			{ path: 'bookings/new', element: withPageLoader(<NewBookingPage />) },
			{ path: 'bookings/:id', element: withPageLoader(<BookingDetailsPage />) },
			{ path: 'invoices', element: withPageLoader(<InvoicesPage />) },
			{ path: 'details', element: withPageLoader(<UserDetailsPage />) },
		],
	},
	{
		path: '/mechanic',
		element: (
			<ProtectedRoute allowedRoles={['mechanic']}>
				<MainLayout />
			</ProtectedRoute>
		),
		children: [
			{ index: true, element: <Navigate to="dashboard" replace /> },
			{ path: 'dashboard', element: withPageLoader(<MechanicDashboard />) },
			{ path: 'jobs', element: withPageLoader(<MechanicJobs />) },
			{ path: 'jobs/:id', element: withPageLoader(<MechanicJobDetails />) },
			{ path: 'details', element: withPageLoader(<MechanicDetailsPage />) },
		],
	},
	{ path: '/unauthorized', element: withPageLoader(<Unauthorized />) },
	{ path: '*', element: withPageLoader(<PageNotFound />) },
]);

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
