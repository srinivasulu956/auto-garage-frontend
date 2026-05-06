import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SideNavbar from '../side-nav-bar/side-nav-bar';
import './main-layout.scss';
import HeaderBar from '../headers/header-bar';
import { ToastContainer } from 'react-toastify';
import BreadcrumbHeader from '../breadcrumb-header/breadcrumb-header';

function MainLayout() {
	const [expanded, setExpanded] = useState(true);

	return (
		<div className={`main-layout-wrapper ${expanded ? 'layout-expanded' : ''}`}>
			<div className="main-layout-header-wrapper">
				<HeaderBar />
			</div>
			<div className="layout-body">
				<div className="side-navbar-wrapper">
					<SideNavbar expanded={expanded} parentCallbackForExpandState={() => setExpanded((prev) => !prev)} />
				</div>
				<div className="main-content-wrapper">
					<BreadcrumbHeader />
					<div className="content-wrapper">
						<Outlet />
					</div>
				</div>
			</div>
			<ToastContainer />
		</div>
	);
}

export default MainLayout;
