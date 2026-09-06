import { Fragment, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  FiAlertTriangle as AlertTriangle,
  FiBox as Box,
  FiBriefcase as Briefcase,
  FiEdit2 as Edit2,
  FiHash as Hash,
  FiLayers as Layers,
  FiMapPin as MapPin,
  FiPhone as Phone,
  FiPlusCircle as PlusCircle,
  FiRefreshCw as RefreshCw,
  FiSettings as Settings,
  FiTrash2 as Trash2,
  FiUser as UserIcon,
  FiUsers as Users,
  FiX as X,
} from "react-icons/fi";
import {
  formatFieldValue,
  getEmployeeDepartmentCode,
} from "../../dashboard.utils";
import { EmptyState, FormField, formInputClass, formInvalidClass, Pagination, RadioSelect, RollingText } from "../../components/SharedControls";

export function EmployeeFormModal({
  isOpen,
  mode,
  values,
  onChange,
  onSubmit,
  onClose,
  isSubmitting,
  error,
  departments,
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
        aria-label="Close"
      />
      <div className="animate-modal-panel relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-black/40">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-[15px] font-semibold text-slate-600 dark:text-slate-300">
              {isEdit ? t("Edit Employee") : t("Add New Employee")}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-slate-200 leading-none text-slate-500 outline-none transition hover:border-slate-300 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            aria-label="Close"
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
                <FormField label={`${t("Full Name")} *`} htmlFor="employee-full_name" error={fieldError("full_name")}>
                  <input
                    id="employee-full_name"
                    type="text"
                    required
                    autoComplete="off"
                    value={values.full_name}
                    onChange={(e) => onChange("full_name", e.target.value)}
                    placeholder={t("e.g. John Sey")}
                    className={inputClass("full_name")}
                    disabled={isSubmitting}
                  />
                </FormField>
              </div>

              <FormField label={`${t("Position")} *`} htmlFor="employee-position" error={fieldError("position")}>
                <input
                  id="employee-position"
                  type="text"
                  required
                  autoComplete="off"
                  value={values.position}
                  onChange={(e) => onChange("position", e.target.value)}
                  placeholder={t("e.g. Sales Executive")}
                  className={inputClass("position")}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label={`${t("Department")} *`} htmlFor="employee-department" error={fieldError("department")}>
                <RadioSelect
                  id="employee-department"
                  options={departments.map((dept) => ({ value: dept.department_code, label: dept.department_name }))}
                  value={values.department}
                  onSelect={(value) => onChange("department", value)}
                  invalid={missingFields.includes("department")}
                  placeholder={t("Select Department")}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label={`${t("Location")} *`} htmlFor="employee-location" error={fieldError("location")}>
                <input
                  id="employee-location"
                  type="text"
                  required
                  autoComplete="off"
                  value={values.location}
                  onChange={(e) => onChange("location", e.target.value)}
                  placeholder={t("e.g. VTE")}
                  className={inputClass("location")}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label={`${t("Staff Code")} *`} htmlFor="employee-staff_code" error={fieldError("staff_code")}>
                <input
                  id="employee-staff_code"
                  type="text"
                  required
                  autoComplete="off"
                  value={values.staff_code}
                  onChange={(e) => onChange("staff_code", e.target.value)}
                  placeholder={t("e.g. 1234dev")}
                  className={inputClass("staff_code")}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label={`${t("Phone")} *`} htmlFor="employee-phone" error={fieldError("phone")}>
                <input
                  id="employee-phone"
                  type="text"
                  required
                  autoComplete="off"
                  value={values.phone}
                  onChange={(e) => onChange("phone", e.target.value)}
                  placeholder={t("e.g. 0885564345")}
                  className={inputClass("phone")}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label={`${t("Sex")} *`} htmlFor="employee-sex" error={fieldError("sex")}>
                <RadioSelect
                  id="employee-sex"
                  options={[
                    { value: "Male", label: t("Male") },
                    { value: "Female", label: t("Female") },
                  ]}
                  value={values.sex}
                  onSelect={(value) => onChange("sex", value)}
                  invalid={missingFields.includes("sex")}
                  placeholder={t("Select Sex")}
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
              <RollingText text={isSubmitting ? t("Saving...") : isEdit ? t("Save changes") : t("Create")} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EmployeeDirectoryTable({
  employees,
  totalCount,
  isLoading,
  error,
  onRetry,
  page,
  pageCount,
  onPageChange,
  search = "",
  onViewDetail,
  onAddNew,
  onEdit,
  onDelete,
  canManage = true,
  canCreate = true,
}) {
  const { t } = useTranslation();
  const columns = [
    { key: "full_name", label: "Full Name", icon: UserIcon },
    { key: "position", label: "Position", icon: Briefcase },
    { key: "department_code", label: "Department", icon: Layers },
    { key: "sex", label: "Sex", icon: Users },
    { key: "staff_code", label: "Staff Code", icon: Hash },
    { key: "phone", label: "Phone", icon: Phone },
    { key: "location", label: "Location", icon: MapPin },
  ];

  return (
    <div className="rounded-xl bg-white dark:bg-slate-900">
      <div className="sticky top-14 z-20 flex flex-wrap items-center justify-between gap-3 bg-white py-2 dark:bg-slate-900">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Employees")}</h2>
          {!isLoading && !error && (
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              {t("employees_count", { count: totalCount })}
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
              <PlusCircle size={15} />
              <RollingText text={t("New Employee")} />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="px-5 py-10 text-center text-[13px] text-slate-500 dark:text-slate-400">{t("Loading employees...")}</div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
            <AlertTriangle size={18} />
          </div>
          <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{t("Couldn't load employees")}</p>
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
      ) : employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t("No employees found")}
          description={search ? t("No employee matches", { term: search }) : t("The employee directory is empty.")}
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            {/* border-separate (not the default collapse) so the hovered row
                can round its end cells — border-radius on a cell is ignored
                in the collapsed model. Row lines therefore live on the cells
                rather than on <tr>, which borders can't carry here. */}
            <table className="min-w-full border-separate border-spacing-0 text-left text-[13px]">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  {columns.map((column) => {
                    const ColumnIcon = column.icon;
                    // flex, not inline-flex: an inline box sits on the text
                    // baseline and leaves descender space underneath, which
                    // made the padding look uneven against the data rows.
                    return (
                      <th key={column.key} className="whitespace-nowrap border-y border-slate-100 px-5 py-2 font-semibold uppercase leading-none tracking-wide dark:border-slate-800">
                        <span className="flex items-center gap-1.5">
                          {ColumnIcon && <ColumnIcon size={13} className="shrink-0" />}
                          {t(column.label)}
                        </span>
                      </th>
                    );
                  })}
                  <th className="whitespace-nowrap border-y border-slate-100 px-5 py-2 text-right font-semibold uppercase leading-none tracking-wide dark:border-slate-800">
                    <span className="flex items-center justify-end gap-1.5">
                      <Settings size={13} className="shrink-0" />
                      {t("Action")}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => {
                  // Every cell keeps a full border at rest — top transparent,
                  // bottom the row separator — so hover only has to recolour
                  // it into a box around the row, with no 1px height jump.
                  // Only the top/bottom edges recolour on every cell — the
                  // side borders stay transparent except on the first and last
                  // cell, otherwise each column divider lights up too and the
                  // row reads as a grid instead of one card.
                  const cellClass =
                    "whitespace-nowrap border border-x-transparent border-t-transparent border-b-slate-50 bg-white px-5 py-2 group-hover:border-y-slate-200 dark:border-b-slate-800/60 dark:bg-slate-900 dark:group-hover:border-y-slate-700";
                  return (
                    <tr
                      key={employee.employee_id}
                      onClick={() => onViewDetail(employee)}
                      className="group cursor-pointer"
                    >
                      <td className={`${cellClass} rounded-l-lg font-semibold text-slate-950 group-hover:border-l-slate-200 dark:text-white dark:group-hover:border-l-slate-700`}>
                        <div className="flex items-center gap-2.5">
                          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                            <UserIcon size={13} />
                          </div>
                          {employee.full_name || "—"}
                        </div>
                      </td>
                      <td className={`${cellClass} text-slate-600 dark:text-slate-300`}>{employee.position || "—"}</td>
                      <td className={`${cellClass} text-slate-600 dark:text-slate-300`}>
                        {getEmployeeDepartmentCode(employee) || "—"}
                      </td>
                      <td className={`${cellClass} text-slate-600 dark:text-slate-300`}>{employee.sex || "—"}</td>
                      <td className={`${cellClass} text-slate-600 dark:text-slate-300`}>{employee.staff_code || "—"}</td>
                      <td className={`${cellClass} text-slate-600 dark:text-slate-300`}>{employee.phone || "—"}</td>
                      <td className={`${cellClass} text-slate-600 dark:text-slate-300`}>{employee.location || "—"}</td>
                      <td className={`${cellClass} rounded-r-lg text-right group-hover:border-r-slate-200 dark:group-hover:border-r-slate-700`}>
                        {/* stopPropagation: the whole row opens the detail
                            modal on click, so an action icon must not do both. */}
                        <div className="flex items-center justify-end gap-1">
                          {canManage && (
                            <>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onEdit(employee);
                                }}
                                title={t("Edit")}
                                aria-label={t("Edit")}
                                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
                              >
                                <Edit2 size={14} className="block" />
                              </button>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onDelete(employee);
                                }}
                                title={t("Delete")}
                                aria-label={t("Delete")}
                                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-rose-50 hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                              >
                                <Trash2 size={14} className="block" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalCount > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-3 border-t border-slate-100 px-5 py-3 text-[13px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <Pagination currentPage={page} pageCount={pageCount} onPageChange={onPageChange} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function EmployeeDetailModal({
  employee,
  devices,
  isLoading,
  error,
  onRetry,
  onClose,
  onUnassign,
  canManage = true,
}) {
  const { t } = useTranslation();
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60"
        onClick={onClose}
        aria-label="Close detail"
      />
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-black/40">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{employee.full_name || "Employee"}</h2>
              {employee.is_active === false && (
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                  {t("Inactive")}
                </span>
              )}
              {employee.left_date && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {t("Left", { date: formatFieldValue(employee.left_date) })}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onClose}
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-slate-200 leading-none text-slate-500 outline-none transition hover:border-slate-300 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800"
              aria-label="Close"
            >
              <X size={15} className="block" />
            </button>
          </div>
        </div>

        <div className="border-b border-slate-100 bg-slate-50/40 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40">
          <dl className="grid grid-cols-[max-content_1fr_max-content_1fr] items-baseline gap-x-4 gap-y-2 pl-4 text-[13px] text-slate-700 dark:text-slate-300">
            {[
              ["Position", employee.position],
              ["Department", getEmployeeDepartmentCode(employee)],
              ["Location", employee.location],
              ["Staff Code", employee.staff_code],
              ["Phone", employee.phone],
              ["Sex", employee.sex],
            ].map(([label, value]) => (
              <Fragment key={label}>
                <dt className="font-semibold text-slate-800 dark:text-slate-200">{t(label)}</dt>
                <dd className="min-w-0 truncate">: {formatFieldValue(value)}</dd>
              </Fragment>
            ))}
          </dl>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="py-10 text-center text-[13px] text-slate-500 dark:text-slate-400">{t("Loading details...")}</div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
                <AlertTriangle size={18} />
              </div>
              <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{t("Couldn't load details")}</p>
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
          ) : devices.length === 0 ? (
            <EmptyState
              icon={Box}
              title={t("No equipment records")}
              description={t("This employee has no equipment assigned.")}
            />
          ) : (
            <div className="space-y-5">
              {devices.map((device, idx) => {
                const columns = device.columns || [];
                const softwareColumns = columns.filter(
                  ({ field, header }) => /license/i.test(field) || /license/i.test(header)
                );
                const hardwareColumns = columns.filter((column) => !softwareColumns.includes(column));
                const hasSoftware = softwareColumns.length > 0 || device.licenses?.length > 0;

                return (
                  <div key={device.equipment_id ?? idx} className="rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
                      <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                        {t("device_numbered", { count: idx + 1 })}
                      </p>
                      {canManage && onUnassign && device.equipment_id && (
                        <button
                          type="button"
                          onClick={() => onUnassign({ equipment_id: device.equipment_id, category: device.category, ...device.item })}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
                        >
                          {t("Unassign")}
                        </button>
                      )}
                    </div>
                    <div
                      className={`grid grid-cols-1 gap-x-6 gap-y-4 p-4 ${hasSoftware ? "sm:grid-cols-2 sm:divide-x sm:divide-slate-100 dark:sm:divide-slate-800" : ""
                        }`}
                    >
                      <div className={hasSoftware ? "sm:pr-6" : ""}>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{t("Hardware")}</p>
                        <dl className="grid grid-cols-[max-content_1fr] items-baseline gap-x-4 gap-y-2 text-[13px] text-slate-700 dark:text-slate-300">
                          {hardwareColumns.map(({ field, header }) => (
                            <Fragment key={field}>
                              <dt className="font-semibold text-slate-800 dark:text-slate-200">{header}</dt>
                              <dd className="min-w-0 truncate" title={formatFieldValue(device.item?.[field])}>
                                : {formatFieldValue(device.item?.[field])}
                              </dd>
                            </Fragment>
                          ))}
                        </dl>
                      </div>
                      {hasSoftware && (
                        <div className="sm:pl-6">
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{t("Software")}</p>
                          <dl className="grid grid-cols-[max-content_1fr] items-baseline gap-x-4 gap-y-2 text-[13px] text-slate-700 dark:text-slate-300">
                            {softwareColumns.map(({ field, header }) => (
                              <Fragment key={field}>
                                <dt className="font-semibold text-slate-800 dark:text-slate-200">{header}</dt>
                                <dd className="min-w-0 truncate" title={formatFieldValue(device.item?.[field])}>
                                  : {formatFieldValue(device.item?.[field])}
                                </dd>
                              </Fragment>
                            ))}
                            {device.licenses?.length > 0 && (
                              <Fragment>
                                <dt className="font-semibold text-slate-800 dark:text-slate-200">{t("Software Licenses")}</dt>
                                <dd className="min-w-0 truncate">
                                  : {device.licenses.map((license) => license.product_name).filter(Boolean).join(", ")}
                                </dd>
                              </Fragment>
                            )}
                          </dl>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}