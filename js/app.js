// ============================================================================
// APP.JS — Application bootstrap (DOMContentLoaded init)
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Restore session if already logged in
  const savedRole = sessionStorage.getItem('protrack_role');
  const savedName = sessionStorage.getItem('protrack_display_name') || savedRole || 'User';

  if (savedRole && ROLE_PERMISSIONS[savedRole]) {
    // Valid session exists — restore it
    authState.currentRole = savedRole;
    authState.operatorName = savedName;
    authState.isAdmin = (savedRole === ROLE_ADMIN);
    applyRoleUI(savedRole, savedName);

    const defaultTab = {
      [ROLE_ADMIN]:    'entry',
      [ROLE_MANAGER]:  'manager',
      [ROLE_OPERATOR]: 'entry'
    }[savedRole] || 'entry';

    switchTab(defaultTab);
  } else {
    // First visit or session expired → show login portal
    switchTab('login');
  }

  setDatePreset(0);

  // Default Date-to-Date filter: first of current month → today
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  const repFrom = document.getElementById('reportFromDate');
  const repTo   = document.getElementById('reportToDate');
  const mgrFrom = document.getElementById('mgrFromDate');
  const mgrTo   = document.getElementById('mgrToDate');

  if (repFrom) repFrom.value = firstDayOfMonth;
  if (repTo)   repTo.value   = todayStr;
  if (mgrFrom) mgrFrom.value = firstDayOfMonth;
  if (mgrTo)   mgrTo.value   = todayStr;

  initDefaultLine();
  initSupabase();
  if (window.lucide) lucide.createIcons();
});
