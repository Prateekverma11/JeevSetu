import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ReportMap from '../components/ReportMap';
import { getGeolocationPromise, readFileAsDataURLPromise, evaluateReportWithHoisting } from '../utils';

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
    const [position, setPosition] = useState(null); // {lat, lng}
    const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            try {
                const previewUrl = await readFileAsDataURLPromise(file);
                setImagePreview(previewUrl);
            } catch {
                setImagePreview(URL.createObjectURL(file));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!position) {
            setError('Please click on the map to set the location.');
            return;
        }

        // Hoisting concept: evaluateReportWithHoisting uses hoisted function declarations
        // internally (calculateRescuePriority, getUrgencyLabel, formatRescueSummary)
        // to compute a priority score and urgency label before sending to the server.
        const evaluated = evaluateReportWithHoisting({
            animalType: formData.animalType,
            severity: formData.severity,
            status: 'PENDING',
            location: { coordinates: [position.lng, position.lat] },
        });
        console.info('[ReportForm] Hoisting evaluation:', evaluated.urgencyLabel, `(score: ${evaluated.priorityScore})`); 

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

    const handleGetCurrentLocation = async () => {
        try {
            setError('');
            const coords = await getGeolocationPromise({ enableHighAccuracy: true, timeout: 10000 });
            const pos = { lat: coords.latitude, lng: coords.longitude };
            setPosition(pos);
            setMapCenter([pos.lat, pos.lng]);
        } catch (err) {
            setError(err.message || 'Unable to retrieve location. Please check browser permissions.');
        }
    };

    return (
        <>
            <Navbar />
            <div className="container animate-fade-in">
                <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '800px', margin: '0 auto' }}>
                    <h2>🚨 Report an Injured Animal</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        Provide details and drop a pin on the map to alert rescuers near you immediately.
                    </p>
                    
                    {error && (
                        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', color: '#FCA5A5', marginBottom: '1.5rem' }}>
                            ⚠️ {error}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label>Animal Type</label>
                                <select 
                                    name="animalType" 
                                    className="form-control" 
                                    value={formData.animalType} 
                                    onChange={handleChange}
                                >
                                    <option value="Dog">🐶 Dog</option>
                                    <option value="Cat">🐱 Cat</option>
                                    <option value="Bird">🐦 Bird</option>
                                    <option value="Cow">🐄 Cow</option>
                                    <option value="Horse">🐴 Horse</option>
                                    <option value="Other">🐾 Other</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Severity Level</label>
                                <select 
                                    name="severity" 
                                    className="form-control" 
                                    value={formData.severity} 
                                    onChange={handleChange}
                                >
                                    <option value="LOW">🟢 Low (Minor injury/stray)</option>
                                    <option value="MEDIUM">🟡 Medium (Needs care soon)</option>
                                    <option value="HIGH">🟠 High (Bleeding/Severe)</option>
                                    <option value="CRITICAL">🔴 Critical (Immediate Action)</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Description & Observed Injuries</label>
                            <textarea 
                                name="description" 
                                className="form-control" 
                                rows="3"
                                placeholder="Describe the animal, visible injuries, behavior, or nearby landmarks..."
                                value={formData.description} 
                                onChange={handleChange}
                                required
                            ></textarea>
                        </div>

                        <div className="form-group">
                            <label>Animal Photograph (Optional but Recommended)</label>
                            <input 
                                type="file" 
                                className="form-control" 
                                accept="image/png, image/jpeg, image/webp"
                                onChange={handleImageChange}
                            />
                            {imagePreview && (
                                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                    <img 
                                        src={imagePreview} 
                                        alt="Preview" 
                                        style={{ maxHeight: '200px', borderRadius: '8px', border: '1px solid var(--glass-border)' }} 
                                    />
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label style={{ margin: 0 }}>Pin Incident Location</label>
                                <button 
                                    type="button" 
                                    onClick={handleGetCurrentLocation} 
                                    className="btn btn-secondary" 
                                    style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}
                                >
                                    📍 Use My GPS Location
                                </button>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                                Click anywhere on the map to set the precise location pin.
                            </p>
                            
                            <ReportMap 
                                center={mapCenter} 
                                zoom={14} 
                                onMapClick={(latlng) => setPosition(latlng)} 
                                selectedPosition={position}
                            />

                            {position && (
                                <p style={{ fontSize: '0.9rem', color: 'var(--secondary)', marginTop: '0.75rem', fontWeight: '600' }}>
                                    ✅ Selected Coords: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
                                </p>
                            )}
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary btn-block" 
                            style={{ padding: '0.85rem', fontSize: '1rem', marginTop: '1.5rem' }}
                            disabled={loading}
                        >
                            {loading ? 'Submitting Incident Report...' : '🚨 Broadcast Emergency Rescue Report'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default ReportForm;
