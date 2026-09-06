import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { FiAlertTriangle as AlertTriangle, FiChevronDown as ChevronDown, FiMonitor as Monitor, FiPlusCircle as PlusCircle, FiRefreshCw as RefreshCw, FiSearch as Search, FiX as X } from "react-icons/fi";
import { PART_ACTION_OPTIONS } from "../../dashboard.config";
import { formatFieldValue, getEquipmentDisplayName } from "../../dashboard.utils";
import { EmptyState, formInputClass, Pagination, RadioSelect, RollingText } from "../../components/SharedControls";
import { DynamicEquipmentTable } from "../../components/DynamicEquipmentTable";
import { CategoryTabs } from "../../components/CategoryTabs";
import { AddStockDialog } from "../../components/AddStockDialog";

// "16 GB · DDR5 (412 available)" — whichever identifying fields this stock
// line has (part_value/ram_type for RAM, model_name/number for CPU etc.).
function getStockOptionLabel(item, t) {
  const bits = [item.part_value, item.ram_type, item.model_name, item.model_number, item.disk_type, item.disk_interface].filter(
    (value) => value && String(value).trim()
  );
  const label = bits.length ? bits.join(" · ") : t("Unlabeled");
  return `${label} (${item.quantity} available)`;
}

// Radio-style list for picking a stock line — no search box, since these
// lists are short (a handful of lines per part). Rendered through a portal
// with fixed positioning so it isn't clipped by the dialog's own scrolling
// content area, the way an absolutely-positioned panel would be.
function StockLineSelect({ id, options, selectedId, onSelect, placeholder }) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t("Select a stock line...");
  const [isOpen, setIsOpen] = useState(false);
  const [menuRect, setMenuRect] = useState(null);
  const containerRef = useRef(null);
  const menuRef = useRef(null);

  function updateMenuRect() {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMenuRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }

  useEffect(() => {
    if (!isOpen) return;

    updateMenuRect();

    function handlePointerDown(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updateMenuRect);
    window.addEventListener("scroll", updateMenuRect, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updateMenuRect);
      window.removeEventListener("scroll", updateMenuRect, true);
    };
  }, [isOpen]);

  const selectedOption = options.find((option) => String(option.stock_id) === String(selectedId));

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        id={id}
        onClick={() => setIsOpen((value) => !value)}
        className={`${formInputClass} flex items-center justify-between text-left`}
      >
        <span className={`truncate ${selectedOption ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}`}>
          {selectedOption ? getStockOptionLabel(selectedOption, t) : resolvedPlaceholder}
        </span>
        <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform dark:text-slate-500 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen &&
        menuRect &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: menuRect.top, left: menuRect.left, width: menuRect.width }}
            className="z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="max-h-56 overflow-y-auto p-1.5">
              {options.map((option) => {
                const isSelected = String(option.stock_id) === String(selectedId);
                return (
                  <button
                    key={option.stock_id}
                    type="button"
                    onClick={() => {
                      onSelect(option.stock_id);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 ${isSelected ? "text-orange-700 dark:text-orange-400" : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                      }`}
                  >
                    <span
                      className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 ${isSelected ? "border-orange-500" : "border-slate-300 dark:border-slate-600"
                        }`}
                    >
                      {isSelected && <span className="h-2 w-2 rounded-full bg-orange-500" />}
                    </span>
                    <span className="truncate">{getStockOptionLabel(option, t)}</span>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export function DeviceReplacementCategoryBar({ categories = [], selected, onSelect }) {
  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: category.category_name, label: category.category_name })),
    [categories]
  );

  return (
    <div className="rounded-xl bg-white dark:bg-slate-900">
      <CategoryTabs options={categoryOptions} selected={selected} onSelect={onSelect} centered />
    </div>
  );
}

const REPLACEABLE_PAGE_SIZE = 20;

export function ReplaceableDevicesView({
  devices,
  columns = [],
  isLoading,
  error,
  onRetry,
  canManage = true,
  onOpenReplaceDialog,
  search = "",
  onSearchChange,
  selectedCategory,
}) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  // A new search or category means a whole new result set — start back on
  // page 1 rather than stranding the user on a page number that may not
  // exist. Adjusted during render (not an effect) per React's guidance for
  // resetting state when a prop changes.
  const [prevSearch, setPrevSearch] = useState(search);
  if (search !== prevSearch) {
    setPrevSearch(search);
    setPage(1);
  }
  const [prevCategory, setPrevCategory] = useState(selectedCategory);
  if (selectedCategory !== prevCategory) {
    setPrevCategory(selectedCategory);
    setPage(1);
  }

  // The backend's own equipment_id isn't sequential (and we dropped its "No."
  // column), so number rows 1..n ourselves, matching whatever's on screen.
  const numberedDevices = useMemo(
    () => devices.map((device, index) => ({ ...device, _row_number: index + 1 })),
    [devices]
  );
  const numberedColumns = useMemo(() => [{ key: "_row_number", label: "No." }, ...columns], [columns]);

  const pageCount = Math.max(1, Math.ceil(numberedDevices.length / REPLACEABLE_PAGE_SIZE));
  const paginatedDevices = numberedDevices.slice((page - 1) * REPLACEABLE_PAGE_SIZE, page * REPLACEABLE_PAGE_SIZE);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-xl bg-white dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 py-2">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Devices you can replace")}</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                {t("device_count", { count: devices.length })}
                {canManage && devices.length > 0 ? ` · ${t("These devices have owners, click to replace devices")}` : ""}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onSearchChange && (
              <div className="relative w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
                <input
                  id="replaceable-devices-search"
                  type="text"
                  autoComplete="off"
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={t("Search Employee")}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-8 text-sm outline-none transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 "
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => onSearchChange("")}
                    aria-label={t("Clear search")}
                    className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={onRetry}
              disabled={isLoading}
              title={t("Refresh")}
              aria-label={t("Refresh")}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <DynamicEquipmentTable
          columns={numberedColumns}
          records={paginatedDevices}
          rowKey={(device, index) => device.equipment_id ?? index}
          isLoading={isLoading}
          loadingText={t("Loading devices...")}
          error={error}
          errorTitle={t("Couldn't load devices")}
          onRetry={onRetry}
          emptyIcon={Search}
          emptyTitle={t("No devices found")}
          emptyDescription={t("Owned devices will appear here.")}
          onRowClick={canManage ? onOpenReplaceDialog : undefined}
        />

        {!isLoading && !error && numberedDevices.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 border-t border-slate-100 px-5 py-3 dark:border-slate-800">
            <Pagination currentPage={page} pageCount={pageCount} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}

