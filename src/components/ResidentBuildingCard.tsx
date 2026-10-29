import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Building = { id: string; name: string; kind: string };

export default function ResidentBuildingCard() {
  const { user } = useAuth();
  const [dorms, setDorms] = useState<Building[]>([]);
  const [current, setCurrent] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    void Promise.all([
      api<{ buildings: Building[] }>("/api/buildings?kind=dorm"),
      api<{ profile: { residentBuildingId: string | null } | null }>("/api/profile/me"),
    ]).then(([buildingData, profileData]) => {
      setDorms(buildingData.buildings);
      setCurrent(profileData.profile?.residentBuildingId ?? "");
    }).catch((error) => toast.error(error instanceof Error ? error.message : "خطا در دریافت اطلاعات"));
  }, [user]);

  const save = async (id: string) => {
    if (!user) return;
    setCurrent(id);
    try {
      await api("/api/profile/me", {
        method: "PATCH",
        body: JSON.stringify({ residentBuildingId: id || null }),
      });
      toast.success("خوابگاه ثبت شد — اولویت میزبان برای کمد فعال است");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ثبت خوابگاه ناموفق بود");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Home className="h-4 w-4 text-primary" />خوابگاه محل سکونت
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={current} onValueChange={save}>
          <SelectTrigger><SelectValue placeholder="انتخاب کنید (اختیاری)" /></SelectTrigger>
          <SelectContent>
            {dorms.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-2">
          ساکنان هر خوابگاه در رزرو کمد همان ساختمان «میزبان» محسوب می‌شوند و اولویت دارند.
        </p>
      </CardContent>
    </Card>
  );
}
