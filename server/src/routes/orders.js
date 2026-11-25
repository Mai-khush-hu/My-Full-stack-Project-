const router = require('express').Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Place an order. Prices are read from the database, never trusted from the client.
router.post('/', async (req, res) => {
  const { items, address } = req.body;
  if (!Array.isArray(items) || !items.length)
    return res.status(400).json({ success: false, message: 'Your cart is empty' });
  if (!address || address.trim().length < 10)
    return res.status(400).json({ success: false, message: 'Please enter a full delivery address' });

  const orderItems = [];
  let total = 0;
  for (const it of items) {
    const qty = parseInt(it.qty, 10);
    if (!qty || qty < 1) return res.status(400).json({ success: false, message: 'Invalid quantity' });
    const product = await Product.findById(it.product);
    if (!product) return res.status(404).json({ success: false, message: 'A product in your cart no longer exists' });
    if (!product.sizes.includes(Number(it.size)))
      return res.status(400).json({ success: false, message: `Size ${it.size} is not available for ${product.name}` });
    if (product.stock < qty)
      return res.status(400).json({ success: false, message: `Only ${product.stock} left of ${product.name}` });
    orderItems.push({ product: product._id, name: product.name, price: product.price, size: Number(it.size), qty });
    total += product.price * qty;
  }

  for (const oi of orderItems) await Product.updateOne({ _id: oi.product }, { $inc: { stock: -oi.qty } });
  const order = await Order.create({ user: req.user._id, items: orderItems, total, address: address.trim() });
  res.status(201).json({ success: true, order });
});

// My orders
router.get('/mine', async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
  res.json({ success: true, orders });
});

// ADMIN: all orders and status updates
router.get('/all', authorize('admin'), async (req, res) => {
  const orders = await Order.find().populate('user', 'name email').sort('-createdAt');
  res.json({ success: true, orders });
});

router.patch('/:id/status', authorize('admin'), async (req, res) => {
  const { status } = req.body;
  if (!['placed', 'shipped', 'delivered', 'cancelled'].includes(status))
    return res.status(400).json({ success: false, message: 'Invalid status' });
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  // Return stock if an order is cancelled
  if (status === 'cancelled' && order.status !== 'cancelled')
    for (const it of order.items) await Product.updateOne({ _id: it.product }, { $inc: { stock: it.qty } });
  order.status = status;
  await order.save();
  res.json({ success: true, order });
});

module.exports = router;
