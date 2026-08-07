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
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              placeholder="Rahul Kumar"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="h-11 rounded-xl"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="business">Business name</Label>
            <Input
              id="business"
              placeholder="Sharma Traders"
              value={form.business}
              onChange={(e) => set("business", e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address">Business Address</Label>
          <div className="relative">
            <Input
              id="address"
              placeholder="Street, City, Pincode"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className="h-11 rounded-xl pl-10"
            />
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Business type</Label>
          <Select value={form.type} onValueChange={(v) => set("type", v)}>
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {businessTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
              value={form.phone}
              onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))}
              className={`h-11 flex-1 rounded-xl ${mockAuth.get()?.phone ? "bg-slate-100 text-slate-500 cursor-not-allowed focus-visible:ring-0" : ""}`}
              readOnly={!!mockAuth.get()?.phone}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email <span className="text-muted-foreground">(optional)</span></Label>
          <Input
            id="email"
            type="email"
            placeholder="you@business.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className="h-11 rounded-xl"
          />
        </div>

        <div className="pt-4 mt-2 border-t border-border/50">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Document Uploads (Optional)</h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="gstNo">GST Number</Label>
              <Input
                id="gstNo"
                placeholder="22AAAAA0000A1Z5"
                value={form.gstNo}
                onChange={(e) => set("gstNo", e.target.value.toUpperCase())}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="aadhaarCard">Aadhaar Card</Label>
                <Input
                  id="aadhaarCard"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => set("aadhaarCard", e.target.files[0])}
                  className="h-11 rounded-xl cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                {form.aadhaarCard && form.aadhaarCard.type.startsWith('image/') && (
                  <div className="mt-3 p-1.5 border border-slate-200 rounded-xl inline-block bg-white shadow-sm">
                    <img src={URL.createObjectURL(form.aadhaarCard)} alt="Aadhaar Preview" className="h-24 w-auto rounded-lg object-contain" />
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="panCard">PAN Card</Label>
                <Input
                  id="panCard"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => set("panCard", e.target.files[0])}
                  className="h-11 rounded-xl cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                {form.panCard && form.panCard.type.startsWith('image/') && (
                  <div className="mt-3 p-1.5 border border-slate-200 rounded-xl inline-block bg-white shadow-sm">
                    <img src={URL.createObjectURL(form.panCard)} alt="PAN Preview" className="h-24 w-auto rounded-lg object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl text-base mt-4">
          {loading ? "Sending OTP…" : <>Continue <ArrowRight className="ml-1 h-4 w-4" /></>}
        </Button>
      </form>
    </AuthShell>
  );
}

