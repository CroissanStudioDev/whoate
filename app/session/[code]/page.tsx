"use client";

import { AlertCircle, ListChecks, Loader2, PieChart, Upload } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ParticipantList } from "@/components/session/ParticipantList";
import { ShareSession } from "@/components/session/ShareSession";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useSessionStore, useUserStore } from "@/lib/store";
import type { Session } from "@/types";

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const { name, participantId, setUser } = useUserStore();
  const { session, setSession } = useSessionStore();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNameInput, setShowNameInput] = useState(false);
  const [newName, setNewName] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // Fetch session data
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/sessions/${code}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Session not found");
        }
        const data = await res.json();
        setSession(data.session);

        // Check if user needs to join
        if (participantId) {
          const isInSession = data.session.participants.some(
            (p: Session["participants"][0]) => p.id === participantId
          );
          if (!isInSession) {
            setShowNameInput(true);
          }
        } else {
          setShowNameInput(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load session");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchSession, 5000);
    return () => clearInterval(interval);
  }, [code, participantId, setSession]);

  const handleJoin = async () => {
    const nameToUse = newName.trim() || name;
    if (!nameToUse) {
      toast.error("Please enter your name");
      return;
    }

    setIsJoining(true);
    try {
      const res = await fetch(`/api/sessions/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameToUse,
          existingParticipantId: participantId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to join");
      }

      const data = await res.json();
      setUser(nameToUse, data.participantId);
      setSession(data.session);
      setShowNameInput(false);

      if (data.rejoined) {
        toast.success("Welcome back!");
      } else {
        toast.success("Joined session!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to join");
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Session Not Found</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.push("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showNameInput) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Join Session</CardTitle>
            <CardDescription>Enter your name to join session {code}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Your name"
              value={newName || name || ""}
              onChange={(e) => setNewName(e.target.value)}
              className="text-lg"
            />
            <Button className="w-full" onClick={handleJoin} disabled={isJoining}>
              {isJoining ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Session"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) return null;

  const hasReceipts = session.receipts.length > 0;
  const totalItems = session.receipts.reduce((sum, r) => sum + r.items.length, 0);
  const claimedItems = session.receipts.reduce(
    (sum, r) => sum + r.items.filter((i) => i.claims.length > 0).length,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-1">🍽️ WhoAte</h1>
          <p className="text-muted-foreground">Session {code}</p>
        </div>

        <div className="space-y-6">
          {/* Share */}
          <ShareSession code={code} />

          {/* Participants */}
          <Card>
            <CardContent className="pt-6">
              <ParticipantList
                participants={session.participants}
                currentUserId={participantId || undefined}
                creatorId={session.creatorId}
              />
            </CardContent>
          </Card>

          <Separator />

          {/* Actions */}
          <div className="grid gap-4">
            {/* Upload Receipt */}
            <Button
              size="lg"
              className="h-16 text-lg"
              onClick={() => router.push(`/session/${code}/upload`)}
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Receipt
            </Button>

            {/* Select Items */}
            {hasReceipts && (
              <Button
                size="lg"
                variant="outline"
                className="h-16 text-lg"
                onClick={() => router.push(`/session/${code}/select`)}
              >
                <ListChecks className="w-5 h-5 mr-2" />
                Select Your Items
                <span className="ml-2 text-sm text-muted-foreground">
                  ({claimedItems}/{totalItems} claimed)
                </span>
              </Button>
            )}

            {/* View Summary */}
            {hasReceipts && (
              <Button
                size="lg"
                variant="secondary"
                className="h-16 text-lg"
                onClick={() => router.push(`/session/${code}/summary`)}
              >
                <PieChart className="w-5 h-5 mr-2" />
                View Who Owes What
              </Button>
            )}
          </div>

          {/* Stats */}
          {hasReceipts && (
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold">{session.receipts.length}</p>
                    <p className="text-sm text-muted-foreground">Receipts</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{totalItems}</p>
                    <p className="text-sm text-muted-foreground">Items</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{session.participants.length}</p>
                    <p className="text-sm text-muted-foreground">People</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {!hasReceipts && (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No receipts yet. Upload one to get started!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
