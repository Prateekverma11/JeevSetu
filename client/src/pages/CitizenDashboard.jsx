import { useState, useEffect, useContext, useMemo } from 'react';
import api, { getImageUrl } from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';
import AIChat from '../components/AIChat';
import ImageModal from '../components/ImageModal';
import { Link } from 'react-router-dom';

const CitizenDashboard = () => {
    useContext(AuthContext);
    const { socket } = useContext(SocketContext);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        fetchReports();
    }, []);

    useEffect(() => {
        if (socket) {
            const handleStatusUpdate = (data) => {
                if (!data?.report) return;
                setReports((prev) => 
                    prev.map((r) => (r._id === data.report._id ? data.report : r))
                );
            };

            socket.on('rescue_status_update', handleStatusUpdate);
            return () => {
                socket.off('rescue_status_update', handleStatusUpdate);
            };
        }
    }, [socket]);

    const fetchReports = async () => {
        try {
            const res = await api.get('/api/reports');
            setReports(res.data.data || []);
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
                    const isStepFinished = isPassed && (step === 'COMPLETED' || idx < currentIndex);

                    return (
                        <div key={step} className={`timeline-step ${isPassed ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}>
                            <div className="step-circle">
                                {isStepFinished ? (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                ) : (
                                    idx + 1
                                )}
                            </div>
                            <span className="step-label">{step.replace('_', ' ')}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Filter reports by search
    const filteredReports = useMemo(() => {
        if (!searchQuery.trim()) return reports;
        const q = searchQuery.toLowerCase();
        return reports.filter(r => 
            (r.animalType && r.animalType.toLowerCase().includes(q)) ||
            (r.description && r.description.toLowerCase().includes(q)) ||
            (r.status && r.status.toLowerCase().includes(q)) ||
            (r.severity && r.severity.toLowerCase().includes(q))
        );
    }, [reports, searchQuery]);

    return (
        <div className="dashboard-layout-container">
            <Sidebar activeTab="my-reports" />

            <div className="dashboard-main-panel">
                <TopHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

                <main className="dashboard-content-body">
                    {/* Clean Aligned Title Banner */}
                    <div className="dashboard-title-banner">
                        <div className="banner-category">CITIZEN PORTAL</div>
                        <h1 className="banner-main-title">Citizen Incident Tracking</h1>
                        <p className="banner-subtitle">
                            Track the real-time rescue status of injured animals you reported in your area.
                        </p>
                    </div>

                    {/* Header Action Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 600 }}>My Submitted Reports</h3>
                            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Live status and rescue updates for your reported animals</p>
                        </div>

                        <Link to="/report" className="btn btn-forest-solid" style={{ padding: '0.5rem 1.25rem', textDecoration: 'none' }}>
                            + Report New Animal
                        </Link>
                    </div>

                    {/* Content Body */}
                    {loading ? (
                        <div className="forest-card" style={{ padding: '3rem', textAlign: 'center' }}>
                            <p>Loading your rescue reports...</p>
                        </div>
                    ) : filteredReports.length === 0 ? (
                        <div className="forest-card" style={{ padding: '3.5rem', textAlign: 'center' }}>
                            <span style={{ fontSize: '3rem' }}>🐾</span>
                            <h3 style={{ marginTop: '1rem', color: '#111827' }}>No Reports Submitted Yet</h3>
                            <p style={{ color: '#64748b', maxWidth: '450px', margin: '0.5rem auto 1.5rem' }}>
                                Have you found an injured or distressed animal? Submit a report now to notify nearby rescuers instantly.
                            </p>
                            <Link to="/report" className="btn btn-forest-solid">
                                Submit Animal Report
                            </Link>
                        </div>
                    ) : (
                        <div className="citizen-reports-grid">
                            {filteredReports.map((report) => (
                                <div key={report._id} className="forest-card citizen-report-card">
                                    {report.imageUrl ? (
                                        <div 
                                            className="citizen-report-img-wrapper" 
                                            onClick={() => setSelectedImage({
                                                src: getImageUrl(report.imageUrl),
                                                title: `${report.animalType} Report`,
                                                subtitle: `Status: ${report.status.replace('_', ' ')} • Severity: ${report.severity}`
                                            })}
                                            title="Click to view full size"
                                        >
                                            <img src={getImageUrl(report.imageUrl)} alt={report.animalType} className="citizen-report-img" />
                                            <div className="citizen-report-img-hint">🔍 View Full Image</div>
                                        </div>
                                    ) : (
                                        <div className="citizen-no-img">No Image Provided</div>
                                    )}
                                    <div className="citizen-card-content">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>{report.animalType}</h4>
                                            <span className={getStatusBadge(report.status)}>{report.status.replace('_', ' ')}</span>
                                        </div>
                                        <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0.25rem 0' }}>
                                            <strong>Severity:</strong> <span className={`severity-tag severity-${report.severity?.toLowerCase()}`}>{report.severity}</span>
                                        </p>
                                        <p style={{ fontSize: '0.92rem', color: '#334155', margin: '0.6rem 0' }}>{report.description}</p>
                                        
                                        {getStatusTimeline(report.status)}

                                        <div className="citizen-card-footer">
                                            <span>📅 Reported: {new Date(report.createdAt).toLocaleDateString()}</span>
                                            {report.location?.coordinates && (
                                                <span>📍 {report.location.coordinates[1].toFixed(4)}, {report.location.coordinates[0].toFixed(4)}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
            
            <AIChat />

            <ImageModal 
                isOpen={!!selectedImage} 
                onClose={() => setSelectedImage(null)} 
                src={typeof selectedImage === 'string' ? selectedImage : selectedImage?.src} 
                alt="Report Animal Full View" 
            />
        </div>
    );
};

export default CitizenDashboard;
