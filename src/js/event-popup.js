/**
 * Event Announcement Popup Modal
 * Displays summit flyer 5 seconds after page loads and website animations play
 */

export function initEventPopup() {
  const modal = document.getElementById('event-popup-modal');
  if (!modal) return;

  const closeBtn = document.getElementById('event-popup-close');

  function openPopup() {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('event-popup-active');
  }

  function closePopup() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('event-popup-active');
  }

  function triggerAfterFiveSeconds() {
    // 5 seconds delay after website animations and content load
    setTimeout(openPopup, 5000);
  }

  const preloader = document.getElementById('preloader');
  const isPreloaderActive = preloader && preloader.style.display !== 'none' && !sessionStorage.getItem('hasLoadedBefore');

  if (isPreloaderActive) {
    // Preloader is present: wait for load + fadeout, then start the 5-second timer
    window.addEventListener('load', () => {
      setTimeout(triggerAfterFiveSeconds, 800);
    });
    // Safety fallback in case load event already fired
    setTimeout(triggerAfterFiveSeconds, 8500);
  } else {
    // If preloader is bypassed or page is already loaded
    if (document.readyState === 'complete') {
      triggerAfterFiveSeconds();
    } else {
      window.addEventListener('load', triggerAfterFiveSeconds);
    }
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      closePopup();
    });
  }

  // Backdrop click closes modal
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closePopup();
    }
  });

  // ESC key closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closePopup();
    }
  });
}
