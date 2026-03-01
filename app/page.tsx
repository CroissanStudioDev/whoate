"use client";

import {
  ArrowRight,
  Calculator,
  Camera,
  Code2,
  Github,
  Globe,
  Loader2,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      toast.error(
        error instanceof Error ? error.message : "Failed to create session"
      );
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
      toast.error(
        error instanceof Error ? error.message : "Failed to join session"
      );
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/30">
      <div className="container max-w-lg mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            AI-Powered Bill Splitting
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            Split bills the
            <span className="text-gradient"> smart way</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Snap. Claim. Done. No more awkward math.
          </p>
        </div>

        {/* How it works - Visual flow */}
        <div className="relative mb-10">
          <div className="absolute top-6 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
          <div className="grid grid-cols-4 gap-2 relative">
            {[
              { icon: Camera, label: "Snap", color: "text-blue-500" },
              { icon: Zap, label: "AI Magic", color: "text-amber-500" },
              { icon: Users, label: "Claim", color: "text-emerald-500" },
              { icon: Calculator, label: "Settle", color: "text-rose-500" },
            ].map((step, i) => (
              <div key={step.label} className="text-center">
                <div
                  className={`w-12 h-12 rounded-xl bg-card border shadow-sm flex items-center justify-center mx-auto mb-2 transition-transform duration-200 hover:scale-105 ${step.color}`}
                >
                  <step.icon className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  {i + 1}. {step.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Card */}
        <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Get Started</CardTitle>
            <CardDescription>
              Create a new session or join your friends
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Name Input */}
            <div className="space-y-2">
              <label htmlFor="userName" className="text-sm font-medium">
                Your Name
              </label>
              <Input
                id="userName"
                placeholder="How should we call you?"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="h-12 text-base"
              />
            </div>

            {/* Create Session */}
            <Button
              className="w-full h-12 text-base font-semibold btn-bounce"
              onClick={createSession}
              disabled={isCreating || isJoining}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create New Session
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            <div className="relative py-2">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-sm text-muted-foreground">
                or join friends
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
                  placeholder="ABC123"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="h-12 text-center text-2xl font-mono tracking-[0.3em] uppercase"
                  maxLength={6}
                />
              </div>
              <Button
                variant="outline"
                className="w-full h-12 font-medium btn-bounce"
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

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-card rounded-xl p-4 border shadow-sm card-interactive">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <span className="font-semibold text-sm">AI-Powered</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Extracts items from any receipt in 100+ languages
            </p>
          </div>
          <div className="bg-card rounded-xl p-4 border shadow-sm card-interactive">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Globe className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="font-semibold text-sm">No Sign-up</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Just share a 6-digit code. Works instantly.
            </p>
          </div>
        </div>

        {/* Developer section */}
        <div className="bg-muted/50 rounded-xl p-4 border border-dashed mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Code2 className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-sm">For Developers</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link
              href="https://github.com/CroissanStudioDev/whoate/blob/main/docs/API.md"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Code2 className="w-3 h-3" />
              REST API
            </Link>
            <Link
              href="https://github.com/CroissanStudioDev/whoate/blob/main/skills/whoate.md"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              Claude Skill
            </Link>
            <Link
              href="https://github.com/CroissanStudioDev/whoate"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Github className="w-3 h-3" />
              Source Code
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Open source • No tracking • Sessions expire in 30 days
          </p>
          <p className="text-xs text-muted-foreground">
            Built by{" "}
            <Link
              href="https://croissanstudio.ru"
              target="_blank"
              className="font-medium hover:text-primary transition-colors"
            >
              CroissanStudio
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
