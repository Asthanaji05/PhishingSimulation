import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Don't send cookies or auth headers that might be large
  withCredentials: false,
});

// Recipients API
export const recipientsAPI = {
  getAll: () => api.get('/recipients'),
  create: (data) => api.post('/recipients', data),
  update: (id, data) => api.put(`/recipients/${id}`, data),
  delete: (id) => api.delete(`/recipients/${id}`),
};

// Campaigns API
export const campaignsAPI = {
  getAll: () => api.get('/campaigns'),
  getById: (id) => api.get(`/campaigns/${id}`),
  create: (data) => api.post('/campaigns', data),
  update: (id, data) => api.put(`/campaigns/${id}`, data),
  delete: (id) => api.delete(`/campaigns/${id}`),
  getStats: (id) => api.get(`/campaigns/${id}/stats`),
  getClicks: (id) => api.get(`/campaigns/${id}/clicks`),
  send: (id, recipientEmails = null) => 
    api.post(`/campaigns/${id}/send`, { recipientEmails }),
  verifySMTP: (id) => api.post(`/campaigns/${id}/verify-smtp`),
};

// Clicks API
export const clicksAPI = {
  getAll: () => api.get('/clicks'),
};

// Reports API
export const reportsAPI = {
  downloadCSV: () => 
    api.get('/report/csv', { responseType: 'blob' }),
};

export default api;

