// ============================================================================
// COMPONENTS/MANAGER.JS — Manager executive dashboard analytics
// ============================================================================

function setManagerPreset(preset) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (preset === 'today') {
    document.getElementById('mgrFromDate').value = todayStr;
    document.getElementById('mgrToDate').value = todayStr;
  } else if (preset === 'thisMonth') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    document.getElementById('mgrFromDate').value = firstDay;
    document.getElementById('mgrToDate').value = todayStr;
  } else if (preset === 'last30') {
    const d30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    document.getElementById('mgrFromDate').value = d30;
    document.getElementById('mgrToDate').value = todayStr;
  }
  runManagerAnalytics();
}

function runManagerAnalytics() {
  const fromDate = document.getElementById('mgrFromDate')?.value || '';
  const toDate   = document.getElementById('mgrToDate')?.value || '';
  const statusFilter = document.getElementById('mgrWorkStatus')?.value || 'ALL';

  const rangeEntries = appState.entries.filter(e => {
    if (!e.entry_date) return false;
    if (fromDate && e.entry_date < fromDate) return false;
    if (toDate   && e.entry_date > toDate)   return false;
    return true;
  });

  let totalLinesCount = 0, totalLinesDone = 0, totalLinesPending = 0;
  let totalMetersProduced = 0, totalWagesCost = 0;

  const teamStatsMap = new Map();
  const flattenedLinesAudit = [];

  rangeEntries.forEach(entry => {
    totalWagesCost += parseFloat(entry.total_amount) || 0;
    const teamKey    = entry.team_name !== 'No Team' ? entry.team_name : (entry.member_name || 'Individual Operator');
    const teamSize   = parseInt(entry.team_size) || (entry.member_name && entry.member_name.includes(',') ? entry.member_name.split(',').length : 1);
    const shiftAmount = parseFloat(entry.total_amount) || 0;
    const sharePerMember = parseFloat(entry.share_per_member) || Math.round(shiftAmount / teamSize);

    if (!teamStatsMap.has(teamKey)) {
      teamStatsMap.set(teamKey, {
        teamName: teamKey,
        teamSize,
        shiftsCount: 0,
        linesCount: 0,
        totalMeters: 0,
        totalEarnings: 0,
        sharePerMember
      });
    }

    const tStats = teamStatsMap.get(teamKey);
    tStats.shiftsCount++;
    tStats.linesCount    += parseInt(entry.total_lines) || 0;
    tStats.totalMeters   += parseFloat(entry.total_meters) || 0;
    tStats.totalEarnings += shiftAmount;

    (entry.production_line_items || []).forEach(l => {
      totalLinesCount++;
      const isDone = l.qc_status === 'Done' || l.qc_status === 'Passed';
      if (isDone) totalLinesDone++;
      else totalLinesPending++;
      totalMetersProduced += parseFloat(l.meters) || 0;

      let includeLine = true;
      if (statusFilter === 'DONE_ONLY'    && !isDone) includeLine = false;
      if (statusFilter === 'PENDING_ONLY' &&  isDone) includeLine = false;

      if (includeLine) {
        flattenedLinesAudit.push({
          entryId: entry.id,
          lineId: l.id,
          date: entry.entry_date,
          lineNumber: l.line_number,
          meters: parseFloat(l.meters) || 0,
          status: l.qc_status || 'Done',
          teamName: teamKey,
          teamSize,
          shiftTotal: shiftAmount
        });
      }
    });
  });

  appState.managerLinesList = flattenedLinesAudit;

  const doneRate  = totalLinesCount > 0 ? Math.round((totalLinesDone / totalLinesCount) * 100) : 0;
  const avgMeters = totalLinesCount > 0 ? (totalMetersProduced / totalLinesCount).toFixed(1) : '0';

  document.getElementById('mgrTotalLines').textContent        = totalLinesCount;
  document.getElementById('mgrLinesStatusRatio').textContent  = `${totalLinesDone} Completed &bull; ${totalLinesPending} Pending`;
  document.getElementById('mgrTotalMeters').textContent       = `${totalMetersProduced.toFixed(1)} m`;
  document.getElementById('mgrAvgMetersPerLine').textContent  = `${avgMeters} m / line average`;
  document.getElementById('mgrDonePct').textContent           = `${doneRate}%`;
  document.getElementById('mgrPendingCountAlert').textContent = `${totalLinesPending} line(s) pending`;
  document.getElementById('mgrTotalCost').textContent         = `₹${totalWagesCost.toLocaleString('en-IN')}`;
  document.getElementById('mgrTotalShiftsCount').textContent  = `${rangeEntries.length} shifts logged`;
  document.getElementById('mgrLineCountBadge').textContent    = `${flattenedLinesAudit.length} Lines`;

  // 1. Team Productivity Table
  const teamTableBody   = document.getElementById('mgrTeamTableBody');
  const teamCardsMobile = document.getElementById('mgrTeamCardsMobile');
  teamTableBody.innerHTML = '';
  teamCardsMobile.innerHTML = '';

  teamStatsMap.forEach(team => {
    const avgLines = (team.linesCount / team.shiftsCount).toFixed(1);

    const mCard = document.createElement('div');
    mCard.className = 'p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2';
    mCard.innerHTML = `
      <div class="flex items-start justify-between">
        <div>
          <span class="text-xs font-extrabold text-slate-800 block">${escapeHtml(team.teamName)}</span>
          <span class="text-[10px] text-slate-400 font-semibold">${team.teamSize} person team &bull; ${team.shiftsCount} shifts</span>
        </div>
        <div class="text-right">
          <span class="text-sm font-extrabold text-indigo-700 block">${team.linesCount} lines</span>
          <span class="text-[10px] text-slate-500 font-bold">${avgLines} lines/shift</span>
        </div>
      </div>
      <div class="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
        <span class="text-slate-500 font-medium">${team.totalMeters.toFixed(1)}m output</span>
        <span class="text-emerald-700 font-extrabold">₹${team.totalEarnings.toLocaleString('en-IN')} total (₹${team.sharePerMember.toLocaleString('en-IN')}/person)</span>
      </div>
    `;
    teamCardsMobile.appendChild(mCard);

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition';
    tr.innerHTML = `
      <td class="py-2 px-3 font-bold text-slate-800">${escapeHtml(team.teamName)}</td>
      <td class="py-2 px-3 text-center font-semibold text-slate-600">${team.teamSize}</td>
      <td class="py-2 px-3 text-center font-semibold text-slate-600">${team.shiftsCount}</td>
      <td class="py-2 px-3 text-center font-extrabold text-indigo-700">${team.linesCount}</td>
      <td class="py-2 px-3 text-center font-bold text-slate-700">${avgLines}</td>
      <td class="py-2 px-3 text-right font-semibold text-slate-700">${team.totalMeters.toFixed(1)} m</td>
      <td class="py-2 px-3 text-right font-extrabold text-slate-900">₹${team.totalEarnings.toLocaleString('en-IN')}</td>
      <td class="py-2 px-3 text-right font-extrabold text-emerald-600">₹${team.sharePerMember.toLocaleString('en-IN')}</td>
    `;
    teamTableBody.appendChild(tr);
  });

  // 2. Line-by-Line Audit
  const linesTableBody   = document.getElementById('mgrLinesTableBody');
  const linesCardsMobile = document.getElementById('mgrLinesCardsMobile');
  const emptyDiv         = document.getElementById('mgrEmpty');

  linesTableBody.innerHTML = '';
  linesCardsMobile.innerHTML = '';

  if (flattenedLinesAudit.length === 0) {
    emptyDiv.classList.remove('hidden');
    return;
  }
  emptyDiv.classList.add('hidden');

  flattenedLinesAudit.forEach(l => {
    const isDone = l.status === 'Done' || l.status === 'Passed';

    const card = document.createElement('div');
    card.className = 'p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs';
    card.innerHTML = `
      <div>
        <div class="flex items-center gap-1.5">
          <span class="font-extrabold text-slate-800">${escapeHtml(l.lineNumber)}</span>
          <span class="text-[10px] text-slate-400">${formatDate(l.date)}</span>
        </div>
        <span class="text-[11px] text-slate-500 block truncate max-w-[200px]">${escapeHtml(l.teamName)} (${l.meters.toFixed(1)}m)</span>
      </div>
      <button onclick="toggleLineStatusDirect('${l.lineId}', '${l.status}', '${l.entryId}')"
        class="px-2.5 py-1 rounded-full font-bold text-[10px] transition ${
          isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
        }">
        ${l.status} ⟳
      </button>
    `;
    linesCardsMobile.appendChild(card);

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition';
    tr.innerHTML = `
      <td class="py-2 px-3 text-slate-600 whitespace-nowrap">${formatDate(l.date)}</td>
      <td class="py-2 px-3 font-bold text-slate-800">${escapeHtml(l.lineNumber)}</td>
      <td class="py-2 px-3 text-slate-700">${escapeHtml(l.teamName)} <span class="text-[10px] text-slate-400">(${l.teamSize} members)</span></td>
      <td class="py-2 px-3 text-right font-semibold text-slate-800">${l.meters.toFixed(1)} m</td>
      <td class="py-2 px-3 text-center">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
          ${isDone ? 'Finished / Done' : 'Pending'}
        </span>
      </td>
      <td class="py-2 px-3 text-right font-bold text-slate-800">₹${l.shiftTotal.toLocaleString('en-IN')}</td>
      <td class="py-2 px-3 text-center">
        <button onclick="toggleLineStatusDirect('${l.lineId}', '${l.status}', '${l.entryId}')"
          class="px-2 py-0.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[10px] transition">
          Toggle ⟳
        </button>
      </td>
    `;
    linesTableBody.appendChild(tr);
  });

  if (window.lucide) lucide.createIcons();
}

