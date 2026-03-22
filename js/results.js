/* results.js */

document.addEventListener('DOMContentLoaded', () => {
  const tripRaw  = localStorage.getItem('ecotrack_trip');
  const userRaw  = localStorage.getItem('ecotrack_user');

  if (!tripRaw) { window.location.href = 'calculator.html'; return; }
  if (!userRaw) { window.location.href = 'register.html';   return; }

  const tripData = JSON.parse(tripRaw);
  const userData = JSON.parse(userRaw);
  const result   = calculateFootprint(tripData);

  renderScoreHero(tripData, userData, result);
  renderTableau(tripData, result);
  renderCharts(result);
  renderTips(tripData, result);
  renderFeedback(tripData, userData, result);
});

/* ── SCORE HERO ── */
function renderScoreHero(trip, user, result) {
  const dest = trip.destination || 'your trip';
  const days = trip.tripDays || '?';
  const n    = trip.travellers || 1;

  document.getElementById('tripLabel').textContent =
    `${user.userName} · ${dest} · ${days} days · ${n} traveller${n > 1 ? 's' : ''}`;
  document.getElementById('scoreTotalText').textContent = `${result.totalT.toFixed(2)} t CO₂e`;
  document.getElementById('ringVal').textContent = result.totalT.toFixed(1);
  document.getElementById('mPerDay').textContent  = result.perDayT.toFixed(3) + 't';
  document.getElementById('mTrees').textContent   = result.treesToOffset;
  document.getElementById('mAnnual').textContent  = result.annualPct + '%';

  const badge = document.getElementById('gradeBadge');
  badge.textContent = `Grade ${result.grade} — ${result.gradeText}`;
  badge.className   = `grade-badge grade-${result.grade}`;

  document.getElementById('scoreCompare').textContent =
    `The average person emits ~4.7 t CO₂ per year. This trip uses ${result.annualPct}% of that annual budget.`;

  const circ  = 2 * Math.PI * 80;
  const pct   = Math.min(result.totalT / 6, 1);
  const arc   = document.getElementById('ringArc');
  const cols  = { A:'#16a34a', B:'#22c55e', C:'#f59e0b', D:'#f97316', E:'#ef4444' };
  arc.style.stroke = cols[result.grade] || '#16a34a';
  requestAnimationFrame(() => {
    setTimeout(() => {
      arc.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)';
      arc.setAttribute('stroke-dashoffset', circ * (1 - pct));
    }, 200);
  });
}

/* ── TABLEAU TABLE ── */
function renderTableau(trip, result) {
  const rows   = buildTableauRows(trip, result);
  const maxKg  = Math.max(...rows.map(r => r.kg));
  const benchKeys = ['flight','local','hotel','food','activities'];

  document.getElementById('tableauBody').innerHTML = rows.map((row, i) => {
    const bar = maxKg > 0 ? (row.kg / maxKg * 100).toFixed(0) : 0;
    const bench = (BENCHMARKS[benchKeys[i]] || 0).toFixed(2);
    return `
      <tr>
        <td><span class="cat-pill ${row.catCls}">${row.cat}</span></td>
        <td>${row.field}</td>
        <td style="font-size:12px;color:#475569;max-width:220px;">${row.value}</td>
        <td style="font-size:12px;color:#64748b;">${row.factor}</td>
        <td>
          <div class="co2-bar-cell">
            <div class="co2-bar-track">
              <div class="co2-bar-fill" style="width:${bar}%"></div>
            </div>
            <strong style="font-size:13px;white-space:nowrap;">${(row.kg/1000).toFixed(3)}</strong>
          </div>
        </td>
        <td style="font-weight:600;">${row.pct.toFixed(1)}%</td>
        <td style="font-size:12px;color:#64748b;">${bench} t avg</td>
        <td><span class="status-badge ${row.status.cls}">${row.status.label}</span></td>
      </tr>`;
  }).join('');

  document.getElementById('tableFootTotal').textContent = result.totalT.toFixed(3) + ' t';
}

