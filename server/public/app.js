/* SoleMate frontend: vanilla JS that talks to the REST API at /api */
const API = '/api';
const $ = (id) => document.getElementById(id);
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => '₹' + Number(n).toLocaleString('en-IN');
const safeColor = (c) => (/^#[0-9a-f]{6}$/i.test(c) ? c : '#e5e7eb');
const safeUrl = (u) => (/^https:\/\//i.test(u) ? u : '');

let token = localStorage.getItem('token');
let me = JSON.parse(localStorage.getItem('user') || 'null');
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let products = [];
let page = 1;
let pages = 1;

/* ---------- helpers ---------- */
async function api(path, method = 'GET', body) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token) { logout(); }
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

let toastTimer;
function toast(msg, isError = false) {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'show' + (isError ? ' error' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = ''), 3000);
}
const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { toast(e.message, true); } };

function thumb(p) {
  const url = safeUrl(p.imageUrl);
  return `<div class="thumb" style="background:${safeColor(p.color)}">${url ? `<img src="${esc(url)}" alt="${esc(p.name)}" loading="lazy">` : '<span aria-hidden="true">👟</span>'}</div>`;
}

/* ---------- navigation ---------- */
const loaders = { shop: loadProducts, cart: renderCart, orders: loadOrders, admin: loadAdmin };

function show(view) {
  if ((view === 'orders' || view === 'admin') && !token) view = 'auth';
  if (view === 'admin' && me?.role !== 'admin') view = 'shop';
  document.querySelectorAll('.view').forEach((v) => (v.hidden = true));
  $('view-' + view).hidden = false;
  document.querySelectorAll('.nav nav button[data-view]').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  window.scrollTo(0, 0);
  if (loaders[view]) guard(loaders[view])();
}

function refreshNav() {
  const loggedIn = !!(token && me);
  $('ordersLink').hidden = !loggedIn;
  $('adminLink').hidden = !(loggedIn && me.role === 'admin');
  $('loginLink').hidden = loggedIn;
  $('logoutBtn').hidden = !loggedIn;
  $('cartCount').textContent = cart.reduce((n, i) => n + i.qty, 0);
}

function logout() {
  token = null; me = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  refreshNav();
  show('shop');
}

document.querySelectorAll('[data-view]').forEach((el) =>
  el.addEventListener('click', (e) => { e.preventDefault(); show(el.dataset.view); }));
$('logoutBtn').addEventListener('click', logout);

/* ---------- auth ---------- */
let registerMode = false;
$('authToggle').addEventListener('click', (e) => {
  e.preventDefault();
  registerMode = !registerMode;
  $('aName').hidden = !registerMode;
  $('aName').required = registerMode;
  $('authTitle').textContent = registerMode ? 'Create account' : 'Log in';
  $('authSubmit').textContent = registerMode ? 'Sign up' : 'Log in';
  $('authHint').textContent = registerMode ? 'Already have an account?' : 'New to SoleMate?';
  $('authToggle').textContent = registerMode ? 'Log in' : 'Create an account';
});

$('authForm').addEventListener('submit', guard(async (e) => {
  e.preventDefault();
  const body = { email: $('aEmail').value, password: $('aPass').value };
  if (registerMode) body.name = $('aName').value;
  const data = await api(registerMode ? '/auth/register' : '/auth/login', 'POST', body);
  token = data.token; me = data.user;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(me));
  $('authForm').reset();
  toast('Welcome, ' + me.name);
  refreshNav();
  show(me.role === 'admin' ? 'admin' : 'shop');
}));

/* ---------- shop ---------- */
async function loadBrands() {
  const { brands } = await api('/products/brands');
  $('fBrand').innerHTML = '<option value="">All brands</option>' + brands.map((b) => `<option>${esc(b)}</option>`).join('');
}

async function loadProducts() {
  const q = new URLSearchParams({ page, limit: 8, sort: $('fSort').value });
  if ($('fQ').value.trim()) q.set('q', $('fQ').value.trim());
  if ($('fCategory').value) q.set('category', $('fCategory').value);
  if ($('fBrand').value) q.set('brand', $('fBrand').value);
  const data = await api('/products?' + q);
  products = data.products;
  pages = data.pages || 1;
  $('pageInfo').textContent = `Page ${data.page} of ${pages}`;
  $('prevPage').disabled = page <= 1;
  $('nextPage').disabled = page >= pages;

  const grid = $('productGrid');
  if (!products.length) {
    grid.innerHTML = '<p class="muted">No shoes match your search. Try clearing a filter.</p>';
    return;
  }
  grid.innerHTML = products.map((p) => `
    <article class="product" tabindex="0" data-id="${p._id}">
      ${thumb(p)}
      <div class="info">
        <div class="brand">${esc(p.brand)}</div>
        <h3>${esc(p.name)}</h3>
        <span class="price">${money(p.price)}</span>${p.stock <= 0 ? '<span class="tag">Sold out</span>' : ''}
      </div>
    </article>`).join('');
  grid.querySelectorAll('.product').forEach((el) => {
    const open = () => openProduct(el.dataset.id);
    el.addEventListener('click', open);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
  });
}

