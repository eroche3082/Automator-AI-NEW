
import { useState, useEffect } from "react";
import { getPlanByCode, canAccessFeature, checkLimit, type MembershipPlan } from "@shared/membership";

interface UserMembership {
  plan: "basic" | "pro" | "elite";
  status: "active" | "cancelled" | "expired";
  expiresAt?: Date;
}

export function useMembership() {
  // TODO: Replace with actual user data from auth/API
  const [membership, setMembership] = useState<UserMembership>({
    plan: "basic", // Default to basic for now
    status: "active"
  });

  const currentPlan = getPlanByCode(membership.plan);

  const hasFeature = (feature: string): boolean => {
    return canAccessFeature(membership.plan, feature);
  };

  const isWithinLimit = (limitType: keyof MembershipPlan["limits"], current: number): boolean => {
    return checkLimit(membership.plan, limitType, current);
  };

  const upgradeRequired = (feature: string): boolean => {
    return !hasFeature(feature);
  };

  // Simulate plan changes for testing
  const changePlan = (newPlan: "basic" | "pro" | "elite") => {
    setMembership(prev => ({ ...prev, plan: newPlan }));
  };

  return {
    membership,
    currentPlan,
    hasFeature,
    isWithinLimit,
    upgradeRequired,
    changePlan // For testing only
  };
}
