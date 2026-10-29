import { useState } from "react";
import { User, GraduationCap, Phone, Mail, Info, Sun, Moon, MonitorSmartphone, UtensilsCrossed, BookMarked, Wifi, BellRing, WashingMachine, Clock3, MessageSquareText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { usePreferences, COLOR_THEMES, MAJORS, ColorTheme, Major, ThemeMode } from "@/store/preferences";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { toFa } from "@/lib/jalali";
import ResidentBuildingCard from "@/components/ResidentBuildingCard";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import type { ReminderKey } from "@/store/preferences";

export default function Profile() {
  const { studentId, setStudentId, colorTheme, setColorTheme, major, setMajor, themeMode, setThemeMode, reminders, toggleReminder } = usePreferences();
  const { user } = useAuth();
  const studentProfile = user?.studentProfile;
  const [phone, setPhone] = useState("09121234567");
  const [editPhoneOpen, setEditPhoneOpen] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState(phone);
  const [faculty, setFaculty] = useState("مهندسی کامپیوتر");
  const [mealPlan] = useState([
    { name: "صبحانه", meal: "نان، پنیر، گردو و چای", icon: "🌅" },
    { name: "ناهار", meal: "چلو جوجه با برنج", icon: "🍛" },
    { name: "شام", meal: "قورمه‌سبزی با برنج", icon: "🌙" },
  ]);
  const [libraryBooks] = useState([
    { title: "طراحی الگوریتم‌ها", author: "کورن", due: "۱۴۰۵/۰۶/۱۷" },
    { title: "مبانی پایگاه داده", author: "سیلبرشاتس", due: "۱۴۰۵/۰۶/۲۳" },
    { title: "مدیریت پروژه", author: "کرزنر", due: "۱۴۰۵/۰۶/۱۲" },
  ]);
  const internetUsed = 35;
  const internetRemaining = 65;

  const submitPhone = () => {
    setPhone(phoneDraft);
    setEditPhoneOpen(false);
    toast.info("تغییر شماره ثبت موقت شد. برای نهایی‌سازی باید به دفتر شورای صنفی مراجعه کنید.");
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">پروفایل من</h1>
        <p className="text-muted-foreground text-sm mt-1">اطلاعات، شخصی‌سازی و تنظیمات حساب</p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-5 py-6">
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0 text-3xl">
            {MAJORS[major].emoji}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">دانشجوی عزیز</h2>
            <p className="text-muted-foreground text-sm mt-0.5">شماره دانشجویی: {toFa(studentId)}</p>
            <Badge className="mt-2 text-xs">دانشجوی فعال</Badge>
          </div>
        </CardContent>
      </Card>

      {studentProfile && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-primary" /> وضعیت دانشجویی</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="rounded-xl bg-muted/40 p-3"><p className="text-xs text-muted-foreground">اسکان</p><p className="font-semibold mt-1">{studentProfile.housing === "resident" ? "خوابگاهی" : "غیردرخوابگاه"}</p></div>
            <div className="rounded-xl bg-muted/40 p-3"><p className="text-xs text-muted-foreground">بومی بودن</p><p className="font-semibold mt-1">{studentProfile.origin === "local" ? "بومی" : "غیربومی"}</p></div>
            <div className="rounded-xl bg-muted/40 p-3"><p className="text-xs text-muted-foreground">نوع دوره</p><p className="font-semibold mt-1">{studentProfile.studyType === "day" ? "روزانه" : "شبانه"}</p></div>
            <div className="rounded-xl bg-muted/40 p-3"><p className="text-xs text-muted-foreground">وضعیت سنوات</p><p className="font-semibold mt-1">{studentProfile.academicStanding === "eligible" ? "مجاز" : "سنواتی"}</p></div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><BellRing className="h-4 w-4 text-primary" /> یادآوری‌های شخصی</CardTitle>
          <p className="text-xs text-muted-foreground">هر اعلان را جداگانه فعال یا غیرفعال کنید.</p>
        </CardHeader>
        <CardContent className="space-y-1">
          {([
            { key: "weeklyMealReservation", label: "یادآوری رزرو غذای هفته", description: "پیش از پایان مهلت رزرو هفتگی", icon: <UtensilsCrossed className="h-4 w-4" />, eligible: true },
            { key: "mealPickup", label: "یادآوری دریافت غذا", description: "فقط برای وعده‌ای که رزرو شده است", icon: <Clock3 className="h-4 w-4" />, eligible: true },
            { key: "mealSurvey", label: "یادآوری نظرسنجی غذا", description: "فقط پس از ثبت دریافت وعده", icon: <MessageSquareText className="h-4 w-4" />, eligible: true },
            { key: "laundryTurn", label: "یادآوری نوبت لباسشویی", description: studentProfile?.housing === "resident" ? "پیش از شروع نوبت رزروشده" : "ویژه دانشجویان خوابگاهی", icon: <WashingMachine className="h-4 w-4" />, eligible: studentProfile?.housing === "resident" },
          ] as Array<{ key: ReminderKey; label: string; description: string; icon: React.ReactNode; eligible: boolean }>).map((item) => (
            <div key={item.key} className={cn("flex items-center gap-3 rounded-xl p-3", item.eligible ? "hover:bg-muted/40" : "opacity-50 bg-muted/20")}>
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">{item.icon}</div>
              <div className="flex-1"><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground mt-0.5">{item.description}</p></div>
              <Switch checked={item.eligible && reminders[item.key]} disabled={!item.eligible} onCheckedChange={() => toggleReminder(item.key)} aria-label={item.label} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Major */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" /> رشته تحصیلی</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(Object.keys(MAJORS) as Major[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMajor(m); toast.success(`رشته به ${MAJORS[m].label} تغییر کرد`); }}
                className={cn(
                  "p-3 rounded-xl border-2 text-right transition-all flex items-center gap-2",
                  major === m ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                )}
              >
                <span className="text-xl">{MAJORS[m].emoji}</span>
                <span className="text-sm font-medium">{MAJORS[m].label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">پس‌زمینه و آیکن‌های داشبورد متناسب با رشته تغییر می‌کنند.</p>
        </CardContent>
      </Card>

      {/* Color theme */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">تم رنگی</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(Object.keys(COLOR_THEMES) as ColorTheme[]).map((c) => (
              <button
                key={c}
                onClick={() => { setColorTheme(c); toast.success(`تم رنگی به ${COLOR_THEMES[c].label} تغییر کرد`); }}
                className={cn(
                  "p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                  colorTheme === c ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40"
                )}
              >
                <div className="w-12 h-12 rounded-full shadow-md" style={{ backgroundColor: COLOR_THEMES[c].preview }} />
                <span className="text-sm font-medium">{COLOR_THEMES[c].label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Theme mode */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">حالت روشن/تاریک</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {([
              { v: "auto", label: "خودکار", icon: <MonitorSmartphone className="h-4 w-4" />, desc: "روز روشن، شب تاریک" },
              { v: "light", label: "روشن", icon: <Sun className="h-4 w-4" />, desc: "" },
              { v: "dark", label: "تاریک", icon: <Moon className="h-4 w-4" />, desc: "" },
            ] as { v: ThemeMode; label: string; icon: React.ReactNode; desc: string }[]).map((opt) => (
              <button
                key={opt.v}
                onClick={() => setThemeMode(opt.v)}
                className={cn(
                  "p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5",
                  themeMode === opt.v ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                {opt.icon}
                <span className="text-sm font-medium">{opt.label}</span>
                {opt.desc && <span className="text-[10px] text-muted-foreground">{opt.desc}</span>}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <ResidentBuildingCard />

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" /> دانشکده محل تحصیل</CardTitle></CardHeader>
        <CardContent>
          <Select value={faculty} onValueChange={(value) => { setFaculty(value); toast.success("دانشکده محل تحصیل ذخیره شد"); }}>
            <SelectTrigger><SelectValue placeholder="انتخاب دانشکده" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="مهندسی کامپیوتر">دانشکده برق و کامپیوتر</SelectItem>
              <SelectItem value="مهندسی مکانیک">دانشکده مهندسی مکانیک</SelectItem>
              <SelectItem value="مهندسی عمران">دانشکده مهندسی عمران</SelectItem>
              <SelectItem value="علوم پایه">دانشکده علوم پایه</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground px-1">سامانه‌های دانشگاه</h3>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><UtensilsCrossed className="h-4 w-4 text-primary" /> سامانه تغذیه</CardTitle></CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-3">
            {mealPlan.map((item) => <div key={item.name} className="rounded-xl border bg-muted/30 p-3"><div className="flex items-center gap-2 text-sm font-semibold"><span>{item.icon}</span>{item.name}</div><p className="text-xs text-muted-foreground mt-2">{item.meal}</p><Badge variant="outline" className="mt-2 text-[10px]">رزرو شده</Badge></div>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><BookMarked className="h-4 w-4 text-primary" /> کتابخانه</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {libraryBooks.map((book) => <div key={book.title} className="flex items-center gap-3 rounded-xl border bg-muted/20 p-3"><div className="h-10 w-8 rounded bg-primary/10 flex items-center justify-center text-lg">📘</div><div className="min-w-0 flex-1"><p className="text-sm font-semibold truncate">{book.title}</p><p className="text-xs text-muted-foreground">{book.author}</p></div><div className="text-left shrink-0"><p className="text-[10px] text-muted-foreground">موعد تحویل</p><p className="text-xs font-medium">{book.due}</p></div></div>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Wifi className="h-4 w-4 text-primary" /> اینترنت دانشگاه</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-5">
            <div className="relative h-24 w-24 shrink-0 rounded-full" style={{ background: `conic-gradient(#3b82f6 ${internetRemaining}%, hsl(var(--muted)) 0)` }}><div className="absolute inset-2 rounded-full bg-card flex flex-col items-center justify-center"><span className="text-lg font-bold">{toFa(internetRemaining)}٪</span><span className="text-[10px] text-muted-foreground">باقی‌مانده</span></div></div>
            <div><p className="text-lg font-semibold">{toFa(6.5)} گیگ باقی‌مانده</p><p className="text-xs text-muted-foreground mt-1">از ۱۰ گیگ حجم ماهانه</p><Badge variant="outline" className="mt-2 text-[10px]">مصرف‌شده: {toFa(internetUsed)}٪</Badge></div>
          </CardContent>
        </Card>
      </div>

      {/* Info — editable phone only */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> اطلاعات تماس</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">تلفن همراه:</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{toFa(phone)}</span>
              <Dialog open={editPhoneOpen} onOpenChange={setEditPhoneOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs">ویرایش</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>تغییر شماره تلفن</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Label>شماره جدید</Label>
                    <Input value={phoneDraft} onChange={(e) => setPhoneDraft(e.target.value)} placeholder="09xxxxxxxxx" />
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs">
                      <Info className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>تغییر شماره تنها پس از تأیید حضوری در دفتر شورای صنفی نهایی می‌شود.</span>
                    </div>
                    <Button onClick={submitPhone} className="w-full">ثبت درخواست</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">ایمیل دانشگاهی:</span>
            <span className="font-medium text-xs">student@nit.ac.ir</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">کد دانشجویی (برای استعلام‌ها):</span>
            <Input className="w-32 h-7 text-xs text-center" value={studentId} onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ""))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> اطلاعات تحصیلی</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">رشته:</span><span className="font-medium">{MAJORS[major].label}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">ورودی:</span><span className="font-medium">{toFa(1400)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">ترم جاری:</span><span className="font-medium">ترم {toFa(6)}</span></div>
        </CardContent>
      </Card>
    </div>
  );
}
