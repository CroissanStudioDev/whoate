"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserStore } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const { name, setUser } = useUserStore();
  const [userName, setUserName] = useState(name || "");
  const [joinCode, setJoinCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const createSession = async () => {
    if (!userName.trim()) {
      toast.error("Enter your name");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorName: userName.trim() }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create session");
      }

      const { session, participantId } = await res.json();
      setUser(userName.trim(), participantId);
      router.push(`/session/${session.code}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create session");
    } finally {
      setIsCreating(false);
    }
  };

  const joinSession = async () => {
    if (!userName.trim()) {
      toast.error("Enter your name");
      return;
    }

    if (!joinCode.trim()) {
      toast.error("Enter session code");
      return;
    }

    setIsJoining(true);
    try {
      const res = await fetch(`/api/sessions/${joinCode.toUpperCase()}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userName.trim() }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to join session");
      }

      const { session, participantId } = await res.json();
      setUser(userName.trim(), participantId);
      router.push(`/session/${session.code}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to join session");
    } finally {
      setIsJoining(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") {
      action();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-6 py-16">
        {/* Header */}
        <header className="mb-16">
          <h1 className="text-lg font-medium mb-3">WhoAte</h1>
          <p className="text-neutral-500 leading-relaxed">
            Split bills with friends. Snap a receipt, claim items, see who owes what.
          </p>
        </header>

        {/* Form */}
        <main className="space-y-8">
          {/* Name */}
          <div className="space-y-2">
            <label htmlFor="userName" className="text-sm text-neutral-500">
              Your name
            </label>
            <Input
              id="userName"
              placeholder="Name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, createSession)}
              className="h-11 border-neutral-200 rounded-lg focus-visible:ring-neutral-900"
            />
          </div>

          {/* Create */}
          <Button
            onClick={createSession}
            disabled={isCreating || isJoining}
            className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-normal"
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Create session
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-sm text-neutral-400">or join</span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          {/* Join */}
          <div className="space-y-3">
            <Input
              placeholder="Session code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => handleKeyDown(e, joinSession)}
              className="h-11 border-neutral-200 rounded-lg text-center font-mono tracking-widest uppercase focus-visible:ring-neutral-900"
              maxLength={6}
            />
            <Button
              variant="outline"
              onClick={joinSession}
              disabled={isCreating || isJoining}
              className="w-full h-11 border-neutral-200 hover:bg-neutral-50 rounded-lg font-normal"
            >
              {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join session"}
            </Button>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-neutral-100">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-400">
            <Link
              href="https://github.com/CroissanStudioDev/whoate"
              target="_blank"
              className="hover:text-neutral-600 transition-colors"
            >
              GitHub
            </Link>
            <Link
              href="https://github.com/CroissanStudioDev/whoate/blob/main/docs/API.md"
              target="_blank"
              className="hover:text-neutral-600 transition-colors"
            >
              API
            </Link>
            <Link
              href="https://croissanstudio.ru"
              target="_blank"
              className="hover:text-neutral-600 transition-colors"
            >
              CroissanStudio
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
