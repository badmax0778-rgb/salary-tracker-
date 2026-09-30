// ============================================================================
// COMPONENTS/ENTRY.JS — Daily production entry form (line builder, calc, save)
// ============================================================================

function initDefaultLine() {
  appState.currentLines = [
    { id: generateId(), lineNumber: 'Line #1', meters: 500, status: 'Done' }
  ];
  renderLineBuilder();
  updateCalculations();
}

function addNewLine() {
  if (appState.selectedMemberIds.size === 0) {
    showToast('Tip: Tick working team members above so split is calculated live!', 'info');
  }
  const nextNum = appState.currentLines.length + 1;
  appState.currentLines.push({
    id: generateId(),
    lineNumber: `Line #${nextNum}`,
    meters: 0,
    status: 'Done'
  });
  renderLineBuilder();
  updateCalculations();
}

function removeLine(id) {
  if (appState.currentLines.length <= 1) {
    showToast('At least 1 line is required', 'info');
    return;
  }
  appState.currentLines = appState.currentLines.filter(l => l.id !== id);
  renderLineBuilder();
  updateCalculations();
}

function updateLineField(id, field, value) {
  const line = appState.currentLines.find(l => l.id === id);
  if (line) {
    if (field === 'meters')     line.meters = parseFloat(value) || 0;
    else if (field === 'lineNumber') line.lineNumber = value;
    else if (field === 'status')     line.status = value;
    updateCalculations();
  }
}

function renderLineBuilder() {
  const container = document.getElementById('linesList');
  container.innerHTML = '';

  appState.currentLines.forEach((line, idx) => {
    const row = document.createElement('div');
    row.className = 'p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:gap-2.5';
    row.innerHTML = `
      <div class="sm:w-1/3">
        <span class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Line Code</span>
        <input type="text" value="${escapeHtml(line.lineNumber)}"
          onchange="updateLineField('${line.id}', 'lineNumber', this.value)"
          placeholder="e.g. Line #${idx + 1}"
          class="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500">
      </div>

      <div class="sm:w-1/3">
        <span class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Meters</span>
        <div class="relative">
          <input type="number" inputmode="decimal" min="0" step="0.5" value="${line.meters || ''}"
            oninput="updateLineField('${line.id}', 'meters', this.value)"
            placeholder="0.00"
            class="w-full px-2.5 py-1.5 pr-7 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500">
          <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 pointer-events-none">m</span>
        </div>
      </div>

      <div class="sm:w-1/3">
        <span class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</span>
        <div class="flex items-center gap-1.5">
          <select onchange="updateLineField('${line.id}', 'status', this.value)"
            class="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold ${getStatusColorClass(line.status)} focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="Done"    ${line.status === 'Done'    ? 'selected' : ''}>&#10003; Done (Completed)</option>
            <option value="Pending" ${line.status === 'Pending' ? 'selected' : ''}>&bull; Pending (In Progress)</option>
            <option value="Failed"  ${line.status === 'Failed'  ? 'selected' : ''}>&times; Failed</option>
          </select>

          ${appState.currentLines.length > 1 ? `
            <button type="button" onclick="removeLine('${line.id}')" title="Delete line"
              class="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg shrink-0">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          ` : `<span class="w-7"></span>`}
        </div>
      </div>
    `;
    container.appendChild(row);
  });

  if (window.lucide) lucide.createIcons();
}

function toggleRateOverride() {
  const chk = document.getElementById('overrideRateCheck');
  const row = document.getElementById('customRateRow');
  appState.isOverride = chk.checked;
  if (appState.isOverride) {
    row.classList.remove('hidden');
    if (!document.getElementById('customRateValue').value) {
      document.getElementById('customRateValue').value = 3500;
    }
  } else {
    row.classList.add('hidden');
  }
  updateCalculations();
}

