import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiActivity as Activity,
  FiAlertTriangle as AlertTriangle,
  FiEdit2 as Edit2,
  FiKey as Key,
  FiPlusCircle as PlusCircle,
  FiRefreshCw as RefreshCw,
  FiSearch as Search,
  FiTrash2 as Trash2,
  FiX as X,
} from "react-icons/fi";
import { licenseColumns } from "../../dashboard.config";
import { getLicenseExpiryInfo } from "../../dashboard.notifications";
import { formatFieldValue } from "../../dashboard.utils";
import { translateLabel } from "../../../../lib/i18nLabel";
import { RecordCellValue, RecordsTableView } from "../../components/RecordsTableView";
import { DatePicker, DateRangePicker } from "../../components/DatePickers";
import { EmptyState, FormField, formInputClass, formInvalidClass, Pagination, RadioSelect, RollingText } from "../../components/SharedControls";

function LicenseStatusCell({ license }) {
  const { t, i18n } = useTranslation();
  const status = String(license.status || "").toLowerCase();
  const translatedStatus = translateLabel(t, i18n, license.status);

  if (!status) return <span className="text-slate-400 dark:text-slate-500">{t("N/A")}</span>;

  if (status.includes("expired")) {
    return <span className="font-semibold text-rose-600 dark:text-rose-400">{translatedStatus}</span>;
  }

  if (status.includes("near expire") || status.includes("expiring")) {
    return <span className="font-semibold text-amber-600 dark:text-amber-400">{translatedStatus}</span>;
  }

  if (status.includes("active")) {
    return <span className="font-semibold text-emerald-600 dark:text-emerald-400">{translatedStatus}</span>;
  }

  return <span>{translatedStatus}</span>;
}

