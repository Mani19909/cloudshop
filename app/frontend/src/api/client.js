// src/api/client.js
// Central axios instance — all API calls go through here

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",  // Empty = same origin (proxied by nginx)
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Response interceptor — log errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ---- Products ----
export const getProducts = () =>
  api.get("/api/products").then((r) => r.data);

export const getProduct = (id) =>
  api.get(`/api/products/${id}`).then((r) => r.data);

// ---- Orders ----
export const createOrder = (payload) =>
  api.post("/api/orders", payload).then((r) => r.data);
