// ============================================================================
// COMPONENTS/AUTH.JS — Role-based login portal (Admin / Manager / Operator)
// ============================================================================

// ── STEP NAVIGATION ──────────────────────────────────────────────────────────

let _selectedLoginRole = null;  // Tracks which role card was clicked

function selectLoginRole(role) {
  _selectedLoginRole = role;

  // Highlight selected role card
  ['admin','manager','operator'].forEach(r => {
    const card = document.getElementById(`roleCard-${r}`);
    if (card) card.classList.toggle('ring-2', r === role);
  });

  // Build the credential step
  const credStep = document.getElementById('loginCredentialStep');
  const roleTitle = document.getElementById('loginRoleTitle');
  const credForm  = document.getElementById('loginCredForm');

  if (!credStep || !credForm) return;

  const labels = {
    [ROLE_ADMIN]:    { icon: '🔑', title: 'Admin Login', color: 'rose' },
    [ROLE_MANAGER]:  { icon: '👔', title: 'Manager Login', color: 'indigo' },
    [ROLE_OPERATOR]: { icon: '👷', title: 'Operator Access', color: 'slate' }
  };

  const lbl = labels[role];
  roleTitle.innerHTML = `<span class="text-xl">${lbl.icon}</span> ${lbl.title}`;

  if (role === ROLE_ADMIN) {
    credForm.innerHTML = `
      <div>
        <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Admin PIN</label>
        <div class="relative">
          <input type="password" id="loginInput1" placeholder="Enter Admin PIN" maxlength="8"
            class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition pr-12">
          <button type="button" onclick="toggleLoginInputVisibility('loginInput1')"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
            <i data-lucide="eye" class="w-4 h-4" id="loginEye1"></i>
          </button>
        </div>
      </div>
      <button type="submit" class="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2">
        <i data-lucide="shield-check" class="w-4 h-4"></i> Login as Admin
      </button>
    `;
  } else if (role === ROLE_MANAGER) {
    credForm.innerHTML = `
      <div>
        <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Username</label>
        <input type="text" id="loginInput1" placeholder="Username"
          class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition">
      </div>
      <div>
        <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Password</label>
        <div class="relative">
          <input type="password" id="loginInput2" placeholder="Password"
            class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition pr-12">
          <button type="button" onclick="toggleLoginInputVisibility('loginInput2')"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
            <i data-lucide="eye" class="w-4 h-4" id="loginEye2"></i>
          </button>
        </div>
      </div>
      <button type="submit" class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2">
        <i data-lucide="layout-dashboard" class="w-4 h-4"></i> Login as Manager
      </button>
    `;
  } else if (role === ROLE_OPERATOR) {
    // Build operator name dropdown from members
    const activeMembers = appState.members.filter(m => m.is_active !== false);
    const options = activeMembers.map(m =>
      `<option value="${escapeHtml(m.name)}">${escapeHtml(m.name)} — ${escapeHtml(m.role || 'Operator')}</option>`
    ).join('');

    credForm.innerHTML = `
      <div>
        <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Select Your Name</label>
        <select id="loginInput1"
          class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:bg-white transition">
          <option value="">-- Choose your name --</option>
          ${options}
        </select>
        <p class="text-[11px] text-slate-400 mt-1">No password required for floor operators</p>
      </div>
      <button type="submit" class="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2">
        <i data-lucide="file-plus-2" class="w-4 h-4"></i> Continue to Daily Entry
      </button>
    `;
  }

  if (window.lucide) lucide.createIcons();

  // Show credential step
  document.getElementById('loginRoleStep').classList.add('hidden');
  credStep.classList.remove('hidden');
}

function backToRoleSelect() {
  _selectedLoginRole = null;
  document.getElementById('loginRoleStep').classList.remove('hidden');
  document.getElementById('loginCredentialStep').classList.add('hidden');
}

function toggleLoginInputVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}

// ── FORM SUBMIT HANDLER ───────────────────────────────────────────────────────

