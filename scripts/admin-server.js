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
const ADMIN_PASSWORD = 'hipower2026'; // Change this!

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

// POST /api/products — add a new product
app.post('/api/products', auth, (req, res) => {
  try {
    const p = req.body;
    const id = String(p.id || '').trim();
    const name = (p.name || p.fullDescription || '').trim();
    if (!id || !name) {
      return res.status(400).json({ error: 'Product ID and Name are required' });
    }
    const products = readProducts();
    if (products.find(item => item.id === id)) {
      return res.status(409).json({ error: `Product ID ${id} already exists on website` });
    }

    const newProduct = {
      id,
      mpn: p.mpn || '',
      name,
      fullDescription: p.fullDescription || name,
      longDesc: p.longDesc || '',
      marketing: p.marketing || '',
      productType: p.productType || '',
      brand: p.brand || 'Vertiv',
      manufacturer: p.manufacturer || 'Vertiv',
      category: p.category || 'General Purpose UPS',
      categoryId: p.categoryId ? String(p.categoryId) : '',
      categoryTree: p.categoryTree || '',
      level1Category: p.level1Category || 'Power Equipment',
      level2Category: p.level2Category || 'UPS',
      level3Category: p.level3Category || p.category || 'General Purpose UPS',
      keywords: p.keywords || '',
      unspsc: p.unspsc ? String(p.unspsc) : '',
      gtin: p.gtin ? String(p.gtin) : '',
      upc: p.upc ? String(p.upc) : '',
      ean: p.ean ? String(p.ean) : '',
      image: p.image || `https://content.etilize.com/500/${id}.jpg`,
      images: p.images || {
        '75': `https://content.etilize.com/75/${id}.jpg`,
        '160': `https://content.etilize.com/160/${id}.jpg`,
        '500': `https://content.etilize.com/500/${id}.jpg`,
        'Rear': `https://content.etilize.com/Rear/${id}.jpg`,
        'Right': `https://content.etilize.com/Right/${id}.jpg`
      },
      features: Array.isArray(p.features) ? p.features : [],
      techSpecsHtml: p.techSpecsHtml || '',
      techSpecsJson: p.techSpecsJson || {},
      techSpecs: p.techSpecs || '',
      pdfBrochure: p.pdfBrochure || `https://content.etilize.com/Manufacturer-Brochure/${id}.pdf`,
      pdfManual: p.pdfManual || `https://content.etilize.com/User-Manual/${id}.pdf`
    };

    products.push(newProduct);
    writeProducts(products);
    res.json({ success: true, product: newProduct, total: products.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products/batch — add multiple products from Excel
app.post('/api/products/batch', auth, (req, res) => {
  try {
    const list = req.body.products;
    if (!Array.isArray(list) || list.length === 0) {
      return res.status(400).json({ error: 'No products provided' });
    }

    const products = readProducts();
    const existingIds = new Set(products.map(p => p.id));
    const addedList = [];
    const skippedList = [];

    for (const p of list) {
      const id = String(p.id || '').trim();
      const name = (p.name || p.fullDescription || '').trim();
      if (!id || !name) {
        skippedList.push({ id, reason: 'Missing id or name' });
        continue;
      }
      if (existingIds.has(id)) {
        skippedList.push({ id, reason: 'Already exists' });
        continue;
      }

      const newProduct = {
        id,
        mpn: p.mpn || '',
        name,
        fullDescription: p.fullDescription || name,
        longDesc: p.longDesc || '',
        marketing: p.marketing || '',
        productType: p.productType || '',
        brand: p.brand || 'Vertiv',
        manufacturer: p.manufacturer || 'Vertiv',
        category: p.category || 'General Purpose UPS',
        categoryId: p.categoryId ? String(p.categoryId) : '',
        categoryTree: p.categoryTree || '',
        level1Category: p.level1Category || 'Power Equipment',
        level2Category: p.level2Category || 'UPS',
        level3Category: p.level3Category || p.category || 'General Purpose UPS',
        keywords: p.keywords || '',
        unspsc: p.unspsc ? String(p.unspsc) : '',
        gtin: p.gtin ? String(p.gtin) : '',
        upc: p.upc ? String(p.upc) : '',
        ean: p.ean ? String(p.ean) : '',
        image: p.image || `https://content.etilize.com/500/${id}.jpg`,
        images: p.images || {
          '75': `https://content.etilize.com/75/${id}.jpg`,
          '160': `https://content.etilize.com/160/${id}.jpg`,
          '500': `https://content.etilize.com/500/${id}.jpg`,
          'Rear': `https://content.etilize.com/Rear/${id}.jpg`,
          'Right': `https://content.etilize.com/Right/${id}.jpg`
        },
        features: Array.isArray(p.features) ? p.features : [],
        techSpecsHtml: p.techSpecsHtml || '',
        techSpecsJson: p.techSpecsJson || {},
        techSpecs: p.techSpecs || '',
        pdfBrochure: p.pdfBrochure || `https://content.etilize.com/Manufacturer-Brochure/${id}.pdf`,
        pdfManual: p.pdfManual || `https://content.etilize.com/User-Manual/${id}.pdf`
      };

      products.push(newProduct);
      existingIds.add(id);
      addedList.push(id);
    }

    if (addedList.length > 0) {
      writeProducts(products);
    }

    res.json({
      success: true,
      addedCount: addedList.length,
      skippedCount: skippedList.length,
      addedIds: addedList,
      total: products.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products/batch-delete — remove multiple products
app.post('/api/products/batch-delete', auth, (req, res) => {
  try {
    const ids = req.body.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided' });
    }

    const removeSet = new Set(ids.map(id => String(id).trim()));
    const products = readProducts();
    const remaining = products.filter(p => !removeSet.has(p.id));
    const removedCount = products.length - remaining.length;

    writeProducts(remaining);

    // Delete product page folders
    for (const id of removeSet) {
      const productDir = path.join(rootDir, 'products', id);
      if (fs.existsSync(productDir)) {
        fs.rmSync(productDir, { recursive: true, force: true });
      }
    }

    res.json({ success: true, removedCount, remaining: remaining.length });
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
