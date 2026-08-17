"use client";

import React, { useState } from "react";
import {
  UserPlus,
  Search,
  MoreHorizontal,
  Shield,
  User,
  Mail,
  Phone,
  Calendar,
  Trash2,
  Edit2,
  Lock,
  FileDown,
  Filter,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/PageHeader";
import { AddStaffDialog } from "./AddStaffDialog";
import { EditStaffDialog } from "./EditStaffDialog";
import { ChangePermissionsDialog } from "./ChangePermissionsDialog";
import { toast } from "sonner";


const roleIcons = { Admin: Shield, Staff: User, Viewer: Eye };

export function UserManagement() {
  // --- State ---
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // --- Derived ---
  const filteredUsers = staffList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const activeCount = staffList.filter((u) => u.status === "Active").length;

  // --- API ---
  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/staff');
      setStaffList(res.data.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'Staff',
        status: "Active",
        joined: new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        avatar: u.name.split(' ').map(s=>s[0]).join('').substring(0, 2).toUpperCase(),
        permissions: u.permissions || []
      })));
    } catch (err) {
      toast.error("Failed to load staff list");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStaff();
  }, []);

  // --- Handlers ---
  const handleAddStaff = async (newStaff) => {
    try {
      await api.post('/auth/staff', {
        ...newStaff,
        role: newStaff.role.toLowerCase()
      });
      toast.success("Staff added successfully");
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add staff");
    }
  };

  const handleEditStaff = async (updatedStaff) => {
    try {
      await api.put(`/auth/staff/${updatedStaff.id}`, {
        ...updatedStaff,
        role: updatedStaff.role.toLowerCase()
      });
      toast.success("Staff details updated");
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update staff");
    }
  };

  const handlePermSave = async (updatedStaff) => {
    try {
      await api.put(`/auth/staff/${updatedStaff.id}`, { 
        permissions: updatedStaff.permissions,
        role: updatedStaff.role.toLowerCase()
      });
      toast.success("Permissions updated");
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update permissions");
    }
  };

  const handleRemoveStaff = async () => {
    if (!selectedStaff) return;
    try {
      await api.delete(`/auth/staff/${selectedStaff.id}`);
      toast.success(`${selectedStaff.name} has been removed from staff`);
      fetchStaff();
    } catch (err) {
      toast.error("Failed to remove staff");
    } finally {
      setDeleteDialogOpen(false);
      setSelectedStaff(null);
    }
  };

  const handleExport = () => {
    toast.info("Preparing staff directory export...");
    setTimeout(() => {
      toast.success("Staff directory exported to CSV");
    }, 1500);
  };

  const handleFilter = () => {
    toast.info("Filter options coming soon");
  };

  const openEdit = (staff) => {
    setSelectedStaff(staff);
    setEditDialogOpen(true);
  };

  const openPerms = (staff) => {
    setSelectedStaff(staff);
    setPermDialogOpen(true);
  };

  const openDelete = (staff) => {
    setSelectedStaff(staff);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <PageHeader
        title="Staff Management"
        subtitle="Manage your business staff, roles and permissions."
        actions={
          <div className="flex w-full flex-nowrap items-center gap-1.5 sm:gap-2 sm:w-auto">
            <Button className="flex-1 sm:flex-none rounded-xl h-9 text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setAddDialogOpen(true)}>
              <UserPlus className="mr-1 h-3.5 w-3.5 sm:mr-1.5 sm:h-4 sm:w-4" /> Add Staff
            </Button>
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none rounded-xl h-9 text-xs sm:text-sm font-semibold border-slate-200" onClick={handleExport}>
              <FileDown className="mr-1 h-3.5 w-3.5 sm:mr-1.5 sm:h-4 sm:w-4 text-emerald-600" /> Export
            </Button>
          </div>
        }
      />

      {/* ---- Dialogs ---- */}
      <AddStaffDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddStaff}
      />
      <EditStaffDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        staff={selectedStaff}
        onSave={handleEditStaff}
      />
      <ChangePermissionsDialog
        open={permDialogOpen}
        onOpenChange={setPermDialogOpen}
        staff={selectedStaff}
        onSave={handlePermSave}
      />

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Staff Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <span className="font-semibold text-foreground">{selectedStaff?.name}</span> from the staff list? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveStaff}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ---- Stats Cards ---- */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="border-0 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md min-w-0">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[10px] sm:text-sm font-semibold text-muted-foreground truncate">Total Staff</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-base sm:text-2xl font-black mt-0.5 sm:mt-1 truncate">{staffList.length}</div>
            <p className="text-[9px] sm:text-xs text-muted-foreground truncate">
              {staffList.filter((u) => u.role === "Admin").length} admins · {staffList.filter((u) => u.role === "Staff").length} staff
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md min-w-0">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[10px] sm:text-sm font-semibold text-muted-foreground truncate">Active Now</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-base sm:text-2xl font-black mt-0.5 sm:mt-1 truncate">{activeCount}</div>
            <p className="text-[9px] sm:text-xs text-muted-foreground truncate">Currently active</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md min-w-0">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[10px] sm:text-sm font-semibold text-muted-foreground truncate">Inactive</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-base sm:text-2xl font-black mt-0.5 sm:mt-1 truncate">{staffList.length - activeCount}</div>
            <p className="text-[9px] sm:text-xs text-muted-foreground truncate">Deactivated accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* ---- Staff Table ---- */}
      <Card className="bg-transparent md:bg-white border-0 md:border md:shadow-sm shadow-none rounded-2xl">
        <CardHeader className="p-0 md:p-6 pb-3 md:pb-4">
          <div className="flex items-center gap-2 md:gap-4 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-pulse" />
              <Input
                placeholder="Search staff..."
                className="pl-9 rounded-xl text-sm h-9 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="rounded-xl text-xs h-9 px-3 shrink-0" onClick={handleFilter}>
              <Filter className="mr-1.5 h-3.5 w-3.5" /> Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="px-4 py-3 uppercase text-[10px] font-bold">Staff Member</TableHead>
                <TableHead className="px-4 py-3 uppercase text-[10px] font-bold">Role</TableHead>
                <TableHead className="px-4 py-3 uppercase text-[10px] font-bold">Status</TableHead>
                <TableHead className="px-4 py-3 uppercase text-[10px] font-bold">Joined Date</TableHead>
                <TableHead className="px-4 py-3 text-right uppercase text-[10px] font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const RoleIcon = roleIcons[user.role] || User;
                  return (
                    <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary-soft text-primary font-bold">
                              {user.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-foreground">{user.name}</p>
                            <div className="flex flex-col text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {user.email}</span>
                              <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {user.phone}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <RoleIcon className={`h-3.5 w-3.5 ${user.role === "Admin" ? "text-primary" : "text-muted-foreground"}`} />
                          <span className="font-medium">{user.role}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Badge
                          variant={user.status === "Active" ? "success" : "secondary"}
                          className="rounded-full text-[10px]"
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{user.joined}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl">
                            <DropdownMenuLabel>Staff Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openEdit(user)}>
                              <Edit2 className="h-4 w-4" /> Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openPerms(user)}>
                              <Lock className="h-4 w-4" /> Change Permissions
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                              onClick={() => openDelete(user)}
                            >
                              <Trash2 className="h-4 w-4" /> Remove Access
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No staff members found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
