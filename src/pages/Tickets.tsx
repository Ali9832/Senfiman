import { useEffect, useState } from "react";
import { Plus, Loader2, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  TStatus, TPriority, TCategory,
  statusFa, statusColor, priorityFa, priorityColor, categoryFa,
} from "@/lib/tickets";
import { formatJalali, toFa } from "@/lib/jalali";
import TicketDetailDialog from "@/components/TicketDetailDialog";

type Row = {
  id: string;
  title: string;
  status: TStatus;
  category: TCategory;
  priority_final: TPriority | null;
  priority_suggested: TPriority;
  room_no: string | null;
  created_at: string;
};

type ApiTicket = {
  id: string;
  createdBy: string;
  title: string;
  status: TStatus;
  category: TCategory;
  priorityFinal: TPriority | null;
  prioritySuggested: TPriority;
  roomNo: string | null;
  createdAt: string;
};

const CATS: TCategory[] = ["facilities", "services", "safety", "admin"];
const PRIOS: TPriority[] = ["critical", "high", "medium", "low"];

export default function Tickets() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TStatus | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState({
    scope: "university" as "university" | "dorm",
    title: "", description: "", category: "facilities" as TCategory,
    priority_suggested: "medium" as TPriority, room_no: "", building_id: "",
  });
  const [buildings, setBuildings] = useState<{ id: string; name: string }[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    if (!user) return;
    setLoading(true);
    try {
      const { tickets } = await api<{ tickets: ApiTicket[] }>("/api/tickets");
      setRows(tickets.filter((ticket) => ticket.createdBy === user.id).map((ticket) => ({
        id: ticket.id,
        title: ticket.title,
        status: ticket.status,
        category: ticket.category,
        priority_final: ticket.priorityFinal,
        priority_suggested: ticket.prioritySuggested,
        room_no: ticket.roomNo,
        created_at: ticket.createdAt,
      })));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خطا در دریافت تیکت‌ها");
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!user) return;
    load();
    (async () => {
      try {
        const [{ buildings }, { profile }] = await Promise.all([
          api<{ buildings: { id: string; name: string }[] }>("/api/buildings"),
          api<{ profile: { residentBuildingId: string | null } | null }>("/api/profile/me"),
        ]);
        setBuildings(buildings);
        if (profile?.residentBuildingId) setForm((f) => ({ ...f, building_id: profile.residentBuildingId }));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "خطا در دریافت ساختمان‌ها");
      }
    })();
    const poll = window.setInterval(load, 30_000);
    return () => window.clearInterval(poll);
  }, [user?.id]);

  async function submit() {
    if (!user) return;
    if (!form.title.trim() || !form.description.trim()) {
      return toast.error("عنوان و توضیحات الزامی است");
    }
    setSubmitting(true);
    let ticketId: string;
    try {
      const { ticket } = await api<{ ticket: { id: string } }>("/api/tickets", {
        method: "POST",
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          scope: form.scope,
          category: form.category,
          prioritySuggested: form.priority_suggested,
          roomNo: form.room_no.trim() || null,
          buildingId: form.building_id || null,
        }),
      });
      ticketId = ticket.id;
    } catch (error) {
      setSubmitting(false);
      return toast.error(error instanceof Error ? error.message : "ثبت تیکت ناموفق بود");
    }

    // upload attachments
    for (const f of files) {
      try {
        const data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
          reader.onerror = () => reject(reader.error ?? new Error("File read failed"));
          reader.readAsDataURL(f);
        });
        await api(`/api/tickets/${ticketId}/attachments`, {
          method: "POST",
          body: JSON.stringify({ fileName: f.name, mimeType: f.type, sizeBytes: f.size, data }),
        });
      } catch (error) {
        toast.error("خطا در آپلود: " + f.name);
      }
    }
    setSubmitting(false);
    setOpen(false);
    setForm({
      scope: "university",
      title: "", description: "", category: "facilities",
      priority_suggested: "medium", room_no: "", building_id: form.building_id,
    });
    setFiles([]);
    toast.success("تیکت با موفقیت ثبت شد");
    load();
  }

  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">درخواست‌ها و پیگیری</h1>
          <p className="text-sm text-muted-foreground mt-1">ثبت درخواست دانشگاهی یا خوابگاهی و مشاهده آخرین وضعیت</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />تیکت جدید</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader><DialogTitle>تیکت جدید</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>نوع درخواست *</Label>
                <Select value={form.scope} onValueChange={(scope: "university" | "dorm") => setForm({ ...form, scope })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="university">درخواست دانشگاهی</SelectItem><SelectItem value="dorm">درخواست خوابگاهی</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>دسته‌بندی *</Label>
                <Select value={form.category} onValueChange={(v: TCategory) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATS.map((c) => <SelectItem key={c} value={c}>{categoryFa[c]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>عنوان *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثلاً: لامپ سوخته" />
              </div>
              <div>
                <Label>توضیحات *</Label>
                <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="جزئیات مشکل..." />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>اولویت پیشنهادی</Label>
                  <Select value={form.priority_suggested} onValueChange={(v: TPriority) => setForm({ ...form, priority_suggested: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIOS.map((p) => <SelectItem key={p} value={p}>{priorityFa[p]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {form.scope === "dorm" && <div>
                  <Label>شماره اتاق</Label>
                  <Input value={form.room_no} onChange={(e) => setForm({ ...form, room_no: e.target.value })} placeholder="مثلاً ۲۰۴" />
                </div>}
              </div>
              <div>
                <Label>ساختمان</Label>
                <Select value={form.building_id} onValueChange={(v) => setForm({ ...form, building_id: v })}>
                  <SelectTrigger><SelectValue placeholder="انتخاب ساختمان" /></SelectTrigger>
                  <SelectContent>
                    {buildings.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>عکس (از دوربین موبایل)</Label>
                <input
                  type="file" multiple accept="image/*" capture="environment"
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                  className="block w-full text-sm file:ml-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer"
                />
                {files.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">{toFa(files.length)} فایل انتخاب شد</p>
                )}
              </div>
              <Button onClick={submit} disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "ثبت تیکت"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 pb-1">
        <div className="flex items-center gap-2 text-muted-foreground sm:w-auto">
          <Filter className="h-4 w-4 shrink-0" />
          <span className="text-xs sm:hidden">فیلتر وضعیت</span>
        </div>
        {(["all", "pending_warden", "in_progress", "completed", "closed", "rejected"] as const).map((f) => (
          <Button
            key={f} size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f as any)}
            className="w-full sm:w-auto shrink-0 whitespace-nowrap"
          >
            {f === "all" ? "همه" : statusFa[f as TStatus]}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <div className="w-16 h-16 rounded-2xl bg-muted mx-auto flex items-center justify-center text-3xl">🎫</div>
          <p className="mt-3">تیکتی وجود ندارد</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <Card key={r.id} className="cursor-pointer hover:shadow-md transition" onClick={() => setSelected(r.id)}>
              <CardContent className="py-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{r.title}</p>
                  <div className="flex flex-wrap items-center gap-1 mt-1">
                    <Badge variant="outline" className="text-xs">{categoryFa[r.category]}</Badge>
                    <Badge className={priorityColor[(r.priority_final ?? r.priority_suggested) as TPriority] + " text-xs"}>
                      {priorityFa[(r.priority_final ?? r.priority_suggested) as TPriority]}
                    </Badge>
                    {r.room_no && <span className="text-xs text-muted-foreground">اتاق {toFa(r.room_no)}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{formatJalali(new Date(r.created_at))}</p>
                </div>
                <Badge className={statusColor[r.status]}>{statusFa[r.status]}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TicketDetailDialog ticketId={selected} onClose={() => setSelected(null)} onChange={load} />
    </div>
  );
}
