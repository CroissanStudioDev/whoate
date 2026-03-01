"use client";

import { ArrowLeft, Check, Info, Loader2, Pencil, Plus, Store, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSessionStore, useUserStore } from "@/lib/store";
import type { Receipt, ReceiptItem } from "@/types";
import { CURRENCY_SYMBOLS, formatCurrency } from "@/types";

interface ManualItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: string;
}

export default function UploadPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const { participantId } = useUserStore();
  const { session, addReceipt } = useSessionStore();

  const [mode, setMode] = useState<"photo" | "manual">("photo");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [paidBy, setPaidBy] = useState(participantId || "");
  const [dragActive, setDragActive] = useState(false);

  // Manual entry state
  const [currency, setCurrency] = useState("USD");
  const [items, setItems] = useState<ManualItem[]>([
    { id: "1", name: "", quantity: 1, unitPrice: "" },
  ]);
  const [tax, setTax] = useState("");
  const [tip, setTip] = useState("");
  const [taxIncluded, setTaxIncluded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedItems, setEditedItems] = useState<ReceiptItem[]>([]);
  const [editedTax, setEditedTax] = useState("");
  const [editedTip, setEditedTip] = useState("");
  const [receiptName, setReceiptName] = useState("");
  const [receiptNote, setReceiptNote] = useState("");
  const [editedCurrency, setEditedCurrency] = useState("");

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
        setTaxIncluded(data.receipt.taxIncluded || false);
        setReceiptName(data.receipt.name || data.receipt.establishment || "");
        setReceiptNote(data.receipt.note || "");
        setEditedCurrency(data.receipt.currency);
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

  const handleManualSubmit = async () => {
    if (!participantId) {
      toast.error("Please join the session first");
      return;
    }

    const validItems = items.filter((item) => item.name.trim() && item.unitPrice);
    if (validItems.length === 0) {
      toast.error("Add at least one item");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const res = await fetch(`/api/sessions/${code}/receipts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manual: true,
          participantId,
          paidBy: paidBy || participantId,
          currency,
          items: validItems.map((item) => ({
            name: item.name.trim(),
            quantity: item.quantity,
            unitPrice: Number.parseFloat(item.unitPrice) || 0,
          })),
          tax: Number.parseFloat(tax) || 0,
          tip: Number.parseFloat(tip) || 0,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create receipt");
      }

      const data = await res.json();
      setReceipt(data.receipt);
      setTaxIncluded(data.receipt.taxIncluded || false);
      addReceipt(data.receipt);
      toast.success(`Created receipt with ${data.receipt.items.length} items!`);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to create receipt");
      toast.error("Failed to create receipt");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
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

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), name: "", quantity: 1, unitPrice: "" }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof ManualItem, value: string | number) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const calculateTotal = () => {
    const itemsTotal = items.reduce((sum, item) => {
      const price = Number.parseFloat(item.unitPrice) || 0;
      return sum + price * item.quantity;
    }, 0);
    return itemsTotal + (Number.parseFloat(tax) || 0) + (Number.parseFloat(tip) || 0);
  };

  const handleTaxIncludedToggle = async (newValue: boolean) => {
    if (!receipt || !participantId) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/sessions/${code}/receipts`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptId: receipt.id,
          participantId,
          updates: { taxIncluded: newValue },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReceipt(data.receipt);
        setTaxIncluded(newValue);
        toast.success(newValue ? "Tax marked as included" : "Tax will be added on top");
      }
    } catch {
      toast.error("Failed to update");
    } finally {
      setIsUpdating(false);
    }
  };

  const startEditing = () => {
    if (!receipt) return;
    setEditedItems([...receipt.items]);
    setEditedTax(receipt.tax.toString());
    setEditedTip(receipt.tip.toString());
    setEditedCurrency(receipt.currency);
    setReceiptName(receipt.name || receipt.establishment || "");
    setReceiptNote(receipt.note || "");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedItems([]);
  };

  const updateEditedItem = (id: string, field: keyof ReceiptItem, value: string | number) => {
    setEditedItems((items) =>
      items.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          updated.totalPrice = updated.quantity * updated.unitPrice;
        }
        return updated;
      })
    );
  };

  const deleteEditedItem = (id: string) => {
    if (editedItems.length > 1) {
      setEditedItems((items) => items.filter((item) => item.id !== id));
    }
  };

  const addEditedItem = () => {
    const newItem: ReceiptItem = {
      id: `new-${Date.now()}`,
      name: "",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      claims: [],
    };
    setEditedItems([...editedItems, newItem]);
  };

  const saveEdits = async () => {
    if (!receipt || !participantId) return;

    const validItems = editedItems.filter((item) => item.name.trim());
    if (validItems.length === 0) {
      toast.error("Add at least one item");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/sessions/${code}/receipts`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptId: receipt.id,
          participantId,
          updates: {
            items: validItems.map((item) => ({
              ...item,
              totalPrice: item.quantity * item.unitPrice,
            })),
            tax: Number.parseFloat(editedTax) || 0,
            tip: Number.parseFloat(editedTip) || 0,
            currency: editedCurrency,
            name: receiptName.trim() || undefined,
            note: receiptNote.trim() || undefined,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReceipt(data.receipt);
        setIsEditing(false);
        toast.success("Receipt updated!");
      } else {
        throw new Error("Failed to update");
      }
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setIsUpdating(false);
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
          <h1 className="text-lg font-medium mb-3">Add receipt</h1>
          <p className="text-neutral-500">Session {code}</p>
        </header>

        <div className="space-y-8">
          {/* Who paid */}
          {session && !receipt && (
            <div className="space-y-2">
              <span className="text-sm text-neutral-500 block">Who paid?</span>
              <Select value={paidBy} onValueChange={setPaidBy}>
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

          {/* Mode toggle */}
          {!receipt && !isUploading && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("photo")}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  mode === "photo"
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                Upload photo
              </button>
              <button
                type="button"
                onClick={() => setMode("manual")}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  mode === "manual"
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                Add manually
              </button>
            </div>
          )}

          {/* Photo upload area */}
          {mode === "photo" && !receipt && !isUploading && (
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

          {/* Manual entry form */}
          {mode === "manual" && !receipt && !isUploading && (
            <div className="space-y-6">
              {/* Currency */}
              <div className="space-y-2">
                <span className="text-sm text-neutral-500 block">Currency</span>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="h-11 border-neutral-200 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CURRENCY_SYMBOLS).map(([code, symbol]) => (
                      <SelectItem key={code} value={code}>
                        {symbol} {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Items */}
              <div className="space-y-3">
                <span className="text-sm text-neutral-500 block">Items</span>
                {items.map((item) => (
                  <div key={item.id} className="flex gap-2">
                    <Input
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, "name", e.target.value)}
                      className="flex-1 h-11 border-neutral-200 rounded-lg"
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.id, "quantity", Number.parseInt(e.target.value, 10) || 1)
                      }
                      className="w-16 h-11 border-neutral-200 rounded-lg text-center"
                      min={1}
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)}
                      className="w-24 h-11 border-neutral-200 rounded-lg"
                      step="0.01"
                      min="0"
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-neutral-400 hover:text-neutral-600"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700"
                >
                  <Plus className="w-4 h-4" />
                  Add item
                </button>
              </div>

              {/* Tax & Tip */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-sm text-neutral-500 block">Tax (optional)</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={tax}
                    onChange={(e) => setTax(e.target.value)}
                    className="h-11 border-neutral-200 rounded-lg"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-sm text-neutral-500 block">Tip (optional)</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={tip}
                    onChange={(e) => setTip(e.target.value)}
                    className="h-11 border-neutral-200 rounded-lg"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              {/* Total preview */}
              <div className="flex justify-between py-3 border-t border-neutral-200">
                <span className="font-medium">Total</span>
                <span className="font-mono text-lg">
                  {formatCurrency(calculateTotal(), currency)}
                </span>
              </div>

              {/* Submit */}
              <Button
                onClick={handleManualSubmit}
                disabled={isUploading}
                className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-normal"
              >
                Create receipt
              </Button>
            </div>
          )}

          {/* Loading */}
          {isUploading && (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-neutral-400" />
              <p className="text-neutral-500">
                {mode === "photo" ? "Processing receipt..." : "Creating receipt..."}
              </p>
              {mode === "photo" && (
                <p className="text-sm text-neutral-400 mt-1">This may take a few seconds</p>
              )}
            </div>
          )}

          {/* Error */}
          {uploadError && (
            <div className="p-4 rounded-lg border border-neutral-200 bg-neutral-50">
              <p className="text-sm text-neutral-600">{uploadError}</p>
            </div>
          )}

          {/* Receipt preview */}
          {receipt && !isEditing && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-neutral-600">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">{receipt.items.length} items</span>
                </div>
                <button
                  type="button"
                  onClick={startEditing}
                  className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
              </div>

              {/* Establishment */}
              {receipt.establishment && (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-neutral-200 bg-neutral-50">
                  <Store className="w-4 h-4 text-neutral-400" />
                  <span className="text-sm text-neutral-600">{receipt.establishment}</span>
                </div>
              )}

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

              {/* Receipt name & note */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-sm text-neutral-500 block">Receipt name (optional)</span>
                  <Input
                    placeholder={receipt.establishment || "e.g., Dinner at Mario's"}
                    value={receiptName}
                    onChange={(e) => setReceiptName(e.target.value)}
                    className="h-11 border-neutral-200 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-sm text-neutral-500 block">
                    Note (shown during selection)
                  </span>
                  <Textarea
                    placeholder="e.g., Birthday dinner, Alice's treat for dessert"
                    value={receiptNote}
                    onChange={(e) => setReceiptNote(e.target.value)}
                    className="border-neutral-200 rounded-lg resize-none"
                    rows={2}
                  />
                </div>
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <span className="text-sm text-neutral-500 block">Currency</span>
                <Select value={editedCurrency} onValueChange={setEditedCurrency}>
                  <SelectTrigger className="h-11 border-neutral-200 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CURRENCY_SYMBOLS).map(([currCode, symbol]) => (
                      <SelectItem key={currCode} value={currCode}>
                        {symbol} {currCode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tax toggle */}
              {receipt.tax > 0 && (
                <div className="p-4 rounded-lg border border-neutral-200 bg-neutral-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm">Tax included in prices?</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTaxIncludedToggle(!taxIncluded)}
                      disabled={isUpdating}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        taxIncluded ? "bg-neutral-900" : "bg-neutral-300"
                      } ${isUpdating ? "opacity-50" : ""}`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          taxIncluded ? "left-7" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">
                    {taxIncluded
                      ? "Tax won't be added on top when splitting"
                      : "Tax will be split proportionally among participants"}
                  </p>
                </div>
              )}

              {/* Totals */}
              <div className="pt-4 border-t border-neutral-200 space-y-2">
                <div className="flex justify-between text-sm text-neutral-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(receipt.subtotal, receipt.currency)}</span>
                </div>
                {receipt.tax > 0 && (
                  <div className="flex justify-between text-sm text-neutral-500">
                    <span>Tax {taxIncluded && "(included)"}</span>
                    <span>{taxIncluded ? "—" : formatCurrency(receipt.tax, receipt.currency)}</span>
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

              {/* Action buttons - primary action is to select items */}
              <div className="space-y-3">
                <Button
                  onClick={async () => {
                    // Save name, note, currency if changed
                    if (
                      receiptName !== (receipt.name || "") ||
                      receiptNote !== (receipt.note || "") ||
                      editedCurrency !== receipt.currency
                    ) {
                      try {
                        await fetch(`/api/sessions/${code}/receipts`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            receiptId: receipt.id,
                            participantId,
                            updates: {
                              name: receiptName.trim() || undefined,
                              note: receiptNote.trim() || undefined,
                              currency: editedCurrency,
                            },
                          }),
                        });
                      } catch {
                        // Ignore errors, just continue
                      }
                    }
                    router.push(`/session/${code}/select`);
                  }}
                  className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-normal"
                >
                  Select items now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    // Save name, note, currency if changed
                    if (
                      receiptName !== (receipt.name || "") ||
                      receiptNote !== (receipt.note || "") ||
                      editedCurrency !== receipt.currency
                    ) {
                      try {
                        await fetch(`/api/sessions/${code}/receipts`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            receiptId: receipt.id,
                            participantId,
                            updates: {
                              name: receiptName.trim() || undefined,
                              note: receiptNote.trim() || undefined,
                              currency: editedCurrency,
                            },
                          }),
                        });
                      } catch {
                        // Ignore errors, just continue
                      }
                    }
                    router.push(`/session/${code}`);
                  }}
                  className="w-full h-11 border-neutral-200 hover:bg-neutral-50 rounded-lg font-normal"
                >
                  Back to session
                </Button>
              </div>
            </div>
          )}

          {/* Edit mode */}
          {receipt && isEditing && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-medium">Edit receipt</span>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="text-sm text-neutral-500 hover:text-neutral-700"
                >
                  Cancel
                </button>
              </div>

              {/* Receipt name & note */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-sm text-neutral-500 block">Receipt name</span>
                  <Input
                    placeholder={receipt.establishment || "e.g., Dinner at Mario's"}
                    value={receiptName}
                    onChange={(e) => setReceiptName(e.target.value)}
                    className="h-11 border-neutral-200 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-sm text-neutral-500 block">Note</span>
                  <Textarea
                    placeholder="e.g., Birthday dinner"
                    value={receiptNote}
                    onChange={(e) => setReceiptNote(e.target.value)}
                    className="border-neutral-200 rounded-lg resize-none"
                    rows={2}
                  />
                </div>
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <span className="text-sm text-neutral-500 block">Currency</span>
                <Select value={editedCurrency} onValueChange={setEditedCurrency}>
                  <SelectTrigger className="h-11 border-neutral-200 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CURRENCY_SYMBOLS).map(([currCode, symbol]) => (
                      <SelectItem key={currCode} value={currCode}>
                        {symbol} {currCode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Editable items */}
              <div className="space-y-3">
                <span className="text-sm text-neutral-500 block">Items</span>
                {editedItems.map((item) => (
                  <div key={item.id} className="flex gap-2">
                    <Input
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => updateEditedItem(item.id, "name", e.target.value)}
                      className="flex-1 h-11 border-neutral-200 rounded-lg"
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) =>
                        updateEditedItem(
                          item.id,
                          "quantity",
                          Number.parseInt(e.target.value, 10) || 1
                        )
                      }
                      className="w-16 h-11 border-neutral-200 rounded-lg text-center"
                      min={1}
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={item.unitPrice || ""}
                      onChange={(e) =>
                        updateEditedItem(
                          item.id,
                          "unitPrice",
                          Number.parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-24 h-11 border-neutral-200 rounded-lg"
                      step="0.01"
                      min="0"
                    />
                    {editedItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteEditedItem(item.id)}
                        className="p-2 text-neutral-400 hover:text-red-500"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addEditedItem}
                  className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700"
                >
                  <Plus className="w-4 h-4" />
                  Add item
                </button>
              </div>

              {/* Tax & Tip */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-sm text-neutral-500 block">Tax</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={editedTax}
                    onChange={(e) => setEditedTax(e.target.value)}
                    className="h-11 border-neutral-200 rounded-lg"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-sm text-neutral-500 block">Tip</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={editedTip}
                    onChange={(e) => setEditedTip(e.target.value)}
                    className="h-11 border-neutral-200 rounded-lg"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              {/* Edited total preview */}
              <div className="flex justify-between py-3 border-t border-neutral-200">
                <span className="font-medium">Total</span>
                <span className="font-mono text-lg">
                  {formatCurrency(
                    editedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) +
                      (Number.parseFloat(editedTax) || 0) +
                      (Number.parseFloat(editedTip) || 0),
                    receipt.currency
                  )}
                </span>
              </div>

              {/* Save button */}
              <Button
                onClick={saveEdits}
                disabled={isUpdating}
                className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-normal"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save changes"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
