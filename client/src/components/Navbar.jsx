import { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getDashboardPath = () => {
        if (!user) return '/login';
        return user.role === 'RESCUER' ? '/rescuer/dashboard' : '/dashboard';
    };

    return (
        <nav className="guardian-navbar">
            <div className="guardian-nav-container">
                {/* Left: Brand + Role Badge */}
                <div className="guardian-nav-left">
                    <Link to="/" className="guardian-brand-link">
                        <div className="guardian-logo-icon">
                            <span>🛡️</span>
                        </div>
                        <span className="guardian-brand-text">Animal Rescuer</span>
                    </Link>
                    <span className="guardian-role-pill">
                        {user ? (user.role === 'RESCUER' ? 'RESCUER' : 'CITIZEN') : 'RESCUE NETWORK'}
                    </span>
                </div>

                {/* Center: Navigation Links */}
                <div className="guardian-nav-center">
                    <Link 
                        to="/" 
                        className={`guardian-nav-link ${location.pathname === '/' ? 'active' : ''}`}
                    >
                        Home
                    </Link>
                    <Link 
                        to={getDashboardPath()} 
                        className={`guardian-nav-link ${location.pathname.includes('dashboard') ? 'active' : ''}`}
                    >
                        <span className="nav-icon-inline">⊞</span> Dashboard
                    </Link>
                    <Link 
                        to={user?.role === 'RESCUER' ? '/rescuer/dashboard' : '/dashboard'} 
                        className="guardian-nav-link"
                    >
                        <span className="nav-icon-inline">📍</span> Rescue Map
                    </Link>
                    <Link 
                        to={user ? (user.role === 'RESCUER' ? '/rescuer/dashboard' : '/report') : '/login'} 
                        className="guardian-nav-link"
                    >
                        <span className="nav-icon-inline">📋</span> Report
                    </Link>
                    <a 
                        href="tel:1962" 
                        className="guardian-nav-link"
                        title="Animal Emergency Helpline"
                    >
                        <span className="nav-icon-inline">👥</span> Helpline (1962)
                    </a>
                    <a 
                        href="#about" 
                        className="guardian-nav-link"
                        onClick={(e) => {
                            if (location.pathname === '/') {
                                e.preventDefault();
                                document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' });
                            }
                        }}
                    >
                        <span className="nav-icon-inline">ⓘ</span> About
                    </a>
                </div>

                {/* Right: SOS Active + User info or Sign In */}
                <div className="guardian-nav-right">
                    {/* SOS Active Badge */}
                    <div className="guardian-sos-badge">
                        <span className="sos-pulse-dot"></span>
                        <span className="sos-text">SOS Active</span>
                    </div>

                    {user ? (
                        <div className="guardian-user-section">
                            <NotificationCenter />
                            <div className="guardian-user-profile-meta">
                                <span className="guardian-user-name">{user.name}</span>
                                <span className="guardian-user-subrole">{user.role}</span>
                            </div>
                            <button 
                                onClick={handleLogout} 
                                className="guardian-logout-btn"
                                title="Sign Out"
                                aria-label="Sign Out"
                            >
                                <span>↪</span>
                            </button>
                        </div>
                    ) : (
                        <div className="guardian-auth-quick-actions">
                            <Link to="/login" className="guardian-login-pill-btn">
                                Sign In
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
