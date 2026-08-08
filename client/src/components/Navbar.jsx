import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-brand">🐾 Animal Rescuer</Link>
            <div className="navbar-nav">
                {user ? (
                    <>
                        <span style={{ color: 'var(--text-muted)' }}>Hello, {user.name}</span>
                        {user.role === 'CITIZEN' && (
                            <Link to="/report" className="btn btn-primary">Report Animal</Link>
                        )}
                        <button onClick={handleLogout} className="btn btn-danger">Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="nav-link">Login</Link>
                        <Link to="/register" className="btn btn-primary">Sign Up</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
