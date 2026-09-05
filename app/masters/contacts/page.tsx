"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";

interface Contact {
  id: string;
  name: string;
  type: "CUSTOMER" | "VENDOR" | "BOTH";
  email: string;
  mobile?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  image?: string | null;
  country?: string | null;
}

export default function ContactMasterPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    street: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    image: "",
    type: "CUSTOMER" as "CUSTOMER" | "VENDOR" | "BOTH",
  });

  // Fetch contacts from backend
  const fetchContacts = async () => {
    setLoading(true);
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/contacts${query}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.contacts) {
        setContacts(data.contacts);
      }
    } catch (e) {
      console.error("Failed to load contacts:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [search]);

  // Open empty form for creating new contact
  const handleNew = () => {
    setEditingId(null);
    setForm({
      name: "",
      email: "",
      mobile: "",
      street: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
      image: "",
      type: "CUSTOMER",
    });
    setErr("");
    setSuccessMsg("");
    setShowModal(true);
  };

  // Open form for editing existing contact
  const handleEdit = (contact: Contact) => {
    setEditingId(contact.id);
    setForm({
      name: contact.name || "",
      email: contact.email || "",
      mobile: contact.mobile || "",
      street: contact.street || "",
      city: contact.city || "",
      state: contact.state || "",
      country: contact.country || "India",
      pincode: contact.pincode || "",
      image: contact.image || "",
      type: contact.type || "CUSTOMER",
    });
    setErr("");
    setSuccessMsg("");
    setShowModal(true);
  };

  // Handle Form Submit (Confirm)
  const handleConfirm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErr("");
    setSuccessMsg("");

    if (!form.name.trim()) {
      setErr("Contact Name is required.");
      return;
    }
    if (!form.email.trim()) {
      setErr("Email is required.");
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/contacts/${editingId}` : "/api/contacts";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save contact");
      }

      setSuccessMsg(
        editingId
          ? "Contact updated successfully!"
          : "Contact created successfully!",
      );

      await fetchContacts();
      setTimeout(() => {
        setShowModal(false);
      }, 700);
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setSaving(false);
    }
  };

  // Helper for converting uploaded image to Base64 data URL
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
            + New Contact
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

          {/* View Toggle Icons (List vs Kanban) */}
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
        title={editingId ? "Edit Contact" : "Create New Contact"}
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
            {/* Contact Name & Image Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-[var(--border-color)] pb-6">
              <div className="flex-1 w-full space-y-2">
                <label className="block font-bold text-xs text-[var(--text-main)]">
                  Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. John Doe / ACME Corp"
                  className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-main)] font-bold focus:outline-none focus:border-[var(--text-main)]"
                  required
                />
              </div>

              {/* Profile Image Box */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="relative">
                  {form.image ? (
                    <img
                      src={form.image}
                      alt="Avatar"
                      className="w-16 h-16 rounded-xl object-cover border-2 border-[var(--border-color)] shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-[var(--badge-bg)] border-2 border-dashed border-[var(--border-color)] flex items-center justify-center text-xs font-mono text-[var(--text-muted)]">
                      Avatar
                    </div>
                  )}
                </div>
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
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Type Radio Options */}
            <div className="space-y-2 border-b border-[var(--border-color)] pb-4">
              <label className="block font-bold text-xs text-[var(--text-main)]">
                Contact Type
              </label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="radio"
                    name="contactType"
                    value="CUSTOMER"
                    checked={form.type === "CUSTOMER"}
                    onChange={() => setForm({ ...form, type: "CUSTOMER" })}
                    className="accent-[var(--text-main)]"
                  />
                  Customer
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="radio"
                    name="contactType"
                    value="VENDOR"
                    checked={form.type === "VENDOR"}
                    onChange={() => setForm({ ...form, type: "VENDOR" })}
                    className="accent-[var(--text-main)]"
                  />
                  Vendor
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="radio"
                    name="contactType"
                    value="BOTH"
                    checked={form.type === "BOTH"}
                    onChange={() => setForm({ ...form, type: "BOTH" })}
                    className="accent-[var(--text-main)]"
                  />
                  Both (Customer & Vendor)
                </label>
              </div>
            </div>

            {/* Email & Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-[var(--border-color)] pb-4">
              <div>
                <label className="block font-semibold text-xs text-[var(--text-muted)] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-xs text-[var(--text-muted)] mb-1">
                  Mobile Number
                </label>
                <input
                  type="text"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none"
                />
              </div>
            </div>

            {/* Address Details */}
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-[var(--text-main)]">
                Address Details
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={form.street}
                  onChange={(e) => setForm({ ...form, street: e.target.value })}
                  placeholder="Street Address / Building / Suite"
                  className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none"
                />

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="City"
                    className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none"
                  />
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="State"
                    className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none"
                  />
                  <input
                    type="text"
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    placeholder="ZIP / Pincode"
                    className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none font-mono"
                  />
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
                {saving ? "Saving..." : editingId ? "Update Contact" : "Create Contact"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* --- LIST VIEW --- */}
      {viewMode === "list" && (
        <div className="card-mono shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-[var(--border-color)] bg-[var(--badge-bg)] flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black text-[var(--text-main)]">Contacts Master</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Click any contact item to edit details in popup component.
              </p>
            </div>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Total: {contacts.length}</span>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-16 text-center text-xs text-[var(--text-muted)]">Loading contacts...</div>
            ) : contacts.length === 0 ? (
              <div className="py-16 text-center text-xs text-[var(--text-muted)]">No contacts found.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Avatar</th>
                    <th className="py-3.5 px-4">Name</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Mobile</th>
                    <th className="py-3.5 px-4">City</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]/60">
                  {contacts.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => handleEdit(c)}
                      className="hover:bg-[var(--card-hover)] cursor-pointer transition-colors"
                    >
                      <td className="py-2 px-4">
                        {c.image ? (
                          <img src={c.image} alt={c.name} className="w-8 h-8 rounded object-cover border border-[var(--border-color)]" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-[var(--badge-bg)] border border-[var(--border-color)] flex items-center justify-center font-bold text-[10px]">
                            {c.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[var(--text-main)]">{c.name}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--badge-bg)] border border-[var(--border-color)]">
                          {c.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-muted)] font-mono">{c.email}</td>
                      <td className="py-3.5 px-4 text-[var(--text-muted)] font-mono">{c.mobile || "—"}</td>
                      <td className="py-3.5 px-4 text-[var(--text-muted)]">{c.city || "—"}</td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEdit(c)}
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
            <h2 className="text-lg font-black text-[var(--text-main)]">Contacts Master</h2>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Total: {contacts.length}</span>
          </div>

          {loading ? (
            <div className="card-mono py-16 text-center text-xs text-[var(--text-muted)]">Loading kanban cards...</div>
          ) : contacts.length === 0 ? (
            <div className="card-mono py-16 text-center text-xs text-[var(--text-muted)]">No contacts found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleEdit(c)}
                  className="card-mono p-4 hover:shadow-xl cursor-pointer transition-all border hover:border-[var(--text-main)] flex items-start gap-3"
                >
                  {c.image ? (
                    <img src={c.image} alt={c.name} className="w-12 h-12 rounded-xl object-cover border border-[var(--border-color)] shadow-sm shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[var(--text-main)] text-[var(--bg-primary)] font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                      {c.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="space-y-1 min-w-0 flex-1 text-xs">
                    <h3 className="font-bold text-[var(--text-main)] truncate">{c.name}</h3>
                    <span className="inline-block rounded bg-[var(--badge-bg)] border border-[var(--border-color)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                      {c.type}
                    </span>
                    <p className="font-mono text-[10px] text-[var(--text-muted)] truncate">{c.email}</p>
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
