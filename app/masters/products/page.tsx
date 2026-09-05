"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  type: "GOODS" | "SERVICE" | "COMBO";
  salesPrice: number;
  cost: number;
  categoryId: string;
  category?: Category;
  image?: string | null;
}

export default function ProductsMasterPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // Inline Category Creation Modal state
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "GOODS" as "GOODS" | "SERVICE" | "COMBO",
    categoryId: "",
    salesPrice: "",
    cost: "",
    image: "",
  });

  // Fetch Products & Categories
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/products${query}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.products) {
        setProducts(data.products);
      }
    } catch (e) {
      console.error("Failed to load products:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.categories) {
        setCategories(data.categories);
        if (!form.categoryId && data.categories.length > 0) {
          setForm((prev) => ({ ...prev, categoryId: data.categories[0].id }));
        }
      }
    } catch (e) {
      console.error("Failed to load categories:", e);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [search]);

  // Open Form for New Product
  const handleNew = () => {
    setEditingId(null);
    setForm({
      name: "",
      type: "GOODS",
      categoryId: categories[0]?.id || "",
      salesPrice: "",
      cost: "",
      image: "",
    });
    setErr("");
    setSuccessMsg("");
    setShowModal(true);
  };

  // Open Form for Editing Existing Product
  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      type: product.type || "GOODS",
      categoryId: product.categoryId || (categories[0]?.id || ""),
      salesPrice: product.salesPrice?.toString() || "0",
      cost: product.cost?.toString() || "0",
      image: product.image || "",
    });
    setErr("");
    setSuccessMsg("");
    setShowModal(true);
  };

  // Confirm / Save Product
  const handleConfirm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErr("");
    setSuccessMsg("");

    if (!form.name.trim()) {
      setErr("Product Name is required.");
      return;
    }
    if (!form.categoryId) {
      setErr("Please select a Category.");
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/products/${editingId}` : "/api/products";
      const method = editingId ? "PATCH" : "POST";

      const payload = {
        name: form.name,
        type: form.type,
        categoryId: form.categoryId,
        salesPrice: parseFloat(form.salesPrice) || 0,
        cost: parseFloat(form.cost) || 0,
        image: form.image,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save product");
      }

      setSuccessMsg(
        editingId ? "Product updated successfully!" : "Product created successfully!"
      );
      await fetchProducts();
      setTimeout(() => {
        setShowModal(false);
      }, 700);
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setSaving(false);
    }
  };

  // Create Category On The Fly
  const handleCreateCategoryOnTheFly = async () => {
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create category");
      }
      await fetchCategories();
      setForm((prev) => ({ ...prev, categoryId: data.category.id }));
      setNewCategoryName("");
      setShowNewCategoryModal(false);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setCreatingCategory(false);
    }
  };

  // Image Upload helper
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* Top Action Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 card-mono p-4 mb-6 shadow-md">
        {/* Left Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleNew}
            className="btn-outline px-5 py-2 text-xs font-bold rounded-lg border-2"
          >
            + New Product
          </button>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)] font-mono"
            />
          </div>
        </div>

        {/* Right View Switchers & Back Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="btn-outline px-5 py-2 text-xs font-bold rounded-lg"
          >
            Back
          </button>

          {/* View Mode Icons (List vs Kanban) */}
          <div className="flex items-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-1 gap-1">
            <button
              onClick={() => setViewMode("list")}
              aria-label="List"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-[var(--text-main)] text-[var(--bg-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <button
              onClick={() => setViewMode("kanban")}
              aria-label="Kanban"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "kanban"
                  ? "bg-[var(--text-main)] text-[var(--bg-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* --- POPUP COMPONENT (MODAL) --- */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Edit Product" : "Create New Product"}
        maxWidth="max-w-3xl"
      >
        <div className="p-2">
          {err && (
            <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-500 font-medium text-center">
              {err}
            </div>
          )}
          {successMsg && (
            <div className="mb-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-500 font-medium text-center">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleConfirm} className="space-y-6 text-xs">
            {/* Product Name */}
            <div className="grid grid-cols-12 items-center gap-4 border-b border-[var(--border-color)] pb-4">
              <label className="col-span-3 font-bold text-xs text-[var(--text-main)]">
                Product Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter Product Name (e.g. Air Conditioner)"
                className="col-span-9 rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] font-semibold focus:outline-none focus:border-[var(--text-main)]"
                required
              />
            </div>

            {/* Product Type */}
            <div className="grid grid-cols-12 items-center gap-4 border-b border-[var(--border-color)] pb-4">
              <label className="col-span-3 font-bold text-xs text-[var(--text-main)]">
                Product Type *
              </label>
              <div className="col-span-9">
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                  className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] font-semibold focus:outline-none focus:border-[var(--text-main)]"
                >
                  <option value="GOODS">Goods</option>
                  <option value="SERVICE">Service</option>
                  <option value="COMBO">Combo</option>
                </select>
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="grid grid-cols-12 items-center gap-4 border-b border-[var(--border-color)] pb-4">
              <label className="col-span-3 font-bold text-xs text-[var(--text-main)]">
                Category *
              </label>
              <div className="col-span-9 flex items-center gap-2">
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="flex-1 rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] font-semibold focus:outline-none focus:border-[var(--text-main)]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setShowNewCategoryModal(true)}
                  className="btn-outline px-3 py-2 text-xs font-bold rounded-md whitespace-nowrap"
                >
                  + New Category
                </button>
              </div>
            </div>

            {/* Sales Price & Cost */}
            <div className="grid grid-cols-12 items-center gap-4 border-b border-[var(--border-color)] pb-4">
              <label className="col-span-3 font-bold text-xs text-[var(--text-main)]">
                Pricing (₹)
              </label>
              <div className="col-span-9 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-[var(--text-muted)] font-semibold mb-1">Sales Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.salesPrice}
                    onChange={(e) => setForm({ ...form, salesPrice: e.target.value })}
                    placeholder="0.00"
                    className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[var(--text-muted)] font-semibold mb-1">Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                    placeholder="0.00"
                    className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div className="grid grid-cols-12 items-start gap-4 pb-2">
              <label className="col-span-3 font-bold text-xs text-[var(--text-main)] pt-2">
                Product Image
              </label>
              <div className="col-span-9 flex items-center gap-4">
                {form.image ? (
                  <img
                    src={form.image}
                    alt="Preview"
                    className="w-16 h-16 rounded-lg object-cover border border-[var(--border-color)]"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-[var(--badge-bg)] border border-[var(--border-color)] flex items-center justify-center text-xs text-[var(--text-muted)] font-mono">
                    No Image
                  </div>
                )}
                <div className="space-y-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-xs text-[var(--text-muted)] file:mr-2 file:py-1 file:px-3 file:rounded-md file:border file:border-[var(--border-color)] file:bg-[var(--bg-primary)] file:text-[var(--text-main)] file:text-xs file:font-semibold"
                  />
                  {form.image && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image: "" })}
                      className="text-[10px] text-red-400 hover:underline block"
                    >
                      Remove Image
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-outline px-4 py-2 text-xs font-bold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-outline px-5 py-2 text-xs font-bold rounded-lg border-2 bg-[var(--badge-bg)]"
              >
                {saving ? "Saving..." : editingId ? "Update Product" : "Create Product"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* --- INLINE CATEGORY CREATION MODAL --- */}
      <Modal
        isOpen={showNewCategoryModal}
        onClose={() => setShowNewCategoryModal(false)}
        title="Add New Category"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Category Name *</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g. Electronics, Services"
              className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowNewCategoryModal(false)}
              className="btn-outline px-3 py-1.5 text-xs font-bold rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateCategoryOnTheFly}
              disabled={creatingCategory}
              className="btn-outline px-4 py-1.5 text-xs font-bold rounded-md bg-[var(--badge-bg)]"
            >
              {creatingCategory ? "Creating..." : "Save Category"}
            </button>
          </div>
        </div>
      </Modal>

      {/* --- LIST VIEW --- */}
      {viewMode === "list" && (
        <div className="card-mono shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-[var(--border-color)] bg-[var(--badge-bg)] flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black text-[var(--text-main)]">Products Master</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Click any product item to edit details in popup component.
              </p>
            </div>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Total: {products.length}</span>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-16 text-center text-xs text-[var(--text-muted)]">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="py-16 text-center text-xs text-[var(--text-muted)]">No products found.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Image</th>
                    <th className="py-3.5 px-4">Product Name</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4 text-right">Sales Price</th>
                    <th className="py-3.5 px-4 text-right">Cost</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]/60">
                  {products.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => handleEdit(p)}
                      className="hover:bg-[var(--card-hover)] cursor-pointer transition-colors"
                    >
                      <td className="py-2 px-4">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-8 h-8 rounded object-cover border border-[var(--border-color)]" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-[var(--badge-bg)] border border-[var(--border-color)] flex items-center justify-center font-bold text-[10px]">
                            {p.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[var(--text-main)]">{p.name}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--badge-bg)] border border-[var(--border-color)]">
                          {p.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-muted)]">{p.category?.name || "—"}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">₹{p.salesPrice?.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-[var(--text-muted)]">₹{p.cost?.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEdit(p)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded border border-[var(--border-color)] hover:bg-[var(--badge-bg)] text-[var(--text-main)]"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* --- KANBAN VIEW --- */}
      {viewMode === "kanban" && (
        <div className="space-y-4">
          <div className="card-mono p-4 border-b border-[var(--border-color)] flex justify-between items-center">
            <h2 className="text-lg font-black text-[var(--text-main)]">Products Master</h2>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Total: {products.length}</span>
          </div>

          {loading ? (
            <div className="card-mono py-16 text-center text-xs text-[var(--text-muted)]">Loading kanban cards...</div>
          ) : products.length === 0 ? (
            <div className="card-mono py-16 text-center text-xs text-[var(--text-muted)]">No products found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleEdit(p)}
                  className="card-mono p-4 hover:shadow-xl cursor-pointer transition-all border hover:border-[var(--text-main)] flex items-start gap-3"
                >
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover border border-[var(--border-color)] shadow-sm shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[var(--text-main)] text-[var(--bg-primary)] font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                      {p.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="space-y-1 min-w-0 flex-1 text-xs">
                    <h3 className="font-bold text-[var(--text-main)] truncate">{p.name}</h3>
                    <span className="inline-block rounded bg-[var(--badge-bg)] border border-[var(--border-color)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                      {p.type}
                    </span>
                    <p className="font-mono font-bold text-emerald-400">₹{p.salesPrice?.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
