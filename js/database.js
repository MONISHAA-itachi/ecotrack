/* database.js — fetches live data from Google Sheets */

const SHEET_URL = 'https://script.google.com/macros/s/AKfycbyqcVn2_a96Mt5A014O9LO_jVmB2oyGL0defR6U4FVsxUrrGd4MMSr-lEI7AP5_6H23/exec';

let allEntries = [];

document.addEventListener('DOMContentLoaded', () => {
  loadFromSheets();

  document.getElementById('searchInput').addEventListener('input', renderTable);
  document.getElementById('gradeFilter').addEventListener('change', renderTable);
  document.getElementById('exportExcelBtn').addEventListener('click', exportExcel);
  document.getElementById('clearDbBtn').addEventListener('click', () => {
    if (confirm('This will clear the LOCAL cache only. Data in Google Sheets is safe.\n\nClear local cache?')) {
      localStorage.removeItem('ecotrack_submissions');
      loadFromSheets();
    }
  });
});

/* ── LOAD FROM GOOGLE SHEETS ── */
async function loadFromSheets() {
  showLoading(true);

  try {
    const res = await fetch(SHEET_URL, { method: 'GET' });
    const json = await res.json();

    if (json.status === 'success' && json.data) {
      allEntries = json.data.filter(r => r.Name || r.name);
      renderStats();
      renderTable();
      renderCharts();
    } else {
      showError('Could not load data from Google Sheets.');
    }
  } catch (err) {
    // Fallback to localStorage if fetch fails
    console.warn('Sheets fetch failed, falling back to localStorage:', err);
    allEntries = JSON.parse(localStorage.getItem('ecotrack_submissions') || '[]');
    if (allEntries.length > 0) {
      renderStats();
      renderTable();
      renderCharts();
      showBanner('Showing locally cached data. Could not reach Google Sheets.');
    } else {
      showError('Could not load data. Check your internet connection.');
    }
  }

  showLoading(false);
}

function showLoading(on) {
  document.getElementById('loadingState').style.display = on ? 'block' : 'none';
  document.getElementById('emptyState').style.display   = 'none';
  document.getElementById('tableWrap').style.display    = 'none';
}

function showError(msg) {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('emptyState').style.display   = 'block';
  document.getElementById('emptyMsg').textContent = msg;
}

function showBanner(msg) {
  const b = document.getElementById('warnBanner');
  b.textContent = msg;
  b.style.display = 'block';
}

/* ── STATS ── */
function renderStats() {
  const totals = allEntries.map(s => parseFloat(s.Total_CO2t || s.totalCO2t) || 0);
  if (!totals.length) return;

  const avg  = totals.reduce((a,b) => a+b, 0) / totals.length;
  const max  = Math.max(...totals);
  const min  = Math.min(...totals);
  const sum  = totals.reduce((a,b) => a+b, 0);
  const maxE = allEntries.find(s => (parseFloat(s.Total_CO2t || s.totalCO2t)||0) === max);
  const minE = allEntries.find(s => (parseFloat(s.Total_CO2t || s.totalCO2t)||0) === min);

  document.getElementById('dbTitle').textContent =
    `${allEntries.length} entr${allEntries.length === 1 ? 'y' : 'ies'} recorded`;
  document.getElementById('dbAvgCo2').textContent    = avg.toFixed(2) + 't';
  document.getElementById('dbTopEmitter').textContent = ((maxE?.Name || maxE?.userName || '—').split(' ')[0]);
  document.getElementById('dbGreenStar').textContent  = ((minE?.Name || minE?.userName || '—').split(' ')[0]);
  document.getElementById('dbTotalCo2').textContent   = sum.toFixed(2) + 't';
  document.getElementById('chartsSection').style.display = 'grid';
}