function updateCalculations() {
  const lineCount = appState.currentLines.length;
  const rate = computeActiveRate(lineCount);
  const totalShiftSalary = lineCount * rate;

  const teamCount = appState.selectedMemberIds.size || 1;
  const perPersonShare = Math.round(totalShiftSalary / teamCount);

  const totalMeters = appState.currentLines.reduce((acc, l) => acc + (parseFloat(l.meters) || 0), 0);
  const doneCount    = appState.currentLines.filter(l => l.status === 'Done' || l.status === 'Passed').length;
  const pendingCount = appState.currentLines.filter(l => l.status === 'Pending').length;
  const failedCount  = appState.currentLines.filter(l => l.status === 'Failed').length;
  const donePct = lineCount > 0 ? Math.round((doneCount / lineCount) * 100) : 0;

  document.getElementById('previewPayable').textContent = `₹${totalShiftSalary.toLocaleString('en-IN')}`;
  document.getElementById('previewFormula').textContent = `${lineCount} line${lineCount !== 1 ? 's' : ''} × ₹${rate.toLocaleString('en-IN')} / line`;
  document.getElementById('previewRate').textContent = `₹${rate.toLocaleString('en-IN')}`;
  document.getElementById('previewMeters').textContent = `${totalMeters.toFixed(1)} m`;
  document.getElementById('previewDonePct').textContent = `${donePct}% Done`;

  document.getElementById('previewTeamCount').textContent = `${teamCount} Member${teamCount !== 1 ? 's' : ''} (${(100 / teamCount).toFixed(teamCount > 2 ? 1 : 0)}% each)`;
  document.getElementById('previewPerPersonAmount').textContent = `₹${perPersonShare.toLocaleString('en-IN')} / person`;
  document.getElementById('previewSplitFormula').textContent = `₹${totalShiftSalary.toLocaleString('en-IN')} ÷ ${teamCount} member${teamCount !== 1 ? 's' : ''} = ₹${perPersonShare.toLocaleString('en-IN')} each`;

  const noticePerPerson = document.getElementById('teamSplitPerPersonPreview');
  if (noticePerPerson) noticePerPerson.textContent = `₹${perPersonShare.toLocaleString('en-IN')} / person`;

  const sharesList = document.getElementById('previewIndividualShares');
  if (sharesList) {
    sharesList.innerHTML = '';
    if (appState.selectedMemberIds.size > 0) {
      appState.selectedMemberIds.forEach(mId => {
        const m = appState.members.find(x => x.id === mId);
        if (m) {
          const div = document.createElement('div');
          div.className = 'p-1.5 rounded-lg bg-slate-800/80 flex items-center justify-between text-[11px]';
          div.innerHTML = `
            <span class="text-slate-300 font-semibold flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> ${escapeHtml(m.name)}
            </span>
            <span class="text-emerald-400 font-extrabold">₹${perPersonShare.toLocaleString('en-IN')}</span>
          `;
          sharesList.appendChild(div);
        }
      });
    }
  }

  document.getElementById('countDone').textContent = doneCount;
  document.getElementById('countPending').textContent = pendingCount;
  document.getElementById('countFailed').textContent = failedCount;

  const badge = document.getElementById('tierBadge');
  const tierSub = document.getElementById('previewRateTier');
  if (appState.isOverride) {
    badge.textContent = `Manual Override: ₹${rate.toLocaleString('en-IN')}/line`;
    tierSub.textContent = 'Custom Override';
  } else if (lineCount >= 3) {
    badge.textContent = 'Tier 2: ₹3,000 / line (Bonus Rate)';
    tierSub.textContent = 'Tier 2 (3+ lines)';
  } else {
    badge.textContent = 'Tier 1: ₹2,500 / line';
    tierSub.textContent = 'Tier 1 (1–2 lines)';
  }

  const doneWidth = lineCount > 0 ? (doneCount / lineCount) * 100 : 0;
  const pendWidth = lineCount > 0 ? (pendingCount / lineCount) * 100 : 0;
  const failWidth = lineCount > 0 ? (failedCount / lineCount) * 100 : 0;

  document.getElementById('barDone').style.width    = `${doneWidth}%`;
  document.getElementById('barPending').style.width = `${pendWidth}%`;
  document.getElementById('barFailed').style.width  = `${failWidth}%`;
}

