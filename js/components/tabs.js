// ============================================================================
// COMPONENTS/TABS.JS — Tab switching with role-based access guard
// ============================================================================

function switchTab(tab) {
  // If not logged in and trying to access a protected tab, redirect to login
  if (tab !== 'login' && !isLoggedIn()) {
    tab = 'login';
  }

  // If logged in but role doesn't have this tab, redirect to their first allowed tab
  if (tab !== 'login' && isLoggedIn()) {
    const perms = getCurrentPermissions();
    if (!perms.tabs.includes(tab)) {
      tab = perms.tabs[0] || 'entry';
    }
  }

  appState.activeTab = tab;

  // Hide all views
  document.querySelectorAll('.tab-view').forEach(el => el.classList.add('hidden'));
  const activeEl = document.getElementById(`view-${tab}`);
  if (activeEl) activeEl.classList.remove('hidden');

  // Ribbon: hide on login screen
  const ribbon = document.getElementById('ribbonSection');
  if (ribbon) {
    ribbon.classList.toggle('hidden', tab === 'login');
  }

  // Desktop nav — active styling
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('bg-white', 'text-brand-700', 'shadow-xs', 'font-bold');
    btn.classList.add('text-slate-600', 'font-semibold');
  });
  const dBtn = document.getElementById(`navTab-${tab}`);
  if (dBtn) {
    dBtn.classList.add('bg-white', 'text-brand-700', 'shadow-xs', 'font-bold');
    dBtn.classList.remove('text-slate-600', 'font-semibold');
  }

  // Mobile nav — active styling
  ['entry', 'records', 'manager', 'reports', 'members'].forEach(t => {
    const mBtn = document.getElementById(`mobTab-${t}`);
    if (!mBtn) return;
    if (t === tab) {
      mBtn.className = mBtn.className.replace('text-slate-400', 'text-brand-600');
      mBtn.classList.add('text-brand-600');
      mBtn.classList.remove('text-slate-400');
    } else {
      mBtn.classList.remove('text-brand-600');
      mBtn.classList.add('text-slate-400');
    }
  });

  // Trigger view-specific renderers
  if (tab === 'records') renderRecordsView();
  if (tab === 'manager') runManagerAnalytics();
  if (tab === 'reports') runDetailedReports();
  if (tab === 'members') renderMembersTab();

  if (window.lucide) lucide.createIcons();
}
