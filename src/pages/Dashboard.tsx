import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  BookOpen,
  UtensilsCrossed,
  Ticket,
  CalendarCheck,
  ArrowLeft,
  Bell,
  TrendingUp,
  ClipboardCheck,
  Wifi,
  BookMarked,
  RefreshCw,
  UsersRound,
  Vote,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LiveClock from "@/components/LiveClock";
import { useEvents } from "@/store/events";
import { usePreferences, MAJORS } from "@/store/preferences";
import { todayISO, persianWeekday, toFa, formatJalaliShort } from "@/lib/jalali";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ROLE_LABELS, useAuth, type Role } from "@/hooks/useAuth";
import { DEMO_MODE } from "@/lib/api";
import { councilById, councilForFaculty, type CouncilPost } from "@/lib/councils";
import NewsFeedCard from "@/components/NewsFeedCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Major } from "@/store/preferences";

const announcements = [
  { id: 1, text: "مهلت ثبت‌نام حذف و اضافه تا ۳ اسفند تمدید شد", date: "۲۹ بهمن" },
  { id: 2, text: "سیستم تغذیه فردا از ساعت ۱۰ در دسترس است", date: "۲۸ بهمن" },
  { id: 3, text: "برگزاری انتخابات شورای صنفی هفته آینده", date: "۲۷ بهمن" },
];

