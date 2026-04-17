USE backforge;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    category VARCHAR(255),
    description TEXT,
    price DECIMAL(38,2),
    stock INT,
    image TEXT,
    farmer_id BIGINT,
    FOREIGN KEY (farmer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    buyer_id BIGINT,
    total_amount DECIMAL(38,2),
    status VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    payment_status VARCHAR(255),
    FOREIGN KEY (buyer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT,
    product_id BIGINT,
    quantity INT,
    price DECIMAL(38,2),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
