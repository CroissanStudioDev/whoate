"use client";

import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DebtSummary, Participant } from "@/types";
import { CURRENCY_SYMBOLS } from "@/types";

interface DebtMatrixProps {
  summaries: DebtSummary[];
  participants: Participant[];
  textSummary: string;
}

export function DebtMatrix({ summaries, participants, textSummary }: DebtMatrixProps) {
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
        // User cancelled or share failed
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  if (summaries.length === 0 || summaries.every((s) => s.debts.length === 0)) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">No debts to settle! Everyone is even.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {summaries.map((summary) => (
        <Card key={summary.currency}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              {CURRENCY_SYMBOLS[summary.currency] || summary.currency}
              <span className="text-muted-foreground font-normal">{summary.currency}</span>
              {summary.optimized && (
                <Badge variant="secondary" className="ml-2">
                  ✨ Optimized
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.debts.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                All settled in {summary.currency}!
              </p>
            ) : (
              <div className="space-y-3">
                {summary.debts.map((debt) => (
                  <div
                    key={`${debt.from}-${debt.to}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{getName(debt.from)}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">{getName(debt.to)}</span>
                    </div>
                    <span className="font-bold text-lg">
                      {CURRENCY_SYMBOLS[summary.currency] || ""}
                      {debt.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Share buttons */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={copyToClipboard}>
          <Copy className="w-4 h-4 mr-2" />
          Copy as text
        </Button>
        <Button variant="outline" className="flex-1" onClick={share}>
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </div>
    </div>
  );
}
