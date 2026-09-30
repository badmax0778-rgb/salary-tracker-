// ============================================================================
// COMPONENTS/MEMBERS.JS — Team member management (CRUD, checklist, modal)
// ============================================================================

function renderTeamChecklist() {
  const container = document.getElementById('teamMembersChecklist');
  const badge = document.getElementById('selectedTeamBadge');
  const notice = document.getElementById('teamSplitNotice');
  const noticeText = document.getElementById('teamSplitText');
  const activeList = appState.members.filter(m => m.is_active !== false);

  container.innerHTML = '';
  activeList.forEach(m => {
    const isChecked = appState.selectedMemberIds.has(m.id);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.onclick = () => toggleMemberSelection(m.id);
    btn.className = `p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
      isChecked
        ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
        : 'bg-white text-slate-800 border-slate-200 hover:border-brand-400'
    }`;
    btn.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded-full ${isChecked ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'} font-bold flex items-center justify-center text-[10px]">
          ${(m.name || 'M').charAt(0).toUpperCase()}
        </div>
        <div>
          <span class="block text-xs font-bold leading-tight">${escapeHtml(m.name)}</span>
          <span class="block text-[10px] ${isChecked ? 'text-brand-100' : 'text-slate-400'}">${escapeHtml(m.role || 'Operator')}</span>
        </div>
      </div>
      <div class="w-4 h-4 rounded-full border ${isChecked ? 'bg-white text-brand-600 border-white flex items-center justify-center' : 'border-slate-300'}">
        ${isChecked ? '<i data-lucide="check" class="w-3 h-3 stroke-[3]"></i>' : ''}
      </div>
    `;
    container.appendChild(btn);
  });

  const count = appState.selectedMemberIds.size;
  badge.textContent = `${count} Member${count !== 1 ? 's' : ''}`;
  badge.className = count > 0
    ? 'text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs'
    : 'text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-300 text-slate-700';

  if (count > 0) {
    notice.classList.remove('hidden');
    const splitPct = (100 / count).toFixed(count > 2 ? 1 : 0);
    noticeText.textContent = `Selected ${count} member(s): Total shift salary divides equally (${splitPct}% each)`;
  } else {
    notice.classList.add('hidden');
  }

  updateCalculations();
  if (window.lucide) lucide.createIcons();
}

function toggleMemberSelection(memberId) {
  if (appState.selectedMemberIds.has(memberId)) {
    appState.selectedMemberIds.delete(memberId);
  } else {
    appState.selectedMemberIds.add(memberId);
  }
  renderTeamChecklist();
}

function renderReportMemberFilter() {
  const select = document.getElementById('reportMemberFilter');
  if (!select) return;
  select.innerHTML = '<option value="ALL">All Team Members</option>';
  appState.members.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.name;
    opt.textContent = `${m.name} (${m.role || 'Operator'})`;
    select.appendChild(opt);
  });
}

function renderMembersTab() {
  const grid = document.getElementById('membersGrid');
  const empty = document.getElementById('membersEmpty');

  if (appState.members.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  grid.innerHTML = '';

  appState.members.forEach(m => {
    const card = document.createElement('div');
    card.className = 'p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:border-slate-300 transition';
    card.innerHTML = `
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs">
          ${(m.name || 'M').charAt(0).toUpperCase()}
        </div>
        <div>
          <div class="text-xs font-bold text-slate-800">${escapeHtml(m.name)}</div>
          <div class="text-[11px] text-slate-500">${escapeHtml(m.role || 'Operator')}${m.phone ? ' &bull; ' + escapeHtml(m.phone) : ''}</div>
        </div>
      </div>
      <div class="flex items-center gap-1">
        <button onclick="openMemberModal('${m.id}')" title="Edit Member" class="p-1 text-slate-400 hover:text-brand-600 rounded-lg">
          <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
        </button>
        <button onclick="toggleMemberActive('${m.id}')" title="Toggle Active Status"
          class="px-2 py-0.5 rounded-full text-[10px] font-bold ${m.is_active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">
          ${m.is_active !== false ? 'Active' : 'Inactive'}
        </button>
        <button onclick="deleteMember('${m.id}')" class="p-1 text-slate-400 hover:text-rose-600 rounded-lg" title="Delete Member">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `;
    grid.appendChild(card);
  });

  if (window.lucide) lucide.createIcons();
}

function openMemberModal(memberId = null) {
  const modal = document.getElementById('memberModal');
  const title = document.getElementById('memberModalTitle');
  const inputId = document.getElementById('inputMemberId');
  const inputName = document.getElementById('inputMemberName');
  const inputPhone = document.getElementById('inputMemberPhone');
  const inputRole = document.getElementById('inputMemberRole');

  if (memberId) {
    const m = appState.members.find(x => x.id === memberId);
    if (m) {
      title.innerHTML = `<i data-lucide="edit-2" class="w-4 h-4 text-brand-600"></i> Edit Team Member`;
      inputId.value = m.id;
      inputName.value = m.name;
      inputPhone.value = m.phone || '';
      inputRole.value = m.role || 'Line Operator';
    }
  } else {
    title.innerHTML = `<i data-lucide="user-plus" class="w-4 h-4 text-brand-600"></i> Add Team Member`;
    inputId.value = '';
    inputName.value = '';
    inputPhone.value = '';
    inputRole.value = 'Line Operator';
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  if (window.lucide) lucide.createIcons();
}

function closeMemberModal() {
  document.getElementById('memberModal').classList.add('hidden');
  document.getElementById('memberModal').classList.remove('flex');
}

async function handleSaveMember(e) {
  e.preventDefault();
  const id    = document.getElementById('inputMemberId').value;
  const name  = document.getElementById('inputMemberName').value.trim();
  const phone = document.getElementById('inputMemberPhone').value.trim();
  const role  = document.getElementById('inputMemberRole').value.trim() || 'Line Operator';

  if (!name) {
    showToast('Please enter member name', 'error');
    return;
  }

  const saveBtn = document.getElementById('saveMemberBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    if (isSupabaseLive && sbClient) {
      if (id) {
        const { error } = await sbClient.from('team_members').update({ name, phone, role }).eq('id', id);
        if (error) throw error;
        const existing = appState.members.find(m => m.id === id);
        if (existing) { existing.name = name; existing.phone = phone; existing.role = role; }
      } else {
        const { data, error } = await sbClient.from('team_members').insert([{ name, phone, role, is_active: true }]).select().single();
        if (error) throw error;
        appState.members.push(data);
        appState.selectedMemberIds.add(data.id);
      }
    } else {
      if (id) {
        const existing = appState.members.find(m => m.id === id);
        if (existing) { existing.name = name; existing.phone = phone; existing.role = role; }
      } else {
        const newM = { id: generateId(), name, phone, role, is_active: true };
        appState.members.push(newM);
        appState.selectedMemberIds.add(newM.id);
      }
      localStorage.setItem('protrack_members', JSON.stringify(appState.members));
    }

    showToast(`Member "${name}" saved!`, 'success');
    closeMemberModal();
    renderTeamChecklist();
    renderReportMemberFilter();
    renderMembersTab();
  } catch (err) {
    console.error('Save member error:', err);
    showToast('Failed to save member: ' + err.message, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Member';
  }
}

async function toggleMemberActive(memberId) {
  const m = appState.members.find(x => x.id === memberId);
  if (!m) return;
  const newStatus = m.is_active === false;
  m.is_active = newStatus;

  try {
    if (isSupabaseLive && sbClient) {
      await sbClient.from('team_members').update({ is_active: newStatus }).eq('id', memberId);
    } else {
      localStorage.setItem('protrack_members', JSON.stringify(appState.members));
    }
    renderTeamChecklist();
    renderMembersTab();
    showToast('Member status updated', 'info');
  } catch (err) {
    console.error(err);
  }
}

async function deleteMember(memberId) {
  if (!confirm('Are you sure you want to delete this team member?')) return;
  try {
    if (isSupabaseLive && sbClient) {
      await sbClient.from('team_members').delete().eq('id', memberId);
    }
    appState.members = appState.members.filter(x => x.id !== memberId);
    appState.selectedMemberIds.delete(memberId);
    localStorage.setItem('protrack_members', JSON.stringify(appState.members));
    renderTeamChecklist();
    renderReportMemberFilter();
    renderMembersTab();
    showToast('Member deleted', 'success');
  } catch (err) {
    console.error(err);
    showToast('Could not delete member: ' + err.message, 'error');
  }
}
