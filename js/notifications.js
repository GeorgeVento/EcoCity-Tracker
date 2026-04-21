/* js/notifications.js — Polling badge εκκρεμών αναφορών */
(function () {
  'use strict';

  var POLL_MS   = 30000; // 30 δευτερόλεπτα
  var lastCount = -1;

  // ── Nav Toggle (κοινό utility) ───────────────────────────────
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
    // Ανάγνωση από localStorage
    var reports = [];
    try { reports = JSON.parse(localStorage.getItem('ecocity_reports') || '[]'); } catch (e) {}
    var pending = reports.filter(function (r) { return r.status === 'pending'; }).length;

    // Ειδοποίηση μόνο αν αυξήθηκαν
    if (lastCount >= 0 && pending > lastCount) {
      showToast('🔔 Νέα εκκρεμής αναφορά προστέθηκε!', 'info');
    }
    lastCount = pending;
    updateBadge(pending);

    // Επίσης ελέγχουμε το API (αν τρέχει server)
    fetch('/api/notifications')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && typeof d.pendingCount === 'number') updateBadge(d.pendingCount);
      })
      .catch(function () { /* API εκτός σύνδεσης */ });
  }

  check();
  setInterval(check, POLL_MS);

})();