// "Kaisone Inthisane" -> "KI" for the avatar circle.
function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
  return initials || "?";
}

// RAM's value is a bare number ("16") everywhere else in the app (device
// fields, stock lines) — only here, next to an arrow with no other context,
// does it need the unit spelled out to read as a capacity at a glance.
function formatPartValue(partName, value, t) {
  if (value === null || value === undefined || value === "") return t("Empty");
  if (partName?.trim().toLowerCase() === "ram" && /^\d+(\.\d+)?$/.test(String(value).trim())) {
    return `${value} GB`;
  }
  return String(value);
}

function formatDetailValue(key, value) {
  if (value === null || value === undefined || value === "") return null;
  if (key === "action") return String(value).charAt(0).toUpperCase() + String(value).slice(1);
  return formatFieldValue(value);
}

// The API's part-replacement records only ever carry these — there's no
// old_computer_name/new_device_model/old_bag/etc. (that shape belonged to a
// whole-device replacement flow that was removed as a product decision).
// Each is shown only when it actually has a value.
const REPLACEMENT_DETAIL_FIELDS = [
  ["action", "Action"],
  ["reason", "Reason"],
  ["remark", "Remark"],
  ["replaced_by", "Replaced By"],
];

// 1 -> "1st", 2 -> "2nd", 11 -> "11th", etc.
function formatOrdinal(n) {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

// One row per employee in the table — `group.latestEntry` is the most
// recent replacement, used for the row's Computer/Asset Code/Category/Date.
// The full chronological list lives in the detail popup.
function ReplacementHistoryRow({ group, onViewDetails }) {
  const { t } = useTranslation();
  const latest = group.latestEntry;
  const deviceLabel = latest.computer_name || latest.device_name || latest.device_model || latest.asset_code || "—";

  // Every cell keeps a full border at rest — top transparent, bottom the row
  // separator — so hover only recolours it into a card around the row, with no
  // 1px height jump.
  const cellClass =
    "whitespace-nowrap border border-x-transparent border-t-transparent border-b-slate-50 bg-white px-5 py-2 group-hover:border-y-slate-200 dark:border-b-slate-800/60 dark:bg-slate-900 dark:group-hover:border-y-slate-700";

  return (
    <tr onClick={() => onViewDetails(group)} className="group cursor-pointer">
      <td className={`${cellClass} rounded-l-lg group-hover:border-l-slate-200 dark:group-hover:border-l-slate-700`}>
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {getInitials(group.owner_name)}
          </span>
          <span className="font-semibold text-slate-900 dark:text-white">{group.owner_name || "—"}</span>
        </div>
      </td>
      <td className={`${cellClass} text-slate-600 dark:text-slate-300`}>{group.staff_code || "—"}</td>
      <td className={cellClass}>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <Monitor size={12} className="shrink-0 text-slate-400 dark:text-slate-500" />
          {deviceLabel}
        </span>
      </td>
      <td className={`${cellClass} text-slate-600 dark:text-slate-300`}>{latest.asset_code || "—"}</td>
      <td className={`${cellClass} text-slate-600 dark:text-slate-300`}>{latest.category_name || "—"}</td>
      <td className={`${cellClass} rounded-r-lg group-hover:border-r-slate-200 dark:group-hover:border-r-slate-700`}>
        <div className="inline-flex items-center gap-2 text-[13px]">
          <span className="font-semibold text-slate-700 dark:text-slate-300">{latest.part_name || t("Part")}</span>
          <span className="rounded-md bg-rose-50 px-2 py-0.5 font-mono text-xs font-semibold text-rose-600 line-through dark:bg-rose-950/40 dark:text-rose-400">
            {formatPartValue(latest.part_name, latest.old_value, t)}
          </span>
          <span className="text-slate-300 dark:text-slate-600">&rarr;</span>
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            {formatPartValue(latest.part_name, latest.new_value, t)}
          </span>
          {group.count > 1 && (
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{t("more_count", { count: group.count - 1 })}</span>
          )}
        </div>
      </td>
    </tr>
  );
}

// One entry in the popup's history list — same part-change pill as the
// table row, plus whichever real detail fields (action/reason/remark/
// replaced_by) this specific replacement has.
function ReplacementHistoryEntry({ entry }) {
  const { t } = useTranslation();
  const deviceLabel = entry.computer_name || entry.device_name || entry.device_model || entry.asset_code || "—";
  const detailEntries = REPLACEMENT_DETAIL_FIELDS.map(([key, label]) => [key, label, formatDetailValue(key, entry[key])]).filter(
    ([, , value]) => value !== null
  );

  return (
    <div className="px-6 py-4">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {formatOrdinal(entry._occurrence)} {t("Replacement")}
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500">{formatReplacementDate(entry.replacement_date)}</span>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-2 text-[13px]">
        <span className="font-semibold text-slate-700 dark:text-slate-300">{entry.part_name || t("Part")}</span>
        <span className="rounded-md bg-rose-50 px-2 py-0.5 font-mono text-xs font-semibold text-rose-600 line-through dark:bg-rose-950/40 dark:text-rose-400">
          {formatPartValue(entry.part_name, entry.old_value, t)}
        </span>
        <span className="text-slate-300 dark:text-slate-600">&rarr;</span>
        <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          {formatPartValue(entry.part_name, entry.new_value, t)}
        </span>
      </div>

      <p className="mb-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
        <Monitor size={12} className="shrink-0 text-slate-400 dark:text-slate-500" />
        {deviceLabel}
        {entry.asset_code ? ` · ${entry.asset_code}` : ""}
      </p>

      {detailEntries.length > 0 && (
        <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-xs">
          {detailEntries.map(([key, label, value]) => (
            <Fragment key={key}>
              <dt className="font-semibold text-slate-600 dark:text-slate-400">{t(label)}</dt>
              <dd className="min-w-0 truncate text-slate-500 dark:text-slate-400">{value}</dd>
            </Fragment>
          ))}
        </dl>
      )}
    </div>
  );
}

function ReplacementDetailModal({ group, onClose }) {
  const { t } = useTranslation();

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!group) return null;

  const latest = group.latestEntry;
  const deviceLabel = latest.computer_name || latest.device_name || latest.device_model || latest.asset_code || "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-950/60" onClick={onClose} aria-label={t("Close")} />
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-black/40">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{group.owner_name || t("Replacement")}</h2>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {t("replacement_count", { count: group.count })}
              </span>
            </div>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              {group.staff_code ? `${group.staff_code} · ` : ""}
              {deviceLabel}
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

        <div className="divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
          {group.displayEntries.map((entry) => (
            <ReplacementHistoryEntry key={entry.replacement_id ?? entry._occurrence} entry={entry} />
          ))}
        </div>
      </div>
    </div>
  );
}

function formatReplacementDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const HISTORY_PAGE_SIZE = 20;

export function ReplacementHistoryView({
  replacements,
  isLoading,
  error,
  onRetry,
}) {
  const { t } = useTranslation();
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // One row per employee — repeated replacements for the same person are
  // folded into a single row instead of repeating their name; the full
  // chronological list (1st, 2nd, 3rd...) lives in the detail popup.
  const employeeGroups = useMemo(() => {
    const groups = new Map();
    replacements.forEach((replacement) => {
      const key = replacement.staff_code || replacement.owner_id || replacement.employee_id || replacement.owner_name || "unknown";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(replacement);
    });

    return Array.from(groups.entries()).map(([key, entries]) => {
      const ascending = [...entries].sort((a, b) => {
        const dateA = new Date(a.replacement_date).getTime();
        const dateB = new Date(b.replacement_date).getTime();
        if (dateA !== dateB) {
          if (Number.isNaN(dateA)) return 1;
          if (Number.isNaN(dateB)) return -1;
          return dateA - dateB;
        }
        return (a.replacement_id ?? 0) - (b.replacement_id ?? 0);
      });
      const withOrdinal = ascending.map((entry, index) => ({ ...entry, _occurrence: index + 1 }));
      const latestEntry = withOrdinal[withOrdinal.length - 1];

      return {
        key,
        owner_name: latestEntry.owner_name,
        staff_code: latestEntry.staff_code,
        latestEntry,
        count: withOrdinal.length,
        displayEntries: [...withOrdinal].reverse(),
      };
    });
  }, [replacements]);

  // Matches the four identifying columns; the computer name falls back the
  // same way the cell does, so what you see in the row is what you can type.
  const filteredGroups = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return employeeGroups;

    return employeeGroups.filter((group) =>
      [
        group.owner_name,
        group.staff_code,
        group.latestEntry.computer_name,
        group.latestEntry.device_name,
        group.latestEntry.device_model,
        group.latestEntry.asset_code,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [employeeGroups, search]);

  const pageCount = Math.max(1, Math.ceil(filteredGroups.length / HISTORY_PAGE_SIZE));
  // Clamped rather than reset in an effect: searching can drop the page count
  // below the page you were on, which would otherwise show an empty table.
  const safePage = Math.min(page, pageCount);
  const paginatedGroups = filteredGroups.slice((safePage - 1) * HISTORY_PAGE_SIZE, safePage * HISTORY_PAGE_SIZE);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-xl bg-white dark:bg-slate-900">
        {/* z-20 matches the other pages' sticky bars, so a hovered row passes
            under this one rather than over it. */}
        <div className="sticky top-14 z-20 flex flex-wrap items-center justify-between gap-3 bg-white py-2 dark:bg-slate-900">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Device Replacement History")}</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                {t("employee_count", { count: employeeGroups.length })} · {t("replacement_count", { count: replacements.length })}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-[26rem]">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
              <input
                id="replacement-history-search"
                type="text"
                autoComplete="off"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Employee / Staff Code / Computer / Asset Code")}
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

        {isLoading ? (
          <div className="px-5 py-10 text-center text-[13px] text-slate-500 dark:text-slate-400">{t("Loading replacements...")}</div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertTriangle size={18} />
            </div>
            <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{t("Couldn't load replacements")}</p>
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
        ) : filteredGroups.length === 0 ? (
          <EmptyState
            icon={RefreshCw}
            title={t("No replacements found")}
            description={search ? t("No employee matches", { term: search }) : t("Replacement records will appear here.")}
          />
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-[13px]">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  {[t("Employee"), t("Staff Code"), t("Computer"), t("Asset Code"), t("Category"), t("Replacement")].map(
                    (label) => (
                      <th
                        key={label}
                        className="whitespace-nowrap border-y border-slate-100 px-5 py-2 font-semibold leading-none dark:border-slate-800"
                      >
                        {label}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedGroups.map((group) => (
                  <ReplacementHistoryRow key={group.key} group={group} onViewDetails={setSelectedGroup} />
                ))}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-3 border-t border-slate-100 px-5 py-3 dark:border-slate-800">
              <Pagination currentPage={safePage} pageCount={pageCount} onPageChange={setPage} />
            </div>
          )}
          </>
        )}
      </div>

      <ReplacementDetailModal group={selectedGroup} onClose={() => setSelectedGroup(null)} />
    </div>
  );
}

