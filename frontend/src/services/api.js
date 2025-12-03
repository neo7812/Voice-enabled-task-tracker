import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const taskAPI = {
  getTasks: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.append(key, value);
      }
    });
    return api.get(`/tasks?${params}`);
  },

  getTask: (id) => {
    return api.get(`/tasks/${id}`);
  },

  parseVoice: (transcript) => {
    return api.post('/tasks/parse-voice', { transcript });
  },

  createTask: (taskData) => {
    return api.post('/tasks', taskData);
  },

  updateTask: (id, taskData) => {
    return api.put(`/tasks/${id}`, taskData);
  },

  deleteTask: (id) => {
    return api.delete(`/tasks/${id}`);
  },
};

export default api;