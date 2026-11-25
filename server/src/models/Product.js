const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Product name is required'], trim: true },
  brand: { type: String, required: [true, 'Brand is required'], trim: true },
  category: { type: String, enum: ['men', 'women', 'kids'], required: true },
  price: { type: Number, required: [true, 'Price is required'], min: [1, 'Price must be positive'] },
  description: { type: String, default: '' },
  sizes: { type: [Number], default: [6, 7, 8, 9, 10] },
  stock: { type: Number, default: 0, min: 0 },
  color: { type: String, default: '#e5e7eb' },
  imageUrl: { type: String, default: '' },
}, { timestamps: true });

productSchema.index({ name: 'text', brand: 'text' });
productSchema.index({ brand: 1, category: 1, price: 1 });

module.exports = mongoose.model('Product', productSchema);
