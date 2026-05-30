-- app/backend/src/db/init.sql
-- Runs automatically when PostgreSQL container first starts (docker-compose)
-- For EKS/prod: run manually or via a K8s Job

-- ---- Products table ----
CREATE TABLE IF NOT EXISTS products (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    price       NUMERIC(10, 2) NOT NULL,
    stock       INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ---- Users table ----
CREATE TABLE IF NOT EXISTS users (
    id         SERIAL PRIMARY KEY,
    email      VARCHAR(255) UNIQUE NOT NULL,
    name       VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ---- Orders table ----
CREATE TABLE IF NOT EXISTS orders (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER REFERENCES users(id),
    total      NUMERIC(10, 2) NOT NULL,
    status     VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ---- Order Items table ----
CREATE TABLE IF NOT EXISTS order_items (
    id         SERIAL PRIMARY KEY,
    order_id   INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity   INTEGER NOT NULL,
    price      NUMERIC(10, 2) NOT NULL
);

-- ---- Indexes for performance ----
CREATE INDEX IF NOT EXISTS idx_orders_user_id    ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ---- Seed data ----
INSERT INTO products (name, description, price, stock) VALUES
    ('Wireless Headphones', 'Noise cancelling over-ear headphones', 99.99,  50),
    ('Mechanical Keyboard', 'RGB backlit TKL keyboard',              79.99, 100),
    ('USB-C Hub',           '7-in-1 multiport hub',                  39.99, 200),
    ('Webcam 1080p',        'Full HD webcam with mic',               59.99,  75),
    ('Monitor Stand',       'Adjustable aluminum stand',             49.99,  60)
ON CONFLICT DO NOTHING;

INSERT INTO users (email, name) VALUES
    ('test@cloudshop.com', 'Test User')
ON CONFLICT DO NOTHING;
