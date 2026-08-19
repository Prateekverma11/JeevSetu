import axios from 'axios';

// Get current backend URL
export const getBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    // If running in development with Vite default server on 5173, point to backend default 5000
    if (window.location.port === '5173') {
        return 'http://localhost:5000';
    }
    // Otherwise use current window origin (for unified deployment)
    return window.location.origin;
};

export const API_BASE_URL = getBaseUrl();

const api = axios.create({
    baseURL: API_BASE_URL
});

// Automatically attach JWT token if present
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${cleanPath}`;
};

export default api;
