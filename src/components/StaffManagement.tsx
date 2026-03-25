import { useState } from "react";
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
import { Search, Plus, Edit, Trash2, Users, Mail, Phone, Calendar } from "lucide-react";

interface StaffMember {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: "active" | "inactive";
  hireDate: string;
  lastActive: string;
}

export function StaffManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [roleFilter, setRoleFilter] = useState("all");

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([
    {
      id: 1,
      name: "Maria Santos",
      email: "maria.santos@cakejoy.ph",
      phone: "(02) 8123-4567",
      role: "Baker",
      status: "active",
      hireDate: "2024-01-15",
      lastActive: "Nov 11, 2025",
    },
    {
      id: 2,
      name: "Juan Dela Cruz",
      email: "juan.delacruz@cakejoy.ph",
      phone: "(02) 8234-5678",
      role: "Baker",
      status: "active",
      hireDate: "2024-03-20",
      lastActive: "Nov 11, 2025",
    },
    {
      id: 3,
      name: "Ana Reyes",
      email: "ana.reyes@cakejoy.ph",
      phone: "(02) 8345-6789",
      role: "Customer Service",
      status: "active",
      hireDate: "2024-05-10",
      lastActive: "Nov 11, 2025",
    },
    {
      id: 4,
      name: "Carlos Garcia",
      email: "carlos.garcia@cakejoy.ph",
      phone: "(02) 8456-7890",
      role: "Decorator",
      status: "active",
      hireDate: "2024-02-28",
      lastActive: "Nov 10, 2025",
    },
    {
      id: 5,
      name: "Elena Torres",
      email: "elena.torres@cakejoy.ph",
      phone: "(02) 8567-8901",
      role: "Customer Service",
      status: "active",
      hireDate: "2024-06-15",
      lastActive: "Nov 11, 2025",
    },
    {
      id: 6,
      name: "Roberto Cruz",
      email: "roberto.cruz@cakejoy.ph",
      phone: "(02) 8678-9012",
      role: "Inventory Manager",
      status: "active",
      hireDate: "2024-04-05",
      lastActive: "Nov 11, 2025",
    },
    {
      id: 7,
      name: "Lisa Martinez",
      email: "lisa.martinez@cakejoy.ph",
      phone: "(02) 8789-0123",
      role: "Baker",
      status: "inactive",
      hireDate: "2023-11-20",
      lastActive: "Oct 15, 2025",
    },
  ]);

  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    hireDate: "",
  });

  const filteredStaff = staffMembers.filter((staff) => {
    const matchesSearch =
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || staff.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const activeStaffCount = staffMembers.filter((s) => s.status === "active").length;

  const handleAddStaff = () => {
    const staff: StaffMember = {
      id: Math.max(...staffMembers.map((s) => s.id)) + 1,
      name: newStaff.name,
      email: newStaff.email,
      phone: newStaff.phone,
      role: newStaff.role,
      status: "active",
      hireDate: newStaff.hireDate,
      lastActive: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    };
    setStaffMembers([...staffMembers, staff]);
    setNewStaff({ name: "", email: "", phone: "", role: "", hireDate: "" });
    setIsAddModalOpen(false);
  };

  const handleDeleteStaff = (id: number) => {
    setStaffMembers(staffMembers.filter((staff) => staff.id !== id));
  };

  const handleEditStaff = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setIsEditModalOpen(true);
  };

  const handleUpdateStaff = () => {
    if (selectedStaff) {
      setStaffMembers(
        staffMembers.map((staff) =>
          staff.id === selectedStaff.id ? selectedStaff : staff
        )
      );
      setIsEditModalOpen(false);
      setSelectedStaff(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      Baker: "bg-blue-100 text-blue-800",
      "Customer Service": "bg-green-100 text-green-800",
      Decorator: "bg-purple-100 text-purple-800",
      "Inventory Manager": "bg-orange-100 text-orange-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2">Staff Management</h1>
        <p className="text-muted-foreground">
          Manage bakery staff members, roles, and access
        </p>
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
            <h2 className="text-green-600">{activeStaffCount}</h2>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground mb-1">Inactive Staff</p>
            <h2 className="text-red-600">{staffMembers.length - activeStaffCount}</h2>
          </CardContent>
        </Card>
      </div>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Staff Members</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="Baker">Baker</SelectItem>
                  <SelectItem value="Customer Service">Customer Service</SelectItem>
                  <SelectItem value="Decorator">Decorator</SelectItem>
                  <SelectItem value="Inventory Manager">Inventory Manager</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4" />
                    Add Staff
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add New Staff Member</DialogTitle>
                    <DialogDescription>
                      Add a new staff member to the bakery team
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="staff-name">Full Name</Label>
                      <Input
                        id="staff-name"
                        placeholder="e.g., Maria Santos"
                        value={newStaff.name}
                        onChange={(e) =>
                          setNewStaff({ ...newStaff, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="staff-email">Email</Label>
                      <Input
                        id="staff-email"
                        type="email"
                        placeholder="e.g., maria.santos@cakejoy.ph"
                        value={newStaff.email}
                        onChange={(e) =>
                          setNewStaff({ ...newStaff, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="staff-phone">Phone Number</Label>
                      <Input
                        id="staff-phone"
                        type="tel"
                        placeholder="e.g., (02) 8123-4567"
                        value={newStaff.phone}
                        onChange={(e) =>
                          setNewStaff({ ...newStaff, phone: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="staff-role">Role</Label>
                      <Select
                        value={newStaff.role}
                        onValueChange={(value) =>
                          setNewStaff({ ...newStaff, role: value })
                        }
                      >
                        <SelectTrigger id="staff-role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Baker">Baker</SelectItem>
                          <SelectItem value="Customer Service">
                            Customer Service
                          </SelectItem>
                          <SelectItem value="Decorator">Decorator</SelectItem>
                          <SelectItem value="Inventory Manager">
                            Inventory Manager
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="staff-hire-date">Hire Date</Label>
                      <Input
                        id="staff-hire-date"
                        type="date"
                        value={newStaff.hireDate}
                        onChange={(e) =>
                          setNewStaff({ ...newStaff, hireDate: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      className="bg-primary hover:bg-primary/90"
                      onClick={handleAddStaff}
                      disabled={
                        !newStaff.name ||
                        !newStaff.email ||
                        !newStaff.phone ||
                        !newStaff.role ||
                        !newStaff.hireDate
                      }
                    >
                      Add Staff Member
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        {staff.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <a
                          href={`mailto:${staff.email}`}
                          className="hover:text-primary transition-colors"
                        >
                          {staff.email}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {staff.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(staff.role)}>
                        {staff.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {staff.status === "active" ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {formatDate(staff.hireDate)}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {staff.lastActive}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog
                          open={isEditModalOpen && selectedStaff?.id === staff.id}
                          onOpenChange={setIsEditModalOpen}
                        >
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2"
                              onClick={() => handleEditStaff(staff)}
                            >
                              <Edit className="w-3 h-3" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Edit Staff Member</DialogTitle>
                              <DialogDescription>
                                Update staff member information
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-staff-name">Full Name</Label>
                                <Input
                                  id="edit-staff-name"
                                  value={selectedStaff?.name || ""}
                                  onChange={(e) =>
                                    setSelectedStaff(
                                      selectedStaff
                                        ? { ...selectedStaff, name: e.target.value }
                                        : null
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-staff-email">Email</Label>
                                <Input
                                  id="edit-staff-email"
                                  type="email"
                                  value={selectedStaff?.email || ""}
                                  onChange={(e) =>
                                    setSelectedStaff(
                                      selectedStaff
                                        ? { ...selectedStaff, email: e.target.value }
                                        : null
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-staff-phone">Phone Number</Label>
                                <Input
                                  id="edit-staff-phone"
                                  value={selectedStaff?.phone || ""}
                                  onChange={(e) =>
                                    setSelectedStaff(
                                      selectedStaff
                                        ? { ...selectedStaff, phone: e.target.value }
                                        : null
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-staff-role">Role</Label>
                                <Select
                                  value={selectedStaff?.role || ""}
                                  onValueChange={(value) =>
                                    setSelectedStaff(
                                      selectedStaff
                                        ? { ...selectedStaff, role: value }
                                        : null
                                    )
                                  }
                                >
                                  <SelectTrigger id="edit-staff-role">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Baker">Baker</SelectItem>
                                    <SelectItem value="Customer Service">
                                      Customer Service
                                    </SelectItem>
                                    <SelectItem value="Decorator">Decorator</SelectItem>
                                    <SelectItem value="Inventory Manager">
                                      Inventory Manager
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-staff-status">Status</Label>
                                <Select
                                  value={selectedStaff?.status || ""}
                                  onValueChange={(value: "active" | "inactive") =>
                                    setSelectedStaff(
                                      selectedStaff
                                        ? { ...selectedStaff, status: value }
                                        : null
                                    )
                                  }
                                >
                                  <SelectTrigger id="edit-staff-status">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setIsEditModalOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                className="bg-primary hover:bg-primary/90"
                                onClick={handleUpdateStaff}
                              >
                                Save Changes
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {staff.name}? This action
                                cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteStaff(staff.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Delete
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
        </CardContent>
      </Card>
    </div>
  );
}
