import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  try {
    const sessionRaw = localStorage.getItem("authSession");
    if (sessionRaw) {
      const session = JSON.parse(sessionRaw) as { token?: string };
      if (session.token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${session.token}`;
      }
    }
  } catch {
    // Ignore malformed session data and send the request without auth.
  }

  return config;
});

export default api;
