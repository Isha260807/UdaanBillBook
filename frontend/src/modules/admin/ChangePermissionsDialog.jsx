"use client";

import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Shield, ShieldCheck, Eye, Lock as LockIcon } from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";

const PERMISSIONS = [
  { key: "billing", label: "Billing & Invoicing", description: "Create, edit and manage invoices" },
  { key: "inventory", label: "Inventory Management", description: "Add, edit products and manage stock" },
  { key: "parties", label: "Party Management", description: "Manage customers & suppliers" },
  { key: "expenses", label: "Expense Management", description: "Record and view expenses" },
  { key: "reports", label: "Reports & Analytics", description: "View business reports" },
  { key: "gst", label: "GST & Taxation", description: "GST reports and tax settings" },
  { key: "settings", label: "App Settings", description: "Change business & app settings" },
];

const ROLE_PRESETS = {
  Admin: Object.fromEntries(PERMISSIONS.map((p) => [p.key, true])),
  Staff: { billing: true, inventory: true, parties: true, expenses: true, reports: false, gst: false, settings: false },
  Viewer: Object.fromEntries(PERMISSIONS.map((p) => [p.key, false])),
};

const roleIcon = { Admin: Shield, Staff: ShieldCheck, Viewer: Eye };

export function ChangePermissionsDialog({ open, onOpenChange, staff, onSave }) {
  const { canAccessFeature } = useSubscription();
  const [role, setRole] = useState("Staff");
  const [perms, setPerms] = useState({
    billing: true,
    inventory: true,
    parties: true,
    expenses: true,
    reports: false,
    gst: false,
    settings: false,
    dashboard: true
  });

  useEffect(() => {
    if (staff) {
      const r = staff.role || "Staff";
      const capitalizedRole = r.charAt(0).toUpperCase() + r.slice(1);
      setRole(capitalizedRole);
      
      const permissionsArray = Array.isArray(staff.permissions) ? staff.permissions : [];
      const permissionsObject = {};
      PERMISSIONS.forEach((p) => {
        permissionsObject[p.key] = permissionsArray.includes(p.key);
      });
      // Always include dashboard
      permissionsObject["dashboard"] = true;
      
      setPerms(permissionsObject);
    }
  }, [staff]);

  const onRoleChange = (newRole) => {
    setRole(newRole);
    setPerms({ ...ROLE_PRESETS[newRole] });
  };

  const togglePerm = (key) => {
    setPerms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    const permissionsArray = Object.keys(perms).filter((key) => perms[key]);
    if (!permissionsArray.includes("dashboard")) {
      permissionsArray.push("dashboard");
    }

    onSave({ 
      ...staff, 
      role: role.toLowerCase(), 
      permissions: permissionsArray 
    });
    toast.success("Permissions updated successfully");
    onOpenChange(false);
  };

  if (!staff) return null;

  const RoleIcon = roleIcon[role] || ShieldCheck;
  const enabledCount = Object.keys(perms).filter((k) => k !== "dashboard" && perms[k] && canAccessFeature(k)).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0 pb-2">
          <DialogTitle>Edit Staff Permissions</DialogTitle>
          <DialogDescription>
            Configure role and access permissions for <span className="font-semibold text-foreground">{staff.name}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 flex-1 overflow-y-auto pr-1">
          {/* Role preset selector */}
          <div className="space-y-2">
            <Label>Role Preset</Label>
            <div className="flex items-center gap-3">
              <Select value={role} onValueChange={onRoleChange}>
                <SelectTrigger className="rounded-xl flex-1">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin (Full Control)</SelectItem>
                  <SelectItem value="Staff">Staff (Standard)</SelectItem>
                  <SelectItem value="Viewer">Viewer (Read Only)</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <RoleIcon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{enabledCount} of {PERMISSIONS.length} permissions enabled</p>
          </div>

          {/* Permissions toggles */}
          <div className="space-y-1">
            <Label>Module Permissions</Label>
            <div className="mt-2 divide-y rounded-xl border">
              {PERMISSIONS.map((p) => {
                const isAllowedByPlan = canAccessFeature(p.key);
                const isChecked = isAllowedByPlan && !!perms[p.key];
                return (
                  <div key={p.key} className={`flex items-center justify-between px-4 py-2.5 ${!isAllowedByPlan ? "opacity-50 bg-muted/20" : ""}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{p.label}</p>
                        {!isAllowedByPlan && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 font-semibold border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                            <LockIcon className="h-2.5 w-2.5" /> Locked in Plan
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{p.description}</p>
                    </div>
                    <Switch
                      checked={isChecked}
                      onCheckedChange={() => togglePerm(p.key)}
                      disabled={role === "Admin" || !isAllowedByPlan}
                    />
                  </div>
                );
              })}
            </div>
            {role === "Admin" && (
              <p className="mt-1 text-xs text-muted-foreground">Admin role has all available plan permissions enabled by default.</p>
            )}
          </div>
        </div>

        <DialogFooter className="shrink-0 pt-3 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancel
          </Button>
          <Button onClick={handleSave} className="rounded-xl">Save Permissions</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
