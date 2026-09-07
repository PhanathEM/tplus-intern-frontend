import { apiGet, apiPost } from "../lib/apiClient";

export function login(username, password) {
  return apiPost("/api/auth/login", { username, password }, { skipCredentials: true });
}

// Fresh copy of the logged-in user's own record (user_id, username,
// role) — used by the "View profile" panel so it doesn't rely
// solely on whatever was cached in local state at login time.
export function fetchCurrentUser() {
  return apiGet("/api/auth/me");
}

// email is accepted by the endpoint (no error), but the 201 response never
// echoes it back the way it does username/role — a strong signal
// backend isn't storing it yet. Sending it anyway so accounts are ready to
// have a real email on file the moment backend does persist it.
export function signup({ username, email, password }) {
  return apiPost(
    "/api/auth/signup",
    { username, email, password },
    { skipCredentials: true }
  );
}

// Both pre-auth, like login/signup — no credentials to attach yet. `username`
// accepts either the real username or the account's email (backend matches
// either). Live and SMTP-backed: forgot-password emails a 6-digit code
// instead of a link — reset-password needs that same identifier again since
// the code alone doesn't uniquely identify the account.
export function requestPasswordReset(username) {
  return apiPost("/api/auth/forgot-password", { username }, { skipCredentials: true });
}

export function confirmPasswordReset(username, code, newPassword) {
  return apiPost(
    "/api/auth/reset-password",
    { username, code, new_password: newPassword },
    { skipCredentials: true }
  );
}
