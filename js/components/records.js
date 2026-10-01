// ============================================================================
// COMPONENTS/RECORDS.JS — Records log view rendering
// ============================================================================

function handleRecordsFilter() {
  renderRecordsView();
}

function toggleRowExpand(id) {
  if (appState.expandedIds.has(id)) appState.expandedIds.delete(id);
  else appState.expandedIds.add(id);
  renderRecordsView();
}

function renderRecordsView() {
  const query = (document.getElementById('recordsSearch')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('recordsStatusFilter')?.value || 'All';

  const filtered = appState.entries.filter(entry => {
    const nameMatch = (entry.member_name || '').toLowerCase().includes(query);
    const lineMatch = (entry.production_line_items || []).some(l => (l.line_number || '').toLowerCase().includes(query));
    const matchesQuery = !query || nameMatch || lineMatch;

    let matchesStatus = true;
    if (statusFilter !== 'All') {
      const items = entry.production_line_items || [];
      if (statusFilter === 'Done')    matchesStatus = items.some(i => i.qc_status === 'Done' || i.qc_status === 'Passed');
      else if (statusFilter === 'Pending') matchesStatus = items.some(i => i.qc_status === 'Pending');
      else if (statusFilter === 'Failed')  matchesStatus = items.some(i => i.qc_status === 'Failed');
    }

    return matchesQuery && matchesStatus;
  });

  const cardsContainer = document.getElementById('recordsCardsMobile');
  const tableBody = document.getElementById('recordsTableBody');
  const emptyState = document.getElementById('recordsEmpty');

  if (filtered.length === 0) {
    cardsContainer.innerHTML = '';
    tableBody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  cardsContainer.innerHTML = '';
  tableBody.innerHTML = '';

  filtered.forEach(entry => {
    const isExp = appState.expandedIds.has(entry.id);
    const lines = entry.production_line_items || [];
    const doneCount = lines.filter(l => l.qc_status === 'Done' || l.qc_status === 'Passed').length;
    const pendingCount = lines.filter(l => l.qc_status === 'Pending').length;

    const teamSize = parseInt(entry.team_size) || (entry.member_name.includes(',') ? entry.member_name.split(',').length : 1);
    const totalAmount = parseFloat(entry.total_amount) || 0;
    const sharePerMember = parseFloat(entry.share_per_member) || Math.round(totalAmount / teamSize);

    // — MOBILE CARD —
    const card = document.createElement('div');
    card.className = 'p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 transition';
    card.innerHTML = `
      <div class="flex items-start justify-between">
        <div>
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="font-extrabold text-slate-800 text-xs">${escapeHtml(entry.member_name)}</span>
            <span class="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700">${escapeHtml(entry.team_name || 'No Team')}</span>
            <span class="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-brand-100 text-brand-700">${teamSize} person team</span>
          </div>
          <span class="text-[10px] text-slate-400 block mt-0.5">${formatDate(entry.entry_date)}</span>
        </div>
        <div class="text-right">
          <span class="text-xs font-bold text-slate-500 block">Shift Total: ₹${totalAmount.toLocaleString('en-IN')}</span>
          <span class="text-sm font-extrabold text-emerald-700 block">₹${sharePerMember.toLocaleString('en-IN')} / person</span>
        </div>
      </div>

      <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
        <div class="flex items-center gap-1.5 flex-wrap">
          ${doneCount > 0 ? `<span class="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">${doneCount} Done</span>` : ''}
          ${pendingCount > 0 ? `<span class="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">${pendingCount} Pending</span>` : ''}
          <span class="text-[11px] text-slate-500 font-medium">${(parseFloat(entry.total_meters) || 0).toFixed(1)}m</span>
        </div>
        <div class="flex items-center gap-1">
          <button onclick="toggleRowExpand('${entry.id}')" class="px-2 py-1 rounded-md text-[11px] font-bold bg-white border border-slate-200 text-slate-700">
            ${isExp ? 'Hide Lines' : 'Lines (' + lines.length + ')'}
          </button>
          <button onclick="openEditEntryModal('${entry.id}')" title="Edit" class="p-1 text-slate-400 hover:text-brand-600">
            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
          </button>
          <button onclick="deleteEntryRecord('${entry.id}')" title="Delete" class="p-1 text-slate-400 hover:text-rose-600">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>

      ${isExp ? `
        <div class="pt-2 border-t border-slate-200 space-y-1.5 animate-fade-in">
          ${lines.map(l => `
            <div class="p-2 bg-white rounded-lg border border-slate-100 flex items-center justify-between text-[11px]">
              <span class="font-bold text-slate-700">${escapeHtml(l.line_number)}</span>
              <span class="text-slate-500">${parseFloat(l.meters || 0).toFixed(1)} meters</span>
              <button onclick="toggleLineStatusDirect('${l.id}', '${l.qc_status}', '${entry.id}')"
                title="Tap to toggle Done/Pending"
                class="px-2 py-0.5 rounded-full font-bold text-[10px] transition ${
                  l.qc_status === 'Done' || l.qc_status === 'Passed'
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                }">
                ${l.qc_status || 'Done'} ⟳
              </button>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
    cardsContainer.appendChild(card);

    // — DESKTOP TABLE ROW —
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50/80 transition';
    tr.innerHTML = `
      <td class="py-2.5 px-3 text-center">
        <button onclick="toggleRowExpand('${entry.id}')" class="p-1 rounded text-slate-400 hover:text-brand-600">
          <i data-lucide="${isExp ? 'chevron-down' : 'chevron-right'}" class="w-3.5 h-3.5"></i>
        </button>
      </td>
      <td class="py-2.5 px-3 text-slate-800 whitespace-nowrap">${formatDate(entry.entry_date)}</td>
      <td class="py-2.5 px-3 font-bold text-slate-800">
        <span class="inline-block px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[9px] uppercase tracking-wider mb-0.5">${escapeHtml(entry.team_name || 'No Team')}</span><br>
        ${escapeHtml(entry.member_name)}
        <span class="text-[10px] text-slate-400 block font-normal">${teamSize} person team split</span>
      </td>
      <td class="py-2.5 px-3 text-center font-bold text-slate-700">${entry.total_lines}</td>
      <td class="py-2.5 px-3 text-right text-slate-600 whitespace-nowrap">₹${(parseFloat(entry.rate_per_line) || 0).toLocaleString('en-IN')}</td>
      <td class="py-2.5 px-3 text-right font-bold text-slate-700 whitespace-nowrap">₹${totalAmount.toLocaleString('en-IN')}</td>
      <td class="py-2.5 px-3 text-right font-extrabold text-emerald-600 whitespace-nowrap">
        ₹${sharePerMember.toLocaleString('en-IN')} <span class="text-[10px] font-normal text-slate-400">/ person</span>
      </td>
      <td class="py-2.5 px-3 whitespace-nowrap">
        <div class="flex items-center gap-1">
          ${doneCount > 0 ? `<span class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">${doneCount} Done</span>` : ''}
          ${pendingCount > 0 ? `<span class="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">${pendingCount} Pending</span>` : ''}
        </div>
      </td>
      <td class="py-2.5 px-3 text-center whitespace-nowrap">
        <div class="flex items-center justify-center gap-1">
          <button onclick="openEditEntryModal('${entry.id}')" class="p-1 text-slate-400 hover:text-brand-600" title="Edit Record">
            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
          </button>
          <button onclick="deleteEntryRecord('${entry.id}')" class="p-1 text-slate-400 hover:text-rose-600" title="Delete Record">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);

    if (isExp) {
      const expTr = document.createElement('tr');
      expTr.className = 'bg-slate-50/50';
      expTr.innerHTML = `
        <td colspan="9" class="p-3">
          <div class="bg-white p-3 rounded-xl border border-slate-200 grid grid-cols-3 gap-2">
            ${lines.map(l => `
              <div class="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <span class="font-bold text-slate-800">${escapeHtml(l.line_number)}</span>
                <span class="text-slate-500">${parseFloat(l.meters || 0).toFixed(1)}m</span>
                <button onclick="toggleLineStatusDirect('${l.id}', '${l.qc_status}', '${entry.id}')"
                  class="px-2 py-0.5 rounded font-bold text-[10px] transition ${
                    l.qc_status === 'Done' || l.qc_status === 'Passed'
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  }">
                  ${l.qc_status} ⟳
                </button>
              </div>
            `).join('')}
          </div>
        </td>
      `;
      tableBody.appendChild(expTr);
    }
  });

  if (window.lucide) lucide.createIcons();
}
