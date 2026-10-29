import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, CheckCircle2, Clock, TrendingUp, RefreshCw, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toFa } from "@/lib/jalali";
import { toast } from "sonner";
import { DEMO_MODE } from "@/lib/api";
import { DEMO_TICKETS } from "@/lib/demoData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Row = {
  id: string; title: string; status: string;
  priority_final: string | null; priority_suggested: string;
  sla_due_at: string | null; created_at: string; closed_at: string | null;
  category?: string; requester?: string;
};

export default function AdminTicketsDashboard() {
  const [rows, setRows] = useState<Row[]>(DEMO_MODE ? DEMO_TICKETS as unknown as Row[] : []);
  const [loading, setLoading] = useState(true);
  const [escalating, setEscalating] = useState(false);
  const [selected, setSelected] = useState<Row | null>(null);

  async function load() {
    if (DEMO_MODE) {
      setRows(DEMO_TICKETS as unknown as Row[]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("tickets")
      .select("id,title,status,priority_final,priority_suggested,sla_due_at,created_at,closed_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    setRows((data ?? []) as any);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function runEscalation() {
    if (DEMO_MODE) {
      setEscalating(true);
      window.setTimeout(() => {
        setRows((current) => current.map((r) => r.id === "t1" ? { ...r, priority_final: "critical", status: "in_progress" } : r));
        setEscalating(false);
        toast.success("۱ تیکت بحرانی به تیم خدمات ارجاع شد");
      }, 350);
      return;
    }
    setEscalating(true);
    const { data, error } = await supabase.rpc("escalate_overdue_tickets");
    setEscalating(false);
    if (error) return toast.error(error.message);
    toast.success(`تعداد ${toFa(String(data ?? 0))} تیکت تشدید شد`);
    load();
  }

  const now = Date.now();
  const total = rows.length;
  const open = rows.filter(r => !["completed","closed","rejected"].includes(r.status)).length;
  const closed = rows.filter(r => ["completed","closed"].includes(r.status)).length;
  const breached = rows.filter(r => r.sla_due_at && new Date(r.sla_due_at).getTime() < now && !["completed","closed","rejected"].includes(r.status)).length;
  const critical = rows.filter(r => (r.priority_final ?? r.priority_suggested) === "critical" && !["completed","closed","rejected"].includes(r.status)).length;

  const durations = rows
    .filter(r => r.closed_at)
    .map(r => (new Date(r.closed_at!).getTime() - new Date(r.created_at).getTime()) / 36e5);
  const avgHours = durations.length ? (durations.reduce((a,b)=>a+b,0) / durations.length) : 0;

  const byStatus: Record<string, number> = {};
  rows.forEach(r => { byStatus[r.status] = (byStatus[r.status] ?? 0) + 1; });

  const kpis = [
    { label: "کل تیکت‌ها", value: total, icon: TrendingUp, color: "text-primary" },
    { label: "باز", value: open, icon: Clock, color: "text-amber-600" },
    { label: "بسته‌شده", value: closed, icon: CheckCircle2, color: "text-emerald-600" },
    { label: "SLA نقض‌شده", value: breached, icon: AlertTriangle, color: "text-destructive" },
    { label: "بحرانی", value: critical, icon: Zap, color: "text-red-600" },
    { label: "میانگین حل (ساعت)", value: avgHours.toFixed(1), icon: Clock, color: "text-blue-600" },
  ];

  if (loading) return <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">داشبورد تیکت‌ها</h1>
          <p className="text-sm text-muted-foreground mt-1">شاخص‌های عملکرد و وضعیت SLA</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} className="gap-2"><RefreshCw className="h-4 w-4" />به‌روزرسانی</Button>
          <Button onClick={runEscalation} disabled={escalating} className="gap-2">
            {escalating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            اجرای تشدید SLA
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <k.icon className={`h-4 w-4 ${k.color}`} />
              </div>
              <p className="text-2xl font-bold mt-2">{typeof k.value === "number" ? toFa(String(k.value)) : toFa(k.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">توزیع وضعیت</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(byStatus).map(([s, c]) => (
              <div key={s} className="flex items-center gap-2">
                <span className="text-sm w-32 shrink-0">{s}</span>
                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${(c/Math.max(1,total))*100}%` }} />
                </div>
                <span className="text-sm w-10 text-end">{toFa(String(c))}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">تیکت‌های دارای نقض SLA</CardTitle></CardHeader>
        <CardContent>
          {breached === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">هیچ تیکت نقض‌شده‌ای وجود ندارد ✅</p>
          ) : (
            <div className="space-y-2">
              {rows.filter(r => r.sla_due_at && new Date(r.sla_due_at).getTime() < now && !["completed","closed","rejected"].includes(r.status))
                .slice(0, 20).map(r => (
                <button key={r.id} type="button" onClick={() => setSelected(r)} className="w-full flex items-center justify-between border rounded-lg p-3 text-right hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium text-sm">{r.title}</p>
                    <p className="text-xs text-muted-foreground">وضعیت: {r.status} · اولویت: {r.priority_final ?? r.priority_suggested}</p>
                  </div>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>جزئیات تیکت</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">عنوان: </span><strong>{selected.title}</strong></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-muted/50 p-3"><span className="text-muted-foreground block text-xs">وضعیت</span>{selected.status}</div>
                <div className="rounded-lg bg-muted/50 p-3"><span className="text-muted-foreground block text-xs">اولویت</span>{selected.priority_final ?? selected.priority_suggested}</div>
              </div>
              <div><span className="text-muted-foreground">ثبت‌کننده: </span>{selected.requester ?? "کاربر سامانه"}</div>
              <div><span className="text-muted-foreground">دسته‌بندی: </span>{selected.category ?? "عمومی"}</div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={() => { setRows(rs => rs.map(r => r.id === selected.id ? { ...r, status: "in_progress" } : r)); setSelected({ ...selected, status: "in_progress" }); toast.success("وضعیت تیکت تغییر کرد"); }}>ارجاع به کارشناس</Button>
                <Button size="sm" variant="outline" onClick={() => { setRows(rs => rs.map(r => r.id === selected.id ? { ...r, status: "completed", closed_at: new Date().toISOString() } : r)); setSelected(null); toast.success("تیکت بسته شد"); }}>بستن تیکت</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
