import { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';

const TopHeader = ({ searchQuery = '', onSearchChange }) => {
    const { user, logout } = useContext(AuthContext);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getInitials = (name) => {
        if (!name) return 'AR';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    return (
        <header className="app-top-header">
            {/* Top Row: Left brand/hamburger on mobile, Search in center on desktop, Right controls (Bell + User) */}
            <div className="header-top-row">
                {/* Mobile Left Section: ☰ Hamburger & Logo */}
                <div className="header-left-mobile-row">
                    <button
                        type="button"
                        className="header-mobile-menu-btn"
                        onClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))}
                        aria-label="Open Navigation Menu"
                        title="Menu"
                    >
                        <span className="hamburger-icon-lines">☰</span>
                    </button>
                    <span className="header-mobile-brand-title">Animal Rescuer</span>
                </div>

                {/* Desktop Search Bar */}
                <div className="header-search-wrap desktop-search-only">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        className="header-search-input"
                        placeholder="Search location, animal type, or request ID..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                    />
                </div>

                {/* Right Controls: Notification Bell directly next to User Avatar */}
                <div className="header-right-controls">
                    <NotificationCenter />

                    {/* User Profile Avatar with Dropdown */}
                    {user ? (
                        <div className="header-user-profile" ref={dropdownRef} onClick={() => setDropdownOpen(!dropdownOpen)}>
                            <div className="user-avatar-circle">
                                {getInitials(user.name)}
                            </div>
                            <div className="user-meta-text">
                                <span className="user-greeting">Hello, <strong>{user.name}</strong></span>
                                <span className="user-role-text">{user.role === 'RESCUER' ? 'Rescuer' : 'Citizen'}</span>
                            </div>
                            <span className="dropdown-chevron">▾</span>

                            {dropdownOpen && (
                                <div className="user-dropdown-menu">
                                    <div className="dropdown-user-info">
                                        <div className="dropdown-user-name">{user.name}</div>
                                        <div className="dropdown-user-email">{user.email}</div>
                                    </div>
                                    <hr className="dropdown-divider" />
                                    <button
                                        type="button"
                                        className="dropdown-item logout-item"
                                        onClick={handleLogout}
                                    >
                                         Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="header-auth-buttons">
                            <button onClick={() => navigate('/login')} className="btn btn-secondary" style={{ padding: '0.4rem 1rem' }}>
                                Login
                            </button>
                            <button onClick={() => navigate('/register')} className="btn btn-primary" style={{ padding: '0.4rem 1rem' }}>
                                Sign Up
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Search Row (full width below top row on phones) */}
            <div className="header-mobile-search-row">
                <div className="header-search-wrap mobile-search-wrap">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        className="header-search-input"
                        placeholder="Search location, animal type, or request ID..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                    />
                </div>
            </div>
        </header>
    );
};

export default TopHeader;
