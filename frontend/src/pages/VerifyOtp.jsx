import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { mockAuth } from "@/lib/auth-store";
import api from "@/lib/api";

export default function VerifyOtp() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};
  
  const search = {
    phone: state.phone || "",
    mode: state.mode || "login",
    name: state.name || undefined,
    business: state.business || undefined,
    email: state.email || undefined,
    address: state.address || undefined,
    businessType: state.businessType || undefined,
    role: state.role || undefined
  };

  useEffect(() => {
    if (!state.phone) {
      toast.error("Please enter your phone number first");
      navigate('/login', { replace: true });
    }
  }, [state.phone, navigate]);

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [resend, setResend] = useState(30);
  const refs = useRef([]);

  useEffect(() => {
    if (resend <= 0) return;
    const t = setTimeout(() => setResend((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resend]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const setDigit = (i, val) => {
    const v = val.replace(/\D/g, "").slice(-1);
    setDigits((d) => {
      const n = [...d];
      n[i] = v;
      return n;
    });
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  const onKey = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const onPaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      e.preventDefault();
      setDigits(text.split(""));
      refs.current[5]?.focus();
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== 6) return toast.error("Enter all 6 digits");

    try {
      const res = await api.post('/auth/verify-otp', {
        phone: search.phone,
        otp: code,
        mode: search.mode,
        name: search.name,
        business: search.business,
        email: search.email,
        address: search.address,
        businessType: search.businessType,
        gstNo: state.gstNo,
        panNo: state.panNo,
        aadhaarNo: state.aadhaarNo,
        role: search.role
      });

      const user = res.data;
      window.localStorage.removeItem("Udaan.admin_auth");
      
      // Still populate mockAuth to not break the rest of the frontend which relies on it for now.
      mockAuth.signIn({
        name: user.name,
        business: user.businessName,
        businessAddress: user.businessAddress || search.address,
        gstin: user.gstin || state.gstNo,
        panNo: user.panNo || state.panNo,
        aadhaarNo: user.aadhaarNo || state.aadhaarNo,
        phone: user.phone,
        email: user.email,
        role: user.role,
        token: user.token,
        subscription: user.subscription
      });

      // Upload KYC documents (PAN/Aadhaar images) if provided — fire-and-forget
      if (search.mode === 'register' && (state.panCard || state.aadhaarCard)) {
        try {
          const formData = new FormData();
          if (state.panCard) formData.append('panCard', state.panCard);
          if (state.aadhaarCard) formData.append('aadhaarCard', state.aadhaarCard);
          await api.post('/auth/upload-docs', formData, {
            headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${user.token}` }
          });
        } catch (_) { /* non-critical, images can be uploaded later */ }
      }

      const redirectPath = (user.role?.toLowerCase() === "staff" || user.role?.toLowerCase() === "viewer") ? "/staff/dashboard" : (user.role?.toLowerCase() === "admin" ? "/admin" : "/vendor/dashboard");
      toast.success(user.role === "admin" ? "Admin access granted!" : search.mode === "register" ? "Account created!" : "Signed in successfully");
      
      if (state.returnUrl) {
        sessionStorage.setItem('resumeInvoiceFlow', 'true');
      }
      
      window.location.href = state.returnUrl || redirectPath;

    } catch (error) {
      if (error.response && error.response.status === 404) {
        toast.error("No account found for this number. Please create a new account.");
        navigate(`/register?phone=${search.phone}`);
      } else {
        toast.error(error.response?.data?.message || "Invalid OTP");
      }
    }
  };

  const masked =
    search.phone.length === 10
      ? `+91 ${search.phone.slice(0, 2)}xxxx${search.phone.slice(-4)}`
      : "your mobile";

  return (
    <AuthShell
      title="Verify your number"
      subtitle={`We sent a 6-digit code to ${masked}.`}
      footer={
        <>
          Wrong number?{" "}
          <Link
            to={search.mode === "register" ? "/register" : "/login"}
            className="font-semibold text-primary hover:underline"
          >
            Go back
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="flex justify-center gap-1.5 sm:gap-3" onPaste={onPaste}>
          {digits.map((d, i) => (
            <Input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
              className="h-12 w-9 rounded-lg text-center text-lg font-bold sm:h-16 sm:w-14 sm:rounded-xl sm:text-2xl"
            />
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground justify-center sm:justify-start">
            <ShieldCheck className="h-4 w-4 text-success" />
            Demo mode — any 6 digits work
          </span>
          <div className="flex justify-center sm:justify-end">
            {resend > 0 ? (
              <span className="text-muted-foreground font-medium">Resend in {resend}s</span>
            ) : (
              <button
                type="button"
                className="font-semibold text-primary hover:underline"
                onClick={() => {
                  setResend(30);
                  toast.success("OTP resent");
                }}
              >
                Resend OTP
              </button>
            )}
          </div>
        </div>

        <Button type="submit" className="h-12 w-full rounded-xl text-base">
          Verify & continue <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </form>
    </AuthShell>
  );
}
