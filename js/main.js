/* js/main.js — Κοινές λειτουργίες: nav toggle, counters, πρόσφατες αναφορές */
(function () {
  'use strict';

  // ── Mobile Nav Toggle ────────────────────────────────────────
  var toggle   = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  if (toggle && navLinks) {
    toggle.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
      }
    });
  }

  // ── Counter Animation (index.html) ──────────────────────────
  var counters = document.querySelectorAll('.counter-number[data-target]');
  if (counters.length) {
    counters.forEach(function (el) {
      var target = parseInt(el.getAttribute('data-target'), 10);
      var steps  = 50;
      var step   = Math.ceil(target / steps);
      var current = 0;
      var timer = setInterval(function () {
        current += step;
        if (current >= target) { current = target; clearInterval(timer); }
        el.textContent = current.toLocaleString('el-GR');
      }, 35);
    });
  }

  // ── Recent Reports (index.html) ─────────────────────────────
  var recentGrid = document.getElementById('recentReports');
  if (recentGrid) {
    try {
      var reports = JSON.parse(localStorage.getItem('ecocity_reports') || '[]');
      var recent  = reports.slice(0, 3);

      if (recent.length === 0) {
        recentGrid.innerHTML =
          '<p style="text-align:center;color:var(--text-mid);padding:40px 0;grid-column:1/-1;">' +
          'Δεν υπάρχουν αναφορές ακόμα. ' +
          '<a href="html/auth.html" style="color:var(--primary);font-weight:600;">Πρόσθεσε την πρώτη →</a></p>';
      } else {
        recentGrid.innerHTML = recent.map(function (r) {
          return '<div class="report-card">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
              '<span style="font-size:.8rem;color:var(--text-mid);">' + escHtml(r.category) + '</span>' +
              '<span class="badge-' + (r.severity || 'low') + '">' + sevLabel(r.severity) + '</span>' +
            '</div>' +
            '<h4 style="margin:0 0 6px;font-size:1rem;">' + escHtml(r.title) + '</h4>' +
            '<p style="margin:0 0 10px;font-size:.875rem;color:var(--text-mid);">📍 ' + escHtml(r.municipality) + '</p>' +
            '<div style="display:flex;justify-content:space-between;align-items:center;">' +
              '<span class="badge-' + (r.status || 'pending') + '">' + statusLabel(r.status) + '</span>' +
              '<span style="font-size:.8rem;color:var(--text-light);">' + formatDate(r.createdAt) + '</span>' +
            '</div>' +
          '</div>';
        }).join('');
      }
    } catch (e) {}
  }

  // ── Helpers ──────────────────────────────────────────────────
  function escHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function sevLabel(s) {
    return { low: '🟢 Χαμηλό', medium: '🟡 Μέτριο', critical: '🔴 Κρίσιμο' }[s] || '🟢 Χαμηλό';
  }
  function statusLabel(s) {
    return { pending: '⏳ Εκκρεμεί', reviewed: '🔵 Υπό εξέταση', resolved: '✅ Επιλύθηκε' }[s] || '⏳ Εκκρεμεί';
  }
  function formatDate(dt) {
    if (!dt) return '';
    try { return new Date(dt).toLocaleDateString('el-GR'); } catch (e) { return ''; }
  }

})();
