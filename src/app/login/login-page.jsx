import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../app-core/actions/auth-actions';
import { setAuthInitialized, setLoggedUserData, setThemeData } from '../../app-core/reducers/common-slice';
import ThemeToggler from '../../app-core/shared/theme-toggler/theme-toggler';
import './login-page.scss';

const BASE_URL = import.meta.env.VITE_AUTH_BASE_URL;
const TOKEN_KEY = 'ag_access_token'; // must match api-client.js and auth-actions.js

const LOGIN_ROLES = ['Customer', 'Mechanic', 'Admin'];

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

const parseErrorResponse = async (response) => {
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

const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);
const getAccessToken = (data) => data?.accessToken ?? data?.AccessToken;
const getUserRoles = (user) => user?.roles ?? user?.Roles ?? [];

const getLoginError = ({ email, password }) => {
	if (!email.trim()) return 'Please enter your email address.';
	if (!validateEmail(email.trim())) return 'Please enter a valid email address.';
	if (!password) return 'Please enter your password.';
	return '';
};

const getRegisterError = ({ firstName, lastName, email, password }) => {
	if (!firstName.trim()) return 'Please enter your first name.';
	if (!lastName.trim()) return 'Please enter your last name.';
	if (!email.trim()) return 'Please enter your email address.';
	if (!validateEmail(email.trim())) return 'Please enter a valid email address.';
	if (!password) return 'Please enter your password.';
	if (password.length < 8) return 'Password must be at least 8 characters.';
	return '';
};

