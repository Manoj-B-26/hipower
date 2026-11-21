import { initProductCatalog } from './product-catalog.js';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProductCatalog);
} else {
  initProductCatalog();
}
