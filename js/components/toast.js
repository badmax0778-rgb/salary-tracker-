// ============================================================================
// COMPONENTS/TOAST.JS — Toast notification system
// ============================================================================

function showToast(msg, type = 'info') {
  const box = document.getElementById('toastBox');
  const toast = document.createElement('div');
  let border = 'border-slate-200 bg-white text-slate-800';
  let icon = 'info';

  if (type === 'success') {
    border = 'border-emerald-200 bg-emerald-50 text-emerald-900';
    icon = 'check-circle-2';
  } else if (type === 'error') {
    border = 'border-rose-200 bg-rose-50 text-rose-900';
    icon = 'alert-triangle';
  }

  toast.className = `p-3 rounded-xl border shadow-lg text-xs font-semibold ${border} flex items-center gap-2 pointer-events-auto transition-all duration-300 transform translate-y-2 opacity-0`;
  toast.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4 shrink-0"></i><span>${escapeHtml(msg)}</span>`;

  box.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 10);
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
