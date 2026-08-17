import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Building2, Smartphone, Monitor } from "lucide-react";
import { PLANS, useSubscription } from "@/hooks/useSubscription";
import { CheckoutModal } from "@/components/subscription/CheckoutModal";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

const getPlatformIcon = (platforms) => {
  const text = (platforms || "").toLowerCase();
  if (text.includes("desktop") && text.includes("mobile")) {
    return <Monitor className="w-4 h-4 text-primary" />;
  }
  if (text.includes("desktop")) {
    return <Monitor className="w-4 h-4 text-primary" />;
  }
  return <Smartphone className="w-4 h-4 text-muted-foreground" />;
};

export default function Pricing() {
  const { currentPlan } = useSubscription();
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pricingPlans, setPricingPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPricingPlans = async () => {
      try {
        const res = await api.get("/auth/plans");
        setPricingPlans(res.data);
      } catch (error) {
        console.error("Failed to load pricing plans", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPricingPlans();
  }, []);

  const handleUpgrade = (plan) => {
    setCheckoutPlan(plan);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-10">
      <div className="text-center max-w-2xl mx-auto space-y-2 sm:space-y-4 pt-4 sm:pt-6 px-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight sm:text-4xl">
          Simple, transparent pricing
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground sm:text-lg">
          Choose the perfect plan for your business needs. Upgrade anytime to unlock more powerful features.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 pt-4 sm:pt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {pricingPlans.map((plan) => (
          <Card 
            key={plan.name} 
            className={`flex flex-col relative overflow-hidden transition-all duration-200 border-2 ${
              plan.popular ? 'border-primary shadow-lg scale-105 z-10' : 'border-border/50 shadow-[var(--shadow-card)] hover:border-primary/50'
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 -mr-8 mt-4 w-32 rotate-45 text-center bg-primary text-primary-foreground text-xs font-bold py-1 shadow-sm">
                MOST POPULAR
              </div>
            )}
            
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-xl sm:text-2xl flex items-center justify-between">
                {plan.name}
                {(currentPlan || "").toLowerCase() === (plan.name || "").toLowerCase() && (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80 text-[10px] sm:text-xs">
                    Current Plan
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">{plan.description || `Perfect for ${plan.name} pricing needs`}</CardDescription>
              
              <div className="mt-2.5 sm:mt-4 flex items-baseline text-3xl sm:text-4xl font-extrabold">
                ₹{plan.price}
                <span className="ml-1 text-lg sm:text-xl font-medium text-muted-foreground">/mo</span>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Billed annually at ₹{plan.price * 12}</p>
              
              <div className="flex items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4 text-xs sm:text-sm font-semibold text-muted-foreground bg-muted/60 w-fit px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full">
                {getPlatformIcon(plan.platforms)}
                {plan.platforms || "Mobile + Desktop"}
              </div>
            </CardHeader>
            
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 flex-1">
              <ul className="space-y-2 sm:space-y-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground text-xs sm:text-sm">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            
            <CardFooter className="p-4 pt-0 sm:p-6">
              <Button 
                className={`w-full h-9 sm:h-11 text-xs sm:text-base rounded-xl ${
                  (currentPlan || "").toLowerCase() === (plan.name || "").toLowerCase() 
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md" 
                    : ""
                }`}
                variant={(currentPlan || "").toLowerCase() === (plan.name || "").toLowerCase() ? "default" : (plan.popular ? "default" : "outline")}
                disabled={(currentPlan || "").toLowerCase() === (plan.name || "").toLowerCase()}
                onClick={() => handleUpgrade(plan)}
              >
                {(currentPlan || "").toLowerCase() === (plan.name || "").toLowerCase() 
                  ? "Active Plan" 
                  : plan.price === 0 
                    ? "Get Started" 
                    : `Upgrade to ${plan.name}`}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {checkoutPlan && (
        <CheckoutModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          selectedPlan={checkoutPlan.name}
          planPrice={checkoutPlan.price}
        />
      )}
    </div>
  );
}
