import { authApi } from './api-client';

// These all live on the Auth service, not the garage API, so they use authApi.
// Paths are relative to the auth base, which already ends in /Auth.

// 🔹 Update Profile
export const updateUserProfile = async (data) => {
	try {
		const response = await authApi.put('/update-profile', data);
		return response;
	} catch (error) {
		throw error.message || 'Failed to update profile';
	}
};

// 🔹 Get Current User (optional - useful)
export const getCurrentUser = async () => {
	try {
		const response = await authApi.get('/currentUserData');
		return response;
	} catch (error) {
		throw error.message || 'Failed to fetch user data';
	}
};

// 🔹 Change Password
// NOTE: the Auth service has no change-password endpoint — it never did, in either the
// old monolith or the split. This call 404s wherever it is pointed. Left in place rather
// than deleted because the UI still references it; the endpoint is the missing half.
export const changePassword = async (data) => {
	try {
		const response = await authApi.post('/change-password', data);
		return response;
	} catch (error) {
		throw error.message || 'Failed to change password';
	}
};
