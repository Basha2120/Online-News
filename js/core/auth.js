import { apiFetch, setToken, getToken } from "./api.js";

let currentUser = null;

export function getCurrentUser() {
  return currentUser;
}

export async function loadCurrentUser() {
  const token = getToken();

  if (!token) {
    currentUser = null;
    return null;
  }

  const response = await apiFetch("/api/me");

  if (!response.ok) {
    currentUser = null;
    setToken(null);
    return null;
  }

  const data = await response.json();
  currentUser = data.user;
  return currentUser;
}

export async function login(email, password) {
  const response = await apiFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) return null;

  const data = await response.json();
  setToken(data.token);
  currentUser = data.user;
  return data.user;
}

export function requireAuth(redirectTo = "index.html") {
  const token = getToken();
  if (!token) {
    window.location.href = redirectTo;
    return false;
  }
  return true;
}

export function logout() {
  setToken(null);
  currentUser = null;
}
