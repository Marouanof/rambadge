import api from './api';

export const userService = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getByDirection: (directionId) => api.get(`/users?direction=${directionId}`),
  getEmployes: () => api.get('/users?role=employe'),
  getManagers: () => api.get('/users?role=manager'),
  getAgentsSurete: () => api.get('/users?role=surete'),
  invite: (email) => api.post('/users/invite', { email }),
}
