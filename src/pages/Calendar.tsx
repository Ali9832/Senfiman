import { useState, useMemo } from "react";
import { Plus, Trash2, ChevronRight, ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  toJalali,
  toGregorian,
  J_MONTHS,
  J_WEEKDAYS,
  toFa,
  persianWeekday,
} from "@/lib/jalali";
import { useEvents, EVENT_KIND_LABELS, EVENT_KIND_COLORS, EventKind } from "@/store/events";
import LiveClock from "@/components/LiveClock";

function jalaliMonthLength(jy: number, jm: number) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  // Esfand: simplified — 29 (most years)
  return 29;
}

export default function CalendarPage() {
  const { events, add, remove } = useEvents();
  const now = new Date();
  const [todayJy, todayJm, todayJd] = toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const [jy, setJy] = useState(todayJy);
  const [jm, setJm] = useState(todayJm);
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [form, setForm] = useState<{ title: string; kind: EventKind; time: string; location: string }>({
    title: "",
    kind: "event",
    time: "",
    location: "",
  });

  const daysInMonth = jalaliMonthLength(jy, jm);
  const [firstGy, firstGm, firstGd] = toGregorian(jy, jm, 1);
  const firstWeekday = persianWeekday(new Date(firstGy, firstGm - 1, firstGd));

  // map iso date -> events
  const dateMap = useMemo(() => {
    const map = new Map<string, typeof events>();
    for (const e of events) map.set(e.date, [...(map.get(e.date) ?? []), e]);
    // Add recurring weekly classes for the current month
    for (const e of events) {
      if (e.recurring && typeof e.weekday === "number") {
        for (let d = 1; d <= daysInMonth; d++) {
          const [gy, gm, gd] = toGregorian(jy, jm, d);
          const wd = persianWeekday(new Date(gy, gm - 1, gd));
          if (wd === e.weekday) {
            const iso = `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
            if (iso !== e.date) map.set(iso, [...(map.get(iso) ?? []), e]);
          }
        }
      }
    }
    return map;
  }, [events, jy, jm, daysInMonth]);

  const prevMonth = () => {
    if (jm === 1) { setJm(12); setJy((y) => y - 1); } else setJm((m) => m - 1);
  };
  const nextMonth = () => {
    if (jm === 12) { setJm(1); setJy((y) => y + 1); } else setJm((m) => m + 1);
  };

  const openAddFor = (iso: string) => {
    setSelectedDate(iso);
    setForm({ title: "", kind: "event", time: "", location: "" });
    setOpen(true);
  };

  const submit = () => {
    if (!form.title || !selectedDate) { toast.error("عنوان رویداد را وارد کنید"); return; }
    add({ title: form.title, kind: form.kind, date: selectedDate, time: form.time, location: form.location });
    toast.success("رویداد به تقویم اضافه شد و در صفحه‌ی متناظر نمایش داده می‌شود");
    setOpen(false);
  };

  const selectedEvents = selectedDate ? (dateMap.get(selectedDate) ?? []) : [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">تقویم یکپارچه</h1>
          <p className="text-muted-foreground text-sm mt-1">کلاس‌ها، امتحانات، کوئیز‌ها، مناسبت‌ها و عودت کتاب — همه در یک نگاه</p>
        </div>
        <LiveClock />
      </div>

      {/* Month nav */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={prevMonth}><ChevronRight className="h-4 w-4" /></Button>
            <div className="text-lg font-bold">{J_MONTHS[jm - 1]} {toFa(jy)}</div>
            <Button variant="ghost" size="sm" onClick={nextMonth}><ChevronLeft className="h-4 w-4" /></Button>
          </div>

          {/* Weekday header */}
          <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground text-center mb-2">
            {J_WEEKDAYS.map((d) => <div key={d} className="py-1 font-medium">{d}</div>)}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstWeekday }).map((_, i) => <div key={`pad-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const [gy, gm, gd] = toGregorian(jy, jm, d);
              const iso = `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
              const dayEvents = dateMap.get(iso) ?? [];
              const isToday = jy === todayJy && jm === todayJm && d === todayJd;
              return (
                <button
                  key={d}
                  onClick={() => openAddFor(iso)}
                  className={cn(
                    "min-h-[64px] p-1.5 rounded-lg border text-right transition-all hover:bg-muted/60 flex flex-col gap-1",
                    isToday ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border bg-card"
                  )}
                >
                  <span className={cn("text-xs font-semibold", isToday && "text-primary")}>{toFa(d)}</span>
                  <div className="flex flex-wrap gap-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <span key={e.id} className={cn("w-1.5 h-1.5 rounded-full", EVENT_KIND_COLORS[e.kind])} title={e.title} />
                    ))}
                    {dayEvents.length > 3 && <span className="text-[10px] text-muted-foreground">+{toFa(dayEvents.length - 3)}</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t text-xs">
            {(Object.keys(EVENT_KIND_LABELS) as EventKind[]).map((k) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className={cn("w-2 h-2 rounded-full", EVENT_KIND_COLORS[k])} />
                <span className="text-muted-foreground">{EVENT_KIND_LABELS[k]}</span>
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رویدادهای {selectedDate}</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedEvents.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">رویدادی برای این روز ثبت نشده</p>}
            {selectedEvents.map((e) => (
              <div key={e.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                <span className={cn("w-2 h-2 rounded-full shrink-0", EVENT_KIND_COLORS[e.kind])} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{EVENT_KIND_LABELS[e.kind]} {e.time && `— ${toFa(e.time)}`}</p>
                </div>
                {!e.recurring && (
                  <button onClick={() => { remove(e.id); toast.success("حذف شد"); }} className="text-destructive p-1 hover:bg-destructive/10 rounded">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-1"><Plus className="h-3 w-3" /> افزودن رویداد جدید</p>
            <Input placeholder="عنوان" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <Select value={form.kind} onValueChange={(v) => setForm((f) => ({ ...f, kind: v as EventKind }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(EVENT_KIND_LABELS) as EventKind[]).map((k) => (
                    <SelectItem key={k} value={k}>{EVENT_KIND_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} />
            </div>
            <Input placeholder="مکان (اختیاری)" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            <Button onClick={submit} className="w-full">ثبت در تقویم</Button>
            <p className="text-xs text-muted-foreground text-center">
              این رویداد به‌صورت خودکار در صفحه‌های «برنامه کلاسی» / «امتحانات» نیز نشان داده می‌شود.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
