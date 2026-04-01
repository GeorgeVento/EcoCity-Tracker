/* js/stats.js — Στατιστικά με Chart.js, φίλτρο δήμου */
(function () {
  'use strict';

  // ── Nav Toggle ───────────────────────────────────────────────
  var toggle   = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  if (toggle && navLinks) {
    toggle.addEventListener('click', function () { navLinks.classList.toggle('open'); });
    document.addEventListener('click', function (e) {
      if (!toggle.contains(e.target) && !navLinks.contains(e.target)) navLinks.classList.remove('open');
    });
  }

  // ── Sample fallback data ──────────────────────────────────────
  var SAMPLE = [
    { municipality:'Αθήνα',       category:'🗑 Σκουπίδια',           severity:'low',      status:'resolved', createdAt:'2026-01-10T10:00:00Z' },
    { municipality:'Αθήνα',       category:'🏗 Υποδομές',             severity:'medium',   status:'pending',  createdAt:'2026-01-15T10:00:00Z' },
    { municipality:'Αθήνα',       category:'💡 Φωτισμός',             severity:'low',      status:'resolved', createdAt:'2026-02-05T10:00:00Z' },
    { municipality:'Πειραιάς',    category:'🗑 Σκουπίδια',            severity:'critical', status:'resolved', createdAt:'2026-01-12T10:00:00Z' },
    { municipality:'Πειραιάς',    category:'🌊 Νερό / Αποχέτευση',   severity:'critical', status:'reviewed', createdAt:'2026-01-22T10:00:00Z' },
    { municipality:'Αιγάλεω',     category:'🔊 Ηχορύπανση',           severity:'medium',   status:'pending',  createdAt:'2026-02-01T10:00:00Z' },
    { municipality:'Αιγάλεω',     category:'🏗 Υποδομές',             severity:'low',      status:'resolved', createdAt:'2026-02-05T10:00:00Z' },
    { municipality:'Νίκαια',      category:'🗑 Σκουπίδια',            severity:'low',      status:'resolved', createdAt:'2026-02-08T10:00:00Z' },
    { municipality:'Περιστέρι',   category:'💨 Ποιότητα Αέρα',        severity:'medium',   status:'resolved', createdAt:'2026-02-10T10:00:00Z' },
    { municipality:'Χαλάνδρι',    category:'🏗 Υποδομές',             severity:'low',      status:'pending',  createdAt:'2026-02-15T10:00:00Z' },
    { municipality:'Γλυφάδα',     category:'🗑 Σκουπίδια',            severity:'low',      status:'resolved', createdAt:'2026-02-18T10:00:00Z' },
    { municipality:'Καλλιθέα',    category:'💡 Φωτισμός',             severity:'medium',   status:'resolved', createdAt:'2026-02-20T10:00:00Z' },
    { municipality:'Ηλιούπολη',   category:'🌊 Νερό / Αποχέτευση',   severity:'low',      status:'reviewed', createdAt:'2026-03-01T10:00:00Z' },
    { municipality:'Μαρούσι',     category:'🗑 Σκουπίδια',            severity:'critical', status:'resolved', createdAt:'2026-03-05T10:00:00Z' },
    { municipality:'Κηφισιά',     category:'🏥 Υγεία',                severity:'medium',   status:'resolved', createdAt:'2026-03-10T10:00:00Z' },
    { municipality:'Παλαιό Φάληρο',category:'🏗 Υποδομές',           severity:'low',      status:'pending',  createdAt:'2026-03-15T10:00:00Z' },
    { municipality:'Αθήνα',       category:'🚨 Έκτακτη Ανάγκη',      severity:'critical', status:'resolved', createdAt:'2026-03-18T10:00:00Z' },
    { municipality:'Πειραιάς',    category:'🏥 Υγεία',                severity:'medium',   status:'resolved', createdAt:'2026-03-20T10:00:00Z' },
    { municipality:'Αιγάλεω',     category:'💡 Φωτισμός',             severity:'low',      status:'pending',  createdAt:'2026-03-22T10:00:00Z' },
    { municipality:'Μαρούσι',     category:'🏗 Υποδομές',             severity:'medium',   status:'resolved', createdAt:'2026-03-25T10:00:00Z' }
  ];

  var CATEGORIES = [
    '🗑 Σκουπίδια', '🏗 Υποδομές', '🔊 Ηχορύπανση', '💨 Ποιότητα Αέρα',
    '🏥 Υγεία', '🚨 Έκτακτη Ανάγκη', '💡 Φωτισμός', '🌊 Νερό / Αποχέτευση'
  ];
  var CAT_LABELS = ['Σκουπίδια','Υποδομές','Ηχορύπανση','Ποιότητα Αέρα','Υγεία','Έκτακτη','Φωτισμός','Νερό'];

  var allReports  = [];
  var currentMuni = 'all';
  var barChart, doughnutChart, lineChart;

  // ── Load ──────────────────────────────────────────────────────
  function loadData() {
    try {
      var stored = JSON.parse(localStorage.getItem('ecocity_reports') || '[]');
      allReports = stored.length > 0 ? stored : SAMPLE;
    } catch (e) { allReports = SAMPLE; }
    render();

    fetch('/api/stats')
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.reports && d.reports.length > 0) { allReports = d.reports; render(); } })
      .catch(function () {});
  }

  function filtered() {
    if (currentMuni === 'all') return allReports;
    return allReports.filter(function (r) { return r.municipality === currentMuni; });
  }

  // ── Render ────────────────────────────────────────────────────
  function render() {
    var data     = filtered();
    var total    = data.length;
    var resolved = data.filter(function (r) { return r.status === 'resolved'; }).length;
    var pending  = data.filter(function (r) { return r.status === 'pending';  }).length;
    var rate     = total > 0 ? Math.round((resolved / total) * 100) : 0;

    document.getElementById('sumTotal').textContent    = total;
    document.getElementById('sumResolved').textContent = resolved;
    document.getElementById('sumPending').textContent  = pending;
    document.getElementById('sumRate').textContent     = rate + '%';

    buildBar(data);
    buildDoughnut(data);
    buildLine(data);
  }

  // ── Bar: αναφορές ανά κατηγορία ─────────────────────────────
  function buildBar(data) {
    var counts = CATEGORIES.map(function (cat) {
      return data.filter(function (r) { return r.category === cat; }).length;
    });
    var ctx = document.getElementById('barChart').getContext('2d');
    if (barChart) barChart.destroy();
    barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: CAT_LABELS,
        datasets: [{
          label: 'Αναφορές',
          data: counts,
          backgroundColor: 'rgba(46,125,50,.75)',
          borderColor: '#2e7d32',
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  }

  // ── Doughnut: κατανομή ανά κατάσταση ────────────────────────
  function buildDoughnut(data) {
    var pending  = data.filter(function (r) { return r.status === 'pending';  }).length;
    var reviewed = data.filter(function (r) { return r.status === 'reviewed'; }).length;
    var resolved = data.filter(function (r) { return r.status === 'resolved'; }).length;
    var ctx = document.getElementById('doughnutChart').getContext('2d');
    if (doughnutChart) doughnutChart.destroy();
    doughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Εκκρεμεί', 'Υπό εξέταση', 'Επιλύθηκε'],
        datasets: [{
          data: [pending, reviewed, resolved],
          backgroundColor: ['#f59e0b', '#3b82f6', '#22c55e'],
          borderWidth: 2
        }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
  }

  // ── Line: εβδομαδιαία τάση (τελευταίες 8 εβδομάδες) ─────────
  function buildLine(data) {
    var now = new Date();
    var labels = [], counts = [];
    for (var i = 7; i >= 0; i--) {
      var ws = new Date(now); ws.setDate(now.getDate() - i * 7);
      var we = new Date(ws);  we.setDate(ws.getDate() + 7);
      labels.push('Εβδ. ' + (8 - i));
      counts.push(data.filter(function (r) {
        var d = new Date(r.createdAt);
        return d >= ws && d < we;
      }).length);
    }
    var ctx = document.getElementById('lineChart').getContext('2d');
    if (lineChart) lineChart.destroy();
    lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Αναφορές/εβδ.',
          data: counts,
          borderColor: '#2e7d32',
          backgroundColor: 'rgba(46,125,50,.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#2e7d32',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  }

  // ── Municipality Filter ──────────────────────────────────────
  document.getElementById('municipalityFilter').addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.filter-btn') : e.target;
    if (!btn || !btn.classList.contains('filter-btn')) return;
    document.querySelectorAll('#municipalityFilter .filter-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    currentMuni = btn.getAttribute('data-muni');
    render();
  });

  loadData();

})();
