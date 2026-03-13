const API_BASE = "http://localhost:3000";

export function getToken() {
  return localStorage.getItem("authToken");
}

export function setToken(token) {
  if (token) {
    localStorage.setItem("authToken", token);
  } else {
    localStorage.removeItem("authToken");
  }
}

export async function apiFetch(path, options = {}) {
  const headers = options.headers || {};
  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(`${API_BASE}${path}`, { ...options, headers });
}
