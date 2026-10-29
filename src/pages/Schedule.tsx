import { useState } from "react";
import { Plus, Trash2, Bell, BellOff, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ClassItem = {
  id: string;
  course: string;
  professor: string;
  day: string;
  startTime: string;
  endTime: string;
  location: string;
  notify: boolean;
  reminderBefore: string;
};

const days = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه"];

const initialClasses: ClassItem[] = [
  { id: "1", course: "ریاضی عمومی ۲", professor: "رضایی", day: "شنبه", startTime: "08:00", endTime: "10:00", location: "کلاس ۱۰۳", notify: true, reminderBefore: "30" },
  { id: "2", course: "فیزیک پایه", professor: "احمدی", day: "یکشنبه", startTime: "10:00", endTime: "12:00", location: "آمفی تئاتر", notify: true, reminderBefore: "15" },
  { id: "3", course: "مقاومت مصالح", professor: "کریمی", day: "دوشنبه", startTime: "13:00", endTime: "15:00", location: "کلاس ۲۰۵", notify: false, reminderBefore: "15" },
];

export default function Schedule() {
  const [classes, setClasses] = useState<ClassItem[]>(initialClasses);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ course: "", professor: "", day: "", startTime: "", endTime: "", location: "", reminderBefore: "15" });

  const addCourse = () => {
    if (!form.course || !form.day || !form.startTime || !form.endTime) {
      toast.error("لطفاً فیلدهای اجباری را تکمیل کنید");
      return;
    }
    const newItem: ClassItem = { id: Date.now().toString(), ...form, notify: true };
    setClasses((prev) => [...prev, newItem]);
    setForm({ course: "", professor: "", day: "", startTime: "", endTime: "", location: "", reminderBefore: "15" });
    setShowForm(false);
    toast.success("درس با موفقیت اضافه شد");
  };

  const toggleNotify = (id: string) => {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, notify: !c.notify } : c)));
  };

  const remove = (id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
    toast.success("درس حذف شد");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">برنامه کلاسی</h1>
          <p className="text-muted-foreground text-sm mt-1">مدیریت برنامه هفتگی کلاس‌ها</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} className="gap-2">
          <Plus className="h-4 w-4" />
          افزودن درس
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">افزودن درس جدید</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">نام درس *</label>
                <Input placeholder="مثال: ریاضی عمومی" value={form.course} onChange={(e) => setForm((f) => ({ ...f, course: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">استاد</label>
                <Input placeholder="نام استاد" value={form.professor} onChange={(e) => setForm((f) => ({ ...f, professor: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">روز هفته *</label>
                <Select onValueChange={(v) => setForm((f) => ({ ...f, day: v }))}>
                  <SelectTrigger><SelectValue placeholder="انتخاب روز" /></SelectTrigger>
                  <SelectContent>{days.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">محل برگزاری</label>
                <Input placeholder="مثال: کلاس ۱۰۳" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">ساعت شروع *</label>
                <Input type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">ساعت پایان *</label>
                <Input type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">یادآوری قبل از شروع</label>
                <Select defaultValue="15" onValueChange={(v) => setForm((f) => ({ ...f, reminderBefore: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">۱۵ دقیقه قبل</SelectItem>
                    <SelectItem value="30">۳۰ دقیقه قبل</SelectItem>
                    <SelectItem value="60">۱ ساعت قبل</SelectItem>
                    <SelectItem value="120">۲ ساعت قبل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>انصراف</Button>
              <Button onClick={addCourse}>ذخیره</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly grid */}
      <div className="space-y-3">
        {days.map((day) => {
          const dayClasses = classes.filter((c) => c.day === day);
          if (dayClasses.length === 0) return null;
          return (
            <Card key={day}>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-semibold text-primary">{day}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {dayClasses.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
                    <div className={cn("w-1.5 h-12 rounded-full", c.notify ? "bg-primary" : "bg-muted-foreground/30")} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">{c.course}</p>
                      <p className="text-xs text-muted-foreground">{c.professor} — {c.location}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {c.startTime} – {c.endTime}
                    </div>
                    {c.notify && (
                      <Badge variant="outline" className="text-xs hidden sm:flex">{c.reminderBefore} دقیقه قبل</Badge>
                    )}
                    <button onClick={() => toggleNotify(c.id)} className={cn("p-1.5 rounded-lg transition-colors", c.notify ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-muted")}>
                      {c.notify ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                    </button>
                    <button onClick={() => remove(c.id)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
        {classes.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <CalendarDaysEmpty />
            <p className="mt-3">هنوز کلاسی اضافه نشده است</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CalendarDaysEmpty() {
  return <div className="w-16 h-16 bg-muted rounded-2xl mx-auto flex items-center justify-center text-3xl">📅</div>;
}
