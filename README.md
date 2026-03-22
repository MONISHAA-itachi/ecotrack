# 🌿 EcoTrack — Tourist Carbon Footprint Dashboard

A multi-page web app built for the **Green Internship Programme** that helps tourists calculate and understand their travel carbon footprint.

## 🚀 Live Demo
Open `index.html` in any browser — no server needed.

## 📁 Project Structure

```
carbon-dashboard/
├── index.html          ← Landing page
├── calculator.html     ← Trip input form (5 sections)
├── results.html        ← Dashboard with charts + feedback
├── css/
│   └── style.css       ← Full design system
└── js/
    ├── calculator.js   ← Emission factor engine (shared)
    ├── results.js      ← Dashboard rendering + feedback
    └── main.js         ← Form handling + localStorage
```

## 📊 What It Tracks

| Category | Inputs |
|---|---|
| ✈️ Flights | Distance, cabin class (economy → first) |
| 🚌 Local transport | km/day, type (public/taxi/rental/walk) |
| 🏨 Accommodation | Type (camping → luxury), nights, rooms |
| 🍽️ Food & dining | Diet type, restaurant style, alcohol |
| 🎯 Activities | Main activity, motorised tours, shopping, spa |

## 📈 Results Dashboard

- **Score ring** — animated CO₂e ring with A–E grade badge
- **Tableau-style data table** — every input with emission factors, CO₂ values, % share, benchmark, and status
- **Doughnut chart** — breakdown by category
- **Bar chart** — comparison vs avg tourist / budget / eco traveller
- **Personalised tips** — rule-based, based on user's specific choices
- **Feedback form** — star rating, pill selections, comment, saved to localStorage

## 🔬 Emission Factors

Based on **IPCC** and **DEFRA** published values:

- Flights: 0.255 kg CO₂e/km (economy) up to 1.02 (first class)
- Hotels: 1–20 kg CO₂e/night (camping to luxury)
- Diet: 2.5–7.5 kg CO₂e/person/day (vegan to omnivore)
- Transport: 0–0.21 kg CO₂e/km (walking to rental car)

## 🛠️ Tech Stack

- Pure HTML + CSS + JavaScript (no framework, no build step)
- [Chart.js 4](https://www.chartjs.org/) for visualisations
- Google Fonts (Syne + DM Sans)
- localStorage for data persistence

## 🖥️ Running Locally

```bash
# Option 1: Just open index.html in a browser
open index.html

# Option 2: Use VS Code Live Server extension
# Right-click index.html → Open with Live Server

# Option 3: Python simple server
python3 -m http.server 3000
# then visit http://localhost:3000
```

## 🌱 GitHub Setup

```bash
git init
git add .
git commit -m "Initial commit — EcoTrack carbon dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ecotrack.git
git push -u origin main
```

---

Built with 💚 for the Green Internship Programme
