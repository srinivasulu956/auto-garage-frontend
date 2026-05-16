const friendlyErrorMessages = {
	'Invalid email or password': 'The email or password is incorrect. Please check both and try again.',
	'User is inactive. Please contact support.': 'This account is inactive. Please contact support to restore access.',
	'User does not have the required role': 'This account is not assigned to the selected role.',
	'No refresh token found.': 'Your session has expired. Please sign in again.',
	'Invalid refresh token.': 'Your session is no longer valid. Please sign in again.',
	'Refresh token has been revoked.': 'You have been signed out. Please sign in again.',
	'Refresh token expired. Please login again.': 'Your session has expired. Please sign in again.',
	'User with this email already exists.': 'An account with this email already exists. Please sign in instead.',
	'Email is required.': 'Please enter your email address.',
	'Password is required.': 'Please enter your password.',
	'Request body is required.': 'Please fill in the form and try again.',
	'Only customers can self-register. Contact your administrator for other roles.':
		'Only customers can register here. Contact your administrator to create staff accounts.',
};

export const parseErrorResponse = async (response) => {
	const contentType = response.headers.get('content-type') ?? '';
	let message = '';

	try {
		if (!contentType.includes('application/json')) {
			message = await response.text();
		} else {
			const data = await response.json();
			if (Array.isArray(data)) {
				message = data.join('\n');
			} else if (data?.message && data?.invalidRoles) {
				message = `${data.message}: ${data.invalidRoles.join(', ')}`;
			} else if (data?.errors) {
				message = Object.values(data.errors).flat().join('\n');
			} else {
				message = data?.error || data?.message || data?.title || '';
			}
		}
	} catch {
		message = '';
	}

	const trimmed = message?.trim() || `Something went wrong (${response.status})`;
	return friendlyErrorMessages[trimmed] || trimmed;
};

export const getAccessToken = (data) => data?.accessToken ?? data?.AccessToken;

export const getUserRoles = (user) => user?.roles ?? user?.Roles ?? [];
