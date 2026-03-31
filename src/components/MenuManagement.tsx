import React, { useEffect, useState } from "react";
import { ref, onValue, set, update, remove, push } from "firebase/database";
import { db } from "../config/firebase";
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Check, Upload } from "lucide-react";
import { DEFAULT_CAKES } from "./ReadyMadeCakes";

type Category = "Birthday" | "Wedding" | "Anniversary" | "Baby Shower" | "Graduation" | "Holiday";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  image: string;
  flavor: string;
  size: string;
  price: number;
  available: boolean;
  category: Category;
}

const CATEGORIES: Category[] = ["Birthday", "Wedding", "Anniversary", "Baby Shower", "Graduation", "Holiday"];

const EMPTY_FORM = { name: "", description: "", image: "", flavor: "", size: "", price: 0, available: true, category: "Birthday" as Category };

const s: Record<string, React.CSSProperties> = {
  root:        { minHeight: "100vh", background: "#F4E9F2", fontFamily: "system-ui, sans-serif", padding: "32px 24px 64px" },
  inner:       { maxWidth: 1100, margin: "0 auto" },
  input:       { width: "100%", padding: "10px 14px", border: "1.5px solid rgba(216,159,200,0.4)", borderRadius: 12, fontSize: 13, color: "#4a2e42", fontFamily: "system-ui, sans-serif", outline: "none", background: "#fff", boxSizing: "border-box" },
  label:       { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#8b6f84", marginBottom: 5, display: "block" },
  primaryBtn:  { padding: "10px 20px", background: "linear-gradient(135deg,#d89fc8,#c77db3)", color: "#fff", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "system-ui, sans-serif" },
  ghostBtn:    { padding: "8px 16px", background: "none", border: "1.5px solid rgba(216,159,200,0.4)", borderRadius: 10, fontSize: 12, color: "#8b6f84", cursor: "pointer", fontFamily: "system-ui, sans-serif" },
  dangerBtn:   { padding: "7px 12px", background: "none", border: "1.5px solid rgba(239,68,68,0.3)", borderRadius: 10, fontSize: 12, color: "#ef4444", cursor: "pointer", fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", gap: 4 },
  overlay:     { position: "fixed" as const, inset: 0, background: "rgba(74,46,66,0.5)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
  modal:       { background: "#fff", borderRadius: 24, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" as const, boxShadow: "0 24px 80px rgba(74,46,66,0.2)", fontFamily: "system-ui, sans-serif" },
  modalHeader: { padding: "22px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" },
  modalBody:   { padding: "20px 24px 28px" },
  row:         { display: "flex", gap: 12, marginBottom: 14 },
  col:         { flex: 1, minWidth: 0 },
};

export function MenuManagement() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<Category | "All">("All");

  useEffect(() => {
    const unsub = onValue(ref(db, "menuItems"), (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setItems([]);
        setLoading(false);
        return;
      }
      const list: MenuItem[] = Object.entries(data).map(([key, val]: [string, any]) => ({
        id: key,
        ...(val as Omit<MenuItem, "id">),
      }));
      list.sort((a, b) => a.name.localeCompare(b.name));
      setItems(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Seed default cakes if menu is empty
  const seedDefaults = async () => {
    setSeeding(true);
    try {
      for (const cake of DEFAULT_CAKES) {
        await push(ref(db, "menuItems"), cake);
      }
    } finally {
      setSeeding(false);
    }
  };

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setSaveError(""); setShowForm(true); };
  const openEdit = (item: MenuItem) => { setEditing(item); setForm({ name: item.name, description: item.description, image: item.image, flavor: item.flavor, size: item.size, price: item.price, available: item.available, category: item.category }); setSaveError(""); setShowForm(true); };

  // Compress image to max 800×600 JPEG at 80% quality before saving to Firebase
  const compressImage = (dataUrl: string): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = dataUrl;
    });

  const saveItem = async () => {
    if (!form.name.trim() || !form.price) return;
    setSaving(true);
    setSaveError("");
    try {
      let imageData = form.image;
      if (imageData && imageData.startsWith("data:")) {
        imageData = await compressImage(imageData);
      }
      const payload = { ...form, image: imageData };
      if (editing) {
        await update(ref(db, `menuItems/${editing.id}`), payload);
      } else {
        await push(ref(db, "menuItems"), payload);
      }
      setShowForm(false);
    } catch (e: any) {
      setSaveError(e?.message ?? "Failed to save. Try a smaller image.");
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    await update(ref(db, `menuItems/${item.id}`), { available: !item.available });
  };

  const deleteItem = async (id: string) => {
    setDeleting(id);
    try { await remove(ref(db, `menuItems/${id}`)); }
    finally { setDeleting(null); }
  };

  const f = (field: keyof typeof EMPTY_FORM, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const filtered = filterCat === "All" ? items : items.filter((i) => i.category === filterCat);
  const available = items.filter((i) => i.available).length;
  const hidden = items.filter((i) => !i.available).length;

  return (
    <div style={s.root}>
      <div style={s.inner}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 30, fontWeight: 400, color: "#4a2e42", margin: 0 }}>Menu Management</h1>
            <p style={{ fontSize: 13, color: "#8b6f84", marginTop: 6 }}>Add, edit, or hide cakes — customers see changes instantly</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {items.length === 0 && !loading && (
              <button style={s.ghostBtn} onClick={seedDefaults} disabled={seeding}>
                {seeding ? "Seeding…" : "⚡ Load Default Menu"}
              </button>
            )}
            <button style={s.primaryBtn} onClick={openAdd}>
              <Plus size={15} /> Add Cake
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { label: "Total Items", value: items.length, color: "#4a2e42" },
            { label: "Visible to Customers", value: available, color: "#15803d" },
            { label: "Hidden", value: hidden, color: "#8b6f84" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "#fff", borderRadius: 16, padding: "14px 20px", border: "1px solid rgba(216,159,200,0.25)", boxShadow: "0 2px 8px rgba(216,159,200,0.08)", minWidth: 120 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: stat.color, fontFamily: "Georgia, serif" }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: "#8b6f84", marginTop: 2, fontWeight: 600, letterSpacing: "0.04em" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Category filter */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {(["All", ...CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat as any)}
              style={{
                padding: "7px 16px", borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", fontFamily: "system-ui, sans-serif", transition: "all 0.15s",
                background: filterCat === cat ? "linear-gradient(135deg,#d89fc8,#c77db3)" : "rgba(255,255,255,0.8)",
                color: filterCat === cat ? "#fff" : "#8b6f84",
                boxShadow: filterCat === cat ? "0 4px 12px rgba(199,125,179,0.3)" : "none",
              }}
            >{cat}</button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: "#fff", borderRadius: 24, border: "1px solid rgba(216,159,200,0.3)", overflow: "hidden", boxShadow: "0 4px 32px rgba(216,159,200,0.1)" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#8b6f84", fontSize: 14 }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎂</div>
              <p style={{ color: "#8b6f84", fontSize: 14, margin: 0 }}>No menu items yet. Click "Add Cake" or "Load Default Menu" to get started.</p>
            </div>
          ) : (
            <>
              {/* Header row */}
              <div style={{ display: "grid", gridTemplateColumns: "64px 1fr 100px 90px 100px 130px", padding: "12px 20px", background: "rgba(216,159,200,0.08)", borderBottom: "1px solid rgba(216,159,200,0.2)" }}>
                {["Image", "Cake", "Category", "Price", "Status", "Actions"].map((h) => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8b6f84" }}>{h}</span>
                ))}
              </div>

              {filtered.map((item, idx) => (
                <div
                  key={item.id}
                  style={{ display: "grid", gridTemplateColumns: "64px 1fr 100px 90px 100px 130px", padding: "14px 20px", borderBottom: idx < filtered.length - 1 ? "1px solid rgba(216,159,200,0.12)" : "none", alignItems: "center", opacity: item.available ? 1 : 0.55 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(216,159,200,0.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Thumbnail */}
                  <div style={{ width: 48, height: 48, borderRadius: 10, overflow: "hidden", background: "#f9eef7", flexShrink: 0 }}>
                    {item.image ? <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🎂</div>}
                  </div>

                  {/* Name + details */}
                  <div style={{ minWidth: 0, paddingLeft: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#4a2e42", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: "#8b6f84", marginTop: 2 }}>{item.flavor} · {item.size}</div>
                  </div>

                  {/* Category */}
                  <span style={{ fontSize: 11, color: "#c77db3", background: "rgba(199,125,179,0.1)", padding: "3px 10px", borderRadius: 100, fontWeight: 600, whiteSpace: "nowrap", justifySelf: "start" }}>
                    {item.category}
                  </span>

                  {/* Price */}
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#4a2e42" }}>₱{item.price.toLocaleString()}</span>

                  {/* Visibility */}
                  <span style={{ fontSize: 11, fontWeight: 700, color: item.available ? "#15803d" : "#8b6f84", background: item.available ? "rgba(34,197,94,0.1)" : "rgba(216,159,200,0.1)", padding: "3px 10px", borderRadius: 100, justifySelf: "start" }}>
                    {item.available ? "Visible" : "Hidden"}
                  </span>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      title={item.available ? "Hide from menu" : "Show on menu"}
                      onClick={() => toggleAvailability(item)}
                      style={{ ...s.ghostBtn, padding: "6px 10px", display: "flex", alignItems: "center" }}
                    >
                      {item.available ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button title="Edit" onClick={() => openEdit(item)} style={{ ...s.ghostBtn, padding: "6px 10px", display: "flex", alignItems: "center" }}>
                      <Pencil size={13} />
                    </button>
                    <button
                      title="Delete"
                      onClick={() => deleteItem(item.id)}
                      disabled={deleting === item.id}
                      style={{ ...s.dangerBtn, padding: "6px 10px" }}
                    >
                      {deleting === item.id ? <span style={{ fontSize: 11 }}>…</span> : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      {showForm && (
        <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c77db3" }}>{editing ? "Edit Cake" : "New Cake"}</p>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#4a2e42", fontFamily: "Georgia, serif" }}>{editing ? editing.name : "Add to Menu"}</h3>
              </div>
              <button onClick={() => setShowForm(false)} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "rgba(216,159,200,0.15)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#8b6f84" }}>
                <X size={16} />
              </button>
            </div>

            <div style={s.modalBody}>
              {/* Name */}
              <div style={{ marginBottom: 14 }}>
                <label style={s.label}>Cake Name *</label>
                <input style={s.input} value={form.name} onChange={(e) => f("name", e.target.value)} placeholder="e.g. Birthday Celebration Cake" />
              </div>

              {/* Description */}
              <div style={{ marginBottom: 14 }}>
                <label style={s.label}>Description</label>
                <textarea
                  style={{ ...s.input, minHeight: 60, resize: "vertical" as const }}
                  value={form.description}
                  onChange={(e) => f("description", e.target.value)}
                  placeholder="Short description of the cake"
                />
              </div>

              {/* Flavor + Size */}
              <div style={s.row}>
                <div style={s.col}>
                  <label style={s.label}>Flavor</label>
                  <input style={s.input} value={form.flavor} onChange={(e) => f("flavor", e.target.value)} placeholder="e.g. Chocolate" />
                </div>
                <div style={s.col}>
                  <label style={s.label}>Size</label>
                  <input style={s.input} value={form.size} onChange={(e) => f("size", e.target.value)} placeholder='e.g. 8"x4"' />
                </div>
              </div>

              {/* Price + Category */}
              <div style={s.row}>
                <div style={s.col}>
                  <label style={s.label}>Price (₱) *</label>
                  <input style={s.input} type="number" min={0} value={form.price || ""} onChange={(e) => f("price", Number(e.target.value))} placeholder="1800" />
                </div>
                <div style={s.col}>
                  <label style={s.label}>Category</label>
                  <select style={{ ...s.input }} value={form.category} onChange={(e) => f("category", e.target.value as Category)}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Image Upload */}
              <div style={{ marginBottom: 14 }}>
                <label style={s.label}>Cake Image</label>
                <input
                  id="menu-img-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onloadend = () => f("image", reader.result as string);
                    reader.readAsDataURL(file);
                    e.target.value = "";
                  }}
                />
                {form.image ? (
                  <div style={{ position: "relative", width: "100%", height: 140, borderRadius: 12, overflow: "hidden", border: "1.5px solid rgba(216,159,200,0.4)" }}>
                    <img src={form.image} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button
                      type="button"
                      onClick={() => f("image", "")}
                      style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%", background: "rgba(74,46,66,0.7)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <X size={13} color="#fff" />
                    </button>
                    <button
                      type="button"
                      onClick={() => document.getElementById("menu-img-upload")?.click()}
                      style={{ position: "absolute", bottom: 8, right: 8, padding: "5px 10px", borderRadius: 8, background: "rgba(74,46,66,0.7)", border: "none", cursor: "pointer", color: "#fff", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <Upload size={11} /> Change
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => document.getElementById("menu-img-upload")?.click()}
                    style={{ width: "100%", padding: "22px 0", border: "2px dashed rgba(216,159,200,0.5)", borderRadius: 12, background: "rgba(216,159,200,0.04)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, color: "#8b6f84", fontFamily: "system-ui, sans-serif" }}
                  >
                    <Upload size={20} color="#c77db3" />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Click to upload image</span>
                    <span style={{ fontSize: 11 }}>PNG, JPG, WEBP supported</span>
                  </button>
                )}
              </div>

              {/* Visibility toggle */}
              <div
                onClick={() => f("available", !form.available)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${form.available ? "#c77db3" : "rgba(216,159,200,0.3)"}`, background: form.available ? "rgba(199,125,179,0.06)" : "rgba(216,159,200,0.04)", cursor: "pointer", marginBottom: 20 }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: form.available ? "#c77db3" : "#4a2e42" }}>Visible on Menu</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#8b6f84", marginTop: 2 }}>Customers can see and order this cake</p>
                </div>
                <div style={{ width: 36, height: 20, borderRadius: 10, background: form.available ? "#c77db3" : "rgba(216,159,200,0.3)", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                  <div style={{ position: "absolute", top: 2, left: form.available ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }} />
                </div>
              </div>

              {/* Error */}
              {saveError && (
                <p style={{ fontSize: 12, color: "#ef4444", background: "rgba(239,68,68,0.08)", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
                  ⚠️ {saveError}
                </p>
              )}

              {/* Buttons */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  style={{ ...s.primaryBtn, flex: 1, justifyContent: "center", opacity: (!form.name.trim() || !form.price) ? 0.5 : 1 }}
                  onClick={saveItem}
                  disabled={saving || !form.name.trim() || !form.price}
                >
                  {saving ? "Saving…" : <><Check size={14} /> {editing ? "Save Changes" : "Add to Menu"}</>}
                </button>
                <button style={s.ghostBtn} onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
