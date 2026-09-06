import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiActivity as ActivityIcon,
  FiBox as Box,
  FiChevronDown as ChevronDown,
  FiClock as Clock,
  FiGrid as Grid,
  FiRefreshCw as RefreshCw,
  FiSettings as Settings,
  FiUser as UserIcon,
  FiZap as Zap,
} from "react-icons/fi";
import { EmptyState, Pagination, RadioSelect } from "../../components/SharedControls";
import { formatFieldValue, humanizeFieldKey } from "../../dashboard.utils";
import { translateLabel } from "../../../../lib/i18nLabel";

const ACTION_STYLES = {
  create: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  update: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  delete: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  approve: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  reset_password: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  assign: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  unassign: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  borrow: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  return: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const ACTION_LABELS = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  approve: "Approved",
  reset_password: "Password reset",
  assign: "Assigned",
  unassign: "Unassigned",
  borrow: "Borrowed",
  return: "Returned",
};

const ACTIVITY_HEAD_CELL =
  "whitespace-nowrap border-y border-slate-100 px-5 py-2 font-semibold leading-none dark:border-slate-800";

// Every cell keeps a full border at rest — top transparent, bottom the row
// separator — so hover only has to recolour it into a card around the row,
// with no 1px height jump. Only the top/bottom edges recolour on every cell;
// the sides stay transparent except on the first and last, otherwise each
// column divider lights up and the row reads as a grid instead of one card.
const ACTIVITY_CELL =
  "border border-x-transparent border-t-transparent border-b-slate-50 bg-white px-5 py-2 group-hover:border-y-slate-200 dark:border-b-slate-800/60 dark:bg-slate-900 dark:group-hover:border-y-slate-700";

const ACTIVITY_COLUMNS = [
  { key: "time", label: "Time", icon: Clock },
  { key: "user", label: "User", icon: UserIcon, actorOnly: true },
  { key: "action", label: "Action", icon: Zap },
  { key: "module", label: "Module", icon: Grid },
  { key: "item", label: "Item", icon: Box },
];

const IGNORED_DIFF_KEYS = new Set([
  "created_at",
  "updated_at",
  "createdAt",
  "updatedAt",
  "password",
  "password_hash",
  "is_active",
  // A display-only row index some tables add for numbering ("No." columns
  // over ids that aren't sequential) — never real data, so never worth
  // logging.
  "_row_number",
]);

