// src/pages/Products.jsx
import React, { useEffect, useState } from "react";
import { getProducts } from "../api/client";

const card = {
  background: "#fff",
  borderRadius: "10px",
  padding: "20px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};
const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
  gap: "20px",
  marginTop: "24px",
};
const btn = {
  marginTop: "auto",
  padding: "10px",
  background: "#e94560",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: 600,
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(() => setError("Failed to load products"))
      .finally(() => setLoading(false));
  }, []);

  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find((i) => i.product_id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ product_id: product.id, name: product.name, price: product.price, quantity: 1 });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`${product.name} added to cart!`);
  };

  if (loading) return <p>Loading products...</p>;
  if (error)   return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h1 style={{ fontSize: "24px", fontWeight: 700 }}>Products</h1>
      <div style={grid}>
        {products.map((p) => (
          <div key={p.id} style={card}>
            <h3 style={{ fontSize: "16px" }}>{p.name}</h3>
            <p style={{ color: "#666", fontSize: "13px" }}>{p.description}</p>
            <p style={{ fontWeight: 700, color: "#e94560", fontSize: "18px" }}>${p.price}</p>
            <p style={{ color: "#999", fontSize: "12px" }}>Stock: {p.stock}</p>
            <button style={btn} onClick={() => addToCart(p)}>Add to Cart</button>
          </div>
        ))}
      </div>
    </div>
  );
}
