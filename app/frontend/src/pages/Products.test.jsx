// src/pages/Products.test.jsx
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import Products from "./Products";
import * as client from "../api/client";

// Mock the API client so tests don't hit a real server
vi.mock("../api/client");

const mockProducts = [
  { id: 1, name: "Wireless Headphones", description: "Noise cancelling", price: 99.99, stock: 50 },
  { id: 2, name: "Mechanical Keyboard",  description: "RGB backlit",      price: 79.99, stock: 100 },
];

describe("Products page", () => {
  it("shows loading state initially", () => {
    client.getProducts.mockReturnValue(new Promise(() => {})); // never resolves
    render(<Products />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders product cards after fetch", async () => {
    client.getProducts.mockResolvedValue(mockProducts);
    render(<Products />);
    await waitFor(() => {
      expect(screen.getByText("Wireless Headphones")).toBeInTheDocument();
      expect(screen.getByText("Mechanical Keyboard")).toBeInTheDocument();
    });
  });

  it("shows error message on fetch failure", async () => {
    client.getProducts.mockRejectedValue(new Error("Network error"));
    render(<Products />);
    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });

  it("displays correct prices", async () => {
    client.getProducts.mockResolvedValue(mockProducts);
    render(<Products />);
    await waitFor(() => {
      expect(screen.getByText("$99.99")).toBeInTheDocument();
      expect(screen.getByText("$79.99")).toBeInTheDocument();
    });
  });
});
