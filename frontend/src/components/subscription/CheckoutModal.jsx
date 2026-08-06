import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, CreditCard } from "lucide-react";
import { mockAuth, useMockAuth } from "@/lib/auth-store";
import { toast } from "sonner";
import { PLANS } from "@/hooks/useSubscription";

import api from "@/lib/api";

export function CheckoutModal({ isOpen, onClose, selectedPlan, planPrice }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { user } = useMockAuth();

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setIsProcessing(false);
        toast.error("Razorpay SDK failed to load. Please check your network.");
        return;
      }

      const keyRes = await api.get("/auth/razorpay-key");
      const keyId = keyRes.data.keyId;

      const orderRes = await api.post("/auth/razorpay-order", { planName: selectedPlan });
      const { orderId, amount, currency } = orderRes.data;

      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: "Udaan BillBook",
        description: `Upgrade subscription to ${selectedPlan} Plan`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await api.post("/auth/verify-razorpay", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planName: selectedPlan
            });

            if (verifyRes.data.success) {
              setIsProcessing(false);
              setIsSuccess(true);
              
              mockAuth.updateUser({
                subscription: verifyRes.data.subscription
              });
              
              toast.success(`Successfully upgraded to ${selectedPlan} Plan!`);
              
              setTimeout(() => {
                setIsSuccess(false);
                onClose();
                window.location.reload();
              }, 2000);
            }
          } catch (err) {
            setIsProcessing(false);
            toast.error(err.response?.data?.message || "Payment verification failed");
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#10b981",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          }
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();

    } catch (error) {
      setIsProcessing(false);
      toast.error(error.response?.data?.message || "Payment subscription failed");
    }
  };

  const handleCancel = () => {
    setIsProcessing(false);
    setIsSuccess(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        {!isSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Secure Checkout
              </DialogTitle>
              <DialogDescription>
                You are about to upgrade to the <strong>{selectedPlan} Plan</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-xl border border-border/50">
                <div className="flex flex-col">
                  <span className="font-semibold">{selectedPlan} Plan (Annual)</span>
                  <span className="text-xs text-muted-foreground">Billed yearly</span>
                </div>
                <div className="font-bold text-lg">
                  ₹{planPrice * 12}
                </div>
              </div>
              <div className="flex justify-between items-center px-4 text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{planPrice * 12}</span>
              </div>
              <div className="flex justify-between items-center px-4 text-sm">
                <span className="text-muted-foreground">GST (18%)</span>
                <span>₹{Math.round(planPrice * 12 * 0.18)}</span>
              </div>
              <div className="flex justify-between items-center px-4 font-semibold text-base border-t border-border pt-4">
                <span>Total Amount</span>
                <span>₹{Math.round(planPrice * 12 * 1.18)}</span>
              </div>
            </div>
            <DialogFooter className="sm:justify-between">
              <Button variant="ghost" onClick={handleCancel} disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={handlePayment} disabled={isProcessing} className="w-full sm:w-auto gap-2">
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  `Pay ₹${Math.round(planPrice * 12 * 1.18)}`
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 animate-in zoom-in" />
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">Payment Successful!</h2>
              <p className="text-sm text-muted-foreground">
                Your account has been upgraded to the {selectedPlan} plan.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
