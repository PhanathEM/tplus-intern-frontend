import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiAlertTriangle as AlertTriangle,
  FiBox as Box,
  FiChevronDown as ChevronDown,
  FiClock as Clock,
  FiRefreshCw as RefreshCw,
  FiRotateCcw as RotateCcw,
  FiSettings as Settings,
  FiTag as Tag,
  FiTrash2 as Trash2,
  FiUser as UserIcon,
} from "react-icons/fi";
import { EmptyState, Pagination, RadioSelect } from "../../components/SharedControls";
import { formatFieldValue, humanizeFieldKey } from "../../dashboard.utils";
import { translateLabel } from "../../../../lib/i18nLabel";

const RECYCLE_HEAD_CELL =
  "whitespace-nowrap border-y border-slate-100 px-5 py-2 font-semibold leading-none dark:border-slate-800";

// Every cell keeps a full border at rest - top transparent, bottom the row
// separator - so hover only has to recolour it into a card around the row,
// with no 1px height jump. Only the top/bottom edges recolour on every cell;
// the sides stay transparent except on the first and last, otherwise each
// column divider lights up and the row reads as a grid instead of one card.
const RECYCLE_CELL =
  "border border-x-transparent border-t-transparent border-b-slate-50 bg-white px-5 py-2 group-hover:border-y-slate-200 dark:border-b-slate-800/60 dark:bg-slate-900 dark:group-hover:border-y-slate-700";

const RECYCLE_COLUMNS = [
  { key: "deleted", label: "Deleted", icon: Clock },
  { key: "type", label: "Type", icon: Tag },
  { key: "item", label: "Item", icon: Box },
  { key: "deleted_by", label: "Deleted By", icon: UserIcon },
];

const IGNORED_KEYS = new Set([
  "id",
  "recycle_bin_id",
  "bin_id",
  "entity_type",
  "entityType",
  "type",
  "data",
  "record",
  "snapshot",
  "payload",
  "entity_data",
  "original_data",
  "deleted_at",
  "deletedAt",
  "created_at",
  "createdAt",
  "deleted_by",
  "deletedBy",
]);

const RECORD_FIELD_CANDIDATES = ["data", "record", "snapshot", "payload", "entity_data", "original_data"];

const LABEL_FIELD_CANDIDATES = [
  "full_name",
  "department_name",
  "category_name",
  "name",
  "device_type",
  "computer_name",
  "username",
  "title",
];

function getEntryId(entry) {
  return entry?.id ?? entry?.recycle_bin_id ?? entry?.bin_id ?? null;
}

function getEntryType(entry) {
  return entry?.entity_type ?? entry?.entityType ?? entry?.type ?? "Unknown";
}

function getEntryRecord(entry) {
  for (const key of RECORD_FIELD_CANDIDATES) {
    if (entry?.[key] && typeof entry[key] === "object") return entry[key];
  }
  return entry || {};
}

function getEntryLabel(entry, t) {
  const record = getEntryRecord(entry);
  for (const key of LABEL_FIELD_CANDIDATES) {
    if (record?.[key]) return record[key];
  }
  const id = getEntryId(entry);
  return `${t(getEntryType(entry))} #${id ?? "—"}`;
}

function getEntryTimestamp(entry) {
  return entry?.deleted_at ?? entry?.deletedAt ?? entry?.created_at ?? entry?.createdAt ?? null;
}

function getEntryDeletedBy(entry) {
  return entry?.deleted_by ?? entry?.deletedBy ?? entry?.deleted_by_name ?? null;
}

