import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import './index.css';

import { runConceptDiagnostics } from './utils';

// Google OAuth Provider
import { GoogleOAuthProvider } from '@react-oauth/google';

// Run and verify core JS concepts on initialization
runConceptDiagnostics().catch(console.error);

// We need the client ID from environment or user. For now, empty string if not defined.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <SocketProvider>
        <App />
      </SocketProvider>
    </AuthProvider>
  </StrictMode>,
);
