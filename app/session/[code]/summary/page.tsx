"use client";

import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DebtMatrix } from "@/components/session/DebtMatrix";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSessionStore } from "@/lib/store";
import type { DebtSummary, Participant } from "@/types";

export default function SummaryPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const { setSession } = useSessionStore();

  const [isLoading, setIsLoading] = useState(true);
  const [summaries, setSummaries] = useState<DebtSummary[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [textSummary, setTextSummary] = useState("");

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch session first
      const sessionRes = await fetch(`/api/sessions/${code}`);
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        setSession(sessionData.session);
      }

      // Fetch summary
      const res = await fetch(`/api/sessions/${code}/summary`);
      if (res.ok) {
        const data = await res.json();
        setSummaries(data.summaries);
        setParticipants(data.participants);
        setTextSummary(data.textSummary);
      }
    } finally {
      setIsLoading(false);
    }
  }, [code, setSession]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/session/${code}`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Who Owes What</h1>
            <p className="text-sm text-muted-foreground">Session {code}</p>
          </div>
          <Button variant="outline" size="icon" onClick={fetchSummary}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Debt Matrix */}
        {summaries.length > 0 ? (
          <DebtMatrix summaries={summaries} participants={participants} textSummary={textSummary} />
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">
                No items have been claimed yet. Ask everyone to select their items first.
              </p>
              <Button onClick={() => router.push(`/session/${code}/select`)}>Select Items</Button>
            </CardContent>
          </Card>
        )}

        {/* Back to session */}
        <div className="mt-8">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push(`/session/${code}`)}
          >
            Back to Session
          </Button>
        </div>
      </div>
    </div>
  );
}
