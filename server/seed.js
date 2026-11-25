// Run once: node seed.js   -> creates the admin account and sample shoes
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Product = require('./src/models/Product');

const shoes = [
  { name: 'AirStride Runner', brand: 'Nike', category: 'men', price: 7495, stock: 25, color: '#dbe4ff', sizes: [7, 8, 9, 10, 11], description: 'Lightweight running shoe with a breathable mesh upper and cushioned sole.' },
  { name: 'Court Classic', brand: 'Adidas', category: 'men', price: 5999, stock: 18, color: '#e8e8e8', sizes: [7, 8, 9, 10], description: 'Everyday leather sneaker with a clean court-inspired look.' },
  { name: 'Velocity Pro', brand: 'Puma', category: 'women', price: 6499, stock: 20, color: '#ffd9e4', sizes: [5, 6, 7, 8], description: 'Responsive trainer built for tempo runs and gym sessions.' },
  { name: 'Trail Blazer', brand: 'Reebok', category: 'men', price: 6899, stock: 12, color: '#d7efd9', sizes: [8, 9, 10, 11], description: 'Grippy outsole and reinforced toe cap for rough trails.' },
  { name: 'Cloud Walk', brand: 'Skechers', category: 'women', price: 4299, stock: 30, color: '#fff1c9', sizes: [5, 6, 7, 8, 9], description: 'Memory-foam insole for all-day comfort.' },
  { name: 'Street Hi-Top', brand: 'Converse', category: 'women', price: 3999, stock: 22, color: '#f3d9ff', sizes: [5, 6, 7, 8], description: 'Canvas high-top with a vulcanised rubber sole.' },
  { name: 'Mini Sprinter', brand: 'Nike', category: 'kids', price: 2999, stock: 15, color: '#ffe0cc', sizes: [1, 2, 3, 4], description: 'Easy velcro straps and a flexible sole for growing feet.' },
  { name: 'Leather Oxford', brand: 'Bata', category: 'men', price: 2799, stock: 0, color: '#e6d9cf', sizes: [7, 8, 9, 10], description: 'Formal leather oxford for office and events.' },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const email = 'admin@solemate.com';
  if (!(await User.findOne({ email }))) {
    await User.create({ name: 'Admin', email, role: 'admin', password: await bcrypt.hash('admin123', 10) });
    console.log(`Admin created -> ${email} / admin123`);
  } else console.log('Admin already exists');

  if ((await Product.countDocuments()) === 0) {
    await Product.insertMany(shoes);
    console.log(`${shoes.length} sample shoes added`);
  } else console.log('Products already exist, skipping');

  await mongoose.disconnect();
})();
