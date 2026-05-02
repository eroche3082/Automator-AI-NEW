import { useQuery } from "@tanstack/react-query";
import { getPlanByCode, canAccessFeature, checkLimit, type MembershipPlan } from "@shared/membership";

export function useMembership() {
  const { data: profile } = useQuery<{ plan?: string; subscriptionStatus?: string }>({
    queryKey: ["/api/me"],
  });

  const planCode = (profile?.plan as "basic" | "pro" | "elite") || "basic";
  const currentPlan = getPlanByCode(planCode);

  const hasFeature = (feature: string): boolean => {
    return canAccessFeature(planCode, feature);
  };

  const isWithinLimit = (limitType: keyof MembershipPlan["limits"], current: number): boolean => {
    return checkLimit(planCode, limitType, current);
  };

  const upgradeRequired = (feature: string): boolean => {
    return !hasFeature(feature);
  };

  return {
    membership: {
      plan: planCode,
      status: (profile?.subscriptionStatus as "active" | "cancelled" | "expired") || "active",
    },
    currentPlan,
    hasFeature,
    isWithinLimit,
    upgradeRequired,
  };
}
