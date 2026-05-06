import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { NavLink, useLocation } from 'react-router-dom';
import { menuConfig } from './menu-config';
import './side-nav-bar.scss';

const normalizePath = (path) => path.replace(/\/+/g, '/');

const getDefaultMenuItem = (item) => {
	if (!item.children?.length) {
		return item;
	}

	return getDefaultMenuItem(item.children[0]);
};

const getItemPath = (role, item) => {
	const defaultItem = getDefaultMenuItem(item);

	return normalizePath(`/${role}/${defaultItem.path}`);
};

const hasActiveChild = (role, item, pathname) => {
	const itemPath = getItemPath(role, item);

	if (pathname === itemPath || pathname.startsWith(`${itemPath}/`)) {
		return true;
	}

	return item.children?.some((child) => hasActiveChild(role, child, pathname)) ?? false;
};

const SideNavbar = ({ expanded, parentCallbackForExpandState }) => {
	const location = useLocation();
	const role = useSelector((state) => state?.commonState?.loggedUserData?.role);
	const [openMenuPath, setOpenMenuPath] = useState([]);

	const menus = useMemo(() => menuConfig[role] || [], [role]);

	const openMenuAtLevel = (level, itemId) => {
		setOpenMenuPath((prev) => [...prev.slice(0, level), itemId]);
	};

	const closeMenuFromLevel = (level) => {
		setOpenMenuPath((prev) => prev.slice(0, level));
	};

	const closeAllMenus = () => {
		setOpenMenuPath([]);
	};

	const renderMenu = (items, level = 0) =>
		items.map((item) => {
			const itemPath = getItemPath(role, item);
			const hasChildren = item.children?.length > 0;
			const isActive = hasActiveChild(role, item, location.pathname);
			const isOpen = openMenuPath[level] === item.id;

			return (
				<div
					key={item.id}
					className={`menu-wrapper level-${level} ${hasChildren ? 'has-children' : ''} ${isOpen ? 'open' : ''}`}
					onMouseEnter={() => hasChildren && openMenuAtLevel(level, item.id)}
					onMouseLeave={() => hasChildren && closeMenuFromLevel(level)}
					onFocus={() => hasChildren && openMenuAtLevel(level, item.id)}
				>
					<NavLink
						to={itemPath}
						className={({ isActive: exactActive }) =>
							`menu-item level-${level} ${isActive || exactActive ? 'active' : ''} ${hasChildren ? 'parent-menu' : ''}`
						}
						title={!expanded ? item.label : undefined}
						aria-label={item.label}
						onClick={closeAllMenus}
					>
						<span className="menu-item-logo">{item.icon}</span>
						<span className="menu-item-name">{item.label}</span>
						{hasChildren && <span className="menu-item-caret">›</span>}
					</NavLink>

					{hasChildren && (
						<div className={`submenu-popup level-${level + 1}`} role="menu">
							<div className="submenu-title">{item.label}</div>
							<div className="submenu-list">{renderMenu(item.children, level + 1)}</div>
						</div>
					)}
				</div>
			);
		});

	return (
		<aside className={`sidenav ${expanded ? 'expanded' : 'collapsed'}`} aria-label="Primary navigation">
			<div className="sidenav-header">
				<div className="app-title">
					<img src="/autofixlogo.png" alt="" className="app-title-logo" />
					{expanded && (
						<div className="app-title-copy">
							<span className="app-title-name mb-1">Auto Garage</span>
							<span className="app-title-meta">{role || 'garage'} portal</span>
						</div>
					)}
				</div>
			</div>

			<nav className="sidenav-menu">{renderMenu(menus)}</nav>

			<div className="sidenav-footer">
				<div className="sidebar-footer-title">
					<span className="footer-logo-box">i</span>
					{expanded && <span className="sidebar-footer-title-text">Need help?</span>}
				</div>

				<button className="sidebar-footer-resize-icon" type="button" onClick={parentCallbackForExpandState}>
					{expanded ? '‹' : '›'}
				</button>
			</div>
		</aside>
	);
};

export default SideNavbar;
