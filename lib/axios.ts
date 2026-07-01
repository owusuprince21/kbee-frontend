import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  return import('@/lib/firebase')
    .then(async ({ auth }) => {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    })
    .catch(() => config);
});

export default apiClient;
