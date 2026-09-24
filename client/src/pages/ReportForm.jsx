import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';
import ReportMap from '../components/ReportMap';
import AIChat from '../components/AIChat';
import ImageModal from '../components/ImageModal';

const ReportForm = () => {
    useContext(AuthContext);
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        animalType: 'Dog',
        description: '',
        severity: 'MEDIUM'
    });
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [position, setPosition] = useState(null); // {lat, lng}
    const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!position) {
            setError('Please click on the map to set the incident location.');
            return;
        }

        const data = new FormData();
        data.append('animalType', formData.animalType);
        data.append('description', formData.description);
        data.append('severity', formData.severity);
        data.append('latitude', position.lat);
        data.append('longitude', position.lng);
        if (image) {
            data.append('image', image);
        }

        try {
            setLoading(true);
            setError('');
            await api.post('/api/reports', data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            navigate('/dashboard');
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors && data.errors.length > 0) {
                setError(data.errors.map(e => e.message).join(' | '));
            } else {
                setError(data?.message || 'Failed to submit report');
            }
            setLoading(false);
        }
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            return;
        }
        setError('');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setPosition(newPos);
                setMapCenter([newPos.lat, newPos.lng]);
            },
            () => {
                setError('Unable to retrieve location. Please check browser permissions.');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    return (
        <div className="dashboard-layout-container">
            <Sidebar activeTab="report" />

            <div className="dashboard-main-panel">
                <TopHeader />

                <main className="dashboard-content-body">
                    {/* Aligned Header Banner */}
                    <div className="dashboard-title-banner">
                        <div className="banner-category">EMERGENCY DISPATCH</div>
                        <h1 className="banner-main-title">Report an Injured Animal</h1>
                        <p className="banner-subtitle">
                            Provide details, upload a photo, and set the map pin to alert nearby verified rescuers immediately.
                        </p>
                    </div>

                    <div className="forest-card report-form-card" style={{ maxWidth: '850px', padding: '2rem' }}>
                        {error && (
                            <div style={{ color: '#ef4444', marginBottom: '1.25rem', padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {/* Animal Type */}
                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label className="control-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                                    Animal Type <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <select 
                                    name="animalType" 
                                    value={formData.animalType} 
                                    onChange={handleChange}
                                    className="form-input-clean"
                                    required
                                >
                                    <option value="Dog">🐕 Dog</option>
                                    <option value="Cat">🐈 Cat</option>
                                    <option value="Bird">🐦 Bird</option>
                                    <option value="Cow">🐄 Cow</option>
                                    <option value="Horse">🐎 Horse</option>
                                    <option value="Other">🐾 Other</option>
                                </select>
                            </div>

                            {/* Severity Selector */}
                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label className="control-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                                    Incident Severity <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                                    {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((sev) => (
                                        <button
                                            key={sev}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, severity: sev })}
                                            className={`severity-chip severity-chip-${sev.toLowerCase()} ${formData.severity === sev ? 'active' : ''}`}
                                        >
                                            {sev}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label className="control-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                                    Description of Injury & Landmark <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <textarea 
                                    name="description" 
                                    value={formData.description} 
                                    onChange={handleChange}
                                    className="form-input-clean"
                                    rows="3"
                                    placeholder="E.g., Limping, injured near the main market bus stop..."
                                    required
                                />
                            </div>

                            {/* Photo Upload */}
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="control-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                                    Upload Photo of Injured Animal (Recommended)
                                </label>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleImageChange}
                                    className="form-input-clean"
                                    style={{ padding: '0.5rem' }}
                                />
                                {imagePreview && (
                                    <div style={{ marginTop: '0.75rem' }}>
                                        <img 
                                            src={imagePreview} 
                                            alt="Preview" 
                                            className="rescuer-clickable-img"
                                            style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }} 
                                            onClick={() => setSelectedImage({
                                                src: imagePreview,
                                                title: `${formData.animalType} (Uploaded Photo Preview)`,
                                                subtitle: `Severity: ${formData.severity}`
                                            })}
                                            title="Click to view full size"
                                        />
                                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0 0' }}>🔍 Click image to enlarge</p>
                                    </div>
                                )}
                            </div>

                            {/* Map Location Picker */}
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label className="control-label">
                                        Pin Incident Location <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <button 
                                        type="button" 
                                        onClick={handleGetCurrentLocation} 
                                        className="btn btn-forest-outline" 
                                        style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}
                                    >
                                        Use My GPS Location
                                    </button>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem' }}>
                                    Click anywhere on the map below to drop the exact incident coordinates.
                                </p>
                                
                                <div style={{ height: '320px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                    <ReportMap 
                                        center={mapCenter} 
                                        zoom={14} 
                                        onMapClick={(latlng) => setPosition(latlng)} 
                                        selectedPosition={position}
                                    />
                                </div>

                                {position && (
                                    <p style={{ fontSize: '0.9rem', color: '#10b981', marginTop: '0.75rem', fontWeight: '600' }}>
                                        Selected Coords: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
                                    </p>
                                )}
                            </div>

                            <button 
                                type="submit" 
                                className="btn btn-forest-solid btn-block" 
                                style={{ padding: '0.85rem', fontSize: '1rem', marginTop: '1.5rem' }}
                                disabled={loading}
                            >
                                {loading ? 'Submitting Incident Report...' : 'Broadcast Emergency Rescue Report'}
                            </button>
                        </form>
                    </div>
                </main>
            </div>

            <AIChat />

            <ImageModal 
                isOpen={!!selectedImage} 
                onClose={() => setSelectedImage(null)} 
                src={typeof selectedImage === 'string' ? selectedImage : selectedImage?.src} 
                alt="Upload Preview Full View" 
            />
        </div>
    );
};

export default ReportForm;
