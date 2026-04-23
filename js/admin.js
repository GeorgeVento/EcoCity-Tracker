/* js/admin.js — Superadmin Panel: full management of reports, users, municipalities, officials */
'use strict';

var API  = '/api/admin';
var token = '';

var allReports       = [];
var allUsers         = [];
var allMunicipalities = [];
var allOfficials     = [];

var repSearch  = '';
var usrSearch  = '';
var muniSearch = '';
var offSearch  = '';
var repMuni    = 'all';
var repStatus  = 'all';

// ════════════════════════════════════════════════════════════════
// BOOT
// ════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function () {
  // Auth guard
  var stored = null;
  try { stored = JSON.parse(localStorage.getItem('ecocity_admin') || 'null'); } catch (e) {}
  if (!stored || !stored.token) {
    window.location.replace('admin-login.html');
    return;
  }
  token = stored.token;

  var udisp = document.getElementById('adminUsernameDisplay');
  if (udisp) udisp.textContent = stored.username || 'superadmin';

  // Logout buttons
  ['topLogout', 'sidebarLogout'].forEach(function (id) {
    var btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', logout);
  });

  // Sidebar nav
  document.querySelectorAll('.ap-nav-item[data-panel]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      switchPanel(this.dataset.panel);
    });
  });

  // Close modals
  document.querySelectorAll('[data-close]').forEach(function (el) {
    el.addEventListener('click', function () { closeModal(this.dataset.close); });
  });
  document.querySelectorAll('.ap-modal-overlay').forEach(function (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === this) closeModal(this.id);
    });
  });

  // Search inputs
  document.getElementById('repSearch').addEventListener('input', function () { repSearch = this.value.toLowerCase(); renderReports(); });
  document.getElementById('usrSearch').addEventListener('input', function () { usrSearch = this.value.toLowerCase(); renderUsers(); });
  document.getElementById('muniSearch').addEventListener('input', function () { muniSearch = this.value.toLowerCase(); renderMunis(); });
  document.getElementById('offSearch').addEventListener('input', function () { offSearch = this.value.toLowerCase(); renderOfficials(); });

  // Report filters
  document.getElementById('repMuniFilter').addEventListener('change', function () { repMuni = this.value; renderReports(); });
  document.getElementById('repStatusFilter').addEventListener('change', function () { repStatus = this.value; renderReports(); });

  // Add buttons
  document.getElementById('btnAddUser').addEventListener('click', openAddUser);
  document.getElementById('btnAddMuni').addEventListener('click', openAddMuni);
  document.getElementById('btnAddOfficial').addEventListener('click', openAddOfficial);

  // Save buttons
  document.getElementById('modalUserSave').addEventListener('click', saveUser);
  document.getElementById('modalMuniSave').addEventListener('click', saveMuni);
  document.getElementById('modalOfficialSave').addEventListener('click', saveOfficial);

  // Export
  document.getElementById('exportBtn').addEventListener('click', doExport);

  // Dashboard refresh
  document.getElementById('btnRefreshDash').addEventListener('click', loadDashboard);

  // Initial load
  loadDashboard();
  loadMunicipalities(); // needed for dropdowns too
});

// ════════════════════════════════════════════════════════════════
// NAVIGATION
// ════════════════════════════════════════════════════════════════
function switchPanel(name) {
  document.querySelectorAll('.ap-panel').forEach(function (p) { p.classList.remove('active'); });
  document.querySelectorAll('.ap-nav-item').forEach(function (b) { b.classList.remove('active'); });

  var panel = document.getElementById('panel' + name.charAt(0).toUpperCase() + name.slice(1));
  if (panel) panel.classList.add('active');

  var btn = document.querySelector('.ap-nav-item[data-panel="' + name + '"]');
  if (btn) btn.classList.add('active');

  if (name === 'dashboard')      loadDashboard();
  if (name === 'reports')        loadReports();
  if (name === 'users')          loadUsers();
  if (name === 'municipalities') loadMunicipalities();
  if (name === 'officials')      loadOfficials();
  if (name === 'export')         populateExportDropdown();
}

