import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Check, GraduationCap, Plus, ShieldCheck, UserCog, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { defaultPermissionsForRole, FULL_ACCESS_ROLES, ROLE_LABELS, ROLE_PERMISSIONS, ROLE_SCOPE_LABELS, type Permission, type Role } from "@/lib/access";
import { ACCESS_UNITS, PERMISSION_LABELS, useAccessManagement, type AccessCategory, type ManagedMember } from "@/store/accessManagement";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const CATEGORIES: Array<{ id: AccessCategory; label: string; icon: React.ReactNode; description: string }> = [
  { id: "student_affairs", label: "معاونت دانشجویی", icon: <ShieldCheck className="h-5 w-5" />, description: "شورای ناظر و سرپرستان خوابگاه‌ها" },
  { id: "councils", label: "شورای صنفی", icon: <Users className="h-5 w-5" />, description: "شورای مرکزی، دانشکده‌ها و خوابگاه‌ها" },
  { id: "students", label: "دانشجویان", icon: <GraduationCap className="h-5 w-5" />, description: "دانشجویان، همیاران و کارهای دانشجویی" },
];

const ROLES = Object.keys(ROLE_LABELS) as Role[];
const PERMISSIONS = Object.keys(PERMISSION_LABELS) as Permission[];

export default function AccessManagement() {
  const navigate = useNavigate();
  const { refresh, can } = useAuth();
  const { members, addMember, updateMember, togglePermission, resetPermissions } = useAccessManagement();
  const [category, setCategory] = useState<AccessCategory>("student_affairs");
  const [selectedUnitId, setSelectedUnitId] = useState("oversight");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", title: "", role: "student" as Role, studentCode: "" });
  const selectedUnit = ACCESS_UNITS.find((unit) => unit.id === selectedUnitId);
  const unitMembers = members.filter((member) => member.unitId === selectedUnitId);
  const units = ACCESS_UNITS.filter((unit) => unit.category === category);
  const canManage = can("roles.manage");

  function selectCategory(next: AccessCategory) {
    setCategory(next);
    const first = ACCESS_UNITS.find((unit) => unit.category === next);
    if (first) setSelectedUnitId(first.id);
  }

  function submitMember() {
    if (!selectedUnit || !form.name.trim() || !form.title.trim()) return toast.error("نام و عنوان سمت الزامی است");
    addMember({ unitId: selectedUnit.id, name: form.name.trim(), title: form.title.trim(), role: form.role, permissions: defaultPermissionsForRole(form.role), permissionMode: "role_default", studentCode: form.studentCode.trim() || undefined });
    setForm({ name: "", title: "", role: "student", studentCode: "" });
    setAddOpen(false);
    toast.success("عضو جدید اضافه شد");
  }

  async function impersonate(member: ManagedMember) {
    if (!selectedUnit) return;
    const studentRoles: Role[] = ["student", "block_assistant", "student_worker", "faculty_council", "dorm_council", "council_member", "council_secretary"];
    const roles = studentRoles.includes(member.role) && member.role !== "student" ? ["student", member.role] : [member.role];
    const user = {
      id: `managed-${member.id}`,
      email: `${member.id}@senfi.demo`,
      firstName: member.name.split(" ")[0] || member.name,
      lastName: member.name.split(" ").slice(1).join(" ") || member.title,
      studentCode: member.studentCode ?? null,
      roles,
      permissionOverrides: member.permissionMode === "custom" ? member.permissions : undefined,
      facultyScope: selectedUnit.scopeType === "faculty" && selectedUnit.scopeId ? [selectedUnit.scopeId] : undefined,
      dormScope: selectedUnit.scopeType === "dorm" && selectedUnit.scopeId ? [selectedUnit.scopeId] : undefined,
      studentProfile: member.studentProfile ?? (studentRoles.includes(member.role) ? { housing: selectedUnit.scopeType === "dorm" || member.role === "block_assistant" ? "resident" : "non_resident", origin: "non_local", studyType: "day", academicStanding: "eligible", facultyId: selectedUnit.scopeType === "faculty" ? selectedUnit.scopeId : "mechanical", dormId: selectedUnit.scopeType === "dorm" ? selectedUnit.scopeId : undefined } : undefined),
    };
    await api("/api/auth/login", { method: "POST", body: JSON.stringify({ user }) });
    await refresh();
    navigate("/", { replace: true });
    toast.success(`اکنون با نقش ${member.title} وارد شده‌اید`);
  }

  const summary = useMemo(() => ({ units: units.length, members: units.reduce((sum, unit) => sum + members.filter((member) => member.unitId === unit.id).length, 0) }), [units, members]);

  return <div className="max-w-6xl mx-auto space-y-5">
    <div><h1 className="text-2xl font-bold flex items-center gap-2"><UserCog className="h-6 w-6 text-primary" />مدیریت کاربران و نقش‌ها</h1><p className="text-sm text-muted-foreground mt-1">ساختار سازمانی، اعضا، سمت‌ها و سطح دسترسی هر واحد</p></div>

    <div className="grid grid-cols-3 rounded-xl bg-muted p-1 gap-1">
      {CATEGORIES.map((item) => <button key={item.id} onClick={() => selectCategory(item.id)} className={`rounded-lg px-3 py-3 flex items-center justify-center gap-2 text-sm transition ${category === item.id ? "bg-background shadow-sm font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{item.icon}<span>{item.label}</span></button>)}
    </div>

    <Card><CardContent className="py-4 flex items-center justify-between"><div><p className="font-semibold">{CATEGORIES.find((item) => item.id === category)?.label}</p><p className="text-xs text-muted-foreground mt-1">{CATEGORIES.find((item) => item.id === category)?.description}</p></div><div className="flex gap-2"><Badge variant="outline">{summary.units} واحد</Badge><Badge variant="outline">{summary.members} عضو</Badge></div></CardContent></Card>

    <div className="grid lg:grid-cols-[0.9fr_1.4fr] gap-4 items-start">
      <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-3">
        {units.map((unit) => { const count = members.filter((member) => member.unitId === unit.id).length; return <button key={unit.id} onClick={() => setSelectedUnitId(unit.id)} className={`rounded-xl border p-4 text-right transition ${selectedUnitId === unit.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "hover:border-primary/40 bg-card"}`}><div className="flex items-start justify-between gap-2"><div><p className="font-semibold">{unit.name}</p><p className="text-xs text-muted-foreground mt-1 leading-5">{unit.description}</p></div><Badge variant="secondary">{count}</Badge></div></button>; })}
      </div>

      {selectedUnit && <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3"><div><CardTitle className="text-lg">{selectedUnit.name}</CardTitle><p className="text-xs text-muted-foreground mt-1">{selectedUnit.description}</p></div>{canManage && <Dialog open={addOpen} onOpenChange={setAddOpen}><DialogTrigger asChild><Button size="sm" className="gap-1"><Plus className="h-4 w-4" />افزودن عضو</Button></DialogTrigger><DialogContent className="[direction:rtl]"><DialogHeader><DialogTitle>افزودن عضو به {selectedUnit.name}</DialogTitle></DialogHeader><div className="space-y-3"><div><Label>نام و نام خانوادگی</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div><div><Label>عنوان سمت</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثلاً دبیر شورا" /></div><div><Label>نقش پایه</Label><Select value={form.role} onValueChange={(role: Role) => setForm({ ...form, role })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ROLES.map((role) => <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>)}</SelectContent></Select><div className="mt-2 rounded-lg bg-muted/50 p-3"><p className="text-xs font-semibold">دسترسی‌های پیش‌فرض این نقش</p><div className="flex flex-wrap gap-1 mt-2">{defaultPermissionsForRole(form.role).map((permission) => <Badge key={permission} variant="outline" className="text-[10px]">{PERMISSION_LABELS[permission]}</Badge>)}</div><p className="text-[11px] text-muted-foreground mt-2">محدوده: {ROLE_SCOPE_LABELS[form.role]}</p></div></div><div><Label>شماره دانشجویی (اختیاری)</Label><Input value={form.studentCode} onChange={(e) => setForm({ ...form, studentCode: e.target.value })} /></div><Button onClick={submitMember} className="w-full">ثبت عضو</Button></div></DialogContent></Dialog>}</CardHeader>
        <CardContent className="space-y-4">
          {unitMembers.length === 0 ? <div className="py-10 text-center text-sm text-muted-foreground">هنوز عضوی برای این واحد تعریف نشده است.</div> : unitMembers.map((member) => { const effectivePermissions = member.permissionMode === "custom" ? member.permissions : defaultPermissionsForRole(member.role); const custom = member.permissionMode === "custom"; return <div key={member.id} className="rounded-xl border p-4 space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Users className="h-5 w-5" /></div><div><p className="font-semibold">{member.name}</p><p className="text-xs text-muted-foreground mt-0.5">{member.title}</p>{member.studentProfile && <p className="text-[11px] text-muted-foreground mt-1">{member.studentProfile.facultyId === "electrical" ? "دانشکده برق و کامپیوتر" : "دانشکده مکانیک"} · {member.studentProfile.housing === "resident" ? "خوابگاهی" : "غیردرخوابگاه"}</p>}</div></div><div className="flex gap-2 flex-wrap"><Badge>{ROLE_LABELS[member.role]}</Badge><Badge variant={custom ? "outline" : "secondary"}>{custom ? "دسترسی سفارشی" : "پیش‌فرض نقش"}</Badge>{custom && canManage && <Button size="sm" variant="ghost" onClick={() => resetPermissions(member.id)}>بازگردانی پیش‌فرض</Button>}{canManage && <Button size="sm" variant="outline" onClick={() => void impersonate(member)}>ورود با این نقش</Button>}</div></div>
            {canManage && <div><Label className="text-xs">نقش پایه</Label><Select value={member.role} onValueChange={(role: Role) => updateMember(member.id, { role, permissions: defaultPermissionsForRole(role), permissionMode: "role_default" })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{ROLES.map((role) => <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>)}</SelectContent></Select></div>}
            <div><div className="flex items-center justify-between mb-2"><p className="text-xs font-semibold text-muted-foreground">{custom ? "مجوزهای سفارشی" : "مجوزهای پیش‌فرض نقش"}</p><span className="text-[10px] text-muted-foreground">تغییر هر مورد، حالت را سفارشی می‌کند</span></div><div className="grid sm:grid-cols-2 gap-2">{PERMISSIONS.map((permission) => { const enabled = effectivePermissions.includes(permission); return <label key={permission} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${enabled ? "bg-primary/5 border-primary/30" : "bg-muted/20"}`}><Switch checked={enabled} disabled={!canManage} onCheckedChange={() => togglePermission(member.id, permission)} /><span className="flex-1">{PERMISSION_LABELS[permission]}</span>{enabled && <Check className="h-3.5 w-3.5 text-primary" />}</label>; })}</div></div>
          </div>; })}
        </CardContent>
      </Card>}
    </div>

    <Card>
      <CardHeader><CardTitle className="text-lg">ماتریس دسترسی نقش‌ها</CardTitle><p className="text-xs text-muted-foreground">این جدول دسترسی پایه را نشان می‌دهد. مجوزهای اختصاصی هر عضو در بالا قابل کاهش یا افزایش است و محدوده سازمانی همیشه اعمال می‌شود.</p></CardHeader>
      <CardContent className="space-y-3">
        {ROLES.map((role) => {
          const full = FULL_ACCESS_ROLES.includes(role);
          const permissions = full ? PERMISSIONS : (ROLE_PERMISSIONS[role] ?? []);
          return <div key={role} className="rounded-xl border p-4 grid md:grid-cols-[12rem_14rem_1fr] gap-3 items-start"><div><p className="font-semibold text-sm">{ROLE_LABELS[role]}</p>{full && <Badge className="mt-2">دسترسی کامل</Badge>}</div><p className="text-xs text-muted-foreground leading-5">{ROLE_SCOPE_LABELS[role]}</p><div className="flex flex-wrap gap-1.5">{permissions.map((permission) => <Badge key={permission} variant="outline" className="text-[10px]">{PERMISSION_LABELS[permission]}</Badge>)}{permissions.length === 0 && <span className="text-xs text-muted-foreground">بدون مجوز مدیریتی</span>}</div></div>;
        })}
      </CardContent>
    </Card>
  </div>;
}
