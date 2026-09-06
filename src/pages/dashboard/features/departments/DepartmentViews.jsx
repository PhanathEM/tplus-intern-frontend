import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  FiEdit2 as Edit2,
  FiPlusCircle as PlusCircle,
  FiRefreshCw as RefreshCw,
  FiTrash2 as Trash2,
  FiUsers as Users,
  FiX as X,
} from "react-icons/fi";
import { departmentColumns, DEPARTMENTS_PAGE_SIZE } from "../../dashboard.config";
import { FormField, formInputClass, formInvalidClass, RollingText } from "../../components/SharedControls";
import { RecordsTableView } from "../../components/RecordsTableView";

export function DepartmentsView({
  departments,
  isLoading,
  error,
  onRetry,
  search = "",
  onAddNew,
  onEdit,
  onDelete,
  canManage = true,
  canCreate = true,
}) {
  const { t } = useTranslation();

  // department_id is the raw database id — new departments don't land at the
  // end of that sequence, so number rows ourselves instead of showing it.
  const numberedDepartments = useMemo(
    () => departments.map((department, index) => ({ ...department, _row_number: index + 1 })),
    [departments]
  );
  const numberedColumns = useMemo(
    () => [{ key: "_row_number", label: "No." }, ...departmentColumns.filter((column) => column.key !== "department_id")],
    []
  );

  return (
    <RecordsTableView
      records={numberedDepartments}
      columnsConfig={numberedColumns}
      title={t("Departments")}
      recordLabel="department"
      loadingText={t("Loading departments...")}
      errorTitle={t("Couldn't load departments")}
      emptyIcon={Users}
      emptyTitle={t("No departments found")}
      emptyDescription={search ? t("No department matches", { term: search }) : t("Department records will appear here.")}
      rowKey={(department, index) => department.department_id ?? department.department_code ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      hideRefresh
      pageSize={DEPARTMENTS_PAGE_SIZE}
      headerActions={
        <>
          <button
            type="button"
            onClick={onRetry}
            disabled={isLoading}
            title={t("Refresh")}
            aria-label={t("Refresh")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
          </button>
          {canCreate && (
            <button
              type="button"
              onClick={onAddNew}
              className="group/roll inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#fddd1c] px-3.5 text-[13px] font-semibold text-slate-900 outline-none transition hover:bg-[#e5c518] focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-[#fddd1c] dark:text-slate-900 dark:hover:bg-[#e5c518] dark:focus-visible:ring-offset-slate-900"
            >
              <PlusCircle size={14} />
              <RollingText text={t("New Department")} />
            </button>
          )}
        </>
      }
      renderRowActions={
        canManage &&
        ((department) => (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => onEdit(department)}
              title={t("Edit")}
              aria-label={t("Edit")}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
            >
              <Edit2 size={14} className="block" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(department)}
              title={t("Delete")}
              aria-label={t("Delete")}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-rose-50 hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
            >
              <Trash2 size={14} className="block" />
            </button>
          </div>
        ))
      }
    />
  );
}

export function DepartmentFormModal({
  isOpen,
  mode,
  values,
  onChange,
  onSubmit,
  onClose,
  isSubmitting,
  error,
  missingFields = [],
}) {
  const { t } = useTranslation();
  // Our own "required" message, in place of the browser's bubble - the form
  // is noValidate below so only this one ever shows.
  const fieldError = (key) => (missingFields.includes(key) ? t("This field is required.") : null);
  const inputClass = (key) => (missingFields.includes(key) ? `${formInputClass} ${formInvalidClass}` : formInputClass);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

if (!isOpen) return null;

 const isEdit = mode === "edit";

return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="animate-modal-backdrop absolute inset-0 bg-slate-950/60"
        onClick={onClose}
        aria-label={t("Close")}
      />
      <div className="animate-modal-panel relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-black/40">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">
              {isEdit ? t("Edit department") : t("Add new department")}
            </h2>
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
            <div className="grid gap-4">
              <FormField label={t("Department Code *")} htmlFor="department-code" error={fieldError("department_code")}>
                <input
                  id="department-code"
                  type="text"
                  required
                  autoComplete="off"
                  value={values.department_code}
                  onChange={(e) => onChange("department_code", e.target.value)}
                  placeholder={t("e.g. ADM")}
                  className={inputClass("department_code")}
                  disabled={isSubmitting}
                />
              </FormField>
              <FormField label={t("Department Name *")} htmlFor="department-name" error={fieldError("department_name")}>
                <input
                  id="department-name"
                  type="text"
                  required
                  autoComplete="off"
                  value={values.department_name}
                  onChange={(e) => onChange("department_name", e.target.value)}
                  placeholder={t("e.g. Administration")}
                  className={inputClass("department_name")}
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
              <RollingText text={isSubmitting ? t("Saving...") : isEdit ? t("Save changes") : t("Add department")} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CategoryFormModal({
  isOpen,
  mode,
  values,
  onChange,
  onSubmit,
  onClose,
  isSubmitting,
  error,
  missingFields = [],
}) {
  const { t } = useTranslation();
  // Our own "required" message, in place of the browser's bubble - the form
  // is noValidate below so only this one ever shows.
  const fieldError = (key) => (missingFields.includes(key) ? t("This field is required.") : null);
  const inputClass = (key) => (missingFields.includes(key) ? `${formInputClass} ${formInvalidClass}` : formInputClass);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

if (!isOpen) return null;

 const isEdit = mode === "edit";

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
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">
              {isEdit ? t("Edit category") : t("Add new category")}
            </h2>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              {isEdit ? t("Update this category's details.") : t("Create a new category.")}
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
            <div className="grid gap-4">
              <FormField label={t("Category Name *")} htmlFor="category-name" error={fieldError("category_name")}>
                <input
                  id="category-name"
                  type="text"
                  required
                  autoComplete="off"
                  value={values.category_name}
                  onChange={(e) => onChange("category_name", e.target.value)}
                  placeholder={t("e.g. Laptop")}
                  className={inputClass("category_name")}
                  disabled={isSubmitting}
                />
              </FormField>

<FormField label={`${t("Description")} *`} htmlFor="category-description" error={fieldError("description")}>
                <input
                  id="category-description"
                  type="text"
                  required
                  autoComplete="off"
                  value={values.description}
                  onChange={(e) => onChange("description", e.target.value)}
                  placeholder={t("e.g. Staff laptops and notebooks.")}
                  className={inputClass("description")}
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
              <RollingText text={isSubmitting ? t("Saving...") : isEdit ? t("Save changes") : t("Add category")} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
