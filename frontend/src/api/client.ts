import axios from 'axios';
import { API_BASE } from './config';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  async (config) => {
    // In a real app, get token from AsyncStorage
    const token = 'mock-token';
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authApi = {
  sendOTP: (phoneNumber: string) => api.post('/auth/send-otp', { phone_number: phoneNumber }),
  sendEmailOTP: (email: string) => api.post('/auth/send-otp', { email }),
  verifyEmailOTP: (email: string, otp: string) => api.post('/auth/verify-otp', { email, otp }),
  verifyOTP: (phoneNumber: string, otp: string) => api.post('/auth/verify-otp', { phone_number: phoneNumber, otp }),
};

export const taskApi = {
  getCategories: () => api.get('/tasks/categories'),
  createTask: (data: any) => api.post('/tasks/create', data),
  getOpenTasks: () => api.get('/tasks/open'),
};

export const bookingApi = {
  acceptTask: (taskId: string, taskerId: string) => api.post('/bookings/accept', { task_id: taskId, tasker_id: taskerId }),
  initPayment: (bookingId: string, amount: number) => api.post('/bookings/pay/init', { booking_id: bookingId, amount }),
  verifyPayment: (reference: string) => api.post('/bookings/pay/verify', { reference }),
};

export const kycApi = {
  submitKYC: (idType: 'NIN' | 'BVN', idNumber: string) => api.post('/kyc/verify', { id_type: idType, id_number: idNumber }),
  getStatus: () => api.get('/kyc/status'),
};

export const tierApi = {
  get: (userId: string) => api.get(`/tiers/${encodeURIComponent(userId)}`),
};

export const reviewApi = {
  create: (data: { reviewer_id: string; reviewee_id: string; rating: number; comment?: string; booking_id?: string }) =>
    api.post('/reviews', data),
  list: (userId: string) => api.get(`/reviews/${encodeURIComponent(userId)}`),
};

export default api;
