import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiRefreshCw as RefreshCw, FiSearch as Search, FiX as X } from "react-icons/fi";
import { borrowHistoryColumns, currentBorrowColumns } from "../../dashboard.config";
import { getRecordColumns } from "../../dashboard.utils";
import { translateLabel } from "../../../../lib/i18nLabel";
import { RecordCellValue, RecordsTableView } from "../../components/RecordsTableView";
import { DateRangePicker } from "../../components/DatePickers";

// The API sends a real boolean today; the string check keeps a serialiser that
// stringifies it from flagging every loan as late.
function isOverdue(loan) {
  return loan.is_overdue === true || loan.is_overdue === 1 || loan.is_overdue === "true";
}

const CURRENT_SEARCH_KEYS = ["borrower_name", "computer_name", "asset_code"];

export function CurrentBorrowsView({
  loans,
  isLoading,
  error,
  onRetry,
  onReturn,
  canManage = true,
  overdueOnly = false,
  onClearOverdueOnly,
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const filteredLoans = useMemo(() => {
    const term = search.trim().toLowerCase();
    // `overdueOnly` is set by the overdue notification, so opening it lands on
    // exactly the loans it was warning about.
    const base = overdueOnly ? loans.filter(isOverdue) : loans;
    if (!term) return base;
    return base.filter((loan) =>
      CURRENT_SEARCH_KEYS.some((key) => String(loan[key] ?? "").toLowerCase().includes(term))
    );
  }, [loans, search, overdueOnly]);

  return (
    <RecordsTableView
      records={filteredLoans}
      pageSize={20}
      columnsConfig={currentBorrowColumns}
      title={t("Currently borrowed")}
      recordLabel="loan"
      loadingText={t("Loading current loans...")}
      errorTitle={t("Couldn't load current loans")}
      emptyIcon={RefreshCw}
      emptyTitle={t("Nothing borrowed")}
      emptyDescription={
        search ? t("No borrow history matches", { term: search }) : t("Equipment currently on loan will appear here.")
      }
      rowKey={(loan, index) => loan.borrow_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      hideRefresh
      headerActions={
        <>
        <div className="relative w-96">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
          <input
            id="current-borrows-search"
            type="text"
            autoComplete="off"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              onClearOverdueOnly?.();
            }}
            placeholder={t("Borrower / Computer Name / Asset Code")}
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
        </>
      }
      renderCell={(loan, column) =>
        column.key === "is_overdue" ? (
          // A plain Yes/No said nothing about which answer was the bad one, so
          // the flag reads as its own status and the late ones go red.
          <span
            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${isOverdue(loan)
              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
              }`}
          >
            {isOverdue(loan) ? t("Overdue") : t("On Time")}
          </span>
        ) : (
          <RecordCellValue value={loan[column.key]} />
        )
      }
      renderRowActions={
        canManage &&
        ((loan) => (
          <button
            type="button"
            onClick={() => onReturn(loan)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            {t("Return")}
          </button>
        ))
      }
    />
  );
}

const HISTORY_SEARCH_KEYS = ["computer_name", "borrower_name", "asset_code", "device_model"];

// getRecordColumns appends every field the API returns that borrowHistoryColumns
// doesn't list, so dropping a column from the config isn't enough on its own -
// it comes straight back as an auto-detected extra. These are the raw ids and
// audit fields that aren't worth a column.
const HISTORY_HIDDEN_KEYS = new Set([
  "purpose",
  "equipment_id",
  "borrower_id",
  "issued_by",
  "received_by",
]);

export function BorrowHistoryView({
  history,
  isLoading,
  error,
  onRetry,
  filters,
  onFilterChange,
}) {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState("");
  const columns = useMemo(
    () => getRecordColumns(history, borrowHistoryColumns).filter((column) => !HISTORY_HIDDEN_KEYS.has(column.key)),
    [history]
  );

  const filteredHistory = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return history;
    return history.filter((record) =>
      HISTORY_SEARCH_KEYS.some((key) => String(record[key] ?? "").toLowerCase().includes(term))
    );
  }, [history, search]);

  // Rendered through RecordsTableView so this matches Currently Borrowed
  // exactly — the date range and the search box both ride in `headerActions`,
  // rather than this page keeping its own table markup.
  return (
    <RecordsTableView
      records={filteredHistory}
      pageSize={20}
      columnsConfig={columns}
      title={t("Borrow history")}
      recordLabel="record"
      loadingText={t("Loading borrow history...")}
      errorTitle={t("Couldn't load borrow history")}
      emptyIcon={Search}
      emptyTitle={t("No borrow history")}
      emptyDescription={
        search ? t("No borrow history matches", { term: search }) : t("Loan records will appear here.")
      }
      rowKey={(record, index) => record.borrow_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      hideRefresh
      headerActions={
        <>
        <div className="relative w-96">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
          <input
            id="borrow-history-search"
            type="text"
            autoComplete="off"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Equipment / Borrower / Asset Code / Device Model")}
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

        <DateRangePicker
          from={filters.from}
          to={filters.to}
          onApply={(from, to) => {
            onFilterChange("from", from);
            onFilterChange("to", to);
          }}
        />
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
        </>
      }
      renderCell={(record, column) =>
        column.key === "loan_status" ? (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${record.loan_status === "Returned"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
              }`}
          >
            {translateLabel(t, i18n, record.loan_status)}
          </span>
        ) : (
          <RecordCellValue value={record[column.key]} />
        )
      }
    />
  );
}

// ---------------------------------------------------------------------------
// Employee search
// ---------------------------------------------------------------------------
