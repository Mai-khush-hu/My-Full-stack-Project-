# My-Full-stack-Project-
My Full stack project for submission
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
