// src/pages/Cart.jsx
import React, { useState } from "react";
import { createOrder } from "../api/client";

const row = { display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #eee" };
const btn = { padding: "12px 24px", background: "#e94560", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 700, fontSize: "16px" };

export default function Cart() {
  const [cart, setCart]       = useState(() => JSON.parse(localStorage.getItem("cart") || "[]"));
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState(null);

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const remove = (product_id) => {
    const updated = cart.filter((i) => i.product_id !== product_id);
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const placeOrder = async () => {
    if (!cart.length) return alert("Your cart is empty");
    setPlacing(true);
    try {
      const result = await createOrder({ user_id: 1, items: cart });
      setSuccess(`Order #${result.order_id} placed! Total: $${result.total}`);
      localStorage.removeItem("cart");
      setCart([]);
    } catch {
      alert("Failed to place order — please try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (success) return (
    <div style={{ textAlign: "center", marginTop: "60px" }}>
      <h2 style={{ color: "#27ae60", fontSize: "24px" }}>✅ {success}</h2>
    </div>
  );

  return (
    <div style={{ maxWidth: "600px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "24px" }}>Your Cart</h1>
      {cart.length === 0 ? (
        <p style={{ color: "#666" }}>Your cart is empty.</p>
      ) : (
        <>
          {cart.map((item) => (
            <div key={item.product_id} style={row}>
              <span>{item.name} × {item.quantity}</span>
              <span style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <strong>${(item.price * item.quantity).toFixed(2)}</strong>
                <button
                  onClick={() => remove(item.product_id)}
                  style={{ background: "none", border: "none", color: "#e94560", cursor: "pointer", fontSize: "16px" }}
                >✕</button>
              </span>
            </div>
          ))}
          <div style={{ ...row, fontWeight: 700, fontSize: "18px", borderBottom: "none", marginTop: "8px" }}>
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button style={{ ...btn, marginTop: "24px" }} onClick={placeOrder} disabled={placing}>
            {placing ? "Placing order..." : "Place Order"}
          </button>
        </>
      )}
    </div>
  );
}
