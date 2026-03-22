/* database.js */

document.addEventListener('DOMContentLoaded', () => {
  renderDatabase();
  document.getElementById('searchInput').addEventListener('input', renderDatabase);
  document.getElementById('gradeFilter').addEventListener('change', renderDatabase);
  document.getElementById('exportExcelBtn').addEventListener('click', exportExcel);
  document.getElementById('clearDbBtn').addEventListener('click', () => {
    if (confirm('Delete ALL submissions? This cannot be undone.')) {
      localStorage.removeItem('ecotrack_submissions');
      renderDatabase();
    }
  });
});

function getAll() {
  return JSON.parse(localStorage.getItem('ecotrack_submissions') || '[]');
}

function renderDatabase() {
  const all    = getAll();
  const search = document.getElementById('searchInput').value.toLowerCase();
  const grade  = document.getElementById('gradeFilter').value;

  const filtered = all.filter(s => {
    const matchS = !search ||
      (s.userName    || '').toLowerCase().includes(search) ||
      (s.userEmail   || '').toLowerCase().includes(search) ||
      (s.destination || '').toLowerCase().includes(search) ||
      (s.userCountry || '').toLowerCase().includes(search);
    const matchG = !grade || s.grade === grade;
    return matchS && matchG;
  });

  // Header stats
  document.getElementById('dbTitle').textContent =
    `${all.length} entr${all.length === 1 ? 'y' : 'ies'} recorded`;

  if (all.length > 0) {
    const totals = all.map(s => parseFloat(s.totalCO2t) || 0);
    const avg    = totals.reduce((a,b) => a+b, 0) / totals.length;
    const maxVal = Math.max(...totals);
    const minVal = Math.min(...totals);
    const sum    = totals.reduce((a,b) => a+b, 0);
    const maxEntry = all.find(s => parseFloat(s.totalCO2t) === maxVal);
    const minEntry = all.find(s => parseFloat(s.totalCO2t) === minVal);

    document.getElementById('dbAvgCo2').textContent   = avg.toFixed(2) + 't';
    document.getElementById('dbTopEmitter').textContent = (maxEntry?.userName || '—').split(' ')[0];
    document.getElementById('dbGreenStar').textContent  = (minEntry?.userName || '—').split(' ')[0];
    document.getElementById('dbTotalCo2').textContent  = sum.toFixed(2) + 't';
    document.getElementById('chartsSection').style.display = 'grid';
    renderCharts(all);
  } else {
    ['dbAvgCo2','dbTopEmitter','dbGreenStar','dbTotalCo2'].forEach(id =>
      document.getElementById(id).textContent = '—');
    document.getElementById('chartsSection').style.display = 'none';
  }

  const empty   = document.getElementById('emptyState');
  const wrapper = document.getElementById('tableWrap');

  if (filtered.length === 0) {
    empty.style.display   = 'block';
    wrapper.style.display = 'none';
    return;
  }
  empty.style.display   = 'none';
  wrapper.style.display = 'block';

  const gradeBg  = { A:'#dcfce7', B:'#d1fae5', C:'#fef3c7', D:'#ffedd5', E:'#fee2e2' };
  const gradeClr = { A:'#14532d', B:'#065f46', C:'#92400e', D:'#9a3412', E:'#7f1d1d' };

  document.getElementById('dbBody').innerHTML = filtered.map((s, i) => {
    const total = parseFloat(s.totalCO2t) || 0;
    const barW  = Math.min(total / 6 * 100, 100).toFixed(0);
    return `
      <tr>
        <td style="color:#94a3b8;font-size:12px;">${all.indexOf(s)+1}</td>

        <td><strong>${esc(s.userName)}</strong></td>
        <td style="font-size:12px;color:#475569;">${esc(s.userEmail)}</td>
        <td style="font-size:12px;">${esc(s.userAge)}</td>
        <td style="font-size:12px;">${esc(s.userCountry)}</td>
        <td style="font-size:12px;">${esc(s.userGender)}</td>
        <td style="font-size:12px;">${esc(s.userTripsPerYear)}</td>

        <td><strong>${esc(s.destination)}</strong></td>
        <td style="font-size:12px;">${esc(s.departureCity)}</td>
        <td style="text-align:center;">${s.tripDays}</td>
        <td style="text-align:center;">${s.travellers}</td>
        <td style="font-size:12px;">${esc(s.tripPurpose)}</td>
        <td style="text-align:right;">${s.flightKm ? (parseFloat(s.flightKm)*2).toLocaleString() : 0}</td>
        <td style="font-size:12px;">${esc(s.flightClass)}</td>
        <td style="font-size:12px;">${esc(s.localTransport)}</td>
        <td style="font-size:12px;">${esc(s.accomType)}</td>
        <td style="text-align:center;">${s.roomNights}</td>
        <td style="font-size:12px;">${esc(s.diet)}</td>
        <td style="font-size:12px;">${esc(s.mainActivity)}</td>
        <td style="font-size:12px;">${esc(s.shopping)}</td>

        <td style="text-align:right;font-size:12px;">${s.flightCO2t}</td>
        <td style="text-align:right;font-size:12px;">${s.localCO2t}</td>
        <td style="text-align:right;font-size:12px;">${s.hotelCO2t}</td>
        <td style="text-align:right;font-size:12px;">${s.foodCO2t}</td>
        <td style="text-align:right;font-size:12px;">${s.activityCO2t}</td>
        <td>
          <div class="co2-bar-cell">
            <div class="co2-bar-track">
              <div class="co2-bar-fill" style="width:${barW}%"></div>
            </div>
            <strong>${total.toFixed(3)}</strong>
          </div>
        </td>
        <td>
          <span style="background:${gradeBg[s.grade]||'#f1f5f9'};color:${gradeClr[s.grade]||'#334155'};
            padding:3px 12px;border-radius:999px;font-size:12px;font-weight:700;">
            ${s.grade || '—'}
          </span>
        </td>

        <td style="text-align:center;">${s.feedbackRating ? '★'.repeat(s.feedbackRating) : '—'}</td>
        <td style="font-size:12px;">${esc(s.wouldChangeHabits)}</td>
        <td style="font-size:12px;">${esc(s.mostSurprising)}</td>
        <td style="font-size:12px;">${esc(s.wouldRecommend)}</td>
        <td style="font-size:12px;max-width:200px;color:#475569;">${esc(s.feedbackComment)}</td>

        <td style="font-size:11px;color:#94a3b8;white-space:nowrap;">${s.submittedAt}</td>
      </tr>`;
  }).join('');
}

