const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  price: Number,
  size: Number,
  qty: Number,
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [itemSchema],
  total: { type: Number, required: true },
  address: { type: String, required: true },
  paymentMethod: { type: String, default: 'Cash on delivery' },
  status: { type: String, enum: ['placed', 'shipped', 'delivered', 'cancelled'], default: 'placed' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
