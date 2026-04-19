import { useState, useEffect } from "react";
import { ref, onValue, set, update } from "firebase/database";
import { db, firebaseConfig } from "../config/firebase";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from "firebase/auth";
import type { FirebaseError } from "firebase/app";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Search, Plus, Edit, Trash2, Users, Mail, Phone, Calendar, Loader2, Eye, EyeOff, UserX } from "lucide-react";

interface StaffMember {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  hireDate: string;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  production: "Production",
  sales: "Sales",
  baker: "Baker",
};

const getRoleBadgeColor = (role: string) => {
  const colors: Record<string, string> = {
    production: "bg-orange-100 text-orange-800",
    sales: "bg-green-100 text-green-800",
    baker: "bg-amber-100 text-amber-800",
  };
  return colors[role] || "bg-gray-100 text-gray-800";
};

const formatDate = (dateString: string) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return fallback;
};

export function StaffManagement() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Add form
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", password: "", phone: "", role: "", hireDate: "" });

  // Edit form
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  // Password reset
  const [resetingPw, setResetingPw] = useState<string | null>(null);
  const [resetPwMsg, setResetPwMsg] = useState<{ uid: string; msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    setResetPwMsg(null);
  }, [isEditOpen, selectedStaff]);

  // Read staff from Firebase — users with role production/sales/staff
  useEffect(() => {
    const unsub = onValue(ref(db, "users"), (snap) => {
      const data = snap.val();
      if (!data) { setStaffMembers([]); setLoading(false); return; }
      const list: StaffMember[] = Object.entries(data)
        .map(([uid, val]) => ({ uid, ...(val as Omit<StaffMember, "uid">) }))
        .filter((u) => ["production", "sales", "staff", "baker"].includes(u.role));
      list.sort((a, b) => {
        if ((a.isActive !== false) !== (b.isActive !== false)) {
          return a.isActive === false ? 1 : -1;
        }
        return (a.name ?? "").localeCompare(b.name ?? "");
      });
      setStaffMembers(list);
      setLoading(false);
    }, () => { setStaffMembers([]); setLoading(false); });
    return () => unsub();
  }, []);

  const activeCount = staffMembers.filter((s) => s.isActive !== false).length;

  const filtered = staffMembers.filter((s) => {
    const matchSearch =
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === "all" || s.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Create real Firebase Auth account using a secondary app instance
  // so the admin session is not disrupted
  const handleAddStaff = async () => {
    setAdding(true);
    setAddError("");
    let secondaryApp;
    try {
      secondaryApp = initializeApp(firebaseConfig, `staff-create-${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);
      const cred = await createUserWithEmailAndPassword(secondaryAuth, newStaff.email, newStaff.password);
      await updateProfile(cred.user, { displayName: newStaff.name });

      // Write profile to Firebase DB
      await set(ref(db, `users/${cred.user.uid}`), {
        name: newStaff.name,
        email: newStaff.email,
        phone: newStaff.phone,
        role: newStaff.role,
        isActive: true,
        hireDate: newStaff.hireDate,
        createdAt: new Date().toISOString(),
      });

      await secondaryAuth.signOut();
      setNewStaff({ name: "", email: "", password: "", phone: "", role: "", hireDate: "" });
      setIsAddOpen(false);
    } catch (e: unknown) {
      const error = e as FirebaseError;
      const msg: Record<string, string> = {
        "auth/email-already-in-use": "An account with this email already exists.",
        "auth/invalid-email": "Invalid email address.",
        "auth/weak-password": "Password must be at least 6 characters.",
      };
      setAddError(msg[error.code] ?? getErrorMessage(error, "Failed to create account."));
    } finally {
      if (secondaryApp) await deleteApp(secondaryApp).catch(() => {});
      setAdding(false);
    }
  };

  const handleResetPassword = async (staff: StaffMember) => {
    if (!staff.email) return;
    setResetingPw(staff.uid);
    setResetPwMsg(null);
    try {
      await sendPasswordResetEmail(getAuth(), staff.email);
      setResetPwMsg({ uid: staff.uid, msg: `Reset email sent to ${staff.email}`, ok: true });
    } catch {
      setResetPwMsg({ uid: staff.uid, msg: "Failed to send reset email.", ok: false });
    } finally {
      setResetingPw(null);
    }
  };

  const handleUpdateStaff = async () => {
    if (!selectedStaff) return;
    setSaving(true);
    setEditError("");
    try {
      await update(ref(db, `users/${selectedStaff.uid}`), {
        name: selectedStaff.name,
        phone: selectedStaff.phone,
        role: selectedStaff.role,
        isActive: selectedStaff.isActive,
      });
      setIsEditOpen(false);
      setSelectedStaff(null);
    } catch (e: unknown) {
      setEditError(getErrorMessage(e, "Failed to save changes."));
    } finally {
      setSaving(false);
    }
  };

  // Deactivate instead of hard-delete (can't delete Firebase Auth from client)
  const handleDeactivate = async (uid: string) => {
    await update(ref(db, `users/${uid}`), { isActive: false });
  };

  const handleDeleteStaff = async (staff: StaffMember) => {
    setDeletingUid(staff.uid);
    setDeleteError("");
    try {
      await update(ref(db, `users/${staff.uid}`), { isActive: false });
    } catch (e: unknown) {
      setDeleteError(getErrorMessage(e, "Failed to disable staff member."));
    } finally {
      setDeletingUid(null);
    }
  };

  const addValid = newStaff.name && newStaff.email && newStaff.password.length >= 6 && newStaff.phone && newStaff.role && newStaff.hireDate;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2">Staff Management</h1>
        <p className="text-muted-foreground">Manage bakery staff accounts, roles, and access</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground mb-1">Total Staff</p>
            <h2>{staffMembers.length}</h2>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground mb-1">Active Staff</p>
            <h2 className="text-green-600">{activeCount}</h2>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground mb-1">Inactive Staff</p>
            <h2 className="text-red-600">{staffMembers.length - activeCount}</h2>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Staff Members</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="baker">Baker</SelectItem>
                </SelectContent>
              </Select>

              {/* Add Staff Dialog */}
              <Dialog open={isAddOpen} onOpenChange={(o) => { setIsAddOpen(o); setAddError(""); }}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4" /> Add Staff
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add New Staff Member</DialogTitle>
                    <DialogDescription>Creates a login account and adds them to the system.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input placeholder="e.g. Maria Santos" value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" placeholder="e.g. maria@cakewjoy.com" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Min. 6 characters"
                          value={newStaff.password}
                          onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                          className="pr-10"
                        />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input type="tel" placeholder="e.g. 09XX XXX XXXX" value={newStaff.phone} onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={newStaff.role} onValueChange={(v) => setNewStaff({ ...newStaff, role: v })}>
                        <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="production">Production</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Hire Date</Label>
                      <Input type="date" value={newStaff.hireDate} onChange={(e) => setNewStaff({ ...newStaff, hireDate: e.target.value })} />
                    </div>
                    {addError && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{addError}</p>}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                    <Button className="bg-primary hover:bg-primary/90" onClick={handleAddStaff} disabled={!addValid || adding}>
                      {adding ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating…</> : "Create Account"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          {deleteError && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-4">
              {deleteError}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">{searchQuery || roleFilter !== "all" ? "No staff match your search" : "No staff accounts yet"}</p>
              <p className="text-sm mt-1">{searchQuery || roleFilter !== "all" ? "Try a different filter" : "Click \"Add Staff\" to create the first account"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Hire Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((staff) => (
                    <TableRow key={staff.uid}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          {staff.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <a href={`mailto:${staff.email}`} className="hover:text-primary transition-colors">{staff.email}</a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {staff.phone || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(staff.role)}>
                          {ROLE_LABELS[staff.role] ?? staff.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {staff.isActive !== false
                          ? <Badge className="bg-green-100 text-green-800">Active</Badge>
                          : <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {formatDate(staff.hireDate)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">

                          {/* Edit Dialog */}
                          <Dialog open={isEditOpen && selectedStaff?.uid === staff.uid} onOpenChange={(o) => { setIsEditOpen(o); setEditError(""); }}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="gap-1" onClick={() => { setSelectedStaff(staff); setIsEditOpen(true); }}>
                                <Edit className="w-3 h-3" /> Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Edit Staff Member</DialogTitle>
                                <DialogDescription>Update staff details and access role.</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Full Name</Label>
                                  <Input value={selectedStaff?.name || ""} onChange={(e) => setSelectedStaff(s => s ? { ...s, name: e.target.value } : s)} />
                                </div>
                                <div className="space-y-2">
                                  <Label>Phone Number</Label>
                                  <Input value={selectedStaff?.phone || ""} onChange={(e) => setSelectedStaff(s => s ? { ...s, phone: e.target.value } : s)} />
                                </div>
                                <div className="space-y-2">
                                  <Label>Role</Label>
                                  <Select value={selectedStaff?.role || ""} onValueChange={(v) => setSelectedStaff(s => s ? { ...s, role: v } : s)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="production">Production</SelectItem>
                                      <SelectItem value="sales">Sales</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Status</Label>
                                  <Select value={selectedStaff?.isActive !== false ? "active" : "inactive"} onValueChange={(v) => setSelectedStaff(s => s ? { ...s, isActive: v === "active" } : s)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="active">Active</SelectItem>
                                      <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                {editError && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{editError}</p>}
                              </div>
                              {resetPwMsg && selectedStaff && resetPwMsg.uid === selectedStaff.uid && (
                                <p className={`text-xs px-1 ${resetPwMsg.ok ? "text-green-600" : "text-red-500"}`}>{resetPwMsg.msg}</p>
                              )}
                              <DialogFooter className="flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  disabled={resetingPw === selectedStaff?.uid}
                                  onClick={() => selectedStaff && handleResetPassword(selectedStaff)}
                                >
                                  {resetingPw === selectedStaff?.uid ? "Sending…" : "Send Password Reset Email"}
                                </Button>
                                <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                                <Button className="bg-primary hover:bg-primary/90" onClick={handleUpdateStaff} disabled={saving}>
                                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : "Save Changes"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          {/* Deactivate */}
                          {staff.isActive !== false && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                  <UserX className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Deactivate Staff Member</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will block <strong>{staff.name}</strong> from logging in. You can re-activate them later via Edit.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeactivate(staff.uid)} className="bg-red-500 hover:bg-red-600">
                                    Deactivate
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}

                          {/* Disable record */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                disabled={deletingUid === staff.uid}
                              >
                                {deletingUid === staff.uid ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Disable Staff Record</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will disable <strong>{staff.name}</strong> without deleting the record. You can re-activate them later via Edit.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteStaff(staff)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Disable Record
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