/* ── TABLE ── */
function renderTable() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const grade  = document.getElementById('gradeFilter').value;

  const filtered = allEntries.filter(s => {
    const name  = (s.Name  || s.userName    || '').toLowerCase();
    const email = (s.Email || s.userEmail   || '').toLowerCase();
    const dest  = (s.Destination || s.destination || '').toLowerCase();
    const country = (s.Home_Country || s.userCountry || '').toLowerCase();
    const g     = s.Grade || s.grade || '';
    const matchS = !search || name.includes(search) || email.includes(search) || dest.includes(search) || country.includes(search);
    const matchG = !grade  || g === grade;
    return matchS && matchG;
  });

  const empty   = document.getElementById('emptyState');
  const wrapper = document.getElementById('tableWrap');

  if (filtered.length === 0) {
    empty.style.display   = 'block';
    document.getElementById('emptyMsg').textContent = allEntries.length === 0
      ? 'No submissions yet. Be the first!'
      : 'No entries match your search.';
    wrapper.style.display = 'none';
    return;
  }

  empty.style.display   = 'none';
  wrapper.style.display = 'block';

  const gradeBg  = { A:'#dcfce7', B:'#d1fae5', C:'#fef3c7', D:'#ffedd5', E:'#fee2e2' };
  const gradeClr = { A:'#14532d', B:'#065f46', C:'#92400e', D:'#9a3412', E:'#7f1d1d' };

  document.getElementById('dbBody').innerHTML = filtered.map((s, i) => {
    const total = parseFloat(s.Total_CO2t || s.totalCO2t) || 0;
    const grade = s.Grade || s.grade || '—';
    const barW  = Math.min(total / 6 * 100, 100).toFixed(0);

    // Support both new column names and old ones
    const name        = s.Name        || s.userName        || '—';
    const email       = s.Email       || s.userEmail       || '—';
    const age         = s.Age_Group   || s.userAge         || '—';
    const country     = s.Home_Country|| s.userCountry     || '—';
    const gender      = s.Gender      || s.userGender      || '—';
    const trips       = s.Trips_Per_Year || s.userTripsPerYear || '—';
    const dest        = s.Destination || s.destination     || '—';
    const depCity     = s.Departure_City || s.departureCity|| '—';
    const arrCity     = s.Arrival_City|| '—';
    const days        = s.Trip_Days   || s.tripDays        || '—';
    const travellers  = s.Travellers  || s.travellers      || '—';
    const purpose     = s.Trip_Purpose|| s.tripPurpose     || '—';
    const flightKm    = s.Flight_Km_RT|| (s.flightKm ? parseFloat(s.flightKm)*2 : 0);
    const cabin       = s.Cabin_Class || s.flightClass     || '—';
    const localKm     = s.Local_Km_Per_Day || s.localKmPerDay || '—';
    const transport   = s.Local_Transport  || s.localTransport || '—';
    const accom       = s.Accommodation    || s.accomType   || '—';
    const nights      = s.Room_Nights      || s.roomNights  || '—';
    const diet        = s.Diet        || s.diet            || '—';
    const activity    = s.Main_Activity    || s.mainActivity|| '—';
    const shopping    = s.Shopping    || s.shopping        || '—';
    const fCO2        = s.Flight_CO2t || s.flightCO2t      || '—';
    const tCO2        = s.Transport_CO2t || s.localCO2t    || '—';
    const hCO2        = s.Hotel_CO2t  || s.hotelCO2t       || '—';
    const foCO2       = s.Food_CO2t   || s.foodCO2t        || '—';
    const aCO2        = s.Activity_CO2t || s.activityCO2t  || '—';
    const trees       = s.Trees_To_Offset || s.treesToOffset|| '—';
    const rating      = s.Rating_Stars    || s.feedbackRating || '';
    const habit       = s.Would_Change_Habits || s.wouldChangeHabits || '—';
    const surprising  = s.Most_Surprising    || s.mostSurprising    || '—';
    const recommend   = s.Would_Recommend    || s.wouldRecommend    || '—';
    const comment     = s.Comment       || s.feedbackComment || '—';
    const submitted   = s.Submitted_At  || s.submittedAt   || '—';

    return `
      <tr>
        <td style="color:#94a3b8;font-size:12px;">${i+1}</td>
        <td><strong>${esc(name)}</strong></td>
        <td style="font-size:12px;color:#475569;">${esc(email)}</td>
        <td style="font-size:12px;">${esc(age)}</td>
        <td style="font-size:12px;">${esc(country)}</td>
        <td style="font-size:12px;">${esc(gender)}</td>
        <td style="font-size:12px;">${esc(trips)}</td>
        <td><strong>${esc(dest)}</strong></td>
        <td style="font-size:12px;">${esc(depCity)}</td>
        <td style="font-size:12px;">${esc(arrCity)}</td>
        <td style="text-align:center;">${days}</td>
        <td style="text-align:center;">${travellers}</td>
        <td style="font-size:12px;">${esc(purpose)}</td>
        <td style="text-align:right;">${flightKm ? Number(flightKm).toLocaleString() : 0}</td>
        <td style="font-size:12px;">${esc(cabin)}</td>
        <td style="font-size:12px;">${esc(transport)}</td>
        <td style="font-size:12px;">${esc(accom)}</td>
        <td style="text-align:center;">${nights}</td>
        <td style="font-size:12px;">${esc(diet)}</td>
        <td style="font-size:12px;">${esc(activity)}</td>
        <td style="font-size:12px;">${esc(shopping)}</td>
        <td style="text-align:right;font-size:12px;">${fCO2}</td>
        <td style="text-align:right;font-size:12px;">${tCO2}</td>
        <td style="text-align:right;font-size:12px;">${hCO2}</td>
        <td style="text-align:right;font-size:12px;">${foCO2}</td>
        <td style="text-align:right;font-size:12px;">${aCO2}</td>
        <td>
          <div class="co2-bar-cell">
            <div class="co2-bar-track">
              <div class="co2-bar-fill" style="width:${barW}%"></div>
            </div>
            <strong>${total.toFixed(3)}</strong>
          </div>
        </td>
        <td>
          <span style="background:${gradeBg[grade]||'#f1f5f9'};color:${gradeClr[grade]||'#334155'};
            padding:3px 12px;border-radius:999px;font-size:12px;font-weight:700;">${grade}</span>
        </td>
        <td style="text-align:center;">${rating ? '★'.repeat(Number(rating)) : '—'}</td>
        <td style="font-size:12px;">${esc(habit)}</td>
        <td style="font-size:12px;">${esc(surprising)}</td>
        <td style="font-size:12px;">${esc(recommend)}</td>
        <td style="font-size:12px;max-width:180px;color:#475569;">${esc(comment)}</td>
        <td style="font-size:11px;color:#94a3b8;white-space:nowrap;">${esc(submitted)}</td>
      </tr>`;
  }).join('');
}