function formatTimestamp(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function diffFields(before, after) {
  if (!before || !after) return [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changes = [];
  for (const key of keys) {
    if (IGNORED_DIFF_KEYS.has(key)) continue;
    const from = before[key];
    const to = after[key];
    if (String(from ?? "") === String(to ?? "")) continue;
    changes.push({ key, from, to });
  }
  return changes;
}

function ActionBadge({ action }) {
  const { t } = useTranslation();

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${ACTION_STYLES[action] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
        }`}
    >
      {t(ACTION_LABELS[action] || action)}
    </span>
  );
}

function ActivityDetails({ entry, changes, columnCount }) {
  const { t, i18n } = useTranslation();
  const snapshot = entry.before || entry.after;

  return (
    <tr className="bg-slate-50/60 dark:bg-slate-800/40">
      <td colSpan={columnCount} className="px-5 py-3">
        {entry.action === "update" ? (
          changes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {changes.map((change) => (
                <span
                  key={change.key}
                  className="rounded-lg bg-white px-2.5 py-1.5 text-xs text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{translateLabel(t, i18n, humanizeFieldKey(change.key))}:</span>{" "}
                  <span className="text-rose-600 line-through dark:text-rose-400">{formatFieldValue(change.from)}</span>{" "}
                  <span className="text-slate-400 dark:text-slate-600">&rarr;</span>{" "}
                  <span className="text-emerald-700 dark:text-emerald-400">{formatFieldValue(change.to)}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">{t("No field changes recorded.")}</p>
          )
        ) : snapshot ? (
          <dl className="grid gap-x-4 gap-y-1.5 sm:grid-cols-3">
            {Object.entries(snapshot)
              .filter(([key]) => !IGNORED_DIFF_KEYS.has(key))
              .map(([key, value]) => (
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
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">{t("No additional details recorded.")}</p>
        )}
      </td>
    </tr>
  );
}

function ActivityRow({ entry, showActor }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const changes = useMemo(() => diffFields(entry.before, entry.after), [entry.before, entry.after]);
  const hasDetails = Boolean(entry.before || entry.after);
  const columnCount = showActor ? 6 : 5;

  return (
    <>
      <tr>
        <td className={`${ACTIVITY_CELL} whitespace-nowrap rounded-l-lg text-slate-500 group-hover:border-l-slate-200 dark:text-slate-400 dark:group-hover:border-l-slate-700`}>
          {formatTimestamp(entry.timestamp)}
        </td>
        {showActor && (
          <td className={`${ACTIVITY_CELL} whitespace-nowrap font-semibold text-slate-950 dark:text-white`}>{entry.actorName}</td>
        )}
        <td className={`${ACTIVITY_CELL} whitespace-nowrap`}>
          <ActionBadge action={entry.action} />
        </td>
        <td className={`${ACTIVITY_CELL} whitespace-nowrap text-slate-600 dark:text-slate-300`}>{t(entry.module)}</td>
        <td className={`${ACTIVITY_CELL} text-slate-800 dark:text-slate-200`}>
          <span className="font-medium">{entry.entityLabel || `#${entry.entityId ?? "—"}`}</span>
        </td>
        <td className={`${ACTIVITY_CELL} whitespace-nowrap rounded-r-lg text-right group-hover:border-r-slate-200 dark:group-hover:border-r-slate-700`}>
          {hasDetails && (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
            >
              {t("Details")}
              <ChevronDown size={12} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
          )}
        </td>
      </tr>
      {expanded && <ActivityDetails entry={entry} changes={changes} columnCount={columnCount} />}
    </>
  );
}

function ActivityTable({ entries, showActor, emptyDescription }) {
  const { t } = useTranslation();

  if (entries.length === 0) {
    return <EmptyState icon={ActivityIcon} title={t("No activity yet")} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto">
      {/* border-separate (not the default collapse) so the hovered row can
          round its end cells - border-radius on a cell is ignored in the
          collapsed model. Row lines therefore live on the cells rather than
          on the row element, which borders cannot carry here. */}
      <table className="min-w-full border-separate border-spacing-0 text-left text-[13px]">
        <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          <tr>
            {ACTIVITY_COLUMNS.filter((column) => showActor || !column.actorOnly).map((column) => {
              const ColumnIcon = column.icon;
              // flex, not inline-flex: an inline box sits on the text baseline
              // and leaves descender space underneath, which makes the padding
              // look uneven against the data rows.
              return (
                <th key={column.key} className={ACTIVITY_HEAD_CELL}>
                  <span className="flex items-center gap-1.5">
                    <ColumnIcon size={13} className="shrink-0" />
                    {t(column.label)}
                  </span>
                </th>
              );
            })}
            {/* Labelled "Details" rather than the usual "Action", since this
                table already has an Action column of its own. */}
            <th className={`${ACTIVITY_HEAD_CELL} text-right`}>
              <span className="flex items-center justify-end gap-1.5">
                <Settings size={13} className="shrink-0" />
                {t("Details")}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <ActivityRow key={entry.id} entry={entry} showActor={showActor} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

const ACTIVITY_LOG_PAGE_SIZE = 20;

export function ActivityLogView({
  entries,
  totalCount,
  filters,
  onFilterChange,
  onRefresh,
  moduleOptions,
  actionOptions,
}) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  // A filter change means a whole new result set — start back on page 1
  // rather than stranding the user on a page number that may not exist.
  // Adjusted during render (not an effect) per React's guidance for
  // resetting state when a prop changes.
  const [prevFilters, setPrevFilters] = useState(filters);
  if (filters.module !== prevFilters.module || filters.action !== prevFilters.action) {
    setPrevFilters(filters);
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(entries.length / ACTIVITY_LOG_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginatedEntries = entries.slice(
    (currentPage - 1) * ACTIVITY_LOG_PAGE_SIZE,
    currentPage * ACTIVITY_LOG_PAGE_SIZE
  );

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-xl bg-white dark:bg-slate-900">
        {/* z-20 beats the hovered row's own stacking so a lifted row passes
            under this bar rather than over it. */}
        <div className="sticky top-14 z-20 flex flex-wrap items-center justify-between gap-3 bg-white py-2 dark:bg-slate-900">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Activity Log")}</h2>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              {t("activity_count_summary", { shown: entries.length, total: totalCount })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-56">
              <RadioSelect
                id="activity-log-module-filter"
                options={[
                  { value: "All", label: t("All modules") },
                  ...moduleOptions.map((module) => ({ value: module, label: t(module) })),
                ]}
                value={filters.module}
                onSelect={(value) => onFilterChange("module", value)}
                placeholder={t("All modules")}
              />
            </div>
            <div className="w-44">
              <RadioSelect
                id="activity-log-action-filter"
                options={[
                  { value: "All", label: t("All actions") },
                  ...actionOptions.map((action) => ({ value: action, label: t(ACTION_LABELS[action] || action) })),
                ]}
                value={filters.action}
                onSelect={(value) => onFilterChange("action", value)}
                placeholder={t("All actions")}
              />
            </div>
            <button
              type="button"
              onClick={onRefresh}
              title={t("Refresh")}
              aria-label={t("Refresh")}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        <ActivityTable entries={paginatedEntries} showActor emptyDescription={t("No activity matches these filters.")} />

        {entries.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 border-t border-slate-100 px-5 py-3 dark:border-slate-800">
            <Pagination currentPage={currentPage} pageCount={pageCount} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
