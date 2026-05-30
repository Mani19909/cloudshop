// src/server.js
// CloudShop Backend API — Express + PostgreSQL + Prometheus metrics

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { Pool } = require("pg");
const client = require("prom-client");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------
// PROMETHEUS METRICS SETUP
// ---------------------------------------------------------------
const register = new client.Registry();

// Default system metrics (CPU, memory, event loop lag...)
client.collectDefaultMetrics({ register });

// Custom business metrics
const httpRequestDuration = new client.Histogram({
  name: "cloudshop_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
});

const httpRequestTotal = new client.Counter({
  name: "cloudshop_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

const ordersCreatedTotal = new client.Counter({
  name: "cloudshop_orders_created_total",
  help: "Total number of orders created",
});

const activeConnections = new client.Gauge({
  name: "cloudshop_active_db_connections",
  help: "Number of active database connections",
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(ordersCreatedTotal);
register.registerMetric(activeConnections);

// ---------------------------------------------------------------
// DATABASE
// ---------------------------------------------------------------
const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "cloudshop",
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
});

// Update active connections gauge every 5 seconds
setInterval(() => {
  activeConnections.set(pool.totalCount);
}, 5000);

// ---------------------------------------------------------------
// MIDDLEWARE
// ---------------------------------------------------------------
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting: 100 requests per 15 min per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
});
app.use(limiter);

// Prometheus instrumentation middleware
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on("finish", () => {
    const labels = {
      method:      req.method,
      route:       req.route?.path || req.path,
      status_code: res.statusCode,
    };
    end(labels);
    httpRequestTotal.inc(labels);
  });
  next();
});

// ---------------------------------------------------------------
// ROUTES
// ---------------------------------------------------------------

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", version: process.env.APP_VERSION || "1.0.0" });
});

// Prometheus metrics endpoint — scraped by Prometheus
app.get("/metrics", async (req, res) => {
  res.setHeader("Content-Type", register.contentType);
  res.send(await register.metrics());
});

// Products
app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, description, price, stock FROM products ORDER BY name"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("DB error:", err.message);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Orders
app.post("/api/orders", async (req, res) => {
  const { user_id, items } = req.body;
  if (!user_id || !items?.length) {
    return res.status(400).json({ error: "user_id and items are required" });
  }

  const client_db = await pool.connect();
  try {
    await client_db.query("BEGIN");

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const order = await client_db.query(
      "INSERT INTO orders (user_id, total, status) VALUES ($1, $2, $3) RETURNING id",
      [user_id, total, "pending"]
    );

    for (const item of items) {
      await client_db.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
        [order.rows[0].id, item.product_id, item.quantity, item.price]
      );
    }

    await client_db.query("COMMIT");

    // Increment custom metric
    ordersCreatedTotal.inc();

    res.status(201).json({ order_id: order.rows[0].id, total });
  } catch (err) {
    await client_db.query("ROLLBACK");
    console.error("Order error:", err.message);
    res.status(500).json({ error: "Failed to create order" });
  } finally {
    client_db.release();
  }
});

// ---------------------------------------------------------------
// START SERVER
// ---------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`CloudShop API running on port ${PORT}`);
});

module.exports = app; // for tests
