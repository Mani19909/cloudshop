// app/backend/src/server.test.js
// Jest + Supertest integration tests

const request = require("supertest");

// Mock pg Pool so tests don't need a real database
jest.mock("pg", () => {
  const mPool = {
    query:    jest.fn(),
    connect:  jest.fn(),
    totalCount: 0,
  };
  return { Pool: jest.fn(() => mPool) };
});

const { Pool } = require("pg");
const pool = new Pool();

// Load app AFTER mocking pg
const app = require("./server");

describe("GET /health", () => {
  it("returns 200 with status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("GET /metrics", () => {
  it("returns Prometheus metrics text", async () => {
    const res = await request(app).get("/metrics");
    expect(res.status).toBe(200);
    expect(res.text).toContain("cloudshop_http_requests_total");
  });
});

describe("GET /api/products", () => {
  it("returns products array", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { id: 1, name: "Headphones", description: "Great sound", price: 99.99, stock: 50 },
      ],
    });
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].name).toBe("Headphones");
  });

  it("returns 500 on DB error", async () => {
    pool.query.mockRejectedValueOnce(new Error("DB connection failed"));
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();
  });
});

describe("GET /api/products/:id", () => {
  it("returns 404 for non-existent product", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get("/api/products/9999");
    expect(res.status).toBe(404);
  });

  it("returns product when found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, name: "Keyboard", price: 79.99 }] });
    const res = await request(app).get("/api/products/1");
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Keyboard");
  });
});

describe("POST /api/orders", () => {
  it("returns 400 if body is missing fields", async () => {
    const res = await request(app).post("/api/orders").send({});
    expect(res.status).toBe(400);
  });

  it("creates order and returns order_id", async () => {
    const mockClient = {
      query:   jest.fn(),
      release: jest.fn(),
    };
    pool.connect.mockResolvedValueOnce(mockClient);
    mockClient.query
      .mockResolvedValueOnce(undefined)                       // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 42 }] })          // INSERT order
      .mockResolvedValueOnce(undefined)                       // INSERT order_item
      .mockResolvedValueOnce(undefined);                      // COMMIT

    const res = await request(app)
      .post("/api/orders")
      .send({ user_id: 1, items: [{ product_id: 1, quantity: 2, price: 99.99 }] });

    expect(res.status).toBe(201);
    expect(res.body.order_id).toBe(42);
  });
});
