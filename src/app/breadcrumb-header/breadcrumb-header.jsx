import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './breadcrumb-header.scss';

const ROUTE_MAP = {
	'/customer/dashboard': 'Dashboard',
	'/customer/vehicles': 'Vehicles',
	'/customer/bookings': 'Bookings',
	'/customer/bookings/new': 'New Booking',
	'/customer/bookings/:id': 'Booking Detail',
	'/customer/invoices': 'Invoices',
	'/customer/details': 'Profile',

	'/admin/dashboard': 'Dashboard',
	'/admin/bookings': 'Bookings',
	'/admin/bookings/:id': 'Booking Detail',
	'/admin/services': 'Services',
	'/admin/staff': 'Staff',
	'/admin/details': 'Admin Details',
	'/admin/customers': 'All Customers',
	'/admin/customer/:id': 'Customer Detail',

	'/mechanic/dashboard': 'Dashboard',
	'/mechanic/jobs': 'Assigned Jobs',
	'/mechanic/jobs/:id': 'Job Detail',
	'/mechanic/details': 'Details',
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const resolveLabel = (path) => {
	if (ROUTE_MAP[path]) return ROUTE_MAP[path];

	const segments = path.split('/').filter(Boolean);
	const last = segments[segments.length - 1];
	if (UUID_REGEX.test(last)) {
		const pattern = '/' + segments.slice(0, -1).join('/') + '/:id';
		if (ROUTE_MAP[pattern]) return ROUTE_MAP[pattern];
	}

	return null;
};

const getHomeLink = (pathname) => {
	if (pathname.startsWith('/admin')) return '/admin/dashboard';
	if (pathname.startsWith('/mechanic')) return '/mechanic/dashboard';
	return '/customer/dashboard';
};

export default function BreadcrumbHeader() {
	const { pathname } = useLocation();
	const homeLink = getHomeLink(pathname);

	const crumbs = useMemo(() => {
		const allSegments = pathname.split('/').filter(Boolean);
		const nextCrumbs = [];

		allSegments.forEach((_, index) => {
			if (index === 0) return;

			const fullPath = '/' + allSegments.slice(0, index + 1).join('/');
			const label = resolveLabel(fullPath);

			if (label) nextCrumbs.push({ label, path: fullPath });
		});

		return nextCrumbs;
	}, [pathname]);

	return (
		<div className="breadcrumb-bar">
			<nav className="bc-nav" aria-label="breadcrumb">
				<Link to={homeLink} className="bc-link">
					Home
				</Link>

				{crumbs.map((crumb, i) => {
					const isLast = i === crumbs.length - 1;
					return (
						<span key={crumb.path} className="bc-item">
							<span className="bc-sep" aria-hidden="true">
								&rsaquo;
							</span>
							{isLast ? (
								<span className="bc-current" aria-current="page">
									{crumb.label}
								</span>
							) : (
								<Link to={crumb.path} className="bc-link">
									{crumb.label}
								</Link>
							)}
						</span>
					);
				})}
			</nav>
			<div className="bc-right" />
		</div>
	);
}
