import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FiAlertTriangle as AlertTriangle, FiX as X } from "react-icons/fi";
import { FormField, formInputClass, RollingText } from "../../components/SharedControls";

export function ProfileModal({ isOpen, profile, isLoading, error, accessLabel, onClose }) {
  const { t } = useTranslation();

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const displayName = profile?.username || profile?.name || "—";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-950/60" onClick={onClose} aria-label={t("Close")} />
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-black/40">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Your profile")}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-slate-200 leading-none text-slate-500 outline-none transition hover:border-slate-300 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            aria-label={t("Close")}
          >
            <X size={15} className="block" />
          </button>
        </div>

        <div className="px-6 py-5">
          {isLoading ? (
            <div className="py-6 text-center text-[13px] text-slate-500 dark:text-slate-400">{t("Loading...")}</div>
          ) : (
            <>
              {error && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[13px] text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="mb-5 flex items-center gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-slate-950 text-base font-semibold text-white dark:bg-white dark:text-slate-900">
                  {initials || "?"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-slate-950 dark:text-white">{displayName}</p>
                  <p className="truncate text-[13px] text-slate-500 dark:text-slate-400">{accessLabel}</p>
                </div>
              </div>

              <dl className="grid gap-3 text-[13px]">
                <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <dt className="text-slate-500 dark:text-slate-400">{t("Username")}</dt>
                  <dd className="font-medium text-slate-900 dark:text-slate-100">{profile?.username || "—"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <dt className="text-slate-500 dark:text-slate-400">{t("Role")}</dt>
                  <dd className="font-medium capitalize text-slate-900 dark:text-slate-100">{profile?.role || "—"}</dd>
                </div>
              </dl>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChangePasswordModal({
  isOpen,
  currentPassword,
  newPassword,
  confirmPassword,
  onChangeCurrentPassword,
  onChangeNewPassword,
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-950/60" onClick={onClose} aria-label={t("Close")} />
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-black/40">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Account settings")}</h2>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">{t("Change your password.")}</p>
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
              <FormField label={t("Current Password *")} htmlFor="account-current-password">
                <input
                  id="account-current-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => onChangeCurrentPassword(e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>
              <FormField label={t("New Password *")} htmlFor="account-new-password">
                <input
                  id="account-new-password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => onChangeNewPassword(e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>
              <FormField label={t("Confirm Password *")} htmlFor="account-confirm-password">
                <input
                  id="account-confirm-password"
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
              <RollingText text={isSubmitting ? t("Saving...") : t("Save changes")} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
