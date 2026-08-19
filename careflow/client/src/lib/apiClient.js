import axios from "axios";

/**
 * Thin HTTP client for:
 *   POST /api/auth/login  — demo session (required by the challenge)
 *   GET/POST/PATCH/DELETE /api/zoho/:module  — Zoho Projects records only
 *
 * Session lives in memory for this tab. No localStorage / sessionStorage.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
});

let memoryToken = null;
let memoryUser = null;

export function getToken() {
  return memoryToken;
}
export function getStoredUser() {
  return memoryUser;
}
export function setSession(token, user) {
  memoryToken = token;
  memoryUser = user;
}
export function clearSession() {
  memoryToken = null;
  memoryUser = null;
}

api.interceptors.request.use((config) => {
  if (memoryToken) config.headers.Authorization = `Bearer ${memoryToken}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearSession();
      const loginHref = `${import.meta.env.BASE_URL || "/"}login`.replace(/\/{2,}/g, "/");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = loginHref;
      }
    }
    return Promise.reject(err);
  }
);

export default api;
