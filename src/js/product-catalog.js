/* ============================================
   HiPower — Product Catalog Module
   3-tier navigation: Landing → Subcategory → Product Grid
   ============================================ */

import { products } from './products-summary.js';
import { openDocPopup } from './main.js';

// ---- Navigation State ----
let currentView = 'landing';        // 'landing' | 'subcategory' | 'products'
let selectedTopCategory = null;     // e.g. 'power'
let selectedSubCategory = null;     // e.g. 'General Purpose UPS'
let filteredProducts = [];
let currentPage = 1;
const PRODUCTS_PER_PAGE = 12;
let searchQuery = '';

// ---- Category Hierarchy ----
const CATEGORY_HIERARCHY = {
  power: {
    label: 'Power Management',
    icon: '⚡',
    color: 'var(--accent)',
    glowColor: 'rgba(225, 45, 57, 0.15)',
    gradient: 'linear-gradient(135deg, #E12D39 0%, #FF6B6B 100%)',
    description: 'Uninterruptible Power Supplies, Power Distribution Units, and Industrial Power Solutions to keep your infrastructure running 24/7.',
    subcategories: [
      { key: 'General Purpose UPS', label: 'UPS Systems', icon: '⚡', color: 'var(--accent)' },
      { key: 'PDUs', label: 'Power Distribution', icon: '🔌', color: 'var(--emerald)' },
      { key: 'Industrial UPS', label: 'Industrial UPS', icon: '🏭', color: 'var(--amber)' },
    ]
  },
  thermal: {
    label: 'Thermal Management',
    icon: '❄️',
    color: 'var(--cyan)',
    glowColor: 'rgba(8, 145, 178, 0.15)',
    gradient: 'linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)',
    description: 'Precision cooling systems engineered for data centers, server rooms, and telecom shelters to maintain optimal operating temperatures.',
    subcategories: [
      { key: 'Cooling Systems', label: 'Cooling Systems', icon: '❄️', color: 'var(--cyan)' },
    ]
  },
  itinfra: {
    label: 'IT Infra Management',
    icon: '🖥️',
    color: 'var(--purple)',
    glowColor: 'rgba(124, 58, 237, 0.15)',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
    description: 'KVM Switches, Rack Consoles, Panels, Batteries, and Infrastructure Management solutions for complete IT infrastructure control.',
    subcategories: [
      { key: 'KVM Switchboxes', label: 'KVM Switches', icon: '🖥️', color: 'var(--purple)' },
      { key: 'Rackmount LCDs', label: 'Rack Console', icon: '📺', color: 'var(--blue)' },
      { key: 'Panels', label: 'Panels', icon: '🔲', color: 'var(--text-secondary)' },
      { key: 'UPS Batteries', label: 'Batteries', icon: '🔋', color: 'var(--emerald)' },
      { key: 'Poles & Handles', label: 'Rack Accessories', icon: '🔧', color: 'var(--amber)' },
      { key: 'Rack Equipment', label: 'Rack Equipment', icon: '🗄️', color: 'var(--teal)' },
      { key: 'Infrastructure Management Equipment', label: 'Infrastructure Mgmt', icon: '📡', color: 'var(--blue)' },
    ]
  }
};

// ---- Flat category config for product cards/modal ----
const CATEGORY_CONFIG = {};
Object.values(CATEGORY_HIERARCHY).forEach(top => {
  top.subcategories.forEach(sub => {
    CATEGORY_CONFIG[sub.key] = { label: sub.label, icon: sub.icon, color: sub.color };
  });
});

// ---- Brand icon mapping ----
const BRAND_COLORS = {
  'Liebert': 'var(--accent)',
  'AVOCENT': 'var(--blue)',
  'VERTIV': 'var(--emerald)',
  'Geist': 'var(--purple)',
};

// ---- Helper: count products for a top-level category ----
function countTopCategory(topKey) {
  const top = CATEGORY_HIERARCHY[topKey];
  if (!top) return 0;
  const keys = top.subcategories.map(s => s.key);
  return products.filter(p => keys.includes(p.category)).length;
}

// ---- Helper: count products for a subcategory ----
function countSubCategory(subKey) {
  return products.filter(p => p.category === subKey).length;
}

