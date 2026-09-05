"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  const [viewMode, setViewMode] = useState<"list" | "kanban" | "form">("list");
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
      const data = await res.json();
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
      const data = await res.json();
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
    setViewMode("form");
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
    setViewMode("form");
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
        setViewMode("list");
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
      // Refresh category list and auto-select new category
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

  // Row click handler
  const handleRowClick = (product: Product) => {
    handleEdit(product);
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
            New
          </button>

          {viewMode === "form" && (
            <button
              onClick={() => handleConfirm()}
              disabled={saving}
              className="btn-outline px-5 py-2 text-xs font-bold rounded-lg border-2 bg-[var(--badge-bg)]"
            >
              {saving ? "Saving..." : "Confirm"}
            </button>
          )}

          {/* Search Box */}
          {viewMode !== "form" && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)] font-mono"
              />
            </div>
          )}
        </div>

        {/* Right View Switchers & Back Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (viewMode === "form") {
                setViewMode("list");
              } else {
                router.push("/dashboard");
              }
            }}
            className="btn-outline px-5 py-2 text-xs font-bold rounded-lg"
          >
            Back
          </button>

          {/* View Mode Icons (List vs Kanban) */}
          <div className="flex items-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-1 gap-1">
            <button
              onClick={() => setViewMode("list")}
              title="List View"
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
              title="Kanban View"
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

      {/* --- PRODUCT FORM VIEW --- */}
      {viewMode === "form" && (
        <div className="card-mono p-8 shadow-2xl max-w-4xl mx-auto">
          <h2 className="text-xl font-black text-center text-[var(--text-main)] mb-8">
            Product Master Form View
          </h2>

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
            {/* Product Name (Full Width Underline Input) */}
            <div className="grid grid-cols-12 items-center gap-4 border-b border-[var(--border-color)] pb-4">
              <label className="col-span-3 font-bold text-sm text-[var(--text-main)]">
                Product Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter Product Name (e.g. Air Conditioner)"
                className="col-span-9 rounded-md border-b-2 border-[var(--border-color)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] font-semibold focus:outline-none focus:border-[var(--text-main)]"
                required
              />
            </div>

            {/* Product Type (Dropdown Selection of Goods, Service, Combo) */}
            <div className="grid grid-cols-12 items-center gap-4 border-b border-[var(--border-color)] pb-4">
              <label className="col-span-3 font-bold text-xs text-[var(--text-main)]">
                Product Type
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
                <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                  Provide Drop down selection of Goods, Service, Combo
                </p>
              </div>
            </div>

            {/* Category (Many2one selection with create on the fly) */}
            <div className="grid grid-cols-12 items-center gap-4 border-b border-[var(--border-color)] pb-4">
              <label className="col-span-3 font-bold text-xs text-[var(--text-main)]">
                Category
              </label>
              <div className="col-span-9 flex items-center gap-3">
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="flex-1 rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] font-semibold focus:outline-none focus:border-[var(--text-main)]"
                >
                  <option value="" disabled>
                    Select Category...
                  </option>
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
                  title="Create Category On The Fly"
                >
                  + New Category
                </button>
              </div>
            </div>

            {/* Layout with Image Upload Box on Left & Sales Price/Cost on Right */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start pt-2">
              {/* Left Side: Upload Image Box */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-6 border-2 border-dashed border-[var(--border-color)] rounded-xl bg-[var(--badge-bg)] text-center relative hover:border-[var(--text-main)] transition-colors min-h-[220px]">
                {form.image ? (
                  <div className="relative group w-full flex flex-col items-center">
                    <img
                      src={form.image}
                      alt="Product Preview"
                      className="w-32 h-32 object-cover rounded-xl border border-[var(--border-color)] shadow-md mb-2"
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image: "" })}
                      className="text-[11px] font-bold text-red-500 hover:underline"
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full space-y-2 py-6">
                    <svg className="w-10 h-10 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-bold text-xs text-[var(--text-main)]">
                      Upload Image
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      Click to choose product image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Right Side: Sales Price & Cost */}
              <div className="md:col-span-8 space-y-6 pt-4">
                {/* Sales Price */}
                <div className="grid grid-cols-3 items-center gap-3">
                  <label className="font-bold text-xs text-[var(--text-main)]">
                    Sales Price
                  </label>
                  <div className="col-span-2 flex items-center gap-2">
                    <span className="font-bold text-xs text-[var(--text-muted)]">Rs.</span>
                    <input
                      type="number"
                      step="0.01"
                      value={form.salesPrice}
                      onChange={(e) => setForm({ ...form, salesPrice: e.target.value })}
                      placeholder="100.00"
                      className="w-full rounded-md border-b-2 border-[var(--border-color)] bg-transparent px-3 py-2 text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--text-main)]"
                      required
                    />
                  </div>
                </div>

                {/* Cost */}
                <div className="grid grid-cols-3 items-center gap-3">
                  <label className="font-bold text-xs text-[var(--text-main)]">
                    Cost
                  </label>
                  <div className="col-span-2 flex items-center gap-2">
                    <span className="font-bold text-xs text-[var(--text-muted)]">Rs.</span>
                    <input
                      type="number"
                      step="0.01"
                      value={form.cost}
                      onChange={(e) => setForm({ ...form, cost: e.target.value })}
                      placeholder="50.00"
                      className="w-full rounded-md border-b-2 border-[var(--border-color)] bg-transparent px-3 py-2 text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--text-main)]"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* --- PRODUCT LIST VIEW --- */}
      {viewMode === "list" && (
        <div className="card-mono shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-[var(--border-color)] bg-[var(--badge-bg)]">
            <h2 className="text-lg font-black text-[var(--text-main)]">
              Product Master List View
            </h2>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-16 text-center text-xs text-[var(--text-muted)]">
                Loading products...
              </div>
            ) : products.length === 0 ? (
              <div className="py-16 text-center text-xs text-[var(--text-muted)]">
                No products found.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Image</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Sales Price</th>
                    <th className="py-3 px-4">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]/60">
                  {products.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => handleRowClick(p)}
                      className="hover:bg-[var(--card-hover)] cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-8 h-8 rounded-lg object-cover border border-[var(--border-color)] shadow-sm"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-[var(--text-main)] text-[var(--bg-primary)] font-black text-xs flex items-center justify-center shadow-sm">
                            {p.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-[var(--text-main)]">
                        {p.name}
                      </td>
                      <td className="py-3 px-4 font-medium text-[var(--text-muted)]">
                        {p.category?.name || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="rounded bg-[var(--badge-bg)] border border-[var(--border-color)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--text-main)]">
                          {p.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[var(--text-main)]">
                        Rs. {p.salesPrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-[var(--text-muted)]">
                        Rs. {p.cost.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* --- PRODUCT KANBAN VIEW --- */}
      {viewMode === "kanban" && (
        <div className="space-y-4">
          <div className="card-mono p-4 border-b border-[var(--border-color)]">
            <h2 className="text-lg font-black text-[var(--text-main)]">
              Product Master Kanban View
            </h2>
          </div>

          {loading ? (
            <div className="card-mono py-16 text-center text-xs text-[var(--text-muted)]">
              Loading kanban cards...
            </div>
          ) : products.length === 0 ? (
            <div className="card-mono py-16 text-center text-xs text-[var(--text-muted)]">
              No products found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleRowClick(p)}
                  className="card-mono p-4 hover:shadow-xl transition-all cursor-pointer border border-[var(--border-color)] hover:border-[var(--text-main)] flex items-start gap-3.5"
                >
                  {/* Image */}
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-14 h-14 rounded-xl object-cover border border-[var(--border-color)] shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-[var(--text-main)] text-[var(--bg-primary)] font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                      {p.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  {/* Info */}
                  <div className="space-y-1 min-w-0 flex-1 text-xs">
                    <h3 className="font-bold text-sm text-[var(--text-main)] truncate">
                      {p.name}
                    </h3>
                    <p className="font-mono text-[11px] font-semibold text-[var(--text-main)]">
                      Sales Price: {p.salesPrice.toLocaleString()}
                    </p>
                    <p className="font-mono text-[11px] text-[var(--text-muted)]">
                      Cost: {p.cost.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- INLINE CREATE CATEGORY MODAL --- */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card-mono w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[var(--text-main)]">
              Create New Category On The Fly
            </h3>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                Category Name
              </label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Electronics, Home Decor"
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)]"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowNewCategoryModal(false);
                  setNewCategoryName("");
                }}
                className="btn-outline px-4 py-1.5 text-xs font-bold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCategoryOnTheFly}
                disabled={creatingCategory || !newCategoryName.trim()}
                className="btn-primary px-4 py-1.5 text-xs font-bold rounded-lg"
              >
                {creatingCategory ? "Saving..." : "Save & Select"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
