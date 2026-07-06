/* ============================================
   Scroll Animations, Counters & Glass Effects
   ============================================ */

export function initAnimations() {
  initScrollReveal();
  initCounters();
  initParallaxOrbs();
  initGlassCardTilt();
}

/**
 * IntersectionObserver-based scroll reveal with stagger
 */
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');

  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Add a small delay based on data attribute or class delay
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -30px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

/**
 * Animated number counters with spring easing
 */
function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');

  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-counter'), 10);
  const suffix = el.getAttribute('data-suffix') || '';
  const duration = 2200;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);

    // Spring-like ease out
    const eased = 1 - Math.pow(1 - progress, 4);
    const current = Math.round(eased * target);

    el.textContent = current.toLocaleString() + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/**
 * Subtle parallax on glass orbs following mouse
 */
function initParallaxOrbs() {
  const orbs = document.querySelectorAll('.orb');
  if (!orbs.length) return;

  let ticking = false;

  window.addEventListener('mousemove', (e) => {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;

      orbs.forEach((orb, i) => {
        const speed = (i + 1) * 8;
        const rotateSpeed = (i + 1) * 2;
        orb.style.transform = `translate(${x * speed}px, ${y * speed}px) rotate(${x * rotateSpeed}deg)`;
      });

      ticking = false;
    });
  }, { passive: true });
}

/**
 * Subtle 3D tilt effect on glass cards
 */
function initGlassCardTilt() {
  const cards = document.querySelectorAll('.card, .feature-glass, .industry-pill, .testimonial-card');
  if (!cards.length) return;

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -3;
      const rotateY = ((x - centerX) / centerX) * 3;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}
