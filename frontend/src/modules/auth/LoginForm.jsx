import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Phone, ShieldCheck, Mail, Lock, UserPlus, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { mockAuth } from "@/lib/auth-store";
import api from "@/lib/api";

export function LoginForm({ role }) {
  const navigate = useNavigate();
  const [method, setMethod] = useState("mobile");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [unregisteredPhone, setUnregisteredPhone] = useState("");

  const onOtpSubmit = async (e) => {
    e.preventDefault();
    const clean = phone.replace(/\D/g, "");
    if (clean.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/auth/send-otp', { phone: clean, mode: 'login' });
      toast.success("OTP sent to +91 " + clean + ` (Demo Code: ${res.data.otp})`);
      navigate('/verify-otp', {
        state: {
          phone: clean,
          mode: 'login',
          role: role
        }
      });
    } catch (error) {
      if (error.response && error.response.status === 404) {
        toast.error("Account not found. Please signup first!!!");
      } else {
        toast.error(error.response?.data?.message || "Failed to send OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  const onEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please fill in all email and password fields");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/login-email', {
        email: email.trim(),
        password: password,
        role: role
      });

      const user = res.data;
      window.localStorage.removeItem("Udaan.admin_auth");
      mockAuth.signIn({
        name: user.name,
        business: user.businessName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        token: user.token,
        subscription: user.subscription
      });

      const redirectPath = (user.role?.toLowerCase() === "staff" || user.role?.toLowerCase() === "viewer") ? "/staff/dashboard" : "/vendor/dashboard";
      toast.success(user.role === "admin" ? "Admin access granted!" : "Signed in successfully");
      navigate(redirectPath);
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={method} onValueChange={setMethod} className="w-full">
        {role === "admin" && (
          <TabsList className="grid w-full grid-cols-2 rounded-xl mb-4">
            <TabsTrigger value="mobile" className="rounded-lg text-xs font-semibold py-2">
              Mobile OTP
            </TabsTrigger>
            <TabsTrigger value="email" className="rounded-lg text-xs font-semibold py-2">
              Email & Password
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="mobile">
          <form onSubmit={onOtpSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Mobile number</Label>
              <div className="flex items-stretch gap-2">
                <div className="flex items-center gap-1 rounded-xl border bg-secondary px-3 text-sm font-semibold">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  +91
                </div>
                <Input
                  id="phone"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="98xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="h-12 flex-1 rounded-xl text-base"
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">We'll send a 6-digit OTP to verify.</p>
            </div>

            <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl text-base">
              {loading ? "Sending OTP…" : <>Send OTP <ArrowRight className="ml-1 h-4 w-4" /></>}
            </Button>

            {role === "admin" && (
              <>
                <div className="relative my-2 text-center">
                  <span className="relative z-10 bg-background px-3 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Demo Options
                  </span>
                  <span className="absolute left-0 top-1/2 h-px w-full bg-border" />
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full rounded-xl text-sm gap-2 border-primary/20 bg-primary-soft hover:bg-primary/10 text-primary font-semibold"
                    onClick={() => {
                      setPhone("9876543210");
                      toast.message("Demo Admin filled");
                    }}
                  >
                    <ShieldCheck className="h-5 w-5" /> Load Admin Demo Presets
                  </Button>
                </div>
              </>
            )}
          </form>
        </TabsContent>

        {role === "admin" && (
          <TabsContent value="email">
          <form onSubmit={onEmailSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email-input">Email address</Label>
              <div className="relative">
                <Input
                  id="email-input"
                  type="email"
                  placeholder="admin@udaan.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl text-base pl-10"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password-input">Password</Label>
              <div className="relative">
                <Input
                  id="password-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl text-base pl-10"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl text-base">
              {loading ? "Signing In…" : <>Sign In <ArrowRight className="ml-1 h-4 w-4" /></>}
            </Button>

            <div className="relative my-2 text-center">
              <span className="relative z-10 bg-background px-3 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Demo Options
              </span>
              <span className="absolute left-0 top-1/2 h-px w-full bg-border" />
            </div>

            <div className="flex flex-col gap-3">
              {role === "admin" ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full rounded-xl text-sm gap-2 border-primary/20 bg-primary-soft hover:bg-primary/10 text-primary font-semibold"
                  onClick={() => {
                    setEmail("admin@udaan.com");
                    setPassword("admin123");
                    toast.message("Demo Admin email & password loaded");
                  }}
                >
                  <ShieldCheck className="h-5 w-5" /> Load Admin Demo Presets
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full rounded-xl text-sm gap-2 border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold"
                  onClick={() => {
                    setEmail("staff@udaan.com");
                    setPassword("staff123");
                    toast.message("Demo Staff email & password loaded");
                  }}
                >
                  <Phone className="h-5 w-5" /> Load Staff Demo Presets
                </Button>
              )}
            </div>
          </form>
        </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