function logout() {
  try { localStorage.removeItem('ecocity_admin'); } catch (e) {}
  window.location.href = 'admin-login.html';
}

// ════════════════════════════════════════════════════════════════
// API HELPER
// ════════════════════════════════════════════════════════════════
function apiFetch(path, opts) {
  opts = opts || {};
  opts.headers = Object.assign({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, opts.headers || {});
  return fetch(API + path, opts).then(function (r) {
    if (r.status === 401) { logout(); throw new Error('Session expired.'); }
    return r.json();
  });
}

// ════════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════════
function loadDashboard() {
  apiFetch('/stats')
    .then(function (d) {
      if (!d.success) return;
      document.getElementById('dTotal').textContent    = d.reports;
      document.getElementById('dPending').textContent  = d.pending;
      document.getElementById('dCritical').textContent = d.critical;
      document.getElementById('dUsers').textContent    = d.users;
      document.getElementById('dMunis').textContent    = d.municipalities;
      document.getElementById('dOfficials').textContent = d.officials;
      var badge = document.getElementById('pendingBadge');
      if (badge) { badge.textContent = d.pending; badge.style.display = d.pending > 0 ? 'inline' : 'none'; }
    })
    .catch(function () {});
}

// ════════════════════════════════════════════════════════════════
// REPORTS
// ════════════════════════════════════════════════════════════════
function loadReports() {
  setTBody('repTableBody', 8, '⏳ Loading…');
  apiFetch('/reports')
    .then(function (d) {
      if (!d.success) { setTBody('repTableBody', 8, '⚠️ Failed to load reports.'); return; }
      allReports = d.reports || [];
      populateMuniFilter('repMuniFilter', allReports.map(function (r) { return r.municipality; }));
      renderReports();
    })
    .catch(function () { setTBody('repTableBody', 8, '⚠️ Server error.'); });
}

function renderReports() {
  var data = allReports.filter(function (r) {
    var muniOk   = repMuni   === 'all' || r.municipality === repMuni;
    var statOk   = repStatus === 'all' || r.status === repStatus;
    var searchOk = !repSearch || (r.title || '').toLowerCase().includes(repSearch) || (r.category || '').toLowerCase().includes(repSearch);
    return muniOk && statOk && searchOk;
  });

  if (data.length === 0) { setTBody('repTableBody', 8, 'No reports found.'); return; }

  document.getElementById('repTableBody').innerHTML = data.map(function (r) {
    var shortId = String(r.id || '').substr(-6).toUpperCase();
    return '<tr>' +
      '<td><code style="font-size:.78rem;color:var(--text-mid);">' + esc(shortId) + '</code></td>' +
      '<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(r.title) + '</td>' +
      '<td>' + esc(r.municipality) + '</td>' +
      '<td style="font-size:.82rem;">' + esc(r.category) + '</td>' +
      '<td>' + sevBadge(r.severity) + '</td>' +
      '<td style="white-space:nowrap;">' + fmtDate(r.created_at) + '</td>' +
      '<td>' +
        '<select class="status-sel" onchange="updateReportStatus(\'' + r.id + '\',this.value)">' +
          '<option value="pending"'  + (r.status==='pending'  ? ' selected':'') + '>⏳ Pending</option>' +
          '<option value="reviewed"' + (r.status==='reviewed' ? ' selected':'') + '>🔵 Reviewed</option>' +
          '<option value="resolved"' + (r.status==='resolved' ? ' selected':'') + '>✅ Resolved</option>' +
        '</select>' +
      '</td>' +
      '<td style="white-space:nowrap;">' +
        '<button class="ap-btn ap-btn-view" onclick="viewReport(\'' + r.id + '\')" style="margin-right:4px;">👁</button>' +
        '<button class="ap-btn ap-btn-delete" onclick="deleteReport(\'' + r.id + '\')">🗑</button>' +
      '</td>' +
    '</tr>';
  }).join('');
}

window.updateReportStatus = function (id, status) {
  apiFetch('/reports/' + id, { method: 'PUT', body: JSON.stringify({ status: status }) })
    .then(function (d) {
      if (d.success) {
        var r = allReports.find(function (x) { return x.id == id; });
        if (r) r.status = status;
        showToast('Status updated.', 'success');
        loadDashboard();
      } else { showToast(d.message || 'Error.', 'error'); }
    })
    .catch(function () { showToast('Server error.', 'error'); });
};

window.viewReport = function (id) {
  var r = allReports.find(function (x) { return x.id == id; });
  if (!r) return;
  document.getElementById('modalReportTitle').textContent = 'Report #' + String(r.id).substr(-6).toUpperCase();
  document.getElementById('modalReportBody').innerHTML =
    '<div class="report-detail">' +
      dRow('Title', r.title) +
      dRow('Municipality', r.municipality) +
      dRow('Category', r.category) +
      dRow('Severity', { low:'🟢 Low', medium:'🟡 Medium', critical:'🔴 Critical' }[r.severity] || r.severity) +
      dRow('Status', { pending:'⏳ Pending', reviewed:'🔵 Reviewed', resolved:'✅ Resolved' }[r.status] || r.status) +
      dRow('Date', fmtDate(r.created_at)) +
      dRow('Reporter', r.reporter_name || '—') +
      dRow('Email', r.reporter_email || '—') +
      dRow('GPS', r.gps_lat ? r.gps_lat + ', ' + r.gps_lng : '—') +
      '<div class="lbl" style="padding-top:8px;">Description</div>' +
      '<div class="val" style="padding-top:8px;white-space:pre-wrap;">' + esc(r.description) + '</div>' +
    '</div>' +
    (r.photo_path ? '<img src="' + esc(r.photo_path) + '" style="max-width:100%;border-radius:8px;margin-top:16px;" />' : '');
  openModal('modalReport');
};

window.deleteReport = function (id) {
  confirmAction('Delete report #' + String(id).substr(-6).toUpperCase() + '?', 'This cannot be undone.', function () {
    apiFetch('/reports/' + id, { method: 'DELETE' })
      .then(function (d) {
        if (d.success) {
          allReports = allReports.filter(function (r) { return r.id != id; });
          renderReports();
          showToast('Report deleted.', 'success');
          loadDashboard();
        } else { showToast(d.message || 'Error.', 'error'); }
      })
      .catch(function () { showToast('Server error.', 'error'); });
  });
};

// ════════════════════════════════════════════════════════════════
// USERS
// ════════════════════════════════════════════════════════════════
function loadUsers() {
  setTBody('usrTableBody', 8, '⏳ Loading…');
  apiFetch('/users')
    .then(function (d) {
      if (!d.success) { setTBody('usrTableBody', 8, '⚠️ Failed to load users.'); return; }
      allUsers = d.users || [];
      renderUsers();
    })
    .catch(function () { setTBody('usrTableBody', 8, '⚠️ Server error.'); });
}

function renderUsers() {
  var data = allUsers.filter(function (u) {
    return !usrSearch ||
      (u.full_name || '').toLowerCase().includes(usrSearch) ||
      (u.username  || '').toLowerCase().includes(usrSearch) ||
      (u.email     || '').toLowerCase().includes(usrSearch);
  });

  if (data.length === 0) { setTBody('usrTableBody', 8, 'No users found.'); return; }

  document.getElementById('usrTableBody').innerHTML = data.map(function (u) {
    return '<tr>' +
      '<td style="color:var(--text-mid);font-size:.8rem;">' + u.id + '</td>' +
      '<td><strong>' + esc(u.full_name) + '</strong></td>' +
      '<td><code style="font-size:.82rem;">' + esc(u.username) + '</code></td>' +
      '<td style="font-size:.82rem;">' + esc(u.email) + '</td>' +
      '<td>' + esc(u.home_municipality || '—') + '</td>' +
      '<td>' + (u.is_verified ? '<span class="tag-verified">✓ Verified</span>' : '<span class="tag-unverified">Unverified</span>') + '</td>' +
      '<td style="white-space:nowrap;font-size:.8rem;">' + fmtDate(u.registered_at) + '</td>' +
      '<td style="white-space:nowrap;">' +
        '<button class="ap-btn ap-btn-edit" onclick="editUser(' + u.id + ')" style="margin-right:4px;">✏️ Edit</button>' +
        '<button class="ap-btn ap-btn-delete" onclick="deleteUser(' + u.id + ')">🗑</button>' +
      '</td>' +
    '</tr>';
  }).join('');
}

function openAddUser() {
  document.getElementById('modalUserTitle').textContent = 'Add User';
  document.getElementById('modalUserId').value  = '';
  document.getElementById('uFullName').value    = '';
  document.getElementById('uUsername').value    = '';
  document.getElementById('uEmail').value       = '';
  document.getElementById('uPassword').value    = '';
  document.getElementById('uVerified').checked  = false;
  document.getElementById('uPassReq').style.display  = 'inline';
  document.getElementById('uPassHint').textContent   = '';
  document.getElementById('uEmail').disabled = false;
  populateMuniSelect('uMunicipality', null);
  clearModalError('modalUserError');
  openModal('modalUser');
}

window.editUser = function (id) {
  var u = allUsers.find(function (x) { return x.id === id; });
  if (!u) return;
  document.getElementById('modalUserTitle').textContent = 'Edit User';
  document.getElementById('modalUserId').value   = u.id;
  document.getElementById('uFullName').value     = u.full_name || '';
  document.getElementById('uUsername').value     = u.username  || '';
  document.getElementById('uEmail').value        = u.email     || '';
  document.getElementById('uPassword').value     = '';
  document.getElementById('uVerified').checked   = !!u.is_verified;
  document.getElementById('uPassReq').style.display  = 'none';
  document.getElementById('uPassHint').textContent   = 'Leave blank to keep current password.';
  populateMuniSelect('uMunicipality', u.home_municipality);
  var emailField = document.getElementById('uEmail');
  emailField.disabled = true;
  clearModalError('modalUserError');
  openModal('modalUser');
};

function saveUser() {
  clearModalError('modalUserError');
  var id           = document.getElementById('modalUserId').value;
  var fullName     = document.getElementById('uFullName').value.trim();
  var username     = document.getElementById('uUsername').value.trim();
  var email        = document.getElementById('uEmail').value.trim().toLowerCase();
  var password     = document.getElementById('uPassword').value;
  var isVerified   = document.getElementById('uVerified').checked;
  var municipality = document.getElementById('uMunicipality').value;

  if (!fullName || !username) { showModalError('modalUserError', 'Full name and username are required.'); return; }
  if (!id && (!email || !password)) { showModalError('modalUserError', 'Email and password are required for new users.'); return; }

  var body = { fullName: fullName, username: username, homeMunicipality: municipality, isVerified: isVerified };
  if (!id) { body.email = email; body.password = password; }
  else if (password) { body.password = password; }

  var method = id ? 'PUT' : 'POST';
  var path   = id ? '/users/' + id : '/users';

  document.getElementById('modalUserSave').disabled = true;
  apiFetch(path, { method: method, body: JSON.stringify(body) })
    .then(function (d) {
      document.getElementById('modalUserSave').disabled = false;
      if (d.success) {
        closeModal('modalUser');
        loadUsers();
        showToast(id ? 'User updated.' : 'User created.', 'success');
      } else { showModalError('modalUserError', d.message || 'Error.'); }
    })
    .catch(function () { document.getElementById('modalUserSave').disabled = false; showModalError('modalUserError', 'Server error.'); });
}

window.deleteUser = function (id) {
  var u = allUsers.find(function (x) { return x.id === id; });
  var name = u ? u.full_name : 'this user';
  confirmAction('Delete user "' + name + '"?', 'All their data will remain but the account will be removed.', function () {
    apiFetch('/users/' + id, { method: 'DELETE' })
      .then(function (d) {
        if (d.success) {
          allUsers = allUsers.filter(function (x) { return x.id !== id; });
          renderUsers();
          showToast('User deleted.', 'success');
          loadDashboard();
        } else { showToast(d.message || 'Error.', 'error'); }
      })
      .catch(function () { showToast('Server error.', 'error'); });
  });
};

// ════════════════════════════════════════════════════════════════
// MUNICIPALITIES
// ════════════════════════════════════════════════════════════════
function loadMunicipalities() {
  setTBody('muniTableBody', 5, '⏳ Loading…');
  apiFetch('/municipalities')
    .then(function (d) {
      if (!d.success) { setTBody('muniTableBody', 5, '⚠️ Failed to load.'); return; }
      allMunicipalities = d.municipalities || [];
      renderMunis();
      rebuildMuniDropdowns();
    })
    .catch(function () { setTBody('muniTableBody', 5, '⚠️ Server error.'); });
}

function renderMunis() {
  var data = allMunicipalities.filter(function (m) {
    return !muniSearch || m.name.toLowerCase().includes(muniSearch);
  });

  if (data.length === 0) { setTBody('muniTableBody', 5, 'No municipalities found.'); return; }

  document.getElementById('muniTableBody').innerHTML = data.map(function (m) {
    return '<tr>' +
      '<td style="color:var(--text-mid);font-size:.8rem;">' + m.id + '</td>' +
      '<td><strong>' + esc(m.name) + '</strong></td>' +
      '<td>' + (m.report_count || 0) + '</td>' +
      '<td>' + (m.official_count || 0) + '</td>' +
      '<td style="white-space:nowrap;">' +
        '<button class="ap-btn ap-btn-edit" onclick="editMuni(' + m.id + ',\'' + esc(m.name) + '\')" style="margin-right:4px;">✏️ Edit</button>' +
        '<button class="ap-btn ap-btn-delete" onclick="deleteMuni(' + m.id + ',\'' + esc(m.name) + '\')">🗑</button>' +
      '</td>' +
    '</tr>';
  }).join('');
}

function openAddMuni() {
  document.getElementById('modalMuniTitle').textContent = 'Add Municipality';
  document.getElementById('modalMuniId').value  = '';
  document.getElementById('muniName').value     = '';
  clearModalError('modalMuniError');
  openModal('modalMuni');
}

window.editMuni = function (id, name) {
  document.getElementById('modalMuniTitle').textContent = 'Edit Municipality';
  document.getElementById('modalMuniId').value  = id;
  document.getElementById('muniName').value     = name;
  clearModalError('modalMuniError');
  openModal('modalMuni');
};

function saveMuni() {
  clearModalError('modalMuniError');
  var id   = document.getElementById('modalMuniId').value;
  var name = document.getElementById('muniName').value.trim();
  if (!name) { showModalError('modalMuniError', 'Municipality name is required.'); return; }

  var method = id ? 'PUT' : 'POST';
  var path   = id ? '/municipalities/' + id : '/municipalities';

  document.getElementById('modalMuniSave').disabled = true;
  apiFetch(path, { method: method, body: JSON.stringify({ name: name }) })
    .then(function (d) {
      document.getElementById('modalMuniSave').disabled = false;
      if (d.success) {
        closeModal('modalMuni');
        loadMunicipalities();
        showToast(id ? 'Municipality updated.' : 'Municipality added.', 'success');
      } else { showModalError('modalMuniError', d.message || 'Error.'); }
    })
    .catch(function () { document.getElementById('modalMuniSave').disabled = false; showModalError('modalMuniError', 'Server error.'); });
}

window.deleteMuni = function (id, name) {
  confirmAction('Delete municipality "' + name + '"?', 'Officials assigned to this municipality will remain but lose their assignment.', function () {
    apiFetch('/municipalities/' + id, { method: 'DELETE' })
      .then(function (d) {
        if (d.success) {
          allMunicipalities = allMunicipalities.filter(function (m) { return m.id !== id; });
          renderMunis();
          rebuildMuniDropdowns();
          showToast('Municipality deleted.', 'success');
          loadDashboard();
        } else { showToast(d.message || 'Error.', 'error'); }
      })
      .catch(function () { showToast('Server error.', 'error'); });
  });
};

function rebuildMuniDropdowns() {
  var names = allMunicipalities.map(function (m) { return m.name; });
  populateMuniSelect('uMunicipality', null, names);
  populateMuniSelect('oMunicipality', null, names);
}

// ════════════════════════════════════════════════════════════════
// OFFICIALS
// ════════════════════════════════════════════════════════════════
function loadOfficials() {
  setTBody('offTableBody', 7, '⏳ Loading…');
  apiFetch('/officials')
    .then(function (d) {
      if (!d.success) { setTBody('offTableBody', 7, '⚠️ Failed to load.'); return; }
      allOfficials = d.officials || [];
      renderOfficials();
    })
    .catch(function () { setTBody('offTableBody', 7, '⚠️ Server error.'); });
}

function renderOfficials() {
  var data = allOfficials.filter(function (o) {
    return !offSearch ||
      (o.full_name    || '').toLowerCase().includes(offSearch) ||
      (o.username     || '').toLowerCase().includes(offSearch) ||
      (o.municipality || '').toLowerCase().includes(offSearch);
  });

  if (data.length === 0) { setTBody('offTableBody', 7, 'No officials found.'); return; }

  document.getElementById('offTableBody').innerHTML = data.map(function (o) {
    return '<tr>' +
      '<td style="color:var(--text-mid);font-size:.8rem;">' + o.id + '</td>' +
      '<td><code style="font-size:.82rem;">' + esc(o.username) + '</code></td>' +
      '<td><strong>' + esc(o.full_name) + '</strong></td>' +
      '<td>' + esc(o.municipality) + '</td>' +
      '<td>' + (o.is_active ? '<span class="tag-active">✓ Active</span>' : '<span class="tag-inactive">Inactive</span>') + '</td>' +
      '<td style="white-space:nowrap;font-size:.8rem;">' + fmtDate(o.created_at) + '</td>' +
      '<td style="white-space:nowrap;">' +
        '<button class="ap-btn ap-btn-edit" onclick="editOfficial(' + o.id + ')" style="margin-right:4px;">✏️ Edit</button>' +
        '<button class="ap-btn ap-btn-delete" onclick="deleteOfficial(' + o.id + ')">🗑</button>' +
      '</td>' +
    '</tr>';
  }).join('');
}

function openAddOfficial() {
  document.getElementById('modalOfficialTitle').textContent = 'Add Official';
  document.getElementById('modalOfficialId').value = '';
  document.getElementById('oFullName').value  = '';
  document.getElementById('oUsername').value  = '';
  document.getElementById('oPassword').value  = '';
  document.getElementById('oActive').checked  = true;
  document.getElementById('oPassReq').style.display  = 'inline';
  document.getElementById('oPassHint').textContent   = '';
  populateMuniSelect('oMunicipality', null);
  clearModalError('modalOfficialError');
  openModal('modalOfficial');
}

window.editOfficial = function (id) {
  var o = allOfficials.find(function (x) { return x.id === id; });
  if (!o) return;
  document.getElementById('modalOfficialTitle').textContent = 'Edit Official';
  document.getElementById('modalOfficialId').value = o.id;
  document.getElementById('oFullName').value  = o.full_name    || '';
  document.getElementById('oUsername').value  = o.username     || '';
  document.getElementById('oPassword').value  = '';
  document.getElementById('oActive').checked  = !!o.is_active;
  document.getElementById('oPassReq').style.display  = 'none';
  document.getElementById('oPassHint').textContent   = 'Leave blank to keep current password.';
  populateMuniSelect('oMunicipality', o.municipality);
  clearModalError('modalOfficialError');
  openModal('modalOfficial');
};

function saveOfficial() {
  clearModalError('modalOfficialError');
  var id           = document.getElementById('modalOfficialId').value;
  var fullName     = document.getElementById('oFullName').value.trim();
  var username     = document.getElementById('oUsername').value.trim();
  var password     = document.getElementById('oPassword').value;
  var municipality = document.getElementById('oMunicipality').value;
  var isActive     = document.getElementById('oActive').checked;

  if (!fullName || !username || !municipality) { showModalError('modalOfficialError', 'Full name, username and municipality are required.'); return; }
  if (!id && !password) { showModalError('modalOfficialError', 'Password is required for new officials.'); return; }

  var body = { fullName: fullName, username: username, municipality: municipality, isActive: isActive };
  if (password) body.password = password;

  var method = id ? 'PUT' : 'POST';
  var path   = id ? '/officials/' + id : '/officials';

  document.getElementById('modalOfficialSave').disabled = true;
  apiFetch(path, { method: method, body: JSON.stringify(body) })
    .then(function (d) {
      document.getElementById('modalOfficialSave').disabled = false;
      if (d.success) {
        closeModal('modalOfficial');
        loadOfficials();
        showToast(id ? 'Official updated.' : 'Official created.', 'success');
        loadDashboard();
      } else { showModalError('modalOfficialError', d.message || 'Error.'); }
    })
    .catch(function () { document.getElementById('modalOfficialSave').disabled = false; showModalError('modalOfficialError', 'Server error.'); });
}

window.deleteOfficial = function (id) {
  var o = allOfficials.find(function (x) { return x.id === id; });
  var name = o ? o.full_name : 'this official';
  confirmAction('Delete official "' + name + '"?', 'This action cannot be undone.', function () {
    apiFetch('/officials/' + id, { method: 'DELETE' })
      .then(function (d) {
        if (d.success) {
          allOfficials = allOfficials.filter(function (x) { return x.id !== id; });
          renderOfficials();
          showToast('Official deleted.', 'success');
          loadDashboard();
        } else { showToast(d.message || 'Error.', 'error'); }
      })
      .catch(function () { showToast('Server error.', 'error'); });
  });
};

// ════════════════════════════════════════════════════════════════
// EXPORT
// ════════════════════════════════════════════════════════════════
function populateExportDropdown() {
  var sel = document.getElementById('expMuni');
  sel.innerHTML = '<option value="all">All Municipalities</option>';
  allMunicipalities.forEach(function (m) {
    sel.innerHTML += '<option value="' + esc(m.name) + '">' + esc(m.name) + '</option>';
  });
}

function doExport() {
  var muni   = document.getElementById('expMuni').value;
  var status = document.getElementById('expStatus').value;

  var params = [];
  if (muni   !== 'all') params.push('municipality=' + encodeURIComponent(muni));
  if (status !== 'all') params.push('status='       + encodeURIComponent(status));

  apiFetch('/reports' + (params.length ? '?' + params.join('&') : ''))
    .then(function (d) {
      if (!d.success || !d.reports || d.reports.length === 0) {
        showToast('No data to export.', 'error'); return;
      }
      var headers = ['ID','Title','Municipality','Category','Severity','Status','Date','Description','Reporter','Email','GPS Lat','GPS Lng'];
      var rows = d.reports.map(function (r) {
        return [r.id, r.title, r.municipality, r.category, r.severity, r.status,
          fmtDate(r.created_at), r.description, r.reporter_name, r.reporter_email, r.gps_lat, r.gps_lng]
          .map(function (v) { return '"' + String(v || '').replace(/"/g, '""') + '"'; }).join(',');
      });
      var csv  = '﻿' + headers.join(',') + '\r\n' + rows.join('\r\n');
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      var url  = URL.createObjectURL(blob);
      var a    = document.createElement('a');
      a.href = url; a.download = 'ecocity_export_' + new Date().toISOString().slice(0,10) + '.csv';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      showToast('Export complete (' + d.reports.length + ' reports).', 'success');
    })
    .catch(function () { showToast('Export failed.', 'error'); });
}

// ════════════════════════════════════════════════════════════════
// MODAL HELPERS
// ════════════════════════════════════════════════════════════════
function openModal(id) {
  var el = document.getElementById(id);
  if (el) el.classList.add('open');
}
function closeModal(id) {
  var el = document.getElementById(id);
  if (el) el.classList.remove('open');
}
function showModalError(id, msg) {
  var el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}
function clearModalError(id) {
  var el = document.getElementById(id);
  if (el) { el.textContent = ''; el.style.display = 'none'; }
}

var _confirmCallback = null;
function confirmAction(title, message, callback) {
  document.getElementById('confirmTitle').textContent   = title;
  document.getElementById('confirmMessage').textContent = message;
  _confirmCallback = callback;
  openModal('modalConfirm');
}
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('confirmOk').addEventListener('click', function () {
    closeModal('modalConfirm');
    if (typeof _confirmCallback === 'function') _confirmCallback();
    _confirmCallback = null;
  });
});

// ════════════════════════════════════════════════════════════════
// DROPDOWN HELPERS
// ════════════════════════════════════════════════════════════════
function populateMuniSelect(selectId, selected, names) {
  var sel = document.getElementById(selectId);
  if (!sel) return;
  var list = names || allMunicipalities.map(function (m) { return m.name; });
  sel.innerHTML = '<option value="">— Select —</option>';
  list.forEach(function (n) {
    sel.innerHTML += '<option value="' + esc(n) + '"' + (n === selected ? ' selected' : '') + '>' + esc(n) + '</option>';
  });
}

function populateMuniFilter(selectId, muniList) {
  var sel = document.getElementById(selectId);
  if (!sel) return;
  var unique = [];
  muniList.forEach(function (m) { if (m && !unique.includes(m)) unique.push(m); });
  unique.sort();
  var cur = sel.value;
  sel.innerHTML = '<option value="all">All Municipalities</option>';
  unique.forEach(function (m) {
    sel.innerHTML += '<option value="' + esc(m) + '"' + (m === cur ? ' selected' : '') + '>' + esc(m) + '</option>';
  });
}

// ════════════════════════════════════════════════════════════════
// TOAST
// ════════════════════════════════════════════════════════════════
function showToast(msg, type) {
  var container = document.getElementById('toastContainer');
  if (!container) return;
  var t = document.createElement('div');
  t.className = 'toast toast-' + (type || 'success');
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3500);
}

// ════════════════════════════════════════════════════════════════
// UTILITY HELPERS
// ════════════════════════════════════════════════════════════════
function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtDate(dt) {
  if (!dt) return '—';
  try { return new Date(dt).toLocaleDateString('en-GB'); } catch (e) { return '—'; }
}

function sevBadge(s) {
  var map = { low:'<span class="badge-low">🟢 Low</span>', medium:'<span class="badge-medium">🟡 Medium</span>', critical:'<span class="badge-critical">🔴 Critical</span>' };
  return map[s] || esc(s);
}

function dRow(label, value) {
  return '<div class="lbl">' + label + '</div><div class="val">' + esc(String(value || '—')) + '</div>';
}

function setTBody(id, cols, msg) {
  var tbody = document.getElementById(id);
  if (tbody) tbody.innerHTML = '<tr class="empty-row"><td colspan="' + cols + '">' + msg + '</td></tr>';
}
