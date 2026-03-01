"use client";

import { Calculator, Loader2, Receipt, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
      toast.error("Please enter your name");
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
      toast.error("Please enter your name");
      return;
    }

    if (!joinCode.trim()) {
      toast.error("Please enter session code");
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container max-w-lg mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">🍽️ WhoAte</h1>
          <p className="text-muted-foreground">
            Split bills fairly with friends. No math, no stress.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Receipt className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Scan receipts</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Claim items</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Calculator className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">See who owes</p>
          </div>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>Create a new session or join an existing one</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name Input */}
            <div className="space-y-2">
              <label htmlFor="userName" className="text-sm font-medium">
                Your Name
              </label>
              <Input
                id="userName"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="text-lg"
              />
            </div>

            {/* Create Session */}
            <Button
              className="w-full h-12 text-lg"
              onClick={createSession}
              disabled={isCreating || isJoining}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create New Session"
              )}
            </Button>

            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-sm text-muted-foreground">
                or
              </span>
            </div>

            {/* Join Session */}
            <div className="space-y-3">
              <div className="space-y-2">
                <label htmlFor="sessionCode" className="text-sm font-medium">
                  Session Code
                </label>
                <Input
                  id="sessionCode"
                  placeholder="Enter 6-digit code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="text-center text-2xl font-mono tracking-widest"
                  maxLength={6}
                />
              </div>
              <Button
                variant="outline"
                className="w-full h-12"
                onClick={joinSession}
                disabled={isCreating || isJoining}
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Session"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Open source • No sign-up required • Sessions expire in 30 days
        </p>
      </div>
    </div>
  );
}
