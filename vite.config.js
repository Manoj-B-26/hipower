import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper to get all generated product pages dynamically for rollup input
const getProductInputs = () => {
  const inputs = {};
  const productsDir = resolve(__dirname, 'products');
  if (fs.existsSync(productsDir)) {
    const productIds = fs.readdirSync(productsDir);
    productIds.forEach(id => {
      const pagePath = resolve(productsDir, id, 'index.html');
      if (fs.existsSync(pagePath)) {
        // Name configuration: products/12345/index
        inputs[`products/${id}/index`] = pagePath;
      }
    });
  }
  return inputs;
};

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        products: resolve(__dirname, 'products.html'),
        services: resolve(__dirname, 'services.html'),
        testimonials: resolve(__dirname, 'testimonials.html'),
        contact: resolve(__dirname, 'contact.html'),
        team: resolve(__dirname, 'team.html'),
        ...getProductInputs(),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
