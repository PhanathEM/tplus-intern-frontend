import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiBell as Bell,
  FiBox as Box,
  FiLogOut as LogOut,
  FiMenu as Menu,
  FiGlobe as Globe,
  FiMoon as Moon,
  FiSearch as Search,
  FiSettings as Settings,
  FiUser as UserIcon,
  FiX as X,
} from "react-icons/fi";
import { ThemeToggle } from "../../components/ThemeToggle";
import { LanguageToggle } from "../../components/LanguageToggle";
import { useEmployees } from "./features/employees/useEmployees";
import { useEquipment } from "./features/equipment/useEquipment";
import { useAssign } from "./features/assign/useAssign";
import { useCurrentBorrows } from "./features/borrow/useCurrentBorrows";
import { useBorrowHistory } from "./features/borrow/useBorrowHistory";
import { useGlobalSearch } from "./hooks/useGlobalSearch";
import { useUsers } from "./features/users/useUsers";
import { useDepartments } from "./features/departments/useDepartments";
import { useStatuses } from "./features/statuses/useStatuses";
import { usePartStatuses } from "./features/part-statuses/usePartStatuses";
import { useAccount } from "./features/account/useAccount";
import { useDashboardNotifications } from "./hooks/useDashboardNotifications";
import { useDashboardRouting } from "./hooks/useDashboardRouting";
import { useDashboardHome } from "./hooks/useDashboardHome";
import { navItemsByLabel } from "./dashboard.config";
import { getEquipmentDisplayName } from "./dashboard.utils";
import { ConfirmDialog, EmptyState } from "./components/SharedControls";
import { SidebarBrand, SidebarNavigation } from "./components/Sidebar";
import { GlobalSearch } from "./components/GlobalSearch";
import {
  BorrowEquipmentModal,
  CategoryManagementView,
  ColumnsPickerModal,
  EquipmentFormModal,
  EquipmentView,
  ReturnEquipmentModal,
} from "./features/equipment/EquipmentViews";
import {
  LicenseFormModal,
  LicensesView,
  ServerUsageEditModal,
  ServerUsageView,
} from "./features/records/OperationalRecordViews";
import {
  DeviceReplacementCategoryBar,
  ReplaceableDevicesView,
  ReplaceDeviceDialog,
  ReplacementHistoryView,
} from "./features/device-replacement/ReplacementView";
import { useReplacements } from "./features/device-replacement/useReplacements";
import { PartStockView, PartTypeFormModal, PartTypeManagementView } from "./features/part-stock/PartStockView";
import { BorrowPartDialog, DeleteBorrowDialog, PartBorrowView, ReturnPartDialog } from "./features/part-borrow/PartBorrowView";
import { usePartStock } from "./features/part-stock/usePartStock";
import { usePartBorrow } from "./features/part-borrow/usePartBorrow";
import { useServerUsage } from "./features/records/useServerUsage";
import { useLicenses } from "./features/records/useLicenses";
import {
  CategoryFormModal,
  DepartmentFormModal,
  DepartmentsView,
} from "./features/departments/DepartmentViews";
import { BorrowView } from "./features/borrow/BorrowView";
import { useBorrowEquipment } from "./features/borrow/useBorrowEquipment";
import {
  EmployeeDetailModal,
  EmployeeDirectoryTable,
  EmployeeFormModal,
} from "./features/employees/EmployeeViews";
import { ResetPasswordModal, UserPermissionsModal } from "./features/users/UserViews";
import { StatusesView, StatusFormModal } from "./features/statuses/StatusViews";
import { PartStatusesView, PartStatusFormModal } from "./features/part-statuses/PartStatusViews";
import { ProfileModal, ChangePasswordModal } from "./features/account/AccountViews";
import { AssignationView } from "./features/assign/AssignationView";
import { useUnassign } from "./features/assign/useUnassign";
import { useActivityLog } from "./features/activity/useActivityLog";
import { useMyActivity } from "./features/activity/useMyActivity";
import { getAccessProfileLabel } from "../../lib/permissions";
import { translateLabel } from "../../lib/i18nLabel";
import { useDashboardPermissions } from "./hooks/useDashboardPermissions";
import { ACTIVITY_ACTION_VALUES, ACTIVITY_MODULE_VALUES } from "../../lib/activityLog";
import { useRecycleBin } from "./features/recycle-bin/useRecycleBin";
import { SettingsView } from "./features/settings/SettingsView";
import { ReportView } from "./features/report/ReportView";
import { useReport } from "./features/report/useReport";
import { DashboardHomeView } from "./features/home/DashboardHomeView";

const SIDEBAR_WIDTH_STORAGE_KEY = "tplus-sidebar-width";
const DEFAULT_SIDEBAR_WIDTH = 256; // matches the old fixed w-64
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 420;

function readStoredSidebarWidth() {
  if (typeof window === "undefined") return DEFAULT_SIDEBAR_WIDTH;
  const stored = Number(window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY));
  return stored >= MIN_SIDEBAR_WIDTH && stored <= MAX_SIDEBAR_WIDTH ? stored : DEFAULT_SIDEBAR_WIDTH;
}

// The Equipment search hint names these columns and no others, in this
// order - the fields that identify a device. Everything else the table shows
// (Status, the owner's details, dates) stays searchable, it is just not
// advertised in the box. Each entry lists the spellings the API uses for that
// column; they are compared with separators and case stripped, so
// "device_type", "Device Type" and "devicetype" all land on the same entry.
const EQUIPMENT_SEARCH_HINT_FIELDS = [
  ["devicename"],
  ["computername"],
  ["devicetype"],
  ["devicemodel"],
  ["assetcode", "asetcode"],
  ["serialnumber"],
  ["macaddress"],
  ["ipaddress"],
  ["model"],
];

