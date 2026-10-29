import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ScanLine, Camera, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

type Result =
  | { kind: "ok"; meal: string; receiver: string; date: string }
  | { kind: "already" }
  | { kind: "invalid" }
  | { kind: "error"; msg: string };

export default function ScanMeal() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const start = async () => {
    if (!videoRef.current) return;
    setResult(null);
    const reader = new BrowserMultiFormatReader();
    try {
      const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, async (res) => {
        if (!res) return;
        const token = res.getText();
        if (processing) return;
        setProcessing(true);
        await handleToken(token);
        setProcessing(false);
      });
      controlsRef.current = controls;
      setScanning(true);
    } catch (error) {
      toast.error("دسترسی به دوربین ممکن نشد: " + (error instanceof Error ? error.message : "خطای ناشناخته"));
    }
  };

  const stop = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(false);
  };

  useEffect(() => () => stop(), []);

  const handleToken = async (token: string) => {
    try {
      const data = await api<{ meal: string; receiver: string; date: string }>("/api/meal-transfers/consume", {
        method: "POST",
        body: JSON.stringify({ qrToken: token }),
      });
      setResult({ kind: "ok", ...data });
      toast.success("غذا تحویل داده شد ✅");
    } catch (error) {
      const message = error instanceof Error ? error.message : "خطای ناشناخته";
      if (message.includes("already been consumed")) return setResult({ kind: "already" });
      if (message.includes("QR token is invalid")) return setResult({ kind: "invalid" });
      setResult({ kind: "error", msg: message });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ScanLine className="h-6 w-6 text-primary" /> اسکن QR در سلف
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          QR انتقال غذا را اسکن کنید تا وضعیت روی «تحویل‌شده» تنظیم شود.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Camera className="h-4 w-4" />دوربین</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="aspect-square w-full bg-black rounded-lg overflow-hidden relative">
            <video ref={videoRef} className="w-full h-full object-cover" />
            {!scanning && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-muted">
                دوربین خاموش است
              </div>
            )}
            {processing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
          </div>
          {!scanning ? (
            <Button onClick={start} className="w-full gap-1"><Camera className="h-4 w-4" />شروع اسکن</Button>
          ) : (
            <Button onClick={stop} variant="outline" className="w-full">توقف</Button>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card className={
          result.kind === "ok" ? "border-green-500/40 bg-green-50/40 dark:bg-green-950/20"
          : result.kind === "already" ? "border-amber-500/40 bg-amber-50/40 dark:bg-amber-950/20"
          : "border-destructive/40 bg-destructive/5"
        }>
          <CardContent className="py-4 space-y-2">
            {result.kind === "ok" && (
              <>
                <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/40">
                  <CheckCircle2 className="h-3 w-3 ml-1" />تحویل شد
                </Badge>
                <p className="font-medium">{result.meal}</p>
                <p className="text-sm text-muted-foreground">گیرنده: {result.receiver}</p>
                <p className="text-xs text-muted-foreground">تاریخ: {result.date}</p>
              </>
            )}
            {result.kind === "already" && (
              <p className="text-sm flex items-center gap-2"><XCircle className="h-4 w-4 text-amber-600" />این QR قبلاً مصرف شده است</p>
            )}
            {result.kind === "invalid" && (
              <p className="text-sm flex items-center gap-2"><XCircle className="h-4 w-4 text-destructive" />QR نامعتبر</p>
            )}
            {result.kind === "error" && (
              <p className="text-sm flex items-center gap-2"><XCircle className="h-4 w-4 text-destructive" />{result.msg}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
