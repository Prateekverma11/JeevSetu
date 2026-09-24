import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Sidebar = ({ activeTab, onTabChange }) => {
    const { user } = useContext(AuthContext);
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const isRescuer = user?.role === 'RESCUER';

    useEffect(() => {
        const handleToggle = () => setMobileOpen(prev => !prev);
        const handleClose = () => setMobileOpen(false);

        window.addEventListener('toggle-mobile-sidebar', handleToggle);
        window.addEventListener('close-mobile-sidebar', handleClose);

        return () => {
            window.removeEventListener('toggle-mobile-sidebar', handleToggle);
            window.removeEventListener('close-mobile-sidebar', handleClose);
        };
    }, []);

    const handleNavClick = (tabKey, path) => {
        setMobileOpen(false);
        if (onTabChange) {
            onTabChange(tabKey);
        }
        if (path && location.pathname !== path) {
            navigate(path);
        }
    };

    const handleDirectNav = (path) => {
        setMobileOpen(false);
        navigate(path);
    };

    return (
        <>
            {/* Mobile backdrop */}
            {mobileOpen && (
                <div 
                    className="sidebar-mobile-backdrop" 
                    onClick={() => setMobileOpen(false)} 
                />
            )}

            <aside className={`app-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
                {/* Top Brand Logo & Mobile Close */}
                <div className="sidebar-brand-wrapper">
                    <Link to="/" className="sidebar-brand" onClick={() => setMobileOpen(false)}>
                        <span className="brand-title">Animal Rescuer</span>
                    </Link>
                    <button 
                        type="button" 
                        className="sidebar-mobile-close-btn"
                        onClick={() => setMobileOpen(false)}
                        aria-label="Close menu"
                    >
                        ✕
                    </button>
                </div>

                {/* Navigation Menu */}
                <nav className="sidebar-menu">
                {isRescuer ? (
                    <>
                        <button
                            type="button"
                            className={`sidebar-nav-item ${(activeTab === 'list' || activeTab === 'operations' || !activeTab) && location.pathname === '/rescuer/dashboard' ? 'active' : ''}`}
                            onClick={() => handleNavClick('list', '/rescuer/dashboard')}
                        >
                            <span className="nav-label">Operations</span>
                        </button>

                        <button
                            type="button"
                            className={`sidebar-nav-item ${activeTab === 'map' ? 'active' : ''}`}
                            onClick={() => handleNavClick('map', '/rescuer/dashboard')}
                        >
                            <span className="nav-label">Map View</span>
                        </button>

                        <button
                            type="button"
                            className={`sidebar-nav-item ${activeTab === 'history' ? 'active' : ''}`}
                            onClick={() => handleNavClick('history', '/rescuer/dashboard')}
                        >
                            <span className="nav-label">Rescue History</span>
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            type="button"
                            className={`sidebar-nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
                            onClick={() => handleDirectNav('/dashboard')}
                        >
                            <span className="nav-label">My Reports</span>
                        </button>

                        <button
                            type="button"
                            className={`sidebar-nav-item ${location.pathname === '/report' ? 'active' : ''}`}
                            onClick={() => handleDirectNav('/report')}
                        >
                            <span className="nav-label">Report Animal</span>
                        </button>
                    </>
                )}
            </nav>
        </aside>
        </>
    );
};

export default Sidebar;
