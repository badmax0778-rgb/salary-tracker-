// ============================================================================
// COMPONENTS/EXCEL.JS — Excel export (Records + Report salary data)
// ============================================================================

function exportToExcel() {
  if (appState.entries.length === 0) {
    showToast('No records to export', 'info');
    return;
  }

  // Sheet 1: Shift Summaries (1 row per shift)
  const shiftSummaryRows = appState.entries.map(e => {
    const teamSize   = parseInt(e.team_size) || 1;
    const shiftTotal = parseFloat(e.total_amount) || 0;
    const share      = parseFloat(e.share_per_member) || Math.round(shiftTotal / teamSize);
    return {
      'Shift Date': e.entry_date,
      'Team Members': e.member_name,
      'Team Size': teamSize,
      'Total Lines': parseInt(e.total_lines) || 0,
      'Total Meters': parseFloat(e.total_meters) || 0,
      'Rate Per Line (INR)': parseFloat(e.rate_per_line),
      'Day Shift Total (INR)': shiftTotal,
      'Equal Share Per Member (INR)': share
    };
  });

  // Sheet 2: Line Details (1 row per production line)
  const lineRows = [];
  appState.entries.forEach(e => {
    const rate = parseFloat(e.rate_per_line) || 0;
    (e.production_line_items || []).forEach(l => {
      lineRows.push({
        'Date': e.entry_date,
        'Team Members': e.member_name,
        'Line Number': l.line_number,
        'Production Meters': parseFloat(l.meters) || 0,
        'Status': l.qc_status,
        'Rate Per Line (INR)': rate,
        'This Line Amount (INR)': rate
      });
    });
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(shiftSummaryRows), 'Shift Summaries');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lineRows), 'Line Details');
  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Production_Records_${today}.xlsx`);
  showToast('Records exported to Excel (Clean 2-Sheet Format)!', 'success');
}

function exportReportsToExcel() {
  const fromDate = document.getElementById('reportFromDate').value;
  const toDate   = document.getElementById('reportToDate').value;

  const rangeEntries = appState.entries.filter(e => {
    if (fromDate && e.entry_date < fromDate) return false;
    if (toDate   && e.entry_date > toDate)   return false;
    return true;
  });

  if (rangeEntries.length === 0) {
    showToast('No records found for the selected period to export', 'info');
    return;
  }

  // Sheet 1: Shift Summaries
  const shiftSummaryRows = rangeEntries.map(e => {
    const teamSize   = parseInt(e.team_size) || (e.member_name.includes(',') ? e.member_name.split(',').length : 1);
    const shiftTotal = parseFloat(e.total_amount) || 0;
    const share      = parseFloat(e.share_per_member) || Math.round(shiftTotal / teamSize);
    return {
      'Shift Date': e.entry_date,
      'Team Members': e.member_name,
      'Team Size': teamSize,
      'Total Lines Count': parseInt(e.total_lines) || 0,
      'Total Meters Produced': parseFloat(e.total_meters) || 0,
      'Rate Per Line (INR)': parseFloat(e.rate_per_line),
      'Day Shift Total Amount (INR)': shiftTotal,
      'Equal Share Per Member (INR)': share
    };
  });

  // Sheet 2: Line Breakdown
  const lineRows = [];
  rangeEntries.forEach(e => {
    const rate = parseFloat(e.rate_per_line) || 0;
    (e.production_line_items || []).forEach(l => {
      lineRows.push({
        'Date': e.entry_date,
        'Team Members': e.member_name,
        'Line Number': l.line_number,
        'Production Meters': parseFloat(l.meters) || 0,
        'QC Status': l.qc_status,
        'Rate Per Line (INR)': rate,
        'This Line Amount (INR)': rate
      });
    });
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(shiftSummaryRows), 'Shift Summaries');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lineRows), 'Line Breakdown');
  XLSX.writeFile(wb, `Team_Salary_Report_${fromDate}_to_${toDate}.xlsx`);
  showToast('Report exported to Excel (with Summary & Lines sheets)!', 'success');
}