async function handleSaveEntry(e) {
  e.preventDefault();

  if (appState.selectedMemberIds.size === 0) {
    showToast('⚠️ Please tick at least 1 working Team Member!', 'error');
    return;
  }

  const entryDate  = document.getElementById('entryDate').value;
  const totalLines = appState.currentLines.length;
  const ratePerLine = computeActiveRate(totalLines);
  const totalAmount = totalLines * ratePerLine;
  const totalMeters = appState.currentLines.reduce((sum, l) => sum + (parseFloat(l.meters) || 0), 0);

  const selectedMembersList = [];
  appState.selectedMemberIds.forEach(id => {
    const m = appState.members.find(x => x.id === id);
    if (m) selectedMembersList.push(m);
  });

  const teamSize = selectedMembersList.length;
  const sharePerMember = Math.round(totalAmount / teamSize);
  const combinedMemberNames = selectedMembersList.map(m => m.name).join(', ');

  const saveBtn = document.getElementById('saveEntryBtn');
  const label   = document.getElementById('saveBtnLabel');
  saveBtn.disabled = true;
  label.textContent = 'Saving Shift & Split...';

  const masterRecord = {
    member_id: selectedMembersList[0].id,
    entry_date: entryDate,
    member_name: combinedMemberNames,
    team_size: teamSize,
    share_per_member: sharePerMember,
    total_lines: totalLines,
    total_meters: totalMeters,
    rate_per_line: ratePerLine,
    total_amount: totalAmount,
    created_at: new Date().toISOString()
  };

  try {
    if (isSupabaseLive && sbClient) {
      const { data: inserted, error: mErr } = await sbClient
        .from('production_entries')
        .insert([masterRecord])
        .select()
        .single();
      if (mErr) throw mErr;

      const membersPayload = selectedMembersList.map(m => ({
        entry_id: inserted.id,
        member_id: m.id,
        member_name: m.name,
        share_amount: sharePerMember
      }));
      await sbClient.from('production_entry_members').insert(membersPayload);

      const linesPayload = appState.currentLines.map(line => ({
        entry_id: inserted.id,
        line_number: line.lineNumber || 'Line #1',
        meters: parseFloat(line.meters) || 0,
        qc_status: line.status || 'Done'
      }));
      await sbClient.from('production_line_items').insert(linesPayload);

      showToast(`Saved! ₹${totalAmount.toLocaleString('en-IN')} divided among ${teamSize} members (₹${sharePerMember.toLocaleString('en-IN')} each)!`, 'success');
    } else {
      const entryId = generateId();
      const localEntry = {
        id: entryId,
        ...masterRecord,
        production_entry_members: selectedMembersList.map(m => ({
          id: generateId(),
          entry_id: entryId,
          member_id: m.id,
          member_name: m.name,
          share_amount: sharePerMember
        })),
        production_line_items: appState.currentLines.map(l => ({
          id: generateId(),
          entry_id: entryId,
          line_number: l.lineNumber,
          meters: l.meters,
          qc_status: l.status
        }))
      };
      appState.entries.unshift(localEntry);
      localStorage.setItem('protrack_entries', JSON.stringify(appState.entries));
      showToast(`Saved in local storage (₹${sharePerMember.toLocaleString('en-IN')} each)!`, 'success');
    }

    initDefaultLine();
    await fetchEntries();
  } catch (err) {
    console.error('Save entry error:', err);
    showToast('Error saving: ' + err.message, 'error');
  } finally {
    saveBtn.disabled = false;
    label.textContent = 'Save & Record Payment Split';
  }
}

function resetEntryForm() {
  initDefaultLine();
  appState.selectedMemberIds.clear();
  document.getElementById('overrideRateCheck').checked = false;
  document.getElementById('customRateRow').classList.add('hidden');
  appState.isOverride = false;
  renderTeamChecklist();
  updateCalculations();
}

function setDatePreset(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const str = d.toISOString().split('T')[0];
  document.getElementById('entryDate').value = str;
}

function updateRibbonPaymentTotals() {
  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  let todayTotal = 0, monthTotal = 0, allTimeTotal = 0;

  appState.entries.forEach(e => {
    const amt = parseFloat(e.total_amount) || 0;
    allTimeTotal += amt;
    if (e.entry_date === todayStr) todayTotal += amt;
    if ((e.entry_date || '').startsWith(currentMonthPrefix)) monthTotal += amt;
  });

  document.getElementById('ribbonTodayPay').textContent  = `₹${todayTotal.toLocaleString('en-IN')}`;
  document.getElementById('ribbonMonthPay').textContent  = `₹${monthTotal.toLocaleString('en-IN')}`;
  document.getElementById('ribbonAllTimePay').textContent = `₹${allTimeTotal.toLocaleString('en-IN')}`;
}