['fCategory', 'fBrand', 'fSort'].forEach((id) =>
  $(id).addEventListener('change', () => { page = 1; guard(loadProducts)(); }));
let searchTimer;
$('fQ').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { page = 1; guard(loadProducts)(); }, 300); });
$('filters').addEventListener('submit', (e) => e.preventDefault());
$('prevPage').addEventListener('click', () => { page--; guard(loadProducts)(); });
$('nextPage').addEventListener('click', () => { page++; guard(loadProducts)(); });

/* ---------- product detail ---------- */
function openProduct(id) {
  const p = products.find((x) => x._id === id);
  if (!p) return;
  const out = p.stock <= 0;
  let size = null;
  $('pbody').innerHTML = `
    <div class="detail">
      ${thumb(p)}
      <div class="body">
        <div class="brand">${esc(p.brand)} · ${esc(p.category)}</div>
        <h2>${esc(p.name)}</h2>
        <p class="price">${money(p.price)}</p>
        <p class="muted">${esc(p.description)}</p>
        <strong>Select size</strong>
        <div class="sizes">${p.sizes.map((s) => `<button type="button" class="size" data-size="${s}">${s}</button>`).join('')}</div>
        <label>Quantity <input type="number" id="dQty" class="qty" min="1" max="${Math.max(p.stock, 1)}" value="1" /></label>
        <p class="muted">${out ? 'Currently sold out' : p.stock + ' in stock'}</p>
        <button id="dAdd" class="block" ${out ? 'disabled' : ''}>Add to cart</button>
      </div>
    </div>`;
  $('pbody').querySelectorAll('.size').forEach((b) => b.addEventListener('click', () => {
    $('pbody').querySelectorAll('.size').forEach((x) => x.classList.remove('selected'));
    b.classList.add('selected');
    size = Number(b.dataset.size);
  }));
  $('dAdd').addEventListener('click', () => {
    if (!size) return toast('Please choose a size', true);
    const qty = Math.max(1, parseInt($('dQty').value, 10) || 1);
    addToCart(p, size, qty);
    $('pdlg').close();
  });
  $('pdlg').showModal();
}
$('pclose').addEventListener('click', () => $('pdlg').close());
$('pdlg').addEventListener('click', (e) => { if (e.target === $('pdlg')) $('pdlg').close(); });

/* ---------- cart ---------- */
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
  refreshNav();
}

function addToCart(p, size, qty) {
  const existing = cart.find((i) => i.product === p._id && i.size === size);
  if (existing) existing.qty = Math.min(existing.qty + qty, p.stock);
  else cart.push({ product: p._id, name: p.name, price: p.price, color: p.color, imageUrl: p.imageUrl, size, qty: Math.min(qty, p.stock), stock: p.stock });
  saveCart();
  toast(`${p.name} (size ${size}) added to cart`);
}

function renderCart() {
  const box = $('cartItems');
  if (!cart.length) {
    box.innerHTML = '<p class="muted">Your cart is empty. Browse the shop to find your next pair.</p>';
    $('cartTotal').textContent = money(0);
    $('checkoutForm').hidden = true;
    return;
  }
  $('checkoutForm').hidden = false;
  box.innerHTML = cart.map((i, idx) => `
    <div class="cart-item">
      ${thumb(i)}
      <div>
        <strong>${esc(i.name)}</strong>
        <div class="muted">Size ${i.size} · ${money(i.price)}</div>
        <div class="stepper">
          <button type="button" data-act="dec" data-i="${idx}" aria-label="Decrease">−</button>
          <span>${i.qty}</span>
          <button type="button" data-act="inc" data-i="${idx}" aria-label="Increase">+</button>
        </div>
      </div>
      <div style="text-align:right">
        <strong>${money(i.price * i.qty)}</strong><br>
        <button type="button" class="link" data-act="rm" data-i="${idx}">Remove</button>
      </div>
    </div>`).join('');
  $('cartTotal').textContent = money(cart.reduce((s, i) => s + i.price * i.qty, 0));
  box.querySelectorAll('button[data-act]').forEach((b) => b.addEventListener('click', () => {
    const i = cart[Number(b.dataset.i)];
    if (b.dataset.act === 'inc') i.qty = Math.min(i.qty + 1, i.stock || 99);
    if (b.dataset.act === 'dec') i.qty = Math.max(i.qty - 1, 1);
    if (b.dataset.act === 'rm') cart.splice(Number(b.dataset.i), 1);
    saveCart();
    renderCart();
  }));
}

