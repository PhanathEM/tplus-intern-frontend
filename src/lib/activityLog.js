const STORAGE_KEY = "tplus_activity_log";
const EVENT_NAME = "tplus-activity-log-updated";
const MAX_ENTRIES = 2000;

export const ACTIVITY_MODULES = {
  EMPLOYEE: "Employee",
  DEPARTMENT: "Department",
  EQUIPMENT: "Equipment",
  CATEGORY: "Category",
  BORROW: "Borrow",
  USER: "User",
  LICENSE: "Software License",
  STATUS: "Status",
  PART_STATUS: "Part Status",
  REPLACEMENT: "Device Replacement",
  PART_STOCK: "Part Stock",
  PART_BORROW: "Part Borrow",
  SERVICE_USAGE: "Server Usage",
};

export const ACTIVITY_ACTIONS = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  APPROVE: "approve",
  RESET_PASSWORD: "reset_password",
  ASSIGN: "assign",
  UNASSIGN: "unassign",
  BORROW: "borrow",
  RETURN: "return",
  REPLACE: "replace",
};

export const ACTIVITY_MODULE_VALUES = Object.values(ACTIVITY_MODULES);
export const ACTIVITY_ACTION_VALUES = Object.values(ACTIVITY_ACTIONS);

function readLog() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLog(entries) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage full/unavailable - drop silently, logging must never break the app.
  }

  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

function getActorInfo(actor) {
  return {
    actorId: actor?.user_id ?? actor?.id ?? null,
    actorName: actor?.username || "Unknown user",
    actorRole: actor?.role || null,
  };
}

function makeEntryId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function logActivity({
  actor,
  action,
  module,
  entityId = null,
  entityLabel = "",
  before = null,
  after = null,
}) {
  const entries = readLog();

  const entry = {
    id: makeEntryId(),
    timestamp: new Date().toISOString(),
    ...getActorInfo(actor),
    action,
    module,
    entityId,
    entityLabel,
    before,
    after,
  };

  entries.unshift(entry);
  if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
  writeLog(entries);

  return entry;
}

export function getActivityLog() {
  return readLog();
}

export function subscribeActivityLog(callback) {
  if (typeof window === "undefined") return () => {};

  function handleChange() {
    callback();
  }

  window.addEventListener(EVENT_NAME, handleChange);
  window.addEventListener("storage", handleChange);

  return () => {
    window.removeEventListener(EVENT_NAME, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}
