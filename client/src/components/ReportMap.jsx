import { useEffect, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle, InfoWindow } from '@react-google-maps/api';
import { getImageUrl } from '../api/axios';

const containerStyle = {
    width: '100%',
    height: '100%'
};

const ReportMap = ({ 
    center = [20.5937, 78.9629], // [lat, lng]
    zoom = 13, 
    reports = [], 
    rescuerLocation = null, 
    rescueRadius = 5,
    onMapClick = null,
    selectedPosition = null
}) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "" // Add your API key here
    });

    const [map, setMap] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);

    const onLoad = useCallback(function callback(map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map) {
        setMap(null);
    }, []);

    // Effect to pan map when center changes
    useEffect(() => {
        if (map && center && center[0] && center[1]) {
            map.panTo({ lat: center[0], lng: center[1] });
        }
    }, [center, map]);

    const handleMapClick = (e) => {
        if (onMapClick) {
            onMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() });
        }
    };

    if (!isLoaded) return <div>Loading Map...</div>;

    const mapCenter = { lat: center[0], lng: center[1] };

    // Format rescuer location if valid
    const rescuerPos = rescuerLocation && rescuerLocation.lat && rescuerLocation.lng 
        ? { lat: rescuerLocation.lat, lng: rescuerLocation.lng } 
        : null;

    // Format selected position if valid
    const selectedPos = selectedPosition && selectedPosition.lat && selectedPosition.lng 
        ? { lat: selectedPosition.lat, lng: selectedPosition.lng } 
        : null;

    return (
        <div className="map-container">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={mapCenter}
                zoom={zoom}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onClick={handleMapClick}
                options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                }}
            >
                {/* Rescuer position marker and radius circle */}
                {rescuerPos && (
                    <>
                        <Marker 
                            position={rescuerPos} 
                            icon={{
                                url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
                            }}
                            title="Your Location"
                        />
                        <Circle
                            center={rescuerPos}
                            radius={rescueRadius * 1000}
                            options={{
                                strokeColor: '#10B981',
                                strokeOpacity: 0.8,
                                strokeWeight: 2,
                                fillColor: '#10B981',
                                fillOpacity: 0.15,
                            }}
                        />
                    </>
                )}

                {/* Click selected marker */}
                {selectedPos && (
                    <Marker position={selectedPos} />
                )}

                {/* List of animal reports markers */}
                {reports.map((report) => {
                    if (!report.location || !report.location.coordinates || report.location.coordinates.length < 2) {
                        return null;
                    }
                    const [lng, lat] = report.location.coordinates;
                    const pos = { lat, lng };
                    
                    const isSelected = selectedReport && selectedReport._id === report._id;

                    return (
                        <Marker 
                            key={report._id} 
                            position={pos}
                            onClick={() => setSelectedReport(report)}
                        >
                            {isSelected && (
                                <InfoWindow
                                    position={pos}
                                    onCloseClick={() => setSelectedReport(null)}
                                >
                                    <div style={{ maxWidth: '200px' }}>
                                        {report.imageUrl && (
                                            <img 
                                                src={getImageUrl(report.imageUrl)} 
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
                                </InfoWindow>
                            )}
                        </Marker>
                    );
                })}
            </GoogleMap>
        </div>
    );
};

export default ReportMap;
