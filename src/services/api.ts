import axios from 'axios';

const API_URL = (import.meta.env?.VITE_BACKEND_URL as string) || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  login: async (email: string, password: string) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await api.post('/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    
    return response.data;
  },
  
  signup: async (userData: { email: string; password: string; full_name: string }) => {
    const response = await api.post('/users', userData);
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
};

export const smsService = {
  sendSingleSMS: async (phone: string, message: string) => {
    const response = await api.post('/sms/send', {
      recipients: [{ phone }],
      message,
    });
    return response.data;
  },
  
  sendBulkSMS: async (recipients: Array<{ phone: string }>, message: string) => {
    const response = await api.post('/sms/bulk', {
      recipients,
      message,
    });
    return response.data;
  },
};

export const pricingService = {
  getPricingPlans: async () => {
    const response = await api.get('/pricing');
    return response.data;
  },
};

export default api;
