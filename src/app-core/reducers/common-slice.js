import { createSlice } from '@reduxjs/toolkit';

const commonSlice = createSlice({
	name: 'commonState',
	initialState: {
		loggedUserData: null,
		authInitialized: false,
		theme: 'light',
	},
	reducers: {
		setLoggedUserData: (state, action) => {
			state.loggedUserData = action.payload;
		},
		setAuthInitialized: (state) => {
			state.authInitialized = true;
		},
		setThemeData: (state, action) => {
			state.theme = action.payload;
		},
		clearLoggedUserData: (state) => {
			state.loggedUserData = null;
			state.authInitialized = true;
			state.theme = 'light';
		},
	},
});

export const { setLoggedUserData, setAuthInitialized, clearLoggedUserData, setThemeData } = commonSlice.actions;
const commonReducer = commonSlice.reducer;
export default commonReducer;
