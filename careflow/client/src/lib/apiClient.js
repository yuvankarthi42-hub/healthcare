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
  // Avoid `Authorization` on Catalyst — the platform treats it as Catalyst OAuth.
  if (memoryToken) config.headers["X-CareFlow-Token"] = memoryToken;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.error || "";
    const isSessionExpired =
      err.response?.status === 401 &&
      (msg.includes("Missing authentication token") || msg.includes("Session expired or invalid"));
    if (isSessionExpired) {
      clearSession();
      if (!window.location.pathname.includes("/login")) {
        window.location.href = (import.meta.env.BASE_URL || "/").replace(/\/{2,}/g, "/");
      }
    }
    return Promise.reject(err);
  }
);

export default api;
