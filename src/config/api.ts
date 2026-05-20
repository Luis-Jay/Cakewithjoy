import axios from "axios";
import { auth } from "./firebase";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

const api = axios.create({
  baseURL: configuredApiUrl || undefined,
  timeout: 10000,
});

// Attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      auth.signOut();
    }
    return Promise.reject(error);
  }
);

export default api;
export const isApiConfigured = Boolean(configuredApiUrl);
