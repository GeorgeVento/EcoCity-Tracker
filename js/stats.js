/* js/stats.js — Statistics with Chart.js, municipality filter */
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

  // ── Sample fallback data ──────────────────────────────────────
  var SAMPLE = [];

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
      allReports = Array.isArray(stored) ? stored : [];
    } catch (e) { allReports = []; }
    render();

    fetch('/api/stats')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && Array.isArray(d.reports)) {
          allReports = d.reports;
          render();
        }
      })
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

  // ── Bar: reports per category ────────────────────────────────
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

  // ── Doughnut: distribution by status ────────────────────────
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

  // ── Line: weekly trend (last 8 weeks) ───────────────────────
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
