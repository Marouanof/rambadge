import api from './api';

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  setPassword: (token, password) => api.post('/auth/set-password', { token, password }),
  getCurrentUser: () => api.get('/auth/me'),
}
