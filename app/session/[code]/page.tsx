"use client";

import { ArrowRight, Loader2, Pencil } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [copied, setCopied] = useState(false);

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

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-md mx-auto px-6 py-16">
          <header className="mb-12">
            <h1 className="text-lg font-medium mb-3">Session not found</h1>
            <p className="text-neutral-500">{error}</p>
          </header>
          <Button
            onClick={() => router.push("/")}
            className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-normal"
          >
            Go home
          </Button>
        </div>
      </div>
    );
  }

  if (showNameInput) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-md mx-auto px-6 py-16">
          <header className="mb-12">
            <h1 className="text-lg font-medium mb-3">Join session</h1>
            <p className="text-neutral-500">Enter your name to join {code}</p>
          </header>

          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="joinName" className="text-sm text-neutral-500">
                Your name
              </label>
              <Input
                id="joinName"
                placeholder="Name"
                value={newName || name || ""}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                className="h-11 border-neutral-200 rounded-lg focus-visible:ring-neutral-900"
              />
            </div>

            <Button
              onClick={handleJoin}
              disabled={isJoining}
              className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-normal"
            >
              {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join session"}
            </Button>
          </div>
        </div>
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
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-6 py-16">
        {/* Header */}
        <header className="mb-12">
          <Link
            href="/"
            className="text-lg font-medium mb-3 block hover:text-neutral-600 transition-colors"
          >
            WhoAte
          </Link>
          <p className="text-neutral-500">Session {code}</p>
        </header>

        <div className="space-y-8">
          {/* Share code */}
          <div className="space-y-2">
            <span className="text-sm text-neutral-500 block">Share this code with friends</span>
            <button
              type="button"
              onClick={copyCode}
              className="w-full p-4 rounded-lg border border-neutral-200 font-mono text-2xl tracking-widest text-center hover:bg-neutral-50 transition-colors"
            >
              {copied ? "Copied!" : code}
            </button>
          </div>

          {/* Participants */}
          <div className="space-y-3">
            <span className="text-sm text-neutral-500 block">
              Participants ({session.participants.length})
            </span>
            <div className="space-y-2">
              {session.participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-neutral-200"
                >
                  <span className="font-medium">
                    {p.name}
                    {p.id === participantId && (
                      <span className="text-neutral-400 font-normal"> (you)</span>
                    )}
                  </span>
                  <span className="text-sm text-neutral-400">
                    {p.id === session.creatorId && "host"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          {hasReceipts && (
            <div className="grid grid-cols-3 gap-4 py-4 border-y border-neutral-100">
              <div className="text-center">
                <p className="text-2xl font-medium">{session.receipts.length}</p>
                <p className="text-sm text-neutral-400">receipts</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-medium">{totalItems}</p>
                <p className="text-sm text-neutral-400">items</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-medium">{claimedItems}</p>
                <p className="text-sm text-neutral-400">claimed</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => router.push(`/session/${code}/upload`)}
              className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-normal"
            >
              Upload receipt
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            {hasReceipts && (
              <>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/session/${code}/select`)}
                  className="w-full h-11 border-neutral-200 hover:bg-neutral-50 rounded-lg font-normal"
                >
                  Select your items
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push(`/session/${code}/summary`)}
                  className="w-full h-11 border-neutral-200 hover:bg-neutral-50 rounded-lg font-normal"
                >
                  View who owes what
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push(`/session/${code}/edit`)}
                  className="w-full h-11 border-neutral-200 hover:bg-neutral-50 rounded-lg font-normal"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit receipts
                </Button>
              </>
            )}
          </div>

          {/* Empty state */}
          {!hasReceipts && (
            <p className="text-center text-neutral-400 py-4">
              No receipts yet. Upload one to get started.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
