import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import NotificationCenter from './NotificationCenter';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const { isConnected } = useContext(SocketContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link to="/" className="navbar-brand">🐾 Animal Rescuer</Link>
                {user && (
                    <span 
                        className="connection-status" 
                        title={isConnected ? "Real-time socket connected" : "Connecting to socket..."}
                    >
                        <span className={`status-dot ${isConnected ? 'online' : 'offline'}`}></span>
                        {isConnected ? 'Live' : 'Connecting'}
                    </span>
                )}
            </div>

            <div className="navbar-nav">
                {user ? (
                    <>
                        <div className="user-profile-badge">
                            <span className="user-name">Hello, <strong>{user.name}</strong></span>
                            <span className="role-pill">{user.role}</span>
                        </div>

                        <NotificationCenter />
                        <Link to="/concepts" className="nav-link" style={{ fontWeight: '600' }}>
                            ⚡ JS Concepts
                        </Link>

                        {user.role === 'CITIZEN' && (
                            <Link to="/report" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                                + Report Animal
                            </Link>
                        )}
                        
                        <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '0.5rem 1rem' }}>
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/concepts" className="nav-link" style={{ fontWeight: '600' }}>
                            ⚡ JS Concepts
                        </Link>
                        <Link to="/login" className="nav-link">Login</Link>
                        <Link to="/register" className="btn btn-primary">Sign Up</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
