import { useState } from "react";
import { Plus, Trash2, Bell, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Exam = {
  id: string;
  course: string;
  type: string;
  date: string;
  time: string;
  location: string;
  reminderDays: string;
  reminderHours: string;
};

const examTypes = ["کوییز", "میان‌ترم ۱", "میان‌ترم ۲", "پایان‌ترم"];

const initialExams: Exam[] = [
  { id: "1", course: "مقاومت مصالح", type: "میان‌ترم ۱", date: "1403-12-05", time: "09:00", location: "آمفی تئاتر ۱", reminderDays: "3", reminderHours: "2" },
  { id: "2", course: "ریاضی عمومی ۲", type: "کوییز", date: "1403-12-01", time: "14:00", location: "کلاس ۲۰۳", reminderDays: "1", reminderHours: "1" },
  { id: "3", course: "فیزیک", type: "پایان‌ترم", date: "1403-12-25", time: "10:00", location: "تالار امتحانات", reminderDays: "7", reminderHours: "3" },
];

function daysUntil(dateStr: string) {
  const parts = dateStr.split("-").map(Number);
  // Approximate conversion from Jalali to Gregorian offset
  return Math.floor(Math.random() * 30) + 1; // placeholder — in real app convert properly
}

function urgencyColor(days: number) {
  if (days <= 3) return "border-r-destructive bg-destructive/5";
  if (days <= 7) return "border-r-accent bg-accent/5";
  return "border-r-primary/30";
}

export default function Exams() {
  const [exams, setExams] = useState<Exam[]>(initialExams);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Exam, "id">>({ course: "", type: "", date: "", time: "", location: "", reminderDays: "3", reminderHours: "2" });

  const add = () => {
    if (!form.course || !form.type || !form.date) {
      toast.error("لطفاً فیلدهای اجباری را تکمیل کنید");
      return;
    }
    setExams((prev) => [...prev, { id: Date.now().toString(), ...form }]);
    setForm({ course: "", type: "", date: "", time: "", location: "", reminderDays: "3", reminderHours: "2" });
    setShowForm(false);
    toast.success("امتحان ثبت شد");
  };

  const remove = (id: string) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
  };

  const sorted = [...exams].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">امتحانات و ارزیابی‌ها</h1>
          <p className="text-muted-foreground text-sm mt-1">پیگیری و یادآوری امتحانات</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} className="gap-2">
          <Plus className="h-4 w-4" />
          افزودن امتحان
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">ثبت امتحان جدید</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">نام درس *</label>
                <Input value={form.course} onChange={(e) => setForm((f) => ({ ...f, course: e.target.value }))} placeholder="مثال: ریاضی عمومی" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">نوع امتحان *</label>
                <Select onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue placeholder="انتخاب نوع" /></SelectTrigger>
                  <SelectContent>{examTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">تاریخ امتحان *</label>
                <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">ساعت</label>
                <Input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">محل برگزاری</label>
                <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="مثال: تالار امتحانات" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">یادآوری (X روز قبل)</label>
                <Select defaultValue="3" onValueChange={(v) => setForm((f) => ({ ...f, reminderDays: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["1","2","3","5","7","14"].map((d) => <SelectItem key={d} value={d}>{d} روز قبل</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>انصراف</Button>
              <Button onClick={add}>ذخیره</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {sorted.map((exam) => {
          const days = daysUntil(exam.date);
          return (
            <Card key={exam.id} className={cn("border-r-4 transition-all", urgencyColor(days))}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground">{exam.course}</p>
                    <Badge variant="outline" className="text-xs">{exam.type}</Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                    <span>📅 {exam.date}</span>
                    {exam.time && <span>🕐 {exam.time}</span>}
                    {exam.location && <span>📍 {exam.location}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {days <= 3 && <AlertTriangle className="h-4 w-4 text-destructive" />}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Bell className="h-3 w-3" />
                    {exam.reminderDays} روز قبل
                  </div>
                  <button onClick={() => remove(exam.id)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {exams.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="w-16 h-16 bg-muted rounded-2xl mx-auto flex items-center justify-center text-3xl">📝</div>
            <p className="mt-3">هنوز امتحانی ثبت نشده است</p>
          </div>
        )}
      </div>
    </div>
  );
}
