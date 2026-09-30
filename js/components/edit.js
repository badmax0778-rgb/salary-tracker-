// ============================================================================
// COMPONENTS/EDIT.JS — Edit entry modal + delete entry
// ============================================================================

function openEditEntryModal(entryId) {
  if (!requirePermission('canEdit')) return;

  const entry = appState.entries.find(e => e.id === entryId);
  if (!entry) return;

  document.getElementById('editEntryId').value       = entry.id;
  document.getElementById('editEntryDate').value     = entry.entry_date;
  document.getElementById('editMemberNames').value   = entry.member_name;
  document.getElementById('editEntrySubtitle').textContent = `Editing shift for ${entry.member_name}`;

  appState.editingLines = (entry.production_line_items || []).map(l => ({
    id: l.id || generateId(),
    lineNumber: l.line_number,
    meters: parseFloat(l.meters) || 0,
    status: l.qc_status || 'Done'
  }));

  if (appState.editingLines.length === 0) {
    appState.editingLines.push({ id: generateId(), lineNumber: 'Line #1', meters: 500, status: 'Done' });
  }

  renderEditLines();
  updateEditPreview();

  document.getElementById('editEntryModal').classList.remove('hidden');
  document.getElementById('editEntryModal').classList.add('flex');
  if (window.lucide) lucide.createIcons();
}

function closeEditModal() {
  document.getElementById('editEntryModal').classList.add('hidden');
  document.getElementById('editEntryModal').classList.remove('flex');
}

function addEditLine() {
  const nextNum = appState.editingLines.length + 1;
  appState.editingLines.push({
    id: generateId(),
    lineNumber: `Line #${nextNum}`,
    meters: 0,
    status: 'Done'
  });
  renderEditLines();
  updateEditPreview();
}

function removeEditLine(idx) {
  if (appState.editingLines.length <= 1) {
    showToast('Entry must have at least 1 line', 'info');
    return;
  }
  appState.editingLines.splice(idx, 1);
  renderEditLines();
  updateEditPreview();
}

function renderEditLines() {
  const container = document.getElementById('editLinesContainer');
  container.innerHTML = '';

  appState.editingLines.forEach((l, idx) => {
    const div = document.createElement('div');
    div.className = 'p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2';
    div.innerHTML = `
      <input type="text" value="${escapeHtml(l.lineNumber)}"
        onchange="appState.editingLines[${idx}].lineNumber = this.value; updateEditPreview();"
        class="w-24 p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800">

      <div class="relative flex-1">
        <input type="number" inputmode="decimal" value="${l.meters || ''}"
          oninput="appState.editingLines[${idx}].meters = parseFloat(this.value) || 0; updateEditPreview();"
          placeholder="0.0"
          class="w-full p-1.5 pr-6 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800">
        <span class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">m</span>
      </div>

      <select onchange="appState.editingLines[${idx}].status = this.value; updateEditPreview();"
        class="p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold ${getStatusColorClass(l.status)}">
        <option value="Done"    ${l.status === 'Done'    ? 'selected' : ''}>Done</option>
        <option value="Pending" ${l.status === 'Pending' ? 'selected' : ''}>Pending</option>
        <option value="Failed"  ${l.status === 'Failed'  ? 'selected' : ''}>Failed</option>
      </select>

      <button type="button" onclick="removeEditLine(${idx})" class="p-1.5 text-rose-500 hover:text-rose-700">
        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
      </button>
    `;
    container.appendChild(div);
  });
  if (window.lucide) lucide.createIcons();
}

function updateEditPreview() {
  const count = appState.editingLines.length;
  const rate  = count >= 3 ? 3000 : 2500;
  const total = count * rate;
  document.getElementById('editPreviewSalary').textContent = `₹${total.toLocaleString('en-IN')}`;
  document.getElementById('editPreviewTier').textContent   = `${count} lines @ ₹${rate.toLocaleString('en-IN')}/line`;
}

async function handleSaveEditedEntry(e) {
  e.preventDefault();
  const entryId     = document.getElementById('editEntryId').value;
  const entryDate   = document.getElementById('editEntryDate').value;
  const memberNames = document.getElementById('editMemberNames').value;

  const totalLines   = appState.editingLines.length;
  const ratePerLine  = totalLines >= 3 ? 3000 : 2500;
  const totalAmount  = totalLines * ratePerLine;
  const totalMeters  = appState.editingLines.reduce((sum, l) => sum + (parseFloat(l.meters) || 0), 0);

  const namesList   = memberNames.split(',').map(s => s.trim()).filter(Boolean);
  const teamSize    = namesList.length || 1;
  const sharePerMember = Math.round(totalAmount / teamSize);

  const saveBtn = document.getElementById('saveEditBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Updating...';

  try {
    if (isSupabaseLive && sbClient) {
      const { error: mErr } = await sbClient
        .from('production_entries')
        .update({
          entry_date: entryDate,
          member_name: memberNames,
          team_size: teamSize,
          share_per_member: sharePerMember,
          total_lines: totalLines,
          total_meters: totalMeters,
          rate_per_line: ratePerLine,
          total_amount: totalAmount
        })
        .eq('id', entryId);
      if (mErr) throw mErr;

      await sbClient.from('production_line_items').delete().eq('entry_id', entryId);
      const linesPayload = appState.editingLines.map(l => ({
        entry_id: entryId,
        line_number: l.lineNumber || 'Line',
        meters: l.meters,
        qc_status: l.status || 'Done'
      }));
      await sbClient.from('production_line_items').insert(linesPayload);

      await sbClient.from('production_entry_members').delete().eq('entry_id', entryId);
      const memPayload = namesList.map(name => ({
        entry_id: entryId,
        member_name: name,
        share_amount: sharePerMember
      }));
      await sbClient.from('production_entry_members').insert(memPayload);
    } else {
      const entry = appState.entries.find(x => x.id === entryId);
      if (entry) {
        entry.entry_date      = entryDate;
        entry.member_name     = memberNames;
        entry.team_size       = teamSize;
        entry.share_per_member = sharePerMember;
        entry.total_lines     = totalLines;
        entry.total_meters    = totalMeters;
        entry.rate_per_line   = ratePerLine;
        entry.total_amount    = totalAmount;
        entry.production_line_items = appState.editingLines.map(l => ({
          id: l.id,
          entry_id: entryId,
          line_number: l.lineNumber,
          meters: l.meters,
          qc_status: l.status
        }));
        localStorage.setItem('protrack_entries', JSON.stringify(appState.entries));
      }
    }

    showToast('Record updated successfully!', 'success');
    closeEditModal();
    await fetchEntries();
  } catch (err) {
    console.error('Update entry error:', err);
    showToast('Update failed: ' + err.message, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Update Record';
  }
}

async function deleteEntryRecord(entryId) {
  if (!requirePermission('canDelete')) return;

  if (!confirm('Are you sure you want to delete this production record?')) return;
  try {
    if (isSupabaseLive && sbClient) {
      await sbClient.from('production_line_items').delete().eq('entry_id', entryId);
      await sbClient.from('production_entry_members').delete().eq('entry_id', entryId);
      await sbClient.from('production_entries').delete().eq('id', entryId);
    }
    appState.entries = appState.entries.filter(e => e.id !== entryId);
    localStorage.setItem('protrack_entries', JSON.stringify(appState.entries));
    showToast('Record deleted successfully', 'success');
    updateRibbonPaymentTotals();
    renderRecordsView();
    runDetailedReports();
    runManagerAnalytics();
  } catch (err) {
    console.error('Delete error:', err);
    showToast('Delete failed: ' + err.message, 'error');
  }
}
