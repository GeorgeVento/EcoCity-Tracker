/* js/admin.js — Admin Panel: πίνακας αναφορών, φίλτρα, export CSV */
(function () {
  'use strict';

  // ── Nav Toggle ───────────────────────────────────────────────
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

  // ── Utilities ────────────────────────────────────────────────
  function showToast(msg, type) {
    var c = document.getElementById('toastContainer');
    if (!c) return;
    var t = document.createElement('div');
    t.className = 'toast toast-' + (type || 'success');
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3500);
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function formatDate(dt) {
    if (!dt) return '—';
    try { return new Date(dt).toLocaleDateString('el-GR'); } catch (e) { return '—'; }
  }

  function sevBadge(s) {
    return { low:'<span class="badge-low">🟢 Χαμηλό</span>', medium:'<span class="badge-medium">🟡 Μέτριο</span>', critical:'<span class="badge-critical">🔴 Κρίσιμο</span>' }[s] || escHtml(s);
  }

  // ── State ────────────────────────────────────────────────────
  var allReports  = [];
  var filterMode  = 'all';   // all | pending | critical
  var statusFilt  = '';
  var searchTerm  = '';
  var currentMuni = 'all';

  // ── Load data ────────────────────────────────────────────────
  function load() {
    try { allReports = JSON.parse(localStorage.getItem('ecocity_reports') || '[]'); } catch (e) { allReports = []; }
    renderStats();
    renderTable();

    fetch('/api/reports')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.reports && d.reports.length > 0) {
          allReports = d.reports;
          renderStats();
          renderTable();
        }
      })
      .catch(function () {});
  }

  // ── Filtered data ────────────────────────────────────────────
  function getFiltered() {
    return allReports.filter(function (r) {
      var muniOk   = currentMuni === 'all' || r.municipality === currentMuni;
      var modeOk   = filterMode === 'all'  || (filterMode === 'pending'  && r.status === 'pending') || (filterMode === 'critical' && r.severity === 'critical');
      var statOk   = !statusFilt || r.status === statusFilt;
      var searchOk = !searchTerm || (r.title || '').toLowerCase().includes(searchTerm) || (r.category || '').toLowerCase().includes(searchTerm);
      return muniOk && modeOk && statOk && searchOk;
    });
  }

  // ── Render mini stats ────────────────────────────────────────
  function renderStats() {
    var base    = currentMuni === 'all' ? allReports : allReports.filter(function(r){ return r.municipality === currentMuni; });
    var total   = base.length;
    var pending = base.filter(function(r){ return r.status === 'pending'; }).length;
    var res     = base.filter(function(r){ return r.status === 'resolved'; }).length;
    var crit    = base.filter(function(r){ return r.severity === 'critical'; }).length;

    document.getElementById('msTotalReports').textContent = total;
    document.getElementById('msPending').textContent      = pending;
    document.getElementById('msResolved').textContent     = res;
    document.getElementById('msCritical').textContent     = crit;

    var badge = document.getElementById('notifBadge');
    if (badge) { badge.textContent = pending; badge.style.display = pending > 0 ? 'inline' : 'none'; }
  }

  // ── Render table ─────────────────────────────────────────────
  function renderTable() {
    var data  = getFiltered();
    var tbody = document.getElementById('reportsTableBody');

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-light);">Δεν βρέθηκαν αναφορές.</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(function (r) {
      var shortId = String(r.id || '').substr(-6).toUpperCase() || '—';
      return '<tr>' +
        '<td><code style="font-size:.8rem;color:var(--text-mid);">' + shortId + '</code></td>' +
        '<td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escHtml(r.title) + '</td>' +
        '<td>' + escHtml(r.municipality) + '</td>' +
        '<td style="font-size:.85rem;">' + escHtml(r.category) + '</td>' +
        '<td>' + sevBadge(r.severity) + '</td>' +
        '<td>' + formatDate(r.createdAt) + '</td>' +
        '<td>' +
          '<select class="form-select" style="font-size:.8rem;padding:4px 6px;min-width:130px;" onchange="window.__adminStatus(\'' + r.id + '\',this.value)">' +
            '<option value="pending"'  + (r.status==='pending'  ?' selected':'') + '>⏳ Εκκρεμεί</option>' +
            '<option value="reviewed"' + (r.status==='reviewed' ?' selected':'') + '>🔵 Υπό εξέταση</option>' +
            '<option value="resolved"' + (r.status==='resolved' ?' selected':'') + '>✅ Επιλύθηκε</option>' +
          '</select>' +
        '</td>' +
        '<td><button class="btn btn-secondary btn-sm" onclick="window.__adminView(\'' + r.id + '\')">👁 Λεπτ.</button></td>' +
        '</tr>';
    }).join('');
  }

  // ── Update status ────────────────────────────────────────────
  window.__adminStatus = function (id, newStatus) {
    var idx = -1;
    allReports.forEach(function (r, i) { if (r.id === id) idx = i; });
    if (idx < 0) return;
    allReports[idx].status = newStatus;
    try { localStorage.setItem('ecocity_reports', JSON.stringify(allReports)); } catch (e) {}

    fetch('/api/reports/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    }).catch(function () {});

    showToast('Κατάσταση ενημερώθηκε σε: ' + newStatus, 'success');
    renderStats();
  };

  // ── View report modal ────────────────────────────────────────
  window.__adminView = function (id) {
    var r = null;
    allReports.forEach(function (rep) { if (rep.id === id) r = rep; });
    if (!r) return;

    function row(label, val) {
      return '<tr style="border-bottom:1px solid #eee;">' +
        '<td style="padding:8px 4px;font-weight:600;color:var(--primary-dark);width:38%;vertical-align:top;">' + label + '</td>' +
        '<td style="padding:8px 4px;">' + escHtml(String(val || '—')) + '</td></tr>';
    }

    var content =
      '<div style="background:#fff;border-radius:12px;padding:28px 32px;max-width:600px;width:100%;max-height:90vh;overflow-y:auto;position:relative;">' +
        '<button id="_closeModal" style="position:absolute;top:12px;right:16px;background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--text-mid);">✕</button>' +
        '<h3 style="margin:0 0 20px;padding-right:32px;font-family:var(--font-display);color:var(--primary-dark);">' + escHtml(r.title) + '</h3>' +
        '<table style="width:100%;border-collapse:collapse;font-size:.9rem;">' +
          row('Δήμος', r.municipality) +
          row('Κατηγορία', r.category) +
          row('Σοβαρότητα', { low:'Χαμηλό', medium:'Μέτριο', critical:'Κρίσιμο' }[r.severity] || r.severity) +
          row('Κατάσταση',  { pending:'Εκκρεμεί', reviewed:'Υπό εξέταση', resolved:'Επιλύθηκε' }[r.status] || r.status) +
          row('Ημερομηνία', formatDate(r.createdAt)) +
          row('GPS', r.gpsLat ? r.gpsLat + ', ' + r.gpsLng : '—') +
          row('Περιγραφή', r.description) +
          row('Όνομα', r.reporterName || '—') +
          row('Email', r.reporterEmail || '—') +
        '</table>' +
        (r.photo ? '<img src="' + r.photo + '" style="width:100%;border-radius:8px;margin-top:16px;" alt="Φωτογραφία αναφοράς" />' : '') +
      '</div>';

    var overlay = document.createElement('div');
    overlay.id  = '_adminModal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;';
    overlay.innerHTML = content;

    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    document.getElementById('_closeModal').addEventListener('click', function () { overlay.remove(); });
  };

  // ── Sidebar panel switching ──────────────────────────────────
  document.querySelectorAll('.admin-nav-item[data-panel]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.admin-nav-item').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var p = btn.getAttribute('data-panel');
      ['reports','stats','export'].forEach(function (name) {
        var el = document.getElementById('panel' + name.charAt(0).toUpperCase() + name.slice(1));
        if (el) el.style.display = name === p ? '' : 'none';
      });
    });
  });

  // ── Filter buttons ───────────────────────────────────────────
  document.getElementById('filterAll').addEventListener('click', function () {
    filterMode = 'all'; renderTable();
  });
  document.getElementById('filterPending').addEventListener('click', function () {
    filterMode = 'pending'; renderTable();
  });
  document.getElementById('filterCritical').addEventListener('click', function () {
    filterMode = 'critical'; renderTable();
  });

  document.getElementById('tableSearch').addEventListener('input', function () {
    searchTerm = this.value.toLowerCase().trim();
    renderTable();
  });

  document.getElementById('statusFilter').addEventListener('change', function () {
    statusFilt = this.value;
    renderTable();
  });

  document.getElementById('adminMuniFilter').addEventListener('change', function () {
    currentMuni = this.value;
    renderStats();
    renderTable();
  });

  // ── Export CSV ───────────────────────────────────────────────
  document.getElementById('exportBtn').addEventListener('click', function () {
    var muniVal   = document.getElementById('exportMuni').value;
    var statusVal = document.getElementById('exportStatus').value;

    var data = allReports.filter(function (r) {
      return (muniVal   === 'all' || r.municipality === muniVal) &&
             (statusVal === 'all' || r.status === statusVal);
    });

    if (data.length === 0) { showToast('Δεν υπάρχουν δεδομένα για export.', 'error'); return; }

    var hdrs = ['ID','Τίτλος','Δήμος','Κατηγορία','Σοβαρότητα','Κατάσταση','Ημερομηνία','Περιγραφή','Όνομα','Email','GPS Lat','GPS Lng'];
    var rows = data.map(function (r) {
      return [r.id, r.title, r.municipality, r.category, r.severity, r.status,
              formatDate(r.createdAt), r.description, r.reporterName, r.reporterEmail, r.gpsLat, r.gpsLng]
        .map(function (v) { return '"' + String(v || '').replace(/"/g, '""') + '"'; }).join(',');
    });

    var csv  = '\uFEFF' + hdrs.join(',') + '\n' + rows.join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href = url; a.download = 'ecocity_export.csv';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Export ολοκληρώθηκε (' + data.length + ' αναφορές).', 'success');
  });

  load();

})();
