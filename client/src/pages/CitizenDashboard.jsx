import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import AIChat from '../components/AIChat';

const CitizenDashboard = () => {
    const { user } = useContext(AuthContext);
    const { socket } = useContext(SocketContext);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, [user.token]);

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
            const res = await axios.get('http://localhost:5000/api/reports', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
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

    return (
        <>
            <Navbar />
            <div className="container animate-fade-in">
                <h2>Welcome, {user.name}</h2>
                
                <div style={{ marginTop: '2rem' }}>
                    <h3>My Reports</h3>
                    {loading ? (
                        <p>Loading reports...</p>
                    ) : reports.length === 0 ? (
                        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-muted)' }}>You haven't reported any animals yet.</p>
                        </div>
                    ) : (
                        <div className="dashboard-grid">
                            {reports.map((report) => (
                                <div key={report._id} className="glass-panel report-card">
                                    {report.imageUrl && (
                                        <img src={`http://localhost:5000${report.imageUrl}`} alt="Animal" />
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4>{report.animalType}</h4>
                                        <span className={getStatusBadge(report.status)}>{report.status.replace('_', ' ')}</span>
                                    </div>
                                    <p style={{ color: 'var(--text-muted)' }}>Severity: {report.severity}</p>
                                    <p>{report.description}</p>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                        Reported on: {new Date(report.createdAt).toLocaleDateString()}
                                    </p>
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
