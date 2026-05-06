import api from './api-client';

// 🔹 Update Profile
export const updateUserProfile = async (data) => {
	try {
		const response = await api.put('/Auth/update-profile', data);
		return response;
	} catch (error) {
		throw error.message || 'Failed to update profile';
	}
};

// 🔹 Get Current User (optional - useful)
export const getCurrentUser = async () => {
	try {
		const response = await api.get('/Auth/currentUserData');
		return response;
	} catch (error) {
		throw error.message || 'Failed to fetch user data';
	}
};

// 🔹 Change Password
export const changePassword = async (data) => {
	try {
		const response = await api.post('/Auth/change-password', data);
		return response;
	} catch (error) {
		throw error.message || 'Failed to change password';
	}
};
