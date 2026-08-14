import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthShell } from "@/components/AuthShell";
import { mockAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const [businessTypes, setBusinessTypes] = useState([
    "Retail Shop",
    "Wholesale / Distribution",
    "Manufacturing",
    "Services",
    "Restaurant / Cafe",
    "Other"
  ]);

  const [form, setForm] = useState({
    name: "",
    business: "",
    address: "",
    type: "Retail Shop",
    phone: "",
    email: "",
    gstNo: "",
    aadhaarNo: "",
    panNo: "",
    aadhaarCard: null,
    panCard: null,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const phoneParam = searchParams.get("phone");
    if (phoneParam) {
      setForm(f => ({ ...f, phone: phoneParam }));
    }
  }, [location.search]);

  useEffect(() => {
    const fetchPublicSettings = async () => {
      try {
        const res = await api.get("/auth/settings");
        if (res.data.businessTypes && res.data.businessTypes.length > 0) {
          setBusinessTypes(res.data.businessTypes);
          setForm(f => ({ ...f, type: res.data.businessTypes[0] }));
        }
      } catch (error) {
        console.error("Failed to load business types", error);
      }
    };

    const fetchUserPhone = async () => {
      const localUser = mockAuth.get();
      if (localUser && localUser.phone) {
        setForm(f => ({ ...f, phone: localUser.phone }));
      }
      try {
        const res = await api.get("/auth/me");
        if (res.data && res.data.phone) {
          setForm(f => ({ ...f, phone: res.data.phone }));
        }
      } catch (e) {
        // ignore
      }
    };

    fetchPublicSettings();
    fetchUserPhone();
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const clean = form.phone.replace(/\D/g, "");
    if (!form.name.trim()) return toast.error("Please enter your full name");
    if (!form.business.trim()) return toast.error("Please enter your business name");
    if (!form.address.trim()) return toast.error("Please enter your business address");
    if (clean.length !== 10) return toast.error("Please enter a valid 10-digit mobile number");
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email))
      return toast.error("Please enter a valid email or leave it blank");

    try {
      setLoading(true);
      const res = await api.post('/auth/send-otp', { phone: clean, mode: 'register' });
      toast.success("OTP sent to +91 " + clean + ` (Demo Code: ${res.data.otp})`);
      navigate('/verify-otp', {
        state: {
          phone: clean,
          mode: 'register',
          name: form.name,
          business: form.business,
          email: form.email,
          address: form.address,
          businessType: form.type,
          gstNo: form.gstNo,
          aadhaarNo: form.aadhaarNo,
          panNo: form.panNo,
          returnUrl: location.state?.returnUrl
        }
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your free account"
      subtitle="Set up your business in less than a minute."
      containerClass="max-w-xl"
    >
      <form onSubmit={onSubmit} className="space-y-2.5">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="name" className="text-xs">Your name</Label>
            <Input
              id="name"
              placeholder="Rahul Kumar"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="h-9 rounded-lg text-xs"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="business" className="text-xs">Business name</Label>
            <Input
              id="business"
              placeholder="Sharma Traders"
              value={form.business}
              onChange={(e) => set("business", e.target.value)}
              className="h-9 rounded-lg text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="address" className="text-xs">Business Address</Label>
            <div className="relative">
              <Input
                id="address"
                placeholder="Street, City, Pincode"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                className="h-9 rounded-lg pl-9 text-xs"
              />
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Business type</Label>
            <Select value={form.type} onValueChange={(v) => set("type", v)}>
              <SelectTrigger className="h-9 rounded-lg text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {businessTypes.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="phone" className="text-xs">Mobile number</Label>
            <div className="flex items-stretch gap-1.5">
              <div className="flex items-center gap-1 rounded-lg border bg-secondary px-2.5 text-xs font-semibold">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                +91
              </div>
              <Input
                id="phone"
                inputMode="numeric"
                maxLength={10}
                placeholder="98xxxxxxxx"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))}
                className={`h-9 flex-1 rounded-lg text-xs ${mockAuth.get()?.phone ? "bg-slate-100 text-slate-500 cursor-not-allowed focus-visible:ring-0" : ""}`}
                readOnly={!!mockAuth.get()?.phone}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs">Email <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              id="email"
              type="email"
              placeholder="you@business.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="h-9 rounded-lg text-xs"
            />
          </div>
        </div>

        <div className="pt-2 mt-1 border-t border-border/50">
          <h3 className="text-xs font-bold text-slate-800 mb-2">Identity & Tax Details</h3>
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="gstNo" className="text-xs">GST Number</Label>
                <Input
                  id="gstNo"
                  placeholder="22AAAAA0000A1Z5"
                  value={form.gstNo}
                  onChange={(e) => set("gstNo", e.target.value.toUpperCase())}
                  className="h-9 rounded-lg text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="panNo" className="text-xs">PAN Number</Label>
                <Input
                  id="panNo"
                  placeholder="ABCDE1234F"
                  value={form.panNo}
                  maxLength={10}
                  onChange={(e) => set("panNo", e.target.value.toUpperCase())}
                  className="h-9 rounded-lg uppercase text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="aadhaarNo" className="text-xs">Aadhaar Number</Label>
                <Input
                  id="aadhaarNo"
                  placeholder="1234 5678 9012"
                  value={form.aadhaarNo}
                  maxLength={12}
                  onChange={(e) => set("aadhaarNo", e.target.value.replace(/\D/g, "").slice(0, 12))}
                  className="h-9 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="panCard" className="text-xs">PAN Card Image <span className="text-muted-foreground">(Optional)</span></Label>
                <Input
                  id="panCard"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => set("panCard", e.target.files[0])}
                  className="h-9 rounded-lg text-xs cursor-pointer file:mr-2 file:py-1 file:px-2.5 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                {form.panCard && form.panCard.type.startsWith('image/') && (
                  <div className="mt-1 p-1 border border-slate-200 rounded-lg inline-block bg-white shadow-sm">
                    <img src={URL.createObjectURL(form.panCard)} alt="PAN Preview" className="h-16 w-auto rounded object-contain" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="aadhaarCard" className="text-xs">Aadhaar Card Image</Label>
                <Input
                  id="aadhaarCard"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => set("aadhaarCard", e.target.files[0])}
                  className="h-9 rounded-lg text-xs cursor-pointer file:mr-2 file:py-1 file:px-2.5 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                {form.aadhaarCard && form.aadhaarCard.type.startsWith('image/') && (
                  <div className="mt-1 p-1 border border-slate-200 rounded-lg inline-block bg-white shadow-sm">
                    <img src={URL.createObjectURL(form.aadhaarCard)} alt="Aadhaar Preview" className="h-16 w-auto rounded object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="h-10 w-full rounded-lg text-sm mt-3 font-semibold">
          {loading ? "Sending OTP…" : <>Continue <ArrowRight className="ml-1.5 h-4 w-4" /></>}
        </Button>
      </form>
    </AuthShell>
  );
}

