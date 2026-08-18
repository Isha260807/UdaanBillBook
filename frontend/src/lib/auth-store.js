import { useEffect, useState } from "react";
import api from "./api";

const KEY = "Udaan.auth";

const listeners = new Set();

function read() {
  if (typeof window === "undefined") return null;
  try {
    const isAdminRoute = window.location.pathname.startsWith("/admin");
    const adminRaw = window.localStorage.getItem("Udaan.admin_auth");
    const vendorRaw = window.localStorage.getItem("Udaan.auth");

    if (isAdminRoute) {
      return adminRaw ? JSON.parse(adminRaw) : null;
    }
    return vendorRaw ? JSON.parse(vendorRaw) : null;
  } catch {
    return null;
  }
}

export const mockAuth = {
  get() {
    return read();
  },
  signIn(user) {
    if (typeof window === "undefined") return;
    // Omit token from user object before persisting to localStorage
    const { token, ...safeUser } = user;
    const isSuperAdmin = user?.role?.toLowerCase() === "admin";
    if (isSuperAdmin) {
      window.localStorage.setItem("Udaan.admin_auth", JSON.stringify(safeUser));
    } else {
      window.localStorage.setItem("Udaan.auth", JSON.stringify(safeUser));
    }
    listeners.forEach((l) => l());
  },
  signOut() {
    if (typeof window === "undefined") return;
    
    // Call backend to clear the HTTP-only cookie
    api.post("/auth/logout").catch((err) => {
      console.error("Failed to clear cookie on backend logout:", err);
    });

    const isAdminRoute = window.location.pathname.startsWith("/admin");
    if (isAdminRoute) {
      window.localStorage.removeItem("Udaan.admin_auth");
    } else {
      window.localStorage.removeItem("Udaan.auth");
    }
    listeners.forEach((l) => l());
  },
  updateUser(updates) {
    if (typeof window === "undefined") return;
    const isAdminRoute = window.location.pathname.startsWith("/admin");
    const key = isAdminRoute ? "Udaan.admin_auth" : "Udaan.auth";
    const current = read();
    if (current) {
      const updated = { ...current, ...updates };
      window.localStorage.setItem(key, JSON.stringify(updated));
      listeners.forEach((l) => l());
    }
  },
  subscribe(l) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "Udaan.auth" || e.key === "Udaan.admin_auth") {
      listeners.forEach((l) => l());
    }
  });
}

export function useMockAuth() {
  const [user, setUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setUser(read());
    setHydrated(true);
    const unsub = mockAuth.subscribe(() => setUser(read()));
    return () => {
      unsub();
    };
  }, []);
  return { user, hydrated, isAuthenticated: !!user };
}
