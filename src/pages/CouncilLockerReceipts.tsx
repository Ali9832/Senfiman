import { useEffect, useState } from "react";
import { SUPABASE_CONFIGURED, supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Receipt, Check, X, Eye, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { DEMO_MODE } from "@/lib/api";

type Row = {
  id: string;
  user_id: string;
  locker_number: string;
  building: string;
  plan: string;
  price: number;
  status: string;
  receipt_path: string | null;
  priority_tier: "host" | "guest" | null;
  reviewer_note: string | null;
  created_at: string;
};

export default function CouncilLockerReceipts() {
  const integrationAvailable = !DEMO_MODE && SUPABASE_CONFIGURED;
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<string>("pending_approval");
  const [open, setOpen] = useState<Row | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!integrationAvailable) {
      setRows([]);
      return;
    }
    let q = supabase.from("locker_reservations").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter as any);
    const { data, error } = await q;
    if (error) return toast.error(error.message);
    setRows((data ?? []) as Row[]);
  };

  useEffect(() => { load(); }, [filter, integrationAvailable]);

  const openRow = async (r: Row) => {
    setOpen(r); setNote(r.reviewer_note ?? ""); setImageUrl(null);
    if (r.receipt_path && integrationAvailable) {
      const { data } = await supabase.storage.from("locker-receipts").createSignedUrl(r.receipt_path, 300);
      setImageUrl(data?.signedUrl ?? null);
    }
  };

  const decide = async (status: "approved" | "rejected") => {
    if (!open) return;
    if (!integrationAvailable) return toast.info("بررسی رسید واقعی در نسخه نمایشی غیرفعال است");
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    const patch: any = {
      status,
      reviewer_note: note || null,
      reviewer_id: user?.id ?? null,
    };
    if (status === "approved") {
      patch.starts_at = new Date().toISOString().slice(0, 10);
    }
    const { error } = await supabase.from("locker_reservations").update(patch).eq("id", open.id);
    if (!error && status === "rejected" && note.toLowerCase().includes("جعلی")) {
      await supabase.from("locker_bans").insert({
        user_id: open.user_id,
        reason: note,
        banned_until: new Date(Date.now() + 14 * 86400000).toISOString(),
      });
    }
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(status === "approved" ? "تأیید شد" : "رد شد");
    setOpen(null); load();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Receipt className="h-6 w-6 text-primary" />بررسی رسیدهای کمد
        </h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending_approval">در انتظار بررسی</SelectItem>
            <SelectItem value="approved">تأیید شده</SelectItem>
            <SelectItem value="rejected">رد شده</SelectItem>
            <SelectItem value="all">همه</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {rows.length === 0 && (
        <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">موردی پیدا نشد</CardContent></Card>
      )}

      <div className="space-y-2">
        {rows.map((r) => (
          <Card key={r.id}>
            <CardContent className="py-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm">
                <p className="font-medium">کمد {r.locker_number} — {r.building}</p>
                <p className="text-xs text-muted-foreground">
                  پلن {r.plan} • {r.price.toLocaleString("fa-IR")} تومان
                </p>
              </div>
              <div className="flex gap-1 items-center">
                {r.priority_tier && (
                  <Badge variant={r.priority_tier === "host" ? "default" : "secondary"}>
                    {r.priority_tier === "host" ? "میزبان" : "مهمان"}
                  </Badge>
                )}
                <Badge variant="outline">{r.status}</Badge>
                <Button size="sm" variant="ghost" onClick={() => openRow(r)} className="gap-1">
                  <Eye className="h-4 w-4" />بررسی
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle>بررسی رسید</DialogTitle></DialogHeader>
          {open && (
            <div className="space-y-3">
              <p className="text-sm">کمد <b>{open.locker_number}</b> — {open.building}</p>
              <p className="text-sm">مبلغ: {open.price.toLocaleString("fa-IR")} تومان</p>
              {imageUrl ? (
                <a href={imageUrl} target="_blank" rel="noreferrer">
                  <img src={imageUrl} alt="رسید" className="w-full max-h-80 object-contain rounded-lg border" />
                </a>
              ) : (
                <p className="text-xs text-muted-foreground">رسیدی آپلود نشده</p>
              )}
              <Textarea
                placeholder="یادداشت بازبینی (در صورت تشخیص جعل کلمه «جعلی» را بنویسید تا ۲ هفته بن خودکار اعمال شود)"
                value={note} onChange={(e) => setNote(e.target.value)} rows={3}
              />
              <div className="flex gap-2">
                <Button onClick={() => decide("approved")} disabled={busy} className="flex-1 gap-1">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}تأیید
                </Button>
                <Button onClick={() => decide("rejected")} disabled={busy} variant="destructive" className="flex-1 gap-1">
                  <X className="h-4 w-4" />رد
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
