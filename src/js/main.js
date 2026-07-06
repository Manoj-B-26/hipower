/* ============================================
   HiPower — Main Application Entry
   ============================================ */

import { initNavbar } from './navbar.js';
import { initAnimations } from './animations.js';

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initAnimations();
  initActiveNav();
  initPreloader();
});

function initPreloader() {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    if (preloader.style.display === 'none') {
      return;
    }
    
    // Set flag for subsequent loads
    sessionStorage.setItem('hasLoadedBefore', 'true');
    
    window.addEventListener('load', () => {
      preloader.classList.add('fade-out');
    });
    // Safety fallback
    setTimeout(() => {
      preloader.classList.add('fade-out');
    }, 3000);
  }
}

/**
 * Highlight the current page in the navbar
 */
function initActiveNav() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-links a:not(.nav-cta)');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (
      (currentPage === '' && href === 'index.html') ||
      (currentPage === '/' && href === 'index.html') ||
      href === currentPage
    ) {
      link.classList.add('active');
    }
  });
}