/* ── CHARTS ── */
function renderCharts(result) {
  const cats   = result.categories;
  const labels = Object.values(cats).map(c => c.label);
  const kgVals = Object.values(cats).map(c => parseFloat(c.kg.toFixed(2)));
  const colors = ['#0369a1','#7e22ce','#c2410c','#a16207','#15803d'];

  document.getElementById('donutLegend').innerHTML = labels.map((l,i) =>
    `<span class="chart-legend-item">
       <span class="legend-dot" style="background:${colors[i]}"></span>${l}
     </span>`).join('');

  new Chart(document.getElementById('donutChart'), {
    type: 'doughnut',
    data: { labels, datasets: [{ data: kgVals, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { display: false } } }
  });

  new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: {
      labels: ['Your trip', 'Avg tourist', 'Budget traveller', 'Eco traveller'],
      datasets: [{
        data: [parseFloat(result.totalT.toFixed(2)), 2.2, 1.1, 0.4],
        backgroundColor: ['#15803d','#94a3b8','#94a3b8','#94a3b8'],
        borderRadius: 6, borderWidth: 0,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color:'rgba(0,0,0,.06)' }, ticks: { color:'#94a3b8', font:{size:11} } },
        x: { grid: { display: false }, ticks: { color:'#475569', font:{size:12} } }
      }
    }
  });
}

/* ── TIPS ── */
function renderTips(trip, result) {
  const tips = [];
  if (result.flightKg > 500)
    tips.push({ cls:'red-tip',   title:'✈️ Offset your flights',       body:'Flights are your biggest contributor. Choose direct routes and offset via Gold Standard or Climate Care.' });
  if (['taxi','rental'].includes(trip.localTransport))
    tips.push({ cls:'amber-tip', title:'🚌 Switch to public transit',   body:'Local taxis and rental cars produce 4–5× more emissions than public transport.' });
  if (trip.accomType === 'luxury')
    tips.push({ cls:'amber-tip', title:'🏨 Choose eco-certified hotels', body:'Look for Green Key or EarthCheck certified properties for your next stay.' });
  if (['omnivore','flex'].includes(trip.diet))
    tips.push({ cls:'',          title:'🥗 Try plant-based meals',       body:'Eating plant-based half the time reduces food emissions by up to 40%.' });
  if (['adventure','cruise'].includes(trip.mainActivity))
    tips.push({ cls:'amber-tip', title:'🌿 Balance with low-impact activities', body:'Balance adventure and boat tours with walking, cycling, and hiking.' });
  if (trip.shopping === 'high')
    tips.push({ cls:'',          title:'🛍️ Experiences over things',     body:'Focus on experiences rather than goods, or buy locally handmade items.' });
  if (result.grade === 'A' || result.grade === 'B')
    tips.push({ cls:'',          title:'🌟 You\'re a low-impact traveller!', body:'Your footprint is well below average. Inspire others to travel greener.' });
  tips.push({ cls:'', title:'🌱 Plant trees to offset', body:`You need ~${result.treesToOffset} trees to offset this trip. Try Treedom, Ecologi, or One Tree Planted.` });

  document.getElementById('tipsGrid').innerHTML = tips.map(t =>
    `<div class="tip-card ${t.cls}"><strong>${t.title}</strong>${t.body}</div>`).join('');
}