function formatTimestamp(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function RecycleBinRow({ entry, onRestore, onDeleteForever, isRestoring, isDeleting }) {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const record = useMemo(() => getEntryRecord(entry), [entry]);
  const entries = Object.entries(record).filter(([key]) => !IGNORED_KEYS.has(key));
  const isBusy = isRestoring || isDeleting;

  return (
    <>
      <tr>
        <td className={`${RECYCLE_CELL} whitespace-nowrap rounded-l-lg text-slate-500 group-hover:border-l-slate-200 dark:text-slate-400 dark:group-hover:border-l-slate-700`}>
          {formatTimestamp(getEntryTimestamp(entry))}
        </td>
        <td className={`${RECYCLE_CELL} whitespace-nowrap text-slate-600 dark:text-slate-300`}>{translateLabel(t, i18n, getEntryType(entry))}</td>
        <td className={`${RECYCLE_CELL} font-medium text-slate-800 dark:text-slate-200`}>{getEntryLabel(entry, t)}</td>
        <td className={`${RECYCLE_CELL} whitespace-nowrap text-slate-500 dark:text-slate-400`}>{getEntryDeletedBy(entry) || "—"}</td>
        <td className={`${RECYCLE_CELL} whitespace-nowrap rounded-r-lg text-right group-hover:border-r-slate-200 dark:group-hover:border-r-slate-700`}>
          <div className="flex items-center justify-end gap-2">
            {entries.length > 0 && (
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
              >
                {t("Details")}
                <ChevronDown size={12} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
            )}
            <button
              type="button"
              onClick={() => onRestore(entry)}
              disabled={isBusy}
              className="inline-flex h-7 items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 text-xs font-semibold text-emerald-700 outline-none transition hover:border-emerald-300 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-800 dark:bg-slate-800 dark:text-emerald-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40"
            >
              <RotateCcw size={12} className={isRestoring ? "animate-spin" : ""} />
              {isRestoring ? t("Restoring...") : t("Restore")}
            </button>
            <button
              type="button"
              onClick={() => onDeleteForever(entry)}
              disabled={isBusy}
              className="inline-flex h-7 items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 text-xs font-semibold text-rose-600 outline-none transition hover:border-rose-300 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-800 dark:bg-slate-800 dark:text-rose-400 dark:hover:border-rose-700 dark:hover:bg-rose-950/40"
            >
              <Trash2 size={12} />
              {isDeleting ? t("Deleting...") : t("Delete Forever")}
            </button>
          </div>
        </td>
      </tr>
      {expanded && entries.length > 0 && (
        <tr className="bg-slate-50/60 dark:bg-slate-800/40">
          <td colSpan={5} className="px-5 py-3">
            <dl className="grid gap-x-4 gap-y-1.5 sm:grid-cols-3">
              {entries.map(([key, value]) => (
                <div key={key} className="min-w-0">
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    {translateLabel(t, i18n, humanizeFieldKey(key))}
                  </dt>
                  <dd className="truncate text-xs text-slate-700 dark:text-slate-300" title={formatFieldValue(value)}>
                    {formatFieldValue(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </td>
        </tr>
      )}
    </>
  );
}

const RECYCLE_BIN_PAGE_SIZE = 20;

export function RecycleBinView({
  entries,
  isLoading,
  error,
  onRetry,
  typeFilter,
  onFilterChange,
  typeOptions,
  onRestore,
  onDeleteForever,
  onPurgeAll,
  restoringId,
  deletingId,
  isPurging,
  actionError,
}) {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(1);

  // A new type filter means a whole new result set — start back on page 1
  // rather than stranding the user on a page number that may not exist.
  // Adjusted during render (not an effect) per React's guidance for
  // resetting state when a prop changes.
  const [prevTypeFilter, setPrevTypeFilter] = useState(typeFilter);
  if (typeFilter !== prevTypeFilter) {
    setPrevTypeFilter(typeFilter);
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(entries.length / RECYCLE_BIN_PAGE_SIZE));
  // Clamped rather than reset via state — a restore/delete can shrink the
  // list out from under whatever page you were on (e.g. purging the last
  // item on page 3), so this just settles on the nearest valid page instead.
  const currentPage = Math.min(page, pageCount);
  const paginatedEntries = entries.slice(
    (currentPage - 1) * RECYCLE_BIN_PAGE_SIZE,
    currentPage * RECYCLE_BIN_PAGE_SIZE
  );

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-xl bg-white dark:bg-slate-900">
        {/* z-20 beats the hovered row's own stacking so a lifted row passes
            under this bar rather than over it. */}
        <div className="sticky top-14 z-20 flex flex-wrap items-center justify-between gap-3 bg-white py-2 dark:bg-slate-900">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Recycle Bin")}</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                {t("items_pending_deletion", { count: entries.length })}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-56">
              <RadioSelect
                id="recycle-bin-type-filter"
                options={[
                  { value: "All", label: t("All types") },
                  ...typeOptions.map((type) => ({ value: type, label: translateLabel(t, i18n, type) })),
                ]}
                value={typeFilter}
                onSelect={onFilterChange}
                placeholder={t("All types")}
              />
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
            {entries.length > 0 && (
              <button
                type="button"
                onClick={onPurgeAll}
                disabled={isPurging}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3.5 text-[13px] font-semibold text-rose-600 outline-none transition hover:border-rose-300 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-800 dark:bg-slate-800 dark:text-rose-400 dark:hover:border-rose-700 dark:hover:bg-rose-950/40 dark:focus-visible:ring-offset-slate-900"
              >
                <Trash2 size={14} />
                {isPurging ? t("Deleting...") : t("Purge All")}
              </button>
            )}
          </div>
        </div>

        {actionError && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertTriangle size={14} />
            {actionError}
          </div>
        )}

        {isLoading ? (
          <div className="px-5 py-10 text-center text-[13px] text-slate-500 dark:text-slate-400">{t("Loading recycle bin...")}</div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertTriangle size={18} />
            </div>
            <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{t("Couldn't load the recycle bin")}</p>
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
        ) : entries.length === 0 ? (
          <EmptyState icon={Trash2} title={t("Recycle bin is empty")} description={t("Deleted records will show up here.")} />
        ) : (
          <div className="overflow-x-auto">
            {/* border-separate (not the default collapse) so the hovered row
                can round its end cells - border-radius on a cell is ignored
                in the collapsed model. Row lines therefore live on the cells
                rather than on the row element, which cannot carry them. */}
            <table className="min-w-full border-separate border-spacing-0 text-left text-[13px]">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  {RECYCLE_COLUMNS.map((column) => {
                    const ColumnIcon = column.icon;
                    // flex, not inline-flex: an inline box sits on the text
                    // baseline and leaves descender space underneath, which
                    // makes the padding look uneven against the data rows.
                    return (
                      <th key={column.key} className={RECYCLE_HEAD_CELL}>
                        <span className="flex items-center gap-1.5">
                          <ColumnIcon size={13} className="shrink-0" />
                          {t(column.label)}
                        </span>
                      </th>
                    );
                  })}
                  <th className={`${RECYCLE_HEAD_CELL} text-right`}>
                    <span className="flex items-center justify-end gap-1.5">
                      <Settings size={13} className="shrink-0" />
                      {t("Action")}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedEntries.map((entry) => {
                  const id = getEntryId(entry);
                  return (
                    <RecycleBinRow
                      key={id}
                      entry={entry}
                      onRestore={onRestore}
                      onDeleteForever={onDeleteForever}
                      isRestoring={restoringId === id}
                      isDeleting={deletingId === id}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !error && entries.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 border-t border-slate-100 px-5 py-3 dark:border-slate-800">
            <Pagination currentPage={currentPage} pageCount={pageCount} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