const Login = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const [isRegister, setIsRegister] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [successMsg, setSuccessMsg] = useState('');
	const [showPassword, setShowPassword] = useState(false);

	const [loginForm, setLoginForm] = useState({ email: '', password: '', role: 'Customer' });
	const [registerForm, setRegisterForm] = useState({ firstName: '', lastName: '', email: '', password: '' });

	useEffect(() => {
		setError('');
		setSuccessMsg('');
		setShowPassword(false);
		setLoginForm({ email: '', password: '', role: 'Customer' });
		setRegisterForm({ firstName: '', lastName: '', email: '', password: '' });
	}, [isRegister]);

	const handleLoginChange = (e) => {
		const { name, value } = e.target;
		setLoginForm((prev) => ({ ...prev, [name]: value }));
		setError('');
	};

	const handleRegisterChange = (e) => {
		const { name, value } = e.target;
		setRegisterForm((prev) => ({ ...prev, [name]: value }));
		setError('');
	};

	// ── Login ──────────────────────────────────────────────────────────────────

	const handleLogin = async (e) => {
		e.preventDefault();
		const validationError = getLoginError(loginForm);
		if (validationError) {
			setError(validationError);
			return;
		}

		setLoading(true);
		try {
			const response = await fetch(`${BASE_URL}/login`, {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: loginForm.email.trim(),
					password: loginForm.password,
					role: loginForm.role,
				}),
			});

			if (!response.ok) {
				setError(await parseErrorResponse(response));
				return;
			}

			const data = await response.json();
			const accessToken = getAccessToken(data);
			const user = data.user ?? data.User;
			const roles = getUserRoles(user);
			const role = (roles.find((r) => r === loginForm.role) ?? roles[0] ?? loginForm.role).toLowerCase();

			if (!accessToken || !user) {
				setError('Login succeeded but the server response was incomplete. Please contact support.');
				return;
			}

			// ── Store in localStorage (persists across tabs + browser restarts) ──
			localStorage.setItem(TOKEN_KEY, accessToken);
			dispatch(setLoggedUserData({ role, user }));
			dispatch(setThemeData(user.theme));
			dispatch(setAuthInitialized());
			navigate(`/${role}/dashboard`, { replace: true });
		} catch {
			dispatch(logoutUser());
			setError('Unable to reach the server. Please check your connection.');
		} finally {
			setLoading(false);
		}
	};

	// ── Register ───────────────────────────────────────────────────────────────

	const handleRegister = async (e) => {
		e.preventDefault();
		const validationError = getRegisterError(registerForm);
		if (validationError) {
			setError(validationError);
			return;
		}

		setLoading(true);
		try {
			const response = await fetch(`${BASE_URL}/register`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					firstName: registerForm.firstName.trim(),
					lastName: registerForm.lastName.trim(),
					email: registerForm.email.trim(),
					password: registerForm.password,
					roles: ['Customer'],
				}),
			});

			if (!response.ok) {
				setError(await parseErrorResponse(response));
				return;
			}

			setSuccessMsg('Your account was created. You can sign in now.');
			setIsRegister(false);
		} catch {
			setError('Unable to reach the server. Please check your connection.');
		} finally {
			setLoading(false);
		}
	};

	// ── Render ─────────────────────────────────────────────────────────────────

	return (
		<div className="login-container">
			<section className="auth-welcome" aria-label="AutoFix welcome">
				<img src="/autofixlogo.png" alt="AutoFix" className="auth-logo" />
				<div>
					<p className="auth-eyebrow">Auto Garage Portal</p>
					<h1>Auto Garage</h1>
					<p className="auth-copy">Manage vehicles, bookings, invoices, and service work from one secure workspace.</p>
				</div>
			</section>

			<div className="login-card">
				<div className="login-theme-toggle">
					<ThemeToggler />
				</div>

				<div className="auth-header">
					<p>{isRegister ? 'Create account' : 'Welcome back'}</p>
					<h2>{isRegister ? 'Customer Registration' : 'Sign in to Auto Garage'}</h2>
				</div>

				{successMsg && <div className="success">{successMsg}</div>}

				{/* ── LOGIN FORM ── */}
				{!isRegister && (
					<form onSubmit={handleLogin}>
						<div className="form-group">
							<label htmlFor="login-email">Email address</label>
							<input
								id="login-email"
								type="email"
								name="email"
								value={loginForm.email}
								onChange={handleLoginChange}
								placeholder="you@example.com"
								autoComplete="email"
								required
							/>
						</div>

						<div className="form-group">
							<label htmlFor="login-password">Password</label>
							<div className="password-field">
								<input
									id="login-password"
									type={showPassword ? 'text' : 'password'}
									name="password"
									value={loginForm.password}
									onChange={handleLoginChange}
									placeholder="Enter your password"
									autoComplete="current-password"
									required
								/>
								<button
									type="button"
									onClick={() => setShowPassword((p) => !p)}
									aria-label={showPassword ? 'Hide password' : 'Show password'}
								>
									{showPassword ? 'Hide' : 'Show'}
								</button>
							</div>
						</div>

						<div className="form-group role-group">
							<label>Sign in as</label>
							<div className="role-options">
								{LOGIN_ROLES.map((role) => (
									<button
										type="button"
										key={role}
										className={loginForm.role === role ? 'active' : ''}
										onClick={() => setLoginForm((p) => ({ ...p, role }))}
									>
										{role}
									</button>
								))}
							</div>
						</div>

						{error && (
							<div className="error" role="alert">
								{error.split('\n').map((line, i) => (
									<div key={i}>{line}</div>
								))}
							</div>
						)}

						<button type="submit" className="submit-button" disabled={loading}>
							{loading ? 'Signing in...' : 'Sign in'}
						</button>
					</form>
				)}

				{/* ── REGISTER FORM ── */}
				{isRegister && (
					<form onSubmit={handleRegister}>
						<div className="name-row">
							<div className="form-group">
								<label htmlFor="reg-first-name">First name</label>
								<input
									id="reg-first-name"
									type="text"
									name="firstName"
									value={registerForm.firstName}
									onChange={handleRegisterChange}
									placeholder="First name"
									autoComplete="given-name"
									required
								/>
							</div>
							<div className="form-group">
								<label htmlFor="reg-last-name">Last name</label>
								<input
									id="reg-last-name"
									type="text"
									name="lastName"
									value={registerForm.lastName}
									onChange={handleRegisterChange}
									placeholder="Last name"
									autoComplete="family-name"
									required
								/>
							</div>
						</div>

						<div className="form-group">
							<label htmlFor="reg-email">Email address</label>
							<input
								id="reg-email"
								type="email"
								name="email"
								value={registerForm.email}
								onChange={handleRegisterChange}
								placeholder="you@example.com"
								autoComplete="email"
								required
							/>
						</div>

						<div className="form-group">
							<label htmlFor="reg-password">Password</label>
							<div className="password-field">
								<input
									id="reg-password"
									type={showPassword ? 'text' : 'password'}
									name="password"
									value={registerForm.password}
									onChange={handleRegisterChange}
									placeholder="At least 8 characters"
									autoComplete="new-password"
									required
								/>
								<button
									type="button"
									onClick={() => setShowPassword((p) => !p)}
									aria-label={showPassword ? 'Hide password' : 'Show password'}
								>
									{showPassword ? 'Hide' : 'Show'}
								</button>
							</div>
						</div>

						<div className="register-role-note">
							<span className="register-role-badge">👤 Customer Account</span>
							<span>To create Admin or Mechanic accounts, contact your administrator.</span>
						</div>

						{error && (
							<div className="error" role="alert">
								{error.split('\n').map((line, i) => (
									<div key={i}>{line}</div>
								))}
							</div>
						)}

						<button type="submit" className="submit-button" disabled={loading}>
							{loading ? 'Creating account...' : 'Create account'}
						</button>
					</form>
				)}

				<div className="toggle">
					{isRegister ? (
						<>
							Already have an account?{' '}
							<button type="button" onClick={() => setIsRegister(false)}>
								Login
							</button>
						</>
					) : (
						<>
							New customer ?{' '}
							<button type="button" onClick={() => setIsRegister(true)}>
								Register
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default Login;
