// ============================================================================
// STATE.JS — Global mutable state shared across all components
// ============================================================================

// Supabase client (must NOT be named 'supabase' — conflicts with window.supabase CDN)
let sbClient = null;
let isSupabaseLive = false;

// Auth / role state
let authState = {
  currentRole: null,      // ROLE_ADMIN | ROLE_MANAGER | ROLE_OPERATOR | null
  operatorName: null,     // Name of logged-in operator (from team members)
  isAdmin: false,         // Quick-access flag (true if ROLE_ADMIN)
  adminPin: DEFAULT_ADMIN_PIN
};

// Application state
let appState = {
  activeTab: 'entry',
  teams: [],
  members: [],
  selectedMemberIds: new Set(),
  currentLines: [],
  isOverride: false,
  entries: [],
  expandedIds: new Set(),
  editingLines: [],
  activeReportMember: null,
  activeReportText: '',
  managerLinesList: []
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function getCurrentPermissions() {
  return ROLE_PERMISSIONS[authState.currentRole] || ROLE_PERMISSIONS[ROLE_OPERATOR];
}

function can(permission) {
  const perms = getCurrentPermissions();
  return !!perms[permission];
}

function isLoggedIn() {
  return authState.currentRole !== null;
}