/* ── FEEDBACK ── */
function renderFeedback(tripData, userData, result) {
  let selectedStars    = 0;
  let selectedHabit    = '';
  let selectedSurprise = '';
  let selectedRecommend = '';

  // Stars
  const stars = document.querySelectorAll('.star');
  stars.forEach(s => s.addEventListener('click', () => {
    selectedStars = parseInt(s.dataset.val);
    stars.forEach(st => st.classList.toggle('active', parseInt(st.dataset.val) <= selectedStars));
  }));

  // Pill groups helper
  function bindPills(groupId, setter) {
    document.querySelectorAll(`#${groupId} .pill`).forEach(p => {
      p.addEventListener('click', () => {
        document.querySelectorAll(`#${groupId} .pill`).forEach(x => x.classList.remove('selected'));
        p.classList.add('selected');
        setter(p.dataset.val);
      });
    });
  }
  bindPills('habitPills',     v => selectedHabit     = v);
  bindPills('surprisePills',  v => selectedSurprise  = v);
  bindPills('recommendPills', v => selectedRecommend = v);

  document.getElementById('submitFeedback').addEventListener('click', () => {
    if (!selectedStars) { alert('Please give a star rating.'); return; }

    const feedback = {
      rating:     selectedStars,
      wouldChange: selectedHabit,
      mostSurprising: selectedSurprise,
      wouldRecommend: selectedRecommend,
      comment:    document.getElementById('fbComment').value.trim(),
    };

    saveToDatabase(userData, tripData, result, feedback);

    document.getElementById('feedbackSuccess').style.display = 'flex';
    document.getElementById('submitFeedback').disabled = true;
    document.getElementById('submitFeedback').textContent = 'Saved ✓';

    // Clear current session data so next user starts fresh
    localStorage.removeItem('ecotrack_trip');
    localStorage.removeItem('ecotrack_user');
  });
}

/* ── SAVE FULL ENTRY TO DATABASE ── */
function saveToDatabase(user, trip, result, feedback) {
  const entry = {
    // Tourist details
    userName:       user.userName     || '',
    userEmail:      user.userEmail    || '',
    userAge:        user.userAge      || '',
    userCountry:    user.userCountry  || '',
    userGender:     user.userGender   || '',
    userTripsPerYear: user.userTripsPerYear || '',

    // Trip details
    destination:    trip.destination  || '',
    departureCity:  trip.departureCity|| '',
    tripDays:       trip.tripDays     || '',
    travellers:     trip.travellers   || '',
    tripPurpose:    trip.tripPurpose  || '',
    flightKm:       trip.flightKm     || '',
    flightClass:    trip.flightClass  || '',
    localKmPerDay:  trip.localKmPerDay|| '',
    localTransport: trip.localTransport|| '',
    accomType:      trip.accomType    || '',
    roomNights:     trip.roomNights   || '',
    roomsBooked:    trip.roomsBooked  || '',
    diet:           trip.diet         || '',
    diningStyle:    trip.diningStyle  || '',
    alcoholFreq:    trip.alcoholFreq  || '',
    mainActivity:   trip.mainActivity || '',
    motorisedTours: trip.motorisedTours|| '',
    shopping:       trip.shopping     || '',
    spaSauna:       trip.spaSauna     || '',

    // Carbon results
    flightCO2t:     parseFloat((result.flightKg     / 1000).toFixed(4)),
    localCO2t:      parseFloat((result.localKg      / 1000).toFixed(4)),
    hotelCO2t:      parseFloat((result.accomKg      / 1000).toFixed(4)),
    foodCO2t:       parseFloat((result.foodKg       / 1000).toFixed(4)),
    activityCO2t:   parseFloat((result.activitiesKg / 1000).toFixed(4)),
    totalCO2t:      parseFloat(result.totalT.toFixed(4)),
    grade:          result.grade,
    treesToOffset:  result.treesToOffset,

    // Feedback
    feedbackRating:     feedback.rating,
    wouldChangeHabits:  feedback.wouldChange,
    mostSurprising:     feedback.mostSurprising,
    wouldRecommend:     feedback.wouldRecommend,
    feedbackComment:    feedback.comment,

    // Metadata
    submittedAt: new Date().toLocaleString(),
  };

  const all = JSON.parse(localStorage.getItem('ecotrack_submissions') || '[]');
  all.push(entry);
  localStorage.setItem('ecotrack_submissions', JSON.stringify(all));
}