/* ── CHARTS ── */
let chartInstances = {};

function renderCharts() {
  Object.values(chartInstances).forEach(c => c.destroy());
  chartInstances = {};

  const recent = allEntries.slice(-12);
  chartInstances.bar = new Chart(document.getElementById('userBarChart'), {
    type: 'bar',
    data: {
      labels: recent.map(s => (s.Name || s.userName || 'User').split(' ')[0]),
      datasets: [{
        data: recent.map(s => parseFloat(parseFloat(s.Total_CO2t || s.totalCO2t || 0).toFixed(3))),
        backgroundColor: recent.map(s => ({
          A:'#16a34a', B:'#22c55e', C:'#f59e0b', D:'#f97316', E:'#ef4444'
        }[s.Grade || s.grade] || '#94a3b8')),
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

  const gc = { A:0, B:0, C:0, D:0, E:0 };
  allEntries.forEach(s => { const g = s.Grade || s.grade; if (gc[g] !== undefined) gc[g]++; });
  const gl = Object.keys(gc).filter(g => gc[g] > 0);

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
      plugins:{ legend:{ position:'bottom', labels:{font:{size:12},color:'#475569',padding:12} } }
    }
  });
}

/* ── EXCEL EXPORT ── */
function exportExcel() {
  if (!allEntries.length) { alert('No submissions to export yet.'); return; }

  const headers = Object.keys(allEntries[0]);
  const rows = allEntries.map(s => headers.map(h => s[h] || ''));

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = headers.map(h => ({ wch: Math.max(String(h).length + 4, 14) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'All Submissions');

  // Tourist sheet
  const tHeaders = ['Name','Email','Age_Group','Home_Country','Gender','Trips_Per_Year'];
  const tRows = allEntries.map(s => tHeaders.map(h => s[h] || ''));
  const wsT = XLSX.utils.aoa_to_sheet([tHeaders, ...tRows]);
  XLSX.utils.book_append_sheet(wb, wsT, 'Tourist Details');

  // Trip summary sheet
  const sHeaders = ['Name','Destination','Trip_Days','Travellers','Total_CO2t','Grade','Trees_To_Offset','Submitted_At'];
  const sRows = allEntries.map(s => sHeaders.map(h => s[h] || ''));
  const wsS = XLSX.utils.aoa_to_sheet([sHeaders, ...sRows]);
  XLSX.utils.book_append_sheet(wb, wsS, 'Trip Summary');

  // Feedback sheet
  const fHeaders = ['Name','Destination','Total_CO2t','Grade','Rating_Stars','Would_Change_Habits','Most_Surprising','Would_Recommend','Comment'];
  const fRows = allEntries.map(s => fHeaders.map(h => s[h] || ''));
  const wsF = XLSX.utils.aoa_to_sheet([fHeaders, ...fRows]);
  XLSX.utils.book_append_sheet(wb, wsF, 'Feedback');

  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `ecotrack-submissions-${date}.xlsx`);
}

function esc(v) {
  if (!v || v === 'undefined') return '—';
  return String(v).replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
