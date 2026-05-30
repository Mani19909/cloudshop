// src/pages/Orders.jsx
import React from "react";

export default function Orders() {
  return (
    <div>
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "16px" }}>My Orders</h1>
      <p style={{ color: "#666" }}>
        Orders are processed by the background worker service every 5 seconds.
        Check the Grafana dashboard to see <code>cloudshop_orders_created_total</code> increment in real time.
      </p>
    </div>
  );
}
