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
      messageTextarea.value = `I would like to get a quote for the following Vertiv product:\nProduct: ${name || ''}\nPart Number (MPN): ${mpn || ''}\n\nPlease share the pricing, availability, and delivery timelines.`;
    }
  }
}

function handleSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const name = form.querySelector('#name').value.trim();
  const email = form.querySelector('#email').value.trim();
  const phone = form.querySelector('#phone').value.trim();
  const company = form.querySelector('#company').value.trim();
  const message = form.querySelector('#message').value.trim();

  // Clear previous errors
  form.querySelectorAll('.form-error').forEach(el => el.remove());

  // Validate
  let isValid = true;

  if (!name) {
    showError(form.querySelector('#name'), 'Name is required');
    isValid = false;
  }

  if (!email || !isValidEmail(email)) {
    showError(form.querySelector('#email'), 'Valid email is required');
    isValid = false;
  }

  if (!phone || phone.length < 10) {
    showError(form.querySelector('#phone'), 'Valid phone number is required');
    isValid = false;
  }

  if (!message) {
    showError(form.querySelector('#message'), 'Message is required');
    isValid = false;
  }

  if (!isValid) return;

  // Compose WhatsApp message
  const whatsappMessage = encodeURIComponent(
    `*New Enquiry from Website*\n\n` +
    `*Name:* ${name}\n` +
    `*Email:* ${email}\n` +
    `*Phone:* ${phone}\n` +
    `${company ? `*Company:* ${company}\n` : ''}` +
    `*Message:* ${message}`
  );

  // Open WhatsApp (using HiPower's number)
  const whatsappUrl = `https://wa.me/919845abortnumber?text=${whatsappMessage}`;

  // Show success state
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '✓ Message Sent!';
  submitBtn.style.background = '#10B981';
  submitBtn.disabled = true;

  setTimeout(() => {
    submitBtn.innerHTML = originalText;
    submitBtn.style.background = '';
    submitBtn.disabled = false;
    form.reset();
  }, 3000);

  // Also open WhatsApp
  // window.open(whatsappUrl, '_blank');
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
