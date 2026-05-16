import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../../app-core/actions/auth-actions';
import { setAuthInitialized, setLoggedUserData, setThemeData } from '../../../app-core/reducers/common-slice';
import FormAlert from '../../../shared/components/FormAlert/FormAlert';
import ThemeToggler from '../../../shared/components/ThemeToggler/ThemeToggler';
import { LOGIN_ROLES, TOKEN_KEY } from '../constants/authConstants';
import { loginRequest, registerCustomerRequest } from '../services/authService';
import { getAccessToken, getUserRoles, parseErrorResponse } from '../utils/authResponse';
import { getLoginError, getRegisterError } from '../utils/authValidation';
import '../styles/LoginPage.scss';

const LoginPage = () => {
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
			const response = await loginRequest({
				email: loginForm.email.trim(),
				password: loginForm.password,
				role: loginForm.role,
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
			const response = await registerCustomerRequest({
				firstName: registerForm.firstName.trim(),
				lastName: registerForm.lastName.trim(),
				email: registerForm.email.trim(),
				password: registerForm.password,
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

						<FormAlert className="error" message={error} role="alert" />

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

						<FormAlert className="error" message={error} role="alert" />

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

export default LoginPage;