export function LicenseFormModal({
  missingFields = [],
  isOpen,
  mode,
  values,
  onChange,
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

  const isEdit = mode === "edit";
  const requiresExpiry = values.license_type === "Annual Subscription";
  // Our own "required" message, in place of the browser's bubble - the form
  // is noValidate below so only this one ever shows.
  const fieldError = (key) => (missingFields.includes(key) ? t("This field is required.") : null);
  const inputClass = (key) => (missingFields.includes(key) ? `${formInputClass} ${formInvalidClass}` : formInputClass);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60"
        onClick={onClose}
        aria-label={t("Close")}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-black/40">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">
              {isEdit ? t("Edit software license") : t("Add software license")}
            </h2>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              {isEdit ? t("Update this software license's details.") : t("Create a new software license renewal record.")}
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
                <FormField label={t("Product Name *")} htmlFor="license-product-name" error={fieldError("product_name")}>
                  <input
                    id="license-product-name"
                    type="text"
                    required
                    autoComplete="off"
                    value={values.product_name}
                    onChange={(e) => onChange("product_name", e.target.value)}
                    placeholder={t("e.g. Kaspersky")}
                    className={inputClass("product_name")}
                    disabled={isSubmitting}
                  />
                </FormField>
              </div>

              <FormField label={t("License Type *")} htmlFor="license-license-type" error={fieldError("license_type")}>
                <RadioSelect
                  id="license-license-type"
                  options={[
                    { value: "Free", label: t("Free") },
                    { value: "Annual Subscription", label: t("Annual Subscription") },
                    { value: "Perpetual", label: t("Perpetual") },
                  ]}
                  value={values.license_type}
                  onSelect={(value) => onChange("license_type", value)}
                  placeholder={t("Select license type...")}
                  disabled={isSubmitting}
                  invalid={missingFields.includes("license_type")}
                />
              </FormField>

              <FormField label={`${t("Product Type")} *`} htmlFor="license-product-type" error={fieldError("product_type")}>
                <input
                  id="license-product-type"
                  type="text"
                  required
                  autoComplete="off"
                  value={values.product_type}
                  onChange={(e) => onChange("product_type", e.target.value)}
                  placeholder={t("e.g. Antivirus")}
                  className={inputClass("product_type")}
                  disabled={isSubmitting}
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField label={`${t("Remark")} *`} htmlFor="license-remark" error={fieldError("remark")}>
                  <textarea
                    id="license-remark"
                    rows={3}
                    required
                    value={values.remark}
                    onChange={(e) => onChange("remark", e.target.value)}
                    placeholder={t("e.g. This license is for the company only.")}
                    className={`${inputClass("remark")} h-auto min-h-24 py-2`}
                    disabled={isSubmitting}
                  />
                </FormField>
              </div>

              <FormField label={`${t("Date Start")} *`} htmlFor="license-date-start" error={fieldError("date_start")}>
                <DatePicker
                  id="license-date-start"
                  value={values.date_start}
                  onChange={(day) => onChange("date_start", day)}
                  disabled={isSubmitting}
                  invalid={missingFields.includes("date_start")}
                />
              </FormField>

              <FormField
                label={requiresExpiry ? t("Date Expire *") : t("Date Expire")}
                htmlFor="license-date-expire"
                error={fieldError("date_expire")}
              >
                <DatePicker
                  id="license-date-expire"
                  value={values.date_expire}
                  onChange={(day) => onChange("date_expire", day)}
                  disabled={isSubmitting || !requiresExpiry}
                  invalid={missingFields.includes("date_expire")}
                />
              </FormField>

              {!requiresExpiry && (
                <div className="sm:col-span-2 -mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {values.license_type === "Perpetual"
                    ? t("Perpetual licenses are bought once and never expire, so no expiry date is needed.")
                    : t("Free licenses are always active, so no expiry date is needed.")}
                </div>
              )}
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
              <RollingText text={isSubmitting ? t("Saving...") : isEdit ? t("Save changes") : t("Add software license")} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function LicensesView({
  licenses,
  isLoading,
  error,
  onRetry,
  onAddNew,
  onEdit,
  onDelete,
  canCreate = true,
  canManage = true,
}) {
  const { t } = useTranslation();
  const statusCounts = useMemo(() => {
    const counts = { expired: 0, nearExpire: 0, active: 0 };
    licenses.forEach((license) => {
      const status = String(license.status || "").toLowerCase();
      if (status.includes("expired")) counts.expired += 1;
      else if (status.includes("near expire") || status.includes("expiring")) counts.nearExpire += 1;
      else if (status.includes("active")) counts.active += 1;
    });
    return counts;
  }, [licenses]);

  // License IDs aren't sequential (16, 17, 2, 1...), so hide that column and
  // number rows ourselves instead.
  const numberedLicenses = useMemo(
    () => licenses.map((license, index) => ({ ...license, _row_number: index + 1 })),
    [licenses]
  );
  const numberedColumns = useMemo(
    () => [{ key: "_row_number", label: "No." }, ...licenseColumns.filter((column) => column.key !== "license_id")],
    []
  );

  return (
    <RecordsTableView
      records={numberedLicenses}
      columnsConfig={numberedColumns}
      title={t("Software License")}
      recordLabel="software license"
      loadingText={t("Loading software licenses...")}
      errorTitle={t("Couldn't load software licenses")}
      emptyIcon={Key}
      emptyTitle={t("No software licenses found")}
      emptyDescription={t("Software license records will appear here.")}
      rowKey={(license, index) => license.license_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      hideRefresh
      headerActions={
        <>
          <span className="rounded-full bg-rose-50 px-3 py-1 text-[13px] font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {t("expired_count", { count: statusCounts.expired })}
          </span>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-[13px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            {t("near_expire_count", { count: statusCounts.nearExpire })}
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[13px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            {t("active_count", { count: statusCounts.active })}
          </span>
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
          {canCreate && (
            <button
              type="button"
              onClick={onAddNew}
              className="group/roll inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#fddd1c] px-3.5 text-[13px] font-semibold text-slate-900 outline-none transition hover:bg-[#e5c518] focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-[#fddd1c] dark:text-slate-900 dark:hover:bg-[#e5c518] dark:focus-visible:ring-offset-slate-900"
            >
              <PlusCircle size={15} />
              <RollingText text={t("Add Software License")} />
            </button>
          )}
        </>
      }
      getRowClassName={(license) => {
        const info = getLicenseExpiryInfo(license);
        if (info?.isExpired) return "bg-rose-50/50 hover:bg-rose-50 dark:bg-rose-950/20 dark:hover:bg-rose-950/30";
        if (info) return "bg-amber-50/50 hover:bg-amber-50 dark:bg-amber-950/20 dark:hover:bg-amber-950/30";
        return "";
      }}
      renderCell={(license, column) => {
        if (column.key === "status") return <LicenseStatusCell license={license} />;
        return <RecordCellValue value={license[column.key]} />;
      }}
      renderRowActions={
        canManage &&
        ((license) => (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => onEdit(license)}
              title={t("Edit")}
              aria-label={t("Edit")}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
            >
              <Edit2 size={14} className="block" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(license)}
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

// Matches the "Plan optimize" capacity-planning sheet this data comes from —
// a grouped, spreadsheet-style header (Total Capacity/Usage/Reducing/After
// Reducing bands) instead of the app's usual flat column list, since that
// grouping is the whole point of this particular table. The header's own
// fixed light background is a deliberate design choice (like conditional
// formatting in the source sheet), not tied to the app's light/dark toggle.
// The header keeps its ruled grid — the three stacked rows (group / field /
// unit) need the lines to show which columns each group covers. Only left and
// top edges are drawn, plus the closing right/bottom: the table is
// border-separate (so the hovered row can round its ends), and under that
// model borders no longer collapse, so bordering all four sides would paint
// every interior rule twice.
const SERVER_USAGE_HEAD_BASE =
  "border-slate-200 bg-[#f9fbfc] px-3 text-center text-xs font-bold uppercase tracking-wide text-slate-900 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200";
const SERVER_USAGE_BASE_CELL = `${SERVER_USAGE_HEAD_BASE} border-y border-l py-3`;
// Closes the right-hand edge of the header block.
const SERVER_USAGE_BASE_CELL_LAST = `${SERVER_USAGE_BASE_CELL} border-r`;
const SERVER_USAGE_GROUP_CELL = `${SERVER_USAGE_HEAD_BASE} border-l border-t py-2`;
const SERVER_USAGE_FIELD_CELL = `${SERVER_USAGE_HEAD_BASE} border-l border-t py-1.5 normal-case`;
const SERVER_USAGE_UNIT_CELL = `${SERVER_USAGE_HEAD_BASE} border-y border-l py-1 text-[10px] font-medium normal-case text-slate-500 dark:text-slate-400`;
// Every cell keeps a full border at rest — top transparent, bottom the row
// separator — so hover only recolours it into a card around the row, with no
// 1px height jump.
const SERVER_USAGE_DATA_CELL =
  "border border-x-transparent border-t-transparent border-b-slate-50 bg-white px-5 py-2 whitespace-nowrap text-slate-700 group-hover:border-y-slate-200 dark:border-b-slate-800/60 dark:bg-slate-900 dark:text-slate-300 dark:group-hover:border-y-slate-700";
const SERVER_USAGE_ROUND_LEFT = "rounded-l-lg group-hover:border-l-slate-200 dark:group-hover:border-l-slate-700";
const SERVER_USAGE_ROUND_RIGHT = "rounded-r-lg group-hover:border-r-slate-200 dark:group-hover:border-r-slate-700";

const SERVER_USAGE_PAGE_SIZE = 20;

export function ServerUsageView({
  usage,
  isLoading,
  error,
  onRetry,
  onEdit,
  dateRange = { from: "", to: "" },
  onDateRangeChange,
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const hasActiveDateRange = Boolean(dateRange.from || dateRange.to);

  const filteredUsage = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return usage;
    return usage.filter((record) =>
      [record.device_name, record.ip_address, record.owner_name].some((value) =>
        String(value ?? "").toLowerCase().includes(term)
      )
    );
  }, [usage, search]);

  // A new search means a whole new result set — start back on page 1 rather
  // than stranding the user on a page number that may no longer exist.
  // Adjusted during render (not an effect) per React's guidance for
  // resetting state when a prop/derived value changes.
  const [prevSearch, setPrevSearch] = useState(search);
  if (search !== prevSearch) {
    setPrevSearch(search);
    setPage(1);
  }
  const [prevDateRange, setPrevDateRange] = useState(dateRange);
  if (dateRange.from !== prevDateRange.from || dateRange.to !== prevDateRange.to) {
    setPrevDateRange(dateRange);
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(filteredUsage.length / SERVER_USAGE_PAGE_SIZE));
  const paginatedUsage = filteredUsage.slice((page - 1) * SERVER_USAGE_PAGE_SIZE, page * SERVER_USAGE_PAGE_SIZE);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-xl bg-white dark:bg-slate-900">
        {/* z-20 matches the other pages' sticky bars, so a hovered row passes
            under this one rather than over it. */}
        <div className="sticky top-14 z-20 flex flex-wrap items-center justify-between gap-3 bg-white py-2 dark:bg-slate-900">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Server Usage")}</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                {t("usage_count", { count: filteredUsage.length })}
              </p>
            )}
          </div>
          {!isLoading && !error && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-96">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
                <input
                  id="server-usage-search"
                  type="text"
                  autoComplete="off"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("Name / IP Address / Owner")}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-9 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label={t("Clear search")}
                    className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  >
                    <X size={13} className="block" />
                  </button>
                )}
              </div>

              {onDateRangeChange && (
                <DateRangePicker
                  from={dateRange.from}
                  to={dateRange.to}
                  onApply={(from, to) => {
                    onDateRangeChange("from", from);
                    onDateRangeChange("to", to);
                  }}
                />
              )}

              <button
                type="button"
                onClick={onRetry}
                title={t("Refresh")}
                aria-label={t("Refresh")}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
              >
                <RefreshCw size={15} />
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="px-5 py-10 text-center text-[13px] text-slate-500 dark:text-slate-400">{t("Loading server usage...")}</div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertTriangle size={18} />
            </div>
            <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{t("Couldn't load server usage")}</p>
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
        ) : usage.length === 0 ? (
          <EmptyState
            icon={Activity}
            title={t("No server usage found")}
            description={
              hasActiveDateRange
                ? t("No server usage in this date range.")
                : t("Server usage records will appear here.")
            }
          />
        ) : filteredUsage.length === 0 ? (
          <EmptyState icon={Activity} title={t("No server usage found")} description={t("No server usage matches", { term: search })} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-left text-[13px]">
              <thead>
                <tr>
                  <th rowSpan={3} className={SERVER_USAGE_BASE_CELL}>{t("No.")}</th>
                  <th rowSpan={3} className={SERVER_USAGE_BASE_CELL}>{t("Due Date")}</th>
                  <th rowSpan={3} className={SERVER_USAGE_BASE_CELL}>{t("Name")}</th>
                  <th rowSpan={3} className={SERVER_USAGE_BASE_CELL}>{t("IP Address")}</th>
                  <th colSpan={3} className={SERVER_USAGE_GROUP_CELL}>{t("Total Capacity")}</th>
                  <th colSpan={3} className={`${SERVER_USAGE_GROUP_CELL} border-r`}>{t("Usage")}</th>
                  <th rowSpan={3} className={SERVER_USAGE_BASE_CELL_LAST}>{t("Owner")}</th>
                </tr>
                <tr>
                  <th className={SERVER_USAGE_FIELD_CELL}>{t("CPU")}</th>
                  <th className={SERVER_USAGE_FIELD_CELL}>{t("Memory")}</th>
                  <th className={SERVER_USAGE_FIELD_CELL}>{t("HDD")}</th>
                  <th className={SERVER_USAGE_FIELD_CELL}>{t("CPU")}</th>
                  <th className={SERVER_USAGE_FIELD_CELL}>{t("Memory")}</th>
                  <th className={`${SERVER_USAGE_FIELD_CELL} border-r`}>{t("HDD")}</th>
                </tr>
                <tr>
                  {/* Usage's CPU/Memory are percentages in the real data, not
                      GB — labeled accurately here rather than copying the
                      sheet's "GB" for all three. */}
                  <th className={SERVER_USAGE_UNIT_CELL}>Core</th>
                  <th className={SERVER_USAGE_UNIT_CELL}>GB</th>
                  <th className={SERVER_USAGE_UNIT_CELL}>GB</th>
                  <th className={SERVER_USAGE_UNIT_CELL}>%</th>
                  <th className={SERVER_USAGE_UNIT_CELL}>%</th>
                  <th className={`${SERVER_USAGE_UNIT_CELL} border-r`}>GB</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsage.map((record, index) => (
                  <tr
                    key={record.usage_id ?? index}
                    onClick={onEdit ? () => onEdit(record) : undefined}
                    className={onEdit ? "group cursor-pointer" : undefined}
                  >
                    <td className={`${SERVER_USAGE_DATA_CELL} ${SERVER_USAGE_ROUND_LEFT}`}>
                      {(page - 1) * SERVER_USAGE_PAGE_SIZE + index + 1}
                    </td>
                    <td className={SERVER_USAGE_DATA_CELL}>{formatFieldValue(record.due_date)}</td>
                    <td className={SERVER_USAGE_DATA_CELL}>{formatFieldValue(record.device_name)}</td>
                    <td className={SERVER_USAGE_DATA_CELL}>{formatFieldValue(record.ip_address)}</td>
                    <td className={SERVER_USAGE_DATA_CELL}>{formatFieldValue(record.cpu_core_total)}</td>
                    <td className={SERVER_USAGE_DATA_CELL}>{formatFieldValue(record.memory_gb_total)}</td>
                    <td className={SERVER_USAGE_DATA_CELL}>{formatFieldValue(record.hdd_gb_total)}</td>
                    <td className={SERVER_USAGE_DATA_CELL}>{formatFieldValue(record.cpu_usage_pct)}</td>
                    <td className={SERVER_USAGE_DATA_CELL}>{formatFieldValue(record.memory_usage_pct)}</td>
                    <td className={SERVER_USAGE_DATA_CELL}>{formatFieldValue(record.hdd_usage_gb)}</td>
                    <td className={`${SERVER_USAGE_DATA_CELL} ${SERVER_USAGE_ROUND_RIGHT}`}>
                      {formatFieldValue(record.owner_name)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !error && filteredUsage.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 border-t border-slate-100 px-5 py-3 dark:border-slate-800">
            <Pagination currentPage={page} pageCount={pageCount} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}

// Any logged-in user with access to this page can update these 3 usage
// numbers via PATCH /api/server-usage/equipment/:equipment_id/usage — the
// "Total Capacity" numbers (cpu_core_total/memory_gb_total/hdd_gb_total)
// aren't part of this form; those still need an admin via the Configure/Add
// flow. The backend creates the usage row automatically the first time a
// server's usage is set through this form, so there's no separate "add" flow.
export function ServerUsageEditModal({ target, values, onChange, onSubmit, onClose, isSubmitting, error }) {
  const { t } = useTranslation();

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!target) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-950/60" onClick={onClose} aria-label={t("Close")} />
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-black/40">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Edit usage")}</h2>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              {target.device_name || t("Update this server's usage numbers.")}
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

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
          <div className="overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                {t(error)}
              </div>
            )}
            <div className="grid gap-4">
              <FormField label={t("CPU Usage (%)")} htmlFor="server-usage-cpu">
                <input
                  id="server-usage-cpu"
                  type="text"
                  autoComplete="off"
                  value={values.cpu_usage_pct}
                  onChange={(e) => onChange("cpu_usage_pct", e.target.value)}
                  placeholder={t("e.g. 45")}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>
              <FormField label={t("Memory Usage (%)")} htmlFor="server-usage-memory">
                <input
                  id="server-usage-memory"
                  type="text"
                  autoComplete="off"
                  value={values.memory_usage_pct}
                  onChange={(e) => onChange("memory_usage_pct", e.target.value)}
                  placeholder={t("e.g. 60")}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>
              <FormField label={t("HDD Usage (GB)")} htmlFor="server-usage-hdd">
                <input
                  id="server-usage-hdd"
                  type="text"
                  autoComplete="off"
                  value={values.hdd_usage_gb}
                  onChange={(e) => onChange("hdd_usage_gb", e.target.value)}
                  placeholder={t("e.g. 250")}
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
