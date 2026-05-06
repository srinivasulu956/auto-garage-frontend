import { combineReducers, configureStore } from '@reduxjs/toolkit';
import commonReducer from './common-slice';

const appReducer = combineReducers({
	commonState: commonReducer,
	// add other reducers here as your app grows
});

// Root reducer intercepts the RESET_STORE action and wipes everything
const rootReducer = (state, action) => {
	if (action.type === 'RESET_STORE') {
		state = undefined; // returning undefined makes every slice reset to its initialState
	}
	return appReducer(state, action);
};

const store = configureStore({
	reducer: rootReducer,
});

export default store;
