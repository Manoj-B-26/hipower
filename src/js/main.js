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
  initDocPopups();
});

/**
 * Open document or video links in a popup window rather than a new tab
 */
export function openDocPopup(e, url) {
  if (e && e.preventDefault) {
    e.preventDefault();
  }
  const targetUrl = url || (e && e.currentTarget && e.currentTarget.href);
  if (!targetUrl || targetUrl === '#' || targetUrl.startsWith('javascript:')) return false;

  const width = Math.min(1060, Math.round(window.screen.availWidth * 0.9));
  const height = Math.min(820, Math.round(window.screen.availHeight * 0.9));
  const left = Math.max(0, Math.round((window.screen.availWidth - width) / 2));
  const top = Math.max(0, Math.round((window.screen.availHeight - height) / 2));

  const popup = window.open(
    targetUrl,
    'HiPowerDocPopup',
    `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no,location=no`
  );
  if (popup && !popup.closed) {
    popup.focus();
  }
  return false;
}
if (typeof window !== 'undefined') {
  window.openDocPopup = openDocPopup;
  window.openDocViewer = openDocPopup;
}

function initDocPopups() {
  document.addEventListener('click', (e) => {
    const docLink = e.target.closest('.modal-doc-link');
    if (docLink && docLink.href && !docLink.href.startsWith('javascript:')) {
      e.preventDefault();
      openDocPopup(e, docLink.href);
    }
  });
}

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
