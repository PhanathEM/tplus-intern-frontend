import { useTranslation } from "react-i18next";
import {
  FiAlertTriangle as AlertTriangle,
  FiBox as Box,
  FiCheckCircle as CheckCircle,
  FiHash as Hash,
  FiLayers as Layers,
  FiRefreshCw as RefreshCw,
  FiSearch as Search,
  FiSettings as Settings,
  FiUser as UserIcon,
  FiUserX as UserX,
  FiX as X,
} from "react-icons/fi";
import { ConfirmDialog, EmptyState, Pagination } from "../../components/SharedControls";
import { getEquipmentDisplayName } from "../../dashboard.utils";

const UNASSIGN_HEAD_CELL =
  "whitespace-nowrap border-y border-slate-100 px-5 py-2 font-semibold uppercase leading-none tracking-wide dark:border-slate-800";

// No hover card here: the row itself does nothing on click, only the Unassign
// button does, so the cells just carry the row separator.
const UNASSIGN_CELL =
  "whitespace-nowrap border-b border-slate-50 bg-white px-5 py-2 dark:border-slate-800/60 dark:bg-slate-900";

const UNASSIGN_COLUMNS = [
  { key: "owner", label: "Owner", icon: UserIcon },
  { key: "device", label: "Device", icon: Box },
  { key: "category", label: "Category", icon: Layers },
  { key: "asset_code", label: "Asset Code", icon: Hash },
];

// A table rather than a picker form: unassigning is a one-click action per
// device, so searching the things people currently hold and acting on a row is
// faster than a two-step pick-then-confirm flow.
export function UnassignView({
  items = [],
  totalCount,
  isLoading,
  error,
  onRetry,
  search,
  onSearchChange,
  page,
  pageCount,
  onPageChange,
  target,
  isUnassigning,
  unassignError,
  successMessage,
  onOpenUnassign,
  onCloseUnassign,
  onConfirmUnassign,
}) {
  const { t } = useTranslation();

  return (
    <div className="px-4 pb-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-xl bg-white dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 py-2">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Assigned equipment")}</h2>
            {!isLoading && !error && (
              <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
                {t("item_count", { count: totalCount })}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
              <input
                type="text"
                autoComplete="off"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t("Owner / Equipment / Asset Code")}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-9 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
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

        {successMessage && (
          <div className="mb-3 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle size={16} className="mt-0.5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="px-5 py-10 text-center text-[13px] text-slate-500 dark:text-slate-400">{t("Loading...")}</div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertTriangle size={18} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
            >
              <RefreshCw size={13} />
              {t("Retry")}
            </button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Box}
            title={t("Nothing is assigned")}
            description={search ? t("No equipment matches", { term: search }) : t("Assigned equipment will appear here.")}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              {/* border-separate keeps the cell borders from collapsing into
                  the header rule, so the row lines stay a single pixel. */}
              <table className="min-w-full border-separate border-spacing-0 text-left text-[13px]">
                <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                  <tr>
                    {UNASSIGN_COLUMNS.map((column) => {
                      const ColumnIcon = column.icon;
                      // flex, not inline-flex: an inline box sits on the text
                      // baseline and leaves descender space underneath, which
                      // makes the padding look uneven against the data rows.
                      return (
                        <th key={column.key} className={UNASSIGN_HEAD_CELL}>
                          <span className="flex items-center gap-1.5">
                            <ColumnIcon size={13} className="shrink-0" />
                            {t(column.label)}
                          </span>
                        </th>
                      );
                    })}
                    <th className={`${UNASSIGN_HEAD_CELL} text-right`}>
                      <span className="flex items-center justify-end gap-1.5">
                        <Settings size={13} className="shrink-0" />
                        {t("Action")}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.equipment_id}>
                      <td className={`${UNASSIGN_CELL} font-semibold text-slate-950 dark:text-white`}>
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                            <UserIcon size={13} />
                          </span>
                          {item.owner_name || "—"}
                        </div>
                      </td>
                      <td className={`${UNASSIGN_CELL} text-slate-600 dark:text-slate-300`}>
                        {getEquipmentDisplayName(item)}
                      </td>
                      <td className={`${UNASSIGN_CELL} text-slate-600 dark:text-slate-300`}>
                        {item.category_name || item.category || "—"}
                      </td>
                      <td className={`${UNASSIGN_CELL} text-slate-600 dark:text-slate-300`}>{item.asset_code || "—"}</td>
                      <td className={`${UNASSIGN_CELL} text-right`}>
                        <button
                          type="button"
                          onClick={() => onOpenUnassign(item)}
                          className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 focus-visible:ring-2 focus-visible:ring-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-rose-800 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                        >
                          <UserX size={13} className="block" />
                          {t("Unassign")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pageCount > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-3 border-t border-slate-100 px-5 py-3 dark:border-slate-800">
                <Pagination currentPage={page} pageCount={pageCount} onPageChange={onPageChange} />
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(target)}
        title={t("Unassign this equipment?")}
        message={
          target
            ? t("unassign_confirm", {
              name: getEquipmentDisplayName(target),
              owner: target.owner_name || t("its owner"),
            })
            : ""
        }
        confirmLabel={t("Unassign")}
        confirmingLabel={t("Unassigning...")}
        isConfirming={isUnassigning}
        error={unassignError}
        onCancel={onCloseUnassign}
        onConfirm={onConfirmUnassign}
      />
    </div>
  );
}
