/* calculator.js — emission factor engine */

const EMISSION_FACTORS = {
  flight: {
    economy:  0.255, // kg CO2e per km per person
    premium:  0.408,
    business: 0.765,
    first:    1.020,
  },
  localTransport: {
    public:  0.040, // kg CO2e per km
    taxi:    0.170,
    rental:  0.210,
    walk:    0.000,
  },
  accommodation: {
    camping:  1.0,  // kg CO2e per room night
    budget:   3.0,
    midrange: 8.0,
    airbnb:   5.0,
    luxury:  20.0,
  },
  diet: {
    omnivore:   7.5, // kg CO2e per person per day
    flex:        5.5,
    vegetarian:  3.5,
    vegan:       2.5,
  },
  diningMult: {
    restaurant: 1.20,
    mixed:      1.00,
    selfcater:  0.80,
  },
  activity: {
    sightseeing: 1.0, // kg CO2e per day
    beach:       0.5,
    nature:      0.3,
    adventure:   4.0,
    cruise:      6.0,
    cultural:    0.8,
  },
  motorisedTours: {
    none:    0,
    few:     8,   // kg CO2e total
    several: 20,
    many:    50,
  },
  shopping: {
    low:    0.5,  // kg CO2e per day
    medium: 2.0,
    high:   5.0,
  },
  spaSauna: {
    no:       0,
    once:     3,
    frequent: 10,
  },
  alcoholFreq: {
    none:       0,
    occasional: 0.3,
    daily:      0.8,
  },
};

const BENCHMARKS = {
  flight:    1.0,
  local:     0.15,
  hotel:     0.08,
  food:      0.25,
  activities:0.10,
};

function calculateFootprint(data) {
  const days = parseFloat(data.tripDays) || 7;
  const flightKm = parseFloat(data.flightKm) || 0;
  const localKmPerDay = parseFloat(data.localKmPerDay) || 20;
  const roomNights = parseFloat(data.roomNights) || days;
  const rooms = parseFloat(data.roomsBooked) || 1;

  // Flight (round trip)
  const flightFactor = EMISSION_FACTORS.flight[data.flightClass] || EMISSION_FACTORS.flight.economy;
  const flightKg = flightKm * 2 * flightFactor;

  // Local transport
  const localFactor = EMISSION_FACTORS.localTransport[data.localTransport] || 0.04;
  const localKg = localKmPerDay * days * localFactor;

  // Accommodation
  const accomFactor = EMISSION_FACTORS.accommodation[data.accomType] || 8;
  const accomKg = roomNights * rooms * accomFactor;

  // Food
  const dietFactor = EMISSION_FACTORS.diet[data.diet] || 5.5;
  const diningMult = EMISSION_FACTORS.diningMult[data.diningStyle] || 1.0;
  const alcoholKg = (EMISSION_FACTORS.alcoholFreq[data.alcoholFreq] || 0) * days;
  const foodKg = (days * dietFactor * diningMult) + alcoholKg;

  // Activities
  const actFactor = EMISSION_FACTORS.activity[data.mainActivity] || 1.0;
  const tourKg = EMISSION_FACTORS.motorisedTours[data.motorisedTours] || 0;
  const shopKg = (EMISSION_FACTORS.shopping[data.shopping] || 0.5) * days;
  const spaKg = EMISSION_FACTORS.spaSauna[data.spaSauna] || 0;
  const activitiesKg = (actFactor * days) + tourKg + shopKg + spaKg;

  const totalKg = flightKg + localKg + accomKg + foodKg + activitiesKg;
  const totalT  = totalKg / 1000;

  const categories = {
    flight:     { kg: flightKg,     label: 'Flights',           emoji: '✈️' },
    local:      { kg: localKg,      label: 'Local transport',   emoji: '🚌' },
    hotel:      { kg: accomKg,      label: 'Accommodation',     emoji: '🏨' },
    food:       { kg: foodKg,       label: 'Food & dining',     emoji: '🍽️' },
    activities: { kg: activitiesKg, label: 'Activities',        emoji: '🎯' },
  };

  const grade = totalT < 0.5 ? 'A' : totalT < 1 ? 'B' : totalT < 2 ? 'C' : totalT < 4 ? 'D' : 'E';

  const gradeText = {
    A: 'Excellent — very low impact trip',
    B: 'Good — below average footprint',
    C: 'Average — some room to improve',
    D: 'High — consider offsetting',
    E: 'Very high — significant impact',
  };

  return {
    totalKg,
    totalT,
    grade,
    gradeText: gradeText[grade],
    categories,
    flightKg, localKg, accomKg, foodKg, activitiesKg,
    perDayT: totalT / days,
    treesToOffset: Math.ceil(totalT * 50),
    annualPct: Math.round(totalT / 4.7 * 100),
  };
}

