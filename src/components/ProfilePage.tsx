import React, { useState } from "react";
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { ref, update, get } from "firebase/database";
import { auth, db } from "../config/firebase";
import { useAuthStore } from "../store/authStore";
import { User, Mail, Shield, Lock, LogOut, Edit2, Check, X, Eye, EyeOff, Cake, Package, Star } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  customer: "Customer",
  staff: "Staff",
  production: "Production",
  sales: "Sales",
  admin: "Admin",
};

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  customer: { bg: "rgba(199,125,179,0.12)", color: "#c77db3" },
  staff: { bg: "rgba(59,130,246,0.10)", color: "#3b82f6" },
  production: { bg: "rgba(16,185,129,0.10)", color: "#10b981" },
  sales: { bg: "rgba(245,158,11,0.10)", color: "#f59e0b" },
  admin: { bg: "rgba(239,68,68,0.10)", color: "#ef4444" },
};

const S = {
  root: {
    background: "#F4E9F2",
    minHeight: "100vh",
    fontFamily: "system-ui, sans-serif",
    paddingBottom: 48,
  } as React.CSSProperties,

  hero: {
    background: "linear-gradient(135deg, #f9eef7 0%, #edd5e8 40%, #e8c8e2 100%)",
    padding: "48px 24px 80px",
    position: "relative" as const,
    overflow: "hidden",
    textAlign: "center" as const,
  },
  heroDeco: {
    position: "absolute" as const,
    right: -40,
    top: -40,
    width: 340,
    height: 340,
    borderRadius: "50%",
    background: "rgba(199,125,179,0.08)",
    pointerEvents: "none" as const,
  },
  heroDeco2: {
    position: "absolute" as const,
    left: -60,
    bottom: -80,
    width: 260,
    height: 260,
    borderRadius: "50%",
    background: "rgba(199,125,179,0.06)",
    pointerEvents: "none" as const,
  },

  avatar: {
    width: 96,
    height: 96,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #d89fc8 0%, #c77db3 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
    boxShadow: "0 8px 24px rgba(199,125,179,0.35)",
    fontSize: 36,
    fontWeight: 700,
    color: "#fff",
    letterSpacing: "-0.02em",
    position: "relative" as const,
    zIndex: 1,
  },

  heroName: {
    fontSize: 28,
    fontWeight: 400,
    color: "#4a2e42",
    margin: "0 0 6px",
    fontFamily: "Georgia, serif",
    position: "relative" as const,
    zIndex: 1,
  },
  heroEmail: {
    fontSize: 14,
    color: "#8b6f84",
    margin: "0 0 16px",
    position: "relative" as const,
    zIndex: 1,
  },

  roleBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    borderRadius: 100,
    padding: "5px 14px",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.04em",
    position: "relative" as const,
    zIndex: 1,
  },

  // Cards pulled up over the hero
  cardStack: {
    maxWidth: 560,
    margin: "-44px auto 0",
    padding: "0 16px",
    position: "relative" as const,
    zIndex: 2,
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
  },

  card: {
    background: "#fff",
    borderRadius: 20,
    border: "1.5px solid rgba(216,159,200,0.25)",
    boxShadow: "0 2px 16px rgba(199,125,179,0.08)",
    overflow: "hidden",
  },
  cardHeader: {
    padding: "18px 24px 14px",
    borderBottom: "1px solid rgba(216,159,200,0.15)",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "#4a2e42",
    margin: 0,
    fontFamily: "Georgia, serif",
    flex: 1,
  },
  cardBody: {
    padding: "20px 24px",
  },

  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 0",
    borderBottom: "1px solid rgba(216,159,200,0.1)",
  },
  rowLast: {
    borderBottom: "none",
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "#b8a0b0",
    minWidth: 90,
  },
  rowValue: {
    fontSize: 14,
    color: "#4a2e42",
    fontWeight: 500,
    flex: 1,
    textAlign: "right" as const,
  },

  input: {
    fontSize: 14,
    color: "#4a2e42",
    fontWeight: 500,
    background: "rgba(244,233,242,0.6)",
    border: "1.5px solid rgba(216,159,200,0.4)",
    borderRadius: 10,
    padding: "7px 12px",
    outline: "none",
    width: "100%",
    fontFamily: "system-ui, sans-serif",
    transition: "border-color 0.15s",
  },

  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "1.5px solid rgba(216,159,200,0.4)",
    background: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#8b6f84",
    transition: "all 0.15s",
    flexShrink: 0,
  },
  iconBtnPrimary: {
    background: "linear-gradient(135deg, #d89fc8 0%, #c77db3 100%)",
    border: "none",
    color: "#fff",
  },

  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "linear-gradient(135deg, #d89fc8 0%, #c77db3 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 100,
    padding: "11px 24px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(199,125,179,0.35)",
    transition: "all 0.18s",
    fontFamily: "system-ui, sans-serif",
    letterSpacing: "0.02em",
  },

  outlineBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "none",
    border: "1.5px solid rgba(216,159,200,0.5)",
    borderRadius: 100,
    padding: "10px 22px",
    fontSize: 13,
    color: "#8b6f84",
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
    fontWeight: 500,
    transition: "all 0.15s",
  },

  dangerBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "none",
    border: "1.5px solid rgba(239,68,68,0.25)",
    borderRadius: 100,
    padding: "10px 22px",
    fontSize: 13,
    color: "#ef4444",
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
    fontWeight: 500,
    transition: "all 0.15s",
  },

  statRow: {
    display: "flex",
    gap: 12,
  },
  stat: {
    flex: 1,
    background: "linear-gradient(135deg, #f9eef7 0%, #f0d9ec 100%)",
    borderRadius: 14,
    padding: "16px 14px",
    textAlign: "center" as const,
    border: "1.5px solid rgba(216,159,200,0.2)",
  },
  statNum: {
    fontSize: 24,
    fontWeight: 700,
    color: "#c77db3",
    display: "block",
    lineHeight: 1,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#8b6f84",
    fontWeight: 500,
    textTransform: "uppercase" as const,
    letterSpacing: "0.07em",
  },

  errorMsg: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 8,
    display: "block",
  },
  successMsg: {
    fontSize: 12,
    color: "#10b981",
    marginTop: 8,
    display: "block",
  },
} as const;

