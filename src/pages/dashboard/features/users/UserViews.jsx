import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  FiAlertTriangle as AlertTriangle,
  FiRefreshCw as RefreshCw,
  FiSettings as Settings,
  FiTrash2 as Trash2,
  FiUsers as Users,
  FiX as X,
} from "react-icons/fi";
import { EmptyState, FormField, formInputClass, RollingText } from "../../components/SharedControls";
import { userPermissionSections } from "../../dashboard.config";
import { translateLabel } from "../../../../lib/i18nLabel";
import {
  ALL_PERMISSION_VALUES,
  getAccessLevelSummary,
  normalizeUserPermissions,
} from "../../../../lib/permissions";

const USER_HEAD_CELL =
  "whitespace-nowrap border-y border-slate-100 px-5 py-2 leading-none dark:border-slate-800";
// Every cell keeps a full border at rest — top transparent, bottom the row
// separator — so hover only recolours it into a card around the row, with no
// 1px height jump.
const USER_CELL =
  "border border-x-transparent border-t-transparent border-b-slate-50 bg-white px-5 py-2 group-hover:border-y-slate-200 dark:border-b-slate-800/60 dark:bg-slate-900 dark:group-hover:border-y-slate-700";

export function UsersView({
  users,
  pendingCount,
  isLoading,
  error,
  onRetry,
  onApprove,
  onEditPermissions,
  onResetPassword,
  onDelete,
  currentUserId,
}) {
  const { t, i18n } = useTranslation();

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-xl bg-white dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 py-2">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("User accounts")}</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                {t("account_count", { count: users.length })}
                {pendingCount > 0 && ` · ${t("pending_approval_suffix", { count: pendingCount })}`}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onRetry}
              disabled={isLoading}
              title={t("Refresh")}
              aria-label={t("Refresh")}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
            >
              <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {pendingCount > 0 && !isLoading && !error && (
          <div className="border-b border-amber-100 bg-amber-50 px-5 py-3 text-[13px] font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
            {t("accounts_waiting_approval", { count: pendingCount })}
          </div>
        )}

        {isLoading ? (
          <div className="px-5 py-10 text-center text-[13px] text-slate-500 dark:text-slate-400">{t("Loading user accounts...")}</div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertTriangle size={18} />
            </div>
            <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{t("Couldn't load user accounts")}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
            >
              <RefreshCw size={13} />
              {t("Retry")}
            </button>
          </div>
        ) : users.length === 0 ? (
          <EmptyState icon={Users} title={t("No accounts found")} description={t("Registered accounts will appear here.")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-[13px]">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className={`${USER_HEAD_CELL} font-semibold`}>{t("Username")}</th>
                  <th className={`${USER_HEAD_CELL} font-semibold`}>{t("Email")}</th>
                  <th className={`${USER_HEAD_CELL} font-semibold`}>{t("Permissions")}</th>
                  <th className={`${USER_HEAD_CELL} font-semibold`}>{t("Status")}</th>
                  <th className={`${USER_HEAD_CELL} text-right font-semibold`}>
                    <span className="flex items-center justify-end gap-1.5">
                      <Settings size={13} className="shrink-0" />
                      {t("Action")}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id}>
                    <td className={`${USER_CELL} whitespace-nowrap rounded-l-lg font-semibold text-slate-950 group-hover:border-l-slate-200 dark:text-white dark:group-hover:border-l-slate-700`}>
                      {user.username}
                    </td>
                    <td className={`${USER_CELL} whitespace-nowrap text-slate-600 dark:text-slate-300`}>
                      {user.email || "—"}
                    </td>
                    <td className={`${USER_CELL} whitespace-nowrap text-slate-600 dark:text-slate-300`}>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {getAccessLevelSummary(user, t)}
                      </span>
                    </td>
                    <td className={`${USER_CELL} whitespace-nowrap`}>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.is_active
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                          }`}
                      >
                        {user.is_active ? translateLabel(t, i18n, "Active") : translateLabel(t, i18n, "Pending")}
                      </span>
                    </td>
                    <td className={`${USER_CELL} whitespace-nowrap rounded-r-lg text-right group-hover:border-r-slate-200 dark:group-hover:border-r-slate-700`}>
                      <div className="flex items-center justify-end gap-2">
                        {!user.is_active && (
                          <button
                            type="button"
                            onClick={() => onApprove(user)}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-700 outline-none transition hover:border-emerald-300 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-emerald-800 dark:bg-slate-800 dark:text-emerald-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40 dark:focus-visible:ring-offset-slate-900"
                          >
                            {t("Approve")}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onEditPermissions(user)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
                        >
                          {t("Permissions")}
                        </button>
                        <button
                          type="button"
                          onClick={() => onResetPassword(user)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
                        >
                          {t("Reset Password")}
                        </button>
                        {onDelete && String(user.user_id) !== String(currentUserId) && (
                          <button
                            type="button"
                            onClick={() => onDelete(user)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 outline-none transition hover:border-rose-300 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-rose-800 dark:bg-slate-800 dark:text-rose-400 dark:hover:border-rose-700 dark:hover:bg-rose-950/40 dark:focus-visible:ring-offset-slate-900"
                          >
                            <Trash2 size={12} />
                            {t("Delete")}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function UserPermissionsModal({ isOpen, user, values, onChange, onSubmit, onClose, isSubmitting, error }) {
  const { t } = useTranslation();

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen || !user) return null;

  const selectedPermissions = new Set(normalizeUserPermissions({ permissions: values.permissions }));
  const allPermissionsSelected = ALL_PERMISSION_VALUES.every((permission) =>
    selectedPermissions.has(permission)
  );

  function updatePermissions(nextPermissions) {
    onChange("permissions", nextPermissions);
  }

  function handleToggleAll(checked) {
    updatePermissions(checked ? ALL_PERMISSION_VALUES : []);
  }

  function handleTogglePermission(permission, checked) {
    const nextPermissions = new Set(selectedPermissions);
    if (checked) {
      nextPermissions.add(permission);
    } else {
      nextPermissions.delete(permission);
    }
    updatePermissions([...nextPermissions]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60"
        onClick={onClose}
        aria-label={t("Close")}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-black/40">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Edit account")}</h2>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">{user.username}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-slate-200 leading-none text-slate-500 outline-none transition hover:border-slate-300 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            aria-label={t("Close")}
          >
            <X size={15} className="block" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
          <div className="overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                {error}
              </div>
            )}
            <div className="grid gap-4">
              <FormField label={t("Username")} htmlFor="user-username">
                <input
                  id="user-username"
                  type="text"
                  autoComplete="off"
                  value={values.username}
                  onChange={(e) => onChange("username", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>
              <FormField label={t("Email")} htmlFor="user-email">
                <input
                  id="user-email"
                  type="email"
                  autoComplete="off"
                  value={values.email}
                  onChange={(e) => onChange("email", e.target.value)}
                  placeholder="you@company.com"
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{t("Permissions")}</p>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                    <input
                      type="checkbox"
                      checked={allPermissionsSelected}
                      onChange={(event) => handleToggleAll(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-orange-500 accent-orange-500 focus:ring-orange-400 dark:border-slate-600 dark:bg-slate-800"
                      disabled={isSubmitting}
                    />
                    {t("All permissions")}
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {userPermissionSections.map((section) => (
                    <div key={section.label} className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {t(section.label)}
                      </p>
                      <div className="grid gap-2">
                        {section.permissions.map((permission) => (
                          <label
                            key={permission.value}
                            className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-2 text-[13px] font-medium text-slate-700 ring-1 ring-slate-100 transition hover:bg-orange-50 hover:text-slate-950 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-orange-500/10 dark:hover:text-white"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.has(permission.value)}
                              onChange={(event) =>
                                handleTogglePermission(permission.value, event.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-orange-500 accent-orange-500 focus:ring-orange-400 dark:border-slate-600 dark:bg-slate-800"
                              disabled={isSubmitting}
                            />
                            <span>{t(permission.label)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
            >
              {t("Cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group/roll inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#fddd1c] px-3.5 text-[13px] font-semibold text-slate-900 outline-none transition hover:bg-[#e5c518] focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#fddd1c] dark:text-slate-900 dark:hover:bg-[#e5c518] dark:focus-visible:ring-offset-slate-900"
            >
              <RollingText text={isSubmitting ? t("Saving...") : t("Save changes")} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ResetPasswordModal({
  isOpen,
  user,
  password,
  confirmPassword,
  onChangePassword,
  onChangeConfirmPassword,
  onSubmit,
  onClose,
  isSubmitting,
  error,
}) {
  const { t } = useTranslation();

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60"
        onClick={onClose}
        aria-label={t("Close")}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-black/40">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Reset password")}</h2>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">{user.username}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-slate-200 leading-none text-slate-500 outline-none transition hover:border-slate-300 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            aria-label={t("Close")}
          >
            <X size={15} className="block" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
          <div className="overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                {error}
              </div>
            )}
            <div className="grid gap-4">
              <FormField label={t("New Password *")} htmlFor="reset-password">
                <input
                  id="reset-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => onChangePassword(e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>
              <FormField label={t("Confirm Password *")} htmlFor="reset-confirm-password">
                <input
                  id="reset-confirm-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => onChangeConfirmPassword(e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
            >
              {t("Cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group/roll inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#fddd1c] px-3.5 text-[13px] font-semibold text-slate-900 outline-none transition hover:bg-[#e5c518] focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#fddd1c] dark:text-slate-900 dark:hover:bg-[#e5c518] dark:focus-visible:ring-offset-slate-900"
            >
              <RollingText text={isSubmitting ? t("Saving...") : t("Reset password")} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
