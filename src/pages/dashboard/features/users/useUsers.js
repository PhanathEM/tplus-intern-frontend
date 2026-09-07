import { useEffect, useState } from "react";
import { deleteUser, fetchUsers, resetUserPassword, updateUser } from "../../../../services/userService";
import { getStoredCredentials, setStoredCredentials } from "../../../../lib/apiClient";
import { ACTIVITY_MODULES, logActivity } from "../../../../lib/activityLog";
import {
  mergeStoredPermissionsForUser,
  normalizeUserPermissions,
  permissionsToRole,
  rememberUserPermissions,
} from "../../../../lib/permissions";

export function useUsers({ isActive, user }) {
  const [users, setUsers] = useState([]);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchToken, setFetchToken] = useState(0);
  const [permissionsTarget, setPermissionsTarget] = useState(null);
  const [permissionValues, setPermissionValues] = useState({ username: "", email: "", permissions: [] });
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [permissionsError, setPermissionsError] = useState(null);
  const [resetPasswordTarget, setResetPasswordTarget] = useState(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [deleteUserError, setDeleteUserError] = useState(null);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchUsers()
      .then((data) => {
        if (ignore) return;
        const list = Array.isArray(data) ? data : data?.users;
        setUsers(Array.isArray(list) ? list.map(mergeStoredPermissionsForUser) : []);
        setPendingApprovalCount(
          data?.pending_approval ?? (Array.isArray(list) ? list.filter((u) => !u.is_active).length : 0)
        );
        setError(null);
      })
      .catch((error) => {
        if (!ignore) setError(error.message || "Something went wrong.");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isActive, fetchToken]);

  function handleRetry() {
    setIsLoading(true);
    setError(null);
    setFetchToken((value) => value + 1);
  }

  function resetForEntry() {
    setIsLoading(true);
    setError(null);
  }

  function handleApprove(targetUser) {
    updateUser(targetUser.user_id, { is_active: true })
      .then(() => {
        logActivity({
          actor: user,
          action: "approve",
          module: ACTIVITY_MODULES.USER,
          entityId: targetUser.user_id,
          entityLabel: targetUser.full_name || targetUser.username,
          before: targetUser,
          after: { ...targetUser, is_active: true },
        });
        handleRetry();
      })
      .catch((error) => setError(error.message || "Something went wrong."));
  }

  function handleOpenEditPermissions(targetUser) {
    setPermissionsTarget(targetUser);
    setPermissionValues({
      username: targetUser.username || "",
      email: targetUser.email || "",
      permissions: normalizeUserPermissions(targetUser),
    });
    setPermissionsError(null);
  }

  function handleCloseEditPermissions() {
    setPermissionsTarget(null);
  }

  function handlePermissionFieldChange(key, value) {
    setPermissionValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmitEditPermissions(event) {
    event.preventDefault();

    const permissions = normalizeUserPermissions({ permissions: permissionValues.permissions });
    const payload = {
      username: permissionValues.username.trim(),
      email: permissionValues.email.trim(),
      permissions,
      role: permissionsToRole(permissions),
    };
    // Retried without `permissions` if the backend rejects that key (see the
    // 400/422 catch below). `username` stays in - dropping it here would let
    // a rename silently no-op on the retry.
    const legacyPayload = {
      username: payload.username,
      email: payload.email,
      role: payload.role,
    };

    setIsSavingPermissions(true);
    setPermissionsError(null);

    updateUser(permissionsTarget.user_id, payload)
      .catch((error) => {
        if (![400, 422].includes(error.status)) throw error;
        return updateUser(permissionsTarget.user_id, legacyPayload);
      })
      .then(() => {
        logActivity({
          actor: user,
          action: "update",
          module: ACTIVITY_MODULES.USER,
          entityId: permissionsTarget.user_id,
          entityLabel: payload.username || permissionsTarget.username,
          before: permissionsTarget,
          after: { ...permissionsTarget, ...payload },
        });
        // Every request carries username+password as query params
        // (apiClient.js), so renaming the account you are signed in as
        // leaves the stored pair pointing at a username that no longer
        // exists - every following request would 401. Re-point it at the new
        // name, matching on the stored username rather than an id so it only
        // ever touches the credentials actually in use.
        const stored = getStoredCredentials();
        if (stored?.username && stored.username === permissionsTarget.username && payload.username) {
          setStoredCredentials(payload.username, stored.password);
        }
        rememberUserPermissions(permissionsTarget, permissions);
        setPermissionsTarget(null);
        handleRetry();
      })
      .catch((error) => setPermissionsError(error.message || "Something went wrong."))
      .finally(() => setIsSavingPermissions(false));
  }

  function handleOpenResetPassword(targetUser) {
    setResetPasswordTarget(targetUser);
    setResetPassword("");
    setResetPasswordConfirm("");
    setResetPasswordError(null);
  }

  function handleCloseResetPassword() {
    setResetPasswordTarget(null);
  }

  function handleSubmitResetPassword(event) {
    event.preventDefault();

    if (resetPassword !== resetPasswordConfirm) {
      setResetPasswordError("Passwords do not match.");
      return;
    }

    setIsResettingPassword(true);
    setResetPasswordError(null);

    resetUserPassword(resetPasswordTarget.user_id, resetPassword)
      .then(() => {
        logActivity({
          actor: user,
          action: "reset_password",
          module: ACTIVITY_MODULES.USER,
          entityId: resetPasswordTarget.user_id,
          entityLabel: resetPasswordTarget.username || resetPasswordTarget.full_name,
        });
        setResetPasswordTarget(null);
      })
      .catch((error) => setResetPasswordError(error.message || "Something went wrong."))
      .finally(() => setIsResettingPassword(false));
  }

  function handleOpenDeleteUser(targetUser) {
    setUserToDelete(targetUser);
    setDeleteUserError(null);
  }

  function handleCloseDeleteUser() {
    setUserToDelete(null);
    setDeleteUserError(null);
  }

  function handleConfirmDeleteUser() {
    if (!userToDelete) return;

    setIsDeletingUser(true);
    setDeleteUserError(null);

    deleteUser(userToDelete.user_id)
      .then(() => {
        logActivity({
          actor: user,
          action: "delete",
          module: ACTIVITY_MODULES.USER,
          entityId: userToDelete.user_id,
          entityLabel: userToDelete.username || userToDelete.full_name,
          before: userToDelete,
        });
        setUserToDelete(null);
        handleRetry();
      })
      .catch((error) => setDeleteUserError(error.message || "Could not delete this account."))
      .finally(() => setIsDeletingUser(false));
  }

  return {
    users,
    pendingApprovalCount,
    isLoading,
    error,
    handleRetry,
    resetForEntry,
    handleApprove,
    permissionsTarget,
    permissionValues,
    isSavingPermissions,
    permissionsError,
    handleOpenEditPermissions,
    handleCloseEditPermissions,
    handlePermissionFieldChange,
    handleSubmitEditPermissions,
    resetPasswordTarget,
    resetPassword,
    resetPasswordConfirm,
    isResettingPassword,
    resetPasswordError,
    handleOpenResetPassword,
    handleCloseResetPassword,
    setResetPassword,
    setResetPasswordConfirm,
    handleSubmitResetPassword,
    userToDelete,
    isDeletingUser,
    deleteUserError,
    handleOpenDeleteUser,
    handleCloseDeleteUser,
    handleConfirmDeleteUser,
  };
}
