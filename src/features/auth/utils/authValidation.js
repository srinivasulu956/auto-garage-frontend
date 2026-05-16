const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

export const getLoginError = ({ email, password }) => {
	if (!email.trim()) return 'Please enter your email address.';
	if (!validateEmail(email.trim())) return 'Please enter a valid email address.';
	if (!password) return 'Please enter your password.';
	return '';
};

export const getRegisterError = ({ firstName, lastName, email, password }) => {
	if (!firstName.trim()) return 'Please enter your first name.';
	if (!lastName.trim()) return 'Please enter your last name.';
	if (!email.trim()) return 'Please enter your email address.';
	if (!validateEmail(email.trim())) return 'Please enter a valid email address.';
	if (!password) return 'Please enter your password.';
	if (password.length < 8) return 'Password must be at least 8 characters.';
	return '';
};
