"use client";

import { Bot, Calculator, Code2, Github, Loader2, Receipt, Users, Zap } from "lucide-react";
import Link from "next/link";
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
      <div className="container max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">🍽️ WhoAte</h1>
          <p className="text-lg text-muted-foreground mb-2">
            The smartest way to split bills
          </p>
          <p className="text-sm text-muted-foreground">
            Snap a receipt, claim your items, see who owes whom
          </p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-4 gap-2 mb-8">
          <div className="text-center p-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Receipt className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">1. Snap</p>
          </div>
          <div className="text-center p-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">2. AI Magic</p>
          </div>
          <div className="text-center p-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">3. Swipe</p>
          </div>
          <div className="text-center p-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Calculator className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">4. Done!</p>
          </div>
        </div>

        {/* Main Card */}
        <Card className="mb-6">
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

        {/* Features highlight */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="font-medium text-sm">AI-Powered</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Extracts items from any receipt in 100+ languages
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-sm">No Sign-up</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Just share a code with friends
            </p>
          </div>
        </div>

        {/* Developer section */}
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Code2 className="w-4 h-4" />
              <span className="font-medium text-sm">For Developers</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="https://github.com/CroissanStudioDev/whoate/blob/main/docs/API.md"
                target="_blank"
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Code2 className="w-3 h-3" />
                REST API Docs
              </Link>
              <Link
                href="https://github.com/CroissanStudioDev/whoate/blob/main/skills/whoate.md"
                target="_blank"
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Bot className="w-3 h-3" />
                Claude Code Skill
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center space-y-3">
          <Link
            href="https://github.com/CroissanStudioDev/whoate"
            target="_blank"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="w-4 h-4" />
            Open Source on GitHub
          </Link>
          <p className="text-xs text-muted-foreground">
            Sessions expire in 30 days • Built by{" "}
            <Link
              href="https://croissanstudio.ru"
              target="_blank"
              className="underline hover:text-foreground"
            >
              CroissanStudio
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
