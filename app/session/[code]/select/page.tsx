"use client";

import { ArrowLeft, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { SwipeCard } from "@/components/session/SwipeCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSessionStore, useUserStore } from "@/lib/store";
import type { ReceiptItem } from "@/types";
import { formatCurrency } from "@/types";

export default function SelectPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const { participantId } = useUserStore();
  const { session, setSession } = useSessionStore();

  const [currentReceiptIndex, setCurrentReceiptIndex] = useState(0);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showSharedDialog, setShowSharedDialog] = useState(false);
  const [showQuantityDialog, setShowQuantityDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState<ReceiptItem | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

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

  const receipt = session?.receipts[currentReceiptIndex];
  const items = receipt?.items || [];
  const item = items[currentItemIndex];

  const alreadyClaimed = item?.claims.some((c) => c.participantId === participantId);

  const nextItem = useCallback(() => {
    if (!session) return;

    if (currentItemIndex < items.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
    } else if (currentReceiptIndex < session.receipts.length - 1) {
      setCurrentReceiptIndex(currentReceiptIndex + 1);
      setCurrentItemIndex(0);
    } else {
      toast.success("All items reviewed!");
      router.push(`/session/${code}/summary`);
    }
  }, [session, currentItemIndex, currentReceiptIndex, items.length, router, code]);

  const claimItem = async (
    type: "individual" | "shared",
    sharedWith?: string[],
    claimedQuantity?: number
  ) => {
    if (!participantId || !item || !receipt) return;

    try {
      const res = await fetch(`/api/sessions/${code}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptId: receipt.id,
          itemId: item.id,
          participantId,
          type,
          sharedWith,
          claimedQuantity: claimedQuantity || item.quantity,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        nextItem();
      }
    } catch {
      toast.error("Failed to claim item");
    }
  };

  const handleSwipeLeft = () => nextItem();
  const handleSwipeRight = () => {
    if (!item) return;
    // If quantity > 1, show quantity dialog
    if (item.quantity > 1) {
      setCurrentItem(item);
      setSelectedQuantity(item.quantity); // Default to all
      setShowQuantityDialog(true);
    } else {
      claimItem("individual", undefined, 1);
    }
  };
  const handleSwipeUp = () => {
    if (!item) return;
    setCurrentItem(item);
    setSelectedParticipants(session?.participants.map((p) => p.id) || []);
    setShowSharedDialog(true);
  };

  const handleQuantityConfirm = () => {
    claimItem("individual", undefined, selectedQuantity);
    setShowQuantityDialog(false);
  };

  const handleShareConfirm = () => {
    claimItem("shared", selectedParticipants);
    setShowSharedDialog(false);
  };

  const toggleParticipant = (id: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!session || session.receipts.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-md mx-auto px-6 py-16">
          <header className="mb-12">
            <h1 className="text-lg font-medium mb-3">No receipts yet</h1>
            <p className="text-neutral-500">Upload a receipt first to select items.</p>
          </header>
          <Button
            onClick={() => router.push(`/session/${code}`)}
            className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-normal"
          >
            Go back
          </Button>
        </div>
      </div>
    );
  }

  const totalItems = session.receipts.reduce((sum, r) => sum + r.items.length, 0);
  const currentProgress =
    session.receipts.slice(0, currentReceiptIndex).reduce((sum, r) => sum + r.items.length, 0) +
    currentItemIndex +
    1;

  const myTotal = session.receipts.reduce((sum, r) => {
    return (
      sum +
      r.items.reduce((itemSum, i) => {
        const myClaim = i.claims.find((c) => c.participantId === participantId);
        if (!myClaim) return itemSum;
        if (myClaim.type === "individual") {
          // Calculate based on claimed quantity
          const totalClaimedQty = i.claims
            .filter((c) => c.type === "individual")
            .reduce((q, c) => q + (c.claimedQuantity || i.quantity), 0);
          const myQty = myClaim.claimedQuantity || i.quantity;
          return itemSum + (myQty / Math.max(totalClaimedQty, i.quantity)) * i.totalPrice;
        }
        if (myClaim.type === "shared" && myClaim.sharedWith) {
          return itemSum + i.totalPrice / myClaim.sharedWith.length;
        }
        return itemSum;
      }, 0)
    );
  }, 0);

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
              <h1 className="text-lg font-medium">Select your items</h1>
              <p className="text-neutral-500">
                {currentProgress} of {totalItems}
              </p>
            </div>
            {myTotal > 0 && receipt && (
              <span className="font-mono text-lg">{formatCurrency(myTotal, receipt.currency)}</span>
            )}
          </div>
        </header>

        {/* Progress bar */}
        <div className="w-full h-1 bg-neutral-100 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-neutral-900 transition-all duration-300"
            style={{ width: `${(currentProgress / totalItems) * 100}%` }}
          />
        </div>

        {/* Current item */}
        {item && receipt ? (
          <div className="mb-8">
            {alreadyClaimed && (
              <div className="mb-4 p-3 rounded-lg border border-neutral-200 text-center text-sm text-neutral-500">
                You already claimed this item
              </div>
            )}
            <SwipeCard
              item={item}
              currency={receipt.currency}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              onSwipeUp={handleSwipeUp}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-neutral-500 mb-4">No more items to review</p>
            <Button
              onClick={() => router.push(`/session/${code}/summary`)}
              className="h-11 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-normal"
            >
              View summary
            </Button>
          </div>
        )}

        {/* My claimed items */}
        <div className="space-y-3">
          <span className="text-sm text-neutral-500 block">Your items</span>
          {session.receipts.map((r) => {
            const myItems = r.items.filter((i) =>
              i.claims.some((c) => c.participantId === participantId)
            );
            if (myItems.length === 0) return null;

            return (
              <div key={r.id} className="space-y-2">
                {myItems.map((i) => {
                  const myClaim = i.claims.find((c) => c.participantId === participantId);
                  const myQty = myClaim?.claimedQuantity || i.quantity;
                  const showQty = i.quantity > 1;
                  const myPrice = showQty ? i.unitPrice * myQty : i.totalPrice;
                  return (
                    <div
                      key={i.id}
                      className="flex justify-between p-3 rounded-lg border border-neutral-200"
                    >
                      <span>
                        {i.name}
                        {showQty && (
                          <span className="text-neutral-400 ml-1">
                            ({myQty} of {i.quantity})
                          </span>
                        )}
                      </span>
                      <span className="font-mono">{formatCurrency(myPrice, r.currency)}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
          {myTotal === 0 && (
            <p className="text-center text-neutral-400 py-4">No items claimed yet</p>
          )}
        </div>
      </div>

      {/* Quantity dialog */}
      <Dialog open={showQuantityDialog} onOpenChange={setShowQuantityDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {currentItem?.name} ({currentItem?.quantity}x)
            </DialogTitle>
            <DialogDescription>How many are yours?</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 py-4">
            {currentItem &&
              Array.from({ length: currentItem.quantity }, (_, i) => i + 1).map((qty) => (
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
          {currentItem && receipt && (
            <p className="text-center text-sm text-neutral-500">
              {formatCurrency(currentItem.unitPrice * selectedQuantity, receipt.currency)} of{" "}
              {formatCurrency(currentItem.totalPrice, receipt.currency)}
            </p>
          )}
          <div className="flex gap-3 mt-2">
            <Button
              variant="outline"
              className="flex-1 h-11 border-neutral-200 hover:bg-neutral-50 rounded-lg font-normal"
              onClick={() => setShowQuantityDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 h-11 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-normal"
              onClick={handleQuantityConfirm}
            >
              Claim {selectedQuantity}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shared dialog */}
      <Dialog open={showSharedDialog} onOpenChange={setShowSharedDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Share "{currentItem?.name}"</DialogTitle>
            <DialogDescription>Select who should split this item</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {session?.participants.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => toggleParticipant(p.id)}
                className={`w-full p-3 rounded-lg text-left flex items-center justify-between transition-colors border ${
                  selectedParticipants.includes(p.id)
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                <span>{p.name}</span>
                {selectedParticipants.includes(p.id) && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-11 border-neutral-200 hover:bg-neutral-50 rounded-lg font-normal"
              onClick={() => setShowSharedDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 h-11 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-normal"
              onClick={handleShareConfirm}
              disabled={selectedParticipants.length === 0}
            >
              Split ({selectedParticipants.length})
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
