import { useState } from "react";
import { Bell, Check, X, UtensilsCrossed, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type MealStatus = "reserved" | "available" | "closed";

type DayMeal = {
  day: string;
  date: string;
  meal: string;
  status: MealStatus;
  deadline: string;
  calories?: number;
};

const weekMeals: DayMeal[] = [
  { day: "شنبه", date: "۱ اسفند", meal: "خورشت قیمه با برنج", status: "reserved", deadline: "۱۱:۰۰", calories: 680 },
  { day: "یکشنبه", date: "۲ اسفند", meal: "خورشت فسنجان با برنج", status: "available", deadline: "۱۱:۰۰", calories: 720 },
  { day: "دوشنبه", date: "۳ اسفند", meal: "کباب کوبیده با برنج", status: "available", deadline: "۱۱:۰۰", calories: 750 },
  { day: "سه‌شنبه", date: "۴ اسفند", meal: "قرمه سبزی با برنج", status: "closed", deadline: "۱۱:۰۰", calories: 660 },
  { day: "چهارشنبه", date: "۵ اسفند", meal: "جوجه کباب با برنج", status: "available", deadline: "۱۱:۰۰", calories: 700 },
  { day: "پنج‌شنبه", date: "۶ اسفند", meal: "ماهی شکم پر با برنج", status: "available", deadline: "۱۱:۰۰", calories: 620 },
];

const statusConfig: Record<MealStatus, { label: string; color: string; badgeClass: string }> = {
  reserved: { label: "رزرو شده", color: "border-r-green-500 bg-green-500/5", badgeClass: "bg-green-100 text-green-700 border-green-200" },
  available: { label: "قابل رزرو", color: "border-r-primary/40", badgeClass: "bg-blue-100 text-blue-700 border-blue-200" },
  closed: { label: "فروش بسته شده", color: "border-r-muted-foreground/30 bg-muted/30", badgeClass: "bg-gray-100 text-gray-500 border-gray-200" },
};

export default function Meal() {
  const [meals, setMeals] = useState<DayMeal[]>(weekMeals);
  const [reminderTime, setReminderTime] = useState("30");

  const reserve = (day: string) => {
    setMeals((prev) => prev.map((m) => m.day === day && m.status === "available" ? { ...m, status: "reserved" } : m));
    toast.success("رزرو با موفقیت انجام شد ✅");
  };

  const cancel = (day: string) => {
    setMeals((prev) => prev.map((m) => m.day === day && m.status === "reserved" ? { ...m, status: "available" } : m));
    toast.info("رزرو لغو شد");
  };

  const reservedCount = meals.filter((m) => m.status === "reserved").length;
  const availableCount = meals.filter((m) => m.status === "available").length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">سامانه تغذیه</h1>
        <p className="text-muted-foreground text-sm mt-1">رزرو و مدیریت وعده‌های غذایی هفتگی</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <CardContent className="py-4">
            <p className="text-2xl font-bold text-green-600">{reservedCount}</p>
            <p className="text-xs text-muted-foreground mt-1">رزرو شده</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="py-4">
            <p className="text-2xl font-bold text-primary">{availableCount}</p>
            <p className="text-xs text-muted-foreground mt-1">قابل رزرو</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="py-4">
            <p className="text-2xl font-bold text-foreground">{meals.length - reservedCount - availableCount}</p>
            <p className="text-xs text-muted-foreground mt-1">بسته شده</p>
          </CardContent>
        </Card>
      </div>

      {/* Reminder settings */}
      <Card className="bg-accent/10 border-accent/30">
        <CardContent className="flex items-center gap-4 py-4 flex-wrap">
          <Bell className="h-5 w-5 text-accent-foreground shrink-0" />
          <p className="text-sm font-medium flex-1">یادآوری رزرو هفتگی</p>
          <Select value={reminderTime} onValueChange={setReminderTime}>
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">۳۰ دقیقه قبل از بسته شدن</SelectItem>
              <SelectItem value="60">۱ ساعت قبل</SelectItem>
              <SelectItem value="120">۲ ساعت قبل</SelectItem>
              <SelectItem value="1440">روز قبل</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={() => toast.success("یادآوری تنظیم شد 🔔")}>
            ذخیره
          </Button>
        </CardContent>
      </Card>

      {/* Unbooked warning */}
      {availableCount > 0 && (
        <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>شما {availableCount} روز رزرو نشده دارید. قبل از بسته شدن فروش اقدام کنید.</span>
        </div>
      )}

      {/* Meals list */}
      <div className="space-y-3">
        {meals.map((m) => {
          const cfg = statusConfig[m.status];
          return (
            <Card key={m.day} className={cn("border-r-4 transition-all", cfg.color)}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-foreground">{m.day}</span>
                    <span className="text-xs text-muted-foreground">{m.date}</span>
                    <Badge variant="outline" className={cn("text-xs", cfg.badgeClass)}>{cfg.label}</Badge>
                  </div>
                  <p className="text-sm text-foreground">{m.meal}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />مهلت رزرو: {m.deadline}</span>
                    {m.calories && <span>🔥 {m.calories} کالری</span>}
                  </div>
                </div>
                <div className="shrink-0">
                  {m.status === "reserved" && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                        <Check className="h-4 w-4" />
                        رزرو شده
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => cancel(m.day)}>
                        <X className="h-3 w-3 ml-1" />
                        لغو
                      </Button>
                    </div>
                  )}
                  {m.status === "available" && (
                    <Button size="sm" onClick={() => reserve(m.day)} className="h-8">
                      <UtensilsCrossed className="h-3 w-3 ml-1" />
                      رزرو
                    </Button>
                  )}
                  {m.status === "closed" && (
                    <span className="text-xs text-muted-foreground">فروش بسته شد</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
