import { useEffect, useRef, useState, useId } from 'react';
import { getImageUrl } from '../api/axios';

const MAPPLS_API_KEY = import.meta.env.VITE_MAPPLS_API_KEY || '1ff2ca4d8ccd28fe3a821f011ddd3523';

/**
 * Helper to dynamically load the Mappls Map SDK script once
 */
const loadMapplsScript = (apiKey) => {
    return new Promise((resolve, reject) => {
        if (window.mappls && window.mappls.Map) {
            resolve(window.mappls);
            return;
        }

        const existingScript = document.getElementById('mappls-sdk-script');
        if (existingScript) {
            existingScript.addEventListener('load', () => resolve(window.mappls));
            existingScript.addEventListener('error', (e) => reject(e));
            return;
        }

        const script = document.createElement('script');
        script.id = 'mappls-sdk-script';
        script.src = `https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk?layer=vector&v=3.0`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            if (window.mappls) {
                resolve(window.mappls);
            } else {
                reject(new Error('Mappls SDK loaded but window.mappls is undefined'));
            }
        };
        script.onerror = (err) => reject(err);
        document.head.appendChild(script);
    });
};

const ReportMap = ({ 
    center = null, // [lat, lng]
    zoom = 13, 
    reports = [], 
    rescuerLocation = null, 
    rescueRadius = 5,
    onMapClick = null,
    selectedPosition = null
}) => {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const circleRef = useRef(null);
    const selectedMarkerRef = useRef(null);
    const rescuerMarkerRef = useRef(null);
    const lastCenterRef = useRef({ lat: 0, lng: 0, zoom: 0 });
    const prevReportsHashRef = useRef('');

    const rawId = useId();
    const uniqueMapId = useRef(`mappls-map-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`).current;
    
    const [isLoaded, setIsLoaded] = useState(false);
    const [loadError, setLoadError] = useState(null);

    // ── 1. Load Mappls SDK ──────────────────────────────────────────────────
    useEffect(() => {
        let isMounted = true;
        loadMapplsScript(MAPPLS_API_KEY)
            .then(() => {
                if (isMounted) setIsLoaded(true);
            })
            .catch((err) => {
                console.error('Failed to load Mappls SDK:', err);
                if (isMounted) setLoadError(err.message || 'Error loading Mappls SDK');
            });

        return () => {
            isMounted = false;
        };
    }, []);

    // Helper to safely pan/center map across different Mappls SDK versions
    const safelySetCenter = (lat, lng, targetZoom = null) => {
        if (!mapInstanceRef.current) return;
        const numLat = Number(lat);
        const numLng = Number(lng);
        if (isNaN(numLat) || isNaN(numLng) || (Math.abs(numLat) < 0.1 && Math.abs(numLng) < 0.1)) return;

        try {
            if (typeof mapInstanceRef.current.setCenter === 'function') {
                mapInstanceRef.current.setCenter({ lat: numLat, lng: numLng });
            } else if (typeof mapInstanceRef.current.panTo === 'function') {
                mapInstanceRef.current.panTo({ lat: numLat, lng: numLng });
            }
        } catch {
            try {
                mapInstanceRef.current.panTo({ lat: numLat, lng: numLng });
            } catch {
                try {
                    mapInstanceRef.current.setCenter([numLat, numLng]);
                } catch {}
            }
        }

        if (targetZoom && typeof mapInstanceRef.current.setZoom === 'function') {
            try {
                mapInstanceRef.current.setZoom(Number(targetZoom));
            } catch {}
        }
    };

    // ── 2. Initialize Map Instance ──────────────────────────────────────────
    useEffect(() => {
        if (!isLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

        try {
            // Clean container DOM to guarantee fresh canvas
            mapContainerRef.current.innerHTML = '';

            let initialLat = 26.8500;
            let initialLng = 75.8000;

            if (rescuerLocation && rescuerLocation.lat && rescuerLocation.lng && Math.abs(Number(rescuerLocation.lat)) > 0.1) {
                initialLat = Number(rescuerLocation.lat);
                initialLng = Number(rescuerLocation.lng);
            } else if (selectedPosition && selectedPosition.lat && selectedPosition.lng && Math.abs(Number(selectedPosition.lat)) > 0.1) {
                initialLat = Number(selectedPosition.lat);
                initialLng = Number(selectedPosition.lng);
            } else if (center && center[0] && center[1] && Math.abs(Number(center[0])) > 0.1) {
                initialLat = Number(center[0]);
                initialLng = Number(center[1]);
            }

            const map = new window.mappls.Map(mapContainerRef.current, {
                center: { lat: initialLat, lng: initialLng },
                zoom: zoom || 13,
                zoomControl: true,
                location: false,
                scaleControl: true
            });

            map.addListener('load', () => {
                safelySetCenter(initialLat, initialLng, zoom || 13);
                try {
                    if (typeof map.resize === 'function') {
                        map.resize();
                    }
                } catch {}
            });

            // Handle Map Click
            map.addListener('click', (e) => {
                const lat = e.lngLat?.lat ?? e.latLng?.lat ?? (Array.isArray(e.lngLat) ? e.lngLat[1] : null);
                const lng = e.lngLat?.lng ?? e.latLng?.lng ?? (Array.isArray(e.lngLat) ? e.lngLat[0] : null);
                
                if (lat != null && lng != null && onMapClick) {
                    onMapClick({ lat: Number(lat), lng: Number(lng) });
                }
            });

            mapInstanceRef.current = map;
        } catch (err) {
            console.error('Error initializing Mappls Map:', err);
        }

        return () => {
            if (mapInstanceRef.current) {
                try {
                    if (typeof mapInstanceRef.current.remove === 'function') {
                        mapInstanceRef.current.remove();
                    }
                } catch (e) {
                    console.warn('Map cleanup error:', e);
                }
                mapInstanceRef.current = null;
            }
        };
    }, [isLoaded]);

    // ── 3. ResizeObserver: Keep map canvas responsive and prevent white container
    useEffect(() => {
        if (!mapInstanceRef.current) return;
        const map = mapInstanceRef.current;

        const resizeTimer = setTimeout(() => {
            try {
                if (map && typeof map.resize === 'function') {
                    map.resize();
                }
            } catch {}
        }, 200);

        let ro = null;
        if (window.ResizeObserver && mapContainerRef.current) {
            ro = new ResizeObserver(() => {
                try {
                    if (map && typeof map.resize === 'function') {
                        map.resize();
                    }
                } catch {}
            });
            ro.observe(mapContainerRef.current);
        }

        return () => {
            clearTimeout(resizeTimer);
            if (ro) ro.disconnect();
        };
    }, [isLoaded]);

    // ── 4. Smooth Center / Zoom without flicker ─────────────────────────────
    useEffect(() => {
        if (!mapInstanceRef.current || !center || !center[0] || !center[1]) return;
        const numLat = Number(center[0]);
        const numLng = Number(center[1]);
        if (isNaN(numLat) || isNaN(numLng) || (Math.abs(numLat) < 0.1 && Math.abs(numLng) < 0.1)) return;

        // Only pan if coordinates actually changed
        if (
            Math.abs(lastCenterRef.current.lat - numLat) > 0.0001 ||
            Math.abs(lastCenterRef.current.lng - numLng) > 0.0001 ||
            lastCenterRef.current.zoom !== zoom
        ) {
            lastCenterRef.current = { lat: numLat, lng: numLng, zoom };
            safelySetCenter(numLat, numLng, zoom);
        }
    }, [center?.[0], center?.[1], zoom]);

    // ── 5. Stable Rescuer Marker and Radius Circle Update ───────────────────
    useEffect(() => {
        if (!mapInstanceRef.current || !window.mappls) return;
        const map = mapInstanceRef.current;

        if (!rescuerLocation || !rescuerLocation.lat || !rescuerLocation.lng) return;

        const numLat = Number(rescuerLocation.lat);
        const numLng = Number(rescuerLocation.lng);
        if (Math.abs(numLat) < 0.1 && Math.abs(numLng) < 0.1) return;
        const pos = { lat: numLat, lng: numLng };
        const targetRadius = (Number(rescueRadius) || 5) * 1000;

        // 1. Update existing marker or create once
        if (rescuerMarkerRef.current) {
            try {
                if (typeof rescuerMarkerRef.current.setPosition === 'function') {
                    rescuerMarkerRef.current.setPosition(pos);
                }
            } catch {}
        } else {
            try {
                rescuerMarkerRef.current = new window.mappls.Marker({
                    map: map,
                    position: pos,
                    fitbounds: false,
                    popupHtml: '<div style="padding:4px; font-weight:bold; color:#10B981;">Your Location</div>'
                });
            } catch (err) {
                console.warn('Rescuer marker creation error:', err);
            }
        }

        // 2. Update existing circle or create once
        if (circleRef.current) {
            try {
                let updated = false;
                if (typeof circleRef.current.setCenter === 'function') {
                    circleRef.current.setCenter(pos);
                    updated = true;
                }
                if (typeof circleRef.current.setRadius === 'function') {
                    circleRef.current.setRadius(targetRadius);
                    updated = true;
                }
                if (!updated) {
                    try {
                        if (typeof circleRef.current.remove === 'function') circleRef.current.remove();
                        else if (window.mappls.remove) window.mappls.remove({ map, layer: circleRef.current });
                    } catch {}
                    circleRef.current = new window.mappls.Circle({
                        map: map,
                        center: pos,
                        radius: targetRadius,
                        fillColor: '#10B981',
                        fillOpacity: 0.15,
                        strokeColor: '#10B981',
                        strokeOpacity: 0.8,
                        strokeWeight: 2
                    });
                }
            } catch {}
        } else if (window.mappls.Circle) {
            try {
                circleRef.current = new window.mappls.Circle({
                    map: map,
                    center: pos,
                    radius: targetRadius,
                    fillColor: '#10B981',
                    fillOpacity: 0.15,
                    strokeColor: '#10B981',
                    strokeOpacity: 0.8,
                    strokeWeight: 2
                });
            } catch (err) {
                console.warn('Rescuer circle creation error:', err);
            }
        }
    }, [rescuerLocation?.lat, rescuerLocation?.lng, rescueRadius, isLoaded]);

    // ── 6. Selected Position Marker ─────────────────────────────────────────
    useEffect(() => {
        if (!mapInstanceRef.current || !window.mappls) return;
        const map = mapInstanceRef.current;

        if (!selectedPosition || !selectedPosition.lat || !selectedPosition.lng) {
            if (selectedMarkerRef.current) {
                try {
                    if (typeof selectedMarkerRef.current.remove === 'function') selectedMarkerRef.current.remove();
                    else if (window.mappls.remove) window.mappls.remove({ map, layer: selectedMarkerRef.current });
                } catch {}
                selectedMarkerRef.current = null;
            }
            return;
        }

        const numLat = Number(selectedPosition.lat);
        const numLng = Number(selectedPosition.lng);
        if (Math.abs(numLat) < 0.1 && Math.abs(numLng) < 0.1) return;
        const pos = { lat: numLat, lng: numLng };

        safelySetCenter(numLat, numLng, 14);

        if (selectedMarkerRef.current) {
            try {
                if (typeof selectedMarkerRef.current.setPosition === 'function') {
                    selectedMarkerRef.current.setPosition(pos);
                }
            } catch {}
        } else {
            try {
                selectedMarkerRef.current = new window.mappls.Marker({
                    map: map,
                    position: pos,
                    fitbounds: false,
                    popupHtml: '<div style="padding:4px; font-weight:600; color:#EF4444;">Selected Incident Location</div>'
                });
            } catch (err) {
                console.warn('Selected marker creation error:', err);
            }
        }
    }, [selectedPosition?.lat, selectedPosition?.lng, isLoaded]);

    // ── 7. Stable Animal Report Markers Update ──────────────────────────────
    useEffect(() => {
        if (!mapInstanceRef.current || !window.mappls) return;
        const map = mapInstanceRef.current;

        // Compare reports fingerprint to avoid clearing and re-rendering on unrelated state changes
        const reportsHash = reports.map(r => `${r._id}:${r.status}:${r.location?.coordinates?.[0]},${r.location?.coordinates?.[1]}`).join('|');
        if (prevReportsHashRef.current === reportsHash && markersRef.current.length > 0) {
            return;
        }
        prevReportsHashRef.current = reportsHash;

        // Clear existing markers cleanly
        markersRef.current.forEach(m => {
            try {
                if (typeof m.remove === 'function') m.remove();
                else if (window.mappls.remove) window.mappls.remove({ map, layer: m });
            } catch {}
        });
        markersRef.current = [];

        reports.forEach((report) => {
            if (!report.location?.coordinates || report.location.coordinates.length < 2) return;
            const [lng, lat] = report.location.coordinates;
            if (!lat || !lng) return;

            const imgHtml = report.imageUrl 
                ? `<img src="${getImageUrl(report.imageUrl)}" alt="${report.animalType}" style="width:100%; height:90px; object-fit:cover; border-radius:6px; margin-bottom:6px;" />` 
                : '';

            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

            const popupContent = `
                <div style="font-family:sans-serif; min-width:190px; max-width:230px; color:#1E293B; font-size:12px; line-height:1.4; padding:2px;">
                    ${imgHtml}
                    <div style="font-size:14px; font-weight:700; color:#0F172A;">${report.animalType || 'Animal'}</div>
                    <div style="margin:2px 0;"><span style="color:#64748B;">Severity:</span> <strong style="color:${report.severity === 'CRITICAL' ? '#EF4444' : '#F59E0B'};">${report.severity}</strong></div>
                    <div style="margin:2px 0;"><span style="color:#64748B;">Status:</span> <strong style="color:#133b2e;">${report.status}</strong></div>
                    <p style="margin:4px 0 0 0; color:#475569; font-size:11px;">${report.description || ''}</p>
                    <div style="margin-top:8px;">
                        <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="display:block; text-align:center; padding:6px 10px; background:#133b2e; color:#ffffff; font-size:11px; font-weight:600; text-decoration:none; border-radius:6px;">
                            Navigate in Google Maps
                        </a>
                    </div>
                </div>
            `;

            try {
                const marker = new window.mappls.Marker({
                    map: map,
                    position: { lat: Number(lat), lng: Number(lng) },
                    fitbounds: false,
                    popupHtml: popupContent
                });
                markersRef.current.push(marker);
            } catch (err) {
                console.error('Error creating report marker on Mappls:', err);
            }
        });
    }, [reports, isLoaded]);

    if (loadError) {
        return (
            <div className="map-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', minHeight: '380px', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                <p style={{ fontWeight: 600, color: '#ef4444', marginBottom: '0.5rem' }}>Failed to load Mappls Map</p>
                <p style={{ fontSize: '0.85rem' }}>{loadError}</p>
            </div>
        );
    }

    return (
        <div className="map-container" style={{ position: 'relative', width: '100%', height: '100%', minHeight: '380px' }}>
            {!isLoaded && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', zIndex: 10, borderRadius: '12px', color: '#64748b', fontWeight: 500 }}>
                    <span>Loading Mappls Map...</span>
                </div>
            )}
            <div 
                ref={mapContainerRef} 
                id={uniqueMapId}
                style={{ width: '100%', height: '100%', minHeight: '380px', borderRadius: '12px' }} 
            />
        </div>
    );
};

export default ReportMap;