export function ReplaceDeviceDialog({
  device,
  onClose,

  // "Replace a part" tab
  partTypes = [],
  stockColumnCustomFieldOptions = [],
  partStatuses = [],
  selectedPartTypeId,
  onSelectPartType,
  partAction,
  onSelectPartAction,
  partNewValue,
  oldPartStatus,
  onSelectOldPartStatus,
  onSubmitPart,
  isSubmittingPart,
  submitPartError,

  // Stock picker — fitting a part now has to come off the shelf
  availableStock = [],
  isAvailableStockLoading,
  availableStockError,
  onRetryAvailableStock,
  selectedStockId,
  onSelectStock,

  // "Add to stock" shortcut, shown inline when the shelf is empty
  isQuickAddDialogOpen,
  quickAddFormValues,
  isSubmittingQuickAdd,
  quickAddError,
  onOpenQuickAddDialog,
  onCloseQuickAddDialog,
  onQuickAddFormChange,
  onSubmitQuickAdd,
}) {
  const { t } = useTranslation();

  if (!device) return null;

  const selectedPartType = partTypes.find((item) => String(item.part_type_id) === String(selectedPartTypeId));
  // A device has exactly one bag, mouse, or keyboard — there's nothing to
  // "add" alongside it, only ever a swap.
  const SINGLE_UNIT_PARTS = ["bag", "mouse", "keyboard"];
  const availablePartActions = PART_ACTION_OPTIONS.filter(
    (option) => !(option.value === "add" && SINGLE_UNIT_PARTS.includes(selectedPartType?.part_name?.trim().toLowerCase()))
  );
  // "add" always needs a value; "replace" only when the part tracks one.
  // Both install a physical unit, so both need a stock pick; only "replace"
  // displaces an old part, so only it asks what happens to it.
  const partNeedsValue =
    partAction === "add" || (partAction === "replace" && Boolean(selectedPartType?.tracks_value));
  const canSubmitPart = Boolean(
    selectedPartTypeId &&
    (!partNeedsValue || partNewValue.trim()) &&
    selectedStockId &&
    (partAction !== "replace" || oldPartStatus)
  );

  // Read straight off the device row instead of asking — the API never wants
  // old_value for a part with an equipment_column, since it'd just be
  // misreported.
  function getPartOldValueDisplay(partType) {
    if (!partType.equipment_column) return "—";
    const value = device[partType.equipment_column];
    return value === null || value === undefined || value === "" ? "—" : String(value);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-950/60" onClick={onClose} aria-label={t("Close")} />
      <div className="relative flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-black/40">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Replace this device")}</h2>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">{getEquipmentDisplayName(device)}</p>
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

        <form onSubmit={onSubmitPart} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
          <div className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
            {submitPartError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                {submitPartError}
              </div>
            )}

            <div>
              <p className="mb-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">{t("Part")}</p>
              <div className="flex flex-wrap gap-2">
                {partTypes.map((partType) => {
                  const isSelected = String(partType.part_type_id) === String(selectedPartTypeId);
                  return (
                    <button
                      key={partType.part_type_id}
                      type="button"
                      onClick={() => onSelectPartType(partType.part_type_id)}
                      className={`inline-flex h-9 items-center rounded-full border px-3.5 text-[13px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${isSelected
                        ? "border-[#fddd1c] bg-[#fddd1c] text-slate-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
                        }`}
                    >
                      {partType.part_name}
                    </button>
                  );
                })}
              </div>
            </div>

            {!selectedPartType ? (
              <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                {t("Select a part above to continue")}
              </div>
            ) : (
              <>
                {availablePartActions.length > 1 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">{t("Action")}</p>
                    <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
                      {availablePartActions.map((option) => {
                        const isSelected = partAction === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => onSelectPartAction(option.value)}
                            className={`rounded-full px-4 py-1.5 text-[13px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 ${isSelected
                              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                              }`}
                          >
                            {t(option.label)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {partAction === "replace" && (
                    <div>
                      <label htmlFor="replace-part-old-status" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {t("old_part_status_label", { name: selectedPartType.part_name })}
                      </label>
                      <RadioSelect
                        id="replace-part-old-status"
                        options={[...partStatuses]
                          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                          .map((status) => ({ value: status.status_name, label: t(status.status_name) }))}
                        value={oldPartStatus}
                        onSelect={onSelectOldPartStatus}
                        placeholder={t("Select a status...")}
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="replace-part-current" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {t("current_part_label", { name: selectedPartType.part_name })}
                    </label>
                    <div
                      id="replace-part-current"
                      className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {getPartOldValueDisplay(selectedPartType)}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="replace-part-stock" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {t("new_part_button", { name: selectedPartType.part_name })}
                    </label>

                    {isAvailableStockLoading ? (
                      <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                        {t("Loading stock...")}
                      </div>
                    ) : availableStockError ? (
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 dark:border-rose-800 dark:bg-rose-950/40">
                        <span className="text-sm text-rose-700 dark:text-rose-300">{availableStockError}</span>
                        <button
                          type="button"
                          onClick={onRetryAvailableStock}
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-700 outline-none transition hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-400 dark:border-rose-800 dark:bg-slate-800 dark:text-rose-300 dark:hover:bg-rose-950/40"
                        >
                          <RefreshCw size={13} />
                          {t("Retry")}
                        </button>
                      </div>
                    ) : availableStock.length === 0 ? (
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-800 dark:bg-amber-950/40">
                        <span className="text-sm text-amber-800 dark:text-amber-300">
                          {t("no_part_in_stock", { name: selectedPartType.part_name })}
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenQuickAddDialog(selectedPartTypeId)}
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-800 outline-none transition hover:bg-amber-100 focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-amber-700 dark:bg-slate-800 dark:text-amber-300 dark:hover:bg-amber-950/40"
                        >
                          <PlusCircle size={13} />
                          {t("Add to stock")}
                        </button>
                      </div>
                    ) : (
                      <StockLineSelect
                        id="replace-part-stock"
                        options={availableStock}
                        selectedId={selectedStockId}
                        onSelect={onSelectStock}
                      />
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-auto flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmittingPart}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
            >
              {t("Cancel")}
            </button>
            <button
              type="submit"
              disabled={!canSubmitPart || isSubmittingPart}
              className="group/roll inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#fddd1c] px-3.5 text-[13px] font-semibold text-slate-900 outline-none transition hover:bg-[#e5c518] focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#fddd1c] dark:text-slate-900 dark:hover:bg-[#e5c518] dark:focus-visible:ring-offset-slate-900"
            >
              <RollingText text={isSubmittingPart ? t("Saving...") : t("Save")} />
            </button>
          </div>
        </form>
      </div>

      <AddStockDialog
        isOpen={isQuickAddDialogOpen}
        values={quickAddFormValues}
        partTypes={partTypes}
        customFieldCatalog={stockColumnCustomFieldOptions}
        lockedPartTypeId={selectedPartTypeId}
        onChange={onQuickAddFormChange}
        onSubmit={onSubmitQuickAdd}
        onClose={onCloseQuickAddDialog}
        isSubmitting={isSubmittingQuickAdd}
        error={quickAddError}
      />
    </div>
  );
}
