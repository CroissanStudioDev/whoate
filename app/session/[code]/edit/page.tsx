"use client";

import { ArrowLeft, CreditCard, Loader2, Pencil, Plus, Store, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSessionStore, useUserStore } from "@/lib/store";
import type { Receipt, ReceiptItem } from "@/types";
import { CURRENCY_SYMBOLS, formatCurrency } from "@/types";

interface EditingItem {
  receiptId: string;
  item: ReceiptItem;
}

export default function EditPage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();

  const { participantId } = useUserStore();
  const { session, setSession } = useSessionStore();

  const [isLoading, setIsLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [editForm, setEditForm] = useState({ name: "", quantity: 1, unitPrice: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "item" | "receipt";
    receiptId: string;
    itemId?: string;
  } | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/sessions/${code}`);
        if (res.ok) {
          const data = await res.json();
          setSession(data.session);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchSession();
  }, [code, setSession]);

  const openEditDialog = (receiptId: string, item: ReceiptItem) => {
    setEditingItem({ receiptId, item });
    setEditForm({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
    });
  };

  const handleSaveItem = async () => {
    if (!editingItem || !session) return;

    setIsSaving(true);
    try {
      const receipt = session.receipts.find((r) => r.id === editingItem.receiptId);
      if (!receipt) return;

      const updatedItems = receipt.items.map((item) => {
        if (item.id === editingItem.item.id) {
          const unitPrice = Number.parseFloat(editForm.unitPrice) || 0;
          const quantity = editForm.quantity || 1;
          return {
            ...item,
            name: editForm.name.trim() || item.name,
            quantity,
            unitPrice,
            totalPrice: unitPrice * quantity,
          };
        }
        return item;
      });

      const res = await fetch(`/api/sessions/${code}/receipts`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptId: editingItem.receiptId,
          participantId,
          updates: { items: updatedItems },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        setEditingItem(null);
        toast.success("Item updated");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update");
      }
    } catch {
      toast.error("Failed to update item");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteConfirm || deleteConfirm.type !== "item" || !session) return;

    setIsSaving(true);
    try {
      const receipt = session.receipts.find((r) => r.id === deleteConfirm.receiptId);
      if (!receipt) return;

      const updatedItems = receipt.items.filter((item) => item.id !== deleteConfirm.itemId);

      const res = await fetch(`/api/sessions/${code}/receipts`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptId: deleteConfirm.receiptId,
          participantId,
          updates: { items: updatedItems },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        toast.success("Item deleted");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete item");
    } finally {
      setIsSaving(false);
      setDeleteConfirm(null);
    }
  };

  const handleDeleteReceipt = async () => {
    if (!deleteConfirm || deleteConfirm.type !== "receipt" || !session) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/sessions/${code}/receipts/${deleteConfirm.receiptId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId }),
      });

      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        toast.success("Receipt deleted");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete receipt");
    } finally {
      setIsSaving(false);
      setDeleteConfirm(null);
    }
  };

  const handleChangePayer = async (receiptId: string, newPayerId: string) => {
    if (!session) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/sessions/${code}/receipts`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptId,
          participantId,
          updates: { paidBy: newPayerId },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        toast.success("Payer updated");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update payer");
      }
    } catch {
      toast.error("Failed to update payer");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeCurrency = async (receiptId: string, newCurrency: string) => {
    if (!session) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/sessions/${code}/receipts`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptId,
          participantId,
          updates: { currency: newCurrency },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        toast.success("Currency updated");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update currency");
      }
    } catch {
      toast.error("Failed to update currency");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-md mx-auto px-6 py-16">
          <h1 className="text-lg font-medium mb-3">Session not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-6 py-16">
        {/* Header */}
        <header className="mb-8">
          <Link
            href={`/session/${code}`}
            className="inline-flex items-center text-neutral-400 hover:text-neutral-600 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
          <h1 className="text-lg font-medium">Edit receipts</h1>
          <p className="text-neutral-500">{session.receipts.length} receipts</p>
        </header>

        {/* Receipts */}
        {session.receipts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-400 mb-4">No receipts yet</p>
            <Link href={`/session/${code}/upload`}>
              <Button className="h-11 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-normal">
                <Plus className="w-4 h-4 mr-2" />
                Add receipt
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {session.receipts.map((receipt) => (
              <ReceiptCard
                key={receipt.id}
                receipt={receipt}
                participantId={participantId}
                session={session}
                isSaving={isSaving}
                onEditItem={(item) => openEditDialog(receipt.id, item)}
                onDeleteItem={(itemId) =>
                  setDeleteConfirm({ type: "item", receiptId: receipt.id, itemId })
                }
                onDeleteReceipt={() => setDeleteConfirm({ type: "receipt", receiptId: receipt.id })}
                onChangePayer={(newPayerId) => handleChangePayer(receipt.id, newPayerId)}
                onChangeCurrency={(newCurrency) => handleChangeCurrency(receipt.id, newCurrency)}
              />
            ))}

            <Link href={`/session/${code}/upload`} className="block">
              <Button
                variant="outline"
                className="w-full h-11 border-neutral-200 hover:bg-neutral-50 rounded-lg font-normal"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add another receipt
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit item</DialogTitle>
            <DialogDescription>Update item details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="itemName" className="text-sm text-neutral-500">
                Name
              </label>
              <Input
                id="itemName"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="h-11 border-neutral-200 rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="itemQty" className="text-sm text-neutral-500">
                  Quantity
                </label>
                <Input
                  id="itemQty"
                  type="number"
                  min="1"
                  value={editForm.quantity}
                  onChange={(e) =>
                    setEditForm({ ...editForm, quantity: Number.parseInt(e.target.value, 10) || 1 })
                  }
                  className="h-11 border-neutral-200 rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="itemPrice" className="text-sm text-neutral-500">
                  Unit price
                </label>
                <Input
                  id="itemPrice"
                  type="number"
                  step="0.01"
                  value={editForm.unitPrice}
                  onChange={(e) => setEditForm({ ...editForm, unitPrice: e.target.value })}
                  className="h-11 border-neutral-200 rounded-lg"
                />
              </div>
            </div>
            {editForm.unitPrice && editForm.quantity > 0 && (
              <p className="text-sm text-neutral-500 text-center">
                Total: {(Number.parseFloat(editForm.unitPrice) * editForm.quantity).toFixed(2)}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-11 border-neutral-200 hover:bg-neutral-50 rounded-lg font-normal"
              onClick={() => setEditingItem(null)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 h-11 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-normal"
              onClick={handleSaveItem}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Delete {deleteConfirm?.type === "receipt" ? "receipt" : "item"}?
            </DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1 h-11 border-neutral-200 hover:bg-neutral-50 rounded-lg font-normal"
              onClick={() => setDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 h-11 rounded-lg font-normal"
              onClick={deleteConfirm?.type === "receipt" ? handleDeleteReceipt : handleDeleteItem}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ReceiptCardProps {
  receipt: Receipt;
  participantId: string | null;
  session: { participants: { id: string; name: string }[] };
  isSaving: boolean;
  onEditItem: (item: ReceiptItem) => void;
  onDeleteItem: (itemId: string) => void;
  onDeleteReceipt: () => void;
  onChangePayer: (newPayerId: string) => void;
  onChangeCurrency: (newCurrency: string) => void;
}

function ReceiptCard({
  receipt,
  participantId,
  session,
  isSaving,
  onEditItem,
  onDeleteItem,
  onDeleteReceipt,
  onChangePayer,
  onChangeCurrency,
}: ReceiptCardProps) {
  const uploaderName =
    session.participants.find((p) => p.id === receipt.uploadedBy)?.name || "Unknown";
  const payerName = session.participants.find((p) => p.id === receipt.paidBy)?.name || "Unknown";
  const isUploader = receipt.uploadedBy === participantId;

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      {/* Receipt header */}
      <div className="p-4 bg-neutral-50 space-y-3">
        {/* Name & establishment */}
        {(receipt.name || receipt.establishment) && (
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-neutral-400" />
            <span className="font-medium">{receipt.name || receipt.establishment}</span>
          </div>
        )}

        {/* Note */}
        {receipt.note && <p className="text-sm text-neutral-500 italic">"{receipt.note}"</p>}

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{formatCurrency(receipt.total, receipt.currency)}</p>
            <p className="text-sm text-neutral-500">
              uploaded by {uploaderName} · {receipt.items.length} items
            </p>
          </div>
          {isUploader && (
            <button
              type="button"
              onClick={onDeleteReceipt}
              className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete receipt"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Payer & Currency selectors */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-neutral-400" />
            <span className="text-sm text-neutral-500">Paid by:</span>
            {isUploader ? (
              <Select value={receipt.paidBy} onValueChange={onChangePayer} disabled={isSaving}>
                <SelectTrigger className="h-8 w-auto min-w-[100px] border-neutral-200 rounded-lg text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {session.participants.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm font-medium">{payerName}</span>
            )}
          </div>

          {isUploader && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-500">Currency:</span>
              <Select value={receipt.currency} onValueChange={onChangeCurrency} disabled={isSaving}>
                <SelectTrigger className="h-8 w-auto min-w-[80px] border-neutral-200 rounded-lg text-sm">
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
          )}
        </div>
      </div>

      {/* Items */}
      <div className="divide-y divide-neutral-100">
        {receipt.items.map((item) => (
          <div key={item.id} className="p-4 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="truncate">{item.name}</p>
              <p className="text-sm text-neutral-500">
                {item.quantity > 1 && `${item.quantity} × `}
                {formatCurrency(item.unitPrice, receipt.currency)}
                {item.quantity > 1 && ` = ${formatCurrency(item.totalPrice, receipt.currency)}`}
              </p>
            </div>
            {isUploader && (
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onEditItem(item)}
                  className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                  title="Edit item"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteItem(item.id)}
                  className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete item"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Receipt footer with tax/tip */}
      {(receipt.tax > 0 || receipt.tip > 0) && (
        <div className="p-4 bg-neutral-50 text-sm text-neutral-500 space-y-1">
          {receipt.tax > 0 && (
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{formatCurrency(receipt.tax, receipt.currency)}</span>
            </div>
          )}
          {receipt.tip > 0 && (
            <div className="flex justify-between">
              <span>Tip</span>
              <span>{formatCurrency(receipt.tip, receipt.currency)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
