import { useMockAuth } from "@/lib/auth-store";
import { useMemo } from "react";

export const PLANS = {
  FREE: "Free",
  SILVER: "Silver",
  GOLD: "Gold",
  ENTERPRISE: "Enterprise"
};

// Define what features are available in which plans
const FEATURE_ACCESS = {
  dashboard: [PLANS.FREE, PLANS.SILVER, PLANS.GOLD, PLANS.ENTERPRISE],
  billing: [PLANS.FREE, PLANS.SILVER, PLANS.GOLD, PLANS.ENTERPRISE],
  inventory: [PLANS.SILVER, PLANS.GOLD, PLANS.ENTERPRISE], // Basic inventory starts at Silver
  parties: [PLANS.FREE, PLANS.SILVER, PLANS.GOLD, PLANS.ENTERPRISE],
  expenses: [PLANS.SILVER, PLANS.GOLD, PLANS.ENTERPRISE],
  accounting: [PLANS.GOLD, PLANS.ENTERPRISE], // Advanced accounting in Gold+
  gst: [PLANS.GOLD, PLANS.ENTERPRISE], // GST in Gold+
  reports: [PLANS.SILVER, PLANS.GOLD, PLANS.ENTERPRISE], // Standard reports in Silver+
  admin: [PLANS.FREE, PLANS.SILVER, PLANS.GOLD, PLANS.ENTERPRISE], // Staff management in all plans
};

export function useSubscription() {
  const { user, hydrated } = useMockAuth();
  
  const isAdmin = user?.role?.toLowerCase() === "admin";

  // Read actual subscription from user object (whether object or string format)
  const currentPlan = (typeof user?.subscription === 'string' ? user.subscription : user?.subscription?.plan) || PLANS.FREE;
  const planStatus = user?.subscription?.status || "active";

  const isFree = currentPlan === PLANS.FREE;
  const isPremium = currentPlan !== PLANS.FREE && planStatus === "active";

  const canAccessFeature = (featureName) => {
    if (isAdmin) return true; // Admins have bypass access to all features
    let featKey = (featureName || "").toLowerCase();
    if (featKey === "staff-management" || featKey === "staff") featKey = "admin";
    if (featKey === "tickets") featKey = "support";

    // Check dynamic allowedModules if set on user subscription
    const allowedMods = user?.subscription?.allowedModules;
    if (Array.isArray(allowedMods) && allowedMods.length > 0) {
      return allowedMods.includes(featKey);
    }
    
    const allowedPlans = FEATURE_ACCESS[featKey];
    if (!allowedPlans) return true; // If feature isn't defined, allow access
    
    // If the user's plan is in the allowed plans, they can access it
    return allowedPlans.includes(currentPlan);
  };

  const platforms = user?.subscription?.platforms || (currentPlan === PLANS.FREE ? "Mobile Only" : "Mobile + Desktop");
  const isMobileOnly = !isAdmin && platforms.toLowerCase().includes("mobile only");

  return {
    currentPlan,
    planStatus,
    platforms,
    isMobileOnly,
    isFree,
    isPremium,
    canAccessFeature,
    hydrated
  };
}
