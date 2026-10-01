// ============================================================================
// COMPONENTS/REPORTS.JS — Member salary reports (date-to-date, payslip modal)
// ============================================================================

function setReportRangePreset(preset) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (preset === 'today') {
    document.getElementById('reportFromDate').value = todayStr;
    document.getElementById('reportToDate').value   = todayStr;
  } else if (preset === 'thisMonth') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    document.getElementById('reportFromDate').value = firstDay;
    document.getElementById('reportToDate').value   = todayStr;
  } else if (preset === 'last30') {
    const d30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    document.getElementById('reportFromDate').value = d30;
    document.getElementById('reportToDate').value   = todayStr;
  }
  runDetailedReports();
}

function runDetailedReports() {
  const fromDate     = document.getElementById('reportFromDate').value;
  const toDate       = document.getElementById('reportToDate').value;
  const filterTeam   = document.getElementById('reportTeamFilter')?.value || 'ALL';
  const filterMember = document.getElementById('reportMemberFilter').value;

  document.getElementById('repDateLabel').textContent = `Period: ${formatDate(fromDate)} to ${formatDate(toDate)}`;

  const rangeEntries = appState.entries.filter(e => {
    if (!e.entry_date) return false;
    if (fromDate && e.entry_date < fromDate) return false;
    if (toDate   && e.entry_date > toDate)   return false;
    if (filterTeam !== 'ALL' && e.team_name !== filterTeam) return false;
    return true;
  });

  let totalPeriodCost = 0, totalPeriodLines = 0, totalPeriodMeters = 0;
  const memberSalaryMap = new Map();

  rangeEntries.forEach(entry => {
    totalPeriodCost   += parseFloat(entry.total_amount) || 0;
    totalPeriodLines  += parseInt(entry.total_lines) || 0;
    totalPeriodMeters += parseFloat(entry.total_meters) || 0;

    let shiftMembers = [];
    if (entry.production_entry_members && entry.production_entry_members.length > 0) {
      shiftMembers = entry.production_entry_members.map(m => m.member_name);
    } else {
      shiftMembers = (entry.member_name || '').split(',').map(s => s.trim()).filter(Boolean);
    }
    if (shiftMembers.length === 0) shiftMembers = ['Unknown Operator'];

    const teamSize    = shiftMembers.length;
    const totalAmount = parseFloat(entry.total_amount) || 0;
    const shareAmount = parseFloat(entry.share_per_member) || Math.round(totalAmount / teamSize);

    shiftMembers.forEach(memName => {
      if (filterMember !== 'ALL' && memName.toLowerCase() !== filterMember.toLowerCase()) return;

      if (!memberSalaryMap.has(memName)) {
        const teamObj = appState.members.find(m => m.name.toLowerCase() === memName.toLowerCase());
        memberSalaryMap.set(memName, {
          name: memName,
          phone: teamObj ? teamObj.phone : '',
          role: teamObj ? teamObj.role : 'Operator',
          shifts: [],
          totalEarned: 0,
          totalLinesDone: 0,
          totalMeters: 0
        });
      }

      const mRecord = memberSalaryMap.get(memName);
      mRecord.totalEarned    += shareAmount;
      mRecord.totalLinesDone += parseInt(entry.total_lines) || 0;
      mRecord.totalMeters    += parseFloat(entry.total_meters) || 0;

      mRecord.shifts.push({
        id: entry.id,
        date: entry.entry_date,
        teamSize,
        allMembers: entry.member_name,
        linesCount: entry.total_lines,
        meters: entry.total_meters,
        shiftTotal: totalAmount,
        myShare: shareAmount
      });
    });
  });

  document.getElementById('repTotalCost').textContent    = `₹${totalPeriodCost.toLocaleString('en-IN')}`;
  document.getElementById('repTotalLines').textContent   = totalPeriodLines.toLocaleString('en-IN');
  document.getElementById('repTotalMeters').textContent  = `${totalPeriodMeters.toFixed(1)} m`;
  document.getElementById('repWorkersCount').textContent = memberSalaryMap.size;

  const mobileList = document.getElementById('reportListMobile');
  const tableBody  = document.getElementById('reportTableBody');
  const empty      = document.getElementById('reportEmpty');

  if (memberSalaryMap.size === 0) {
    mobileList.innerHTML = '';
    tableBody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  mobileList.innerHTML = '';
  tableBody.innerHTML = '';

  memberSalaryMap.forEach(stats => {
    const shiftsCount = stats.shifts.length;

    const mCard = document.createElement('div');
    mCard.className = 'p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2';
    mCard.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <div class="text-xs font-bold text-slate-800">${escapeHtml(stats.name)}</div>
          <div class="text-[10px] text-slate-500">${escapeHtml(stats.role)} &bull; ${shiftsCount} shifts worked</div>
        </div>
        <div class="text-right">
          <div class="text-sm font-extrabold text-emerald-700">₹${stats.totalEarned.toLocaleString('en-IN')}</div>
          <div class="text-[10px] text-slate-400">Total earned share</div>
        </div>
      </div>
      <div class="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
        <span class="text-[11px] text-slate-500">${stats.totalLinesDone} lines &bull; ${stats.totalMeters.toFixed(1)}m</span>
        <button onclick='openMemberShiftsModal(${JSON.stringify(stats).replace(/'/g, "&#39;")})'
          class="px-2.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-bold flex items-center gap-1 transition">
          <i data-lucide="file-text" class="w-3 h-3"></i> View Statement
        </button>
      </div>
    `;
    mobileList.appendChild(mCard);

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition';
    tr.innerHTML = `
      <td class="py-2.5 px-3 font-bold text-slate-800">
        ${escapeHtml(stats.name)}
        <span class="block text-[10px] text-slate-400 font-normal">${escapeHtml(stats.role)}</span>
      </td>
      <td class="py-2.5 px-3 text-center font-semibold text-slate-700">${shiftsCount} shifts</td>
      <td class="py-2.5 px-3 text-center font-bold text-brand-700">${stats.totalLinesDone} lines</td>
      <td class="py-2.5 px-3 text-right text-slate-700 font-semibold">${stats.totalMeters.toFixed(1)} m</td>
      <td class="py-2.5 px-3 text-right font-extrabold text-emerald-600 text-sm">₹${stats.totalEarned.toLocaleString('en-IN')}</td>
      <td class="py-2.5 px-3 text-center">
        <button onclick='openMemberShiftsModal(${JSON.stringify(stats).replace(/'/g, "&#39;")})'
          class="px-2.5 py-1 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-[11px] transition">
          View Statement
        </button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  if (window.lucide) lucide.createIcons();
}

