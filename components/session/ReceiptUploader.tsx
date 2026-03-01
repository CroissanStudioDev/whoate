"use client";

import { AlertCircle, Camera, Loader2, Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ReceiptUploaderProps {
  onUpload: (base64: string) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

export function ReceiptUploader({ onUpload, isLoading, error }: ReceiptUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        setPreview(base64);
        await onUpload(base64);
      };
      reader.readAsDataURL(file);
    },
    [onUpload]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files?.[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile]
  );

  return (
    <Card
      className={`transition-colors ${
        dragActive ? "border-primary bg-primary/5" : ""
      } ${isLoading ? "opacity-75" : ""}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <CardContent className="pt-6">
        {preview ? (
          <div className="space-y-4">
            {/* biome-ignore lint/performance/noImgElement: Using base64 data URI for preview */}
            <img
              src={preview}
              alt="Receipt preview"
              className="max-h-64 mx-auto rounded-lg object-contain"
            />
            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing receipt with AI...</span>
              </div>
            )}
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center py-12 cursor-pointer">
            <input
              type="file"
              className="hidden"
              accept="image/*,.pdf"
              onChange={handleChange}
              disabled={isLoading}
            />
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-muted">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium">Drop receipt here or click to upload</p>
                <p className="text-sm text-muted-foreground mt-1">Supports JPEG, PNG, HEIC, PDF</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={isLoading}>
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
              </div>
            </div>
          </label>
        )}

        {error && (
          <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Tips */}
        {!preview && (
          <div className="mt-6 p-4 rounded-lg bg-muted/50">
            <p className="text-sm font-medium mb-2">📸 Tips for best results:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Make sure the receipt is flat and well-lit</li>
              <li>• Include all items and the total</li>
              <li>• Avoid shadows and glare</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
