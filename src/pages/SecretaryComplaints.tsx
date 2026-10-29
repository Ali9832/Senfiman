import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Complaint, ComplaintStatus, complaintKindFa, complaintStatusFa } from "@/lib/complaints";
import { formatJalali } from "@/lib/jalali";

export default function SecretaryComplaints() {
  const [rows, setRows] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    try {
      const { complaints } = await api<{ complaints: Complaint[] }>("/api/complaints?scope=secretary");
      setRows(complaints);
    } catch {
      toast.error("خطا در دریافت شکایت‌ها");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function save(id: string, patch: { status?: ComplaintStatus; resolution?: string | null }) {
    try {
      await api(`/api/complaints/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    } catch (error) {
      return toast.error(error instanceof Error ? error.message : "خطا در ذخیره");
    }
    toast.success("ذخیره شد");
    load();
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">شکایات و پیشنهادات</h1>
        <p className="text-sm text-muted-foreground mt-1">پیگیری توسط دبیر شورای صنفی</p>
      </div>
      {loading ? (
        <div className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">موردی ثبت نشده است</div>
      ) : (
        <div className="space-y-3">
          {rows.map((c) => (
            <Card key={c.id}>
              <CardContent className="py-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{c.title}</p>
                  <div className="flex gap-1">
                    <Badge variant="secondary" className="text-xs">{complaintKindFa[c.kind]}</Badge>
                    {c.isAnonymous && <Badge variant="outline" className="text-xs">ناشناس</Badge>}
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{c.body}</p>
                <p className="text-xs text-muted-foreground">{formatJalali(new Date(c.createdAt))}</p>

                <div className="grid sm:grid-cols-[auto_1fr_auto] gap-2 items-start pt-2 border-t">
                  <Select
                    defaultValue={c.status}
                    onValueChange={(v: ComplaintStatus) => save(c.id, { status: v })}
                  >
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["open", "in_review", "resolved", "rejected"] as ComplaintStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>{complaintStatusFa[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    rows={2}
                    placeholder="پاسخ / توضیح..."
                    defaultValue={c.resolution ?? ""}
                    onChange={(e) => setEdit((s) => ({ ...s, [c.id]: e.target.value }))}
                  />
                  <Button
                    size="sm"
                    onClick={() => save(c.id, { resolution: edit[c.id] ?? c.resolution })}
                  >
                    ذخیره پاسخ
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