function openMemberShiftsModal(stats) {
  appState.activeReportMember = stats;
  const fromDate = document.getElementById('reportFromDate').value;
  const toDate   = document.getElementById('reportToDate').value;

  document.getElementById('memberShiftsTitle').innerHTML    = `<i data-lucide="file-text" class="w-4 h-4 text-brand-600"></i> ${escapeHtml(stats.name)} &bull; Salary Details`;
  document.getElementById('memberShiftsSubtitle').textContent = `Period: ${formatDate(fromDate)} to ${formatDate(toDate)}`;
  document.getElementById('memberModalTotalSalary').textContent = `₹${stats.totalEarned.toLocaleString('en-IN')}`;
  document.getElementById('memberModalTotalShifts').textContent = `${stats.shifts.length} shifts worked`;

  const container = document.getElementById('memberShiftsContainer');
  container.innerHTML = '';

  let textSummary = `====================================================\n`;
  textSummary += `PRODUCTION & SALARY STATEMENT\n`;
  textSummary += `====================================================\n`;
  textSummary += `Member Name:       ${stats.name}\n`;
  textSummary += `Role:              ${stats.role}\n`;
  textSummary += `Report Period:     ${fromDate} to ${toDate}\n`;
  textSummary += `Total Shifts:      ${stats.shifts.length}\n`;
  textSummary += `Total Lines:       ${stats.totalLinesDone}\n`;
  textSummary += `Total Meters:      ${stats.totalMeters.toFixed(1)}m\n`;
  textSummary += `----------------------------------------------------\n`;
  textSummary += `DATE-BY-DATE SHIFT DETAILS & SPLIT:\n`;

  stats.shifts.forEach((s, idx) => {
    textSummary += `${idx + 1}. Date: ${s.date}\n`;
    textSummary += `   - Team: ${s.allMembers} (${s.teamSize} member team)\n`;
    textSummary += `   - Output: ${s.linesCount} lines | ${parseFloat(s.meters).toFixed(1)}m\n`;
    textSummary += `   - Shift Total: INR ${s.shiftTotal.toLocaleString('en-IN')}\n`;
    textSummary += `   - Your Equal Share: INR ${s.myShare.toLocaleString('en-IN')}\n\n`;

    const card = document.createElement('div');
    card.className = 'p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1';
    card.innerHTML = `
      <div class="flex items-center justify-between font-bold">
        <span class="text-slate-800">${formatDate(s.date)}</span>
        <span class="text-emerald-700 font-extrabold text-sm">₹${s.myShare.toLocaleString('en-IN')}</span>
      </div>
      <div class="text-[11px] text-slate-500 flex items-center justify-between">
        <span>Worked with: ${escapeHtml(s.allMembers)} (${s.teamSize} members)</span>
        <span>${s.linesCount} lines</span>
      </div>
      <div class="text-[10px] text-slate-400">
        Shift Total: ₹${s.shiftTotal.toLocaleString('en-IN')} ÷ ${s.teamSize} = ₹${s.myShare.toLocaleString('en-IN')}
      </div>
    `;
    container.appendChild(card);
  });

  textSummary += `----------------------------------------------------\n`;
  textSummary += `TOTAL PAYABLE TO YOU: INR ${stats.totalEarned.toLocaleString('en-IN')}\n`;
  textSummary += `====================================================\n`;
  textSummary += `Verified by Production Supervisor.\n`;

  appState.activeReportText = textSummary;

  document.getElementById('memberShiftsModal').classList.remove('hidden');
  document.getElementById('memberShiftsModal').classList.add('flex');
  if (window.lucide) lucide.createIcons();
}

function closeMemberShiftsModal() {
  document.getElementById('memberShiftsModal').classList.add('hidden');
  document.getElementById('memberShiftsModal').classList.remove('flex');
}

function copyMemberReportText() {
  navigator.clipboard.writeText(appState.activeReportText).then(() => {
    showToast('Salary statement copied to clipboard!', 'success');
  });
}

function shareMemberWhatsApp() {
  const phone = appState.activeReportMember ? appState.activeReportMember.phone : '';
  const text  = encodeURIComponent(appState.activeReportText);
  const url   = phone ? `https://wa.me/91${phone.replace(/\D/g, '')}?text=${text}` : `https://wa.me/?text=${text}`;
  window.open(url, '_blank');
}
