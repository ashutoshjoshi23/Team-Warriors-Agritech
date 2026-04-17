# FarmConnect — Agri-Tech Marketplace

**Built by Team Warriors | NMIET, Talegaon Dabhade, Pune**

FarmConnect is a full-stack, farm-to-table e-commerce platform that connects local Indian farmers directly with consumers. By eliminating supply-chain middlemen, farmers receive fair prices and consumers receive fresh, traceable, organic produce.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Setup and Running](#setup-and-running)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Application Routes](#application-routes)
- [Admin Panel](#admin-panel)
- [Changelog](#changelog)
- [Team](#team)

---

## Project Overview

| Attribute       | Details                                              |
|-----------------|------------------------------------------------------|
| Application     | FarmConnect — Agri-Tech Marketplace                  |
| Type            | Full-Stack Web Application                           |
| Domain          | `http://localhost:8080`                              |
| Database        | MySQL 8.x (`backforge` schema)                       |
| Currency        | Indian Rupee (INR)                                   |
| Institution     | NMIET, Talegaon Dabhade, Pune — 410507               |
| Academic Year   | 2025–2026                                            |

---

## Technology Stack

| Layer              | Technology                                   |
|--------------------|----------------------------------------------|
| Backend Framework  | Java 17+, Spring Boot 3.2.5                  |
| ORM                | Spring Data JPA, Hibernate                   |
| Database           | MySQL 8.x                                    |
| Build Tool         | Apache Maven 3.9.6 (bundled, no install needed) |
| Security           | Spring Security (session-based)              |
| Payment Gateway    | Razorpay SDK (INR) — with demo fallback      |
| Frontend           | HTML5, Vanilla CSS3, Vanilla JavaScript (ES6+) |
| Typography         | Google Fonts — Outfit, Playfair Display      |
| Icons              | FontAwesome 6.4                              |
| AI Chatbot         | Voiceflow Widget (widget-next)               |
| PDF Generation     | jsPDF + jsPDF-AutoTable                      |
| Maps               | Google Maps Embed API                        |

---

## Features

### Authentication and User Management

- Role-based registration and login: Buyer, Farmer, Admin
- Session persistence via localStorage (`fc_session`)
- Amazon-style guest-to-user cart merge on login
- Secure password hashing (BCrypt)

### Marketplace and Shopping

- Product catalogue with live data from MySQL
- Sticky category pill filters (Vegetables, Fruits, Dairy, Grains, Honey)
- Search by name, farmer, or category
- Sort by price (ascending / descending) and name
- Quick View modal — product details without page reload
- Blinkit-style inline quantity controller on each product card (+ / - directly on card)
- Category-based fallback images for products with no image set

### Cart System

- User-scoped persistent cart (key: `fc_cart_{userId}`) — survives page refresh and browser restart
- Guest cart (`fc_cart_guest`) automatically merges into user cart on login
- Delivery charge calculation: Rs. 40 below Rs. 500 subtotal; free above
- Real-time free-delivery progress bar
- Coupon code system: FARM10, FRESH20, SAVE50, NMIET
- GST calculation at 8%
- Farm Coins preview (10% of order total)
- Smart product suggestions — excludes items already in cart
- Blinkit-style empty cart with category shortcut links
- Smooth slide-out animation on item removal

### Checkout and Payment

- Multi-step checkout with shipping information form
- Custom premium payment gateway modal (no third-party popup dependency):
  - **UPI** — app selection (GPay, PhonePe, Paytm, BHIM) and manual UPI ID
  - **Credit / Debit Card** — auto-formatted card number, expiry, CVV
  - **Net Banking** — bank grid (SBI, HDFC, ICICI, Axis, Kotak, BOB) and dropdown
  - **Cash on Delivery** — with handling charge disclosure
- Payment simulation with 1.8-second processing animation
- Animated success screen with order summary, payment method, amount, and Farm Coins earned
- Order confirmation written to MySQL on payment verification
- Cart auto-cleared after successful payment

### Orders and Invoicing

- Real-time order history fetched from MySQL (`/api/orders/user/{id}`)
- Status filter tabs: All, Pending, Confirmed, Shipped, Delivered, Cancelled
- D-Mart / Reliance-style PDF invoice generation per order:
  - Company letterhead with GSTIN and contact details
  - TAX INVOICE stamp
  - Invoice number, order ID, order date
  - Bill-to section with full shipping address (word-wrapped, no truncation)
  - Line-item table with product, category, quantity, unit price, amount
  - Subtotal, delivery charge, GST at 8%, grand total
  - Payment status badge and payment reference
  - System-generated footer

### Dashboard (Buyer)

- Total amount spent (live from DB)
- Total orders, pending orders, delivered orders
- Count-up animations on stats load
- Auto-refresh every 30 seconds with countdown display
- Live indicator badge

### Farmer Dashboard

- Farmer-specific product management
- Add, edit, and delete products
- Direct image upload (no external URL required)

### Admin Panel

- Real-time revenue, order count, and user count (live from DB)
- Full user management — view and delete users
- Full product management — add, edit, delete with image upload
- Order management — view all orders, update order status

### UI and UX

- Premium homepage: animated hero with floating badges, category navigation grid, featured products, How-It-Works section, testimonials, newsletter signup
- Dark mode toggle — persisted in localStorage, applies to all pages
- Slide-up entrance animations on cards (staggered delay)
- Voiceflow AI chatbot on all pages (widget-next bundle)
- Glassmorphism effects and custom scrollbar
- Fully responsive design — mobile, tablet, desktop, widescreen
- Low-stock badges on products with fewer than 10 units

---

## Project Structure

```
backend/
├── src/main/java/com/farmermarket/
│   ├── controller/
│   │   ├── AuthController.java          # Login, register
│   │   ├── ProductController.java       # Product CRUD
│   │   ├── OrderController.java         # Order creation and retrieval
│   │   ├── PaymentController.java       # Payment creation and verification
│   │   ├── AdminController.java         # Admin statistics and management
│   │   └── UserController.java          # User profile
│   ├── model/
│   │   ├── User.java
│   │   ├── Product.java
│   │   ├── Order.java
│   │   └── OrderItem.java
│   ├── repository/
│   │   ├── UserRepository.java
│   │   ├── ProductRepository.java
│   │   └── OrderRepository.java
│   └── Application.java
│
├── src/main/resources/
│   ├── static/                          # Frontend (served by Spring Boot)
│   │   ├── index.html                   # Homepage
│   │   ├── products.html                # Marketplace
│   │   ├── product-details.html         # Product detail page
│   │   ├── cart.html                    # Shopping cart
│   │   ├── checkout.html                # Checkout and payment
│   │   ├── orders.html                  # Order history and invoices
│   │   ├── about.html                   # About page
│   │   ├── contact.html                 # Contact page with map
│   │   ├── login.html                   # Login
│   │   ├── signup.html                  # Registration
│   │   ├── admin.html                   # Admin panel
│   │   ├── dashboard.html               # Farmer/buyer dashboard
│   │   ├── profile.html                 # User profile
│   │   ├── privacy-policy.html          # Legal
│   │   ├── css/
│   │   │   ├── style.css                # Global design system
│   │   │   ├── navbar.css               # Navigation bar
│   │   │   ├── footer.css               # Footer
│   │   │   ├── products.css             # Marketplace styles
│   │   │   ├── dashboard.css            # Dashboard styles
│   │   │   ├── orders.css               # Orders page styles
│   │   │   └── auth.css                 # Auth page styles
│   │   ├── js/
│   │   │   ├── utils.js                 # Shared utilities (cart, session, toasts, coins)
│   │   │   ├── main.js                  # Navbar, dark mode, Voiceflow init
│   │   │   ├── auth.js                  # Login, signup, guest cart merge
│   │   │   ├── home.js                  # Homepage featured products
│   │   │   ├── products.js              # Marketplace, filters, inline cart
│   │   │   ├── cart.js                  # Cart page with delivery, coupons
│   │   │   ├── checkout.js              # Checkout form, payment modal
│   │   │   ├── orders.js                # Order history, PDF invoice
│   │   │   └── dashboard.js             # Dashboard stats with auto-refresh
│   │   ├── components/
│   │   │   ├── navbar.html              # Injected navigation
│   │   │   └── footer.html              # Injected footer
│   │   └── uploads/                     # Product images (uploaded via admin)
│   │
│   ├── application.properties           # Database and Razorpay configuration
│   └── schema.sql                       # Database schema
│
├── pom.xml                              # Maven dependencies
├── mock_data.sql                        # Sample seed data
└── apache-maven-3.9.6/                 # Bundled Maven (no system install required)
```

---

## Setup and Running

### Prerequisites

- Java 17 or higher (JDK)
- MySQL 8.x running on localhost port 3306

### Step 1 — Database

The database is created automatically on first run. No manual SQL execution is required.

```properties
Database name: backforge
```

### Step 2 — Configure Database Credentials

Edit `backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/backforge?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD
```

### Step 3 — Run the Application

```powershell
cd Agritech-Web-Team-Warriors-main/backend
.\apache-maven-3.9.6\bin\mvn.cmd spring-boot:run
```

### Step 4 — Open in Browser

```
http://localhost:8080
```

### Default Credentials

| Role    | Email                      | Password   |
|---------|----------------------------|------------|
| Admin   | admin@farmconnect.com      | admin123   |
| Farmer  | farmer@farmconnect.com     | farmer123  |
| Buyer   | Register a new account     | —          |

---

## API Reference

### Authentication

| Method | Endpoint              | Description           |
|--------|-----------------------|-----------------------|
| POST   | `/api/auth/signup`    | Register new user     |
| POST   | `/api/auth/login`     | Authenticate user     |

### Products

| Method | Endpoint                           | Description                    |
|--------|------------------------------------|--------------------------------|
| GET    | `/api/products`                    | List all products              |
| GET    | `/api/products/{id}`               | Get product by ID              |
| POST   | `/api/products`                    | Create product (Farmer/Admin)  |
| PUT    | `/api/products/{id}`               | Update product                 |
| DELETE | `/api/products/{id}`               | Delete product                 |
| GET    | `/api/products/farmer/{farmerId}`  | Products by farmer             |

### Orders

| Method | Endpoint                        | Description                      |
|--------|---------------------------------|----------------------------------|
| POST   | `/api/orders`                   | Place an order                   |
| GET    | `/api/orders/user/{userId}`     | Get orders for a specific user   |
| PUT    | `/api/orders/{id}/status`       | Update order status (Admin)      |

### Payments

| Method | Endpoint                                  | Description                          |
|--------|-------------------------------------------|--------------------------------------|
| GET    | `/api/payments/get-key`                   | Retrieve Razorpay public key         |
| POST   | `/api/payments/create-order/{orderId}`    | Create payment intent for order      |
| POST   | `/api/payments/verify-payment`            | Verify and confirm payment           |

> Note: If Razorpay API keys are not configured or are invalid, the payment controller automatically falls back to a demo mode that simulates the full payment flow without calling Razorpay servers.

### Admin

| Method | Endpoint                  | Description                   |
|--------|---------------------------|-------------------------------|
| GET    | `/api/admin/stats`        | Aggregate dashboard metrics   |
| GET    | `/api/admin/users`        | List all users                |
| DELETE | `/api/admin/users/{id}`   | Remove a user                 |
| POST   | `/api/admin/upload`       | Upload product image file     |

---

## Database Schema

```sql
CREATE TABLE users (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    email      VARCHAR(255) UNIQUE NOT NULL,
    password   VARCHAR(255) NOT NULL,           -- BCrypt hashed
    role       ENUM('BUYER','FARMER','ADMIN') DEFAULT 'BUYER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    price       DECIMAL(10,2) NOT NULL,         -- INR
    stock       INT DEFAULT 0,
    category    VARCHAR(100),
    image       VARCHAR(500),
    farmer_id   BIGINT,
    FOREIGN KEY (farmer_id) REFERENCES users(id)
);

CREATE TABLE orders (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    buyer_id            BIGINT,
    total_amount        DECIMAL(10,2),
    status              VARCHAR(50) DEFAULT 'PENDING',
    payment_status      VARCHAR(50) DEFAULT 'UNPAID',
    razorpay_order_id   VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    shipping_address    TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(id)
);

CREATE TABLE order_items (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id   BIGINT,
    product_id BIGINT,
    quantity   INT NOT NULL,
    price      DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id)   REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

---

## Application Routes

| URL                              | Page                | Access      |
|----------------------------------|---------------------|-------------|
| `/` or `/index.html`             | Homepage            | Public      |
| `/products.html`                 | Marketplace         | Public      |
| `/product-details.html?id={id}`  | Product Detail      | Public      |
| `/about.html`                    | About               | Public      |
| `/contact.html`                  | Contact             | Public      |
| `/privacy-policy.html`           | Privacy Policy      | Public      |
| `/login.html`                    | Login               | Public      |
| `/signup.html`                   | Register            | Public      |
| `/cart.html`                     | Shopping Cart       | Recommended login |
| `/checkout.html`                 | Checkout            | Login required |
| `/orders.html`                   | Order History       | Login required |
| `/profile.html`                  | User Profile        | Login required |
| `/dashboard.html`                | Farmer Dashboard    | Farmer/Admin |
| `/admin.html`                    | Admin Control Panel | Admin only  |

---

## Admin Panel

**URL:** `http://localhost:8080/admin.html`

**Login:** `admin@farmconnect.com` / `admin123`

| Feature                    | Description                                                      |
|----------------------------|------------------------------------------------------------------|
| Dashboard Metrics          | Real-time revenue, total orders, registered users from MySQL     |
| Product Management         | Add, edit, delete products; direct image file upload             |
| User Management            | View all users; delete accounts                                  |
| Order Management           | View all orders across all buyers; update order status           |

---

## Changelog

### v3.0 — April 2026 (Current)

**Cart System**
- User-scoped cart keys (`fc_cart_{userId}`) — data persists across page refresh
- Guest-to-user cart merge on login (Amazon-style)
- Dynamic delivery charges: Rs. 40 below Rs. 500; free above Rs. 500
- Coupon code engine: FARM10, FRESH20, SAVE50, NMIET
- Real-time free-delivery progress bar
- Farm Coins preview on cart summary
- Smart product suggestions panel (excludes cart items)
- Blinkit-style inline quantity controls on product cards
- Animated item removal

**Payment**
- Replaced Razorpay popup (blocked by invalid keys) with a custom premium payment modal
- Four payment methods: UPI, Credit/Debit Card, Net Banking, Cash on Delivery
- Card number auto-formatting, UPI app quick-select
- Payment simulation with animated success screen

**Invoicing**
- D-Mart style PDF invoice using jsPDF and AutoTable
- Dynamic BILL TO box height — full address word-wrapped (no truncation)
- Invoice number, GST breakdown, payment reference, status badge

**Dashboard**
- Count-up number animations on stat load
- 30-second auto-refresh with visible countdown
- Manual refresh button with spinner
- Live indicator badge
- Parallel API fetch with graceful partial failure handling

**Bug Fixes**
- Fixed dashboard API endpoint: `/api/orders/user/{id}` (was `/api/orders/{id}`)
- Fixed `cart is not defined` in `handleDemoPayment` (missing parameter)
- Fixed `checkout.js` using old `fc_cart` key instead of user-scoped key
- Fixed payment verification: added DB order ID fallback extraction from mock key format
- Fixed address truncation in PDF (`substring(0,38)` replaced with `splitTextToSize`)
- Fixed `y = 44` missing in PDF generator (caused header/content overlap)

---

### v2.0 — April 2026

- Premium homepage with animated hero, testimonials, newsletter
- Marketplace: sticky pill filters, Quick View modal, low-stock badges
- About page: team, values, mission
- Contact page: Google Maps (NMIET Pune), social links
- Global currency switch to INR
- Dark mode fixed across all pages
- Featured products loaded from live API
- Slide-up card animations with stagger

---

### v1.0 — Initial Release

- Basic CRUD for users, products, orders
- Razorpay integration
- Admin dashboard
- Voiceflow chatbot

---

## Team

**Team Warriors — NMIET, Pune**

| Name             | Role                        |
|------------------|-----------------------------|
| Aditya Borse     | Testing and Quality Assurance |
| Shreyash Hajare  | Backend Development & Database Management|
| Ashutosh Joshi   | Full-Stack Development & AI    |

**Institution:** Nutan Maharashtra Institute of Engineering and Technology (NMIET), Talegaon Dabhade, Pune — 410507

---

*FarmConnect — Bringing fresh, organic produce straight from local Indian farmers to your table. 100% natural, 0% middlemen.*

*Copyright 2026 Team Warriors, NMIET Pune. All rights reserved.*