function shareManagerBriefingWhatsApp() {
  const fromDate   = document.getElementById('mgrFromDate')?.value || '';
  const toDate     = document.getElementById('mgrToDate')?.value || '';
  const totalLines = document.getElementById('mgrTotalLines')?.textContent || '0';
  const statusRatio = document.getElementById('mgrLinesStatusRatio')?.textContent || '';
  const totalMeters = document.getElementById('mgrTotalMeters')?.textContent || '0 m';
  const totalCost  = document.getElementById('mgrTotalCost')?.textContent || '₹0';
  const donePct    = document.getElementById('mgrDonePct')?.textContent || '0%';

  let msg = `*FACTORY PRODUCTION & MANAGER BRIEFING*\n`;
  msg += `Period: ${fromDate} to ${toDate}\n`;
  msg += `--------------------------------------\n`;
  msg += `🏭 Total Lines: ${totalLines} (${statusRatio})\n`;
  msg += `📏 Production Output: ${totalMeters}\n`;
  msg += `📈 Completion Rate: ${donePct}\n`;
  msg += `💰 Total Wages Expense: ${totalCost}\n`;
  msg += `--------------------------------------\n`;
  msg += `Generated via ProTrack Manager Portal.`;

  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

function exportManagerReportExcel() {
  if (!appState.managerLinesList || appState.managerLinesList.length === 0) {
    showToast('No manager lines available to export', 'info');
    return;
  }

  const rows = appState.managerLinesList.map(l => ({
    'Date': l.date,
    'Line Number': l.lineNumber,
    'Working Team': l.teamName,
    'Team Size': l.teamSize,
    'Meters Produced': l.meters,
    'Work Status': l.status,
    'Shift Total Amount (INR)': l.shiftTotal
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Floor_Audit');
  const fromDate = document.getElementById('mgrFromDate').value;
  const toDate   = document.getElementById('mgrToDate').value;
  XLSX.writeFile(wb, `Floor_Audit_Report_${fromDate}_to_${toDate}.xlsx`);
  showToast('Manager Floor Audit Excel exported!', 'success');
}
