"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  const [viewMode, setViewMode] = useState<"list" | "kanban" | "form">("list");
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
      const data = await res.json();
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
    setViewMode("form");
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
    setViewMode("form");
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
        setViewMode("list");
      }, 700);
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setSaving(false);
    }
  };

  // Image Upload helper (converts uploaded file to data URL)
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
      {/* Top Action & Navigation Controls */}
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

          {/* Search Box (visible in list & kanban view) */}
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

          {/* View Toggle Icons (List vs Kanban) */}
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
              {/* List View Icon */}
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
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
              {/* Kanban View Icon */}
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 5a1 1 0 011-1h4a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* --- FORM VIEW --- */}
      {viewMode === "form" && (
        <div className="card-mono p-8 shadow-2xl max-w-4xl mx-auto">
          <h2 className="text-xl font-black text-center text-[var(--text-main)] mb-8">
            Contact master Form View
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
            {/* Contact Name (Full Width Top Input Line) */}
            <div className="grid grid-cols-12 items-center gap-4 border-b border-[var(--border-color)] pb-4">
              <label className="col-span-3 font-bold text-sm text-[var(--text-main)]">
                Contact Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter Full Name"
                className="col-span-9 rounded-md border-b-2 border-[var(--border-color)] bg-transparent px-3 py-2 text-sm text-[var(--text-main)] font-semibold focus:outline-none focus:border-[var(--text-main)]"
                required
              />
            </div>

            {/* Two Column Layout: Left Fields & Right Upload Image Box */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Left Column: Email, Phone, Address */}
              <div className="md:col-span-8 space-y-4">
                {/* Email */}
                <div className="grid grid-cols-3 items-center gap-3">
                  <label className="font-semibold text-[var(--text-main)]">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="Unique Email"
                    className="col-span-2 rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--text-main)]"
                    required
                  />
                </div>

                {/* Phone */}
                <div className="grid grid-cols-3 items-center gap-3">
                  <label className="font-semibold text-[var(--text-main)]">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={form.mobile}
                    onChange={(e) =>
                      setForm({ ...form, mobile: e.target.value })
                    }
                    placeholder="+91 9090090909"
                    className="col-span-2 rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--text-main)]"
                  />
                </div>

                {/* Address Section */}
                <div className="pt-2 border-t border-[var(--border-color)]/40 space-y-3">
                  <div className="grid grid-cols-3 items-start gap-3">
                    <label className="font-semibold text-[var(--text-main)] pt-2">
                      Address
                    </label>
                    <div className="col-span-2 space-y-2.5">
                      <input
                        type="text"
                        value={form.street}
                        onChange={(e) =>
                          setForm({ ...form, street: e.target.value })
                        }
                        placeholder="Street"
                        className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)]"
                      />
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) =>
                          setForm({ ...form, city: e.target.value })
                        }
                        placeholder="City"
                        className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)]"
                      />
                      <input
                        type="text"
                        value={form.state}
                        onChange={(e) =>
                          setForm({ ...form, state: e.target.value })
                        }
                        placeholder="State"
                        className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)]"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={form.country}
                          onChange={(e) =>
                            setForm({ ...form, country: e.target.value })
                          }
                          placeholder="Country"
                          className="rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)]"
                        />
                        <input
                          type="text"
                          value={form.pincode}
                          onChange={(e) =>
                            setForm({ ...form, pincode: e.target.value })
                          }
                          placeholder="Pincode"
                          className="rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--text-main)]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Upload Image Box */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-6 border-2 border-dashed border-[var(--border-color)] rounded-xl bg-[var(--badge-bg)] text-center relative hover:border-[var(--text-main)] transition-colors min-h-[220px]">
                {form.image ? (
                  <div className="relative group w-full flex flex-col items-center">
                    <img
                      src={form.image}
                      alt="Contact Avatar"
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
                    <svg
                      className="w-10 h-10 text-[var(--text-muted)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="font-bold text-xs text-[var(--text-main)]">
                      Upload Image
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      Click to choose avatar
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
            </div>
          </form>
        </div>
      )}

      {/* --- LIST VIEW --- */}
      {viewMode === "list" && (
        <div className="card-mono shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-[var(--border-color)] bg-[var(--badge-bg)]">
            <h2 className="text-lg font-black text-[var(--text-main)]">
              Contacts
            </h2>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-16 text-center text-xs text-[var(--text-muted)]">
                Loading contact list...
              </div>
            ) : contacts.length === 0 ? (
              <div className="py-16 text-center text-xs text-[var(--text-muted)]">
                No contacts found matching criteria.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Image</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]/60">
                  {contacts.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => handleEdit(c)}
                      className="hover:bg-[var(--card-hover)] cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        {c.image ? (
                          <img
                            src={c.image}
                            alt={c.name}
                            className="w-8 h-8 rounded-lg object-cover border border-[var(--border-color)] shadow-sm"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-[var(--text-main)] text-[var(--bg-primary)] font-black text-xs flex items-center justify-center shadow-sm">
                            {c.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-[var(--text-main)]">
                        {c.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-[var(--text-muted)]">
                        {c.email}
                      </td>
                      <td className="py-3 px-4 font-mono text-[var(--text-muted)]">
                        {c.mobile || "—"}
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
          <div className="card-mono p-4 border-b border-[var(--border-color)]">
            <h2 className="text-lg font-black text-[var(--text-main)]">
              Contacts
            </h2>
          </div>

          {loading ? (
            <div className="card-mono py-16 text-center text-xs text-[var(--text-muted)]">
              Loading kanban cards...
            </div>
          ) : contacts.length === 0 ? (
            <div className="card-mono py-16 text-center text-xs text-[var(--text-muted)]">
              No contacts found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleEdit(c)}
                  className="card-mono p-4 hover:shadow-xl transition-all cursor-pointer border border-[var(--border-color)] hover:border-[var(--text-main)] flex items-start gap-3"
                >
                  {/* Card Avatar Image */}
                  {c.image ? (
                    <img
                      src={c.image}
                      alt={c.name}
                      className="w-12 h-12 rounded-xl object-cover border border-[var(--border-color)] shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[var(--text-main)] text-[var(--bg-primary)] font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                      {c.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <h3 className="font-bold text-xs text-[var(--text-main)] truncate">
                      {c.name}
                    </h3>
                    <p className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                      {c.email}
                    </p>
                    <p className="text-[11px] font-mono text-[var(--text-muted)]">
                      {c.mobile || "—"}
                    </p>
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
