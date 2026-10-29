import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { api, DEMO_MODE } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { toFa } from "@/lib/jalali";
import { usePreferences } from "@/store/preferences";
import { isAssetOverdue, useDormServices } from "@/store/dormServices";

type N = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export default function NotificationBell() {
  const { user } = useAuth();
  const reminders = usePreferences((state) => state.reminders);
  const [items, setItems] = useState<N[]>([]);
  const unread = items.filter((i) => !i.read_at).length;

  async function load() {
    if (!user) return;
    if (DEMO_MODE) {
      const now = new Date().toISOString();
      const demoItems: N[] = [];
      if (user.studentProfile && reminders.weeklyMealReservation) demoItems.push({ id: "meal-week", title: "مهلت رزرو غذای هفته", body: "تا فردا ساعت ۱۴ فرصت دارید وعده‌های هفته بعد را رزرو کنید.", link: "/meal", read_at: null, created_at: now });
      if (user.studentProfile && reminders.mealPickup) demoItems.push({ id: "meal-pickup", title: "دریافت ناهار رزروشده", body: "ناهار امروز رزرو شده و بازه دریافت آن آغاز شده است.", link: "/meal", read_at: null, created_at: now });
      if (user.studentProfile && reminders.mealSurvey) demoItems.push({ id: "meal-survey", title: "نظر شما درباره غذای امروز", body: "این نظرسنجی فقط به دلیل ثبت دریافت وعده برای شما فعال شده است.", link: "/surveys", read_at: null, created_at: now });
      if (user.studentProfile?.housing === "resident" && reminders.laundryTurn) {
        const reservation = useDormServices.getState().reservations.find((item) => item.userId === user.id && item.status === "booked");
        demoItems.push({ id: "laundry", title: reservation ? "یادآوری نوبت لباسشویی" : "رزرو خدمات خوابگاهی", body: reservation ? `نوبت شما در ${new Intl.DateTimeFormat("fa-IR", { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(reservation.startAt))} آغاز می‌شود.` : "نوبت‌های آزاد لباسشویی و موجودی وسایل امانی را بررسی کنید.", link: "/student-services", read_at: null, created_at: now });
      }
      const overdueAsset = useDormServices.getState().assets.find((asset) => asset.borrowerId === user.id && isAssetOverdue(asset));
      if (overdueAsset) demoItems.push({ id: `overdue-${overdueAsset.id}`, title: "مهلت امانت تمام شده است", body: `${overdueAsset.name} را هرچه زودتر بازگردانید. تا زمان بازگشت، دریافت مجدد برای اتاق محدود است.`, link: "/student-services", read_at: null, created_at: now });
      setItems(demoItems);
      return;
    }
    try {
      const { notifications } = await api<{ notifications: N[] }>("/api/notifications");
      setItems(notifications);
    } catch {
      setItems([]);
    }
  }

  useEffect(() => {
    if (!user) return;
    void load();
    const interval = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(interval);
  }, [user?.id, reminders]);

  async function markAll() {
    if (!user) return;
    if (DEMO_MODE) {
      setItems((current) => current.map((item) => ({ ...item, read_at: new Date().toISOString() })));
      return;
    }
    await api("/api/notifications/mark-all-read", { method: "POST" });
    void load();
  }

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {toFa(unread > 9 ? "9+" : unread)}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-sm font-semibold">اعلان‌ها</span>
          {unread > 0 && (
            <button className="text-xs text-primary" onClick={markAll}>
              همه را خوانده‌شده کن
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              اعلانی وجود ندارد
            </div>
          ) : (
            items.map((n) => (
              <Link
                key={n.id}
                to={n.link ?? "#"}
                className={
                  "block px-3 py-2 border-b last:border-0 hover:bg-muted/50 " +
                  (n.read_at ? "opacity-60" : "")
                }
              >
                <div className="text-sm font-medium">{n.title}</div>
                {n.body && (
                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</div>
                )}
              </Link>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
