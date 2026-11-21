// ============================================================
// GOOGLE APPS SCRIPT WEB APP URL
// Replace the placeholder below with the deployed Apps Script URL
// after following the setup instructions in register-appscript-setup.md
// ============================================================
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxPkXFzm1Is3y3BCGCAGAhIkI9TuuFoz__2IA-NkPwlsgoMEtIDwE7gpW6luJmJOtKUJg/exec';

export function initRegisterForm() {
  const form = document.getElementById('register-form');
  const submitBtn = document.getElementById('register-submit');
  const successPanel = document.getElementById('register-success');
  const formWrapper = document.getElementById('register-form-wrapper');
  const errorMsg = document.getElementById('form-error-msg');

  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Basic validation
    const requiredFields = form.querySelectorAll('[required]');
    let valid = true;
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        field.style.borderColor = 'var(--accent)';
        valid = false;
      } else {
        field.style.borderColor = '';
      }
    });

    if (!valid) {
      errorMsg.textContent = '⚠️ Please fill in all required fields.';
      errorMsg.classList.add('visible');
      return;
    }

    // Spam trap check
    const honey = form.querySelector('[name="_honey"]');
    if (honey && honey.value) return;

    // Gather data
    const data = {
      timestamp: new Date().toISOString(),
      first_name: form.first_name.value.trim(),
      last_name: form.last_name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      job_title: form.job_title.value.trim(),
      i_am_a: form.i_am_a.value,
      company: form.company.value.trim(),
      country: form.country.value,
      industry: form.industry.value,
      city: form.city.value.trim(),
      comments: form.comments.value.trim()
    };

    // Loading state
    submitBtn.classList.add('btn-loading');
    submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Submitting...';
    errorMsg.classList.remove('visible');

    try {
      if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE') {
        // Demo mode: simulate success after 1 second
        await new Promise(r => setTimeout(r, 1000));
        showSuccess();
        return;
      }

      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      // no-cors means we can't read response body, but treat no error as success
      showSuccess();

    } catch (err) {
      console.error('Registration error:', err);
      submitBtn.classList.remove('btn-loading');
      submitBtn.innerHTML = 'Register Now';
      errorMsg.textContent = '⚠️ Something went wrong. Please try again or call us directly.';
      errorMsg.classList.add('visible');
    }
  });

  function showSuccess() {
    formWrapper.style.display = 'none';
    successPanel.classList.add('visible');
    window.scrollTo({ top: successPanel.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRegisterForm);
} else {
  initRegisterForm();
}
