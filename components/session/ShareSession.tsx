"use client";

import { Check, Copy, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ShareSessionProps {
  code: string;
}

export function ShareSession({ code }: ShareSessionProps) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

  const sessionUrl =
    typeof window !== "undefined" ? `${window.location.origin}/session/${code}` : "";

  useEffect(() => {
    if (showQr && sessionUrl) {
      QRCode.toDataURL(sessionUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      }).then(setQrDataUrl);
    }
  }, [showQr, sessionUrl]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(sessionUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    toast.success("Code copied!");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Invite Friends</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Code */}
        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">Session Code</span>
          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 flex items-center justify-center p-3 rounded-lg bg-muted font-mono text-2xl tracking-widest cursor-pointer hover:bg-muted/80"
              onClick={copyCode}
            >
              {code}
            </button>
          </div>
        </div>

        {/* Link */}
        <div className="space-y-2">
          <label htmlFor="sessionUrl" className="text-sm text-muted-foreground">
            Or share link
          </label>
          <div className="flex gap-2">
            <Input id="sessionUrl" value={sessionUrl} readOnly className="font-mono text-sm" />
            <Button variant="outline" size="icon" onClick={copyLink}>
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* QR Code */}
        <div className="pt-2">
          <Button variant="outline" className="w-full" onClick={() => setShowQr(!showQr)}>
            <QrCode className="w-4 h-4 mr-2" />
            {showQr ? "Hide" : "Show"} QR Code
          </Button>

          {showQr && qrDataUrl && (
            <div className="mt-4 flex justify-center">
              {/* biome-ignore lint/performance/noImgElement: Using base64 data URI for QR code */}
              <img src={qrDataUrl} alt="Session QR Code" className="rounded-lg border" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
