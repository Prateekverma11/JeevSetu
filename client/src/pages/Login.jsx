import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
// CONCEPT: Form Validation — import client-side validators
import { runValidators, hasErrors, loginValidators, validateField } from '../utils/validators';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    // CONCEPT: Form Validation — track per-field validation errors
    const [fieldErrors, setFieldErrors] = useState({ email: null, password: null });
    const [touched, setTouched] = useState({ email: false, password: false });
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    // Validate a single field on blur (when user leaves the field)
    const handleBlur = (field, value) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const error = validateField(value, loginValidators[field] || []);
        setFieldErrors(prev => ({ ...prev, [field]: error }));
    };

    // Validate all fields on submit
    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setError('');

        // Run all validators before submitting
        const errors = runValidators({ email, password }, loginValidators);
        setFieldErrors(errors);
        setTouched({ email: true, password: true });

        // Abort if any validation error
        if (hasErrors(errors)) return;

        try {
            const res = await api.post('/api/auth/login', { email, password });
            login(res.data);
            navigate(res.data.role === 'RESCUER' ? '/rescuer/dashboard' : '/dashboard');
        } catch (err) {
            // Show server-returned validation errors if present
            const serverErrors = err.response?.data?.errors;
            if (serverErrors?.length) {
                const errMap = {};
                serverErrors.forEach(e => { errMap[e.field] = e.message; });
                setFieldErrors(prev => ({ ...prev, ...errMap }));
            } else {
                setError(err.response?.data?.message || 'Login failed');
            }
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await api.post('/api/auth/google', {
                token: credentialResponse.credential
            });
            login(res.data);
            if (res.data.isNewUser) {
                navigate('/dashboard');
            } else {
                navigate(res.data.role === 'RESCUER' ? '/rescuer/dashboard' : '/dashboard');
            }
        } catch (err) {
            setError('Google login failed');
        }
    };

    return (
        <>
            <Navbar />
            <div className="auth-container animate-fade-in">
                <div className="glass-panel auth-card">
                    <h2>Welcome Back</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Sign in to continue to Animal Rescuer.</p>
                    
                    {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: '0.5rem' }}>{error}</div>}
                    
                    <form onSubmit={handleEmailLogin} noValidate>
                        <div className="form-group">
                            <label htmlFor="login-email">Email Address</label>
                            <input 
                                id="login-email"
                                type="email" 
                                className={`form-control${touched.email && fieldErrors.email ? ' is-invalid' : touched.email && !fieldErrors.email ? ' is-valid' : ''}`}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onBlur={(e) => handleBlur('email', e.target.value)}
                                placeholder="you@example.com"
                                aria-describedby="email-error"
                            />
                            {/* Inline validation error message */}
                            {touched.email && fieldErrors.email && (
                                <span id="email-error" style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                                    ⚠ {fieldErrors.email}
                                </span>
                            )}
                        </div>
                        <div className="form-group">
                            <label htmlFor="login-password">Password</label>
                            <input 
                                id="login-password"
                                type="password" 
                                className={`form-control${touched.password && fieldErrors.password ? ' is-invalid' : touched.password && !fieldErrors.password ? ' is-valid' : ''}`}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onBlur={(e) => handleBlur('password', e.target.value)}
                                placeholder="Your password"
                                aria-describedby="password-error"
                            />
                            {touched.password && fieldErrors.password && (
                                <span id="password-error" style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                                    ⚠ {fieldErrors.password}
                                </span>
                            )}
                        </div>
                        <button 
                            type="submit" 
                            className="btn btn-primary btn-block"
                            disabled={touched.email && touched.password && hasErrors(fieldErrors)}
                        >
                            Login
                        </button>
                    </form>
                    
                    <p style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        Don't have an account? <Link to="/register" style={{ color: 'var(--primary)' }}>Sign up</Link>
                    </p>
                </div>
            </div>
        </>
    );
};

export default Login;
