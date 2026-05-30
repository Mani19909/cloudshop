// app/worker/src/index.js
// Background worker — polls DB for pending orders and processes them

require("dotenv").config();
const { Pool } = require("pg");
const client = require("prom-client");
const http = require("http");

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "cloudshop",
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// ---- Prometheus metrics (exposed on :9091/metrics) ----
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const ordersProcessed = new client.Counter({
  name: "cloudshop_worker_orders_processed_total",
  help: "Total orders processed by worker",
  labelNames: ["status"],
});
register.registerMetric(ordersProcessed);

// ---- Metrics HTTP server ----
http.createServer(async (req, res) => {
  if (req.url === "/metrics") {
    res.setHeader("Content-Type", register.contentType);
    res.end(await register.metrics());
  } else if (req.url === "/health") {
    res.end(JSON.stringify({ status: "ok" }));
  }
}).listen(9091, () => console.log("Worker metrics on :9091"));

// ---- Poll for pending orders every 5 seconds ----
async function processPendingOrders() {
  const result = await pool.query(
    "SELECT id FROM orders WHERE status = $1 LIMIT 10",
    ["pending"]
  );

  for (const row of result.rows) {
    try {
      // Simulate order processing (inventory update, email, etc.)
      await pool.query(
        "UPDATE orders SET status = $1 WHERE id = $2",
        ["completed", row.id]
      );
      ordersProcessed.inc({ status: "completed" });
      console.log(`Order ${row.id} processed`);
    } catch (err) {
      ordersProcessed.inc({ status: "failed" });
      console.error(`Failed to process order ${row.id}:`, err.message);
    }
  }
}

setInterval(async () => {
  try {
    await processPendingOrders();
  } catch (err) {
    console.error("Worker poll error:", err.message);
  }
}, 5000);

console.log("CloudShop worker started");
