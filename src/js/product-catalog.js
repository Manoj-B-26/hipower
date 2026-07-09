/* ============================================
   HiPower — Product Catalog Module
   Handles filtering, search, pagination, and
   product detail modal
   ============================================ */

import { products } from './products-data.js';

// ---- State ----
let filteredProducts = [...products];
let currentPage = 1;
const PRODUCTS_PER_PAGE = 12;
let activeCategory = 'all';
let searchQuery = '';

// ---- Category mapping for display ----
const CATEGORY_CONFIG = {
  'all': { label: 'All Products', icon: '📦', color: 'var(--blue)' },
  'General Purpose UPS': { label: 'UPS Systems', icon: '⚡', color: 'var(--accent)' },
  'Industrial UPS': { label: 'Industrial UPS', icon: '🏭', color: 'var(--amber)' },
  'Cooling Systems': { label: 'Cooling Systems', icon: '❄️', color: 'var(--cyan)' },
  'PDUs': { label: 'Power Distribution', icon: '🔌', color: 'var(--emerald)' },
  'KVM Switchboxes': { label: 'KVM Switches', icon: '🖥️', color: 'var(--purple)' },
  'Rackmount LCDs': { label: 'Rack Consoles', icon: '📺', color: 'var(--blue)' },
  'Software Licensing': { label: 'Software', icon: '💿', color: 'var(--teal)' },
  'Services': { label: 'Services', icon: '🛠️', color: 'var(--gold)' },
  'UPS Batteries': { label: 'Batteries', icon: '🔋', color: 'var(--emerald)' },
  'Panels': { label: 'Panels', icon: '🔲', color: 'var(--text-secondary)' },
  'Poles & Handles': { label: 'Rack Accessories', icon: '🔧', color: 'var(--text-secondary)' },
  'Rack Equipment': { label: 'Rack Equipment', icon: '🗄️', color: 'var(--text-secondary)' },
  'Infrastructure Management Equipment': { label: 'Infrastructure Mgmt', icon: '📡', color: 'var(--blue)' },
};

// ---- Brand icon mapping ----
const BRAND_COLORS = {
  'Liebert': 'var(--accent)',
  'AVOCENT': 'var(--blue)',
  'VERTIV': 'var(--emerald)',
  'Geist': 'var(--purple)',
};

/**
 * Initialize the product catalog on the products page
 */
export function initProductCatalog() {
  const catalogContainer = document.getElementById('product-catalog');
  if (!catalogContainer) return;

  renderCategoryFilters();
  renderSearchBar();
  applyFilters();
  renderProducts();
  renderPagination();
  initModal();
  updateResultCount();
}

// ---- FILTERS ----

function renderCategoryFilters() {
  const container = document.getElementById('category-filters');
  if (!container) return;

  // Count products per category
  const categoryCounts = {};
  products.forEach(p => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });

  let html = '';

  // All filter
  html += `<button class="cat-filter active" data-category="all">
    <span class="cat-filter-icon">📦</span>
    <span class="cat-filter-label">All Products</span>
    <span class="cat-filter-count">${products.length}</span>
  </button>`;

  // Sort categories by count descending
  const sortedCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1]);

  for (const [cat, count] of sortedCategories) {
    const config = CATEGORY_CONFIG[cat] || { label: cat, icon: '📦', color: 'var(--blue)' };
    html += `<button class="cat-filter" data-category="${cat}">
      <span class="cat-filter-icon">${config.icon}</span>
      <span class="cat-filter-label">${config.label}</span>
      <span class="cat-filter-count">${count}</span>
    </button>`;
  }

  container.innerHTML = html;

  // Attach click listeners
  container.querySelectorAll('.cat-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.cat-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.category;
      currentPage = 1;
      applyFilters();
      renderProducts();
      renderPagination();
      updateResultCount();
      // Scroll to grid
      document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function renderSearchBar() {
  const searchInput = document.getElementById('product-search');
  if (!searchInput) return;

  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
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

function applyFilters() {
  filteredProducts = products.filter(p => {
    // Category filter
    if (activeCategory !== 'all' && p.category !== activeCategory) return false;

    // Search filter
    if (searchQuery) {
      const searchStr = `${p.name} ${p.mpn} ${p.brand} ${p.productType} ${p.marketing} ${p.category}`.toLowerCase();
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
        <div class="product-card-image">
          <img src="${product.image}" alt="${shortName}" loading="lazy"
               onerror="this.onerror=null; this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22><rect fill=%22%23f0ebe0%22 width=%22400%22 height=%22300%22/><text x=%22200%22 y=%22150%22 fill=%22%232B7DE9%22 font-size=%2248%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22 font-family=%22Inter,sans-serif%22>${encodeURIComponent(config.icon)}</text></svg>';" />
          <div class="product-card-badge" style="background: ${config.color};">
            <span>${config.icon}</span> ${config.label}
          </div>
        </div>
        <div class="product-card-body">
          <div class="product-card-brand" style="color: ${brandColor};">${product.brand}</div>
          <h3 class="product-card-title">${shortName}</h3>
          <p class="product-card-desc">${shortDesc}</p>
          <div class="product-card-meta">
            <span class="product-card-mpn">${product.mpn}</span>
            <span class="product-card-type">${product.productType}</span>
          </div>
        </div>
        <div class="product-card-footer">
          <button class="btn btn-sm btn-outline-primary product-detail-btn" data-product-id="${product.id}">
            View Details
          </button>
          <a href="contact.html" class="btn btn-sm btn-primary">Get Quote</a>
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;

  // Attach detail button listeners
  grid.querySelectorAll('.product-detail-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const productId = btn.dataset.productId;
      openProductModal(productId);
    });
  });

  // Also allow clicking on product card image
  grid.querySelectorAll('.product-card-image').forEach(img => {
    img.addEventListener('click', () => {
      const card = img.closest('.product-card');
      const productId = card.dataset.productId;
      openProductModal(productId);
    });
  });

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

  // Parse tech specs
  let techSpecsHtml = '';
  if (product.techSpecs) {
    const lines = product.techSpecs.split('\n').filter(l => l.trim());
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

  body.innerHTML = `
    <div class="modal-product">
      <div class="modal-product-image">
        <img src="${product.image}" alt="${product.name || product.mpn}" 
             onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'modal-image-placeholder\\'>${config.icon}</div>';" />
      </div>
      <div class="modal-product-info">
        <div class="modal-product-badges">
          <span class="modal-badge" style="background: ${config.color};">${config.icon} ${config.label}</span>
          <span class="modal-badge modal-badge-brand" style="border-color: ${brandColor}; color: ${brandColor};">${product.brand}</span>
        </div>
        <h2 class="modal-product-name">${product.name || product.mpn}</h2>
        <div class="modal-product-mpn">
          <span class="mpn-label">Part Number:</span>
          <span class="mpn-value">${product.mpn}</span>
        </div>
        ${product.marketing ? `<div class="modal-product-desc">${product.marketing}</div>` : ''}
        ${product.longDesc ? `<div class="modal-product-features"><strong>Key Features:</strong> ${product.longDesc}</div>` : ''}
        ${techSpecsHtml}
        <div class="modal-actions">
          <a href="contact.html" class="btn btn-primary btn-lg">Request Quote</a>
          <a href="tel:+918028396777" class="btn btn-outline-primary btn-lg">📞 Call Us</a>
        </div>
      </div>
    </div>
  `;

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
