import { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { runValidators, hasErrors, loginValidators, registerValidators, validateField } from '../utils/validators';

const Landing = ({ defaultTab = 'signin' }) => {
    const { user, login, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    // Tab state: 'signin' or 'register'
    const [activeTab, setActiveTab] = useState(defaultTab);

    // Sign in state
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginFieldErrors, setLoginFieldErrors] = useState({});
    const [loginTouched, setLoginTouched] = useState({});
    const [loginLoading, setLoginLoading] = useState(false);

    // Register state
    const [regData, setRegData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'CITIZEN'
    });
    const [regError, setRegError] = useState('');
    const [regFieldErrors, setRegFieldErrors] = useState({});
    const [regTouched, setRegTouched] = useState({});
    const [regLoading, setRegLoading] = useState(false);

    // If user is already authenticated, redirect to their main dashboard
    useEffect(() => {
        if (user) {
            navigate(user.role === 'RESCUER' ? '/rescuer/dashboard' : '/dashboard', { replace: true });
        }
    }, [user, navigate]);

    // Sync tab if query parameter or route changes
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('tab') === 'register' || location.pathname === '/register') {
            setActiveTab('register');
        } else if (params.get('tab') === 'signin' || location.pathname === '/login') {
            setActiveTab('signin');
        }
    }, [location]);

    const getDashboardPath = (role) => {
        const targetRole = role || user?.role;
        return targetRole === 'RESCUER' ? '/rescuer/dashboard' : '/dashboard';
    };

    // Handle Login Submit
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError('');

        const errors = runValidators({ email: loginEmail, password: loginPassword }, loginValidators);
        setLoginFieldErrors(errors);
        setLoginTouched({ email: true, password: true });

        if (hasErrors(errors)) return;

        try {
            setLoginLoading(true);
            const res = await api.post('/api/auth/login', {
                email: loginEmail,
                password: loginPassword
            });
            login(res.data);
            navigate(getDashboardPath(res.data.role));
        } catch (err) {
            const serverErrors = err.response?.data?.errors;
            if (serverErrors?.length) {
                const errMap = {};
                serverErrors.forEach(e => { errMap[e.field] = e.message; });
                setLoginFieldErrors(prev => ({ ...prev, ...errMap }));
            } else {
                const msg = err.response?.data?.message;
                if (msg === 'Invalid credentials' || err.response?.status === 401) {
                    setLoginError('Invalid email or password. Please check your credentials or create an account.');
                } else {
                    setLoginError(msg || 'Sign in failed. Please check your network and try again.');
                }
            }
        } finally {
            setLoginLoading(false);
        }
    };

    // Handle Register Submit
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setRegError('');

        const errors = runValidators(regData, registerValidators);
        setRegFieldErrors(errors);
        setRegTouched({ name: true, email: true, password: true, role: true });

        if (hasErrors(errors)) return;

        try {
            setRegLoading(true);
            const res = await api.post('/api/auth/register', regData);
            login(res.data);
            navigate(getDashboardPath(res.data.role));
        } catch (err) {
            const serverErrors = err.response?.data?.errors;
            if (serverErrors?.length) {
                const errMap = {};
                serverErrors.forEach(e => { errMap[e.field] = e.message; });
                setRegFieldErrors(prev => ({ ...prev, ...errMap }));
            } else {
                setRegError(err.response?.data?.message || 'Account creation failed.');
            }
        } finally {
            setRegLoading(false);
        }
    };

    // Google Login Placeholder / Demo
    const handleGoogleAuth = () => {
        alert('Google Sign-In integration: Please use email & password to sign in or register.');
    };

    return (
        <div className="guardian-hero-page guardian-login-standalone">
            <main className="guardian-hero-main-layout">
                <div className="guardian-hero-container">
                    {/* Left Column: Animal Rescue Headline & Hotlines */}
                    <div className="guardian-hero-left">
                        <h1 className="guardian-hero-headline">
                            Protect Stray Animals with a<br />
                            <span className="guardian-word-accent">rescuer on call</span>
                        </h1>

                        <p className="guardian-hero-description">
                            Animal Rescuer connects compassionate citizens directly with emergency rescue squads,
                            live GPS radar tracking, veterinary helplines, and instant dispatch operations — saving lives every day.
                        </p>

                        {/* Emergency Hotline Numbers Strip */}
                        <div className="guardian-hotlines-row">
                            <div className="guardian-hotline-item">
                                <span className="hotline-number">112</span>
                                <span className="hotline-label">National Emergency</span>
                            </div>
                            <div className="guardian-hotline-divider"></div>
                            <div className="guardian-hotline-item">
                                <span className="hotline-number">1962</span>
                                <span className="hotline-label">Animal Ambulance</span>
                            </div>
                            <div className="guardian-hotline-divider"></div>
                            <div className="guardian-hotline-item">
                                <span className="hotline-number">24/7</span>
                                <span className="hotline-label">Live Rescuer Dispatch</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Floating Auth Card in Dark Forest Green Theme */}
                    <div className="guardian-hero-right">
                        <div className="guardian-auth-card">
                            {/* Segmented Tab Switcher */}
                            <div className="guardian-auth-tabs">
                                <button
                                    type="button"
                                    className={`guardian-auth-tab ${activeTab === 'signin' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('signin')}
                                >
                                    Sign In
                                </button>
                                <button
                                    type="button"
                                    className={`guardian-auth-tab ${activeTab === 'register' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('register')}
                                >
                                    Create Account
                                </button>
                            </div>

                            {/* SIGN IN FORM */}
                            {activeTab === 'signin' && (
                                <form onSubmit={handleLoginSubmit} className="guardian-auth-form" noValidate>
                                    {loginError && (
                                        <div className="guardian-form-error-banner">
                                            {loginError}
                                        </div>
                                    )}

                                    <div className="guardian-form-field">
                                        <label htmlFor="auth-signin-email">Email Address</label>
                                        <div className="guardian-input-icon-wrap">
                                            <span className="input-field-icon">✉</span>
                                            <input 
                                                id="auth-signin-email"
                                                type="email" 
                                                placeholder="you@example.com"
                                                value={loginEmail}
                                                onChange={(e) => setLoginEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                        {loginTouched.email && loginFieldErrors.email && (
                                            <span className="field-error-text">⚠ {loginFieldErrors.email}</span>
                                        )}
                                    </div>

                                    <div className="guardian-form-field">
                                        <label htmlFor="auth-signin-password">Password</label>
                                        <div className="guardian-input-icon-wrap">
                                            <span className="input-field-icon">🔒</span>
                                            <input 
                                                id="auth-signin-password"
                                                type="password" 
                                                placeholder="••••••••"
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                        {loginTouched.password && loginFieldErrors.password && (
                                            <span className="field-error-text">⚠ {loginFieldErrors.password}</span>
                                        )}
                                    </div>

                                    <button 
                                        type="submit" 
                                        className="guardian-form-submit-btn"
                                        disabled={loginLoading}
                                    >
                                        <span>{loginLoading ? 'Signing In...' : 'Sign In'}</span>
                                        <span className="btn-arrow">→</span>
                                    </button>
                                </form>
                            )}

                            {/* CREATE ACCOUNT FORM */}
                            {activeTab === 'register' && (
                                <form onSubmit={handleRegisterSubmit} className="guardian-auth-form" noValidate>
                                    {regError && (
                                        <div className="guardian-form-error-banner">
                                            {regError}
                                        </div>
                                    )}

                                    <div className="guardian-form-field">
                                        <label htmlFor="auth-reg-name">Full Name</label>
                                        <div className="guardian-input-icon-wrap">
                                            <span className="input-field-icon">👤</span>
                                            <input 
                                                id="auth-reg-name"
                                                type="text" 
                                                placeholder="Your full name"
                                                value={regData.name}
                                                onChange={(e) => setRegData(prev => ({ ...prev, name: e.target.value }))}
                                                required
                                            />
                                        </div>
                                        {regTouched.name && regFieldErrors.name && (
                                            <span className="field-error-text">⚠ {regFieldErrors.name}</span>
                                        )}
                                    </div>

                                    <div className="guardian-form-field">
                                        <label htmlFor="auth-reg-email">Email Address</label>
                                        <div className="guardian-input-icon-wrap">
                                            <span className="input-field-icon">✉</span>
                                            <input 
                                                id="auth-reg-email"
                                                type="email" 
                                                placeholder="you@example.com"
                                                value={regData.email}
                                                onChange={(e) => setRegData(prev => ({ ...prev, email: e.target.value }))}
                                                required
                                            />
                                        </div>
                                        {regTouched.email && regFieldErrors.email && (
                                            <span className="field-error-text">⚠ {regFieldErrors.email}</span>
                                        )}
                                    </div>

                                    <div className="guardian-form-field">
                                        <label htmlFor="auth-reg-password">Password</label>
                                        <div className="guardian-input-icon-wrap">
                                            <span className="input-field-icon">🔒</span>
                                            <input 
                                                id="auth-reg-password"
                                                type="password" 
                                                placeholder="••••••••"
                                                value={regData.password}
                                                onChange={(e) => setRegData(prev => ({ ...prev, password: e.target.value }))}
                                                required
                                            />
                                        </div>
                                        {regTouched.password && regFieldErrors.password && (
                                            <span className="field-error-text">⚠ {regFieldErrors.password}</span>
                                        )}
                                    </div>

                                    {/* Role Selector */}
                                    <div className="guardian-form-field">
                                        <label>I want to join as</label>
                                        <div className="guardian-role-toggle-group">
                                            <button
                                                type="button"
                                                className={`role-select-btn ${regData.role === 'CITIZEN' ? 'active' : ''}`}
                                                onClick={() => setRegData(prev => ({ ...prev, role: 'CITIZEN' }))}
                                            >
                                                🐾 Citizen (Report)
                                            </button>
                                            <button
                                                type="button"
                                                className={`role-select-btn ${regData.role === 'RESCUER' ? 'active' : ''}`}
                                                onClick={() => setRegData(prev => ({ ...prev, role: 'RESCUER' }))}
                                            >
                                                🛡️ Rescuer (Save)
                                            </button>
                                        </div>
                                    </div>

                                    <button 
                                        type="submit" 
                                        className="guardian-form-submit-btn"
                                        disabled={regLoading}
                                    >
                                        <span>{regLoading ? 'Creating Account...' : 'Create Account'}</span>
                                        <span className="btn-arrow">→</span>
                                    </button>
                                </form>
                            )}

                            {/* Or Continue With Google */}
                            <div className="guardian-auth-divider">
                                <span>Or continue with</span>
                            </div>

                            <button 
                                type="button" 
                                onClick={handleGoogleAuth} 
                                className="guardian-google-btn"
                            >
                                <svg className="google-icon-svg" viewBox="0 0 24 24" width="18" height="18">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                </svg>
                                <span>Continue with Google</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Landing;
