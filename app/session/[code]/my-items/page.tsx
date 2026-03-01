"use client";

import { ArrowLeft, Loader2, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import { useSessionStore, useUserStore } from "@/lib/store";
import type { Claim, Receipt, ReceiptItem } from "@/types";
import { formatCurrency } from "@/types";

interface ClaimedItemData {
  receipt: Receipt;
  item: ReceiptItem;
  claim: Claim;
}

export default function MyItemsPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const { participantId } = useUserStore();
  const { session, setSession } = useSessionStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<ClaimedItemData | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<ClaimedItemData | null>(null);

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

  // Get all items claimed by current user
  const myClaimedItems: ClaimedItemData[] = [];
  if (session && participantId) {
    for (const receipt of session.receipts) {
      for (const item of receipt.items) {
        const myClaim = item.claims.find((c) => c.participantId === participantId);
        if (myClaim) {
          myClaimedItems.push({ receipt, item, claim: myClaim });
        }
      }
    }
  }

  // Calculate total
  const myTotal = myClaimedItems.reduce((sum, { item, claim }) => {
    if (claim.type === "individual") {
      const myQty = claim.claimedQuantity || item.quantity;
      return sum + item.unitPrice * myQty;
    }
    if (claim.type === "shared" && claim.sharedWith) {
      return sum + item.totalPrice / claim.sharedWith.length;
    }
    return sum;
  }, 0);

  const handleUnclaim = async () => {
    if (!deleteConfirm || !participantId) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/sessions/${code}/claim`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptId: deleteConfirm.receipt.id,
          itemId: deleteConfirm.item.id,
          participantId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        toast.success("Item removed");
      } else {
        toast.error("Failed to remove item");
      }
    } catch {
      toast.error("Failed to remove item");
    } finally {
      setIsSaving(false);
      setDeleteConfirm(null);
    }
  };

  const handleUpdateQuantity = async () => {
    if (!editingItem || !participantId) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/sessions/${code}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptId: editingItem.receipt.id,
          itemId: editingItem.item.id,
          participantId,
          type: "individual",
          claimedQuantity: selectedQuantity,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        toast.success("Quantity updated");
      } else {
        toast.error("Failed to update");
      }
    } catch {
      toast.error("Failed to update");
    } finally {
      setIsSaving(false);
      setEditingItem(null);
    }
  };

  const openQuantityEdit = (data: ClaimedItemData) => {
    setEditingItem(data);
    setSelectedQuantity(data.claim.claimedQuantity || data.item.quantity);
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
          <Button onClick={() => router.push("/")} className="mt-4">
            Go home
          </Button>
        </div>
      </div>
    );
  }

  // Group by receipt
  const groupedByReceipt = myClaimedItems.reduce(
    (acc, data) => {
      const receiptId = data.receipt.id;
      if (!acc[receiptId]) {
        acc[receiptId] = { receipt: data.receipt, items: [] };
      }
      acc[receiptId].items.push(data);
      return acc;
    },
    {} as Record<string, { receipt: Receipt; items: ClaimedItemData[] }>
  );

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-medium">My items</h1>
              <p className="text-neutral-500">{myClaimedItems.length} items claimed</p>
            </div>
            {myTotal > 0 && session.receipts[0] && (
              <span className="font-mono text-xl">
                {formatCurrency(myTotal, session.receipts[0].currency)}
              </span>
            )}
          </div>
        </header>

        {/* Empty state */}
        {myClaimedItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-400 mb-4">You haven't claimed any items yet</p>
            <Link href={`/session/${code}/select`}>
              <Button className="h-11 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-normal">
                Select items
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.values(groupedByReceipt).map(({ receipt, items }) => (
              <div
                key={receipt.id}
                className="border border-neutral-200 rounded-lg overflow-hidden"
              >
                {/* Receipt header */}
                <div className="p-3 bg-neutral-50 border-b border-neutral-200">
                  <p className="font-medium text-sm">
                    {receipt.name || receipt.establishment || "Receipt"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {items.length} items · {receipt.currency}
                  </p>
                </div>

                {/* Items */}
                <div className="divide-y divide-neutral-100">
                  {items.map(({ item, claim, receipt: r }) => {
                    const isShared = claim.type === "shared";
                    const myQty = claim.claimedQuantity || item.quantity;
                    const showQty = item.quantity > 1;
                    const myPrice = isShared
                      ? item.totalPrice / (claim.sharedWith?.length || 1)
                      : item.unitPrice * myQty;

                    return (
                      <div key={item.id} className="p-4 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-medium">{item.name}</p>
                            {isShared && (
                              <span className="flex items-center gap-1 text-xs text-neutral-400">
                                <Users className="w-3 h-3" />
                                {claim.sharedWith?.length}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-neutral-500">
                            {isShared ? (
                              <>Split with {(claim.sharedWith?.length || 1) - 1} others</>
                            ) : showQty ? (
                              <>
                                {myQty} of {item.quantity} ·{" "}
                                {formatCurrency(item.unitPrice, r.currency)} each
                              </>
                            ) : (
                              formatCurrency(item.unitPrice, r.currency)
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono">{formatCurrency(myPrice, r.currency)}</span>

                          {/* Edit quantity button (only for individual claims with qty > 1) */}
                          {!isShared && item.quantity > 1 && (
                            <button
                              type="button"
                              onClick={() => openQuantityEdit({ receipt: r, item, claim })}
                              className="px-2 py-1 text-xs text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
                            >
                              {myQty}/{item.quantity}
                            </button>
                          )}

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm({ receipt: r, item, claim })}
                            className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Actions */}
            <div className="space-y-3 pt-4">
              <Link href={`/session/${code}/select`} className="block">
                <Button
                  variant="outline"
                  className="w-full h-11 border-neutral-200 hover:bg-neutral-50 rounded-lg font-normal"
                >
                  Claim more items
                </Button>
              </Link>
              <Link href={`/session/${code}/summary`} className="block">
                <Button className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-normal">
                  View who owes what
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Quantity edit dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingItem?.item.name} ({editingItem?.item.quantity}x)
            </DialogTitle>
            <DialogDescription>How many are yours?</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 py-4">
            {editingItem &&
              Array.from({ length: editingItem.item.quantity }, (_, i) => i + 1).map((qty) => (
                <button
                  type="button"
                  key={qty}
                  onClick={() => setSelectedQuantity(qty)}
                  className={`flex-1 p-4 rounded-lg text-center font-mono text-lg transition-colors border ${
                    selectedQuantity === qty
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  {qty}
                </button>
              ))}
          </div>
          {editingItem && (
            <p className="text-center text-sm text-neutral-500">
              {formatCurrency(
                editingItem.item.unitPrice * selectedQuantity,
                editingItem.receipt.currency
              )}{" "}
              of {formatCurrency(editingItem.item.totalPrice, editingItem.receipt.currency)}
            </p>
          )}
          <div className="flex gap-3 mt-2">
            <Button
              variant="outline"
              className="flex-1 h-11 border-neutral-200 hover:bg-neutral-50 rounded-lg font-normal"
              onClick={() => setEditingItem(null)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 h-11 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-normal"
              onClick={handleUpdateQuantity}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                `Save (${selectedQuantity})`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove "{deleteConfirm?.item.name}"?</DialogTitle>
            <DialogDescription>This will remove your claim on this item.</DialogDescription>
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
              onClick={handleUnclaim}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remove"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
