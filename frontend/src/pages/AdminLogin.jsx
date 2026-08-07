import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, ShieldCheck, ArrowRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { mockAuth } from "@/lib/auth-store";
import api from "@/lib/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  // Default credentials set as requested
  const [email, setEmail] = useState("admin@udaan.com");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
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
        role: "admin"
      });

      const user = res.data;
      const adminSession = {
        name: user.name,
        business: user.businessName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        token: user.token,
        subscription: user.subscription
      };
      window.localStorage.setItem("Udaan.admin_auth", JSON.stringify(adminSession));
      mockAuth.signIn(adminSession);

      // Redirect to Admin dashboard
      navigate("/admin");
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4" style={{ background: "oklch(0.12 0.025 257)" }}>
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-16 w-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/30">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin Portal</h1>
          <p className="text-slate-400 text-sm mt-2">Sign in to manage the Udaan platform</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2 text-left">
            <Label htmlFor="email-input" className="text-slate-300">Email address</Label>
            <div className="relative">
              <Input
                id="email-input"
                type="email"
                placeholder="admin@udaan.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl text-base pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
              />
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            </div>
          </div>

          <div className="space-y-2 text-left">
            <Label htmlFor="password-input" className="text-slate-300">Password</Label>
            <div className="relative">
              <Input
                id="password-input"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl text-base pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading} 
            className="h-12 w-full rounded-xl text-base bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:shadow-[0_0_25px_rgba(52,211,153,0.5)] border-0"
          >
            {loading ? "Authenticating…" : <>Sign In to Dashboard <ArrowRight className="ml-2 h-4 w-4" /></>}
          </Button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">
            Protected area. Unauthorized access is strictly prohibited.
          </p>
        </div>
      </div>
      
      {/* Decorative background elements */}
      <div className="pointer-events-none fixed top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] z-0" />
      <div className="pointer-events-none fixed bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] z-0" />
    </div>
  );
}
