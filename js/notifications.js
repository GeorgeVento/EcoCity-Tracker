/* js/notifications.js — Polling badge for pending reports */
(function () {
  'use strict';

  var POLL_MS   = 30000; // 30 seconds
  var lastCount = -1;

  // ── Nav Toggle (shared utility) ──────────────────────────────
  var toggle   = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  if (toggle && navLinks) {
    toggle.addEventListener('click', function () {
      navLinks.classList.toggle('open');
      toggle.classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
        toggle.classList.remove('open');
      }
    });
  }

  // ── Toast ────────────────────────────────────────────────────
  function showToast(msg, type) {
    var c = document.getElementById('toastContainer');
    if (!c) return;
    var t = document.createElement('div');
    t.className = 'toast toast-' + (type || 'info');
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 4000);
  }

  // ── Badge update ─────────────────────────────────────────────
  function updateBadge(count) {
    var badge = document.getElementById('notifBadge');
    if (!badge) return;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline' : 'none';
  }

  // ── Check notifications ──────────────────────────────────────
  function check() {
    // Read from localStorage
    var reports = [];
    try { reports = JSON.parse(localStorage.getItem('ecocity_reports') || '[]'); } catch (e) {}
    var pending = reports.filter(function (r) { return r.status === 'pending'; }).length;

    // Notify only if count increased
    if (lastCount >= 0 && pending > lastCount) {
      showToast('🔔 Νέα εκκρεμής αναφορά προστέθηκε!', 'info');
    }
    lastCount = pending;
    updateBadge(pending);

    // Also check the API (if server is running)
    fetch('/api/notifications')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && typeof d.pendingCount === 'number') updateBadge(d.pendingCount);
      })
      .catch(function () { /* API offline */ });
  }

  check();
  setInterval(check, POLL_MS);

})();
