
export interface MembershipPlan {
  code: "basic" | "pro" | "elite";
  name: string;
  monthly: number;
  annual: number;
  features: string[];
  limits: {
    seats: number;
    workflows: number | "unlimited";
    leads: number | "unlimited";
    aiRequests: number | "unlimited";
  };
}

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    code: "basic",
    name: "AUTOMATOR AI Basic",
    monthly: 1900, // cents
    annual: 19000, // cents
    features: [
      "AI workflow automation",
      "5 email templates", 
      "Basic CRM",
      "100 AI requests/month",
      "Email support"
    ],
    limits: {
      seats: 1,
      workflows: 5,
      leads: 100,
      aiRequests: 100
    }
  },
  {
    code: "pro", 
    name: "AUTOMATOR AI Pro",
    monthly: 4900, // cents
    annual: 49000, // cents
    features: [
      "Everything in Basic",
      "Unlimited workflows",
      "Advanced AI insights", 
      "1000 AI requests/month",
      "Priority support",
      "Custom integrations"
    ],
    limits: {
      seats: 5,
      workflows: "unlimited",
      leads: 1000, 
      aiRequests: 1000
    }
  },
  {
    code: "elite",
    name: "AUTOMATOR AI Elite", 
    monthly: 9900, // cents
    annual: 99000, // cents
    features: [
      "Everything in Pro",
      "White-label options",
      "Custom AI models",
      "Unlimited AI requests", 
      "24/7 phone support",
      "SLA guarantee",
      "Advanced analytics"
    ],
    limits: {
      seats: 20,
      workflows: "unlimited",
      leads: "unlimited",
      aiRequests: "unlimited"
    }
  }
];

export const MEMBERSHIP_CONFIG = {
  app: "AUTOMATOR_AI",
  plans: MEMBERSHIP_PLANS,
  successUrl: "https://automator-ai.socialbrands.ai/thank-you",
  cancelUrl: "https://automator-ai.socialbrands.ai/cancelled"
};

export function getPlanByCode(code: string): MembershipPlan | undefined {
  return MEMBERSHIP_PLANS.find(plan => plan.code === code);
}

export function canAccessFeature(userPlan: string, feature: string): boolean {
  const plan = getPlanByCode(userPlan);
  if (!plan) return false;
  
  // Feature gating logic based on plan hierarchy
  switch (feature) {
    case "unlimited_workflows":
      return plan.code === "pro" || plan.code === "elite";
    case "advanced_ai_insights":
      return plan.code === "pro" || plan.code === "elite";
    case "custom_integrations":
      return plan.code === "pro" || plan.code === "elite";
    case "white_label":
      return plan.code === "elite";
    case "custom_ai_models":
      return plan.code === "elite";
    case "phone_support":
      return plan.code === "elite";
    default:
      return true;
  }
}

export function checkLimit(userPlan: string, limitType: keyof MembershipPlan["limits"], current: number): boolean {
  const plan = getPlanByCode(userPlan);
  if (!plan) return false;
  
  const limit = plan.limits[limitType];
  if (limit === "unlimited") return true;
  
  return current < (limit as number);
}
