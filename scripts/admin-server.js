/**
 * HiPower Admin Server
 * Run: node scripts/admin-server.js
 * Opens admin dashboard at http://localhost:3333
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const PRODUCTS_DATA_PATH = path.join(rootDir, 'src', 'js', 'products-data.js');
const ADMIN_PASSWORD = 'hipower2025'; // Change this!

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ─── Helper: read products array from products-data.js ────────────────────────
function readProducts() {
  const raw = fs.readFileSync(PRODUCTS_DATA_PATH, 'utf-8');
  // Extract JSON array from the export const products = [...] file
  const match = raw.match(/export const products = (\[[\s\S]*\]);/);
  if (!match) throw new Error('Could not parse products-data.js');
  return JSON.parse(match[1]);
}

// ─── Helper: write products array back to products-data.js ───────────────────
function writeProducts(products) {
  const header = `// Auto-generated from Product ID Content Syndication.xlsx\n// All columns populated, Software Licensing and Services removed\n// Total products: ${products.length}\nexport const products = `;
  const content = header + JSON.stringify(products, null, 4) + ';\n';
  fs.writeFileSync(PRODUCTS_DATA_PATH, content, 'utf-8');
}

// ─── Auth middleware ──────────────────────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ─── API Routes ───────────────────────────────────────────────────────────────

// GET /api/products — list all with summary
app.get('/api/products', auth, (req, res) => {
  try {
    const products = readProducts();
    const summary = products.map(p => ({
      id: p.id,
      mpn: p.mpn,
      name: p.name,
      brand: p.brand,
      category: p.category,
      image: p.image || `https://content.etilize.com/75/${p.id}.jpg`
    }));
    res.json({ count: summary.length, products: summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id — remove a product
app.delete('/api/products/:id', auth, (req, res) => {
  try {
    const products = readProducts();
    const before = products.length;
    const filtered = products.filter(p => p.id !== req.params.id);
    if (filtered.length === before) {
      return res.status(404).json({ error: 'Product not found' });
    }
    writeProducts(filtered);

    // Also remove the generated product folder
    const productDir = path.join(rootDir, 'products', req.params.id);
    if (fs.existsSync(productDir)) {
      fs.rmSync(productDir, { recursive: true, force: true });
    }

    res.json({ success: true, removed: req.params.id, remaining: filtered.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products — add a new product (minimal entry from Etilize ID)
app.post('/api/products', auth, (req, res) => {
  try {
    const { id, mpn, name, brand, category, marketing, productType, manufacturer } = req.body;
    if (!id || !name) {
      return res.status(400).json({ error: 'id and name are required' });
    }
    const products = readProducts();
    if (products.find(p => p.id === id)) {
      return res.status(409).json({ error: 'Product already exists' });
    }

    const newProduct = {
      id: String(id),
      mpn: mpn || '',
      name: name || '',
      fullDescription: name || '',
      longDesc: '',
      marketing: marketing || '',
      productType: productType || '',
      brand: brand || 'Vertiv',
      manufacturer: manufacturer || 'Vertiv',
      category: category || 'General Purpose UPS',
      categoryId: '',
      categoryTree: '',
      level1Category: 'Power Equipment',
      level2Category: 'UPS',
      level3Category: category || 'General Purpose UPS',
      keywords: '',
      unspsc: '',
      gtin: '', upc: '', ean: '',
      image: `https://content.etilize.com/500/${id}.jpg`,
      images: {
        '75': `https://content.etilize.com/75/${id}.jpg`,
        '160': `https://content.etilize.com/160/${id}.jpg`,
        '500': `https://content.etilize.com/500/${id}.jpg`,
        'Rear': `https://content.etilize.com/Rear/${id}.jpg`,
        'Right': `https://content.etilize.com/Right/${id}.jpg`
      },
      features: [],
      techSpecsHtml: '',
      techSpecsJson: {},
      pdfBrochure: `https://content.etilize.com/Manufacturer-Brochure/${id}.pdf`,
      pdfManual: `https://content.etilize.com/User-Manual/${id}.pdf`
    };

    products.push(newProduct);
    writeProducts(products);
    res.json({ success: true, product: newProduct, total: products.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/regenerate — run generate-product-pages.js
app.post('/api/regenerate', auth, (req, res) => {
  exec('node scripts/generate-product-pages.js', { cwd: rootDir }, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: error.message, stderr });
    }
    res.json({ success: true, output: stdout });
  });
});

// GET / — serve the admin HTML UI
app.get('/', (req, res) => {
  res.sendFile(path.join(rootDir, 'admin.html'));
});

const PORT = 3333;
app.listen(PORT, () => {
  console.log(`\n🔐 HiPower Admin Server running at http://localhost:${PORT}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log(`   Press Ctrl+C to stop\n`);
});
