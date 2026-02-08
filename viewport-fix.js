// ===============================
// CRITICAL: Add this to the TOP of your script.js
// Fixes Android Chrome/iOS Safari viewport height
// ===============================

(function() {
  // Fix viewport height for mobile browsers
  function setVH() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  // Set on load
  setVH();

  // Update on resize (debounced)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setVH, 100);
  });

  // Update on orientation change
  window.addEventListener('orientationchange', () => {
    setTimeout(setVH, 100);
  });

  // Prevent pinch-zoom on iOS
  document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
  });

  // Prevent double-tap zoom on iOS
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });

  console.log('✅ Mobile viewport fix applied');
})();