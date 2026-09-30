// ============================================================================
// SERVICES/SUPABASE.JS — All database operations (Supabase + localStorage fallback)
// ============================================================================

function updateStatusIndicator(live, text) {
  const dot = document.getElementById('supabaseStatusDot');
  const label = document.getElementById('supabaseStatusText');
  if (live) {
    dot.className = 'w-2 h-2 rounded-full bg-emerald-500';
    label.textContent = text;
  } else {
    dot.className = 'w-2 h-2 rounded-full bg-amber-500 animate-pulse';
    label.textContent = text;
  }
}

function initSupabase() {
  const url = localStorage.getItem('protrack_sb_url') || DEFAULT_SUPABASE_URL;
  const key = localStorage.getItem('protrack_sb_key') || DEFAULT_SUPABASE_ANON_KEY;

  if (window.supabase && url && key) {
    try {
      sbClient = window.supabase.createClient(url, key);
      isSupabaseLive = true;
      updateStatusIndicator(true, 'Supabase Live');
    } catch (e) {
      console.warn('Supabase init failed:', e);
      isSupabaseLive = false;
      updateStatusIndicator(false, 'Local Mode');
    }
  } else {
    isSupabaseLive = false;
    updateStatusIndicator(false, 'Local Mode');
  }

  fetchMembers();
  fetchEntries();
}

async function fetchMembers() {
  try {
    if (isSupabaseLive && sbClient) {
      const { data, error } = await sbClient
        .from('team_members')
        .select('*')
        .order('name');
      if (error) throw error;
      appState.members = data || [];
    } else {
      const raw = localStorage.getItem('protrack_members');
      appState.members = raw ? JSON.parse(raw) : [
        { id: '1', name: 'Rajesh Kumar', role: 'Senior Line Operator', phone: '9876543210', is_active: true },
        { id: '2', name: 'Priya Sharma', role: 'Line Operator', phone: '9876543211', is_active: true },
        { id: '3', name: 'Amit Verma', role: 'Line Operator', phone: '9876543212', is_active: true },
        { id: '4', name: 'Kavitha Murugan', role: 'Line Specialist', phone: '9876543213', is_active: true }
      ];
    }
  } catch (err) {
    console.error('Fetch members error:', err);
  } finally {
    renderTeamChecklist();
    renderReportMemberFilter();
    renderMembersTab();
  }
}

async function fetchEntries() {
  const spinner = document.getElementById('recordsRefreshSpinner');
  if (spinner) spinner.classList.add('animate-spin');

  try {
    if (isSupabaseLive && sbClient) {
      const { data, error } = await sbClient
        .from('production_entries')
        .select(`
          id,
          member_id,
          entry_date,
          member_name,
          team_size,
          share_per_member,
          total_lines,
          total_meters,
          rate_per_line,
          total_amount,
          created_at,
          production_entry_members (
            id,
            entry_id,
            member_id,
            member_name,
            share_amount
          ),
          production_line_items (
            id,
            entry_id,
            line_number,
            meters,
            qc_status
          )
        `)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      appState.entries = data || [];
    } else {
      const raw = localStorage.getItem('protrack_entries');
      appState.entries = raw ? JSON.parse(raw) : [];
    }
  } catch (err) {
    console.error('Fetch entries error:', err);
  } finally {
    if (spinner) spinner.classList.remove('animate-spin');
    updateRibbonPaymentTotals();
    renderRecordsView();
    runDetailedReports();
    runManagerAnalytics();
  }
}

async function toggleLineStatusDirect(lineId, currentStatus, entryId) {
  const newStatus = (currentStatus === 'Done' || currentStatus === 'Passed') ? 'Pending' : 'Done';

  try {
    if (isSupabaseLive && sbClient) {
      const { error } = await sbClient
        .from('production_line_items')
        .update({ qc_status: newStatus })
        .eq('id', lineId);
      if (error) throw error;
    }

    const entry = appState.entries.find(e => e.id === entryId);
    if (entry && entry.production_line_items) {
      const l = entry.production_line_items.find(x => x.id === lineId);
      if (l) l.qc_status = newStatus;
    }

    showToast(`Line status changed to ${newStatus}!`, 'success');
    renderRecordsView();
    runDetailedReports();
    runManagerAnalytics();
  } catch (err) {
    console.error('Status update error:', err);
    showToast('Failed to update status: ' + err.message, 'error');
  }
}

// ---- Supabase Config Modal ----
function openSupabaseModal() {
  document.getElementById('cfgUrl').value = localStorage.getItem('protrack_sb_url') || DEFAULT_SUPABASE_URL;
  document.getElementById('cfgKey').value = localStorage.getItem('protrack_sb_key') || DEFAULT_SUPABASE_ANON_KEY;
  document.getElementById('supabaseModal').classList.remove('hidden');
  document.getElementById('supabaseModal').classList.add('flex');
}

function closeSupabaseModal() {
  document.getElementById('supabaseModal').classList.add('hidden');
  document.getElementById('supabaseModal').classList.remove('flex');
}

function saveSupabaseConfig() {
  const url = document.getElementById('cfgUrl').value.trim();
  const key = document.getElementById('cfgKey').value.trim();
  if (!url || !key) return;

  localStorage.setItem('protrack_sb_url', url);
  localStorage.setItem('protrack_sb_key', key);
  closeSupabaseModal();
  initSupabase();
  showToast('Database configuration updated', 'success');
}
