/* ============================================
   Contact Form — Validation & WhatsApp
   ============================================ */

export function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', handleSubmit);

  // Auto-fill from URL parameters if available
  const params = new URLSearchParams(window.location.search);
  const mpn = params.get('mpn');
  const name = params.get('name');
  if (mpn || name) {
    const serviceSelect = form.querySelector('#service');
    if (serviceSelect) {
      serviceSelect.value = 'products'; // Product Purchase
    }
    const messageTextarea = form.querySelector('#message');
    if (messageTextarea) {
      messageTextarea.value = `I would like to get a quote for the following Vertiv product:\nProduct: ${name || ''}\n\nPlease share the pricing, availability, and delivery timelines.`;
    }
  }
}

function handleSubmit(e) {
  const form = e.target;
  const name = form.querySelector('#name').value.trim();
  const email = form.querySelector('#email').value.trim();
  const phone = form.querySelector('#phone').value.trim();
  const message = form.querySelector('#message').value.trim();

  // Clear previous errors
  form.querySelectorAll('.form-error').forEach(el => el.remove());

  // Validate
  let isValid = true;

  if (!name) {
    e.preventDefault();
    showError(form.querySelector('#name'), 'Name is required');
    isValid = false;
  }

  if (!email || !isValidEmail(email)) {
    e.preventDefault();
    showError(form.querySelector('#email'), 'Valid email is required');
    isValid = false;
  }

  if (!phone || phone.length < 10) {
    e.preventDefault();
    showError(form.querySelector('#phone'), 'Valid phone number is required');
    isValid = false;
  }

  if (!message) {
    e.preventDefault();
    showError(form.querySelector('#message'), 'Message is required');
    isValid = false;
  }

  if (!isValid) return;

  // Show loading state
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Sending...';
  submitBtn.disabled = true;

  // Form will submit naturally to FormSubmit
  // FormSubmit will redirect to a thank you page or back to the form
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(input, message) {
  const error = document.createElement('span');
  error.className = 'form-error';
  error.textContent = message;
  error.style.cssText = 'color: #EF4444; font-size: 0.75rem; display: block; margin-top: 4px;';
  input.parentNode.appendChild(error);
  input.style.borderColor = '#EF4444';

  input.addEventListener('focus', () => {
    input.style.borderColor = '';
    const err = input.parentNode.querySelector('.form-error');
    if (err) err.remove();
  }, { once: true });
}

// Auto-init
document.addEventListener('DOMContentLoaded', initContactForm);
