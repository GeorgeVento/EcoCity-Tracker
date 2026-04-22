/* js/main.js — Shared utilities: nav toggle, counters, recent reports */

/* ── Shared Nav User Init ────────────────────────────────────── */
window.initNavUser = function () {
  var user = null, official = null;
  try { user     = JSON.parse(localStorage.getItem('ecocity_user')     || 'null'); } catch (e) {}
  try { official = JSON.parse(localStorage.getItem('ecocity_official') || 'null'); } catch (e) {}

  var navLoginMenu = document.getElementById('navLoginMenu');
  var navUserMenu  = document.getElementById('navUserMenu');
  var navUserBtn   = document.getElementById('navUserBtn');
  var navUserName  = document.getElementById('navUserName');
  var navDropdown  = document.getElementById('navDropdown');

  if (user || official) {
    if (navLoginMenu) navLoginMenu.style.display = 'none';
    if (navUserMenu) {
      navUserMenu.style.display = 'flex';
      var cu = user || official;
      if (navUserName) navUserName.textContent = (cu.fullName || cu.username || 'Χρήστης') + (official ? ' (Αρμόδιος)' : '');
      var infoName  = document.getElementById('navInfoName');
      var infoEmail = document.getElementById('navInfoEmail');
      if (infoName)  infoName.textContent  = cu.fullName || cu.username || 'Χρήστης';
      if (infoEmail) infoEmail.textContent = cu.email || '';
      var navReports   = document.getElementById('navReports');
      var navDashboard = document.getElementById('navDashboard');
      if (navReports)   navReports.style.display   = user     ? 'block' : 'none';
      if (navDashboard) navDashboard.style.display = official ? 'block' : 'none';
      if (navUserBtn && navDropdown) {
        navUserBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          navDropdown.style.display = navDropdown.style.display === 'block' ? 'none' : 'block';
        });
      }
      document.addEventListener('click', function (e) {
        if (navUserMenu && !navUserMenu.contains(e.target) && navDropdown) {
          navDropdown.style.display = 'none';
        }
      });
      var navLogout = document.getElementById('navLogout');
      if (navLogout) navLogout.addEventListener('click', function (e) {
        e.preventDefault();
        try { localStorage.removeItem('ecocity_user'); localStorage.removeItem('ecocity_official'); } catch (e2) {}
        location.reload();
      });
    }
  } else {
    if (navUserMenu)  navUserMenu.style.display = 'none';
    if (navLoginMenu) {
      navLoginMenu.style.display = 'flex';
      var nlBtn  = document.getElementById('navLoginBtn');
      var nlDrop = document.getElementById('navLoginDropdown');
      if (nlBtn && nlDrop) {
        nlBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          var open = nlDrop.style.display === 'block';
          nlDrop.style.display = open ? 'none' : 'block';
          navLoginMenu.classList.toggle('open', !open);
        });
        document.addEventListener('click', function (e) {
          if (!navLoginMenu.contains(e.target)) {
            nlDrop.style.display = 'none';
            navLoginMenu.classList.remove('open');
          }
        });
      }
    }
  }
};

(function () {
  'use strict';

  // ── Guard: New Report → login required ───────────────────────
  document.querySelectorAll('a[href="html/report.html"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var user = null;
      try { user = JSON.parse(localStorage.getItem('ecocity_user') || 'null'); } catch (_) {}
      if (!user) {
        e.preventDefault();
        window.location.href = 'html/auth.html';
      }
    });
  });

  // ── Mobile Nav Toggle ────────────────────────────────────────
  var toggle   = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  if (toggle && navLinks && !toggle.dataset.bound) {
    toggle.dataset.bound = '1';
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

  // ── Init Nav User ────────────────────────────────────────────
  if (typeof window.initNavUser === 'function') window.initNavUser();

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
