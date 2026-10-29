import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, Users, BarChart3, Trash2, Plus } from "lucide-react";

type Building = { id: string; name: string; kind: string; capacity: number | null };
type Profile = { id: string; first_name: string | null; last_name: string | null; student_code: string | null };
type Role = "student" | "council_member" | "admin" | "warden" | "services" | "warehouse" | "council_secretary" | "central_council";
const ROLE_LABELS: Record<Role, string> = {
  student: "دانشجو",
  council_member: "شورا",
  admin: "ادمین",
  warden: "سرپرست",
  services: "مجری",
  warehouse: "انباردار",
  council_secretary: "دبیر شورا",
  central_council: "شورای مرکزی",
};

export default function Admin() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<string>("faculty");
  const [busy, setBusy] = useState(false);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [roles, setRoles] = useState<Record<string, Role[]>>({});
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    studentCode: "",
    email: "",
    password: "",
    role: "student" as Role,
  });
  const [creatingUser, setCreatingUser] = useState(false);

  const [stats, setStats] = useState<{ users: number; transfers: number; lockers: number; qc: number } | null>(null);

  const loadAll = async () => {
    try {
      const data = await api<{
        buildings: Building[];
        profiles: Profile[];
        roles: { user_id: string; role: Role }[];
        stats: { users: number; transfers: number; lockers: number; qc: number };
      }>("/api/admin/overview");
      setBuildings(data.buildings);
      setProfiles(data.profiles);
      const map: Record<string, Role[]> = {};
      data.roles.forEach((row) => { (map[row.user_id] ||= []).push(row.role); });
      setRoles(map);
      setStats(data.stats);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "دریافت اطلاعات مدیریت ناموفق بود");
    }
  };

  useEffect(() => { loadAll(); }, []);

  const addBuilding = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    try {
      await api("/api/admin/buildings", {
        method: "POST",
        body: JSON.stringify({ name: newName.trim(), kind: newKind }),
      });
      toast.success("ساختمان اضافه شد");
      setNewName("");
      void loadAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "افزودن ساختمان ناموفق بود");
    } finally {
      setBusy(false);
    }
  };

  const removeBuilding = async (id: string) => {
    if (!confirm("حذف این ساختمان؟")) return;
    try {
      await api(`/api/admin/buildings/${id}`, { method: "DELETE" });
      void loadAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حذف ساختمان ناموفق بود");
    }
  };

  const toggleRole = async (uid: string, role: Role) => {
    const has = roles[uid]?.includes(role);
    try {
      await api(`/api/admin/users/${uid}/roles/${role}`, {
        method: "PUT",
        body: JSON.stringify({ enabled: !has }),
      });
      toast.success("نقش به‌روزرسانی شد");
      void loadAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "به‌روزرسانی نقش ناموفق بود");
    }
  };

  const createUser = async () => {
    if (!newUser.firstName.trim() || !newUser.lastName.trim() || !newUser.studentCode.trim() || !newUser.email.trim() || newUser.password.length < 8) {
      return toast.error("نام، نام خانوادگی، کد دانشجویی، ایمیل و رمز حداقل ۸ کاراکتری الزامی هستند");
    }
    setCreatingUser(true);
    try {
      await api("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          firstName: newUser.firstName.trim(),
          lastName: newUser.lastName.trim(),
          studentCode: newUser.studentCode.trim(),
          email: newUser.email.trim(),
          password: newUser.password,
          roles: [newUser.role],
        }),
      });
      toast.success("کاربر ایجاد شد");
      setNewUser({ firstName: "", lastName: "", studentCode: "", email: "", password: "", role: "student" });
      void loadAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ایجاد کاربر ناموفق بود");
    } finally {
      setCreatingUser(false);
    }
  };

  const filtered = profiles.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [p.first_name, p.last_name, p.student_code].some((v) => v?.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-primary" /> پنل مدیریت
        <Badge variant="secondary">نقش: ادمین</Badge>
      </h1>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "کاربران", value: stats.users },
            { label: "انتقال غذا", value: stats.transfers },
            { label: "رزرو کمد", value: stats.lockers },
            { label: "بازرسی QC", value: stats.qc },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-primary">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="buildings">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="buildings"><Building2 className="h-4 w-4 ml-1" />ساختمان‌ها</TabsTrigger>
          <TabsTrigger value="users"><Users className="h-4 w-4 ml-1" />کاربران و نقش‌ها</TabsTrigger>
        </TabsList>

        <TabsContent value="buildings">
          <Card>
            <CardHeader><CardTitle className="text-base">افزودن ساختمان</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Input placeholder="نام ساختمان" value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1 min-w-[200px]" />
                <Select value={newKind} onValueChange={setNewKind}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="faculty">دانشکده</SelectItem>
                    <SelectItem value="dorm">خوابگاه</SelectItem>
                    <SelectItem value="cafeteria">سلف</SelectItem>
                    <SelectItem value="other">سایر</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={addBuilding} disabled={busy} className="gap-1"><Plus className="h-4 w-4" />افزودن</Button>
              </div>
              <div className="space-y-1">
                {buildings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{b.name}</span>
                      <Badge variant="secondary" className="text-[10px]">{b.kind}</Badge>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => removeBuilding(b.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">ایجاد کاربر جدید</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input placeholder="نام" value={newUser.firstName} onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })} />
                  <Input placeholder="نام خانوادگی" value={newUser.lastName} onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input placeholder="کد دانشجویی" value={newUser.studentCode} onChange={(e) => setNewUser({ ...newUser, studentCode: e.target.value })} />
                  <Input type="email" placeholder="ایمیل" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input type="password" placeholder="رمز عبور (حداقل ۸ کاراکتر)" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
                  <Select value={newUser.role} onValueChange={(role: Role) => setNewUser({ ...newUser, role })}>
                    <SelectTrigger><SelectValue placeholder="نقش اولیه" /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
                        <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createUser} disabled={creatingUser} className="gap-1">
                  <Plus className="h-4 w-4" />ایجاد کاربر
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 space-y-3">
                <Input placeholder="جستجو با نام یا کد دانشجویی..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                {filtered.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded-lg flex-wrap">
                      <div className="text-sm min-w-0">
                        <p className="font-medium truncate">{[p.first_name, p.last_name].filter(Boolean).join(" ") || "—"}</p>
                        <p className="text-xs text-muted-foreground">{p.student_code ?? "—"}</p>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {(["council_member", "admin", "warden", "services", "warehouse", "council_secretary", "central_council"] as Role[]).map((r) => (
                          <Button
                            key={r}
                            size="sm"
                            variant={roles[p.id]?.includes(r) ? "default" : "outline"}
                            onClick={() => toggleRole(p.id, r)}
                          >
                            {ROLE_LABELS[r]}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
