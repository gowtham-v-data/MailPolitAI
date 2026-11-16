import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mailpilot_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('mailpilot_token');
      if (
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/register' &&
        !window.location.pathname.startsWith('/client')
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');

// Emails
export const getEmails = (params) => api.get('/emails', { params });
export const getEmail = (id) => api.get(`/emails/${id}`);
export const getEmailStats = (clientId) => api.get(`/emails/stats/${clientId}`);
export const classifyEmail = (id, data) => api.put(`/emails/${id}/classify`, data);
export const updateEmailStatus = (id, data) => api.put(`/emails/${id}/status`, data);
export const toggleImportant = (id) => api.put(`/emails/${id}/important`);
export const markRead = (id, data) => api.put(`/emails/${id}/read`, data);
export const archiveEmail = (id) => api.put(`/emails/${id}/archive`);
export const delegateEmail = (id) => api.put(`/emails/${id}/delegate`);
export const completeEmail = (id) => api.put(`/emails/${id}/complete`);

// Clients
export const getClients = () => api.get('/clients');
export const getClient = (id) => api.get(`/clients/${id}`);
export const createClient = (data) => api.post('/clients', data);
export const updateClient = (id, data) => api.put(`/clients/${id}`, data);
export const deleteClient = (id) => api.delete(`/clients/${id}`);

// AI
export const aiClassify = (emailId) => api.post(`/ai/classify/${emailId}`);
export const aiSummarize = (emailId) => api.post(`/ai/summarize/${emailId}`);
export const aiDraftReply = (emailId, data) => api.post(`/ai/draft-reply/${emailId}`, data);
export const aiChat = (data) => api.post('/ai/chat', data);
export const getAIInsights = (clientId) => api.get(`/ai/insights/${clientId}`);

// Dashboard
export const getDashboardStats = (clientId) => api.get(`/dashboard/stats/${clientId}`);
export const getRecentEmails = (clientId) => api.get(`/dashboard/recent/${clientId}`);

// Accounts
export const connectAccount = (data) => api.post('/accounts/connect', data);
export const getAccounts = (clientId) => api.get(`/accounts/${clientId}`);
export const syncAccount = (id) => api.put(`/accounts/${id}/sync`);
export const disconnectAccount = (id) => api.delete(`/accounts/${id}`);

// Meetings
export const getMeetings = (params) => api.get('/meetings', { params });
export const createMeeting = (data) => api.post('/meetings', data);
export const updateMeeting = (id, data) => api.put(`/meetings/${id}`, data);

// Third-Party Integrations
export const getIntegrationsStatus = (clientId) => api.get('/accounts/integrations-status', { params: { clientId } });
export const syncIntegrationProvider = (provider, clientId) => api.post('/accounts/sync-provider', { provider, clientId });
export const getAIStatus = () => api.get('/ai/status');
export const updateAIConfig = (data) => api.post('/ai/config', data);

export default api;
