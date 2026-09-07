import { useState } from "react";
import { fetchCurrentUser } from "../../../../services/authService";
import { changePassword, setStoredCredentials } from "../../../../lib/apiClient";
import { ACTIVITY_MODULES, logActivity } from "../../../../lib/activityLog";

export function useAccount({ user }) {
  // --- View profile -------------------------------------------------------

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);

  function handleOpenProfile() {
    setIsProfileOpen(true);
    setProfile(null);
    setProfileError(null);
    setIsProfileLoading(true);

    fetchCurrentUser()
      .then((data) => setProfile(data))
      // The cached login-time user still has username/role even
      // if this fresh fetch fails, so the panel still shows something
      // rather than an empty error state.
      .catch((error) => {
        setProfile(user || null);
        setProfileError(error.message || "Could not refresh your profile — showing what's on hand.");
      })
      .finally(() => setIsProfileLoading(false));
  }

  function handleCloseProfile() {
    setIsProfileOpen(false);
  }

  // --- Change password (self-service) --------------------------------------

  // POST /api/auth/change-password — any logged-in user, not admin-only.
  // Auth is Basic base64(username:current_password), proving the caller
  // actually knows their current password (see changePassword in apiClient.js).
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  function handleOpenChangePassword() {
    setIsPasswordOpen(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
  }

  function handleCloseChangePassword() {
    setIsPasswordOpen(false);
  }

  function handleSubmitChangePassword(event) {
    event.preventDefault();

    if (!currentPassword.trim()) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    const username = user?.username;
    if (!username) {
      setPasswordError("Could not identify your account. Please sign in again.");
      return;
    }

    setIsSavingPassword(true);
    setPasswordError(null);

    changePassword(username, currentPassword, newPassword)
      .then(() => {
        // Every other request on this session authenticates with whatever
        // is stored here (see apiClient.js) — refresh it immediately so
        // this tab keeps working right away instead of 401ing until the
        // next fresh login.
        setStoredCredentials(username, newPassword);
        logActivity({
          actor: user,
          action: "reset_password",
          module: ACTIVITY_MODULES.USER,
          entityId: user?.user_id ?? user?.id,
          entityLabel: username || user?.name || "My account",
        });
        setIsPasswordOpen(false);
      })
      .catch((error) => setPasswordError(error.message || "Could not update your password."))
      .finally(() => setIsSavingPassword(false));
  }

  return {
    isProfileOpen,
    profile,
    isProfileLoading,
    profileError,
    handleOpenProfile,
    handleCloseProfile,
    isPasswordOpen,
    currentPassword,
    newPassword,
    confirmPassword,
    setCurrentPassword,
    setNewPassword,
    setConfirmPassword,
    isSavingPassword,
    passwordError,
    handleOpenChangePassword,
    handleCloseChangePassword,
    handleSubmitChangePassword,
  };
}
