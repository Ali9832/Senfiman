import { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, Inbox, QrCode, Check, X } from "lucide-react";
import { useTransferPolling } from "@/hooks/useTransferPolling";

type Transfer = {
  id: string;
  sender_id: string;
  receiver_id: string | null;
  receiver_student_code: string;
  receiver_last_name: string;
  meal_date: string;
  meal_kind: "lunch" | "dinner";
  meal_name: string | null;
  transfer_type: "send" | "request";
  status: "pending" | "approved" | "rejected" | "consumed" | "expired";
  qr_token: string | null;
  created_at: string;
};

export default function MealTransfer() {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [form, setForm] = useState({
    receiver_student_code: "",
    receiver_last_name: "",
    meal_date: new Date().toISOString().slice(0, 10),
    meal_kind: "lunch" as "lunch" | "dinner",
    meal_name: "",
  });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const { transfers: data } = await api<{ transfers: Transfer[] }>("/api/meal-transfers");
      setTransfers(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "دریافت انتقال‌ها ناموفق بود");
    }
  }, [user]);

  useEffect(() => { void load(); }, [load]);
  useTransferPolling(load, Boolean(user));

  const weekUsed = transfers.filter(
    (t) => t.sender_id === user?.id && new Date(t.created_at) >= new Date(Date.now() - 7 * 86400000)
  ).length;

  const submitSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      await api("/api/meal-transfers", {
        method: "POST",
        body: JSON.stringify({
          receiverStudentCode: form.receiver_student_code,
          receiverLastName: form.receiver_last_name,
          mealDate: form.meal_date,
          mealKind: form.meal_kind,
          mealName: form.meal_name,
          transferType: "send",
        }),
      });
      toast.success("QR Code تولید و آماده ارسال شد ✅");
      setForm({ ...form, receiver_student_code: "", receiver_last_name: "", meal_name: "" });
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ثبت انتقال ناموفق بود");
    } finally {
      setBusy(false);
    }
  };

  const respond = async (id: string, status: "approved" | "rejected") => {
    try {
      await api(`/api/meal-transfers/${id}/respond`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      toast.success(status === "approved" ? "تأیید شد و QR صادر شد" : "درخواست رد شد");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "به‌روزرسانی انتقال ناموفق بود");
    }
  };

  const incoming = transfers.filter((t) => t.transfer_type === "request" && t.receiver_id === user?.id && t.status === "pending");
  const myTransfers = transfers.filter((t) => t.sender_id === user?.id);

  return (
    <div className="space-y-6 max-w-3xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">انتقال غذا با QR</h1>
          <p className="text-sm text-muted-foreground mt-1">سهمیه ۳ انتقال در هفته</p>
        </div>
        <Badge variant={weekUsed >= 3 ? "destructive" : "secondary"}>
          استفاده شده این هفته: {weekUsed} / ۳
        </Badge>
      </div>

      {incoming.length > 0 && (
        <Card className="border-amber-300 bg-amber-50/50">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Inbox className="h-4 w-4" /> درخواست‌های دریافتی</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {incoming.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2 p-2 bg-background rounded-lg">
                <div className="text-sm">
                  <p>{t.meal_kind === "lunch" ? "ناهار" : "شام"} • {t.meal_date}</p>
                  <p className="text-xs text-muted-foreground">کد: {t.receiver_student_code}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" onClick={() => respond(t.id, "approved")} className="gap-1"><Check className="h-3 w-3" /> تأیید</Button>
                  <Button size="sm" variant="outline" onClick={() => respond(t.id, "rejected")} className="gap-1"><X className="h-3 w-3" /> رد</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="send">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="send"><Send className="h-4 w-4 ml-1" /> ارسال غذا</TabsTrigger>
          <TabsTrigger value="history"><QrCode className="h-4 w-4 ml-1" /> تاریخچه و QR</TabsTrigger>
        </TabsList>

        <TabsContent value="send">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={submitSend} className="space-y-3">
                <Input placeholder="کد دانشجویی گیرنده" value={form.receiver_student_code} onChange={(e) => setForm({ ...form, receiver_student_code: e.target.value })} required />
                <Input placeholder="نام خانوادگی گیرنده" value={form.receiver_last_name} onChange={(e) => setForm({ ...form, receiver_last_name: e.target.value })} required />
                <div className="grid grid-cols-2 gap-2">
                  <Input type="date" value={form.meal_date} onChange={(e) => setForm({ ...form, meal_date: e.target.value })} required />
                  <Select value={form.meal_kind} onValueChange={(v) => setForm({ ...form, meal_kind: v as "lunch" | "dinner" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lunch">ناهار</SelectItem>
                      <SelectItem value="dinner">شام</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input placeholder="نام غذا (اختیاری)" value={form.meal_name} onChange={(e) => setForm({ ...form, meal_name: e.target.value })} />
                <Button type="submit" disabled={busy || weekUsed >= 3} className="w-full">
                  {weekUsed >= 3 ? "سهمیه هفتگی تمام شده" : "تولید و ارسال QR"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-2">
            {myTransfers.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">انتقالی ثبت نشده</p>}
            {myTransfers.map((t) => (
              <Card key={t.id}>
                <CardContent className="py-3 flex items-center gap-3">
                  {t.status === "approved" && (
                    <div className="shrink-0 bg-white p-1 rounded">
                      <QRCodeSVG value={t.qr_token ?? ""} size={64} />
                    </div>
                  )}
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{t.meal_kind === "lunch" ? "ناهار" : "شام"} — {t.meal_date}</p>
                    <p className="text-xs text-muted-foreground">گیرنده: {t.receiver_last_name} ({t.receiver_student_code})</p>
                    {t.meal_name && <p className="text-xs">{t.meal_name}</p>}
                  </div>
                  <Badge variant={t.status === "approved" ? "default" : "secondary"}>
                    {t.status === "approved" ? "آماده" : t.status === "pending" ? "در انتظار" : t.status === "rejected" ? "رد شده" : t.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
