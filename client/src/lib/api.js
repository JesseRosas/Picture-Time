const BASE = import.meta.env.VITE_API_URL ?? "";

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}/api${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// Auth
export const login = (email, password) =>
  request("/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });

export const getMe = () => request("/auth/me");

// Users
export const createUser = (data) =>
  request("/auth/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });

export const getUsers = () => request("/auth/users");

export const removeUser = (id) =>
  request(`/auth/users/${id}`, { method: "DELETE" });

// Password
export const changePassword = (currentPassword, newPassword) =>
  request("/auth/password", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });

// Photos
export const getPhotos = () => request("/photos");

export const uploadPhotos = (formData) =>
  request("/photos", { method: "POST", body: formData });

export const deletePhoto = (id) =>
  request(`/photos/${id}`, { method: "DELETE" });

export const reorderPhotos = (orderedIds) =>
  request("/photos/reorder", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderedIds }) });

// Likes
export const toggleLike = (photoId) =>
  request(`/photos/${photoId}/like`, { method: "POST" });

// Comments
export const getComments = (photoId) =>
  request(`/photos/${photoId}/comments`);

export const postComment = (photoId, text) =>
  request(`/photos/${photoId}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });

export const deleteComment = (photoId, commentId) =>
  request(`/photos/${photoId}/comments/${commentId}`, { method: "DELETE" });
