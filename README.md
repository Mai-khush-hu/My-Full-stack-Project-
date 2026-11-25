# SoleMate: Shoe Shopping Website

Full stack e-commerce app built with **Node.js, Express, MongoDB (Mongoose)** and a **vanilla HTML/CSS/JS** frontend.

## Features
- Browse shoes with search, category and brand filters, sorting and pagination
- Product detail with size selection, cart (saved in the browser), checkout
- Register / login with **JWT** authentication (passwords hashed with bcrypt)
- **Role-based access control**: `user` and `admin`
- Customers: place orders and track status
- Admin: add / edit / delete products, view all orders, update order status (cancelling restores stock)

## Tech stack
Node.js, Express, MongoDB Atlas, Mongoose, JWT, bcryptjs, Helmet, CORS, HTML5, CSS3, JavaScript (ES6)

## Folder structure
```
server/
├── server.js            # app entry point
├── seed.js              # creates admin + sample products
├── public/              # frontend (index.html, style.css, app.js)
└── src/
    ├── config/db.js     # MongoDB connection
    ├── models/          # User, Product, Order
    ├── middleware/auth.js   # protect (JWT) + authorize (RBAC)
    └── routes/          # auth, products, orders
```

## Setup
```bash
cd server
npm install
cp .env.example .env     # add your MongoDB URI and a JWT secret
npm run seed             # admin: admin@solemate.com / admin123 + sample shoes
npm run dev
```
Open http://localhost:5000

## REST API
| Method | Endpoint | Access |
|---|---|---|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| GET | /api/auth/me | Logged in |
| GET | /api/products?q=&brand=&category=&sort=&page= | Public |
| GET | /api/products/brands | Public |
| GET | /api/products/:id | Public |
| POST / PUT / DELETE | /api/products, /api/products/:id | Admin |
| POST | /api/orders | Logged in |
| GET | /api/orders/mine | Logged in |
| GET | /api/orders/all | Admin |
| PATCH | /api/orders/:id/status | Admin |

## Security notes
- Order prices are calculated on the server from the database, never trusted from the client
- Stock is checked and reduced when an order is placed
- All user-generated text is escaped before rendering to prevent XSS
