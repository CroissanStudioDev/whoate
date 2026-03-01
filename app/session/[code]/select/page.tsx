"use client";

import { ArrowLeft, Check, Loader2, SkipForward, Undo2, UserPlus, X } from "lucide-react";
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

type ActionType = "notMine" | "skip" | "claim";

interface HistoryEntry {
  itemId: string;
  receiptId: string;
  action: ActionType;
  previousIndex: number;
}

export default function SelectPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const { participantId } = useUserStore();
  const { session, setSession } = useSessionStore();

  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showSharedDialog, setShowSharedDialog] = useState(false);
  const [showQuantityDialog, setShowQuantityDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState<ReceiptItem | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [skippedItems, setSkippedItems] = useState<Set<string>>(new Set());
  const [notMineItems, setNotMineItems] = useState<Set<string>>(new Set());
  const [isReviewingSkipped, setIsReviewingSkipped] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isUndoing, setIsUndoing] = useState(false);

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

  // Get all items flattened with receipt info, excluding "not mine" items and already claimed items
  const allItems =
    session?.receipts.flatMap((r) =>
      r.items
        .filter((i) => !notMineItems.has(i.id) && i.claims.length === 0)
        .map((i) => ({ item: i, receipt: r }))
    ) || [];

  // During initial pass, skip already skipped items; during review, only show skipped
  const availableItems = isReviewingSkipped
    ? allItems.filter((x) => skippedItems.has(x.item.id))
    : allItems.filter((x) => !skippedItems.has(x.item.id));

  const currentItemData = availableItems[currentItemIndex];
  const item = currentItemData?.item;
  const receipt = currentItemData?.receipt;

  const nextItem = useCallback(() => {
    if (currentItemIndex < availableItems.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
    } else if (!isReviewingSkipped && skippedItems.size > 0) {
      // Start reviewing skipped items
      setIsReviewingSkipped(true);
      setCurrentItemIndex(0);
      toast("Now reviewing skipped items", { icon: "🔄" });
    } else {
      toast.success("All items reviewed!");
      router.push(`/session/${code}/summary`);
    }
  }, [
    currentItemIndex,
    availableItems.length,
    isReviewingSkipped,
    skippedItems.size,
    router,
    code,
  ]);

  const handleNotMine = useCallback(() => {
    if (!item || !receipt) return;
    // Record history
    setHistory((prev) => [
      ...prev,
      {
        itemId: item.id,
        receiptId: receipt.id,
        action: "notMine",
        previousIndex: currentItemIndex,
      },
    ]);
    setNotMineItems((prev) => new Set(prev).add(item.id));
    // Also remove from skipped if it was there
    setSkippedItems((prev) => {
      const next = new Set(prev);
      next.delete(item.id);
      return next;
    });
    nextItem();
  }, [item, receipt, currentItemIndex, nextItem]);

  const handleSkip = useCallback(() => {
    if (!item || !receipt) return;
    // Record history
    setHistory((prev) => [
      ...prev,
      { itemId: item.id, receiptId: receipt.id, action: "skip", previousIndex: currentItemIndex },
    ]);
    if (!isReviewingSkipped) {
      setSkippedItems((prev) => new Set(prev).add(item.id));
    }
    nextItem();
  }, [item, receipt, currentItemIndex, isReviewingSkipped, nextItem]);

  const handleUndo = useCallback(async () => {
    if (history.length === 0 || isUndoing) return;

    const lastEntry = history[history.length - 1];
    setIsUndoing(true);

    try {
      // Undo the action
      if (lastEntry.action === "notMine") {
        setNotMineItems((prev) => {
          const next = new Set(prev);
          next.delete(lastEntry.itemId);
          return next;
        });
      } else if (lastEntry.action === "skip") {
        setSkippedItems((prev) => {
          const next = new Set(prev);
          next.delete(lastEntry.itemId);
          return next;
        });
      } else if (lastEntry.action === "claim") {
        // Unclaim via API
        const res = await fetch(`/api/sessions/${code}/claim`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            receiptId: lastEntry.receiptId,
            itemId: lastEntry.itemId,
            participantId,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setSession(data.session);
        }
      }

      // Remove from history
      setHistory((prev) => prev.slice(0, -1));

      // Go back to previous index
      setCurrentItemIndex(lastEntry.previousIndex);

      toast("Undone", { icon: "↩️" });
    } catch {
      toast.error("Failed to undo");
    } finally {
      setIsUndoing(false);
    }
  }, [history, isUndoing, code, participantId, setSession]);

  const claimItem = useCallback(
    async (type: "individual" | "shared", sharedWith?: string[], claimedQuantity?: number) => {
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
          // Record history
          setHistory((prev) => [
            ...prev,
            {
              itemId: item.id,
              receiptId: receipt.id,
              action: "claim",
              previousIndex: currentItemIndex,
            },
          ]);
          nextItem();
        }
      } catch {
        toast.error("Failed to claim item");
      }
    },
    [participantId, item, receipt, code, setSession, currentItemIndex, nextItem]
  );

  const handleSwipeLeft = () => handleNotMine();
  const handleSwipeRight = useCallback(() => {
    if (!item) return;
    // If quantity > 1, show quantity dialog
    if (item.quantity > 1) {
      setCurrentItem(item);
      setSelectedQuantity(item.quantity); // Default to all
      setShowQuantityDialog(true);
    } else {
      claimItem("individual", undefined, 1);
    }
  }, [item, claimItem]);
  const handleSwipeUp = useCallback(() => {
    if (!item) return;
    setCurrentItem(item);
    setSelectedParticipants(session?.participants.map((p) => p.id) || []);
    setShowSharedDialog(true);
  }, [item, session?.participants]);

  // Keyboard shortcuts for faster selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs or dialogs are open
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        showSharedDialog ||
        showQuantityDialog
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
        case "n":
        case "N":
          e.preventDefault();
          handleNotMine();
          break;
        case "ArrowRight":
        case "y":
        case "Y":
        case " ": // Spacebar
          e.preventDefault();
          handleSwipeRight();
          break;
        case "ArrowUp":
        case "s":
        case "S":
          e.preventDefault();
          handleSwipeUp();
          break;
        case "ArrowDown":
        case "k":
        case "K":
          e.preventDefault();
          handleSkip();
          break;
        case "z":
        case "Z":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleUndo();
          }
          break;
        case "Backspace":
          e.preventDefault();
          handleUndo();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleNotMine,
    handleSkip,
    handleSwipeRight,
    handleSwipeUp,
    handleUndo,
    showSharedDialog,
    showQuantityDialog,
  ]);

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

  const totalItems = availableItems.length;
  const currentProgress = Math.min(currentItemIndex + 1, totalItems);

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
              <h1 className="text-lg font-medium">
                {isReviewingSkipped ? "Review skipped items" : "Select your items"}
              </h1>
              <p className="text-neutral-500">
                {currentProgress} of {totalItems}
                {!isReviewingSkipped && skippedItems.size > 0 && (
                  <span className="text-neutral-400"> · {skippedItems.size} skipped</span>
                )}
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
            <SwipeCard
              item={item}
              currency={receipt.currency}
              receiptName={receipt.name || receipt.establishment}
              receiptNote={receipt.note}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              onSwipeUp={handleSwipeUp}
            />
            {/* Action buttons */}
            <div className="flex justify-center items-center gap-3 mt-6">
              {/* Undo button */}
              <button
                type="button"
                onClick={handleUndo}
                disabled={history.length === 0 || isUndoing}
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors ${
                  history.length === 0
                    ? "border-neutral-100 text-neutral-200 cursor-not-allowed"
                    : "border-neutral-200 text-neutral-400 hover:border-neutral-400 hover:text-neutral-600"
                }`}
                title="Undo last action"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNotMine}
                className="w-12 h-12 rounded-full border-2 border-red-200 flex items-center justify-center text-red-400 hover:border-red-400 hover:text-red-500 transition-colors"
                title="Not mine"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleSkip}
                className="w-12 h-12 rounded-full border-2 border-neutral-200 flex items-center justify-center text-neutral-400 hover:border-neutral-400 hover:text-neutral-600 transition-colors"
                title="Skip for now"
              >
                <SkipForward className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleSwipeRight}
                className="w-14 h-14 rounded-full border-2 border-neutral-900 bg-neutral-900 flex items-center justify-center text-white hover:bg-neutral-800 transition-colors"
                title="Mine"
              >
                <Check className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={handleSwipeUp}
                className="w-12 h-12 rounded-full border-2 border-neutral-200 flex items-center justify-center text-neutral-400 hover:border-neutral-400 hover:text-neutral-600 transition-colors"
                title="Share with others"
              >
                <UserPlus className="w-5 h-5" />
              </button>
            </div>
            {/* Button labels with keyboard hints */}
            <div className="flex justify-center items-center gap-3 mt-2 text-xs text-neutral-400">
              <span className="w-10 text-center" title="Backspace or Ctrl+Z">
                Undo
              </span>
              <span className="w-12 text-center" title="← or N">
                Not mine
              </span>
              <span className="w-12 text-center" title="↓ or K">
                Skip
              </span>
              <span className="w-14 text-center" title="→ or Y or Space">
                Mine
              </span>
              <span className="w-12 text-center" title="↑ or S">
                Share
              </span>
            </div>
            {/* Keyboard shortcut hint */}
            <p className="text-center text-xs text-neutral-300 mt-4">
              Use arrow keys or N/Y/S/K for quick selection
            </p>
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

        {/* Quick link to My Items */}
        {myTotal > 0 && (
          <Link
            href={`/session/${code}/my-items`}
            className="block text-center text-sm text-neutral-500 hover:text-neutral-700 transition-colors py-2"
          >
            View your{" "}
            {session.receipts.reduce(
              (sum, r) =>
                sum +
                r.items.filter((i) => i.claims.some((c) => c.participantId === participantId))
                  .length,
              0
            )}{" "}
            claimed items →
          </Link>
        )}
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
