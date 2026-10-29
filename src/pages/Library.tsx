import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookMarked, AlertCircle, Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatJalaliShort, toFa, todayISO } from "@/lib/jalali";
import { cn } from "@/lib/utils";
import { useEvents } from "@/store/events";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "@/lib/api";

type Loan = {
  id: string;
  title: string;
  author: string | null;
  loan_date: string | null;
  due_date: string;
};

function daysBetween(a: string, b: string) {
  return Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export default function Library() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [status, setStatus] = useState<"loading" | "no-creds" | "ready" | "empty" | "error">("loading");
  const [refreshing, setRefreshing] = useState(false);
  const { events, add } = useEvents();
  const today = todayISO();

  const load = async (force = false) => {
    if (DEMO_MODE) {
      setLoans([
        { id: "lib1", title: "طراحی الگوریتم‌ها", author: "کورن", loan_date: "2026-08-18", due_date: "2026-09-08" },
        { id: "lib2", title: "مبانی پایگاه داده", author: "سیلبرشاتس", loan_date: "2026-08-21", due_date: "2026-09-14" },
        { id: "lib3", title: "مدیریت پروژه", author: "کرزنر", loan_date: "2026-08-12", due_date: "2026-09-03" },
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
    const arr: Loan[] = res?.data?.loans ?? [];
    setLoans(arr);
    setStatus(arr.length ? "ready" : "empty");
  };

  useEffect(() => { load(false); }, []);

  const syncedIds = useMemo(
    () => new Set(events.filter((e) => e.kind === "library").map((e) => e.id.replace("lib_", ""))),
    [events],
  );

  const syncToCalendar = () => {
    let added = 0;
    for (const l of loans) {
      if (!syncedIds.has(l.id)) {
        add({ title: `عودت: ${l.title}`, kind: "library", date: l.due_date });
        added++;
      }
    }
    toast.success(added ? `${toFa(added)} رویداد عودت به تقویم اضافه شد` : "همه‌ی کتاب‌ها قبلاً همگام‌سازی شده‌اند");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">کتابخانه</h1>
          <p className="text-muted-foreground text-sm mt-1">کتاب‌های امانتی شما — همگام با سامانه کتابخانه دانشگاه</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => load(true)} disabled={refreshing} aria-label="بارگذاری مجدد">
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
          <Button variant="outline" onClick={syncToCalendar} disabled={!loans.length} className="gap-2">
            <CalendarIcon className="h-4 w-4" /> همگام‌سازی با تقویم
          </Button>
        </div>
      </div>

      {status === "loading" && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">در حال بارگذاری...</CardContent></Card>
      )}

      {status === "no-creds" && (
        <Card className="border-amber-500/40">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookMarked className="h-4 w-4 text-primary" /> اتصال به کتابخانه نیست</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">برای مشاهده کتاب‌های امانتی، یکبار در پروفایل به سامانه کتابخانه دانشگاه متصل شوید.</p>
            <Button asChild size="sm"><Link to="/profile">رفتن به پروفایل</Link></Button>
          </CardContent>
        </Card>
      )}

      {status === "error" && (
        <Card className="border-destructive/40"><CardContent className="py-8 text-center text-muted-foreground">خطا در دریافت اطلاعات. لطفاً بعداً تلاش کنید.</CardContent></Card>
      )}

      {status === "empty" && (
        <Card className="bg-primary/5 border-primary/20"><CardContent className="py-6 text-center">
          <BookMarked className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-sm font-medium">کتاب امانتی فعالی ندارید</p>
        </CardContent></Card>
      )}

      {status === "ready" && (
        <>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-4 flex items-center gap-3">
              <BookMarked className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">{toFa(loans.length)} کتاب در امانت دارید</p>
                <p className="text-xs text-muted-foreground">با عودت به‌موقع از جریمه جلوگیری کنید</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {loans.map((l) => {
              const remaining = daysBetween(today, l.due_date);
              const overdue = remaining < 0;
              const urgent = remaining >= 0 && remaining <= 3;
              return (
                <Card key={l.id} className={cn(
                  "border-r-4 transition-all",
                  overdue ? "border-r-destructive bg-destructive/5" : urgent ? "border-r-amber-500 bg-amber-500/5" : "border-r-primary/40"
                )}>
                  <CardContent className="py-4 flex items-center gap-4">
                    <div className="w-12 h-16 rounded-md bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-2xl shrink-0">📘</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{l.title}</p>
                      {l.author && <p className="text-xs text-muted-foreground mt-0.5">{l.author}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                        {l.loan_date && <span>📥 امانت: {formatJalaliShort(l.loan_date)}</span>}
                        <span>📤 عودت: {formatJalaliShort(l.due_date)}</span>
                      </div>
                    </div>
                    <div className="text-left shrink-0">
                      {overdue ? (
                        <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> {toFa(Math.abs(remaining))} روز تأخیر</Badge>
                      ) : (
                        <Badge variant={urgent ? "default" : "outline"} className={urgent ? "bg-amber-500 hover:bg-amber-600" : ""}>
                          {toFa(remaining)} روز مانده
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
