import { useState, useEffect, useContext } from 'react';
import api, { getImageUrl } from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import AIChat from '../components/AIChat';
import ReportMap from '../components/ReportMap';
import { Link } from 'react-router-dom';

const CitizenDashboard = () => {
    const { user } = useContext(AuthContext);
    const { socket } = useContext(SocketContext);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'

    useEffect(() => {
        fetchReports();
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on('rescue_status_update', (data) => {
                setReports(prevReports => 
                    prevReports.map(report => 
                        report._id === data.report._id ? data.report : report
                    )
                );
            });
        }
        return () => {
            if (socket) {
                socket.off('rescue_status_update');
            }
        };
    }, [socket]);

    const fetchReports = async () => {
        try {
            const res = await api.get('/api/reports');
            setReports(res.data);
        } catch (error) {
            console.error('Failed to fetch reports', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'PENDING': 'badge-pending',
            'NOTIFIED': 'badge-notified',
            'ACCEPTED': 'badge-accepted',
            'IN_PROGRESS': 'badge-inprogress',
            'COMPLETED': 'badge-completed',
            'DECLINED': 'badge-pending',
            'CANCELLED': 'badge-pending'
        };
        return `badge ${statusMap[status] || 'badge-pending'}`;
    };

    const getStatusTimeline = (currentStatus) => {
        const steps = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];
        const currentIndex = steps.indexOf(currentStatus);
        
        return (
            <div className="status-timeline">
                {steps.map((step, idx) => {
                    const isPassed = idx <= currentIndex || (currentStatus === 'NOTIFIED' && idx === 0);
                    const isCurrent = step === currentStatus || (currentStatus === 'NOTIFIED' && idx === 0);

                    return (
                        <div key={step} className={`timeline-step ${isPassed ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}>
                            <div className="step-circle">{idx + 1}</div>
                            <span className="step-label">{step.replace('_', ' ')}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Calculate map center from first report with valid location if available
    const firstReportWithLocation = reports.find(r => r.location?.coordinates?.length >= 2);
    const mapCenter = firstReportWithLocation 
        ? [firstReportWithLocation.location.coordinates[1], firstReportWithLocation.location.coordinates[0]]
        : [20.5937, 78.9629];

    return (
        <>
            <Navbar />
            <div className="container animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h2>Citizen Dashboard</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Track and manage your submitted animal rescue reports in real-time.</p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <button 
                            className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setViewMode('grid')}
                        >
                            📋 Card View
                        </button>
                        <button 
                            className={`btn ${viewMode === 'map' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setViewMode('map')}
                        >
                            🗺️ Map View
                        </button>
                        <Link to="/report" className="btn btn-primary">
                            + Report Animal
                        </Link>
                    </div>
                </div>

                <div style={{ marginTop: '2rem' }}>
                    {loading ? (
                        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                            <p>Loading your rescue reports...</p>
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                            <span style={{ fontSize: '3rem' }}>🐾</span>
                            <h3 style={{ marginTop: '1rem' }}>No Reports Submitted Yet</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                Have you found an injured or distressed animal? Submit a report now to notify nearby rescuers instantly.
                            </p>
                            <Link to="/report" className="btn btn-primary">
                                Submit Animal Report
                            </Link>
                        </div>
                    ) : viewMode === 'map' ? (
                        <div className="glass-panel" style={{ padding: '1rem' }}>
                            <ReportMap center={mapCenter} reports={reports} zoom={12} />
                        </div>
                    ) : (
                        <div className="dashboard-grid">
                            {reports.map((report) => (
                                <div key={report._id} className="glass-panel report-card">
                                    {report.imageUrl && (
                                        <img src={getImageUrl(report.imageUrl)} alt={report.animalType} />
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4>{report.animalType}</h4>
                                        <span className={getStatusBadge(report.status)}>{report.status.replace('_', ' ')}</span>
                                    </div>
                                    <p style={{ color: 'var(--text-muted)' }}>
                                        <strong>Severity:</strong> <span className={`severity-tag severity-${report.severity.toLowerCase()}`}>{report.severity}</span>
                                    </p>
                                    <p>{report.description}</p>
                                    
                                    {getStatusTimeline(report.status)}

                                    <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        <span>Reported: {new Date(report.createdAt).toLocaleDateString()}</span>
                                        {report.location?.coordinates && (
                                            <span>📍 {report.location.coordinates[1].toFixed(4)}, {report.location.coordinates[0].toFixed(4)}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            <AIChat />
        </>
    );
};

export default CitizenDashboard;
