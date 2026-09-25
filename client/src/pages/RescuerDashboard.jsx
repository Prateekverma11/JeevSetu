import { useState, useEffect, useContext, useMemo } from 'react';
import api, { getImageUrl } from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';
import AIChat from '../components/AIChat';
import ReportMap from '../components/ReportMap';
import ImageModal from '../components/ImageModal';

const RescuerDashboard = () => {
    const { user, login } = useContext(AuthContext);
    const { socket } = useContext(SocketContext);
    const [nearbyReports, setNearbyReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);

    const isValidCoord = (lat, lng) => {
        const nLat = Number(lat);
        const nLng = Number(lng);
        return !isNaN(nLat) && !isNaN(nLng) && (Math.abs(nLat) > 0.1 || Math.abs(nLng) > 0.1);
    };

    const hasUserCoords = user?.location?.coordinates?.length >= 2 && isValidCoord(user.location.coordinates[1], user.location.coordinates[0]);

    const initialLat = hasUserCoords ? user.location.coordinates[1] : '';
    const initialLng = hasUserCoords ? user.location.coordinates[0] : '';

    const [locationInput, setLocationInput] = useState({ lat: initialLat, lng: initialLng });
    const [locationStatus, setLocationStatus] = useState('');
    const [settingsStatus, setSettingsStatus] = useState('');
    const [radiusInput, setRadiusInput] = useState(user?.rescueRadius ? Math.min(Number(user.rescueRadius), 10) : 5);
    const [isAvailable, setIsAvailable] = useState(user?.isAvailable || false);
    const [activeTab, setActiveTab] = useState('list'); // 'list', 'map', or 'history'
    const [focusedLocation, setFocusedLocation] = useState(null);
    const [mapZoom, setMapZoom] = useState(13);
    const [historyReports, setHistoryReports] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const autoDetectLiveLocation = () => {
        if (!navigator.geolocation) {
            setLocationStatus('Geolocation is not supported by your browser.');
            return;
        }
        setLocationStatus('📍 Detecting your live location...');
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                if (!isValidCoord(lat, lng)) return;

                setLocationInput({ lat, lng });
                setFocusedLocation([lat, lng]);
                setLocationStatus(`📍 Live Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);

                // Auto-save live coordinates to backend and sync user session
                try {
                    await api.patch('/api/rescuers/location', {
                        latitude: Number(lat),
                        longitude: Number(lng)
                    });
                    const updatedLocation = {
                        type: 'Point',
                        coordinates: [Number(lng), Number(lat)]
                    };
                    login({ ...user, location: updatedLocation });
                    fetchNearbyReports();
                } catch (err) {
                    console.warn('Auto-save live location note:', err);
                }
            },
            (err) => {
                console.warn('Live geolocation note:', err.message);
                if (hasUserCoords) {
                    setLocationStatus(`📍 Saved: ${user.location.coordinates[1].toFixed(4)}, ${user.location.coordinates[0].toFixed(4)}`);
                } else {
                    setLocationStatus('Allow GPS location access to display your live position.');
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    };

    useEffect(() => {
        fetchNearbyReports();
        fetchRescueHistory();
        // Immediately detect live GPS location so rescuer directly sees their real position
        autoDetectLiveLocation();
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
            const res = await api.get('/api/rescuers/nearby');
            setNearbyReports(res.data || []);
        } catch (error) {
            console.error('Failed to fetch nearby reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRescueHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await api.get('/api/rescuers/history');
            setHistoryReports(res.data || []);
        } catch (error) {
            console.error('Failed to fetch rescue history:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocationStatus('Geolocation is not supported by your browser.');
            return;
        }
        setLocationStatus('Detecting your GPS...');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setLocationInput({ lat, lng });
                setFocusedLocation([lat, lng]);
                setLocationStatus(`📍 Detected: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            },
            () => {
                setLocationStatus('Unable to retrieve location. Please check browser permissions.');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleUpdateLocation = async (e) => {
        if (e) e.preventDefault();
        if (!locationInput.lat || !locationInput.lng) {
            setLocationStatus('Please detect or enter coordinates first.');
            return;
        }
        try {
            await api.patch('/api/rescuers/location', {
                latitude: Number(locationInput.lat),
                longitude: Number(locationInput.lng)
            });

            const updatedLocation = {
                type: 'Point',
                coordinates: [Number(locationInput.lng), Number(locationInput.lat)]
            };
            login({ ...user, location: updatedLocation });
            setFocusedLocation([Number(locationInput.lat), Number(locationInput.lng)]);
            setLocationStatus('✅ Location saved successfully!');
            fetchNearbyReports();
        } catch {
            setLocationStatus('❌ Failed to save location.');
        }
    };

    const handleUpdateSettings = async () => {
        try {
            setSettingsStatus('Saving...');
            // Strictly clamp radius to 1-10 km as required by backend schema
            const validRadius = Math.min(Math.max(Number(radiusInput), 1), 10);
            
            await api.patch('/api/rescuers/radius', { radius: validRadius });
            await api.patch('/api/rescuers/availability', { isAvailable });
            login({ ...user, rescueRadius: validRadius, isAvailable });
            
            setSettingsStatus('✅ Settings updated!');
            setTimeout(() => setSettingsStatus(''), 3000);
            fetchNearbyReports();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to update settings';
            setSettingsStatus(`❌ ${msg}`);
            setTimeout(() => setSettingsStatus(''), 4000);
        }
    };

    const openGoogleMapsNavigation = (report) => {
        if (report?.location?.coordinates?.length >= 2) {
            const [lng, lat] = report.location.coordinates;
            const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    const handleAction = async (id, action, targetReport = null) => {
        try {
            const res = await api.post(`/api/reports/${id}/${action}`);
            if (action === 'accept' || action === 'start' || action === 'complete') {
                setNearbyReports(prev => prev.map(report => report._id === id ? res.data : report));
                if (action === 'complete') {
                    fetchRescueHistory();
                }
                // Automatically open Google Maps turn-by-turn navigation upon starting rescue
                if (action === 'accept' || action === 'start') {
                    openGoogleMapsNavigation(targetReport || res.data);
                }
            } else if (action === 'decline') {
                setNearbyReports(prev => prev.filter(report => report._id !== id));
            }
            return res.data;
        } catch (error) {
            alert(error.response?.data?.message || `Failed to ${action} rescue`);
            return null;
        }
    };

    const handleFocusOnMap = (report) => {
        if (report.location?.coordinates?.length >= 2) {
            const [lng, lat] = report.location.coordinates;
            setFocusedLocation([lat, lng]);
            setMapZoom(16);
            setActiveTab('map');
        }
    };

    const rescuerCoords = (locationInput.lat && locationInput.lng && isValidCoord(locationInput.lat, locationInput.lng))
        ? { lat: Number(locationInput.lat), lng: Number(locationInput.lng) }
        : hasUserCoords
        ? { lat: Number(user.location.coordinates[1]), lng: Number(user.location.coordinates[0]) }
        : null;

    const baseMapCenter = rescuerCoords ? [rescuerCoords.lat, rescuerCoords.lng] : [26.8500, 75.8000];
    const activeMapCenter = focusedLocation || baseMapCenter;

    // Filter reports based on search query
    const filteredReports = useMemo(() => {
        if (!searchQuery.trim()) return nearbyReports;
        const q = searchQuery.toLowerCase();
        return nearbyReports.filter(r => 
            (r.animalType && r.animalType.toLowerCase().includes(q)) ||
            (r.description && r.description.toLowerCase().includes(q)) ||
            (r._id && r._id.toLowerCase().includes(q)) ||
            (r.severity && r.severity.toLowerCase().includes(q))
        );
    }, [nearbyReports, searchQuery]);

    const myActiveRescues = filteredReports.filter(r => r.assignedRescuerId === user?._id || r.assignedRescuerId?._id === user?._id);
    const pendingNearbyRescues = filteredReports.filter(r => r.status === 'PENDING' || r.status === 'NOTIFIED');

    // Helper for relative distance
    const getDistanceText = (report) => {
        if (!rescuerCoords || !report.location?.coordinates) return '~2.5 km';
        const [rLng, rLat] = report.location.coordinates;
        const toRad = (val) => (val * Math.PI) / 180;
        const R = 6371;
        const dLat = toRad(rLat - rescuerCoords.lat);
        const dLon = toRad(rLng - rescuerCoords.lng);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(rescuerCoords.lat)) * Math.cos(toRad(rLat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        return `${d.toFixed(1)} km`;
    };

    const getSeverityBadge = (sev) => {
        if (sev === 'CRITICAL' || sev === 'HIGH') return <span className="urgency-badge urgent">Urgent</span>;
        if (sev === 'MEDIUM') return <span className="urgency-badge moderate">Moderate</span>;
        return <span className="urgency-badge normal">Normal</span>;
    };

    return (
        <div className="dashboard-layout-container">
            {/* ── Forest Green Sidebar ── */}
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

            {/* ── Main Content Area ── */}
            <div className="dashboard-main-panel">
                {/* Top Search & Profile Bar */}
                <TopHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

                <main className="dashboard-content-body">
                    {/* Header Title Banner */}
                    <div className="dashboard-title-banner">
                        <div className="banner-category">OPERATIONS CENTER</div>
                        <h1 className="banner-main-title">
                            {activeTab === 'map' ? 'Interactive Incident Map View' : activeTab === 'history' ? 'Completed Rescue History' : 'Rescuer Operations Center'}
                        </h1>
                        <p className="banner-subtitle">
                            {activeTab === 'map' 
                                ? 'Live visual radar showing all nearby active animal distress calls and your rescue perimeter.'
                                : activeTab === 'history'
                                ? 'Review all past emergency rescue operations successfully completed by you.'
                                : 'Track nearby rescue requests, respond to emergencies, and help animals in need.'}
                        </p>
                    </div>

                    {/* ── TAB 1: FULL MAP VIEW ── */}
                    {activeTab === 'map' ? (
                        <div className="forest-card" style={{ padding: '1rem', minHeight: '600px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 700, color: '#133b2e' }}>📍 Base Perimeter: {radiusInput} km</span>
                                    {focusedLocation && (
                                        <button 
                                            onClick={() => { setFocusedLocation(null); setMapZoom(12); }}
                                            className="btn btn-forest-outline"
                                            style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                                        >
                                            Reset Map Focus
                                        </button>
                                    )}
                                </div>
                                <button 
                                    onClick={() => setActiveTab('list')}
                                    className="btn btn-forest-solid"
                                    style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                                >
                                    📋 Back to Operations
                                </button>
                            </div>

                            <div style={{ height: '580px', borderRadius: '12px', overflow: 'hidden' }}>
                                <ReportMap
                                    center={activeMapCenter}
                                    reports={nearbyReports}
                                    rescuerLocation={rescuerCoords}
                                    rescueRadius={radiusInput}
                                    zoom={mapZoom}
                                />
                            </div>
                        </div>
                    ) : activeTab === 'history' ? (
                        /* ── TAB 2: RESCUE HISTORY VIEW ── */
                        <div className="forest-card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                <h3 className="card-title" style={{ margin: 0 }}>📜 Past Completed Missions ({historyReports.length})</h3>
                                <button 
                                    onClick={fetchRescueHistory}
                                    className="btn btn-forest-outline"
                                    style={{ padding: '0.35rem 0.85rem', fontSize: '0.82rem' }}
                                >
                                    🔄 Refresh History
                                </button>
                            </div>

                            {historyLoading ? (
                                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                                    <p>Loading rescue records...</p>
                                </div>
                            ) : historyReports.length === 0 ? (
                                <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
                                    <span style={{ fontSize: '2.5rem' }}>🐾</span>
                                    <h4 style={{ marginTop: '0.5rem', color: '#0f172a' }}>No Completed Rescues Yet</h4>
                                    <p style={{ maxWidth: '420px', margin: '0.25rem auto' }}>
                                        When you accept emergency rescue calls and mark them completed, your recovery history will appear here.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {historyReports.map((report) => (
                                        <div 
                                            key={report._id} 
                                            className="request-item-card" 
                                            style={{ padding: '1.25rem', gap: '1.25rem', borderLeft: '4px solid #10b981' }}
                                        >
                                            <img 
                                                src={report.imageUrl ? getImageUrl(report.imageUrl) : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=80'} 
                                                alt={report.animalType}
                                                className="rescuer-clickable-img"
                                                style={{ width: '110px', height: '110px', borderRadius: '10px', objectFit: 'cover' }}
                                                onClick={() => setSelectedImage({
                                                    src: report.imageUrl ? getImageUrl(report.imageUrl) : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=80',
                                                    title: `${report.animalType} (Completed Rescue)`,
                                                    subtitle: `Severity: ${report.severity}`
                                                })}
                                                title="Click to view full image"
                                            />
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>{report.animalType}</h4>
                                                    <span className="badge badge-completed">COMPLETED</span>
                                                </div>
                                                <p style={{ margin: '0.35rem 0', color: '#475569', fontSize: '0.9rem' }}>{report.description}</p>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                                                    <span>Severity: <strong>{report.severity}</strong></span>
                                                    {report.completedAt && (
                                                        <span style={{ color: '#10b981', fontWeight: 600 }}>
                                                            ✓ Saved on {new Date(report.completedAt).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* ── TAB 3: STANDARD 3-COLUMN OPERATIONS LAYOUT ── */
                        <div className="rescuer-three-column-grid">
                            
                            {/* ── COLUMN 1: Rescue Controls Card ── */}
                            <div className="forest-card controls-card">
                                <h3 className="card-title">Rescue Controls</h3>

                                {/* Location Section */}
                                <div className="control-section">
                                    <label className="control-label">
                                        Your Current Location
                                        <span className="info-circle" title="Your GPS coordinates are used to detect nearby incidents">ⓘ</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        readOnly 
                                        className="form-input-clean"
                                        placeholder="Not detected yet"
                                        value={rescuerCoords ? `${rescuerCoords.lat.toFixed(4)}, ${rescuerCoords.lng.toFixed(4)}` : (locationStatus || 'Not detected yet')}
                                        style={{ marginBottom: '0.75rem' }}
                                    />

                                    <button 
                                        type="button" 
                                        onClick={handleGetCurrentLocation} 
                                        className="btn btn-forest-solid btn-block"
                                    >
                                        Detect My Location
                                    </button>

                                    <button 
                                        type="button" 
                                        onClick={handleUpdateLocation} 
                                        className="btn btn-forest-outline btn-block"
                                        style={{ marginTop: '0.5rem' }}
                                    >
                                        Save Location
                                    </button>

                                    {locationStatus && (
                                        <p style={{
                                            fontSize: '0.8rem',
                                            color: locationStatus.startsWith('✅') ? '#10b981' : locationStatus.startsWith('❌') ? '#ef4444' : '#64748b',
                                            marginTop: '0.4rem',
                                            textAlign: 'center'
                                        }}>
                                            {locationStatus}
                                        </p>
                                    )}
                                </div>

                                <hr className="card-divider" />

                                {/* Radius Slider (1 km to 10 km strictly) */}
                                <div className="control-section">
                                    <div className="slider-header-row">
                                        <label className="control-label">Rescue Radius</label>
                                        <span className="slider-value-bold">{radiusInput} km</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={radiusInput}
                                        onChange={(e) => setRadiusInput(Number(e.target.value))}
                                        className="forest-range-slider"
                                    />
                                    <div className="slider-limits-row">
                                        <span>1 km</span>
                                        <span>10 km</span>
                                    </div>
                                </div>

                                <hr className="card-divider" />

                                {/* Active Rescues Toggle */}
                                <div className="control-section">
                                    <label className="availability-checkbox-card">
                                        <input
                                            type="checkbox"
                                            checked={isAvailable}
                                            onChange={(e) => setIsAvailable(e.target.checked)}
                                            className="custom-checkbox"
                                        />
                                        <div className="checkbox-text-wrap">
                                            <span className="checkbox-main-label">Ready for Active Rescues</span>
                                            <span className="checkbox-sub-label">You will receive nearby emergency alerts</span>
                                        </div>
                                    </label>
                                </div>

                                <button 
                                    type="button" 
                                    onClick={handleUpdateSettings} 
                                    className="btn btn-forest-solid btn-block"
                                    style={{ marginTop: '1rem' }}
                                >
                                    Save Radius & Availability
                                </button>

                                {settingsStatus && (
                                    <p style={{
                                        fontSize: '0.8rem',
                                        color: settingsStatus.startsWith('✅') ? '#10b981' : '#ef4444',
                                        marginTop: '0.4rem',
                                        textAlign: 'center'
                                    }}>
                                        {settingsStatus}
                                    </p>
                                )}
                            </div>

                            {/* ── COLUMN 2: Extended Center Interactive Map Card ── */}
                            <div className="forest-card map-view-card" style={{ height: '620px', maxHeight: '620px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div className="map-inner-wrapper" style={{ height: '100%', maxHeight: '100%', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                                    <ReportMap
                                        center={activeMapCenter}
                                        reports={nearbyReports}
                                        rescuerLocation={rescuerCoords}
                                        rescueRadius={radiusInput}
                                        zoom={mapZoom}
                                    />
                                </div>
                            </div>

                            {/* ── COLUMN 3: Extended Nearby Pending Requests Card ── */}
                            <div className="rescuer-right-column">
                                <div className="forest-card pending-requests-card" style={{ height: '100%', minHeight: '580px' }}>
                                    <div className="requests-card-header">
                                        <h3 className="card-title" style={{ margin: 0 }}>Nearby Pending Requests</h3>
                                        <button 
                                            type="button" 
                                            className="view-all-link"
                                            onClick={() => setActiveTab('map')}
                                        >
                                            View Map
                                        </button>
                                    </div>

                                    {/* In-Progress Rescues if active */}
                                    {myActiveRescues.length > 0 && (
                                        <div style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e5e9e7' }}>
                                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#10b981', marginBottom: '0.5rem' }}>
                                                🚨 Your Active Rescues ({myActiveRescues.length})
                                            </div>
                                            {myActiveRescues.map(report => (
                                                <div key={report._id} className="request-item-card" style={{ borderLeft: '3px solid #10b981', marginBottom: '0.5rem' }}>
                                                    <img 
                                                        src={report.imageUrl ? getImageUrl(report.imageUrl) : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=80'} 
                                                        alt={report.animalType}
                                                        className="request-thumbnail rescuer-clickable-img"
                                                        onClick={() => setSelectedImage({
                                                            src: report.imageUrl ? getImageUrl(report.imageUrl) : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=80',
                                                            title: `${report.animalType} (In Progress)`,
                                                            subtitle: `Severity: ${report.severity}`
                                                        })}
                                                        title="Click to view full image"
                                                    />
                                                    <div className="request-meta-body">
                                                        <div className="request-top-row">
                                                            <h4 className="request-animal-title">{report.animalType}</h4>
                                                            <span className="badge badge-inprogress" style={{ fontSize: '0.7rem' }}>In Progress</span>
                                                        </div>
                                                        <p className="request-desc" style={{ fontSize: '0.8rem', margin: '0.2rem 0' }}>{report.description}</p>
                                                        <div className="request-actions-row" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                            <button 
                                                                onClick={() => openGoogleMapsNavigation(report)}
                                                                className="btn btn-forest-solid"
                                                                style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                                                                title="Navigate to incident location via Google Maps"
                                                            >
                                                                🧭 Navigate
                                                            </button>
                                                            <button 
                                                                onClick={() => handleAction(report._id, 'complete')}
                                                                className="btn btn-primary"
                                                                style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem', background: '#10b981', borderColor: '#10b981' }}
                                                            >
                                                                ✅ Complete
                                                            </button>
                                                            <button 
                                                                onClick={() => handleFocusOnMap(report)}
                                                                className="btn btn-forest-outline"
                                                                style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                                                            >
                                                                Map
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="requests-list" style={{ overflowY: 'auto', maxHeight: '420px', paddingRight: '0.25rem' }}>
                                        {loading ? (
                                            <div className="loading-state-p">Scanning radar for reports...</div>
                                        ) : pendingNearbyRescues.length === 0 ? (
                                            <div className="empty-requests-msg">
                                                No pending rescue requests within your configured {radiusInput} km radius.
                                            </div>
                                        ) : (
                                            pendingNearbyRescues.map((report) => (
                                                <div key={report._id} className="request-item-card">
                                                    <img 
                                                        src={report.imageUrl ? getImageUrl(report.imageUrl) : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=80'} 
                                                        alt={report.animalType}
                                                        className="request-thumbnail rescuer-clickable-img"
                                                        onClick={() => setSelectedImage({
                                                            src: report.imageUrl ? getImageUrl(report.imageUrl) : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=80',
                                                            title: `${report.animalType} (Pending Request)`,
                                                            subtitle: `Severity: ${report.severity}`
                                                        })}
                                                        title="Click to view full image"
                                                    />
                                                    <div className="request-meta-body">
                                                        <div className="request-top-row">
                                                            <h4 className="request-animal-title">{report.animalType}</h4>
                                                            <span className="distance-label">{getDistanceText(report)}</span>
                                                        </div>
                                                        <div className="request-sub-row">
                                                            <span className="location-pin-sub">📍 Incident Pin</span>
                                                            <span className="time-sub">Pending rescue</span>
                                                        </div>
                                                        <div className="request-badge-row">
                                                            {getSeverityBadge(report.severity)}
                                                        </div>
                                                        <div className="request-actions-row" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                            <button 
                                                                onClick={() => handleAction(report._id, 'accept', report)}
                                                                className="btn btn-forest-solid"
                                                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                                                                title="Accept & navigate via Google Maps"
                                                            >
                                                                Start Rescue
                                                            </button>
                                                            <button 
                                                                onClick={() => openGoogleMapsNavigation(report)}
                                                                className="btn btn-forest-outline"
                                                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                                                                title="Open destination in Google Maps"
                                                            >
                                                                🧭 Navigate
                                                            </button>
                                                            <button 
                                                                onClick={() => handleFocusOnMap(report)}
                                                                className="btn btn-forest-outline"
                                                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                                                            >
                                                                Map
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="requests-footer-msg" style={{ marginTop: 'auto' }}>
                                        Active radar monitoring within {radiusInput} km.
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}
                </main>
            </div>

            <AIChat />

            <ImageModal 
                isOpen={!!selectedImage} 
                onClose={() => setSelectedImage(null)} 
                src={typeof selectedImage === 'string' ? selectedImage : selectedImage?.src} 
                alt="Rescue Animal Full View" 
            />
        </div>
    );
};

export default RescuerDashboard;
