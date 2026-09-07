import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiBox as Box,
  FiLayers as Layers,
  FiSearch as Search,
  FiUserCheck as UserCheck,
  FiUsers as Users,
} from "react-icons/fi";

const SECTION_META = {
  employees: { label: "Employees", icon: Users },
  departments: { label: "Departments", icon: Layers },
  equipment: { label: "Equipment", icon: Box },
  users: { label: "Users", icon: UserCheck },
};

const EMPTY_RESULTS = {
  employees: [],
  departments: [],
  equipment: [],
  users: [],
};

function joinDetail(parts) {
  return parts.filter(Boolean).join(" - ");
}

function getResultKey(type, item, index) {
  return [
    type,
    item.employee_id ??
    item.department_id ??
    item.equipment_id ??
    item.user_id ??
    item.owner_name ??
    item.full_name ??
    item.username ??
    index,
  ].join("-");
}

function getResultLabel(type, item) {
  if (type === "employees") {
    return item.owner_name || item.full_name || item.name || `Employee #${item.employee_id}`;
  }
  if (type === "departments") return item.department_name || item.department_code || "Department";
  if (type === "equipment") {
    // Same priority order as getEquipmentDisplayName — device_name is the
    // one nearly every record actually has set, computer_name often isn't.
    return (
      item.device_name ||
      item.name ||
      item.computer_name ||
      item.device_model ||
      item.asset_code ||
      item.equipment_code ||
      `Equipment #${item.equipment_id}`
    );
  }
  if (type === "users") return item.username || "User";
  return "";
}

function getResultDetail(type, item) {
  if (type === "employees") {
    return joinDetail([
      item.employee_position || item.position,
      item.employee_department || item.department_code || item.department,
      item.employee_location || item.location,
      item.devices?.length ? `${item.devices.length} device${item.devices.length === 1 ? "" : "s"}` : null,
    ]);
  }
  if (type === "departments") return item.department_code;
  if (type === "equipment") {
    return joinDetail([
      item.category || item.category_name || item.device_type,
      item.asset_code || item.equipment_code || item.service_tag,
      item.owner_name,
    ]);
  }
  if (type === "users") return joinDetail([item.username, item.role]);
  return "";
}

export function GlobalSearch({
  value,
  onChange,
  results,
  isLoading,
  onSelect,
  autoFocus = false,
  placeholder,
  inputClassName,
  className = "w-full lg:w-72",
  // Kept as an opt-out for callers that want the box without the dropdown;
  // the dashboard header shows results on every page.
  showResults = true,
}) {
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const safeResults = results || EMPTY_RESULTS;

  useEffect(() => {
    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsFocused(false);
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const term = value.trim();
  const showDropdown = showResults && isFocused && term.length >= 2;
  const sectionKeys = Object.keys(SECTION_META).filter((key) => (safeResults[key] || []).length > 0);
  const hasAnyResults = sectionKeys.length > 0;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <label className="relative block">
        <span className="sr-only">Search</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" size={16} />
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder || t("Search...")}
          className={
            inputClassName ||
            "h-9 w-full rounded-lg border border-slate-950/10 bg-white/80 pl-9 pr-14 text-sm text-slate-800 outline-none transition placeholder:text-slate-500 hover:bg-white/90 focus:border-slate-950/20 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:hover:bg-slate-900 dark:focus:border-slate-600 dark:focus:bg-slate-900"
          }
        />
        {!value && (
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500 sm:flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            Ctrl K
          </kbd>
        )}
      </label>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
          {isLoading && !hasAnyResults ? (
            <div className="px-4 py-6 text-center text-[13px] text-slate-500 dark:text-slate-400">{t("Searching...")}</div>
          ) : !hasAnyResults ? (
            <div className="px-4 py-6 text-center text-[13px] text-slate-500 dark:text-slate-400">
              {t("No results for", { term })}
            </div>
          ) : (
            sectionKeys.map((key) => {
              const meta = SECTION_META[key];
              const Icon = meta.icon;
              return (
                <div key={key} className="border-b border-slate-50 py-1.5 last:border-b-0 dark:border-slate-700/60">
                  <p className="px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    {t(meta.label)}
                  </p>
                  {safeResults[key].map((item, index) => {
                    const detail = getResultDetail(key, item);
                    return (
                      <button
                        key={getResultKey(key, item, index)}
                        type="button"
                        onClick={() => {
                          setIsFocused(false);
                          onSelect(key, item);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left outline-none transition hover:bg-slate-50 focus-visible:bg-slate-50 dark:hover:bg-slate-700/60 dark:focus-visible:bg-slate-700/60"
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                          <Icon size={14} />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium text-slate-900 dark:text-slate-100">
                            {getResultLabel(key, item)}
                          </span>
                          {detail && <span className="block truncate text-[12px] text-slate-500 dark:text-slate-400">{detail}</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}