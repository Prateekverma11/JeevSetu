import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import AIChat from '../components/AIChat';

const RescuerDashboard = () => {
    const { user, login } = useContext(AuthContext);
    const { socket } = useContext(SocketContext);
    const [nearbyReports, setNearbyReports] = useState([]);
    const [loading, setLoading] = useState(true);

    const [locationInput, setLocationInput] = useState({ lat: '', lng: '' });
    const [locationStatus, setLocationStatus] = useState('');
    const [settingsStatus, setSettingsStatus] = useState('');
    const [radiusInput, setRadiusInput] = useState(user.rescueRadius || 5);
    const [isAvailable, setIsAvailable] = useState(user.isAvailable || false);

    useEffect(() => {
        fetchNearbyReports();
    }, [user.token]);

    useEffect(() => {
        if (socket) {
            socket.on('new_rescue_request', (data) => {
                setNearbyReports(prev => [data.report, ...prev]);
            });
        }
        return () => {
            if (socket) {
                socket.off('new_rescue_request');
            }
        };
    }, [socket]);

    const fetchNearbyReports = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/rescuers/nearby', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setNearbyReports(res.data);
        } catch (error) {
            console.error('Failed to fetch nearby reports', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGetCurrentLocation = () => {
        setLocationStatus('Getting your location...');
        if (!navigator.geolocation) {
            setLocationStatus('Geolocation is not supported by your browser.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setLocationInput({ lat, lng });
                setLocationStatus(`Location detected: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
            },
            () => setLocationStatus('Unable to retrieve location. Please allow location access.')
        );
    };

    const handleUpdateLocation = async (e) => {
        e.preventDefault();
        if (!locationInput.lat || !locationInput.lng) {
            setLocationStatus('Please use "Detect My Location" first.');
            return;
        }
        try {
            await axios.patch('http://localhost:5000/api/rescuers/location', {
                latitude: locationInput.lat,
                longitude: locationInput.lng
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setLocationStatus('✅ Location updated successfully!');
            fetchNearbyReports();
        } catch (error) {
            setLocationStatus('❌ Failed to update location.');
        }
    };

    const handleUpdateSettings = async () => {
        try {
            await axios.patch('http://localhost:5000/api/rescuers/radius', { radius: radiusInput }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            await axios.patch('http://localhost:5000/api/rescuers/availability', { isAvailable }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            
            // Update local user context
            login({ ...user, rescueRadius: radiusInput, isAvailable });
            alert('Settings updated successfully');
            fetchNearbyReports();
        } catch (error) {
            alert('Failed to update settings');
        }
    };

    const handleAction = async (id, action) => {
        try {
            const res = await axios.post(`http://localhost:5000/api/reports/${id}/${action}`, {}, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            
            if (action === 'accept' || action === 'start' || action === 'complete') {
                setNearbyReports(prev => prev.map(report => report._id === id ? res.data : report));
            } else if (action === 'decline') {
                setNearbyReports(prev => prev.filter(report => report._id !== id));
            }
        } catch (error) {
            alert(error.response?.data?.message || `Failed to ${action} rescue`);
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'PENDING': 'badge-pending',
            'NOTIFIED': 'badge-notified',
            'ACCEPTED': 'badge-accepted',
            'IN_PROGRESS': 'badge-inprogress',
            'COMPLETED': 'badge-completed',
        };
        return `badge ${statusMap[status] || 'badge-pending'}`;
    };

    return (
        <>
            <Navbar />
            <div className="container animate-fade-in">
                <h2>Rescuer Dashboard</h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginTop: '2rem' }}>
                    {/* Settings Panel */}
                    <div className="glass-panel" style={{ padding: '1.5rem', height: 'fit-content' }}>
                        <h3>Settings</h3>
                        
                        <form onSubmit={handleUpdateLocation} style={{ marginTop: '1.5rem' }}>
                            <div className="form-group">
                                <label>Current Location</label>
                                <button 
                                    type="button" 
                                    onClick={handleGetCurrentLocation} 
                                    className="btn btn-secondary btn-block"
                                    style={{ marginBottom: '0.75rem' }}
                                >
                                    📍 Detect My Location
                                </button>
                                {locationStatus && (
                                    <p style={{ 
                                        fontSize: '0.85rem', 
                                        color: locationStatus.startsWith('✅') ? 'var(--secondary)' : locationStatus.startsWith('❌') ? 'var(--danger)' : 'var(--text-muted)',
                                        marginTop: '0.25rem'
                                    }}>
                                        {locationStatus}
                                    </p>
                                )}
                            </div>
                            <button type="submit" className="btn btn-primary btn-block" style={{ marginBottom: '1.5rem' }}>
                                Save Location
                            </button>
                        </form>
                        
                        <div className="auth-divider"></div>
                        
                        <div className="form-group" style={{ marginTop: '1.5rem' }}>
                            <label>Rescue Radius (km): {radiusInput}</label>
                            <input 
                                type="range" 
                                min="1" max="10" 
                                value={radiusInput} 
                                onChange={(e) => setRadiusInput(Number(e.target.value))}
                                style={{ width: '100%' }}
                            />
                        </div>
                        
                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input 
                                type="checkbox" 
                                id="available"
                                checked={isAvailable}
                                onChange={(e) => setIsAvailable(e.target.checked)}
                            />
                            <label htmlFor="available" style={{ margin: 0 }}>Available for Rescues</label>
                        </div>
                        
                        <button onClick={handleUpdateSettings} className="btn btn-primary btn-block">
                            Save Settings
                        </button>
                    </div>

                    {/* Active/Nearby Reports */}
                    <div>
                        <h3>Nearby Rescue Requests</h3>
                        {loading ? (
                            <p>Loading requests...</p>
                        ) : nearbyReports.length === 0 ? (
                            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                                <p style={{ color: 'var(--text-muted)' }}>No nearby requests found.</p>
                            </div>
                        ) : (
                            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
                                {nearbyReports.map((report) => (
                                    <div key={report._id} className="glass-panel report-card" style={{ flexDirection: 'row', gap: '2rem' }}>
                                        {report.imageUrl && (
                                            <img src={`http://localhost:5000${report.imageUrl}`} alt="Animal" style={{ width: '200px', height: '200px' }} />
                                        )}
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <h4>{report.animalType}</h4>
                                                <span className={getStatusBadge(report.status)}>{report.status.replace('_', ' ')}</span>
                                            </div>
                                            <p style={{ color: 'var(--text-muted)' }}>Severity: {report.severity}</p>
                                            <p>{report.description}</p>
                                            
                                            <div className="report-card-actions">
                                                {report.status === 'PENDING' || report.status === 'NOTIFIED' ? (
                                                    <>
                                                        <button onClick={() => handleAction(report._id, 'accept')} className="btn btn-primary" style={{ flex: 1 }}>Accept</button>
                                                        <button onClick={() => handleAction(report._id, 'decline')} className="btn btn-danger" style={{ flex: 1 }}>Decline</button>
                                                    </>
                                                ) : report.status === 'ACCEPTED' ? (
                                                    <button onClick={() => handleAction(report._id, 'start')} className="btn btn-secondary" style={{ flex: 1 }}>Start Rescue</button>
                                                ) : report.status === 'IN_PROGRESS' ? (
                                                    <button onClick={() => handleAction(report._id, 'complete')} className="btn btn-primary" style={{ flex: 1 }}>Complete Rescue</button>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <AIChat />
        </>
    );
};

export default RescuerDashboard;
