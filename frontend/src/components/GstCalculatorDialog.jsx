import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function GstCalculatorDialog({ open, onOpenChange }) {
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("18");
  const [gstType, setGstType] = useState("exclusive");
  const [taxSplit, setTaxSplit] = useState("cgst_sgst"); // 'cgst_sgst' or 'igst'

  const calculateGst = () => {
    const amt = parseFloat(amount) || 0;
    const r = parseFloat(rate) || 0;

    let gstAmount = 0;
    let net = 0;
    let total = 0;

    if (gstType === "exclusive") {
      gstAmount = (amt * r) / 100;
      net = amt;
      total = amt + gstAmount;
    } else {
      gstAmount = amt - (amt * (100 / (100 + r)));
      net = amt - gstAmount;
      total = amt;
    }

    const halfGst = gstAmount / 2;
    const halfRate = r / 2;

    return {
      net,
      gst: gstAmount,
      cgst: halfGst,
      sgst: halfGst,
      cgstRate: halfRate,
      sgstRate: halfRate,
      total,
    };
  };

  const results = calculateGst();

  const formatCurrency = (val) => "₹" + val.toFixed(2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>GST Calculator</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>GST Type</Label>
            <RadioGroup defaultValue="exclusive" value={gstType} onValueChange={setGstType} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="exclusive" id="exclusive" />
                <Label htmlFor="exclusive" className="font-normal cursor-pointer">Exclusive</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inclusive" id="inclusive" />
                <Label htmlFor="inclusive" className="font-normal cursor-pointer">Inclusive</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid gap-2">
            <Label>Tax Calculation Type</Label>
            <RadioGroup defaultValue="cgst_sgst" value={taxSplit} onValueChange={setTaxSplit} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cgst_sgst" id="cgst_sgst" />
                <Label htmlFor="cgst_sgst" className="font-normal cursor-pointer">CGST + SGST (Intra-State)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="igst" id="igst" />
                <Label htmlFor="igst" className="font-normal cursor-pointer">IGST (Inter-State)</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rate">GST Rate (%)</Label>
            <select
              id="rate"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="0">0%</option>
              <option value="0.25">0.25%</option>
              <option value="3">3%</option>
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="18">18%</option>
              <option value="28">28%</option>
            </select>
          </div>

          <div className="mt-4 rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Net Amount:</span>
              <span className="font-semibold">{formatCurrency(results.net)}</span>
            </div>

            {taxSplit === "cgst_sgst" ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">CGST ({results.cgstRate}%):</span>
                  <span className="font-semibold text-destructive">{formatCurrency(results.cgst)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">SGST ({results.sgstRate}%):</span>
                  <span className="font-semibold text-destructive">{formatCurrency(results.sgst)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground/80 border-t border-dashed pt-1">
                  <span>Total GST ({rate}%):</span>
                  <span>{formatCurrency(results.gst)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IGST ({rate}%):</span>
                <span className="font-semibold text-destructive">{formatCurrency(results.gst)}</span>
              </div>
            )}

            <div className="border-t pt-2 mt-2 flex justify-between">
              <span className="font-bold">Total Amount:</span>
              <span className="font-bold text-success">{formatCurrency(results.total)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
