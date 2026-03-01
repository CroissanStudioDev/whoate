"use client";

import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ReceiptUploader } from "@/components/session/ReceiptUploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSessionStore, useUserStore } from "@/lib/store";
import type { Receipt, ReceiptItem } from "@/types";
import { formatCurrency } from "@/types";

export default function UploadPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const { participantId } = useUserStore();
  const { session, addReceipt, setSession } = useSessionStore();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [paidBy, setPaidBy] = useState(participantId || "");

  const handleUpload = async (base64: string) => {
    if (!participantId) {
      toast.error("Please join the session first");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const res = await fetch(`/api/sessions/${code}/receipts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          participantId,
          paidBy: paidBy || participantId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to process receipt");
      }

      const data = await res.json();
      setReceipt(data.receipt);
      addReceipt(data.receipt);
      toast.success(`Found ${data.receipt.items.length} items!`);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to process receipt");
      toast.error("Failed to process receipt");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    if (receipt) {
      router.push(`/session/${code}`);
    }
  };

  const updatePaidBy = async (newPaidBy: string) => {
    setPaidBy(newPaidBy);
    if (receipt && participantId) {
      try {
        const res = await fetch(`/api/sessions/${code}/receipts`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            receiptId: receipt.id,
            participantId,
            updates: { paidBy: newPaidBy },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setReceipt(data.receipt);
          setSession(data.session);
        }
      } catch {
        // Ignore errors for now
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/session/${code}`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Upload Receipt</h1>
            <p className="text-sm text-muted-foreground">Session {code}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Who paid */}
          {session && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Who paid?</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={paidBy} onValueChange={updatePaidBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select who paid" />
                  </SelectTrigger>
                  <SelectContent>
                    {session.participants.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} {p.id === participantId && "(you)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Uploader */}
          {!receipt && (
            <ReceiptUploader onUpload={handleUpload} isLoading={isUploading} error={uploadError} />
          )}

          {/* Receipt preview */}
          {receipt && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  Receipt Processed
                </CardTitle>
                <CardDescription>
                  {receipt.items.length} items found • {receipt.currency}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items list */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {receipt.items.map((item: ReceiptItem) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-2 rounded bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.quantity > 1 && (
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} × {formatCurrency(item.unitPrice, receipt.currency)}
                          </p>
                        )}
                      </div>
                      <p className="font-semibold">
                        {formatCurrency(item.totalPrice, receipt.currency)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t pt-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(receipt.subtotal, receipt.currency)}</span>
                  </div>
                  {receipt.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Tax</span>
                      <span>{formatCurrency(receipt.tax, receipt.currency)}</span>
                    </div>
                  )}
                  {receipt.tip > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Tip</span>
                      <span>{formatCurrency(receipt.tip, receipt.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>{formatCurrency(receipt.total, receipt.currency)}</span>
                  </div>
                </div>

                {/* Save button */}
                <Button className="w-full" size="lg" onClick={handleSave}>
                  Continue
                </Button>
              </CardContent>
            </Card>
          )}

          {isUploading && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Processing receipt with AI...</p>
              <p className="text-sm text-muted-foreground">This may take a few seconds</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
