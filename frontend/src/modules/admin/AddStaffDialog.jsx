"use client";

import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { Lock as LockIcon } from "lucide-react";

export function AddStaffDialog({ open, onOpenChange, onAdd }) {
  const { canAccessFeature } = useSubscription();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Staff",
    permissions: ["dashboard", "billing", "inventory", "parties", "expenses", "accounting"],
  });

  const SECTIONS = [
    { id: "dashboard", label: "Dashboard" },
    { id: "billing", label: "Billing" },
    { id: "inventory", label: "Inventory" },
    { id: "parties", label: "Parties" },
    { id: "expenses", label: "Expenses" },
    { id: "accounting", label: "Accounting" },
    { id: "gst", label: "GST & Tax" },
    { id: "reports", label: "Reports" },
  ];

  useEffect(() => {
    if (open) {
      const allowedDefaultPerms = SECTIONS.map(s => s.id).filter(id => canAccessFeature(id));
      setFormData(prev => ({
        ...prev,
        permissions: allowedDefaultPerms
      }));
    }
  }, [open]);

  const handleCheckboxChange = (sectionId, checked) => {
    setFormData((prev) => {
      const updated = checked
        ? [...prev.permissions, sectionId]
        : prev.permissions.filter((id) => id !== sectionId);
      return { ...prev, permissions: updated };
    });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      return toast.error("Please fill all fields");
    }

    const initials = formData.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const allowedPerms = (formData.role === "Admin" ? SECTIONS.map(s => s.id) : formData.permissions)
      .filter(p => canAccessFeature(p));

    onAdd({
      ...formData,
      initials,
      status: "Active",
      permissions: allowedPerms,
    });

    onOpenChange(false);
    setFormData({ name: "", email: "", phone: "", role: "Staff", permissions: ["dashboard", "billing", "inventory", "parties", "expenses", "accounting"] });
    toast.success("Staff member added successfully!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Add New Staff Member</DialogTitle>
          <DialogDescription>
            Enter details to add a new team member with specific role permissions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="e.g. Rahul Sharma"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="rahul@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                placeholder="9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Role Access *</Label>
            <Select
              value={formData.role}
              onValueChange={(val) => setFormData({ ...formData, role: val })}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin (Full Access)</SelectItem>
                <SelectItem value="Staff">Staff (Standard Access)</SelectItem>
                <SelectItem value="Viewer">Viewer (Read Only)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.role !== "Admin" && (
            <div className="space-y-2 border-t pt-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Section Access Permissions</Label>
              <div className="grid grid-cols-2 gap-2.5 mt-2">
                {SECTIONS.map((sec) => {
                  const isAllowedByPlan = canAccessFeature(sec.id);
                  const isChecked = isAllowedByPlan && formData.permissions.includes(sec.id);
                  return (
                    <label 
                      key={sec.id} 
                      className={`flex items-center justify-between text-xs font-medium p-2 border rounded-xl transition-all ${
                        !isAllowedByPlan 
                          ? "opacity-50 cursor-not-allowed bg-muted/30 border-muted" 
                          : "cursor-pointer hover:bg-secondary/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <input
                          type="checkbox"
                          disabled={!isAllowedByPlan}
                          checked={isChecked}
                          onChange={(e) => handleCheckboxChange(sec.id, e.target.checked)}
                          className="rounded text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="truncate">{sec.label}</span>
                      </div>
                      {!isAllowedByPlan && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-500 font-semibold shrink-0" title="Locked in your subscription plan">
                          <LockIcon className="h-3 w-3" /> Locked
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl">Add Staff Member</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
