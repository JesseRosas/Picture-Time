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

export const register = (data) =>
  request("/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });

export const getMe = () => request("/auth/me");

// Photos
export const getPhotos = () => request("/photos");

export const uploadPhotos = (formData) =>
  request("/photos", { method: "POST", body: formData }); // no Content-Type header — browser sets multipart boundary

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

// Invites
export const verifyInviteToken = (token) =>
  request(`/invites/verify?token=${token}`);

export const sendInvite = (email) =>
  request("/invites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });

export const getInvites = () => request("/invites");

export const cancelInvite = (id) =>
  request(`/invites/${id}`, { method: "DELETE" });

// Users
export const getUsers = () => request("/auth/users");

export const removeUser = (id) =>
  request(`/auth/users/${id}`, { method: "DELETE" });

// Password
export const changePassword = (currentPassword, newPassword) =>
  request("/auth/password", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