function normalizeHintKey(value) {
  return String(value || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
}

// Categories whose Device Type only ever holds the maker's name (HIP, ZKT,
// HIKVISION), which nobody searches by - it stays out of their hint.
const EQUIPMENT_HINT_SKIP_DEVICE_TYPE = new Set(["accesscontrol", "cctv"]);

// The hint entries this category actually has, in EQUIPMENT_SEARCH_HINT_FIELDS
// order. A column is claimed by the first entry that matches it: CCTV keys its
// Model column "device_model" but labels it "Model", so without this it would
// answer to both the Device Model and the Model entry and be listed twice.
function getEquipmentHintColumns(columns, categorySlug) {
  const skipDeviceType = EQUIPMENT_HINT_SKIP_DEVICE_TYPE.has(normalizeHintKey(categorySlug));
  const claimed = new Set();

  return EQUIPMENT_SEARCH_HINT_FIELDS.filter(
    (aliases) => !skipDeviceType || !aliases.includes("devicetype")
  )
    .map((aliases) =>
      columns.find(
        (column) =>
          !claimed.has(column.key) &&
          (aliases.includes(normalizeHintKey(column.key)) || aliases.includes(normalizeHintKey(column.label)))
      )
    )
    .filter((column) => {
      if (!column) return false;
      claimed.add(column.key);
      return true;
    });
}

function Dashboard({ user, onLogout, theme, onToggleTheme, language, onToggleLanguage }) {
  const { t, i18n } = useTranslation();
  const permissions = useDashboardPermissions({ user });
  const {
    canCreateRecords,
    canManageEquipment,
    canManageDepartments,
    canManageEmployees,
    canManageBorrows,
    canViewCurrentBorrows,
    canViewBorrowHistory,
    canManageActivityLog,
    canManageRecycleBin,
    canManageReport,
    accessibleDashboardViews,
    firstAccessibleDashboardView,
    canManageUsers,
    canManageStatuses,
    canManageCategory,
    canManagePartTypes,
    canManagePartStatuses,
    canManageAssign,
    visibleHomeNavSections,
  } = permissions;
  const activityLog = useActivityLog();
  const myActivity = useMyActivity({ entries: activityLog.entries, user });
  const account = useAccount({ user });

  const routing = useDashboardRouting({
    user,
    accessibleDashboardViews,
    firstAccessibleDashboardView,
    onSelectView: handleSelectView,
  });
  const { activeView, hasActiveViewAccess } = routing;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(readStoredSidebarWidth);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  // Set by a "Low stock" notification to pin the Equipments table down to
  // exactly those equipment_ids — cleared whenever the category is changed
  // by any other means (see handleSelectEquipmentCategory below).
  const [equipmentIdFilter, setEquipmentIdFilter] = useState(null);

  function handleSidebarResizeStart(event) {
    event.preventDefault();
    setIsResizingSidebar(true);
  }

  useEffect(() => {
    if (!isResizingSidebar) return;

    function handleMouseMove(event) {
      const next = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, event.clientX));
      setSidebarWidth(next);
    }
    function handleMouseUp() {
      setIsResizingSidebar(false);
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
    };
  }, [isResizingSidebar]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(sidebarWidth));
  }, [sidebarWidth]);
  const notifications = useDashboardNotifications({
    user,
    onSelectView: handleSelectView,
    onSelectEquipmentCategory: handleSelectEquipmentCategory,
    onSelectTab: handleSelectNotificationTab,
  });
  const isDashboardHomeView = activeView === "Dashboard" && hasActiveViewAccess;
  // Declared up here (rather than with the other view flags below) because the
  // global search needs it to know whether the Employees table is doing the
  // filtering instead of the dropdown.
  const isEmployeeView = activeView === "Employees" && hasActiveViewAccess;
  const isDepartmentsView = activeView === "Departments" && hasActiveViewAccess;
  const isEquipmentView = activeView === "Equipments" && hasActiveViewAccess;
  const home = useDashboardHome({ isActive: isDashboardHomeView, accessibleDashboardViews });

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuCloseTimeout = useRef(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const globalSearch = useGlobalSearch({
    user,
    onSelectView: handleSelectView,
    onSelectEquipmentCategory: handleSelectEquipmentCategory,
  });

  function handleSelectGlobalSearchResult(type, item) {
    globalSearch.handleSelectResult(type, item);
    setIsMobileSearchOpen(false);
  }

  const notificationsRef = useRef(null);
  const profileMenuRef = useRef(null);
  const displayName = user?.name || "Admin User";

  // Borrow hosts Currently Borrowed / Borrow History as tabs on one page —
  // switching tabs never changes `activeView` (it stays "Borrow" the whole
  // time), so it needs its own reset instead of going through
  // handleSelectView's resetMap. Settings below works the same way.
  function resetAssignationTab(tab) {
    if (tab === "Unassign") unassign.resetForEntry();
  }

  function handleAssignationTabChange(tab) {
    if (tab !== assignationTab) {
      resetAssignationTab(tab);
      setAssignationTab(tab);
    }
  }

  function resetBorrowTab(tab) {
    if (tab === "Borrow") borrowEquipment.resetForEntry();
    else if (tab === "Currently Borrowed") currentBorrows.resetForEntry();
    else borrowHistory.resetForEntry();
  }

  function handleBorrowTabChange(tab) {
    if (tab !== borrowTab) {
      resetBorrowTab(tab);
      setBorrowTab(tab);
    }
    // Switching tabs by hand drops the notification's overdue filter, so the
    // table never stays quietly narrowed after you've moved on.
    setBorrowOverdueOnly(false);
  }

  // An overdue notification opens the Borrow page on Currently Borrowed with
  // the table already filtered to the late loans.
  function handleSelectNotificationTab(view, tab, { overdueOnly } = {}) {
    if (view !== "Borrow") return;
    if (tab !== borrowTab) {
      resetBorrowTab(tab);
      setBorrowTab(tab);
    }
    setBorrowOverdueOnly(Boolean(overdueOnly));
  }

  // Settings hosts Users/Activity Log/Recycle Bin the same way.
  function resetSettingsTab(tab) {
    if (tab === "Users") users.resetForEntry();
    else if (tab === "Recycle Bin") recycleBin.resetForEntry();
  }

  function handleSettingsTabChange(tab) {
    if (tab !== settingsTab) {
      resetSettingsTab(tab);
      setSettingsTab(tab);
    }
  }

  function handleSelectView(label, options) {
    // Every feature hook exposes `resetForEntry()` so switching into its view
    // flips the loading spinner instantly, without this composition root
    // reaching into any hook's internal state directly.
    const resetMap = {
      Equipments: equipment.resetForEntry,
      Category: equipment.resetForEntry,
      "Device Replacement": replacements.resetForEntry,
      "Device Replacement History": replacements.resetForEntry,
      "Stock of Replace a Part": partStock.resetForEntry,
      "Part Types": partStock.resetForEntry,
      "Borrow a Part": partBorrow.resetForEntry,
      "Software License": licenses.resetForEntry,
      "Server Usage": serverUsage.resetForEntry,
      Statuses: statuses.resetForEntry,
      "Part Types Statuses": partStatuses.resetForEntry,
      Borrow: () => resetBorrowTab(borrowTab),
      Assignation: () => resetAssignationTab(assignationTab),
      Employees: employees.resetForEntry,
      Departments: departments.resetForEntry,
      Report: report.resetForEntry,
      Settings: () => resetSettingsTab(settingsTab),
    };

    if (label !== activeView) {
      resetMap[label]?.();
    }

    const changed = routing.setActiveView(label, options);
    if (changed) setIsMobileSidebarOpen(false);
  }

  // Shared by Global Search and the notification bell — both jump the
  // Equipments page to a specific category. `equipmentIds`, when given
  // (only the "Low stock" notification passes it), also pins the table down
  // to exactly those items instead of showing the whole category.
  function handleSelectEquipmentCategory(category, equipmentIds) {
    equipment.handleViewCategory(equipment.resolveView(category));
    setEquipmentIdFilter(Array.isArray(equipmentIds) && equipmentIds.length > 0 ? new Set(equipmentIds) : null);
  }

  // Manually picking a category tab always means "show the whole category
  // again" — clears any id-pin left over from a "Low stock" notification.
  function handleManualEquipmentCategorySelect(category) {
    setEquipmentIdFilter(null);
    equipment.handleSelectCategory(category);
  }

  useEffect(() => {
    function handlePointerDown(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        notifications.setIsOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        notifications.setIsOpen(false);
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      if (profileMenuCloseTimeout.current) {
        clearTimeout(profileMenuCloseTimeout.current);
      }
    };
  }, []);

  const activeNavItem = navItemsByLabel[activeView];
  const isReplacementView = activeView === "Device Replacement" && hasActiveViewAccess;
  const isReplacementHistoryView = activeView === "Device Replacement History" && hasActiveViewAccess;
  const isPartStockView = activeView === "Stock of Replace a Part" && hasActiveViewAccess;
  const isPartTypeView = activeView === "Part Types" && hasActiveViewAccess;
  const isPartBorrowView = activeView === "Borrow a Part" && hasActiveViewAccess;
  const isLicenseView = activeView === "Software License" && hasActiveViewAccess;
  const isServerUsageView = activeView === "Server Usage" && hasActiveViewAccess;
  const isAssignView = activeView === "Assignation" && hasActiveViewAccess;
  const [assignationTab, setAssignationTab] = useState("Assign");
  const isUnassignView = isAssignView && assignationTab === "Unassign";
  const isBorrowView = activeView === "Borrow" && hasActiveViewAccess;
  const [borrowTab, setBorrowTab] = useState("Borrow");
  const [borrowOverdueOnly, setBorrowOverdueOnly] = useState(false);
  const isBorrowFormView = isBorrowView && borrowTab === "Borrow";
  const isCurrentBorrowsView = isBorrowView && borrowTab === "Currently Borrowed";
  const isBorrowHistoryView = isBorrowView && borrowTab === "Borrow History";
  const isStatusView = activeView === "Statuses" && hasActiveViewAccess;
  const isPartStatusView = activeView === "Part Types Statuses" && hasActiveViewAccess;
  const isCategoryView = activeView === "Category" && hasActiveViewAccess;
  const isReportView = activeView === "Report" && hasActiveViewAccess;
  const isSettingsView = activeView === "Settings" && hasActiveViewAccess;
  const [settingsTab, setSettingsTab] = useState("Users");
  const isUsersView = isSettingsView && settingsTab === "Users";
  const isActivityLogView = isSettingsView && settingsTab === "Activity Log";
  const isRecycleBinView = isSettingsView && settingsTab === "Recycle Bin";

  const departments = useDepartments({
    isActive: isDepartmentsView,
    user,
    searchTerm: isDepartmentsView ? globalSearch.query : "",
  });

  const employees = useEmployees({
    isActive: isEmployeeView,
    user,
    loadDepartments: departments.loadDepartments,
    // Only filter the directory while it's the page on screen, so a search
    // typed on another page doesn't silently narrow it later.
    searchTerm: isEmployeeView ? globalSearch.query : "",
  });

  const replacements = useReplacements({ isActive: isReplacementView || isReplacementHistoryView, user });
  const partStock = usePartStock({ isActive: isPartStockView || isPartTypeView, user });
  const partBorrow = usePartBorrow({ isActive: isPartBorrowView, user });
  const serverUsage = useServerUsage({ isActive: isServerUsageView, user });
  const licenses = useLicenses({
    isActive: isLicenseView,
    user,
    onLicensesLoaded: notifications.onLicensesLoaded,
  });
  const statuses = useStatuses({ isActive: isStatusView, user });
  const partStatuses = usePartStatuses({ isActive: isPartStatusView, user });
  const users = useUsers({ isActive: isUsersView, user });

  const equipment = useEquipment({
    // Also live on Report, which offers the all-categories export.
    isActive: isEquipmentView || isCategoryView || isReportView,
    user,
    loadDepartments: departments.loadDepartments,
    onEquipmentMutated: notifications.handleRetry,
    onEquipmentUnassigned: employees.refreshAfterExternalEquipmentChange,
  });

  // The pages that filter their own table name the columns they match on.
  // Equipment columns differ per category, so its hint lists only the ones
  // this category actually has, in EQUIPMENT_SEARCH_HINT_FIELDS order.
  const equipmentSearchPlaceholder = getEquipmentHintColumns(equipment.tableColumns, equipment.category)
    .map((column) => translateLabel(t, i18n, column.label))
    .join(" / ");

  const searchPlaceholder = isEmployeeView
    ? t("employee_search_placeholder")
    : isDepartmentsView
      ? t("department_search_placeholder")
      : isEquipmentView && equipmentSearchPlaceholder
        ? equipmentSearchPlaceholder
        : undefined;

  const recycleBin = useRecycleBin({
    isActive: isRecycleBinView,
    onRestore: () => {
      employees.handleRetry();
      departments.handleRetry();
      equipment.handleRetry();
    },
  });

  const report = useReport({ isActive: isReportView });

  const assign = useAssign({
    isActive: isAssignView,
    user,
    onAssigned: () => {
      equipment.handleRetry();
      notifications.handleRetry();
    },
  });
  const currentBorrows = useCurrentBorrows({
    isActive: isCurrentBorrowsView,
    user,
    onBorrowsLoaded: notifications.onBorrowsLoaded,
    onBorrowed: () => {
      equipment.handleRetry();
      notifications.handleRetry();
    },
    onReturned: notifications.handleRetry,
  });
  const borrowHistory = useBorrowHistory({ isActive: isBorrowHistoryView });
  const unassign = useUnassign({
    isActive: isUnassignView,
    user,
    // Returning a device to stock changes what the equipment list shows and
    // what an open employee detail modal is displaying.
    onUnassigned: () => {
      equipment.handleRetry();
      notifications.handleRetry();
      employees.refreshAfterExternalEquipmentChange();
    },
  });
  const borrowEquipment = useBorrowEquipment({
    isActive: isBorrowFormView,
    user,
    // A new loan changes what's in stock and what's due back, so both the
    // equipment list and the notification badges need re-reading.
    onBorrowed: () => {
      equipment.handleRetry();
      notifications.handleRetry();
    },
  });

  return (
    <div className="min-h-screen bg-white text-slate-950 antialiased dark:bg-slate-900 dark:text-slate-100">
      <div className="flex min-h-screen">
        {/* Mobile sidebar */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-40 xl:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/60"
              onClick={() => setIsMobileSidebarOpen(false)}
              aria-label="Close navigation"
            />
            <aside className="relative flex h-full w-72 flex-col border-r border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between pr-3">
                <SidebarBrand collapsed={false} />
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:ring-offset-slate-900"
                  aria-label="Close sidebar"
                >
                  <X />
                </button>
              </div>
              <SidebarNavigation activeView={activeView} onSelect={handleSelectView} user={user} badges={notifications.sidebarBadges} />
            </aside>
          </div>
        )}

        {/* Desktop sidebar */}
        <aside
          className={`sticky top-0 z-30 hidden h-screen min-h-0 shrink-0 flex-col border-r border-slate-200 bg-white xl:flex dark:border-slate-800 dark:bg-slate-900 ${isResizingSidebar ? "" : "transition-[width] duration-200"
            } ${isSidebarCollapsed ? "w-19" : "relative"}`}
          style={isSidebarCollapsed ? undefined : { width: sidebarWidth }}
        >
          <SidebarBrand
            collapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((value) => !value)}
          />
          <SidebarNavigation
            collapsed={isSidebarCollapsed}
            activeView={activeView}
            onSelect={handleSelectView}
            user={user}
            badges={notifications.sidebarBadges}
          />
          {!isSidebarCollapsed && (
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize sidebar"
              onMouseDown={handleSidebarResizeStart}
              className="absolute right-0 top-0 z-10 h-full w-1.5 cursor-col-resize select-none"
            />
          )}
        </aside>


        {/* Main content */}
        <main className="min-w-0 flex-1">
          {/* z-30 keeps this above the pages' own sticky header bars, which
              sit at z-20 — at the same level they won on DOM order and painted
              over the notification and profile dropdowns hanging out of here. */}
          <header className="sticky top-0 z-30 bg-[#fddd1c] backdrop-blur">
            <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-8">
              {isMobileSearchOpen ? (
                <div className="flex flex-1 items-center gap-2">
                  <GlobalSearch
                    autoFocus
                    className="flex-1"
                    value={globalSearch.query}
                    onChange={globalSearch.handleQueryChange}
                    results={globalSearch.results}
                    isLoading={globalSearch.isLoading}
                    onSelect={handleSelectGlobalSearchResult}
                    placeholder={searchPlaceholder}
                  />
                  <button
                    type="button"
                    onClick={() => setIsMobileSearchOpen(false)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-slate-400 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-900"
                    aria-label="Close search"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:text-slate-300 dark:focus-visible:ring-offset-slate-900 xl:hidden"
                    aria-label="Open navigation"
                  >
                    <Menu className="text-lg" />
                  </button>

                  <GlobalSearch
                    className="hidden w-full max-w-3xl lg:block"
                    value={globalSearch.query}
                    onChange={globalSearch.handleQueryChange}
                    results={globalSearch.results}
                    isLoading={globalSearch.isLoading}
                    onSelect={handleSelectGlobalSearchResult}
                    placeholder={searchPlaceholder}
                  />

                  {/* flex-1 + justify-end keeps the icons pinned to the right
                      edge while the search bar sits left of them. */}
                  <div className="flex flex-1 items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsMobileSearchOpen(true)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-slate-400 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-900 lg:hidden"
                      aria-label="Open search"
                    >
                      <Search size={18} />
                    </button>

                    <ThemeToggle theme={theme} onToggle={onToggleTheme} className="hidden sm:inline-flex" />
                    <LanguageToggle language={language} onToggle={onToggleLanguage} className="hidden sm:inline-flex" />

                    <div className="relative" ref={notificationsRef}>
                      <button
                        type="button"
                        onClick={() => {
                          notifications.setIsOpen((value) => !value);
                          setIsProfileMenuOpen(false);
                        }}
                        className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-950/10 text-slate-900 outline-none transition hover:bg-slate-950/20 focus-visible:ring-2 focus-visible:ring-slate-950/40"
                        aria-label="Notifications"
                        aria-haspopup="true"
                        aria-expanded={notifications.isOpen}
                      >
                        <Bell size={18} />
                        {notifications.hasUnread && (
                          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[#fddd1c]">
                            {notifications.unreadCount > 9 ? "9+" : notifications.unreadCount}
                          </span>
                        )}
                      </button>

                      {notifications.isOpen && (
                        <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700">
                            <div>
                              <p className="text-sm font-semibold text-slate-950 dark:text-white">Notifications</p>
                              <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                                {notifications.unreadCount} unread
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={notifications.handleMarkAllRead}
                                disabled={notifications.visibleNotifications.length === 0}
                                className="rounded text-xs font-semibold text-orange-600 outline-none transition hover:text-orange-700 focus-visible:ring-2 focus-visible:ring-orange-400 disabled:cursor-not-allowed disabled:text-slate-300"
                              >
                                Mark all as read
                              </button>
                            </div>
                          </div>
                          <div className="max-h-80 overflow-y-auto">
                            {notifications.isLoading && notifications.visibleNotifications.length === 0 ? (
                              <div className="px-4 py-8 text-center text-[13px] text-slate-500 dark:text-slate-400">
                                Loading notifications...
                              </div>
                            ) : notifications.visibleNotifications.length === 0 ? (
                              <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
                            ) : (
                              notifications.visibleNotifications.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => notifications.handleOpen(item)}
                                  className="flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left outline-none transition last:border-b-0 hover:bg-slate-50 focus-visible:bg-slate-50 dark:border-slate-700/60 dark:hover:bg-slate-700/60 dark:focus-visible:bg-slate-700/60"
                                >
                                  <span
                                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.unread
                                      ? item.tone === "danger"
                                        ? "bg-rose-500"
                                        : "bg-orange-500"
                                      : "bg-transparent"
                                      }`}
                                  />
                                  <div className="min-w-0">
                                    <p className="text-[13px] font-semibold text-slate-950 dark:text-white">{item.title}</p>
                                    <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">{item.detail}</p>
                                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">{item.time}</p>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div
                      className="relative hidden sm:block"
                      ref={profileMenuRef}
                      onMouseEnter={() => {
                        if (profileMenuCloseTimeout.current) {
                          clearTimeout(profileMenuCloseTimeout.current);
                        }
                        setIsProfileMenuOpen(true);
                        notifications.setIsOpen(false);
                      }}
                      onMouseLeave={() => {
                        profileMenuCloseTimeout.current = window.setTimeout(() => {
                          setIsProfileMenuOpen(false);
                        }, 150);
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen((value) => !value);
                          notifications.setIsOpen(false);
                        }}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-950/10 text-slate-900 outline-none transition hover:bg-slate-950/20 focus-visible:ring-2 focus-visible:ring-slate-950/40"
                        aria-haspopup="true"
                        aria-expanded={isProfileMenuOpen}
                        aria-label={displayName}
                      >
                        <UserIcon size={18} />
                      </button>

                      {isProfileMenuOpen && (
                        <div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                          <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-700">
                            <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{displayName}</p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{getAccessProfileLabel(user, t)}</p>
                          </div>
                          <div className="flex items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-600 dark:text-slate-300 sm:hidden">
                            <span className="flex items-center gap-2.5">
                              <Moon size={15} />
                              Dark mode
                            </span>
                            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
                          </div>
                          <div className="flex items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-600 dark:text-slate-300 sm:hidden">
                            <span className="flex items-center gap-2.5">
                              <Globe size={15} />
                              Language
                            </span>
                            <LanguageToggle language={language} onToggle={onToggleLanguage} />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              account.handleOpenProfile();
                            }}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-slate-600 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-300 dark:hover:bg-slate-700"
                          >
                            <UserIcon size={15} />
                            {t("View profile")}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              account.handleOpenChangePassword();
                            }}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-slate-600 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-300 dark:hover:bg-slate-700"
                          >
                            <Settings size={15} />
                            {t("Account settings")}
                          </button>
                          <button
                            type="button"
                            onClick={onLogout}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-rose-600 outline-none transition hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-rose-400 dark:hover:bg-rose-950/40"
                          >
                            <LogOut size={15} />
                            {t("Sign out")}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </header>

          {isDashboardHomeView && (
            <DashboardHomeView
              navSections={visibleHomeNavSections}
              stats={{
                ...home.stats,
                "Currently Borrowed": notifications.data.currentBorrows.length,
                "Software License": notifications.data.licenses.length,
                "Activity Log": activityLog.entries.length,
              }}
              isStatsLoading={home.isLoading}
              onSelectView={handleSelectView}
              notifications={notifications.visibleNotifications}
              onOpenNotification={notifications.handleOpen}
              recentActivity={myActivity.entries}
              statusBreakdown={home.statusBreakdown}
              categoryOccupancy={home.categoryOccupancy}
              isInsightsLoading={home.isInsightsLoading}
            />
          )}

          {(isEquipmentView) && (
            <EquipmentView
              search={globalSearch.query}
              canManage={canManageEquipment}
              canCreate={canCreateRecords}
              categories={equipment.categories}
              isLoading={equipment.isLoading}
              error={equipment.error}
              onRetry={equipment.handleRetry}
              selectedCategory={equipment.category}
              onSelectCategory={handleManualEquipmentCategorySelect}
              idFilter={equipmentIdFilter}
              onClearIdFilter={() => setEquipmentIdFilter(null)}
              items={equipment.items}
              columns={equipment.tableColumns}
              isItemsLoading={equipment.isItemsLoading}
              itemsError={equipment.itemsError}
              onAddNew={equipment.handleOpenAddItem}
              onEdit={equipment.handleOpenEditItem}
              onDelete={equipment.handleOpenDelete}
            />
          )}

          {isReplacementView && (
            <>
              {/* Pinned under the page header (h-14) so the category tabs stay
                  reachable while scrolling a long device list. */}
              <div className="sticky top-14 z-20 bg-white px-4 pt-6 dark:bg-slate-900 sm:px-6 lg:px-8">
                <DeviceReplacementCategoryBar
                  categories={replacements.categories}
                  selected={replacements.selectedCategory}
                  onSelect={replacements.handleSelectCategory}
                />
              </div>
              <ReplaceableDevicesView
                devices={replacements.replaceableDevices}
                columns={replacements.replaceableColumns}
                selectedCategory={replacements.selectedCategory}
                isLoading={replacements.isReplaceableLoading}
                error={replacements.replaceableError}
                onRetry={replacements.handleRetryReplaceable}
                canManage={canCreateRecords}
                onOpenReplaceDialog={replacements.handleOpenReplaceDialog}
                search={replacements.replaceableSearch}
                onSearchChange={replacements.handleReplaceableSearchChange}
              />
            </>
          )}

          {isReplacementHistoryView && (
            <ReplacementHistoryView
              replacements={replacements.replacements}
              isLoading={replacements.isLoading}
              error={replacements.error}
              onRetry={replacements.handleRetry}
            />
          )}

          {isPartStockView && (
            <PartStockView
              stock={partStock.stock}
              isLoading={partStock.isLoading}
              error={partStock.error}
              onRetry={partStock.handleRetry}
              partTypes={partStock.partTypes}
              selectedPartTypeId={partStock.selectedPartTypeId}
              onSelectPart={partStock.handleSelectPart}
              stockColumnCustomFieldOptions={partStock.stockColumnCustomFieldOptions}
              partStatuses={partStock.partStatuses}
              isAddDialogOpen={partStock.isAddDialogOpen}
              addFormValues={partStock.addFormValues}
              isSubmittingAdd={partStock.isSubmittingAdd}
              addError={partStock.addError}
              onOpenAddDialog={partStock.handleOpenAddDialog}
              onCloseAddDialog={partStock.handleCloseAddDialog}
              onAddFormChange={partStock.handleAddFormChange}
              onSubmitAdd={partStock.handleSubmitAdd}
              editStockTarget={partStock.editStockTarget}
              editFormValues={partStock.editFormValues}
              isSubmittingEdit={partStock.isSubmittingEdit}
              editError={partStock.editError}
              onOpenEditDialog={partStock.handleOpenEditDialog}
              onCloseEditDialog={partStock.handleCloseEditDialog}
              onEditFormChange={partStock.handleEditFormChange}
              onSubmitEdit={partStock.handleSubmitEdit}
              deletingStockId={partStock.deletingStockId}
              onDeleteStock={partStock.handleDeleteStock}
            />
          )}

          {isPartTypeView &&
            (canManagePartTypes ? (
              <PartTypeManagementView
                partTypes={partStock.partTypes}
                isLoading={partStock.isLoading}
                error={partStock.error}
                onRetry={partStock.handleRetry}
                onAddPartType={partStock.handleOpenAddPartType}
                onEditPartType={partStock.handleOpenEditPartType}
                onDeletePartType={partStock.handleOpenDeletePartType}
                canManage={canCreateRecords}
              />
            ) : (
              <div className="px-4 py-6 sm:px-6 lg:px-8">
                <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <EmptyState
                    icon={Box}
                    title="Not available"
                    description="This page is admin-only."
                  />
                </div>
              </div>
            ))}

          {isPartBorrowView && (
            <PartBorrowView
              borrows={partBorrow.borrows}
              isLoading={partBorrow.isLoading}
              error={partBorrow.error}
              onRetry={partBorrow.handleRetry}
              onAddBorrow={partBorrow.handleOpenBorrowDialog}
              onReturn={partBorrow.handleOpenReturnDialog}
              onDelete={partBorrow.handleOpenDeleteBorrow}
              canDelete={canCreateRecords}
            />
          )}

          {isLicenseView && (
            <LicensesView
              licenses={licenses.licenses}
              isLoading={licenses.isLoading}
              error={licenses.error}
              onRetry={licenses.handleRetry}
              onAddNew={licenses.handleOpenAdd}
              onEdit={licenses.handleOpenEdit}
              onDelete={licenses.handleOpenDelete}
              canCreate={canCreateRecords}
              canManage={canCreateRecords}
            />
          )}

          {isDepartmentsView && (
            <DepartmentsView
              canManage={canManageDepartments}
              canCreate={canCreateRecords}
              departments={departments.filteredDepartments}
              isLoading={departments.isLoading}
              error={departments.error}
              onRetry={departments.handleRetry}
              search={globalSearch.query}
              onAddNew={departments.handleOpenAdd}
              onEdit={departments.handleOpenEdit}
              onDelete={departments.handleOpenDelete}
            />
          )}

          {isServerUsageView && (
            <ServerUsageView
              usage={serverUsage.serverUsage}
              isLoading={serverUsage.isLoading}
              error={serverUsage.error}
              onRetry={serverUsage.handleRetry}
              onEdit={serverUsage.handleOpenEdit}
              dateRange={serverUsage.dateRange}
              onDateRangeChange={serverUsage.handleDateRangeChange}
              onClearDateRange={serverUsage.handleClearDateRange}
            />
          )}

          {isBorrowView && (
            <BorrowView
              activeTab={borrowTab}
              onTabChange={handleBorrowTabChange}
              canBorrow={canManageBorrows}
              canViewCurrentBorrows={canViewCurrentBorrows}
              canViewBorrowHistory={canViewBorrowHistory}
              borrowFormProps={{
                isFormDataLoading: borrowEquipment.isFormDataLoading,
                formDataError: borrowEquipment.formDataError,
                onRetryFormData: borrowEquipment.handleRetryFormData,
                categories: borrowEquipment.categories,
                deviceQuery: borrowEquipment.deviceQuery,
                onDeviceQueryChange: borrowEquipment.handleDeviceQueryChange,
                deviceCategory: borrowEquipment.deviceCategory,
                onDeviceCategoryChange: borrowEquipment.handleDeviceCategoryChange,
                deviceOptions: borrowEquipment.deviceOptions,
                isDeviceLoading: borrowEquipment.isDeviceLoading,
                deviceError: borrowEquipment.deviceError,
                selectedDevice: borrowEquipment.selectedDevice,
                onSelectDevice: borrowEquipment.handleSelectDevice,
                onClearDevice: borrowEquipment.handleClearDevice,
                employeeQuery: borrowEquipment.employeeQuery,
                onEmployeeQueryChange: borrowEquipment.handleEmployeeQueryChange,
                employeeOptions: borrowEquipment.employeeOptions,
                isEmployeeLoading: borrowEquipment.isEmployeeLoading,
                employeeError: borrowEquipment.employeeError,
                selectedEmployee: borrowEquipment.selectedEmployee,
                onSelectEmployee: borrowEquipment.handleSelectEmployee,
                onClearEmployee: borrowEquipment.handleClearEmployee,
                expectedReturnDate: borrowEquipment.expectedReturnDate,
                onExpectedReturnDateChange: borrowEquipment.handleExpectedReturnDateChange,
                purpose: borrowEquipment.purpose,
                onPurposeChange: borrowEquipment.handlePurposeChange,
                conditionOnBorrow: borrowEquipment.conditionOnBorrow,
                onConditionOnBorrowChange: borrowEquipment.handleConditionOnBorrowChange,
                remark: borrowEquipment.remark,
                onRemarkChange: borrowEquipment.handleRemarkChange,
                onSubmit: borrowEquipment.handleSubmit,
                isSubmitting: borrowEquipment.isSubmitting,
                submitError: borrowEquipment.submitError,
                submitSuccess: borrowEquipment.submitSuccess,
              }}
              currentBorrowsProps={{
                canManage: canManageBorrows,
                loans: currentBorrows.loans,
                isLoading: currentBorrows.isLoading,
                error: currentBorrows.error,
                onRetry: currentBorrows.handleRetry,
                onReturn: currentBorrows.handleOpenReturn,
                overdueOnly: borrowOverdueOnly,
                onClearOverdueOnly: () => setBorrowOverdueOnly(false),
              }}
              borrowHistoryProps={{
                history: borrowHistory.history,
                isLoading: borrowHistory.isLoading,
                error: borrowHistory.error,
                onRetry: borrowHistory.handleRetry,
                filters: borrowHistory.filters,
                onFilterChange: borrowHistory.handleFilterChange,
                onClearFilters: borrowHistory.handleClearFilters,
              }}
            />
          )}

          {!hasActiveViewAccess && !firstAccessibleDashboardView && (
            <div className="px-4 py-6 sm:px-6 lg:px-8">
              <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <EmptyState
                  icon={Box}
                  title="No pages assigned"
                  description="Ask an admin to add permissions to this account."
                />
              </div>
            </div>
          )}

          {hasActiveViewAccess &&
            !isDashboardHomeView &&
            !isEmployeeView &&
            !isDepartmentsView &&
            !isEquipmentView &&
            !isReplacementView &&
            !isReplacementHistoryView &&
            !isPartStockView &&
            !isPartTypeView &&
            !isPartBorrowView &&
            !isLicenseView &&
            !isServerUsageView &&
            !isAssignView &&
            !isCurrentBorrowsView &&
            !isBorrowHistoryView &&
            !isUsersView &&
            !isStatusView &&
            !isPartStatusView &&
            !isCategoryView &&
            !isActivityLogView &&
            !isRecycleBinView &&
            !isReportView && (
              <div className="px-4 py-6 sm:px-6 lg:px-8">
                <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <EmptyState
                    icon={activeNavItem?.icon || Box}
                    title={`${activeView} module`}
                    description="This module is coming soon."
                  />
                </div>
              </div>
            )}

          {isEmployeeView && (
            <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
              {/* Employee directory */}
              <EmployeeDirectoryTable
                canManage={canManageEmployees}
                canCreate={canCreateRecords}
                employees={employees.employees}
                totalCount={employees.totalCount}
                isLoading={employees.isLoading}
                error={employees.error}
                onRetry={employees.handleRetry}
                page={employees.page}
                pageCount={employees.pageCount}
                onPageChange={employees.setPage}
                search={globalSearch.query}
                onViewDetail={employees.handleViewDetail}
                onAddNew={employees.handleOpenAdd}
                onEdit={employees.handleOpenEdit}
                onDelete={employees.handleOpenDelete}
              />
            </div>
          )}

          {isSettingsView && (
            <SettingsView
              activeTab={settingsTab}
              onTabChange={handleSettingsTabChange}
              canManageUsers={canManageUsers}
              canManageActivityLog={canManageActivityLog}
              canManageRecycleBin={canManageRecycleBin}
              usersProps={{
                users: users.users,
                pendingCount: users.pendingApprovalCount,
                isLoading: users.isLoading,
                error: users.error,
                onRetry: users.handleRetry,
                onApprove: users.handleApprove,
                onEditPermissions: users.handleOpenEditPermissions,
                onResetPassword: users.handleOpenResetPassword,
                onDelete: users.handleOpenDeleteUser,
                currentUserId: user?.user_id ?? user?.id,
              }}
              activityLogProps={{
                entries: activityLog.filteredEntries,
                totalCount: activityLog.entries.length,
                filters: activityLog.filters,
                onFilterChange: activityLog.handleFilterChange,
                onRefresh: activityLog.handleRefresh,
                moduleOptions: ACTIVITY_MODULE_VALUES,
                actionOptions: ACTIVITY_ACTION_VALUES,
              }}
              recycleBinProps={{
                entries: recycleBin.entries,
                isLoading: recycleBin.isLoading,
                error: recycleBin.error,
                onRetry: recycleBin.handleRetry,
                typeFilter: recycleBin.typeFilter,
                onFilterChange: recycleBin.handleFilterChange,
                typeOptions: recycleBin.typeOptions,
                onRestore: recycleBin.handleRestore,
                onDeleteForever: recycleBin.handleOpenDelete,
                onPurgeAll: recycleBin.handleOpenPurge,
                restoringId: recycleBin.restoringId,
                deletingId: recycleBin.deletingId,
                isPurging: recycleBin.isPurging,
                actionError: recycleBin.actionError,
              }}
            />
          )}

          {isStatusView &&
            (canManageStatuses ? (
              <StatusesView
                statuses={statuses.statuses}
                isLoading={statuses.isLoading}
                error={statuses.error}
                onRetry={statuses.handleRetry}
                onAddNew={statuses.handleOpenAdd}
                onEdit={statuses.handleOpenEdit}
                onDelete={statuses.handleOpenDelete}
                onDownloadStatusPdf={statuses.handleDownloadStatusPdf}
                onDownloadStatusExcel={statuses.handleDownloadStatusExcel}
                downloadingPdfId={statuses.downloadingPdfId}
                downloadingExcelId={statuses.downloadingExcelId}
                onDownloadAllPdf={statuses.handleDownloadAllPdf}
                onDownloadAllExcel={statuses.handleDownloadAllExcel}
                isDownloadingAllPdf={statuses.isDownloadingAllPdf}
                isDownloadingAllExcel={statuses.isDownloadingAllExcel}
                downloadError={statuses.downloadError}
              />
            ) : (
              <div className="px-4 py-6 sm:px-6 lg:px-8">
                <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <EmptyState
                    icon={Box}
                    title="Not available"
                    description="This page is admin-only."
                  />
                </div>
              </div>
            ))}

          {isPartStatusView &&
            (canManagePartStatuses ? (
              <PartStatusesView
                statuses={partStatuses.statuses}
                isLoading={partStatuses.isLoading}
                error={partStatuses.error}
                onRetry={partStatuses.handleRetry}
                onAddNew={partStatuses.handleOpenAdd}
                onEdit={partStatuses.handleOpenEdit}
                onDelete={partStatuses.handleOpenDelete}
                onDownloadStatusPdf={partStatuses.handleDownloadStatusPdf}
                onDownloadStatusExcel={partStatuses.handleDownloadStatusExcel}
                downloadingPdfId={partStatuses.downloadingPdfId}
                downloadingExcelId={partStatuses.downloadingExcelId}
                onDownloadAllPdf={partStatuses.handleDownloadAllPdf}
                onDownloadAllExcel={partStatuses.handleDownloadAllExcel}
                isDownloadingAllPdf={partStatuses.isDownloadingAllPdf}
                isDownloadingAllExcel={partStatuses.isDownloadingAllExcel}
                downloadError={partStatuses.downloadError}
              />
            ) : (
              <div className="px-4 py-6 sm:px-6 lg:px-8">
                <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <EmptyState
                    icon={Box}
                    title="Not available"
                    description="This page is admin-only."
                  />
                </div>
              </div>
            ))}

          {isCategoryView &&
            (canManageCategory ? (
              <CategoryManagementView
                categories={equipment.categories}
                isLoading={equipment.isLoading}
                error={equipment.error}
                onRetry={equipment.handleRetry}
                onAddCategory={equipment.handleOpenAddCategory}
                onEditCategory={equipment.handleOpenEditCategory}
                onDeleteCategory={equipment.handleOpenDeleteCategory}
                canManage={canCreateRecords}
              />
            ) : (
              <div className="px-4 py-6 sm:px-6 lg:px-8">
                <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <EmptyState
                    icon={Box}
                    title="Not available"
                    description="This page is admin-only."
                  />
                </div>
              </div>
            ))}

          {isAssignView &&
            (canManageAssign ? (
              <AssignationView
                activeTab={assignationTab}
                onTabChange={handleAssignationTabChange}
                assignProps={{
                  isFormDataLoading: assign.isFormDataLoading,
                  formDataError: assign.formDataError,
                  onRetryFormData: assign.handleRetryFormData,
                  categories: assign.formData.categories,
                  positions: assign.formData.positions,
                  statuses: assign.formData.statuses,
                  deviceQuery: assign.deviceQuery,
                  onDeviceQueryChange: assign.handleDeviceQueryChange,
                  deviceCategory: assign.deviceCategory,
                  onDeviceCategoryChange: assign.handleDeviceCategoryChange,
                  deviceOptions: assign.deviceOptions,
                  isDeviceLoading: assign.isDeviceLoading,
                  deviceError: assign.deviceError,
                  selectedDevice: assign.selectedDevice,
                  onSelectDevice: assign.handleSelectDevice,
                  onClearDevice: assign.handleClearDevice,
                  position: assign.position,
                  onPositionChange: assign.handlePositionChange,
                  employeeQuery: assign.employeeQuery,
                  onEmployeeQueryChange: assign.handleEmployeeQueryChange,
                  employeeOptions: assign.employeeOptions,
                  isEmployeeLoading: assign.isEmployeeLoading,
                  employeeError: assign.employeeError,
                  selectedEmployee: assign.selectedEmployee,
                  onSelectEmployee: assign.handleSelectEmployee,
                  onClearEmployee: assign.handleClearEmployee,
                  status: assign.status,
                  onStatusChange: assign.handleStatusChange,
                  assignedDate: assign.assignedDate,
                  onAssignedDateChange: assign.handleAssignedDateChange,
                  onSubmit: assign.handleSubmit,
                  isSubmitting: assign.isSubmitting,
                  submitError: assign.submitError,
                  submitSuccess: assign.submitSuccess,
                  conflict: assign.conflict,
                  onResolveConflict: assign.handleResolveConflict,
                  isResolvingConflict: assign.isResolvingConflict,
                }}
                unassignProps={{
                  items: unassign.items,
                  totalCount: unassign.totalCount,
                  isLoading: unassign.isLoading,
                  error: unassign.error,
                  onRetry: unassign.handleRetry,
                  search: unassign.search,
                  onSearchChange: unassign.handleSearchChange,
                  page: unassign.page,
                  pageCount: unassign.pageCount,
                  onPageChange: unassign.setPage,
                  target: unassign.target,
                  isUnassigning: unassign.isUnassigning,
                  unassignError: unassign.unassignError,
                  successMessage: unassign.successMessage,
                  onOpenUnassign: unassign.handleOpenUnassign,
                  onCloseUnassign: unassign.handleCloseUnassign,
                  onConfirmUnassign: unassign.handleConfirmUnassign,
                }}
              />
            ) : (
              <div className="px-4 py-6 sm:px-6 lg:px-8">
                <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <EmptyState icon={Box} title="Not available" description="This page is admin-only." />
                </div>
              </div>
            ))}

          {isReportView &&
            (canManageReport ? (
              <ReportView
                report={report.report}
                isLoading={report.isLoading}
                error={report.error}
                onRetry={report.handleRetry}
                onDownloadEmployeesPdf={report.handleDownloadEmployeesPdf}
                onDownloadEmployeesExcel={report.handleDownloadEmployeesExcel}
                onDownloadEmployeesBySexPdf={report.handleDownloadEmployeesBySexPdf}
                onDownloadEmployeesBySexExcel={report.handleDownloadEmployeesBySexExcel}
                downloadingSex={report.downloadingSex}
                onDownloadDepartmentEmployeesPdf={report.handleDownloadDepartmentEmployeesPdf}
                onDownloadDepartmentEmployeesExcel={report.handleDownloadDepartmentEmployeesExcel}
                onDownloadDepartmentEquipmentPdf={report.handleDownloadDepartmentEquipmentPdf}
                onDownloadDepartmentEquipmentExcel={report.handleDownloadDepartmentEquipmentExcel}
                downloadingDepartment={report.downloadingDepartment}
                onDownloadManagementPdf={report.handleDownloadManagementPdf}
                onDownloadManagementExcel={report.handleDownloadManagementExcel}
                onDownloadManagementsPdf={report.handleDownloadManagementsPdf}
                onDownloadManagementsExcel={report.handleDownloadManagementsExcel}
                downloadingManagement={report.downloadingManagement}
                onDownloadReplacementPdf={report.handleDownloadReplacementPdf}
                onDownloadReplacementExcel={report.handleDownloadReplacementExcel}
                onDownloadReplacementsPdf={report.handleDownloadReplacementsPdf}
                onDownloadReplacementsExcel={report.handleDownloadReplacementsExcel}
                downloadingReplacement={report.downloadingReplacement}
                onDownloadLicenseByStatusPdf={report.handleDownloadLicenseByStatusPdf}
                onDownloadLicenseByStatusExcel={report.handleDownloadLicenseByStatusExcel}
                onDownloadLicensesPdf={report.handleDownloadLicensesPdf}
                onDownloadLicensesExcel={report.handleDownloadLicensesExcel}
                downloadingLicense={report.downloadingLicense}
                isDownloadingEmployeesPdf={report.isDownloadingEmployeesPdf}
                isDownloadingEmployeesExcel={report.isDownloadingEmployeesExcel}
                onDownloadDepartmentsPdf={report.handleDownloadDepartmentsPdf}
                onDownloadDepartmentsExcel={report.handleDownloadDepartmentsExcel}
                onDownloadEquipmentPdf={equipment.handleDownloadAllEquipmentPdf}
                onDownloadEquipmentExcel={equipment.handleDownloadAllEquipmentExcel}
                isDownloadingEquipmentPdf={equipment.isDownloadingAllPdf}
                isDownloadingEquipmentExcel={equipment.isDownloadingAllExcel}
                onDownloadEquipmentGroupPdf={report.handleDownloadEquipmentGroupPdf}
                onDownloadEquipmentGroupExcel={report.handleDownloadEquipmentGroupExcel}
                downloadingEquipmentGroup={report.downloadingEquipmentGroup}
                onDownloadServerUsagePdf={report.handleDownloadServerUsagePdf}
                onDownloadServerUsageExcel={report.handleDownloadServerUsageExcel}
                downloadingServerUsage={report.downloadingServerUsage}
              />
            ) : (
              <div className="px-4 py-6 sm:px-6 lg:px-8">
                <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <EmptyState icon={Box} title="Not available" description="This page is admin-only." />
                </div>
              </div>
            ))}
        </main>
      </div>

      {employees.detailTarget && (
        <EmployeeDetailModal
          employee={employees.detailTarget}
          devices={employees.detailDevices}
          isLoading={employees.isDetailLoading}
          error={employees.detailError}
          onRetry={employees.handleRetryDetail}
          onClose={employees.handleCloseDetail}
          onUnassign={equipment.handleOpenUnassign}
          canManage={canManageEmployees}
        />
      )}

      <EquipmentFormModal
        isOpen={equipment.isFormOpen}
        mode={equipment.formMode}
        values={equipment.formValues}
        onChange={equipment.handleFormFieldChange}
        onSubmit={equipment.handleSubmitForm}
        onClose={equipment.handleCloseForm}
        isSubmitting={equipment.isSaving}
        error={equipment.formError}
        missingFields={equipment.missingFields}
        departments={departments.departments}
        employees={equipment.formEmployees}
        statuses={equipment.statuses}
        categoryOptions={equipment.formCategoryOptions}
        categoryLocked
        fields={equipment.formFields}
        onRemoveField={equipment.handleRemoveField}
        onOpenColumnsPicker={equipment.handleOpenColumnsPickerFromForm}
        licenseOptions={equipment.softwareLicenseOptions}
        selectedLicenseIds={equipment.licenseSelectedIds}
        onToggleLicense={equipment.handleToggleSoftwareLicenseSelection}
        isLicensesLoading={equipment.isSoftwareLicenseOptionsLoading}
        licensesError={equipment.softwareLicenseOptionsError}
      />

      <ColumnsPickerModal
        isOpen={equipment.isColumnsPickerOpen}
        categoryLabel={equipment.columnsPickerCategoryLabel}
        fields={equipment.availableViewFields}
        selectedKeys={equipment.columnsPickerSelectedKeys}
        onToggle={equipment.handleToggleColumnField}
        customFields={equipment.columnsPickerCustomFields}
        reusableFields={equipment.reusableCustomFields}
        fieldTypes={equipment.customFieldTypes}
        onAddField={equipment.handleAddCustomFieldFromPicker}
        onRemoveField={equipment.handleRemoveCustomFieldFromPicker}
        onReuseField={equipment.handleReuseCustomFieldFromPicker}
        onSave={equipment.handleSaveColumnsPicker}
        onClose={equipment.handleCloseColumnsPicker}
        isLoading={equipment.isColumnsPickerLoading}
        isSaving={equipment.isSavingColumns}
        error={equipment.columnsPickerError}
        onError={equipment.setColumnsPickerError}
      />

      <BorrowEquipmentModal
        isOpen={currentBorrows.isBorrowModalOpen}
        equipment={currentBorrows.borrowTarget}
        values={currentBorrows.borrowValues}
        onChange={currentBorrows.handleBorrowFieldChange}
        onSelectEmployee={currentBorrows.handleBorrowEmployeeSelect}
        onSubmit={currentBorrows.handleSubmitBorrow}
        onClose={currentBorrows.handleCloseBorrow}
        isSubmitting={currentBorrows.isBorrowing}
        error={currentBorrows.borrowError}
        employees={currentBorrows.employeeOptions}
      />

      <ReturnEquipmentModal
        isOpen={currentBorrows.isReturnModalOpen}
        loan={currentBorrows.returnTarget}
        values={currentBorrows.returnValues}
        onChange={currentBorrows.handleReturnFieldChange}
        onSubmit={currentBorrows.handleSubmitReturn}
        onClose={currentBorrows.handleCloseReturn}
        isSubmitting={currentBorrows.isReturning}
        error={currentBorrows.returnError}
      />

      <BorrowPartDialog
        isOpen={partBorrow.isBorrowDialogOpen}
        values={partBorrow.borrowValues}
        onChange={partBorrow.handleBorrowFieldChange}
        onSelectPartType={partBorrow.handleSelectBorrowPartType}
        onSelectStock={partBorrow.handleSelectBorrowStock}
        onSelectEmployee={partBorrow.handleSelectBorrowEmployee}
        onSubmit={partBorrow.handleSubmitBorrow}
        onClose={partBorrow.handleCloseBorrowDialog}
        isSubmitting={partBorrow.isSubmittingBorrow}
        error={partBorrow.borrowError}
        partTypes={partBorrow.partTypes}
        employees={partBorrow.employeeOptions}
        availableStock={partBorrow.availableStock}
        isAvailableStockLoading={partBorrow.isAvailableStockLoading}
        availableStockError={partBorrow.availableStockError}
        missingFields={partBorrow.borrowMissingFields}
      />

      <ReturnPartDialog
        borrow={partBorrow.returnTarget}
        values={partBorrow.returnValues}
        partStatuses={partBorrow.partStatuses}
        onChange={partBorrow.handleReturnFieldChange}
        onSubmit={partBorrow.handleSubmitReturn}
        onClose={partBorrow.handleCloseReturnDialog}
        isSubmitting={partBorrow.isSubmittingReturn}
        error={partBorrow.returnError}
      />

      <DeleteBorrowDialog
        borrow={partBorrow.deletingBorrow}
        onConfirm={partBorrow.handleConfirmDeleteBorrow}
        onCancel={partBorrow.handleCloseDeleteBorrow}
        isConfirming={partBorrow.isDeletingBorrow}
        error={partBorrow.deleteBorrowError}
      />

      <EmployeeFormModal
        isOpen={employees.isFormOpen}
        mode={employees.formMode}
        values={employees.formValues}
        onChange={employees.handleFormFieldChange}
        onSubmit={employees.handleSubmitForm}
        onClose={employees.handleCloseForm}
        isSubmitting={employees.isSaving}
        error={employees.formError}
        missingFields={employees.missingFields}
        departments={departments.departments}
      />

      <DepartmentFormModal
        isOpen={departments.isFormOpen}
        mode={departments.formMode}
        values={departments.formValues}
        onChange={departments.handleFormFieldChange}
        onSubmit={departments.handleSubmitForm}
        onClose={departments.handleCloseForm}
        isSubmitting={departments.isSaving}
        error={departments.formError}
        missingFields={departments.missingFields}
      />

      <UserPermissionsModal
        isOpen={Boolean(users.permissionsTarget)}
        user={users.permissionsTarget}
        values={users.permissionValues}
        onChange={users.handlePermissionFieldChange}
        onSubmit={users.handleSubmitEditPermissions}
        onClose={users.handleCloseEditPermissions}
        isSubmitting={users.isSavingPermissions}
        error={users.permissionsError}
      />

      <ResetPasswordModal
        isOpen={Boolean(users.resetPasswordTarget)}
        user={users.resetPasswordTarget}
        password={users.resetPassword}
        confirmPassword={users.resetPasswordConfirm}
        onChangePassword={users.setResetPassword}
        onChangeConfirmPassword={users.setResetPasswordConfirm}
        onSubmit={users.handleSubmitResetPassword}
        onClose={users.handleCloseResetPassword}
        isSubmitting={users.isResettingPassword}
        error={users.resetPasswordError}
      />

      <ConfirmDialog
        isOpen={Boolean(users.userToDelete)}
        title="Delete this account?"
        message={
          users.userToDelete
            ? `"${users.userToDelete.username}" will be permanently removed and will no longer be able to sign in. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete account"
        onConfirm={users.handleConfirmDeleteUser}
        onCancel={users.handleCloseDeleteUser}
        isConfirming={users.isDeletingUser}
        error={users.deleteUserError}
      />

      <CategoryFormModal
        isOpen={equipment.isCategoryFormOpen}
        mode={equipment.categoryFormMode}
        values={equipment.categoryFormValues}
        onChange={equipment.handleCategoryFormFieldChange}
        onSubmit={equipment.handleSubmitCategoryForm}
        onClose={equipment.handleCloseCategoryForm}
        isSubmitting={equipment.isSavingCategory}
        error={equipment.categoryFormError}
        missingFields={equipment.categoryMissingFields}
      />

      <PartTypeFormModal
        isOpen={partStock.isPartTypeFormOpen}
        mode={partStock.partTypeFormMode}
        values={partStock.partTypeFormValues}
        categories={partStock.allCategories}
        isLoadingCategories={partStock.isLoadingPartTypeCategories}
        stockColumnBuiltInOptions={partStock.stockColumnBuiltInOptions}
        stockColumnCustomFieldOptions={partStock.stockColumnCustomFieldOptions}
        customFieldTypes={partStock.partCustomFieldTypes}
        selectedStockColumns={partStock.selectedStockColumns}
        isLoadingStockColumns={partStock.isLoadingStockColumns}
        stockColumnsError={partStock.stockColumnsError}
        onChange={partStock.handlePartTypeFormFieldChange}
        onToggleCategory={partStock.handleTogglePartTypeCategory}
        onToggleStockColumn={partStock.handleToggleStockColumn}
        onAddCustomField={partStock.handleAddCustomField}
        onSubmit={partStock.handleSubmitPartTypeForm}
        onClose={partStock.handleClosePartTypeForm}
        isSubmitting={partStock.isSavingPartType}
        error={partStock.partTypeFormError}
        missingFields={partStock.partTypeMissingFields}
      />

      <ConfirmDialog
        isOpen={Boolean(partStock.partTypeToDelete)}
        title="Delete this part?"
        message={
          partStock.partTypeToDelete
            ? `Remove "${partStock.partTypeToDelete.part_name}" from the part catalog. This can't be undone.${partStock.linkedEquipmentField
              ? ` It'll also delete the linked equipment field "${partStock.linkedEquipmentField.label}" everywhere it's used.`
              : ""
            }`
            : ""
        }
        confirmLabel="Delete"
        confirmingLabel="Deleting..."
        onConfirm={partStock.handleConfirmDeletePartType}
        onCancel={partStock.handleCloseDeletePartType}
        isConfirming={partStock.isDeletingPartType}
        error={partStock.deletePartTypeError}
        blocked={partStock.deletePartTypeBlocked}
        blockedActionLabel="Deactivate instead"
        onBlockedAction={partStock.handleDeactivatePartTypeInstead}
      />

      <ReplaceDeviceDialog
        device={replacements.replaceDialogTarget}
        onClose={replacements.handleCloseReplaceDialog}
        partTypes={replacements.partTypes}
        stockColumnCustomFieldOptions={replacements.stockColumnCustomFieldOptions}
        partStatuses={replacements.partStatuses}
        selectedPartTypeId={replacements.selectedPartTypeId}
        onSelectPartType={replacements.handleSelectPartType}
        partAction={replacements.partAction}
        onSelectPartAction={replacements.handleSelectPartAction}
        partNewValue={replacements.partNewValue}
        oldPartStatus={replacements.oldPartStatus}
        onSelectOldPartStatus={replacements.handleSelectOldPartStatus}
        onSubmitPart={replacements.handleSubmitPartReplace}
        isSubmittingPart={replacements.isSubmittingPart}
        submitPartError={replacements.submitPartError}
        availableStock={replacements.availableStock}
        isAvailableStockLoading={replacements.isAvailableStockLoading}
        availableStockError={replacements.availableStockError}
        onRetryAvailableStock={replacements.handleRetryAvailableStock}
        selectedStockId={replacements.selectedStockId}
        onSelectStock={replacements.handleSelectStock}
        isQuickAddDialogOpen={replacements.isQuickAddDialogOpen}
        quickAddFormValues={replacements.quickAddFormValues}
        isSubmittingQuickAdd={replacements.isSubmittingQuickAdd}
        quickAddError={replacements.quickAddError}
        onOpenQuickAddDialog={replacements.handleOpenQuickAddDialog}
        onCloseQuickAddDialog={replacements.handleCloseQuickAddDialog}
        onQuickAddFormChange={replacements.handleQuickAddFormChange}
        onSubmitQuickAdd={replacements.handleSubmitQuickAdd}
      />

      <LicenseFormModal
        isOpen={licenses.isFormOpen}
        mode={licenses.formMode}
        values={licenses.formValues}
        onChange={licenses.handleFormFieldChange}
        onSubmit={licenses.handleSubmitForm}
        onClose={licenses.handleCloseForm}
        isSubmitting={licenses.isSaving}
        error={licenses.formError}
        missingFields={licenses.missingFields}
      />

      <ServerUsageEditModal
        target={serverUsage.editTarget}
        values={serverUsage.editValues}
        onChange={serverUsage.handleEditFieldChange}
        onSubmit={serverUsage.handleSubmitEdit}
        onClose={serverUsage.handleCloseEdit}
        isSubmitting={serverUsage.isSavingEdit}
        error={serverUsage.editError}
      />

      <ConfirmDialog
        isOpen={Boolean(licenses.licenseToDelete)}
        title="Delete this software license?"
        message={
          licenses.licenseToDelete
            ? `"${licenses.licenseToDelete.product_name}" will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete software license"
        onConfirm={licenses.handleConfirmDelete}
        onCancel={licenses.handleCloseDelete}
        isConfirming={licenses.isDeleting}
        error={licenses.deleteError}
      />

      <StatusFormModal
        isOpen={statuses.isFormOpen}
        mode={statuses.formMode}
        values={statuses.formValues}
        onChange={statuses.handleFormFieldChange}
        onSubmit={statuses.handleSubmitForm}
        onClose={statuses.handleCloseForm}
        isSubmitting={statuses.isSaving}
        error={statuses.formError}
        missingFields={statuses.missingFields}
      />

      <ConfirmDialog
        isOpen={Boolean(statuses.statusToDelete)}
        title="Delete this status?"
        message={
          statuses.statusToDelete
            ? `"${statuses.statusToDelete.status_name}" will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete status"
        onConfirm={statuses.handleConfirmDelete}
        onCancel={statuses.handleCloseDelete}
        isConfirming={statuses.isDeleting}
        error={statuses.deleteError}
        blocked={statuses.deleteBlocked}
        blockedActionLabel="Hide instead"
        onBlockedAction={statuses.handleHideInstead}
      />

      <PartStatusFormModal
        isOpen={partStatuses.isFormOpen}
        mode={partStatuses.formMode}
        values={partStatuses.formValues}
        onChange={partStatuses.handleFormFieldChange}
        onSubmit={partStatuses.handleSubmitForm}
        onClose={partStatuses.handleCloseForm}
        isSubmitting={partStatuses.isSaving}
        error={partStatuses.formError}
        missingFields={partStatuses.missingFields}
      />

      <ConfirmDialog
        isOpen={Boolean(partStatuses.statusToDelete)}
        title="Delete this status?"
        message={
          partStatuses.statusToDelete
            ? `"${partStatuses.statusToDelete.status_name}" will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete status"
        onConfirm={partStatuses.handleConfirmDelete}
        onCancel={partStatuses.handleCloseDelete}
        isConfirming={partStatuses.isDeleting}
        error={partStatuses.deleteError}
        blocked={partStatuses.deleteBlocked}
        blockedActionLabel="Hide instead"
        onBlockedAction={partStatuses.handleHideInstead}
      />

      <ConfirmDialog
        isOpen={Boolean(employees.employeeToDelete)}
        title="Delete this employee?"
        message={
          employees.employeeToDelete
            ? `"${employees.employeeToDelete.full_name}" will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete employee"
        onConfirm={employees.handleConfirmDelete}
        onCancel={employees.handleCloseDelete}
        isConfirming={employees.isDeleting}
        error={employees.deleteError}
        blocked={employees.deleteBlocked}
        blockedActionLabel="Unassign devices"
        onBlockedAction={employees.handleViewAssignedDevicesFromDelete}
      />

      <ConfirmDialog
        isOpen={Boolean(equipment.equipmentToUnassign)}
        title="Unassign this equipment?"
        message={
          equipment.equipmentToUnassign
            ? `"${getEquipmentDisplayName(equipment.equipmentToUnassign)}" will be removed from ${equipment.equipmentToUnassign.owner_name || "its current owner"
            } and returned to stock available as Working - IT Stock.`
            : ""
        }
        confirmLabel="Unassign"
        confirmingLabel="Unassigning..."
        onConfirm={equipment.handleConfirmUnassign}
        onCancel={equipment.handleCloseUnassign}
        isConfirming={equipment.isUnassigning}
        error={equipment.unassignError}
      />

      <ConfirmDialog
        isOpen={Boolean(equipment.equipmentToDelete)}
        title="Delete this equipment?"
        message={
          equipment.equipmentToDelete
            ? `"${getEquipmentDisplayName(equipment.equipmentToDelete)}" will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete equipment"
        onConfirm={equipment.handleConfirmDelete}
        onCancel={equipment.handleCloseDelete}
        isConfirming={equipment.isDeleting}
        error={equipment.deleteError}
      />

      <ConfirmDialog
        isOpen={Boolean(departments.departmentToDelete)}
        title="Delete this department?"
        message={
          departments.departmentToDelete
            ? `"${departments.departmentToDelete.department_name}" will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete department"
        onConfirm={departments.handleConfirmDelete}
        onCancel={departments.handleCloseDelete}
        isConfirming={departments.isDeleting}
        error={departments.deleteError}
      />

      <ConfirmDialog
        isOpen={Boolean(equipment.categoryToDelete)}
        title="Delete this category?"
        message={
          equipment.categoryToDelete
            ? `"${equipment.categoryToDelete.category_name || equipment.categoryToDelete.category || equipment.categoryToDelete.label
            }" will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete category"
        onConfirm={equipment.handleConfirmDeleteCategory}
        onCancel={equipment.handleCloseDeleteCategory}
        isConfirming={equipment.isDeletingCategory}
        error={equipment.deleteCategoryError}
      />

      <ConfirmDialog
        isOpen={Boolean(recycleBin.itemToDelete)}
        title="Delete this item forever?"
        message="This will permanently remove it from the recycle bin. This cannot be undone."
        confirmLabel="Delete forever"
        onConfirm={recycleBin.handleConfirmDelete}
        onCancel={recycleBin.handleCloseDelete}
        isConfirming={Boolean(recycleBin.deletingId)}
        error={recycleBin.actionError}
      />

      <ConfirmDialog
        isOpen={recycleBin.isPurgeOpen}
        title="Delete everything in the recycle bin forever?"
        message={`${recycleBin.entries.length} item${recycleBin.entries.length === 1 ? "" : "s"} will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete All Forever"
        onConfirm={recycleBin.handleConfirmPurge}
        onCancel={recycleBin.handleClosePurge}
        isConfirming={recycleBin.isPurging}
        error={recycleBin.actionError}
      />

      <ProfileModal
        isOpen={account.isProfileOpen}
        profile={account.profile}
        isLoading={account.isProfileLoading}
        error={account.profileError}
        accessLabel={getAccessProfileLabel(user, t)}
        onClose={account.handleCloseProfile}
      />

      <ChangePasswordModal
        isOpen={account.isPasswordOpen}
        currentPassword={account.currentPassword}
        newPassword={account.newPassword}
        confirmPassword={account.confirmPassword}
        onChangeCurrentPassword={account.setCurrentPassword}
        onChangeNewPassword={account.setNewPassword}
        onChangeConfirmPassword={account.setConfirmPassword}
        onSubmit={account.handleSubmitChangePassword}
        onClose={account.handleCloseChangePassword}
        isSubmitting={account.isSavingPassword}
        error={account.passwordError}
      />
    </div>
  );
}

export default Dashboard;
