"use client";

import { ArrowLeft, Check, Loader2, Upload } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  const [dragActive, setDragActive] = useState(false);
  const [_preview, setPreview] = useState<string | null>(null);

  const handleUpload = useCallback(
    async (base64: string) => {
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
    },
    [code, participantId, paidBy, addReceipt]
  );

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        setPreview(base64);
        await handleUpload(base64);
      };
      reader.readAsDataURL(file);
    },
    [handleUpload]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files?.[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile]
  );

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
        // Ignore errors
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-6 py-16">
        {/* Header */}
        <header className="mb-12">
          <Link
            href={`/session/${code}`}
            className="inline-flex items-center text-neutral-400 hover:text-neutral-600 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
          <h1 className="text-lg font-medium mb-3">Upload receipt</h1>
          <p className="text-neutral-500">Session {code}</p>
        </header>

        <div className="space-y-8">
          {/* Who paid */}
          {session && (
            <div className="space-y-2">
              <span className="text-sm text-neutral-500 block">Who paid?</span>
              <Select value={paidBy} onValueChange={updatePaidBy}>
                <SelectTrigger className="h-11 border-neutral-200 rounded-lg">
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
            </div>
          )}

          {/* Upload area */}
          {!receipt && !isUploading && (
            <section
              aria-label="Upload receipt"
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive ? "border-neutral-900 bg-neutral-50" : "border-neutral-200"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <label className="cursor-pointer block">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={handleChange}
                  disabled={isUploading}
                />
                <Upload className="w-8 h-8 mx-auto mb-4 text-neutral-400" />
                <p className="font-medium mb-1">Drop receipt here</p>
                <p className="text-sm text-neutral-400">or click to upload</p>
              </label>
            </section>
          )}

          {/* Loading */}
          {isUploading && (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-neutral-400" />
              <p className="text-neutral-500">Processing receipt...</p>
              <p className="text-sm text-neutral-400 mt-1">This may take a few seconds</p>
            </div>
          )}

          {/* Error */}
          {uploadError && (
            <div className="p-4 rounded-lg border border-neutral-200 bg-neutral-50">
              <p className="text-sm text-neutral-600">{uploadError}</p>
            </div>
          )}

          {/* Receipt preview */}
          {receipt && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-neutral-600">
                <Check className="w-5 h-5" />
                <span className="font-medium">{receipt.items.length} items found</span>
              </div>

              {/* Items list */}
              <div className="space-y-2">
                {receipt.items.map((item: ReceiptItem) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 rounded-lg border border-neutral-200"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {item.quantity > 1 && (
                        <p className="text-sm text-neutral-400">
                          {item.quantity} × {formatCurrency(item.unitPrice, receipt.currency)}
                        </p>
                      )}
                    </div>
                    <p className="font-medium">
                      {formatCurrency(item.totalPrice, receipt.currency)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="pt-4 border-t border-neutral-200 space-y-2">
                <div className="flex justify-between text-sm text-neutral-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(receipt.subtotal, receipt.currency)}</span>
                </div>
                {receipt.tax > 0 && (
                  <div className="flex justify-between text-sm text-neutral-500">
                    <span>Tax</span>
                    <span>{formatCurrency(receipt.tax, receipt.currency)}</span>
                  </div>
                )}
                {receipt.tip > 0 && (
                  <div className="flex justify-between text-sm text-neutral-500">
                    <span>Tip</span>
                    <span>{formatCurrency(receipt.tip, receipt.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium pt-2 border-t border-neutral-200">
                  <span>Total</span>
                  <span>{formatCurrency(receipt.total, receipt.currency)}</span>
                </div>
              </div>

              {/* Continue button */}
              <Button
                onClick={() => router.push(`/session/${code}`)}
                className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-normal"
              >
                Continue
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
