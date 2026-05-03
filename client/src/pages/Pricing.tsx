import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Rocket, ExternalLink, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { User as DbUser } from "@shared/schema";

type PlanCode = "basic" | "pro" | "elite";

interface PlanCard {
  code: PlanCode;
  name: string;
  price: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  popular: boolean;
  color: string;
}

const PLANS: PlanCard[] = [
  {
    code: "basic",
    name: "Starter",
    price: "$19",
    description: "Perfect for small businesses and solopreneurs",
    icon: <Zap className="w-6 h-6" />,
    features: ["5 Active Workflows", "Basic AI Assistance", "Email Support", "Core Integrations", "Standard Templates"],
    popular: false,
    color: "border-gray-200",
  },
  {
    code: "pro",
    name: "Professional",
    price: "$49",
    description: "Ideal for growing teams and businesses",
    icon: <Crown className="w-6 h-6" />,
    features: [
      "25 Active Workflows",
      "Advanced AI Features",
      "Priority Support",
      "Custom Integrations",
      "Advanced Analytics",
      "Team Collaboration",
    ],
    popular: true,
    color: "border-[#0047FF]",
  },
  {
    code: "elite",
    name: "Enterprise",
    price: "$99",
    description: "For large organizations with complex needs",
    icon: <Rocket className="w-6 h-6" />,
    features: [
      "Unlimited Workflows",
      "Premium AI Support",
      "24/7 Phone Support",
      "White-label Options",
      "Custom Development",
      "Dedicated Account Manager",
      "SLA Guarantees",
    ],
    popular: false,
    color: "border-purple-500",
  },
];

const Pricing = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { data: profile } = useQuery<DbUser>({ queryKey: ["/api/me"], retry: false });

  const checkout = useMutation({
    mutationFn: async (planCode: PlanCode) => {
      return await apiRequest<{ url: string }>({
        method: "POST",
        url: "/api/stripe/create-checkout-session",
        data: { planCode, interval: "month" },
      });
    },
    onSuccess: ({ url }) => {
      window.location.assign(url);
    },
    onError: (error: any) => {
      toast({
        title: "Could not start checkout",
        description: error?.message || "Please try again in a moment.",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = (code: PlanCode) => {
    if (!profile) {
      toast({
        title: "Sign in required",
        description: "Inicia sesión antes de suscribirte a un plan.",
      });
      setLocation("/login");
      return;
    }
    checkout.mutate(code);
  };

  return (
    <>
      <div className="bg-[#151515] border-b border-gray-800 px-6 py-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-gray-400">Select the perfect plan for your automation needs</p>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const isLoading = checkout.isPending && checkout.variables === plan.code;
              return (
                <Card
                  key={plan.code}
                  className={`relative ${plan.color} ${plan.popular ? "ring-2 ring-[#0047FF]" : ""} bg-[#151515]`}
                  data-testid={`card-plan-${plan.code}`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#0047FF] text-white">
                      Most Popular
                    </Badge>
                  )}

                  <CardHeader className="text-center pb-2">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#0047FF] to-[#D100FF] flex items-center justify-center text-white">
                      {plan.icon}
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="text-gray-400">{plan.description}</CardDescription>
                    <div className="pt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-gray-400">/month</span>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center">
                          <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className={`w-full ${plan.popular ? "gradient-btn text-white" : "bg-gray-800 hover:bg-gray-700 text-white"}`}
                      onClick={() => handleSubscribe(plan.code)}
                      disabled={checkout.isPending}
                      data-testid={`button-subscribe-${plan.code}`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          <span>Redirecting...</span>
                        </>
                      ) : (
                        <>
                          <span>Get Started</span>
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          <div className="mt-12 text-center bg-gradient-to-r from-[#0047FF]/20 to-[#D100FF]/20 rounded-lg p-8">
            <h3 className="text-2xl font-bold mb-4">Need a Custom Solution?</h3>
            <p className="text-gray-400 mb-6">
              Contact our sales team for enterprise pricing, custom integrations, and volume discounts.
            </p>
            <Button variant="outline" className="bg-white text-black hover:bg-gray-100">
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Pricing;