export function initProductCatalog() {
  const catalogContainer = document.getElementById('product-catalog');
  if (!catalogContainer) return;

  // Initialize modal
  initModal();

  // Read URL search parameters for navigation
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('cat');
  const sub = params.get('sub');

  if (sub) {
    let topCat = cat;
    if (!topCat) {
      for (const [tKey, tVal] of Object.entries(CATEGORY_HIERARCHY)) {
        if (tVal.subcategories.some(s => s.key === sub)) {
          topCat = tKey;
          break;
        }
      }
    }
    navigateTo('products', topCat, sub, false);
  } else if (cat) {
    navigateTo('subcategory', cat, null, false);
  } else {
    // Render the landing view
    navigateTo('landing', null, null, false);
  }
}

// ---- NAVIGATION ----

function navigateTo(view, topCat, subCat, shouldScroll = true) {
  currentView = view;
  selectedTopCategory = topCat || null;
  selectedSubCategory = subCat || null;
  currentPage = 1;
  searchQuery = '';

  // Toggle visibility of sections
  const landingEl = document.getElementById('category-landing');
  const subcatEl = document.getElementById('subcategory-view');
  const catalogSection = document.getElementById('product-catalog');
  const toolbarEl = document.querySelector('.catalog-toolbar');
  const resultBar = document.querySelector('.catalog-result-bar');
  const gridEl = document.getElementById('product-grid');
  const paginationEl = document.getElementById('product-pagination');
  const statsEl = document.querySelector('.catalog-stats');
  const breadcrumbEl = document.getElementById('catalog-breadcrumb');

  // Reset all to hidden
  if (landingEl) landingEl.style.display = 'none';
  if (subcatEl) subcatEl.style.display = 'none';
  if (toolbarEl) toolbarEl.style.display = 'none';
  if (resultBar) resultBar.style.display = 'none';
  if (gridEl) gridEl.style.display = 'none';
  if (paginationEl) paginationEl.style.display = 'none';

  switch (view) {
    case 'landing':
      if (statsEl) statsEl.style.display = '';
      if (landingEl) landingEl.style.display = '';
      if (breadcrumbEl) breadcrumbEl.style.display = 'none';
      renderLandingView();
      break;

    case 'subcategory':
      if (statsEl) statsEl.style.display = 'none';
      if (subcatEl) subcatEl.style.display = '';
      if (breadcrumbEl) breadcrumbEl.style.display = '';
      renderBreadcrumb();
      renderSubcategoryView();
      break;

    case 'products':
      if (statsEl) statsEl.style.display = 'none';
      if (toolbarEl) { toolbarEl.style.display = ''; }
      if (resultBar) resultBar.style.display = '';
      if (gridEl) gridEl.style.display = '';
      if (paginationEl) paginationEl.style.display = '';
      if (breadcrumbEl) breadcrumbEl.style.display = '';
      renderBreadcrumb();
      applyFilters();
      renderProducts();
      renderPagination();
      updateResultCount();
      renderSearchBar();
      break;
  }

  // Scroll to top of catalog
  if (shouldScroll) {
    catalogSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ---- BREADCRUMB ----

function renderBreadcrumb() {
  const el = document.getElementById('catalog-breadcrumb');
  if (!el) return;

  let html = '<nav class="breadcrumb-nav" aria-label="Breadcrumb"><ol class="breadcrumb-list">';

  // Home: Products
  html += `<li class="breadcrumb-item">
    <button class="breadcrumb-link" data-nav="landing">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      Products
    </button>
  </li>`;

  if (selectedTopCategory) {
    const top = CATEGORY_HIERARCHY[selectedTopCategory];
    if (currentView === 'subcategory') {
      html += `<li class="breadcrumb-item breadcrumb-current">
        <span>${top.icon} ${top.label}</span>
      </li>`;
    } else {
      html += `<li class="breadcrumb-item">
        <button class="breadcrumb-link" data-nav="subcategory" data-top="${selectedTopCategory}">
          ${top.icon} ${top.label}
        </button>
      </li>`;
    }
  }

  if (selectedSubCategory) {
    const config = CATEGORY_CONFIG[selectedSubCategory];
    html += `<li class="breadcrumb-item breadcrumb-current">
      <span>${config?.icon || '📦'} ${config?.label || selectedSubCategory}</span>
    </li>`;
  }

  html += '</ol></nav>';
  el.innerHTML = html;

  // Attach breadcrumb click listeners
  el.querySelectorAll('.breadcrumb-link').forEach(btn => {
    btn.addEventListener('click', () => {
      const nav = btn.dataset.nav;
      if (nav === 'landing') {
        navigateTo('landing');
      } else if (nav === 'subcategory') {
        navigateTo('subcategory', btn.dataset.top);
      }
    });
  });
}

// ---- LANDING VIEW ----

function renderLandingView() {
  const container = document.getElementById('category-landing');
  if (!container) return;

  let html = '<div class="landing-grid">';

  Object.entries(CATEGORY_HIERARCHY).forEach(([key, cat], index) => {
    const count = countTopCategory(key);
    const subLabels = cat.subcategories.map(s => s.label).join(' · ');

    html += `
      <div class="landing-card" data-top-category="${key}" style="animation-delay: ${index * 0.15}s">
        <div class="landing-card-glow" style="background: ${cat.glowColor};"></div>
        <div class="landing-card-accent" style="background: ${cat.gradient};"></div>
        <div class="landing-card-content">
          <div class="landing-card-icon" style="background: ${cat.gradient};">
            <span>${cat.icon}</span>
          </div>
          <h3 class="landing-card-title">${cat.label}</h3>
          <p class="landing-card-desc">${cat.description}</p>
          <div class="landing-card-subs">${subLabels}</div>
          <div class="landing-card-footer">
            <span class="landing-card-count">
              <strong>${count}</strong> Products
            </span>
            <span class="landing-card-arrow">
              Explore
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </span>
          </div>
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;

  // Attach click listeners
  container.querySelectorAll('.landing-card').forEach(card => {
    card.addEventListener('click', () => {
      const topKey = card.dataset.topCategory;
      const top = CATEGORY_HIERARCHY[topKey];
      // If only one subcategory, go directly to products
      if (top.subcategories.length === 1) {
        navigateTo('products', topKey, top.subcategories[0].key);
      } else {
        navigateTo('subcategory', topKey);
      }
    });
  });

  // Trigger entrance animation
  requestAnimationFrame(() => {
    container.querySelectorAll('.landing-card').forEach(card => {
      card.classList.add('revealed');
    });
  });
}

// ---- SUBCATEGORY VIEW ----

function renderSubcategoryView() {
  const container = document.getElementById('subcategory-view');
  if (!container) return;

  const top = CATEGORY_HIERARCHY[selectedTopCategory];
  if (!top) return;

  let html = `
    <div class="subcat-header">
      <div class="subcat-header-icon" style="background: ${top.gradient};">
        <span>${top.icon}</span>
      </div>
      <div class="subcat-header-text">
        <h2>${top.label}</h2>
        <p>${top.description}</p>
      </div>
    </div>
    <div class="subcat-grid">
  `;

  top.subcategories.forEach((sub, index) => {
    const count = countSubCategory(sub.key);
    html += `
      <div class="subcat-card" data-sub-category="${sub.key}" style="animation-delay: ${index * 0.1}s">
        <div class="subcat-card-icon" style="color: ${sub.color};">
          ${sub.icon}
        </div>
        <div class="subcat-card-info">
          <h4 class="subcat-card-title">${sub.label}</h4>
          <span class="subcat-card-count">${count} product${count !== 1 ? 's' : ''}</span>
        </div>
        <div class="subcat-card-arrow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </div>
      </div>
    `;
  });

  html += '</div>';

  // View All button
  const totalCount = countTopCategory(selectedTopCategory);
  html += `
    <div class="subcat-view-all">
      <button class="btn btn-outline-primary btn-lg subcat-view-all-btn" data-top="${selectedTopCategory}">
        View All ${top.label} Products <span class="subcat-view-all-count">(${totalCount})</span>
      </button>
    </div>
  `;

  container.innerHTML = html;

  // Attach click listeners for subcategory cards
  container.querySelectorAll('.subcat-card').forEach(card => {
    card.addEventListener('click', () => {
      navigateTo('products', selectedTopCategory, card.dataset.subCategory);
    });
  });

  // View All button
  container.querySelector('.subcat-view-all-btn')?.addEventListener('click', () => {
    navigateTo('products', selectedTopCategory, null);
  });

  // Trigger entrance animation
  requestAnimationFrame(() => {
    container.querySelectorAll('.subcat-card').forEach(card => {
      card.classList.add('revealed');
    });
  });
}

// ---- SEARCH ----

function renderSearchBar() {
  const searchInput = document.getElementById('product-search');
  if (!searchInput) return;

  // Clear previous value
  searchInput.value = '';

  // Remove old listeners by cloning
  const newInput = searchInput.cloneNode(true);
  searchInput.parentNode.replaceChild(newInput, searchInput);

  let debounceTimer;
  newInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchQuery = e.target.value.trim().toLowerCase();
      currentPage = 1;
      applyFilters();
      renderProducts();
      renderPagination();
      updateResultCount();
    }, 300);
  });
}

// ---- FILTERS ----

function applyFilters() {
  const top = CATEGORY_HIERARCHY[selectedTopCategory];

  filteredProducts = products.filter(p => {
    // Category filter
    if (selectedSubCategory) {
      // Filter to specific subcategory
      if (p.category !== selectedSubCategory) return false;
    } else if (top) {
      // Filter to all subcategories of this top-level category
      const keys = top.subcategories.map(s => s.key);
      if (!keys.includes(p.category)) return false;
    }

    // Search filter
    if (searchQuery) {
      const searchStr = `${p.name} ${p.mpn} ${p.brand} ${p.productType} ${p.marketing} ${p.category} ${p.fullDescription || ''} ${p.manufacturer || ''}`.toLowerCase();
      return searchStr.includes(searchQuery);
    }
    return true;
  });
}

function updateResultCount() {
  const countEl = document.getElementById('result-count');
  if (countEl) {
    const total = filteredProducts.length;
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE + 1;
    const end = Math.min(currentPage * PRODUCTS_PER_PAGE, total);
    if (total === 0) {
      countEl.textContent = 'No products found';
    } else {
      countEl.textContent = `Showing ${start}–${end} of ${total} products`;
    }
  }
}

// ---- PRODUCT CARDS ----

function renderProducts() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const pageProducts = filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);

  if (pageProducts.length === 0) {
    grid.innerHTML = `
      <div class="catalog-empty">
        <div class="catalog-empty-icon">🔍</div>
        <h3>No products found</h3>
        <p>Try adjusting your search or filter criteria.</p>
      </div>
    `;
    return;
  }

  let html = '';
  pageProducts.forEach((product, index) => {
    const config = CATEGORY_CONFIG[product.category] || { label: product.category, icon: '📦', color: 'var(--blue)' };
    const brandColor = BRAND_COLORS[product.brand] || 'var(--blue)';
    const displayName = product.name || product.mpn;
    // Truncate name if too long
    const shortName = displayName.length > 80 ? displayName.substring(0, 77) + '…' : displayName;
    const shortDesc = product.marketing
      ? (product.marketing.length > 120 ? product.marketing.substring(0, 117) + '…' : product.marketing)
      : product.longDesc || '';

    html += `
      <div class="product-card reveal" style="animation-delay: ${index * 0.05}s" data-product-id="${product.id}">
        <a href="/products/${product.id}/" class="product-card-image">
          <img src="${product.image}" alt="${shortName}" loading="lazy"
               onerror="this.onerror=null; this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22><rect fill=%22%23f0ebe0%22 width=%22400%22 height=%22300%22/><text x=%22200%22 y=%22150%22 fill=%22%232B7DE9%22 font-size=%2248%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22 font-family=%22Inter,sans-serif%22>${encodeURIComponent(config.icon)}</text></svg>';" />
          <div class="product-card-badge" style="background: ${config.color};">
            <span>${config.icon}</span> ${config.label}
          </div>
        </a>
        <div class="product-card-body">
          <div class="product-card-brand" style="color: ${brandColor};">${product.brand}</div>
          <h3 class="product-card-title">${shortName}</h3>
          <p class="product-card-desc">${shortDesc}</p>
          <div class="product-card-meta">
            <span class="product-card-type">${product.productType}</span>
          </div>
        </div>
        <div class="product-card-footer">
          <a href="/products/${product.id}/" class="btn btn-sm btn-outline-primary">
            View Details
          </a>
          <a href="/contact.html?mpn=${encodeURIComponent(product.mpn)}&name=${encodeURIComponent(product.name)}" class="btn btn-sm btn-primary">Get Quote</a>
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;

  // Trigger reveal animations
  requestAnimationFrame(() => {
    grid.querySelectorAll('.product-card').forEach(card => {
      card.classList.add('revealed');
    });
  });
}

// ---- PAGINATION ----

function renderPagination() {
  const container = document.getElementById('product-pagination');
  if (!container) return;

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';

  // Prev button
  html += `<button class="page-btn page-prev ${currentPage === 1 ? 'disabled' : ''}" ${currentPage === 1 ? 'disabled' : ''}>
    ← Prev
  </button>`;

  // Page numbers
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  if (startPage > 1) {
    html += `<button class="page-btn" data-page="1">1</button>`;
    if (startPage > 2) html += `<span class="page-dots">…</span>`;
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += `<span class="page-dots">…</span>`;
    html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
  }

  // Next button
  html += `<button class="page-btn page-next ${currentPage === totalPages ? 'disabled' : ''}" ${currentPage === totalPages ? 'disabled' : ''}>
    Next →
  </button>`;

  container.innerHTML = html;

  // Listeners
  container.querySelectorAll('.page-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page);
      renderProducts();
      renderPagination();
      updateResultCount();
      document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  container.querySelector('.page-prev')?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderProducts();
      renderPagination();
      updateResultCount();
      document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  container.querySelector('.page-next')?.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
    if (currentPage < totalPages) {
      currentPage++;
      renderProducts();
      renderPagination();
      updateResultCount();
      document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

// ---- PRODUCT DETAIL MODAL ----

function initModal() {
  const modal = document.getElementById('product-modal');
  if (!modal) return;

  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('modal-overlay')) {
      closeProductModal();
    }
  });

  // Close button
  modal.querySelector('.modal-close')?.addEventListener('click', closeProductModal);

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeProductModal();
  });
}

function openProductModal(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById('product-modal');
  const body = modal.querySelector('.modal-body');
  if (!modal || !body) return;

  const config = CATEGORY_CONFIG[product.category] || { label: product.category, icon: '📦', color: 'var(--blue)' };
  const brandColor = BRAND_COLORS[product.brand] || 'var(--blue)';

  // Build image gallery - collect unique gallery images
  const galleryImages = [];
  const mainImage = product.image || (product.images && product.images['500']) || '';
  if (mainImage) galleryImages.push({ url: mainImage, label: 'Front' });

  if (product.images) {
    // Add directional views
    const viewOrder = ['Front', 'Rear', 'Left', 'Right', 'Top', 'Life-Style'];
    viewOrder.forEach(view => {
      if (product.images[view] && !galleryImages.some(g => g.url === product.images[view])) {
        galleryImages.push({ url: product.images[view], label: view.replace('-', ' ') });
      }
    });
    // Add alternate images
    for (let i = 1; i <= 6; i++) {
      const key = 'Alternate-Image' + i;
      if (product.images[key] && !galleryImages.some(g => g.url === product.images[key])) {
        galleryImages.push({ url: product.images[key], label: 'View ' + (galleryImages.length) });
      }
    }
  }

  // Build gallery HTML
  let galleryHtml = '';
  if (galleryImages.length > 1) {
    galleryHtml = `
      <div class="modal-gallery-thumbs">
        ${galleryImages.map((img, i) => `
          <button class="gallery-thumb ${i === 0 ? 'active' : ''}" data-img-url="${img.url}" title="${img.label}">
            <img src="${img.url.replace('/500/', '/75/')}" alt="${img.label}" loading="lazy" />
          </button>
        `).join('')}
      </div>
    `;
  }

  // Build features list
  let featuresHtml = '';
  if (product.features && product.features.length > 0) {
    featuresHtml = `
      <div class="modal-features-list">
        <h4>Key Features</h4>
        <ul>
          ${product.features.map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  // Tech specs - use HTML version if available (richest format), fallback to line-separated
  let techSpecsHtml = '';
  if (product.techSpecsHtml) {
    const cleanTechSpecsHtml = product.techSpecsHtml.replace(/<tr>\s*<td>\s*Manufacturer Part Number\s*<\/td>[\s\S]*?<\/tr>/gi, '');
    techSpecsHtml = `
      <div class="modal-specs">
        <h4>Technical Specifications</h4>
        <div class="specs-html-content">
          ${cleanTechSpecsHtml}
        </div>
      </div>
    `;
  } else if (product.techSpecs) {
    const lines = product.techSpecs.split('\n')
      .filter(l => l.trim() && !l.toLowerCase().includes('part number'));
    techSpecsHtml = `
      <div class="modal-specs">
        <h4>Technical Specifications</h4>
        <div class="specs-grid">
          ${lines.map(line => {
            const parts = line.split(':');
            if (parts.length >= 2) {
              return `<div class="spec-row">
                <span class="spec-label">${parts[0].trim()}</span>
                <span class="spec-value">${parts.slice(1).join(':').trim()}</span>
              </div>`;
            }
            return `<div class="spec-row"><span class="spec-value" style="grid-column: 1/-1">${line.trim()}</span></div>`;
          }).join('')}
        </div>
      </div>
    `;
  }

  // Documents section (PDFs + Video)
  let documentsHtml = '';
  const docs = [];
  if (product.pdfBrochure) {
    docs.push(`<a href="${product.pdfBrochure}" class="modal-doc-link" onclick="openDocPopup(event, this.href); return false;">
      <span class="modal-doc-icon">📄</span>
      <span>Product Brochure</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
    </a>`);
  }
  if (product.pdfManual) {
    docs.push(`<a href="${product.pdfManual}" class="modal-doc-link" onclick="openDocPopup(event, this.href); return false;">
      <span class="modal-doc-icon">📘</span>
      <span>User Manual</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
    </a>`);
  }
  if (product.videoTour) {
    docs.push(`<a href="${product.videoTour}" class="modal-doc-link modal-doc-video" onclick="openDocPopup(event, this.href); return false;">
      <span class="modal-doc-icon">🎬</span>
      <span>Product Video</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
    </a>`);
  }
  if (docs.length > 0) {
    documentsHtml = `
      <div class="modal-documents">
        <h4>Documents & Resources</h4>
        <div class="modal-docs-grid">${docs.join('')}</div>
      </div>
    `;
  }

  // Product identifiers
  let identifiersHtml = '';
  const ids = [];
  if (product.manufacturer) ids.push(`<span class="modal-id-item"><strong>Manufacturer:</strong> ${product.manufacturer}</span>`);
  if (product.productType) ids.push(`<span class="modal-id-item"><strong>Type:</strong> ${product.productType}</span>`);
  if (product.unspsc) ids.push(`<span class="modal-id-item"><strong>UNSPSC:</strong> ${product.unspsc}</span>`);
  if (product.gtin) ids.push(`<span class="modal-id-item"><strong>GTIN:</strong> ${product.gtin}</span>`);
  if (product.upc) ids.push(`<span class="modal-id-item"><strong>UPC:</strong> ${product.upc}</span>`);
  if (product.ean) ids.push(`<span class="modal-id-item"><strong>EAN:</strong> ${product.ean}</span>`);
  if (ids.length > 0) {
    identifiersHtml = `<div class="modal-identifiers">${ids.join('')}</div>`;
  }

  // Full description
  let fullDescHtml = '';
  if (product.fullDescription && product.fullDescription !== product.name) {
    fullDescHtml = `<div class="modal-full-desc">${product.fullDescription}</div>`;
  }

  body.innerHTML = `
    <div class="modal-product">
      <div class="modal-product-image-col">
        <div class="modal-product-image" id="modal-main-image">
          <img src="${mainImage}" alt="${product.name || product.mpn}" 
               onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'modal-image-placeholder\\'>${config.icon}</div>';" />
        </div>
        ${galleryHtml}
      </div>
      <div class="modal-product-info">
        <div class="modal-product-badges">
          <span class="modal-badge" style="background: ${config.color};">${config.icon} ${config.label}</span>
          <span class="modal-badge modal-badge-brand" style="border-color: ${brandColor}; color: ${brandColor};">${product.brand}</span>
        </div>
        <h2 class="modal-product-name">${product.name || product.mpn}</h2>
        ${identifiersHtml}
        ${product.marketing ? `<div class="modal-product-desc">${product.marketing}</div>` : ''}
        ${fullDescHtml}
        ${featuresHtml}
        ${documentsHtml}
        ${techSpecsHtml}
        <div class="modal-actions">
          <a href="contact.html" class="btn btn-primary btn-lg">Request Quote</a>
          <a href="tel:+919187065455" class="btn btn-outline-primary btn-lg">📞 Call Us</a>
        </div>
      </div>
    </div>
  `;

  // Attach gallery thumbnail listeners
  body.querySelectorAll('.gallery-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const imgUrl = thumb.dataset.imgUrl;
      const mainImg = body.querySelector('#modal-main-image img');
      if (mainImg) {
        mainImg.src = imgUrl;
      }
      body.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  const modal = document.getElementById('product-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}
