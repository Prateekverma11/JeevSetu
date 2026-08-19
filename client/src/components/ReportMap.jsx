import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import { getImageUrl } from '../api/axios';

// Leaflet icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

// Custom icon for Rescuer location
const rescuerIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Helper component to auto-recenter map when center prop updates
const RecenterMap = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center && center[0] && center[1]) {
            map.flyTo(center, map.getZoom(), { animate: true });
        }
    }, [center, map]);
    return null;
};

const ReportMap = ({ 
    center = [20.5937, 78.9629], // Default fallback (India center or standard coords)
    zoom = 13, 
    reports = [], 
    rescuerLocation = null, 
    rescueRadius = 5,
    onMapClick = null,
    selectedPosition = null
}) => {
    // Map event handler component for manual click selection
    const MapEvents = () => {
        const map = useMap();
        useEffect(() => {
            if (!onMapClick) return;
            const handleClick = (e) => {
                onMapClick(e.latlng);
            };
            map.on('click', handleClick);
            return () => map.off('click', handleClick);
        }, [map]);
        return null;
    };

    return (
        <div className="map-container">
            <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                <RecenterMap center={center} />
                {onMapClick && <MapEvents />}

                {/* Rescuer position marker and radius circle */}
                {rescuerLocation && rescuerLocation.lat && rescuerLocation.lng && (
                    <>
                        <Marker position={[rescuerLocation.lat, rescuerLocation.lng]} icon={rescuerIcon}>
                            <Popup>
                                <strong>Your Location</strong>
                                <br />
                                Rescue Radius: {rescueRadius} km
                            </Popup>
                        </Marker>
                        <Circle
                            center={[rescuerLocation.lat, rescuerLocation.lng]}
                            radius={rescueRadius * 1000}
                            pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.15 }}
                        />
                    </>
                )}

                {/* Click selected marker */}
                {selectedPosition && selectedPosition.lat && selectedPosition.lng && (
                    <Marker position={[selectedPosition.lat, selectedPosition.lng]}>
                        <Popup>Selected Location</Popup>
                    </Marker>
                )}

                {/* List of animal reports markers */}
                {reports.map((report) => {
                    if (!report.location || !report.location.coordinates || report.location.coordinates.length < 2) {
                        return null;
                    }
                    const [lng, lat] = report.location.coordinates;
                    const imgUrl = getImageUrl(report.imageUrl);

                    return (
                        <Marker key={report._id} position={[lat, lng]}>
                            <Popup>
                                <div style={{ maxWidth: '200px' }}>
                                    {imgUrl && (
                                        <img 
                                            src={imgUrl} 
                                            alt={report.animalType} 
                                            style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px', marginBottom: '0.5rem' }} 
                                        />
                                    )}
                                    <strong style={{ fontSize: '1rem', color: '#1E293B' }}>{report.animalType}</strong>
                                    <br />
                                    <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Severity: {report.severity}</span>
                                    <br />
                                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#4F46E5' }}>Status: {report.status}</span>
                                    <p style={{ fontSize: '0.8rem', margin: '0.25rem 0 0 0', color: '#334155' }}>{report.description}</p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default ReportMap;
