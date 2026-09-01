import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const requestUrl = config.url ?? "";
  const requestMethod = (config.method ?? "get").toLowerCase();
  const publicRequest =
    requestUrl.includes("/api/public/students/search/") ||
    (requestMethod === "get" && /^\/api\/students\/[^/]+$/.test(requestUrl)) ||
    requestUrl.includes("/api/fees/calculate") ||
    requestUrl.includes("/api/fees/lump-sum-preview/") ||
    (requestMethod === "get" && /^\/api\/fees\/history\/[^/]+$/.test(requestUrl)) ||
    requestUrl.includes("/api/fees/online/create-qr") ||
    requestUrl.includes("/api/fees/online/status/");
  if (publicRequest) {
    if (config.headers) delete config.headers.Authorization;
    return config;
  }
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
