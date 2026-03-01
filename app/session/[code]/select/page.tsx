"use client";

import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { SwipeCard } from "@/components/session/SwipeCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [currentItem, setCurrentItem] = useState<ReceiptItem | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  // Fetch session
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

  // Get current item
  const receipt = session?.receipts[currentReceiptIndex];
  const items = receipt?.items || [];
  const item = items[currentItemIndex];

  // Check if user already claimed this item
  const alreadyClaimed = item?.claims.some((c) => c.participantId === participantId);

  // Move to next item
  const nextItem = useCallback(() => {
    if (!session) return;

    if (currentItemIndex < items.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
    } else if (currentReceiptIndex < session.receipts.length - 1) {
      setCurrentReceiptIndex(currentReceiptIndex + 1);
      setCurrentItemIndex(0);
    } else {
      // All done
      toast.success("All items reviewed!");
      router.push(`/session/${code}/summary`);
    }
  }, [session, currentItemIndex, currentReceiptIndex, items.length, router, code]);

  // Claim item
  const claimItem = async (type: "individual" | "shared", sharedWith?: string[]) => {
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

  // Swipe handlers
  const handleSwipeLeft = () => {
    nextItem();
  };

  const handleSwipeRight = () => {
    claimItem("individual");
  };

  const handleSwipeUp = () => {
    if (!item) return;
    setCurrentItem(item);
    setSelectedParticipants(session?.participants.map((p) => p.id) || []);
    setShowSharedDialog(true);
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session || session.receipts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">No receipts to review yet.</p>
            <Button onClick={() => router.push(`/session/${code}`)}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate progress
  const totalItems = session.receipts.reduce((sum, r) => sum + r.items.length, 0);
  const currentProgress =
    session.receipts.slice(0, currentReceiptIndex).reduce((sum, r) => sum + r.items.length, 0) +
    currentItemIndex +
    1;

  // Calculate my total
  const myTotal = session.receipts.reduce((sum, r) => {
    return (
      sum +
      r.items.reduce((itemSum, i) => {
        const myClaim = i.claims.find((c) => c.participantId === participantId);
        if (!myClaim) return itemSum;
        if (myClaim.type === "individual") {
          return itemSum + i.totalPrice / i.claims.filter((c) => c.type === "individual").length;
        }
        if (myClaim.type === "shared" && myClaim.sharedWith) {
          return itemSum + i.totalPrice / myClaim.sharedWith.length;
        }
        return itemSum;
      }, 0)
    );
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/session/${code}`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Select Your Items</h1>
            <p className="text-sm text-muted-foreground">
              {currentProgress} of {totalItems} items
            </p>
          </div>
          {myTotal > 0 && receipt && (
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {formatCurrency(myTotal, receipt.currency)}
            </Badge>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-muted rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(currentProgress / totalItems) * 100}%` }}
          />
        </div>

        {/* Current item card */}
        {item && receipt ? (
          <div className="mb-8">
            {alreadyClaimed && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-center">
                <Check className="w-4 h-4 inline mr-2" />
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
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No more items to review!</p>
              <Button className="mt-4" onClick={() => router.push(`/session/${code}/summary`)}>
                View Summary
              </Button>
            </CardContent>
          </Card>
        )}

        {/* My items summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">My Items</CardTitle>
          </CardHeader>
          <CardContent>
            {session.receipts.map((r) => {
              const myItems = r.items.filter((i) =>
                i.claims.some((c) => c.participantId === participantId)
              );
              if (myItems.length === 0) return null;

              return (
                <div key={r.id} className="space-y-2">
                  {myItems.map((i) => (
                    <div key={i.id} className="flex justify-between text-sm">
                      <span>{i.name}</span>
                      <span>{formatCurrency(i.totalPrice, r.currency)}</span>
                    </div>
                  ))}
                </div>
              );
            })}
            {myTotal === 0 && (
              <p className="text-sm text-muted-foreground text-center">No items claimed yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Shared dialog */}
      <Dialog open={showSharedDialog} onOpenChange={setShowSharedDialog}>
        <DialogContent>
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
                className={`w-full p-3 rounded-lg text-left flex items-center justify-between transition-colors ${
                  selectedParticipants.includes(p.id)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                <span>{p.name}</span>
                {selectedParticipants.includes(p.id) && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowSharedDialog(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
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
