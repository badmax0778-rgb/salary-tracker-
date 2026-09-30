// ============================================================================
// CONFIG.JS — App-wide constants: Supabase, rates, user credentials
// ============================================================================

const DEFAULT_SUPABASE_URL = window.ENV?.SUPABASE_URL || '';
const DEFAULT_SUPABASE_ANON_KEY = window.ENV?.SUPABASE_ANON_KEY || '';

// Rate tiers: <3 lines = RATE_LOW, >=3 lines = RATE_HIGH
const RATE_LOW  = 2500;  // ₹2,500 per line (1–2 lines)
const RATE_HIGH = 3000;  // ₹3,000 per line (3+ lines — BONUS TIER)

// ── ROLE CONSTANTS ──────────────────────────────────────────────────────────
const ROLE_ADMIN    = 'admin';     // Full access: edit, delete, manage users
const ROLE_MANAGER  = 'manager';   // View dashboard, reports, analytics, export
const ROLE_OPERATOR = 'operator';  // Daily entry + records only

// ── DEFAULT CREDENTIALS (change after first login via Settings) ─────────────
// Admin: full system access
const DEFAULT_ADMIN_PIN = '1234';

// Manager: username + password login
const DEFAULT_MANAGER_USERNAME = 'manager';
const DEFAULT_MANAGER_PASSWORD = 'manager123';

// Operator: selects name from team list, no password required

// ── ROLE PERMISSIONS ─────────────────────────────────────────────────────────
const ROLE_PERMISSIONS = {
  [ROLE_ADMIN]: {
    tabs:       ['entry', 'records', 'manager', 'reports', 'members'],
    canEdit:    true,
    canDelete:  true,
    canManageMembers: true,
    canViewManager:   true,
    canViewReports:   true,
    canExport:        true,
    label: 'Admin',
    badge: '🔑 Admin',
    badgeClass: 'bg-rose-100 text-rose-800 border border-rose-300'
  },
  [ROLE_MANAGER]: {
    tabs:       ['records', 'manager', 'reports', 'members'],
    canEdit:    false,
    canDelete:  false,
    canManageMembers: false,
    canViewManager:   true,
    canViewReports:   true,
    canExport:        true,
    label: 'Manager',
    badge: '👔 Manager',
    badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300'
  },
  [ROLE_OPERATOR]: {
    tabs:       ['entry', 'records'],
    canEdit:    false,
    canDelete:  false,
    canManageMembers: false,
    canViewManager:   false,
    canViewReports:   false,
    canExport:        false,
    label: 'Operator',
    badge: '👷 Operator',
    badgeClass: 'bg-slate-100 text-slate-600 border border-slate-200'
  }
};
