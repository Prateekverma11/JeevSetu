import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
// CONCEPT: Form Validation — import client-side validators
import { runValidators, hasErrors, registerValidators, validateField, validatePasswordMatch } from '../utils/validators';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'CITIZEN'
    });
    const [error, setError] = useState('');
    // CONCEPT: Form Validation — per-field error tracking
    const [fieldErrors, setFieldErrors] = useState({});
    const [touched, setTouched] = useState({});
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Live validation: update error for the changed field if already touched
        if (touched[name]) {
            let err = null;
            if (name === 'confirmPassword') {
                err = validatePasswordMatch(value, formData.password);
            } else if (registerValidators[name]) {
                err = validateField(value, registerValidators[name]);
            }
            setFieldErrors(prev => ({ ...prev, [name]: err }));
        }
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        let err = null;
        if (field === 'confirmPassword') {
            err = validatePasswordMatch(formData.confirmPassword, formData.password);
        } else if (registerValidators[field]) {
            err = validateField(formData[field], registerValidators[field]);
        }
        setFieldErrors(prev => ({ ...prev, [field]: err }));
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        // Validate all fields before submitting
        const errors = runValidators(formData, registerValidators);
        errors.confirmPassword = validatePasswordMatch(formData.confirmPassword, formData.password);
        setFieldErrors(errors);
        setTouched({ name: true, email: true, password: true, confirmPassword: true, role: true });

        if (hasErrors(errors)) return;

        try {
            const { confirmPassword, ...submitData } = formData;
            const res = await api.post('/api/auth/register', submitData);
            login(res.data);
            navigate(res.data.role === 'RESCUER' ? '/rescuer/dashboard' : '/dashboard');
        } catch (err) {
            const serverErrors = err.response?.data?.errors;
            if (serverErrors?.length) {
                const errMap = {};
                serverErrors.forEach(e => { errMap[e.field] = e.message; });
                setFieldErrors(prev => ({ ...prev, ...errMap }));
            } else {
                setError(err.response?.data?.message || 'Registration failed');
            }
        }
    };

    // Helper: field error display
    const FieldError = ({ field }) =>
        touched[field] && fieldErrors[field] ? (
            <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                ⚠ {fieldErrors[field]}
            </span>
        ) : null;

    const inputClass = (field) =>
        `form-control${touched[field] && fieldErrors[field] ? ' is-invalid' : touched[field] && !fieldErrors[field] ? ' is-valid' : ''}`;

    return (
        <>
            <Navbar />
            <div className="auth-container animate-fade-in">
                <div className="glass-panel auth-card">
                    <h2>Create an Account</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Join Animal Rescuer today.</p>
                    
                    {error && (
                        <div style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: '0.5rem' }}>
                            {error}
                        </div>
                    )}
                    
                    <form onSubmit={handleRegister} noValidate>
                        <div className="form-group">
                            <label htmlFor="reg-name">Full Name</label>
                            <input 
                                id="reg-name"
                                type="text" 
                                name="name"
                                className={inputClass('name')}
                                value={formData.name}
                                onChange={handleChange}
                                onBlur={() => handleBlur('name')}
                                placeholder="John Doe"
                            />
                            <FieldError field="name" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="reg-email">Email Address</label>
                            <input 
                                id="reg-email"
                                type="email" 
                                name="email"
                                className={inputClass('email')}
                                value={formData.email}
                                onChange={handleChange}
                                onBlur={() => handleBlur('email')}
                                placeholder="you@example.com"
                            />
                            <FieldError field="email" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="reg-password">Password</label>
                            <input 
                                id="reg-password"
                                type="password" 
                                name="password"
                                className={inputClass('password')}
                                value={formData.password}
                                onChange={handleChange}
                                onBlur={() => handleBlur('password')}
                                placeholder="Min 6 chars, at least 1 number"
                            />
                            <FieldError field="password" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="reg-confirm">Confirm Password</label>
                            <input 
                                id="reg-confirm"
                                type="password" 
                                name="confirmPassword"
                                className={inputClass('confirmPassword')}
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                onBlur={() => handleBlur('confirmPassword')}
                                placeholder="Repeat your password"
                            />
                            <FieldError field="confirmPassword" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="reg-role">Role</label>
                            <select 
                                id="reg-role"
                                name="role" 
                                className={inputClass('role')}
                                value={formData.role} 
                                onChange={handleChange}
                                onBlur={() => handleBlur('role')}
                            >
                                <option value="CITIZEN">Citizen (Report Animals)</option>
                                <option value="RESCUER">Rescuer (Help Animals)</option>
                            </select>
                            <FieldError field="role" />
                        </div>
                        <button 
                            type="submit" 
                            className="btn btn-primary btn-block"
                        >
                            Sign Up
                        </button>
                    </form>
                    
                    <p style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        Already have an account? <Link to="/login" style={{ color: 'var(--primary)' }}>Login</Link>
                    </p>
                </div>
            </div>
        </>
    );
};

export default Register;
