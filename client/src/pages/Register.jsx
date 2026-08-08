import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'CITIZEN'
    });
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/auth/register', formData);
            login(res.data);
            navigate(res.data.role === 'RESCUER' ? '/rescuer/dashboard' : '/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <>
            <Navbar />
            <div className="auth-container animate-fade-in">
                <div className="glass-panel auth-card">
                    <h2>Create an Account</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Join Animal Rescuer today.</p>
                    
                    {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}
                    
                    <form onSubmit={handleRegister}>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input 
                                type="text" 
                                name="name"
                                className="form-control" 
                                value={formData.name}
                                onChange={handleChange}
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input 
                                type="email" 
                                name="email"
                                className="form-control" 
                                value={formData.email}
                                onChange={handleChange}
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input 
                                type="password" 
                                name="password"
                                className="form-control" 
                                value={formData.password}
                                onChange={handleChange}
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <label>Role</label>
                            <select 
                                name="role" 
                                className="form-control" 
                                value={formData.role} 
                                onChange={handleChange}
                            >
                                <option value="CITIZEN">Citizen (Report Animals)</option>
                                <option value="RESCUER">Rescuer (Help Animals)</option>
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary btn-block">Sign Up</button>
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
