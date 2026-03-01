"use client";

import { ArrowLeft, Copy, Loader2, RefreshCw, Share2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/lib/store";
import type { DebtSummary, Participant, Session } from "@/types";
import { CURRENCY_SYMBOLS } from "@/types";

export default function SummaryPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const { setSession } = useSessionStore();

  const [isLoading, setIsLoading] = useState(true);
  const [summaries, setSummaries] = useState<DebtSummary[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [textSummary, setTextSummary] = useState("");
  const [hasClaims, setHasClaims] = useState(false);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const sessionRes = await fetch(`/api/sessions/${code}`);
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        setSession(sessionData.session);
        // Check if any items have claims
        const session = sessionData.session as Session;
        const anyClaims = session.receipts.some((r) => r.items.some((i) => i.claims.length > 0));
        setHasClaims(anyClaims);
      }

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

  const getName = (id: string) => participants.find((p) => p.id === id)?.name || "Unknown";

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(textSummary);
    toast.success("Copied to clipboard!");
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "WhoAte - Bill Split",
          text: textSummary,
        });
      } catch {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  const hasDebts = summaries.length > 0 && summaries.some((s) => s.debts.length > 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-6 py-16">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <Link
              href={`/session/${code}`}
              className="inline-flex items-center text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
            <button
              type="button"
              onClick={fetchSummary}
              className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <h1 className="text-lg font-medium mb-3">Who owes what</h1>
          <p className="text-neutral-500">Session {code}</p>
        </header>

        {hasDebts ? (
          <div className="space-y-8">
            {summaries.map((summary) => (
              <div key={summary.currency} className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <span>{summary.currency}</span>
                  {summary.optimized && <span>· optimized</span>}
                </div>

                {summary.debts.length === 0 ? (
                  <p className="text-neutral-400 text-center py-4">
                    All settled in {summary.currency}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {summary.debts.map((debt) => (
                      <div
                        key={`${debt.from}-${debt.to}`}
                        className="flex items-center justify-between p-4 rounded-lg border border-neutral-200"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{getName(debt.from)}</span>
                          <span className="text-neutral-400">→</span>
                          <span className="font-medium">{getName(debt.to)}</span>
                        </div>
                        <span className="font-mono text-lg">
                          {CURRENCY_SYMBOLS[summary.currency] || ""}
                          {debt.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Share buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1 h-11 border-neutral-200 hover:bg-neutral-50 rounded-lg font-normal"
                onClick={copyToClipboard}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-11 border-neutral-200 hover:bg-neutral-50 rounded-lg font-normal"
                onClick={share}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        ) : hasClaims ? (
          <div className="text-center py-12">
            <p className="text-2xl mb-2">All settled!</p>
            <p className="text-neutral-500 mb-4">
              Everyone who claimed items has already paid their share.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push(`/session/${code}/select`)}
              className="h-11 border-neutral-200 hover:bg-neutral-50 rounded-lg font-normal"
            >
              Select more items
            </Button>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-neutral-500 mb-4">
              No items claimed yet. Ask everyone to select their items first.
            </p>
            <Button
              onClick={() => router.push(`/session/${code}/select`)}
              className="h-11 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-normal"
            >
              Select items
            </Button>
          </div>
        )}

        {/* Back button */}
        <div className="mt-12">
          <Button
            variant="outline"
            className="w-full h-11 border-neutral-200 hover:bg-neutral-50 rounded-lg font-normal"
            onClick={() => router.push(`/session/${code}`)}
          >
            Back to session
          </Button>
        </div>
      </div>
    </div>
  );
}
