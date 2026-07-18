import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { products } from '../src/js/products-data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Helper to escape double quotes in HTML attributes
function escapeAttr(val) {
  if (!val) return '';
  return val.toString().replace(/"/g, '&quot;');
}

// 1. Generate lightweight products summary data
console.log('Generating products summary...');
const summaryProducts = products.map(p => {
  // Truncate marketing description to save space
  let shortMarketing = '';
  if (p.marketing) {
    shortMarketing = p.marketing.length > 120 
      ? p.marketing.substring(0, 117) + '…' 
      : p.marketing;
  }

  return {
    id: p.id,
    mpn: p.mpn,
    name: p.name,
    brand: p.brand,
    productType: p.productType,
    category: p.category,
    image: p.image,
    marketing: shortMarketing,
    manufacturer: p.manufacturer || ''
  };
});

const summaryContent = `// Auto-generated products summary data
// Total products: ${summaryProducts.length}
export const products = ${JSON.stringify(summaryProducts, null, 2)};
`;

fs.writeFileSync(
  path.join(rootDir, 'src', 'js', 'products-summary.js'),
  summaryContent,
  'utf-8'
);
console.log('✓ Created src/js/products-summary.js');

// Category Hierarchy details for breadcrumbs
const CATEGORY_HIERARCHY = {
  power: {
    label: 'Power Management',
    subcategories: ['General Purpose UPS', 'PDUs', 'Industrial UPS']
  },
  thermal: {
    label: 'Thermal Management',
    subcategories: ['Cooling Systems']
  },
  itinfra: {
    label: 'IT Infra Management',
    subcategories: [
      'KVM Switchboxes', 'Rackmount LCDs', 'Panels', 'UPS Batteries', 
      'Poles & Handles', 'Rack Equipment', 'Infrastructure Management Equipment'
    ]
  }
};

const CATEGORY_CONFIG = {
  'General Purpose UPS': { label: 'UPS Systems', icon: '⚡', color: 'var(--accent)' },
  'PDUs': { label: 'Power Distribution', icon: '🔌', color: 'var(--emerald)' },
  'Industrial UPS': { label: 'Industrial UPS', icon: '🏭', color: 'var(--amber)' },
  'Cooling Systems': { label: 'Cooling Systems', icon: '❄️', color: 'var(--cyan)' },
  'KVM Switchboxes': { label: 'KVM Switches', icon: '🖥️', color: 'var(--purple)' },
  'Rackmount LCDs': { label: 'Rack Console', icon: '📺', color: 'var(--blue)' },
  'Panels': { label: 'Panels', icon: '🔲', color: 'var(--text-secondary)' },
  'UPS Batteries': { label: 'Batteries', icon: '🔋', color: 'var(--emerald)' },
  'Poles & Handles': { label: 'Rack Accessories', icon: '🔧', color: 'var(--amber)' },
  'Rack Equipment': { label: 'Rack Equipment', icon: '🗄️', color: 'var(--teal)' },
  'Infrastructure Management Equipment': { label: 'Infrastructure Mgmt', icon: '📡', color: 'var(--blue)' },
};

const BRAND_COLORS = {
  'Liebert': 'var(--accent)',
  'AVOCENT': 'var(--blue)',
  'VERTIV': 'var(--emerald)',
  'Geist': 'var(--purple)',
};

// 2. Load template from products.html
const productsHtmlTemplatePath = path.join(rootDir, 'products.html');
let productsHtml = fs.readFileSync(productsHtmlTemplatePath, 'utf-8');

// Parse HTML structure
// Locate start and end of Hero Section
const heroStartTag = '<section class="hero hero-inner">';
const heroEndTag = '</section>';
const heroStartIndex = productsHtml.indexOf(heroStartTag);
const heroEndIndex = productsHtml.indexOf(heroEndTag, heroStartIndex);
const beforeHero = productsHtml.substring(0, heroStartIndex);
const afterHero = productsHtml.substring(heroEndIndex + heroEndTag.length);

// Locate Stats & Catalog sections to replace
const statsStartTag = '<!-- PRODUCT CATALOG STATS -->';
const catalogEndTag = '<!-- PRODUCT DETAIL MODAL -->';
const statsStartIndex = afterHero.indexOf(statsStartTag);
const catalogEndIndex = afterHero.indexOf(catalogEndTag);
const beforeCatalog = afterHero.substring(0, statsStartIndex);
const afterCatalog = afterHero.substring(catalogEndIndex);
// Mapping of category to friendly highlight label
function getHighlightLabel(category) {
  const mapping = {
    'General Purpose UPS': 'UPS System',
    'PDUs': 'Power Distribution',
    'Industrial UPS': 'Industrial UPS',
    'Cooling Systems': 'Cooling System',
    'KVM Switchboxes': 'KVM Switch',
    'Rackmount LCDs': 'Rack Console',
    'Panels': 'Panel',
    'UPS Batteries': 'Battery',
    'Poles & Handles': 'Rack Accessory',
    'Rack Equipment': 'Rack Equipment',
    'Infrastructure Management Equipment': 'Infrastructure Management'
  };
  return mapping[category] || category;
}

// Helper function to build html content for one product
function generateProductHtml(product) {
  const highlightLabel = getHighlightLabel(product.category);
  // Determine Top Category
  let topCatKey = 'power';
  let topCatLabel = 'Power Management';
  for (const [key, value] of Object.entries(CATEGORY_HIERARCHY)) {
    if (value.subcategories.includes(product.category)) {
      topCatKey = key;
      topCatLabel = value.label;
      break;
    }
  }

  const subCatConfig = CATEGORY_CONFIG[product.category] || { label: product.category, icon: '📦', color: 'var(--blue)' };
  const subCatLabel = subCatConfig.label;
  const configColor = subCatConfig.color;
  const configIcon = subCatConfig.icon;
  const configLabel = subCatConfig.label;
  const brandColor = BRAND_COLORS[product.brand] || 'var(--blue)';

  // Build image gallery
  const galleryImages = [];
  const mainImage = product.image || (product.images && product.images['500']) || '';
  if (mainImage) galleryImages.push({ url: mainImage, label: 'Front' });

  if (product.images) {
    const viewOrder = ['Front', 'Rear', 'Left', 'Right', 'Top', 'Life-Style'];
    viewOrder.forEach(view => {
      if (product.images[view] && !galleryImages.some(g => g.url === product.images[view])) {
        galleryImages.push({ url: product.images[view], label: view.replace('-', ' ') });
      }
    });
    for (let i = 1; i <= 6; i++) {
      const key = 'Alternate-Image' + i;
      if (product.images[key] && !galleryImages.some(g => g.url === product.images[key])) {
        galleryImages.push({ url: product.images[key], label: 'View ' + galleryImages.length });
      }
    }
  }

  let galleryHtml = '';
  if (galleryImages.length > 1) {
    galleryHtml = `
      <div class="modal-gallery-thumbs" style="margin-top: var(--space-md);">
        ${galleryImages.map((img, i) => `
          <button class="gallery-thumb ${i === 0 ? 'active' : ''}" data-img-url="${escapeAttr(img.url)}" title="${escapeAttr(img.label)}">
            <img src="${img.url.replace('/500/', '/75/')}" alt="${escapeAttr(img.label)}" loading="lazy" />
          </button>
        `).join('')}
      </div>
    `;
  }

  // Key features
  let featuresHtml = '';
  if (product.features && product.features.length > 0) {
    featuresHtml = `
      <div class="modal-features-list" style="margin-top: var(--space-md);">
        <h4>Key Features</h4>
        <ul>
          ${product.features.map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  // Tech specs
  let techSpecsHtml = '';
  if (product.techSpecsHtml) {
    techSpecsHtml = `
      <div class="modal-specs" style="margin-top: var(--space-lg);">
        <h4>Technical Specifications</h4>
        <div class="specs-html-content">
          ${product.techSpecsHtml}
        </div>
      </div>
    `;
  } else if (product.techSpecs) {
    const lines = product.techSpecs.split('\n').filter(l => l.trim());
    techSpecsHtml = `
      <div class="modal-specs" style="margin-top: var(--space-lg);">
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

  // Documents
  let documentsHtml = '';
  const docs = [];
  if (product.pdfBrochure) {
    docs.push(`<a href="${escapeAttr(product.pdfBrochure)}" target="_blank" rel="noopener" class="modal-doc-link">
      <span class="modal-doc-icon">📄</span>
      <span>Product Brochure</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
    </a>`);
  }
  if (product.pdfManual) {
    docs.push(`<a href="${escapeAttr(product.pdfManual)}" target="_blank" rel="noopener" class="modal-doc-link">
      <span class="modal-doc-icon">📘</span>
      <span>User Manual</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
    </a>`);
  }
  if (product.videoTour) {
    docs.push(`<a href="${escapeAttr(product.videoTour)}" target="_blank" rel="noopener" class="modal-doc-link modal-doc-video">
      <span class="modal-doc-icon">🎬</span>
      <span>Product Video</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
    </a>`);
  }
  if (docs.length > 0) {
    documentsHtml = `
      <div class="modal-documents" style="margin-top: var(--space-md);">
        <h4>Documents & Resources</h4>
        <div class="modal-docs-grid">${docs.join('')}</div>
      </div>
    `;
  }

  // Identifiers
  let identifiersHtml = '';
  const ids = [];
  if (product.manufacturer) ids.push(`<span class="modal-id-item"><strong>Manufacturer:</strong> ${product.manufacturer}</span>`);
  if (product.productType) ids.push(`<span class="modal-id-item"><strong>Type:</strong> ${product.productType}</span>`);
  if (product.unspsc) ids.push(`<span class="modal-id-item"><strong>UNSPSC:</strong> ${product.unspsc}</span>`);
  if (product.gtin) ids.push(`<span class="modal-id-item"><strong>GTIN:</strong> ${product.gtin}</span>`);
  if (product.upc) ids.push(`<span class="modal-id-item"><strong>UPC:</strong> ${product.upc}</span>`);
  if (product.ean) ids.push(`<span class="modal-id-item"><strong>EAN:</strong> ${product.ean}</span>`);
  if (ids.length > 0) {
    identifiersHtml = `<div class="modal-identifiers" style="margin-bottom: var(--space-sm);">${ids.join('')}</div>`;
  }

  // Full Description
  let fullDescHtml = '';
  if (product.fullDescription && product.fullDescription !== product.name) {
    fullDescHtml = `<div class="modal-full-desc" style="margin-top: var(--space-sm); margin-bottom: var(--space-sm);">${product.fullDescription}</div>`;
  }

  // Generate customized hero
  const customizedHero = `
  <section class="hero hero-inner">
    <div class="hero-orbs" aria-hidden="true">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
    </div>
    <div class="hero-overlay"></div>
    <div class="hero-grid"></div>
    <div class="container">
      <div class="hero-content">
        <div class="hero-badge animate-fade-down">
          <span class="dot"></span> Vertiv Authorized Partner
        </div>
        <h1 class="animate-fade-up" style="font-size: var(--fs-3xl); line-height: 1.2;">${product.brand} <span class="highlight">${highlightLabel}</span></h1>
        <p class="hero-subtitle animate-fade-up delay-2" style="font-size: var(--fs-md); max-width: 800px;">${product.name}</p>
      </div>
    </div>
  </section>`;

  // Generate customized body
  const customizedBody = `
  <!-- PRODUCT DETAILS -->
  <section class="section section-glass" style="padding-top: var(--space-xl); padding-bottom: 0; min-height: auto;">
    <div class="container">
      <!-- Breadcrumbs -->
      <nav class="breadcrumb-nav" aria-label="Breadcrumb" style="margin-bottom: var(--space-xl);">
        <ol class="breadcrumb-list">
          <li class="breadcrumb-item">
            <a href="/products.html" class="breadcrumb-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Products
            </a>
          </li>
          <li class="breadcrumb-item">
            <a href="/products.html?cat=${topCatKey}" class="breadcrumb-link">${topCatLabel}</a>
          </li>
          <li class="breadcrumb-item">
            <a href="/products.html?sub=${encodeURIComponent(product.category)}" class="breadcrumb-link">${subCatLabel}</a>
          </li>
          <li class="breadcrumb-item breadcrumb-current">
            <span>${product.name.length > 50 ? product.name.substring(0, 47) + '…' : product.name}</span>
          </li>
        </ol>
      </nav>

      <!-- Details Grid -->
      <div class="modal-product" style="margin-top: var(--space-md);">
        <div class="modal-product-image-col">
          <div class="modal-product-image" id="modal-main-image" style="background: #ffffff; border: 1px solid var(--border-glass); box-shadow: var(--shadow-glass); border-radius: var(--radius-lg); padding: var(--space-xl);">
            <img src="${escapeAttr(mainImage)}" alt="${escapeAttr(product.name || product.mpn)}" 
                 onerror="this.onerror=null; this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22><rect fill=%22%23f0ebe0%22 width=%22400%22 height=%22300%22/><text x=%22200%22 y=%22150%22 fill=%22%232B7DE9%22 font-size=%2248%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22 font-family=%22Inter,sans-serif%22>${encodeURIComponent(configIcon)}</text></svg>';" />
          </div>
          ${galleryHtml}
        </div>
        <div class="modal-product-info">
          <div class="modal-product-badges">
            <span class="modal-badge" style="background: ${configColor};">${configIcon} ${configLabel}</span>
            <span class="modal-badge modal-badge-brand" style="border-color: ${brandColor}; color: ${brandColor};">${product.brand}</span>
          </div>
          <h2 class="modal-product-name" style="font-size: var(--fs-3xl); font-weight: 800; line-height: 1.25; margin-top: var(--space-xs);">${product.name || product.mpn}</h2>
          <div class="modal-product-mpn" style="margin-bottom: var(--space-sm);">
            <span class="mpn-label">Part Number:</span>
            <span class="mpn-value">${product.mpn}</span>
          </div>
          ${identifiersHtml}
          ${product.marketing ? `<div class="modal-product-desc" style="font-size: var(--fs-base); line-height: 1.6; color: var(--text-secondary);">${product.marketing}</div>` : ''}
          ${fullDescHtml}
          ${featuresHtml}
          ${documentsHtml}
          ${techSpecsHtml}
          <div class="modal-actions" style="margin-top: var(--space-xl);">
            <a href="/contact.html?mpn=${encodeURIComponent(product.mpn)}&name=${encodeURIComponent(product.name)}" class="btn btn-primary btn-lg" style="justify-content: center;">Request Quote</a>
            <a href="tel:+918028396777" class="btn btn-outline-primary btn-lg" style="justify-content: center;">📞 Call Us</a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Thumbnail gallery interactive script -->
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.gallery-thumb').forEach(thumb => {
        thumb.addEventListener('click', () => {
          const imgUrl = thumb.dataset.imgUrl;
          const mainImg = document.querySelector('#modal-main-image img');
          if (mainImg) {
            mainImg.src = imgUrl;
          }
          document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
          thumb.classList.add('active');
        });
      });
    });
  </script>
  `;

  // Fix canonical link to point to this dynamic page
  let customizedHeader = beforeHero
    .replace('<title>Vertiv Product Catalog — HiPower Systems & Services</title>', `<title>${escapeAttr(product.name)} — HiPower</title>`)
    .replace('<meta name="description" content="Explore HiPower\'s complete range of Vertiv products: UPS Systems, Precision Cooling, KVM Switches, PDUs, Server Racks, and IT Infrastructure solutions." />', `<meta name="description" content="${escapeAttr((product.marketing || product.fullDescription || '').substring(0, 150))}..." />`)
    .replace('<link rel="canonical" href="https://hipower.in/products.html" />', `<link rel="canonical" href="https://hipower.in/products/${product.id}/" />`);

  // Ensure navbar active links on parent products page are correct (or root relative)
  customizedHeader = customizedHeader.replace('href="index.html"', 'href="/index.html"');
  customizedHeader = customizedHeader.replace('href="about.html"', 'href="/about.html"');
  customizedHeader = customizedHeader.replace('href="products.html"', 'href="/products.html"');
  customizedHeader = customizedHeader.replace('href="services.html"', 'href="/services.html"');
  customizedHeader = customizedHeader.replace('href="team.html"', 'href="/team.html"');
  customizedHeader = customizedHeader.replace('href="testimonials.html"', 'href="/testimonials.html"');
  customizedHeader = customizedHeader.replace('href="contact.html"', 'href="/contact.html"');

  let customizedFooter = afterCatalog;
  // Ensure footer links are root-relative
  customizedFooter = customizedFooter.replace('href="index.html"', 'href="/index.html"');
  customizedFooter = customizedFooter.replace('href="about.html"', 'href="/about.html"');
  customizedFooter = customizedFooter.replace('href="products.html"', 'href="/products.html"');
  customizedFooter = customizedFooter.replace('href="services.html"', 'href="/services.html"');
  customizedFooter = customizedFooter.replace('href="team.html"', 'href="/team.html"');
  customizedFooter = customizedFooter.replace('href="testimonials.html"', 'href="/testimonials.html"');
  customizedFooter = customizedFooter.replace('href="contact.html"', 'href="/contact.html"');

  return customizedHeader + customizedHero + beforeCatalog + customizedBody + customizedFooter;
}

// 3. Create all product directories and pages
console.log(`Generating pages for ${products.length} products...`);
products.forEach((product, index) => {
  const productDir = path.join(rootDir, 'products', product.id);
  if (!fs.existsSync(productDir)) {
    fs.mkdirSync(productDir, { recursive: true });
  }

  const htmlContent = generateProductHtml(product);
  fs.writeFileSync(path.join(productDir, 'index.html'), htmlContent, 'utf-8');
});

console.log('✓ Generated all individual product detail pages!');
