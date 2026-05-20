import { memo, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setThemeData } from '../../../app-core/reducers/common-slice';

const getDomTheme = (theme) => (theme === 'dark' ? 'dark-theme' : 'light-theme');

const ThemeToggler = () => {
	const dispatch = useDispatch();

	const theme = useSelector((state) => state.commonState.theme);
	const currentTheme = theme || 'light';
	const isDark = currentTheme === 'dark';

	useEffect(() => {
		document.documentElement.setAttribute('data-theme', getDomTheme(currentTheme));
	}, [currentTheme]);

	const toggleTheme = useCallback(() => {
		const newTheme = isDark ? 'light' : 'dark';
		dispatch(setThemeData(newTheme));
	}, [dispatch, isDark]);

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

export default memo(ThemeToggler);
