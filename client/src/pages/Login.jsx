import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
            login(res.data);
            navigate(res.data.role === 'RESCUER' ? '/rescuer/dashboard' : '/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await axios.post('http://localhost:5000/api/auth/google', {
                token: credentialResponse.credential
            });
            login(res.data);
            if (res.data.isNewUser) {
                // Should redirect to a profile completion page to choose role, but default is CITIZEN
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
                    
                    {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}
                    
                    <form onSubmit={handleEmailLogin}>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input 
                                type="email" 
                                className="form-control" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input 
                                type="password" 
                                className="form-control" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required 
                            />
                        </div>
                        <button type="submit" className="btn btn-primary btn-block">Login</button>
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