function handleLoginFormSubmit(e) {
  e.preventDefault();

  if (!_selectedLoginRole) {
    showToast('Please select a role first', 'error');
    return;
  }

  const btn = e.target.querySelector('button[type="submit"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Checking...'; }

  setTimeout(() => {
    if (btn) { btn.disabled = false; }

    if (_selectedLoginRole === ROLE_ADMIN) {
      const pin = document.getElementById('loginInput1')?.value.trim();
      const savedPin = localStorage.getItem('protrack_admin_pin') || DEFAULT_ADMIN_PIN;
      if (pin === savedPin) {
        _loginSuccess(ROLE_ADMIN, 'Admin');
      } else {
        showToast('❌ Incorrect Admin PIN!', 'error');
        if (btn) btn.textContent = 'Login as Admin';
      }

    } else if (_selectedLoginRole === ROLE_MANAGER) {
      const username = document.getElementById('loginInput1')?.value.trim().toLowerCase();
      const password = document.getElementById('loginInput2')?.value.trim();
      const savedUser = (localStorage.getItem('protrack_mgr_user') || DEFAULT_MANAGER_USERNAME).toLowerCase();
      const savedPass = localStorage.getItem('protrack_mgr_pass') || DEFAULT_MANAGER_PASSWORD;

      if (username === savedUser && password === savedPass) {
        _loginSuccess(ROLE_MANAGER, 'Manager');
      } else {
        showToast('❌ Incorrect username or password!', 'error');
        if (btn) btn.textContent = 'Login as Manager';
      }

    } else if (_selectedLoginRole === ROLE_OPERATOR) {
      const name = document.getElementById('loginInput1')?.value;
      if (!name) {
        showToast('Please select your name from the list', 'error');
        if (btn) btn.textContent = 'Continue to Daily Entry';
        return;
      }
      _loginSuccess(ROLE_OPERATOR, name);
    }
  }, 400);
}

// ── LOGIN SUCCESS ─────────────────────────────────────────────────────────────

function _loginSuccess(role, displayName) {
  authState.currentRole = role;
  authState.operatorName = displayName;
  authState.isAdmin = (role === ROLE_ADMIN);

  // Persist to sessionStorage
  sessionStorage.setItem('protrack_role', role);
  sessionStorage.setItem('protrack_display_name', displayName);
  if (role === ROLE_ADMIN) sessionStorage.setItem('protrack_is_admin', 'true');

  // Apply role UI
  applyRoleUI(role, displayName);

  // Navigate to appropriate default tab
  const defaultTab = {
    [ROLE_ADMIN]:    'entry',
    [ROLE_MANAGER]:  'manager',
    [ROLE_OPERATOR]: 'entry'
  }[role];

  showToast(`✅ Welcome, ${displayName}!`, 'success');
  switchTab(defaultTab);
}

// ── UI ROLE APPLICATION ───────────────────────────────────────────────────────

function applyRoleUI(role, displayName) {
  const perms = ROLE_PERMISSIONS[role];
  const badge = document.getElementById('roleBadge');
  const authBtn = document.getElementById('authBtn');
  const authLabel = document.getElementById('authLabel');
  const authIcon  = document.getElementById('authIcon');
  const userDisplay = document.getElementById('headerUserDisplay');

  // Role badge
  if (badge) {
    badge.textContent = perms.badge;
    badge.className = `text-[10px] font-bold px-2 py-0.5 rounded-md ${perms.badgeClass}`;
  }

  // User name display
  if (userDisplay) userDisplay.textContent = displayName;

  // Auth button → becomes Logout
  if (authBtn) authBtn.className = 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-[11px] font-bold text-red-700 hover:bg-red-100 transition shadow-2xs';
  if (authLabel) authLabel.textContent = 'Logout';
  if (authIcon) authIcon.setAttribute('data-lucide', 'log-out');

  // Show/hide nav tabs based on role permissions
  const allTabs = ['login', 'entry', 'records', 'manager', 'reports', 'members'];
  allTabs.forEach(tab => {
    const dBtn = document.getElementById(`navTab-${tab}`);
    if (!dBtn) return;
    if (tab === 'login') {
      dBtn.classList.add('hidden'); // Always hide login nav after logged in
    } else if (perms.tabs.includes(tab)) {
      dBtn.classList.remove('hidden');
    } else {
      dBtn.classList.add('hidden');
    }
  });

  // Mobile nav — show/hide based on role (use 'flex' display not just removing hidden)
  ['entry', 'records', 'manager', 'reports', 'members'].forEach(tab => {
    const mBtn = document.getElementById(`mobTab-${tab}`);
    if (!mBtn) return;
    if (perms.tabs.includes(tab)) {
      mBtn.classList.remove('hidden');
      mBtn.classList.add('flex');
    } else {
      mBtn.classList.add('hidden');
      mBtn.classList.remove('flex');
    }
  });

  // Show/hide Add Member button based on canManageMembers
  const addMemberBtns = document.querySelectorAll('[data-perm="canManageMembers"]');
  addMemberBtns.forEach(btn => {
    if (perms.canManageMembers) btn.classList.remove('hidden');
    else btn.classList.add('hidden');
  });

  if (window.lucide) lucide.createIcons();
}

