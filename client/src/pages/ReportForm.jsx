import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

const LocationMarker = ({ setPosition, position }) => {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
};

const ReportForm = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        animalType: 'Dog',
        description: '',
        severity: 'MEDIUM'
    });
    const [image, setImage] = useState(null);
    const [position, setPosition] = useState(null); // {lat, lng}
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!position) {
            setError('Please select a location on the map');
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
            await axios.post('http://localhost:5000/api/reports', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${user.token}`
                }
            });
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit report');
            setLoading(false);
        }
    };

    const handleGetCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPosition({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    });
                },
                (err) => {
                    setError('Unable to retrieve your location');
                }
            );
        } else {
            setError('Geolocation is not supported by your browser');
        }
    };

    return (
        <>
            <Navbar />
            <div className="container animate-fade-in">
                <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                    <h2>Report an Injured Animal</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Please provide accurate details to help rescuers act quickly.</p>
                    
                    {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}
                    
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Animal Type</label>
                            <select 
                                name="animalType" 
                                className="form-control" 
                                value={formData.animalType} 
                                onChange={handleChange}
                            >
                                <option value="Dog">Dog</option>
                                <option value="Cat">Cat</option>
                                <option value="Bird">Bird</option>
                                <option value="Cow">Cow</option>
                                <option value="Horse">Horse</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea 
                                name="description" 
                                className="form-control" 
                                rows="3"
                                placeholder="Describe the animal and its condition"
                                value={formData.description} 
                                onChange={handleChange}
                                required
                            ></textarea>
                        </div>

                        <div className="form-group">
                            <label>Severity</label>
                            <select 
                                name="severity" 
                                className="form-control" 
                                value={formData.severity} 
                                onChange={handleChange}
                            >
                                <option value="LOW">Low (Minor injury/stray)</option>
                                <option value="MEDIUM">Medium (Needs medical attention soon)</option>
                                <option value="HIGH">High (Severe injury, bleeding)</option>
                                <option value="CRITICAL">Critical (Life-threatening, immediate action required)</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Animal Photo</label>
                            <input 
                                type="file" 
                                className="form-control" 
                                accept="image/png, image/jpeg, image/webp"
                                onChange={(e) => setImage(e.target.files[0])}
                            />
                        </div>

                        <div className="form-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label>Location</label>
                                <button type="button" onClick={handleGetCurrentLocation} className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                    Use My Location
                                </button>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Click on the map to set the exact location.</p>
                            <div className="map-container">
                                <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    />
                                    <LocationMarker position={position} setPosition={setPosition} />
                                </MapContainer>
                            </div>
                            {position && (
                                <p style={{ fontSize: '0.875rem', color: 'var(--secondary)', marginTop: '0.5rem' }}>
                                    Selected Location: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
                                </p>
                            )}
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default ReportForm;
