import { useEffect } from 'react';
import './SideDrawer.scss';

/**
 * SideDrawer — reusable right-side panel with backdrop.
 *
 * Props:
 *  - isOpen      {boolean}   controls visibility
 *  - onClose     {function}  called when backdrop or ✕ is clicked
 *  - title       {string}    header title text
 *  - children    {ReactNode} form / content inside the body
 *  - disabled    {boolean}   when true, backdrop click is ignored (e.g. while submitting)
 */
export default function SideDrawer({ isOpen, onClose, title, children, disabled = false }) {
	// Lock body scroll while drawer is open
	useEffect(() => {
		document.body.style.overflow = isOpen ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	}, [isOpen]);

	// Close on Escape key
	useEffect(() => {
		if (!isOpen) return;
		const handleKey = (e) => {
			if (e.key === 'Escape' && !disabled) onClose();
		};
		window.addEventListener('keydown', handleKey);
		return () => window.removeEventListener('keydown', handleKey);
	}, [isOpen, disabled, onClose]);

	return (
		<>
			{/* Backdrop */}
			<div className={`sd-overlay ${isOpen ? 'sd-overlay--visible' : ''}`} onClick={() => !disabled && onClose()} />

			{/* Drawer panel */}
			<div
				className={`sd-drawer ${isOpen ? 'sd-drawer--open' : ''}`}
				onClick={(e) => e.stopPropagation()}
				aria-modal="true"
				role="dialog"
				aria-label={title}
			>
				<div className="sd-header">
					<h2 className="sd-header__title">{title}</h2>
					<button className="sd-header__close" onClick={onClose} disabled={disabled} aria-label="Close">
						✕
					</button>
				</div>

				<div className="sd-body">{children}</div>
			</div>
		</>
	);
}
