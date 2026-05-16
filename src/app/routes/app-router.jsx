import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminBookingDetailPage from '../admin/admin-booking-detail-page/admin-booking-detail-page';
import AdminBookingsPage from '../admin/admin-bookings/admin-bookings-page';
import AdminCustomersPage from '../admin/customer-details/admin-customers-page';
import AdminCustomerDetailPage from '../admin/customer-details/admin-customer-detail-page';
import AdminDashboard from '../admin/dashboard/admin-dashboard';
import AdminDetailsPage from '../admin/admin-details/admin-details-page';
import AdminStaffPage from '../admin/staff-management/admin-staff-page';
import BookingsPage from '../customer/bookings/bookings-page';
import BookingDetailsPage from '../customer/bookings/booking-detail/booking-detail-page';
import CustomerDashboard from '../customer/dashboard/customer-dashboard';
import InvoicesPage from '../customer/invoices/invoices-page';
import MainLayout from '../layout/main-layout';
import MechanicDashboard from '../mechanic/dashboard/mechanic-dashboard';
import MechanicDetailsPage from '../mechanic/mechanic-details/mechanic-details';
import MechanicJobDetails from '../mechanic/mechanic-job-details/mechanic-job-details-page';
import MechanicJobs from '../mechanic/mechanic-jobs/mechanic-jobs-page';
import NewBookingPage from '../customer/bookings/new-booking/new-booking-page';
import ServiceTypesPage from '../admin/services-management/service-types-page';
import UserDetailsPage from '../customer/user-details/user-details-page';
import VehiclesPage from '../customer/vehicles/vehicles-page';
import LoginPage from '../../features/auth/pages/LoginPage';
import PageNotFoundPage from '../../features/auth/pages/PageNotFound';
import ProtectedRoute from '../../features/auth/routes/ProtectedRoute';
import UnauthorizedPage from '../../features/auth/pages/UnauthorizedPage';

export const router = createBrowserRouter([
	{ path: '/', element: <LoginPage /> },
	{ path: '/login', element: <LoginPage /> },
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
	{ path: '/unauthorized', element: <UnauthorizedPage /> },
	{ path: '*', element: <PageNotFoundPage /> },
]);