let chartInstances = {};

function renderCharts(all) {
  Object.values(chartInstances).forEach(c => c.destroy());
  chartInstances = {};

  const recent = all.slice(-12);
  chartInstances.bar = new Chart(document.getElementById('userBarChart'), {
    type: 'bar',
    data: {
      labels: recent.map(s => (s.userName || 'User').split(' ')[0]),
      datasets: [{
        label: 'CO₂e (t)',
        data: recent.map(s => parseFloat(parseFloat(s.totalCO2t).toFixed(3))),
        backgroundColor: recent.map(s =>
          ({A:'#16a34a',B:'#22c55e',C:'#f59e0b',D:'#f97316',E:'#ef4444'}[s.grade] || '#94a3b8')),
        borderRadius: 6, borderWidth: 0,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend:{ display:false } },
      scales: {
        y: { beginAtZero:true, ticks:{color:'#94a3b8',font:{size:11}}, grid:{color:'rgba(0,0,0,.06)'} },
        x: { ticks:{color:'#475569',font:{size:11}}, grid:{display:false} }
      }
    }
  });

  const gc = {A:0,B:0,C:0,D:0,E:0};
  all.forEach(s => { if (gc[s.grade] !== undefined) gc[s.grade]++; });
  const gl  = Object.keys(gc).filter(g => gc[g] > 0);
  chartInstances.pie = new Chart(document.getElementById('gradePieChart'), {
    type: 'doughnut',
    data: {
      labels: gl.map(g => `Grade ${g} (${gc[g]})`),
      datasets: [{
        data: gl.map(g => gc[g]),
        backgroundColor: gl.map(g => ({A:'#16a34a',B:'#22c55e',C:'#f59e0b',D:'#f97316',E:'#ef4444'}[g])),
        borderWidth: 2, borderColor:'#ffffff',
      }]
    },
    options: {
      responsive:true, maintainAspectRatio:false, cutout:'55%',
      plugins: { legend:{ position:'bottom', labels:{font:{size:12},color:'#475569',padding:12} } }
    }
  });
}

/* ── EXCEL EXPORT via SheetJS ── */
function exportExcel() {
  const all = getAll();
  if (all.length === 0) { alert('No submissions to export yet.'); return; }

  // Build rows with clear section headers as columns
  const headers = [
    // Tourist details
    'Name', 'Email', 'Age Group', 'Home Country', 'Gender', 'Trips/Year',
    // Tour details
    'Destination', 'Departure City', 'Trip Days', 'Travellers', 'Purpose',
    'Flight km (RT)', 'Cabin Class', 'Local km/Day', 'Local Transport',
    'Accommodation', 'Room Nights', 'Rooms', 'Diet', 'Dining Style',
    'Alcohol', 'Main Activity', 'Motorised Tours', 'Shopping', 'Spa/Sauna',
    // Carbon results
    'Flight CO2 (t)', 'Transport CO2 (t)', 'Hotel CO2 (t)',
    'Food CO2 (t)', 'Activity CO2 (t)', 'Total CO2 (t)', 'Grade', 'Trees to Offset',
    // Feedback
    'Rating (stars)', 'Would Change Habits', 'Most Surprising', 'Would Recommend', 'Comment',
    // Meta
    'Submitted At',
  ];

  const rows = all.map(s => [
    s.userName, s.userEmail, s.userAge, s.userCountry, s.userGender, s.userTripsPerYear,
    s.destination, s.departureCity, s.tripDays, s.travellers, s.tripPurpose,
    s.flightKm ? parseFloat(s.flightKm)*2 : 0,
    s.flightClass, s.localKmPerDay, s.localTransport,
    s.accomType, s.roomNights, s.roomsBooked, s.diet, s.diningStyle,
    s.alcoholFreq, s.mainActivity, s.motorisedTours, s.shopping, s.spaSauna,
    s.flightCO2t, s.localCO2t, s.hotelCO2t, s.foodCO2t, s.activityCO2t,
    s.totalCO2t, s.grade, s.treesToOffset,
    s.feedbackRating, s.wouldChangeHabits, s.mostSurprising, s.wouldRecommend, s.feedbackComment,
    s.submittedAt,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Style header row widths
  ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 4, 14) }));

  // Group header styling with a merged "section" row above
  const sectionRow = [
    'TOURIST DETAILS', '', '', '', '', '',
    'TOUR DETAILS', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    'CARBON RESULTS', '', '', '', '', '', '', '',
    'FEEDBACK', '', '', '', '',
    'META',
  ];

  const wb = XLSX.utils.book_new();

  // Sheet 1 — Full data
  const wsData = XLSX.utils.aoa_to_sheet([sectionRow, headers, ...rows]);
  wsData['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 4, 14) }));
  wsData['!merges'] = [
    { s:{r:0,c:0},  e:{r:0,c:5}  },  // Tourist details
    { s:{r:0,c:6},  e:{r:0,c:24} },  // Tour details
    { s:{r:0,c:25}, e:{r:0,c:32} },  // Carbon results
    { s:{r:0,c:33}, e:{r:0,c:37} },  // Feedback
    { s:{r:0,c:38}, e:{r:0,c:38} },  // Meta
  ];
  XLSX.utils.book_append_sheet(wb, wsData, 'All Submissions');

  // Sheet 2 — Tourist details only
  const touristHeaders = ['Name','Email','Age Group','Home Country','Gender','Trips/Year'];
  const touristRows = all.map(s => [s.userName, s.userEmail, s.userAge, s.userCountry, s.userGender, s.userTripsPerYear]);
  const wsTourist = XLSX.utils.aoa_to_sheet([touristHeaders, ...touristRows]);
  wsTourist['!cols'] = touristHeaders.map(h => ({ wch: Math.max(h.length + 6, 18) }));
  XLSX.utils.book_append_sheet(wb, wsTourist, 'Tourist Details');

  // Sheet 3 — Trip + carbon summary
  const tripHeaders = ['Name','Destination','Days','Travellers','Total CO2 (t)','Grade','Trees to Offset','Submitted At'];
  const tripRows = all.map(s => [s.userName, s.destination, s.tripDays, s.travellers, s.totalCO2t, s.grade, s.treesToOffset, s.submittedAt]);
  const wsTrip = XLSX.utils.aoa_to_sheet([tripHeaders, ...tripRows]);
  wsTrip['!cols'] = tripHeaders.map(h => ({ wch: Math.max(h.length + 6, 16) }));
  XLSX.utils.book_append_sheet(wb, wsTrip, 'Trip Summary');

  // Sheet 4 — Feedback only
  const fbHeaders = ['Name','Destination','Total CO2 (t)','Grade','Rating','Would Change','Most Surprising','Recommend','Comment'];
  const fbRows = all.map(s => [s.userName, s.destination, s.totalCO2t, s.grade, s.feedbackRating, s.wouldChangeHabits, s.mostSurprising, s.wouldRecommend, s.feedbackComment]);
  const wsFb = XLSX.utils.aoa_to_sheet([fbHeaders, ...fbRows]);
  wsFb['!cols'] = fbHeaders.map(h => ({ wch: Math.max(h.length + 6, 16) }));
  XLSX.utils.book_append_sheet(wb, wsFb, 'Feedback');

  // Download
  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `ecotrack-submissions-${date}.xlsx`);
}

function esc(v) {
  if (!v) return '—';
  return String(v).replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
