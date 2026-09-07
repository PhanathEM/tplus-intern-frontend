import { useEffect, useRef, useState } from "react";
import { fetchEmployees } from "../../../services/employeeService";
import { fetchDepartments } from "../../../services/departmentService";
import { fetchUsers } from "../../../services/userService";
import { fetchEquipmentByCategory } from "../../../services/equipmentService";
import { hasPermission, PERMISSIONS } from "../../../lib/permissions";
import { getEmployeeDepartmentCode } from "../dashboard.utils";

function createEmptyResults() {
  return {
    employees: [],
    departments: [],
    equipment: [],
    users: [],
  };
}

// Independently re-fetches and filters each category rather than reusing
// other hooks' already-loaded lists — a deliberate existing product decision
// (search must work across categories the user hasn't visited yet), not
// something this pass unifies.
// The dropdown is available on every page, so the search runs on every page
// too - the pages that also filter their own table from this box (Employees,
// Departments, Equipment) do both at once.
export function useGlobalSearch({ user, onSelectView, onSelectEquipmentCategory }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(createEmptyResults);
  const [isLoading, setIsLoading] = useState(false);
  const equipmentCacheRef = useRef(null);

  function handleQueryChange(nextQuery) {
    setQuery(nextQuery);
    if (nextQuery.trim().length < 2) {
      setResults(createEmptyResults());
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;

    let ignore = false;
    const lowerTerm = term.toLowerCase();

    const timeoutId = window.setTimeout(() => {
      setIsLoading(true);

      const jobs = [];

      if (hasPermission(user, PERMISSIONS.EMPLOYEE)) {
        // Filtered here rather than through /api/employees/search, which only
        // matches on name — the directory is searchable by every column shown
        // in its table, so the same seven fields have to match here too.
        // Re-fetched per search (the effect is already debounced) so a newly
        // added employee is findable without a reload.
        jobs.push(
          fetchEmployees()
            .then((data) => ({
              key: "employees",
              items: (Array.isArray(data) ? data : [])
                .filter((employee) =>
                  `${employee.full_name || ""} ${employee.staff_code || ""} ${employee.phone || ""} ${employee.position || ""} ${getEmployeeDepartmentCode(employee) || ""} ${employee.sex || ""} ${employee.location || ""}`
                    .toLowerCase()
                    .includes(lowerTerm)
                )
                .slice(0, 5),
            }))
            .catch(() => ({ key: "employees", items: [] }))
        );
      }

      if (hasPermission(user, PERMISSIONS.DEPARTMENTS)) {
        jobs.push(
          fetchDepartments()
            .then((data) => ({
              key: "departments",
              items: (Array.isArray(data) ? data : [])
                .filter((department) =>
                  `${department.department_name || ""} ${department.department_code || ""}`
                    .toLowerCase()
                    .includes(lowerTerm)
                )
                .slice(0, 5),
            }))
            .catch(() => ({ key: "departments", items: [] }))
        );
      }

      if (hasPermission(user, PERMISSIONS.USERS)) {
        jobs.push(
          fetchUsers()
            .then((data) => {
              const list = Array.isArray(data) ? data : data?.users;
              return {
                key: "users",
                items: (Array.isArray(list) ? list : [])
                  .filter((candidate) =>
                    `${candidate.username || ""}`.toLowerCase().includes(lowerTerm)
                  )
                  .slice(0, 5),
              };
            })
            .catch(() => ({ key: "users", items: [] }))
        );
      }

      if (hasPermission(user, PERMISSIONS.EQUIPMENT)) {
        const equipmentPromise = equipmentCacheRef.current
          ? Promise.resolve(equipmentCacheRef.current)
          : fetchEquipmentByCategory("", "All")
              .then((data) => {
                const list = Array.isArray(data) ? data : [];
                equipmentCacheRef.current = list;
                return list;
              })
              .catch(() => []);

        jobs.push(
          equipmentPromise.then((list) => ({
            key: "equipment",
            items: list
              .filter((item) =>
                // device_name/name are the primary display name for most
                // records (see getEquipmentDisplayName) — computer_name is
                // often blank, so matching only on it left records like bare
                // CCTV cameras ("Camera01") unfindable by the name shown
                // everywhere else in the app.
                `${item.device_name || ""} ${item.name || ""} ${item.computer_name || ""} ${item.asset_code || item.equipment_code || ""} ${item.service_tag || ""} ${item.device_model || ""
                  } ${item.owner_name || ""}`
                  .toLowerCase()
                  .includes(lowerTerm)
              )
              .slice(0, 5),
          }))
        );
      }

      Promise.all(jobs)
        .then((jobResults) => {
          if (ignore) return;
          const next = createEmptyResults();
          jobResults.forEach(({ key, items }) => {
            next[key] = items;
          });
          setResults(next);
        })
        .finally(() => {
          if (!ignore) setIsLoading(false);
        });
    }, 350);

    return () => {
      ignore = true;
      window.clearTimeout(timeoutId);
    };
  }, [query, user]);

  function handleSelectResult(type, item) {
    setResults(createEmptyResults());
    setIsLoading(false);

    if (type === "employees") {
      // The term stays in the box (narrowed to the picked name) because the
      // Employees table filters on it — clearing it would land the user on the
      // full 200-row directory instead of the person they just clicked.
      setQuery(item.full_name || item.owner_name || item.name || "");
      onSelectView?.("Employees");
      return;
    }

    setQuery("");

    if (type === "departments") {
      onSelectView?.("Departments");
    } else if (type === "equipment") {
      onSelectView?.("Equipments");
      onSelectEquipmentCategory?.(item.category || item.category_name);
    } else if (type === "users") {
      onSelectView?.("Users");
    }
  }

  return {
    query,
    results,
    isLoading,
    handleQueryChange,
    handleSelectResult,
  };
}