function getStatus(key, kg) {
  const bench = BENCHMARKS[key] * 1000; // convert to kg
  if (kg <= bench * 0.8) return { label: 'Low', cls: 'status-low' };
  if (kg <= bench * 1.5) return { label: 'Average', cls: 'status-mid' };
  return { label: 'High', cls: 'status-high' };
}

function buildTableauRows(data, result) {
  const days = parseFloat(data.tripDays) || 7;
  const localKmPerDay = parseFloat(data.localKmPerDay) || 20;
  const total = result.totalKg;

  const rows = [
    {
      cat: 'Flights', catCls: 'cat-flight',
      field: 'Flight distance (round trip)',
      value: `${(parseFloat(data.flightKm)||0)*2} km · ${data.flightClass || 'economy'} class`,
      factor: `${EMISSION_FACTORS.flight[data.flightClass || 'economy']} kg CO₂e/km`,
      kg: result.flightKg,
      pct: total > 0 ? (result.flightKg / total * 100) : 0,
      status: getStatus('flight', result.flightKg),
    },
    {
      cat: 'Transport', catCls: 'cat-local',
      field: 'Local travel',
      value: `${localKmPerDay} km/day × ${days} days · ${data.localTransport || 'public'}`,
      factor: `${EMISSION_FACTORS.localTransport[data.localTransport || 'public']} kg CO₂e/km`,
      kg: result.localKg,
      pct: total > 0 ? (result.localKg / total * 100) : 0,
      status: getStatus('local', result.localKg),
    },
    {
      cat: 'Accommodation', catCls: 'cat-hotel',
      field: 'Hotel stay',
      value: `${data.roomNights || days} nights · ${data.roomsBooked || 1} room(s) · ${data.accomType || 'midrange'}`,
      factor: `${EMISSION_FACTORS.accommodation[data.accomType || 'midrange']} kg CO₂e/night`,
      kg: result.accomKg,
      pct: total > 0 ? (result.accomKg / total * 100) : 0,
      status: getStatus('hotel', result.accomKg),
    },
    {
      cat: 'Food', catCls: 'cat-food',
      field: 'Food & dining',
      value: `${data.diet || 'omnivore'} diet · ${data.diningStyle || 'restaurant'} · ${data.alcoholFreq || 'none'} alcohol`,
      factor: `~${EMISSION_FACTORS.diet[data.diet || 'omnivore']} kg CO₂e/person/day`,
      kg: result.foodKg,
      pct: total > 0 ? (result.foodKg / total * 100) : 0,
      status: getStatus('food', result.foodKg),
    },
    {
      cat: 'Activities', catCls: 'cat-activity',
      field: 'Activities & shopping',
      value: `${data.mainActivity || 'sightseeing'} · tours: ${data.motorisedTours || 'none'} · shopping: ${data.shopping || 'low'}`,
      factor: 'Variable per activity type',
      kg: result.activitiesKg,
      pct: total > 0 ? (result.activitiesKg / total * 100) : 0,
      status: getStatus('activities', result.activitiesKg),
    },
  ];
  return rows;
}
