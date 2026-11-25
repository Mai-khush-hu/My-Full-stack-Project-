const router = require('express').Router();
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SORTS = { price_asc: 'price', price_desc: '-price', newest: '-createdAt' };

// PUBLIC: list with search, filters, sort, pagination
router.get('/', async (req, res) => {
  const { q, brand, category, sort = 'newest', page = 1, limit = 12 } = req.query;
  const filter = {};
  if (q) filter.$or = [{ name: new RegExp(escapeRegex(q), 'i') }, { brand: new RegExp(escapeRegex(q), 'i') }];
  if (brand) filter.brand = brand;
  if (category) filter.category = category;

  const perPage = Math.min(parseInt(limit, 10) || 12, 100);
  const pageNo = Math.max(parseInt(page, 10) || 1, 1);
  const [products, total] = await Promise.all([
    Product.find(filter).sort(SORTS[sort] || '-createdAt').skip((pageNo - 1) * perPage).limit(perPage),
    Product.countDocuments(filter),
  ]);
  res.json({ success: true, total, page: pageNo, pages: Math.ceil(total / perPage), products });
});

router.get('/brands', async (req, res) => {
  res.json({ success: true, brands: (await Product.distinct('brand')).sort() });
});

router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
});

// ADMIN ONLY: create / update / delete
router.post('/', protect, authorize('admin'), async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, product });
});

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, message: 'Product deleted' });
});

module.exports = router;
