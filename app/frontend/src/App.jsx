// src/App.jsx
import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Products from "./pages/Products";
import Cart     from "./pages/Cart";
import Orders   from "./pages/Orders";

const styles = {
  nav: {
    background: "#1a1a2e",
    padding: "14px 32px",
    display: "flex",
    alignItems: "center",
    gap: "24px",
  },
  brand: { color: "#e94560", fontWeight: 700, fontSize: "20px", textDecoration: "none" },
  link:  { color: "#ccc", textDecoration: "none", fontSize: "14px" },
  main:  { maxWidth: "1100px", margin: "32px auto", padding: "0 16px" },
};

export default function App() {
  return (
    <>
      <nav style={styles.nav}>
        <Link to="/"       style={styles.brand}>☁ CloudShop</Link>
        <Link to="/"       style={styles.link}>Products</Link>
        <Link to="/cart"   style={styles.link}>Cart</Link>
        <Link to="/orders" style={styles.link}>Orders</Link>
      </nav>
      <main style={styles.main}>
        <Routes>
          <Route path="/"       element={<Products />} />
          <Route path="/cart"   element={<Cart />} />
          <Route path="/orders" element={<Orders />} />
        </Routes>
      </main>
    </>
  );
}