interface ProfilePageProps {
  onLogout?: () => void;
}

export function ProfilePage({ onLogout }: ProfilePageProps) {
  const { user, setUser } = useAuthStore();

  // Name editing
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.displayName ?? "");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState("");

  // Password changing
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  // Order count for customers
  const [orderCount, setOrderCount] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (!user || user.role !== "customer") return;
    get(ref(db, `orders/${user.uid}`)).then((snap) => {
      if (!snap.exists()) { setOrderCount(0); return; }
      const mine = snap.val() as Record<string, unknown>;
      setOrderCount(Object.keys(mine).length);
    }).catch(() => setOrderCount(0));
  }, [user?.uid]);

  if (!user) return null;

  const initials = (user.displayName ?? user.email ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roleColor = ROLE_COLORS[user.role] ?? ROLE_COLORS.customer;
  const memberSince = ""; // Firebase doesn't expose creation time easily here

  const handleSaveName = async () => {
    if (!nameValue.trim()) { setNameError("Name cannot be empty."); return; }
    setNameSaving(true);
    setNameError("");
    setNameSuccess("");
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: nameValue.trim() });
        await update(ref(db, `users/${user.uid}`), { name: nameValue.trim() });
      }
      setUser({ ...user, displayName: nameValue.trim() });
      setNameSuccess("Name updated!");
      setEditingName(false);
    } catch {
      setNameError("Failed to update name. Please try again.");
    } finally {
      setNameSaving(false);
    }
  };

  const handleCancelName = () => {
    setNameValue(user.displayName ?? "");
    setEditingName(false);
    setNameError("");
    setNameSuccess("");
  };

  const handleChangePassword = async () => {
    setPwError("");
    setPwSuccess("");
    if (!currentPw || !newPw || !confirmPw) { setPwError("All fields are required."); return; }
    if (newPw.length < 6) { setPwError("New password must be at least 6 characters."); return; }
    if (newPw !== confirmPw) { setPwError("New passwords do not match."); return; }
    if (!auth.currentUser || !user.email) { setPwError("Session expired. Please log in again."); return; }
    setPwSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPw);
      setPwSuccess("Password changed successfully!");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setShowPasswordForm(false);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setPwError("Current password is incorrect.");
      } else {
        setPwError("Failed to change password. Please try again.");
      }
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div style={S.root}>
      {/* Hero */}
      <div style={S.hero}>
        <div style={S.heroDeco} />
        <div style={S.heroDeco2} />
        <div style={S.avatar}>{initials}</div>
        <h1 style={S.heroName}>{user.displayName ?? "Your Profile"}</h1>
        <p style={S.heroEmail}>{user.email}</p>
        <span
          style={{
            ...S.roleBadge,
            background: roleColor.bg,
            color: roleColor.color,
          }}
        >
          <Shield style={{ width: 12, height: 12 }} />
          {ROLE_LABELS[user.role] ?? user.role}
        </span>
      </div>

      {/* Card Stack */}
      <div style={S.cardStack}>

        {/* Stats — only for customers */}
        {user.role === "customer" && (
          <div style={S.statRow}>
            <div style={S.stat}>
              <span style={S.statNum}>
                {orderCount === null ? "—" : orderCount}
              </span>
              <span style={S.statLabel}>Orders Placed</span>
            </div>
            <div style={S.stat}>
              <span style={S.statNum}>
                <Cake style={{ width: 22, height: 22, display: "inline", verticalAlign: "middle" }} />
              </span>
              <span style={S.statLabel}>Cake Lover</span>
            </div>
            <div style={S.stat}>
              <span style={S.statNum}>
                <Star style={{ width: 22, height: 22, display: "inline", verticalAlign: "middle" }} />
              </span>
              <span style={S.statLabel}>Member</span>
            </div>
          </div>
        )}

        {/* Personal Info */}
        <div style={S.card}>
          <div style={S.cardHeader}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #f9eef7, #f0d9ec)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <User style={{ width: 15, height: 15, color: "#c77db3" }} />
            </div>
            <h2 style={S.cardTitle}>Personal Info</h2>
          </div>
          <div style={S.cardBody}>
            {/* Name row */}
            <div style={S.row}>
              <span style={S.rowLabel}>Name</span>
              {editingName ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
                  <input
                    style={S.input}
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") handleCancelName(); }}
                    autoFocus
                    disabled={nameSaving}
                  />
                  <button
                    style={{ ...S.iconBtn, ...S.iconBtnPrimary }}
                    onClick={handleSaveName}
                    disabled={nameSaving}
                    title="Save"
                  >
                    <Check style={{ width: 14, height: 14 }} />
                  </button>
                  <button style={S.iconBtn} onClick={handleCancelName} title="Cancel">
                    <X style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              ) : (
                <>
                  <span style={S.rowValue}>{user.displayName ?? "—"}</span>
                  <button
                    style={{ ...S.iconBtn, marginLeft: 8 }}
                    onClick={() => { setEditingName(true); setNameSuccess(""); setNameError(""); }}
                    title="Edit name"
                  >
                    <Edit2 style={{ width: 13, height: 13 }} />
                  </button>
                </>
              )}
            </div>
            {nameError && <span style={S.errorMsg}>{nameError}</span>}
            {nameSuccess && <span style={S.successMsg}>{nameSuccess}</span>}

            {/* Email row */}
            <div style={{ ...S.row, ...S.rowLast }}>
              <span style={S.rowLabel}>Email</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Mail style={{ width: 13, height: 13, color: "#b8a0b0" }} />
                <span style={S.rowValue}>{user.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div style={S.card}>
          <div style={S.cardHeader}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #f9eef7, #f0d9ec)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Lock style={{ width: 15, height: 15, color: "#c77db3" }} />
            </div>
            <h2 style={S.cardTitle}>Security</h2>
          </div>
          <div style={S.cardBody}>
            {!showPasswordForm ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, color: "#4a2e42", fontWeight: 500 }}>Password</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#8b6f84" }}>Last changed: unknown</p>
                </div>
                <button style={S.outlineBtn} onClick={() => { setShowPasswordForm(true); setPwError(""); setPwSuccess(""); }}>
                  Change
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Current password */}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#b8a0b0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                    Current Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showCurrentPw ? "text" : "password"}
                      style={{ ...S.input, paddingRight: 40 }}
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      placeholder="Enter current password"
                      disabled={pwSaving}
                    />
                    <button
                      style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#8b6f84", padding: 0 }}
                      onClick={() => setShowCurrentPw((v) => !v)}
                      type="button"
                    >
                      {showCurrentPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                    </button>
                  </div>
                </div>
                {/* New password */}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#b8a0b0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                    New Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showNewPw ? "text" : "password"}
                      style={{ ...S.input, paddingRight: 40 }}
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      placeholder="At least 6 characters"
                      disabled={pwSaving}
                    />
                    <button
                      style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#8b6f84", padding: 0 }}
                      onClick={() => setShowNewPw((v) => !v)}
                      type="button"
                    >
                      {showNewPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                    </button>
                  </div>
                </div>
                {/* Confirm password */}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#b8a0b0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    style={S.input}
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="Repeat new password"
                    disabled={pwSaving}
                    onKeyDown={(e) => { if (e.key === "Enter") handleChangePassword(); }}
                  />
                </div>
                {pwError && <span style={S.errorMsg}>{pwError}</span>}
                {pwSuccess && <span style={S.successMsg}>{pwSuccess}</span>}
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button style={S.primaryBtn} onClick={handleChangePassword} disabled={pwSaving}>
                    {pwSaving ? "Saving…" : "Update Password"}
                  </button>
                  <button style={S.outlineBtn} onClick={() => { setShowPasswordForm(false); setCurrentPw(""); setNewPw(""); setConfirmPw(""); setPwError(""); }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account */}
        <div style={S.card}>
          <div style={S.cardHeader}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #f9eef7, #f0d9ec)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Package style={{ width: 15, height: 15, color: "#c77db3" }} />
            </div>
            <h2 style={S.cardTitle}>Account</h2>
          </div>
          <div style={S.cardBody}>
            <div style={{ ...S.row, ...S.rowLast }}>
              <div>
                <p style={{ margin: 0, fontSize: 14, color: "#4a2e42", fontWeight: 500 }}>Role</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#8b6f84" }}>
                  {user.role === "customer"
                    ? "You can order and customize cakes."
                    : `Internal ${ROLE_LABELS[user.role] ?? user.role} access.`}
                </p>
              </div>
              <span
                style={{
                  ...S.roleBadge,
                  background: roleColor.bg,
                  color: roleColor.color,
                  fontSize: 11,
                }}
              >
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Sign out */}
        {onLogout && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
            <button style={S.dangerBtn} onClick={onLogout}>
              <LogOut style={{ width: 14, height: 14 }} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
