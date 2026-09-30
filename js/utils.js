// ============================================================================
// UTILS.JS — Pure utility functions used across all components
// ============================================================================

function generateId() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'id_' + Math.random().toString(36).substr(2, 9);
}

function escapeHtml(t) {
  if (!t) return '';
  return String(t)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(dStr) {
  if (!dStr) return '';
  const p = dStr.split('-');
  if (p.length === 3) {
    const d = new Date(p[0], p[1] - 1, p[2]);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  return dStr;
}

/**
 * Returns rate per line based on number of lines (or manual override).
 * Business Rule: 1–2 lines = ₹2,500 | 3+ lines = ₹3,000
 */
function computeActiveRate(lineCount) {
  if (appState.isOverride) {
    const customEl = document.getElementById('customRateValue');
    const custom = customEl ? (parseFloat(customEl.value) || 0) : 0;
    return custom > 0 ? custom : RATE_LOW;
  }
  return lineCount >= 3 ? RATE_HIGH : RATE_LOW;
}

function getStatusColorClass(status) {
  if (status === 'Done' || status === 'Passed') return 'text-emerald-700 font-bold';
  if (status === 'Pending') return 'text-amber-700 font-bold';
  return 'text-rose-700 font-bold';
}
