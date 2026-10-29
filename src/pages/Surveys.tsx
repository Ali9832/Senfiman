import { useState } from "react";
import { CheckCircle2, ClipboardCheck, Plus, ShieldCheck, UtensilsCrossed } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { usePreferences } from "@/store/preferences";
import { toast } from "sonner";

export default function Surveys() {
  const { user, can } = useAuth();
  const reminderEnabled = usePreferences((state) => state.reminders.mealSurvey);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const isStudent = !!user?.studentProfile;
  const mealWasReserved = isStudent;
  const mealWasCollected = isStudent;
  const eligible = mealWasReserved && mealWasCollected;
  const canManage = can("surveys.manage");

  return <div className="max-w-3xl mx-auto space-y-5">
    <div className="flex items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">نظرسنجی‌ها</h1><p className="text-sm text-muted-foreground mt-1">نظرسنجی هدفمند بر اساس خدمت دریافت‌شده</p></div>{canManage && <Button className="gap-2" onClick={() => toast.success("فرم تعریف نظرسنجی آماده است")}><Plus className="h-4 w-4" />تعریف نظرسنجی</Button>}</div>
    <Card className="border-blue-500/30 bg-blue-500/5"><CardContent className="py-4 flex gap-3"><ShieldCheck className="h-5 w-5 text-blue-600 shrink-0" /><div><p className="text-sm font-semibold">قاعده ارسال نظرسنجی غذا</p><p className="text-xs text-muted-foreground mt-1 leading-5">اعلان فقط برای دانشجویی ارسال می‌شود که وعده را رزرو کرده و دریافت آن در گیت تغذیه ثبت شده باشد. دانشجوی بدون رزرو، جامانده از رزرو یا کسی که غذا را تحویل نگرفته، از جامعه نظرسنجی حذف می‌شود.</p></div></CardContent></Card>
    {canManage && !isStudent ? <Card><CardHeader><CardTitle className="text-base">نمای مدیریتی نظرسنجی‌ها</CardTitle></CardHeader><CardContent className="grid grid-cols-3 gap-3 text-center"><div className="rounded-xl bg-muted p-3"><p className="text-xl font-bold">۸۴۲</p><p className="text-xs text-muted-foreground">دریافت غذا</p></div><div className="rounded-xl bg-muted p-3"><p className="text-xl font-bold">۵۱۲</p><p className="text-xs text-muted-foreground">پاسخ معتبر</p></div><div className="rounded-xl bg-muted p-3"><p className="text-xl font-bold">۴.۱</p><p className="text-xs text-muted-foreground">میانگین امتیاز</p></div></CardContent></Card> : eligible ? <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><UtensilsCrossed className="h-5 w-5 text-primary" />ارزیابی ناهار امروز</CardTitle></CardHeader><CardContent>{submitted ? <div className="py-6 text-center"><CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" /><p className="font-semibold mt-2">نظر شما ثبت شد</p></div> : <div className="space-y-4"><div><Badge>واجد شرایط</Badge>{!reminderEnabled && <Badge variant="outline" className="mr-2">اعلان غیرفعال است</Badge>}</div><p className="text-sm text-muted-foreground">به غذای امروز چه امتیازی می‌دهید؟</p><div className="flex gap-2">{[1,2,3,4,5].map((value) => <button key={value} onClick={() => setScore(value)} className={`h-10 w-10 rounded-lg border text-lg ${score >= value ? "bg-amber-400 border-amber-500" : "bg-background"}`}>★</button>)}</div><Button disabled={!score} onClick={() => setSubmitted(true)}>ثبت نظر</Button></div>}</CardContent></Card> : <Card><CardContent className="py-12 text-center"><ClipboardCheck className="h-10 w-10 text-muted-foreground mx-auto" /><p className="font-semibold mt-3">نظرسنجی فعالی برای شما وجود ندارد</p><p className="text-xs text-muted-foreground mt-1">پس از رزرو و دریافت یک وعده، فرم همان وعده فعال می‌شود.</p></CardContent></Card>}
  </div>;
}