const UNIVERSITY_PR_POSTS: CouncilPost[] = [
  { id: "upr-1", title: "آغاز ثبت‌نام وام دانشجویی نیمسال جدید", excerpt: "راهنما، مدارک لازم و زمان‌بندی بررسی درخواست‌ها منتشر شد.", date: "امروز", type: "اطلاعیه", pinned: true },
  { id: "upr-2", title: "گزارش تصویری آیین استقبال از دانشجویان", excerpt: "منتخب تصاویر برنامه و معرفی واحدهای پاسخ‌گو در دسترس است.", date: "دیروز", type: "گزارش تصویری", image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80" },
  { id: "upr-3", title: "تغییر ساعت سرویس‌های دانشگاه", excerpt: "برنامه جدید حرکت سرویس‌ها از ابتدای هفته آینده اجرا می‌شود.", date: "۲ روز قبل", type: "خبر" },
];

const STUDENT_AFFAIRS_POSTS: CouncilPost[] = [
  { id: "sa-1", title: "مهلت ثبت درخواست خوابگاه", excerpt: "دانشجویان واجد شرایط تا ۲۵ مهر امکان ثبت یا ویرایش درخواست دارند.", date: "امروز", type: "اطلاعیه", pinned: true },
  { id: "sa-2", title: "نتیجه ارزیابی کیفیت غذای هفته گذشته", excerpt: "میانگین امتیازها و اقدام‌های اصلاحی اداره تغذیه منتشر شد.", date: "۱۷ مهر", type: "خبر" },
  { id: "sa-3", title: "افزایش ساعت فعالیت مرکز مشاوره", excerpt: "نوبت عصر مرکز مشاوره تا ساعت ۱۸ پاسخ‌گوی دانشجویان است.", date: "۱۵ مهر", type: "اطلاعیه" },
];

// Real meal data — pulled from food-sync edge function
import { supabase } from "@/integrations/supabase/client";

type MealToday = {
  reserved: boolean;
  name: string | null;
  deadline: string;
  kind: "lunch" | "dinner";
  source: "live" | "no-creds" | "error" | "loading" | "unrecognized";
  errorMsg?: string;
};

function MealTodayCard() {
  const [now, setNow] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [meal, setMeal] = useState<MealToday>({
    reserved: false, name: null, deadline: "10:00", kind: "lunch", source: "loading",
  });

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const hour = now.getHours();
  const isLunch = hour < 14;
  const kind: "lunch" | "dinner" = isLunch ? "lunch" : "dinner";
  const deadline = isLunch ? "10:00" : "16:30";
  const label = isLunch ? "ناهار امروز" : "شام امروز";

  const load = async (force = false) => {
    if (DEMO_MODE) {
      setMeal({ reserved: true, name: "چلو جوجه با برنج", deadline, kind, source: "live" });
      setRefreshing(false);
      return;
    }
    if (force) setRefreshing(true);
    const { data, error } = await supabase.functions.invoke("food-sync", { body: { action: "fetch", force } });
    if (force) setRefreshing(false);
    if (error) return setMeal({ reserved: false, name: null, deadline, kind, source: "error", errorMsg: error.message });
    if (data?.error === "no-credentials" || (data?.ok === false && data?.error === "no-credentials")) {
      return setMeal({ reserved: false, name: null, deadline, kind, source: "no-creds" });
    }
    const payload = data?.data;
    const meals = payload?.meals ?? [];
    const todayStr = new Date().toISOString().slice(0, 10);
    const found = meals.find((m: any) => m.date === todayStr && (m.kind === kind || !m.kind));
    if (!found && meals.length === 0) {
      return setMeal({ reserved: false, name: null, deadline, kind, source: "unrecognized" });
    }
    setMeal({
      reserved: !!found?.reserved,
      name: found?.name ?? null,
      deadline, kind, source: "live",
    });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => { if (!cancelled) await load(false); })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, deadline]);

  const deadlineFa = toFa(meal.deadline);

  return (
    <Card className={cn("border-r-4", meal.reserved ? "border-r-green-500" : "border-r-amber-500")}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <UtensilsCrossed className="h-4 w-4" />
          وضعیت تغذیه — {label}
        </CardTitle>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => load(true)}
          disabled={refreshing || meal.source === "loading"}
          aria-label="بارگذاری مجدد"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
        </Button>
      </CardHeader>
      <CardContent>
        {meal.source === "loading" ? (
          <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
        ) : meal.source === "no-creds" ? (
          <>
            <p className="text-sm text-foreground">برای نمایش غذای واقعی، در پروفایل به سامانه تغذیه متصل شوید.</p>
            <Button asChild size="sm" variant="outline" className="mt-2 h-7 text-xs">
              <Link to="/profile">اتصال</Link>
            </Button>
          </>
        ) : meal.source === "unrecognized" ? (
          <>
            <p className="text-sm text-foreground">ساختار سامانه تغذیه شناسایی نشد.</p>
            <p className="text-xs text-muted-foreground mt-1">لطفاً به ادمین گزارش دهید تا selectorها به‌روزرسانی شوند.</p>
          </>
        ) : meal.source === "error" ? (
          <>
            <p className="text-sm text-foreground">خطا در دریافت اطلاعات</p>
            <p className="text-xs text-muted-foreground mt-1">{meal.errorMsg}</p>
          </>
        ) : meal.reserved && meal.name ? (
          <>
            <p className="text-lg font-semibold text-foreground">{meal.name}</p>
            <p className="text-sm text-muted-foreground mt-1">سلف مرکزی</p>
            <Badge className="mt-2 text-xs bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900">✅ رزرو شده</Badge>
          </>
        ) : (
          <>
            <p className="text-lg font-semibold text-foreground">رزرو نکرده‌اید</p>
            <p className="text-sm text-muted-foreground mt-1">مهلت روز فروش تا ساعت {deadlineFa}</p>
            <Button asChild size="sm" className="mt-2 h-7 text-xs">
              <Link to="/meal">رزرو سریع</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function CountdownWidget() {
  const events = useEvents((s) => s.events);
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const next = useMemo(() => {
    // Find next class today (recurring weekly) with time > now, else any future class
    const wd = persianWeekday(now);
    const todayClasses = events
      .filter((e) => e.kind === "class" && (e.recurring ? e.weekday === wd : e.date === todayISO()))
      .filter((e) => e.time && e.time > `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`)
      .sort((a, b) => (a.time! < b.time! ? -1 : 1));
    return todayClasses[0];
  }, [events, now]);

  if (!next) {
    return (
      <Card className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 opacity-90">
            <Clock className="h-4 w-4" /> کلاس بعدی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold mb-1">کلاسی برای امروز باقی نمانده</p>
          <p className="text-xs opacity-70">از فرصت استفاده کنید 🎉</p>
        </CardContent>
      </Card>
    );
  }

  const [h, m] = next.time!.split(":").map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  const diff = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  const hh = Math.floor(diff / 3600);
  const mm = Math.floor((diff % 3600) / 60);
  const ss = diff % 60;
  const pad = (n: number) => toFa(String(n).padStart(2, "0"));

  return (
    <Card className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2 opacity-90">
          <Clock className="h-4 w-4" /> کلاس بعدی
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-semibold mb-1">{next.title}</p>
        <p className="text-sm opacity-75 mb-3">{next.notes ?? ""} {next.location && `— ${next.location}`}</p>
        <div className="flex items-center gap-1 font-mono text-3xl font-bold">
          <span>{pad(hh)}</span><span className="opacity-60">:</span>
          <span>{pad(mm)}</span><span className="opacity-60">:</span>
          <span>{pad(ss)}</span>
        </div>
        <p className="text-xs opacity-60 mt-1">تا شروع کلاس</p>
      </CardContent>
    </Card>
  );
}

function InternetQuotaCard() {
  const [data, setData] = useState<{ used_mb: number; total_mb: number; expires_at: string | null } | null>(null);
  const [status, setStatus] = useState<"loading" | "no-creds" | "ready" | "error" | "unrecognized">("loading");
  const [refreshing, setRefreshing] = useState(false);

  const load = async (force = false) => {
    if (DEMO_MODE) {
      setData({ used_mb: 3584, total_mb: 10240, expires_at: "2026-09-30" });
      setStatus("ready");
      setRefreshing(false);
      return;
    }
    if (force) setRefreshing(true);
    const { data: res, error } = await supabase.functions.invoke("internet-quota", { body: { action: "fetch", force } });
    if (force) setRefreshing(false);
    if (error) return setStatus("error");
    if (res?.error === "no-credentials") return setStatus("no-creds");
    const d = res?.data;
    if (!d || (!d.used_mb && !d.total_mb)) return setStatus("unrecognized");
    setData({ used_mb: d.used_mb, total_mb: d.total_mb, expires_at: d.expires_at });
    setStatus("ready");
  };

  useEffect(() => { load(false); }, []);

  const usedGb = data ? (data.used_mb / 1024).toFixed(1) : "—";
  const totalGb = data ? (data.total_mb / 1024).toFixed(0) : "—";
  const remainingGb = data ? Math.max(0, (data.total_mb - data.used_mb) / 1024).toFixed(1) : "—";
  const pct = data && data.total_mb ? Math.min(100, (data.used_mb / data.total_mb) * 100) : 0;

  return (
    <Card className="border-r-4 border-r-blue-500">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Wifi className="h-4 w-4" /> حجم اینترنت
        </CardTitle>
        {status === "ready" && (
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => load(true)} disabled={refreshing} aria-label="بارگذاری مجدد">
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {status === "loading" ? (
          <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
        ) : status === "no-creds" ? (
          <>
            <p className="text-sm text-foreground">برای نمایش حجم واقعی، در پروفایل به سامانه اینترنت متصل شوید.</p>
            <Button asChild size="sm" variant="outline" className="mt-2 h-7 text-xs"><Link to="/profile">اتصال</Link></Button>
          </>
        ) : status === "unrecognized" ? (
          <p className="text-sm text-muted-foreground">ساختار سامانه شناسایی نشد. لطفاً به ادمین گزارش دهید.</p>
        ) : status === "error" ? (
          <p className="text-sm text-muted-foreground">خطا در دریافت اطلاعات</p>
        ) : data ? (
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 rounded-full" style={{ background: `conic-gradient(#3b82f6 ${100 - pct}%, hsl(var(--muted)) 0)` }}>
              <div className="absolute inset-2 rounded-full bg-card flex flex-col items-center justify-center">
                <span className="text-sm font-bold">{toFa(Math.round(100 - pct))}٪</span>
                <span className="text-[9px] text-muted-foreground">باقی‌مانده</span>
              </div>
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{toFa(remainingGb)} گیگ باقی‌مانده</p>
              <p className="text-xs text-muted-foreground mt-1">{toFa(usedGb)} از {toFa(totalGb)} گیگ مصرف شده</p>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function LibraryCard() {
  const [loans, setLoans] = useState<Array<{ title: string; due_date: string }> | null>(null);
  const [status, setStatus] = useState<"loading" | "no-creds" | "ready" | "empty" | "error">("loading");
  const [refreshing, setRefreshing] = useState(false);

  const load = async (force = false) => {
    if (DEMO_MODE) {
      setLoans([
        { title: "طراحی الگوریتم‌ها", due_date: "2026-09-08" },
        { title: "مبانی پایگاه داده", due_date: "2026-09-14" },
      ]);
      setStatus("ready");
      setRefreshing(false);
      return;
    }
    if (force) setRefreshing(true);
    const { data: res, error } = await supabase.functions.invoke("library-sync", { body: { action: "fetch", force } });
    if (force) setRefreshing(false);
    if (error) return setStatus("error");
    if (res?.error === "no-credentials") return setStatus("no-creds");
    const arr = res?.data?.loans ?? [];
    if (!arr.length) return setStatus("empty");
    setLoans(arr);
    setStatus("ready");
  };
  useEffect(() => { load(false); }, []);

  const daysTo = (d: string) => {
    const t = new Date(d).getTime();
    return Math.max(0, Math.ceil((t - Date.now()) / 86400000));
  };
  const nearest = loans?.[0];

  return (
    <Card className="border-r-4 border-r-pink-500">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <BookMarked className="h-4 w-4" /> کتاب‌های امانتی
        </CardTitle>
        {status === "ready" && (
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => load(true)} disabled={refreshing} aria-label="بارگذاری مجدد">
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {status === "loading" ? (
          <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
        ) : status === "no-creds" ? (
          <>
            <p className="text-sm text-foreground">برای نمایش کتاب‌های امانتی، در پروفایل به سامانه کتابخانه متصل شوید.</p>
            <Button asChild size="sm" variant="outline" className="mt-2 h-7 text-xs"><Link to="/profile">اتصال</Link></Button>
          </>
        ) : status === "empty" ? (
          <p className="text-sm text-muted-foreground">کتاب امانتی فعالی ندارید.</p>
        ) : status === "error" ? (
          <p className="text-sm text-muted-foreground">خطا در دریافت اطلاعات</p>
        ) : loans && nearest ? (
          <>
            <p className="text-lg font-semibold text-foreground">{toFa(loans.length)} کتاب</p>
            <p className="text-xs text-muted-foreground mt-1">نزدیک‌ترین عودت تا {toFa(daysTo(nearest.due_date))} روز دیگر</p>
            <Button asChild size="sm" variant="outline" className="mt-2 h-7 text-xs">
              <Link to="/library">مشاهده</Link>
            </Button>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user, roles } = useAuth();
  const { major, facultyConfirmed, setMajor } = usePreferences();
  const profileFaculty = user?.studentProfile?.facultyId;
  const selectedFaculty = profileFaculty || (facultyConfirmed ? major : undefined);
  const facultyCouncil = councilForFaculty(selectedFaculty);
  const centralCouncil = councilById("central")!;
  const dashboardMajor = (selectedFaculty && selectedFaculty in MAJORS ? selectedFaculty : major) as Major;
  const events = useEvents((s) => s.events);
  const nextExam = useMemo(() => {
    const today = todayISO();
    return events
      .filter((e) => ["exam", "midterm", "quiz"].includes(e.kind) && e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))[0];
  }, [events]);

  return (
    <div className={cn("space-y-5 w-full max-w-none mx-0 -m-4 md:-m-6 p-4 md:p-6 min-h-[calc(100vh-3.5rem)] bg-gradient-to-br", MAJORS[dashboardMajor].gradient)}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            {MAJORS[dashboardMajor].emoji} داشبورد
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            خوش آمدید، {user?.firstName || user?.lastName || "کاربر"} 👋
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-2" aria-label="نقش‌های کاربر">
            <span className="text-xs text-muted-foreground ml-1">نقش شما:</span>
            {roles.length > 0 ? roles.map((role) => (
              <Badge key={role} variant="secondary" className="text-xs">
                {ROLE_LABELS[role as Role] ?? role}
              </Badge>
            )) : (
              <Badge variant="secondary" className="text-xs">{ROLE_LABELS.student}</Badge>
            )}
          </div>
        </div>
        <LiveClock />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <CountdownWidget />
        <Card className="border-r-4 border-r-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CalendarCheck className="h-4 w-4" /> نزدیک‌ترین امتحان
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextExam ? (
              <>
                <p className="text-lg font-semibold text-foreground">{nextExam.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{formatJalaliShort(nextExam.date)}</p>
                <Badge variant="destructive" className="mt-2 text-xs">{nextExam.kind === "quiz" ? "کوئیز" : nextExam.kind === "midterm" ? "میان‌ترم" : "امتحان"}</Badge>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">امتحانی ثبت نشده</p>
            )}
          </CardContent>
        </Card>
        <MealTodayCard />
        <InternetQuotaCard />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <LibraryCard />
        <Card className="border-r-4 border-r-accent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Ticket className="h-4 w-4" /> آخرین تیکت
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-foreground">مشکل اینترنت خوابگاه</p>
            <p className="text-sm text-muted-foreground mt-1">IT</p>
            <Badge variant="outline" className="mt-2 text-xs border-accent bg-accent/10">در حال بررسی</Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-5">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" /> اطلاعیه‌ها
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1">
              همه <ArrowLeft className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-relaxed">{a.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">{a.date}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> دسترسی سریع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "تقویم", icon: <CalendarCheck className="h-5 w-5" />, to: "/calendar", color: "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300" },
                { label: "رزرو تغذیه", icon: <UtensilsCrossed className="h-5 w-5" />, to: "/meal", color: "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300" },
                { label: "ارتباط دانشجویی", icon: <Ticket className="h-5 w-5" />, to: "/communication", color: "bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300" },
                { label: "کتابخانه", icon: <BookMarked className="h-5 w-5" />, to: "/library", color: "bg-pink-50 dark:bg-pink-950 text-pink-700 dark:text-pink-300" },
              ].map((a) => (
                <Link key={a.label} to={a.to} className={cn("flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:scale-105", a.color)}>
                  {a.icon}
                  <span className="text-sm font-medium">{a.label}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="lg:col-span-2"><NewsFeedCard title="شورای صنفی مرکزی" subtitle="آخرین خبرها و پیگیری‌های سراسری" posts={centralCouncil.posts} href="/council/central" accent="border-r-blue-600" /></div>
        <div className="lg:col-span-2">{facultyCouncil ? <NewsFeedCard title={facultyCouncil.name} subtitle="اطلاع‌رسانی متناسب با دانشکده شما" posts={facultyCouncil.posts} href={`/council/${facultyCouncil.id}`} accent="border-r-violet-600" /> : <Card className="h-[30rem] flex items-center"><CardContent className="w-full text-center space-y-4"><UsersRound className="h-10 w-10 text-primary mx-auto" /><div><p className="font-bold text-lg">دانشکده شما مشخص نشده است</p><p className="text-sm text-muted-foreground mt-2">برای نمایش کانال شورای صنفی مرتبط، دانشکده‌تان را انتخاب کنید.</p></div><Select onValueChange={(value: Major) => setMajor(value)}><SelectTrigger className="max-w-sm mx-auto"><SelectValue placeholder="انتخاب دانشکده" /></SelectTrigger><SelectContent>{Object.entries(MAJORS).map(([value, item]) => <SelectItem key={value} value={value}>{item.label}</SelectItem>)}</SelectContent></Select></CardContent></Card>}</div>
        <div className="lg:col-span-2"><NewsFeedCard title="روابط عمومی دانشگاه" subtitle="اخبار رسمی و اطلاعیه‌های عمومی دانشگاه" posts={UNIVERSITY_PR_POSTS} accent="border-r-emerald-600" /></div>
        <div className="lg:col-span-2"><NewsFeedCard title="معاونت دانشجویی" subtitle="اطلاعیه‌های رفاهی، خوابگاه، تغذیه و سلامت" posts={STUDENT_AFFAIRS_POSTS} accent="border-r-amber-500" /></div>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><UsersRound className="h-4 w-4 text-primary" /> فعالیت انجمن‌ها و کانون‌ها</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {["کارگاه رزومه‌نویسی انجمن علمی کامپیوتر — دوشنبه", "اکران فیلم و نشست نقد انجمن هنر — سه‌شنبه", "ثبت‌نام اردوی علمی کانون هلال احمر"].map((item) => <div key={item} className="rounded-lg bg-muted/40 p-3 text-sm">{item}</div>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Vote className="h-4 w-4 text-primary" /> کارزارها و نظرسنجی‌ها</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border p-3"><p className="text-sm font-medium">انتخاب ساعت پیشنهادی کتابخانه</p><p className="text-xs text-muted-foreground mt-1">۲۳۴ نفر شرکت کرده‌اند</p><Button size="sm" variant="outline" className="mt-2">شرکت در نظرسنجی</Button></div>
            <div className="rounded-lg border p-3"><p className="text-sm font-medium">کارزار بهبود کیفیت غذای سلف</p><p className="text-xs text-muted-foreground mt-1">تا ۲۰ شهریور فعال است</p><Button size="sm" variant="outline" className="mt-2">مشاهده کارزار</Button></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
