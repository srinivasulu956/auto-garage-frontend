import { Provider } from 'react-redux';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import './App.scss';
import store from './app-core/reducers/store';
import AuthInitializer from './app/auth-provider/auth-initializer';
import MainLayout from './app/layout/main-layout';
import Login from './app/login/login-page';
import PageNotFound from './app/page-not-found/page-not-found';
import ProtectedRoute from './app/routes/protected-route';
import Unauthorized from './app/unauthorized/unauthorized';
import VehiclesPage from './app/customer/vehicles/vehicles-page';
import CustomerDashboard from './app/customer/dashboard/customer-dashboard';
import BookingsPage from './app/customer/bookings/bookings-page';
import NewBookingPage from './app/customer/bookings/new-booking/new-booking-page';
import InvoicesPage from './app/customer/invoices/invoices-page';
import UserDetailsPage from './app/customer/user-details/user-details-page';
import BookingDetailsPage from './app/customer/bookings/booking-detail/booking-detail-page';
import AdminBookingsPage from './app/admin/admin-bookings/admin-bookings-page';
import AdminBookingDetailPage from './app/admin/admin-booking-detail-page/admin-booking-detail-page';
import AdminDetailsPage from './app/admin/admin-details/admin-details-page';
import ServiceTypesPage from './app/admin/services-management/service-types-page';
import AdminDashboard from './app/admin/dashboard/admin-dashboard';
import AdminStaffPage from './app/admin/staff-management/admin-staff-page';
import AdminCustomersPage from './app/admin/customer-details/admin-customers-page';
import AdminCustomerDetailPage from './app/admin/customer-details/admin-customer-detail-page';
import MechanicDashboard from './app/mechanic/dashboard/mechanic-dashboard';
import MechanicDetailsPage from './app/mechanic/mechanic-details/mechanic-details';
import MechanicJobs from './app/mechanic/mechanic-jobs/mechanic-jobs-page';
import MechanicJobDetails from './app/mechanic/mechanic-job-details/mechanic-job-details-page';

export const router = createBrowserRouter([
	{ path: '/', element: <Login /> },
	{ path: '/login', element: <Login /> },
	{
		path: '/admin',
		element: (
			<ProtectedRoute allowedRoles={['admin']}>
				<MainLayout />
			</ProtectedRoute>
		),
		children: [
			{ index: true, element: <Navigate to="dashboard" replace /> },
			{ path: 'dashboard', element: <AdminDashboard /> },
			{ path: 'bookings', element: <AdminBookingsPage /> },
			{ path: 'bookings/:id', element: <AdminBookingDetailPage /> },
			{ path: 'services', element: <ServiceTypesPage /> },
			{ path: 'staff', element: <AdminStaffPage /> },
			{ path: 'details', element: <AdminDetailsPage /> },
			{ path: 'customers', element: <AdminCustomersPage /> },
			{ path: 'customer/:id', element: <AdminCustomerDetailPage /> },
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
			{ path: 'dashboard', element: <CustomerDashboard /> },
			{ path: 'vehicles', element: <VehiclesPage /> },
			{ path: 'bookings', element: <BookingsPage /> },
			{ path: 'bookings/new', element: <NewBookingPage /> },
			{ path: 'bookings/:id', element: <BookingDetailsPage /> },
			{ path: 'invoices', element: <InvoicesPage /> },
			{ path: 'details', element: <UserDetailsPage /> },
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
			{ path: 'dashboard', element: <MechanicDashboard /> },
			{ path: 'jobs', element: <MechanicJobs /> },
			{ path: 'jobs/:id', element: <MechanicJobDetails /> },
			{ path: 'details', element: <MechanicDetailsPage /> },
		],
	},
	{ path: '/unauthorized', element: <Unauthorized /> },
	{ path: '*', element: <PageNotFound /> },
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
