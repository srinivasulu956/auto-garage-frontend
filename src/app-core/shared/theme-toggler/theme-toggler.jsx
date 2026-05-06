import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setThemeData } from '../../../app-core/reducers/common-slice';

const ThemeToggler = () => {
	const dispatch = useDispatch();

	const theme = useSelector((state) => state.commonState.theme);
	const currentTheme = theme || 'light';
	const isDark = currentTheme === 'dark';

	const getDomTheme = (theme) => {
		return theme === 'dark' ? 'dark-theme' : 'light-theme';
	};

	useEffect(() => {
		document.documentElement.setAttribute('data-theme', getDomTheme(currentTheme));
	}, [currentTheme]);

	const toggleTheme = () => {
		const newTheme = isDark ? 'light' : 'dark';
		dispatch(setThemeData(newTheme));
	};

	return (
		<button
			className="theme-toggle-button"
			type="button"
			onClick={toggleTheme}
			aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
		>
			<span>{isDark ? 'L' : 'D'}</span>
			{isDark ? 'Light' : 'Dark'}
		</button>
	);
};

export default ThemeToggler;