// ── LOGOUT ────────────────────────────────────────────────────────────────────

function handleAuthAction() {
  if (isLoggedIn()) {
    if (!confirm('Are you sure you want to logout?')) return;
    _logout();
  } else {
    switchTab('login');
  }
}

function _logout() {
  authState.currentRole = null;
  authState.operatorName = null;
  authState.isAdmin = false;

  sessionStorage.removeItem('protrack_role');
  sessionStorage.removeItem('protrack_display_name');
  sessionStorage.removeItem('protrack_is_admin');

  // Reset header UI
  const badge = document.getElementById('roleBadge');
  const authBtn = document.getElementById('authBtn');
  const authLabel = document.getElementById('authLabel');
  const authIcon  = document.getElementById('authIcon');
  const userDisplay = document.getElementById('headerUserDisplay');

  if (badge) { badge.textContent = 'Guest'; badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200'; }
  if (authLabel) authLabel.textContent = 'Login';
  if (authIcon) authIcon.setAttribute('data-lucide', 'lock');
  if (authBtn) authBtn.className = 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs';
  if (userDisplay) userDisplay.textContent = '';

  // Restore all nav tabs to hidden (login portal will show)
  ['entry', 'records', 'manager', 'reports', 'members'].forEach(tab => {
    const dBtn = document.getElementById(`navTab-${tab}`);
    if (dBtn) dBtn.classList.add('hidden');
    const mBtn = document.getElementById(`mobTab-${tab}`);
    if (mBtn) { mBtn.classList.add('hidden'); mBtn.classList.remove('flex'); }
  });
  const loginBtn = document.getElementById('navTab-login');
  if (loginBtn) loginBtn.classList.remove('hidden');

  if (window.lucide) lucide.createIcons();

  showToast('Logged out successfully', 'info');
  switchTab('login');
}

// ── PERMISSION GUARDS (used in other components) ──────────────────────────────

function requirePermission(permission) {
  if (!can(permission)) {
    showToast(`🚫 Your role (${ROLE_PERMISSIONS[authState.currentRole]?.label || 'Guest'}) does not have permission for this action.`, 'error');
    return false;
  }
  return true;
}

// ── LEGACY COMPAT (kept for old inline calls) ─────────────────────────────────
function setAdminState(isAdmin) {
  // No-op — superseded by applyRoleUI
}

// ── OLD MODAL LOGIN (kept for legacy PIN unlock in records) ───────────────────
function closeLoginModal() {
  document.getElementById('loginModal')?.classList.add('hidden');
  document.getElementById('loginModal')?.classList.remove('flex');
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const pin = document.getElementById('inputLoginPin')?.value.trim();
  const savedPin = localStorage.getItem('protrack_admin_pin') || DEFAULT_ADMIN_PIN;
  if (pin === savedPin) {
    _loginSuccess(ROLE_ADMIN, 'Admin');
    closeLoginModal();
  } else {
    showToast('Incorrect PIN! Default is 1234', 'error');
  }
}

// ── PIN TOGGLE (legacy, kept for modal) ──────────────────────────────────────
function togglePinVisibility(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
  if (icon) icon.setAttribute('data-lucide', input.type === 'password' ? 'eye' : 'eye-off');
  if (window.lucide) lucide.createIcons();
}
