/* main.js */
document.addEventListener('DOMContentLoaded', () => {
  // Guard calculator page — must have user data first
  if (document.getElementById('tripForm')) {
    if (!localStorage.getItem('ecotrack_user')) {
      window.location.href = 'register.html';
    }
    // Pre-fill saved trip if returning to edit
    const saved = localStorage.getItem('ecotrack_trip');
    if (saved) {
      const data = JSON.parse(saved);
      Object.entries(data).forEach(([key, val]) => {
        const el = document.getElementById(key) || document.querySelector('[name="' + key + '"]');
        if (el) el.value = val;
      });
    }
  }
});