$('checkoutForm').addEventListener('submit', guard(async (e) => {
  e.preventDefault();
  if (!token) { toast('Please log in to place your order', true); return show('auth'); }
  await api('/orders', 'POST', {
    items: cart.map(({ product, size, qty }) => ({ product, size, qty })),
    address: $('address').value,
  });
  cart = [];
  saveCart();
  $('checkoutForm').reset();
  toast('Order placed. Thank you!');
  show('orders');
}));

/* ---------- my orders ---------- */
const orderItems = (o) => o.items.map((i) => `${esc(i.name)} (size ${i.size}) × ${i.qty}`).join('<br>');

async function loadOrders() {
  const { orders } = await api('/orders/mine');
  $('orderList').innerHTML = orders.length ? orders.map((o) => `
    <article class="card">
      <div class="card-head">
        <strong>Order placed on ${new Date(o.createdAt).toLocaleDateString('en-IN')}</strong>
        <span class="status ${o.status}">${o.status}</span>
      </div>
      <p>${orderItems(o)}</p>
      <p class="muted">Deliver to: ${esc(o.address)}</p>
      <strong>${money(o.total)}</strong>
    </article>`).join('') : '<p class="muted">You have not ordered anything yet.</p>';
}

/* ---------- admin ---------- */
document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === t));
  $('tab-products').hidden = t.dataset.tab !== 'products';
  $('tab-adminOrders').hidden = t.dataset.tab !== 'adminOrders';
}));

async function loadAdmin() {
  const [prods, ords] = await Promise.all([api('/products?limit=100'), api('/orders/all')]);
  products = prods.products;

  $('adminProducts').innerHTML = products.map((p) => `
    <tr>
      <td>${esc(p.name)}</td><td>${esc(p.brand)}</td><td>${money(p.price)}</td><td>${p.stock}</td>
      <td><div class="row">
        <button class="small outline" data-edit="${p._id}">Edit</button>
        <button class="small danger" data-del="${p._id}">Delete</button>
      </div></td>
    </tr>`).join('');
  $('adminProducts').querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => editProduct(b.dataset.edit)));
  $('adminProducts').querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', guard(async () => {
    if (!confirm('Delete this product?')) return;
    await api('/products/' + b.dataset.del, 'DELETE');
    toast('Product deleted');
    loadAdmin();
  })));

  const statuses = ['placed', 'shipped', 'delivered', 'cancelled'];
  $('adminOrderTable').innerHTML = ords.orders.length ? ords.orders.map((o) => `
    <tr>
      <td>${esc(o.user?.name || 'Deleted user')}<br><span class="muted">${esc(o.user?.email || '')}</span></td>
      <td>${orderItems(o)}</td>
      <td>${money(o.total)}</td>
      <td>${esc(o.address)}</td>
      <td><select data-order="${o._id}">${statuses.map((s) => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
    </tr>`).join('') : '<tr><td colspan="5" class="muted">No orders yet.</td></tr>';
  $('adminOrderTable').querySelectorAll('select[data-order]').forEach((s) => s.addEventListener('change', guard(async () => {
    await api(`/orders/${s.dataset.order}/status`, 'PATCH', { status: s.value });
    toast('Order status updated');
  })));
}

function resetProductForm() {
  $('productForm').reset();
  $('pId').value = '';
  $('pColor').value = '#dbe4ff';
  $('formTitle').textContent = 'Add a product';
  $('pSubmit').textContent = 'Add product';
  $('pCancel').hidden = true;
}
$('pCancel').addEventListener('click', resetProductForm);

function editProduct(id) {
  const p = products.find((x) => x._id === id);
  $('pId').value = p._id;
  $('pName').value = p.name;
  $('pBrand').value = p.brand;
  $('pCategory').value = p.category;
  $('pPrice').value = p.price;
  $('pStock').value = p.stock;
  $('pSizes').value = p.sizes.join(', ');
  $('pColor').value = safeColor(p.color);
  $('pImage').value = p.imageUrl || '';
  $('pDesc').value = p.description || '';
  $('formTitle').textContent = 'Edit product';
  $('pSubmit').textContent = 'Save changes';
  $('pCancel').hidden = false;
  $('productForm').scrollIntoView({ behavior: 'smooth' });
}

$('productForm').addEventListener('submit', guard(async (e) => {
  e.preventDefault();
  const body = {
    name: $('pName').value,
    brand: $('pBrand').value,
    category: $('pCategory').value,
    price: Number($('pPrice').value),
    stock: Number($('pStock').value),
    sizes: $('pSizes').value.split(',').map((s) => Number(s.trim())).filter((n) => n > 0),
    color: $('pColor').value,
    imageUrl: $('pImage').value.trim(),
    description: $('pDesc').value,
  };
  const id = $('pId').value;
  await api(id ? '/products/' + id : '/products', id ? 'PUT' : 'POST', body);
  toast(id ? 'Product updated' : 'Product added');
  resetProductForm();
  loadAdmin();
}));

/* ---------- start ---------- */
refreshNav();
guard(loadBrands)();
show('shop');
