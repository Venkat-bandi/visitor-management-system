import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

export const visitorAPI = {
  create: (formData) => api.post('/visitors', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getSecurityVisitors: () => api.get('/visitors/security'),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getVisitors: (params) => api.get('/admin/visitors', { params }),
  exportVisitors: (params) => api.get('/admin/export', { 
    params,
    responseType: 'blob'
  }),
  // NEW ENDPOINTS
  addAdminEmails: (emails) => api.post('/admin/add-admin-emails', { emails }),
  addSecurityEmails: (emails) => api.post('/admin/add-security-emails', { securityEmails }),
};

export default api;