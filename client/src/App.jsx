import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages (We will create these next)
import Login from './pages/Login';
import Register from './pages/Register';
import CitizenDashboard from './pages/CitizenDashboard';
import RescuerDashboard from './pages/RescuerDashboard';
import ReportForm from './pages/ReportForm';

import './index.css';

function App() {
  const { user } = useContext(AuthContext);

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'RESCUER') return '/rescuer/dashboard';
    return '/dashboard';
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to={getDashboardPath()} replace />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to={getDashboardPath()} />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to={getDashboardPath()} />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['CITIZEN']}>
            <CitizenDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/report" element={
          <ProtectedRoute allowedRoles={['CITIZEN']}>
            <ReportForm />
          </ProtectedRoute>
        } />

        <Route path="/rescuer/dashboard" element={
          <ProtectedRoute allowedRoles={['RESCUER']}>
            <RescuerDashboard />
          </ProtectedRoute>
        } />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
