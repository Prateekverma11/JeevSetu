import { useState, useEffect, useContext } from 'react';
import api, { getImageUrl } from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import AIChat from '../components/AIChat';
import ReportMap from '../components/ReportMap';
import { getGeolocationPromise, retryPromise } from '../utils';

const RescuerDashboard = () => {
    const { user, login } = useContext(AuthContext);
    const { socket } = useContext(SocketContext);
    const [nearbyReports, setNearbyReports] = useState([]);
    const [loading, setLoading] = useState(true);

    const initialLat = user.location?.coordinates?.[1] || '';
    const initialLng = user.location?.coordinates?.[0] || '';

    const [locationInput, setLocationInput] = useState({ lat: initialLat, lng: initialLng });
    const [locationStatus, setLocationStatus] = useState('');
    const [radiusInput, setRadiusInput] = useState(user.rescueRadius || 5);
    const [isAvailable, setIsAvailable] = useState(user.isAvailable || false);
    const [activeTab, setActiveTab] = useState('list'); // 'list' or 'map'

    useEffect(() => {
        fetchNearbyReports();
    }, []);

    useEffect(() => {
        if (socket) {
            const handleNewReport = (data) => {
                setNearbyReports(prev => {
                    const exists = prev.some(r => r._id === data.report._id);
                    if (exists) return prev;
                    return [data.report, ...prev];
                });
            };

            socket.on('new_rescue_request', handleNewReport);
            return () => {
                socket.off('new_rescue_request', handleNewReport);
            };
        }
    }, [socket]);

    const fetchNearbyReports = async () => {
        try {
            // Promises vs Callbacks concept: retryPromise wraps the fetch in an async
            // retry loop (pure Promise pattern) rather than nested error-first callbacks.
            const res = await retryPromise(() => api.get('/api/rescuers/nearby'), 3, 500);
            setNearbyReports(res.data);
        } catch (error) {
            console.error('Failed to fetch nearby reports after retries:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGetCurrentLocation = async () => {
        setLocationStatus('Detecting location...');
        try {
            const coords = await getGeolocationPromise({ enableHighAccuracy: true, timeout: 10000 });
            const lat = coords.latitude;
            const lng = coords.longitude;
            setLocationInput({ lat, lng });
            setLocationStatus(`📍 Detected: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } catch {
            setLocationStatus('Unable to retrieve location. Please check browser permissions.');
        }
    };

    const handleUpdateLocation = async (e) => {
        e.preventDefault();
        if (!locationInput.lat || !locationInput.lng) {
            setLocationStatus('Please detect or enter coordinates first.');
            return;
        }
        try {
            await api.patch('/api/rescuers/location', {
                latitude: Number(locationInput.lat),
                longitude: Number(locationInput.lng)
            });
            
            // Update context
            const updatedLocation = {
                type: 'Point',
                coordinates: [Number(locationInput.lng), Number(locationInput.lat)]
            };
            login({ ...user, location: updatedLocation });
            setLocationStatus('✅ Location updated successfully!');
            fetchNearbyReports();
        } catch (error) {
            setLocationStatus('❌ Failed to update location.');
        }
    };

    const handleUpdateSettings = async () => {
        try {
            await api.patch('/api/rescuers/radius', { radius: radiusInput });
            await api.patch('/api/rescuers/availability', { isAvailable });
            
            login({ ...user, rescueRadius: radiusInput, isAvailable });
            alert('Settings updated successfully');
            fetchNearbyReports();
        } catch (error) {
            alert('Failed to update settings');
        }
    };

    const handleAction = async (id, action) => {
        try {
            const res = await api.post(`/api/reports/${id}/${action}`);
            
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

    const myActiveRescues = nearbyReports.filter(r => r.assignedRescuerId === user._id || r.assignedRescuerId?._id === user._id);
    const pendingNearbyRescues = nearbyReports.filter(r => r.status === 'PENDING' || r.status === 'NOTIFIED');

    const rescuerCoords = (user.location?.coordinates?.length >= 2) 
        ? { lat: user.location.coordinates[1], lng: user.location.coordinates[0] }
        : (locationInput.lat && locationInput.lng) ? { lat: Number(locationInput.lat), lng: Number(locationInput.lng) } : null;

    const mapCenter = rescuerCoords ? [rescuerCoords.lat, rescuerCoords.lng] : [20.5937, 78.9629];

    return (
        <>
            <Navbar />
            <div className="container animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h2>Rescuer Operations Center</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Configure rescue perimeter and respond to localized emergency calls.</p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                            className={`btn ${activeTab === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setActiveTab('list')}
                        >
                            📋 List View
                        </button>
                        <button 
                            className={`btn ${activeTab === 'map' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setActiveTab('map')}
                        >
                            🗺️ Map View
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem', marginTop: '2rem' }}>
                    {/* Settings Panel */}
                    <div className="glass-panel" style={{ padding: '1.5rem', height: 'fit-content' }}>
                        <h3>Rescue Controls</h3>
                        
                        <form onSubmit={handleUpdateLocation} style={{ marginTop: '1.25rem' }}>
                            <div className="form-group">
                                <label>Base Location</label>
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
                            <button type="submit" className="btn btn-primary btn-block" style={{ marginBottom: '1.25rem' }}>
                                Save Location
                            </button>
                        </form>
                        
                        <div className="auth-divider"></div>
                        
                        <div className="form-group" style={{ marginTop: '1.25rem' }}>
                            <label>Rescue Radius: <strong>{radiusInput} km</strong></label>
                            <input 
                                type="range" 
                                min="1" max="10" 
                                value={radiusInput} 
                                onChange={(e) => setRadiusInput(Number(e.target.value))}
                                style={{ width: '100%' }}
                            />
                        </div>
                        
                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(15, 23, 42, 0.5)', padding: '0.75rem', borderRadius: '8px' }}>
                            <input 
                                type="checkbox" 
                                id="available"
                                checked={isAvailable}
                                onChange={(e) => setIsAvailable(e.target.checked)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <label htmlFor="available" style={{ margin: 0, cursor: 'pointer', fontWeight: '600' }}>
                                Ready for Active Rescues
                            </label>
                        </div>
                        
                        <button onClick={handleUpdateSettings} className="btn btn-primary btn-block">
                            Save Radius & Availability
                        </button>
                    </div>

                    {/* Main Content Area */}
                    <div>
                        {activeTab === 'map' ? (
                            <div className="glass-panel" style={{ padding: '1rem' }}>
                                <ReportMap 
                                    center={mapCenter} 
                                    reports={nearbyReports} 
                                    rescuerLocation={rescuerCoords}
                                    rescueRadius={radiusInput}
                                    zoom={12} 
                                />
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {/* Active Rescues Section */}
                                {myActiveRescues.length > 0 && (
                                    <div>
                                        <h3 style={{ color: 'var(--secondary)' }}>🚨 Active Rescues Assigned to You ({myActiveRescues.length})</h3>
                                        <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', marginTop: '1rem' }}>
                                            {myActiveRescues.map((report) => (
                                                <div key={report._id} className="glass-panel report-card" style={{ flexDirection: 'row', gap: '1.5rem', borderLeft: '4px solid var(--secondary)' }}>
                                                    {report.imageUrl && (
                                                        <img src={getImageUrl(report.imageUrl)} alt="Animal" style={{ width: '180px', height: '180px', borderRadius: '8px' }} />
                                                    )}
                                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <h4>{report.animalType}</h4>
                                                            <span className={getStatusBadge(report.status)}>{report.status.replace('_', ' ')}</span>
                                                        </div>
                                                        <p style={{ color: 'var(--text-muted)' }}>
                                                            <strong>Severity:</strong> <span className={`severity-tag severity-${report.severity.toLowerCase()}`}>{report.severity}</span>
                                                        </p>
                                                        <p>{report.description}</p>
                                                        
                                                        <div className="report-card-actions" style={{ marginTop: 'auto' }}>
                                                            {report.status === 'ACCEPTED' && (
                                                                <button onClick={() => handleAction(report._id, 'start')} className="btn btn-secondary" style={{ flex: 1 }}>
                                                                    🚗 Start Navigation & Rescue
                                                                </button>
                                                            )}
                                                            {report.status === 'IN_PROGRESS' && (
                                                                <button onClick={() => handleAction(report._id, 'complete')} className="btn btn-primary" style={{ flex: 1 }}>
                                                                    ✅ Complete Rescue
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Nearby Requests Section */}
                                <div>
                                    <h3>Nearby Pending Incident Requests</h3>
                                    {loading ? (
                                        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                                            <p>Scanning nearby reports...</p>
                                        </div>
                                    ) : pendingNearbyRescues.length === 0 ? (
                                        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                                            <p style={{ color: 'var(--text-muted)' }}>No pending rescue requests found within your current radius ({radiusInput} km).</p>
                                        </div>
                                    ) : (
                                        <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', marginTop: '1rem' }}>
                                            {pendingNearbyRescues.map((report) => (
                                                <div key={report._id} className="glass-panel report-card" style={{ flexDirection: 'row', gap: '1.5rem' }}>
                                                    {report.imageUrl && (
                                                        <img src={getImageUrl(report.imageUrl)} alt="Animal" style={{ width: '180px', height: '180px', borderRadius: '8px' }} />
                                                    )}
                                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <h4>{report.animalType}</h4>
                                                            <span className={getStatusBadge(report.status)}>{report.status.replace('_', ' ')}</span>
                                                        </div>
                                                        <p style={{ color: 'var(--text-muted)' }}>
                                                            <strong>Severity:</strong> <span className={`severity-tag severity-${report.severity.toLowerCase()}`}>{report.severity}</span>
                                                        </p>
                                                        <p>{report.description}</p>
                                                        
                                                        <div className="report-card-actions" style={{ marginTop: 'auto' }}>
                                                            <button onClick={() => handleAction(report._id, 'accept')} className="btn btn-primary" style={{ flex: 1 }}>
                                                                Accept Rescue
                                                            </button>
                                                            <button onClick={() => handleAction(report._id, 'decline')} className="btn btn-danger" style={{ flex: 1 }}>
                                                                Decline
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
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
