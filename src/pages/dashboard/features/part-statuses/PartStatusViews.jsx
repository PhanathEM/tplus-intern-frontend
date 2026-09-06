import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  FiAlertTriangle as AlertTriangle,
  FiEdit2 as Edit2,
  FiPlusCircle as PlusCircle,
  FiRefreshCw as RefreshCw,
  FiSettings as Settings,
  FiSliders as Sliders,
  FiTrash2 as Trash2,
  FiX as X,
} from "react-icons/fi";
import { EmptyState, FormField, formInputClass, formInvalidClass, RollingText } from "../../components/SharedControls";

const PART_STATUS_HEAD_CELL =
  "whitespace-nowrap border-y border-slate-100 px-5 py-2 leading-none dark:border-slate-800";
// Every cell keeps a full border at rest — top transparent, bottom the row
// separator — so hover only recolours it into a card around the row, with no
// 1px height jump.
const PART_STATUS_CELL =
  "border border-x-transparent border-t-transparent border-b-slate-50 bg-white px-5 py-2 group-hover:border-y-slate-200 dark:border-b-slate-800/60 dark:bg-slate-900 dark:group-hover:border-y-slate-700";
const PART_STATUS_ICON_BUTTON =
  "grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-orange-400 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white";

export function PartStatusesView({
  statuses,
  isLoading,
  error,
  onRetry,
  onAddNew,
  onEdit,
  onDelete,
  downloadError,
  canManage = true,
}) {
  const { t } = useTranslation();

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-xl bg-white dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 py-2">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Part statuses")}</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                {t("status_count", { count: statuses.length })}
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
            {canManage && (
            <button
              type="button"
              onClick={onAddNew}
              className="group/roll inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#fddd1c] px-3.5 text-[13px] font-semibold text-slate-900 outline-none transition hover:bg-[#e5c518] focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-[#fddd1c] dark:text-slate-900 dark:hover:bg-[#e5c518] dark:focus-visible:ring-offset-slate-900"
            >
              <PlusCircle size={15} />
              <RollingText text={t("Add Status")} />
            </button>
            )}
          </div>
        </div>

        {downloadError && (
          <div className="mx-5 mt-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertTriangle size={14} />
            {downloadError}
          </div>
        )}

        {isLoading ? (
          <div className="px-5 py-10 text-center text-[13px] text-slate-500 dark:text-slate-400">{t("Loading statuses...")}</div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertTriangle size={18} />
            </div>
            <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{t("Couldn't load statuses")}</p>
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
        ) : statuses.length === 0 ? (
          <EmptyState icon={Sliders} title={t("No statuses found")} description={t("Part statuses will appear here.")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-[13px]">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  {[t("Status Name"), t("Description"), t("Borrowable"), t("Part Stock")].map((label) => (
                    <th key={label} className={`${PART_STATUS_HEAD_CELL} font-semibold`}>
                      {label}
                    </th>
                  ))}
                  <th className={`${PART_STATUS_HEAD_CELL} text-right font-semibold`}>
                    <span className="flex items-center justify-end gap-1.5">
                      <Settings size={13} className="shrink-0" />
                      {t("Action")}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {statuses.map((status) => (
                  <tr
                    key={status.status_id}
                    className={status.is_active === false ? "opacity-60" : undefined}
                  >
                    <td className={`${PART_STATUS_CELL} whitespace-nowrap rounded-l-lg font-semibold text-slate-950 group-hover:border-l-slate-200 dark:text-white dark:group-hover:border-l-slate-700`}>
                      {status.status_name}
                      {status.is_active === false && (
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {t("Hidden")}
                        </span>
                      )}
                    </td>
                    <td className={`${PART_STATUS_CELL} max-w-72 truncate text-slate-600 dark:text-slate-300`} title={status.description || ""}>
                      {status.description || "—"}
                    </td>
                    <td className={`${PART_STATUS_CELL} whitespace-nowrap text-slate-600 dark:text-slate-300`}>
                      {status.is_borrowable ? t("Yes") : t("No")}
                    </td>
                    <td className={`${PART_STATUS_CELL} whitespace-nowrap text-slate-600 dark:text-slate-300`}>
                      {status.stock_count ?? 0}
                    </td>
                    <td className={`${PART_STATUS_CELL} whitespace-nowrap rounded-r-lg text-right group-hover:border-r-slate-200 dark:group-hover:border-r-slate-700`}>
                      {canManage && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onEdit(status)}
                            title={t("Edit")}
                            aria-label={t("Edit")}
                            className={PART_STATUS_ICON_BUTTON}
                          >
                            <Edit2 size={14} className="block" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(status)}
                            title={t("Delete")}
                            aria-label={t("Delete")}
                            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-rose-50 hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                          >
                            <Trash2 size={14} className="block" />
                          </button>
                        </div>
                      )}
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

export function PartStatusFormModal({ isOpen, mode, values, onChange, onSubmit, onClose, isSubmitting, error, missingFields = [] }) {
  const { t } = useTranslation();

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const isEdit = mode === "edit";
  // Our own "required" message, in place of the browser's bubble - the form
  // is noValidate below so only this one ever shows.
  const fieldError = (key) => (missingFields.includes(key) ? t("This field is required.") : null);
  const inputClass = (key) => (missingFields.includes(key) ? `${formInputClass} ${formInvalidClass}` : formInputClass);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-950/60" onClick={onClose} aria-label={t("Close")} />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-black/40">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{isEdit ? t("Edit status") : t("Add status")}</h2>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              {isEdit ? t("Update this status's details.") : t("Create a new part status.")}
            </p>
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

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" autoComplete="off" noValidate>
          <div className="overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField label={t("Status Name *")} htmlFor="part-status-name" error={fieldError("status_name")}>
                  <input
                    id="part-status-name"
                    type="text"
                    required
                    autoComplete="off"
                    value={values.status_name}
                    onChange={(e) => onChange("status_name", e.target.value)}
                    placeholder={t("e.g. Working - IT Stock")}
                    className={inputClass("status_name")}
                    disabled={isSubmitting}
                  />
                </FormField>
              </div>

              <div className="sm:col-span-2">
                <FormField
                  label={`${t("Description")} *`}
                  htmlFor="part-status-description"
                  error={fieldError("description")}
                >
                  <textarea
                    id="part-status-description"
                    rows={2}
                    required
                    value={values.description}
                    onChange={(e) => onChange("description", e.target.value)}
                    placeholder={t("e.g. Spare parts ready to hand out.")}
                    className={`${inputClass("description")} h-auto min-h-16 py-2`}
                    disabled={isSubmitting}
                  />
                </FormField>
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
              <RollingText text={isSubmitting ? t("Saving...") : isEdit ? t("Save changes") : t("Add status")} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
