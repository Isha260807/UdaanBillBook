import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Phone, MessageCircle, BookOpen, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { AddPartyDialog } from "@/components/EntityDialogs";

const fmt = (n) => "₹" + Math.abs(n).toLocaleString("en-IN");

export function PartiesDashboard() {
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [partyTypes, setPartyTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = searchParams.get("type") || "all";
  const setTab = (val) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val && val !== "all") {
        next.set("type", val);
      } else {
        next.delete("type");
      }
      return next;
    });
  };

  const search = searchParams.get("q") || "";
  const setSearch = (val) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val) next.set("q", val);
      else next.delete("q");
      return next;
    });
  };

  const fetchParties = async () => {
    try {
      setLoading(true);
      const res = await api.get('/parties');
      setParties(res.data);
    } catch (error) {
      console.error("Failed to load parties:", error);
      toast.error("Failed to load parties");
    } finally {
      setLoading(false);
    }
  };

  const fetchPartyTypes = async () => {
    try {
      const res = await api.get('/party-types');
      setPartyTypes(res.data || []);
    } catch (error) {
      console.error("Failed to load party types:", error);
    }
  };

  const fetchedRef = React.useRef(false);

  React.useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchParties();
      fetchPartyTypes();
    }
  }, []);

  const handleAddParty = async (payload) => {
    try {
      const res = await api.post('/parties', payload);
      toast.success(`${res.data.name} added to parties`);
      fetchParties();
      fetchPartyTypes();
    } catch (error) {
      console.error("Failed to add party:", error);
      toast.error(error.response?.data?.message || "Failed to add party");
    }
  };

  const totalReceivable = parties
    .filter((p) => (p.balanceType === 'To Receive') && (p.balance || 0) > 0)
    .reduce((s, p) => s + Math.abs(p.balance), 0);

  const totalPayable = parties
    .filter((p) => (p.balanceType === 'To Pay') && (p.balance || 0) > 0)
    .reduce((s, p) => s + Math.abs(p.balance), 0);

  const filteredParties = parties.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.phone.includes(search);
    if (!matchesSearch) return false;
    if (tab === "all") return true;
    return (p.type || "").toLowerCase() === tab.toLowerCase();
  });

  const sendWhatsAppReminder = (p) => {
    const cleanPhone = (p.phone || "").replace(/\D/g, "");
    if (!cleanPhone) return toast.error("Phone number not available for WhatsApp");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const isReceivable = p.balanceType === 'To Receive';
    const balanceStr = fmt(p.balance || 0);

    let msg = "";
    if (isReceivable && p.balance > 0) {
      msg = `Hello ${p.name}, this is a payment reminder regarding your outstanding balance of ${balanceStr} with us. Kindly arrange the payment at your earliest convenience. Thank you!`;
    } else if (p.balance > 0) {
      msg = `Hello ${p.name}, regarding our pending amount of ${balanceStr} to be paid to you. Thank you!`;
    } else {
      msg = `Hello ${p.name}, sharing your account status with us. Current balance: ₹0. Thank you!`;
    }

    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");
  };

  const openLedger = (p) => {
    navigate(`/vendor/billing?q=${encodeURIComponent(p.name)}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parties"
        actions={
          <Button className="rounded-lg !h-7 sm:!h-10 !text-[11px] sm:!text-sm px-2 sm:px-4 bg-emerald-600 hover:bg-emerald-700 font-medium" onClick={() => setOpen(true)}>
            <Plus className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> Add Party
          </Button>
        }
      />

      <AddPartyDialog
        open={open}
        onOpenChange={setOpen}
        onAdd={handleAddParty}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card className="border-0 bg-gradient-to-br from-success-soft to-card shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
          <CardContent className="p-2 sm:p-5 min-w-0">
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">You'll Receive</p>
            <p className="mt-0.5 sm:mt-1 text-sm sm:text-3xl font-bold text-success truncate">{fmt(totalReceivable)}</p>
            <p className="mt-0.5 sm:mt-1 text-[9px] sm:text-xs text-muted-foreground truncate">
              From {parties.filter((p) => p.balanceType === 'To Receive' && (p.balance || 0) > 0).length} parties
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-accent-soft to-card shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
          <CardContent className="p-2 sm:p-5 min-w-0">
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">You'll Pay</p>
            <p className="mt-0.5 sm:mt-1 text-sm sm:text-3xl font-bold text-amber-600 truncate">{fmt(totalPayable)}</p>
            <p className="mt-0.5 sm:mt-1 text-[9px] sm:text-xs text-muted-foreground truncate">
              To {parties.filter((p) => p.balanceType === 'To Pay' && (p.balance || 0) > 0).length} suppliers
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={tab} onValueChange={setTab} className="block w-full overflow-x-auto pb-0.5">
            <TabsList className="rounded-xl inline-flex min-w-max bg-slate-100 p-1">
              <TabsTrigger value="all" className="rounded-lg capitalize text-xs sm:text-sm px-2.5 py-1">
                All
              </TabsTrigger>
              {partyTypes.map((t) => (
                <TabsTrigger key={t._id || t.name} value={t.name} className="rounded-lg capitalize text-xs sm:text-sm px-2.5 py-1">
                  {t.name}s
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="flex w-full gap-2 sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search party..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-xl pl-9 sm:w-64 bg-white border border-slate-200 shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filteredParties.map((p) => {
            const isReceivable = p.balanceType === 'To Receive';
            const hasBalance = Math.abs(p.balance || 0) > 0;
            const formattedPhone = p.phone ? String(p.phone).replace(/^(\+91\s*)+/, "").trim() : "";
            return (
              <div key={p._id || p.name} className="flex items-center gap-2 sm:gap-3 rounded-2xl border border-slate-200/80 bg-white p-2.5 sm:p-3 shadow-sm transition-shadow hover:shadow-md">
                <Avatar className="h-9 w-9 sm:h-11 sm:w-11 shrink-0">
                  <AvatarFallback className="bg-primary-soft text-xs sm:text-sm font-semibold text-primary">
                    {p.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">{p.name}</span>
                    <Badge variant="outline" className="text-[9px] sm:text-[10px] uppercase text-muted-foreground px-1 py-0 h-4 shrink-0 font-medium">
                      {p.type || "Customer"}
                    </Badge>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium pt-0.5 whitespace-nowrap">
                    {formattedPhone ? `+91 ${formattedPhone}` : "No Phone"}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-1 shrink-0">
                  <p className={`text-xs sm:text-sm font-bold ${
                    !hasBalance 
                      ? "text-muted-foreground" 
                      : isReceivable 
                      ? "text-emerald-600" 
                      : "text-amber-600"
                  }`}>
                    {!hasBalance ? "₹0" : (isReceivable ? fmt(p.balance) : `-${fmt(p.balance)}`)}
                  </p>
                  
                  {/* Compact Action Icons */}
                  <div className="flex items-center gap-0.5 sm:gap-1.5">
                    {p.phone && (
                      <>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg p-0" 
                          title="WhatsApp Reminder"
                          onClick={() => sendWhatsAppReminder(p)}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </Button>

                        <a 
                          href={`tel:+91${formattedPhone}`} 
                          className="h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Call Party"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      </>
                    )}

                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6 sm:h-7 sm:w-7 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg p-0" 
                      title="View Ledger / Transactions"
                      onClick={() => openLedger(p)}
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                    </Button>

                    <Button size="icon" variant="ghost" className="h-6 w-6 sm:h-7 sm:w-7 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-0" title="Delete Party" onClick={async () => {
                      if (window.confirm(`Delete party "${p.name}"?`)) {
                        try {
                          await api.delete(`/parties/${p._id}`);
                          toast.success("Party deleted");
                          fetchParties();
                        } catch (err) {
                          toast.error("Failed to delete party");
                        }
                      }
                    }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredParties.length === 0 && !loading && (
            <div className="col-span-2 text-center text-muted-foreground text-sm py-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              No parties found{tab !== "all" ? ` for type "${tab}"` : ""}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
