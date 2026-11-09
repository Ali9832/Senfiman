import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, DEMO_MODE, PUBLIC_TEST_MODE } from "@/lib/api";
import { DEMO_PERSONAS } from "@/lib/demoData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Building2, GraduationCap, ShieldCheck, Users } from "lucide-react";

type PersonaGroup = "student" | "organization" | "oversight";

const GROUPS: Array<{ id: PersonaGroup; label: string; description: string; icon: React.ReactNode }> = [
  { id: "student", label: "دانشجویان", description: "دانشجوی خوابگاهی یا غیردرخوابگاه", icon: <GraduationCap className="h-5 w-5" /> },
  { id: "organization", label: "مسئولان و شوراها", description: "سرپرست، همیار و شوراهای صنفی", icon: <Users className="h-5 w-5" /> },
  { id: "oversight", label: "شورای ناظر", description: "سه مقام دارای دسترسی کامل", icon: <ShieldCheck className="h-5 w-5" /> },
];

export default function AuthPage() {
  const nav = useNavigate();
  const { user, loading, refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const [signIn, setSignIn] = useState({ email: "", password: "" });
  const [signUp, setSignUp] = useState({ email: "", password: "", firstName: "", lastName: "", studentCode: "" });

  useEffect(() => { if (!PUBLIC_TEST_MODE && !loading && user) nav("/", { replace: true }); }, [user, loading, nav]);

  async function enterAs(personaId?: string) {
    setBusy(true);
    try {
      if (PUBLIC_TEST_MODE && personaId) {
        sessionStorage.setItem("public-test-persona", personaId);
        await refresh();
        nav("/", { replace: true });
        return;
      }
      await api("/api/auth/login", { method: "POST", body: JSON.stringify({ ...signIn, personaId }) });
      await refresh();
      toast.success("سطح دسترسی شما اعمال شد");
      nav("/", { replace: true });
    } catch (error) {
      toast.error("ورود ناموفق: " + (error instanceof Error ? error.message : "خطای ناشناخته"));
    } finally {
      setBusy(false);
    }
  }

  async function doSignUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/auth/signup", { method: "POST", body: JSON.stringify({ ...signUp, personaId: "student-resident" }) });
      await refresh();
      toast.success("ثبت‌نام دانشجویی انجام شد");
      nav("/", { replace: true });
    } catch (error) {
      toast.error("ثبت‌نام ناموفق: " + (error instanceof Error ? error.message : "خطای ناشناخته"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-accent/10" dir="rtl">
      <Card className="w-full max-w-3xl shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center"><Building2 className="h-7 w-7" /></div>
          <CardTitle className="text-2xl">{PUBLIC_TEST_MODE ? "انتخاب نقش آزمایشی" : "ورود به سامانه دانشجویی"}</CardTitle>
          <p className="text-sm text-muted-foreground">{PUBLIC_TEST_MODE ? "بدون نام کاربری و رمز، نقش موردنظر را برای نمایش انتخاب کنید. این انتخاب محدودیت امنیتی ایجاد نمی‌کند." : "نوع حساب، صفحه‌ها و اختیارهای قابل دسترس را تعیین می‌کند."}</p>
        </CardHeader>
        <CardContent>
          {DEMO_MODE || PUBLIC_TEST_MODE ? (
            <Tabs defaultValue="student">
              <TabsList className="grid grid-cols-3 w-full h-auto mb-5">
                {GROUPS.map((group) => <TabsTrigger key={group.id} value={group.id} className="gap-2 py-2.5">{group.icon}<span className="hidden sm:inline">{group.label}</span></TabsTrigger>)}
              </TabsList>
              {GROUPS.map((group) => (
                <TabsContent key={group.id} value={group.id} className="space-y-3">
                  <div className="rounded-xl border bg-muted/30 p-3"><p className="font-semibold">{group.label}</p><p className="text-xs text-muted-foreground mt-1">{group.description}</p></div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {DEMO_PERSONAS.filter((persona) => persona.group === group.id).map((persona) => (
                      <button key={persona.id} type="button" disabled={busy} onClick={() => enterAs(persona.id)} className="rounded-xl border p-4 text-right hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50">
                        <p className="font-semibold text-sm">{persona.label}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-5">{persona.description}</p>
                      </button>
                    ))}
                  </div>
                  {group.id === "student" && <p className="text-xs text-muted-foreground">وضعیت بومی، نوع دوره، سنوات و خوابگاه بعد از ورود در پروفایل دانشجو نگهداری می‌شود.</p>}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <Tabs defaultValue="signin">
              <TabsList className="grid grid-cols-2 w-full mb-4"><TabsTrigger value="signin">ورود</TabsTrigger><TabsTrigger value="signup">ثبت‌نام دانشجو</TabsTrigger></TabsList>
              <TabsContent value="signin">
                <form onSubmit={(e) => { e.preventDefault(); void enterAs(); }} className="space-y-3">
                  <Input type="email" placeholder="ایمیل سازمانی یا دانشگاهی" value={signIn.email} onChange={(e) => setSignIn({ ...signIn, email: e.target.value })} required />
                  <Input type="password" placeholder="رمز عبور" value={signIn.password} onChange={(e) => setSignIn({ ...signIn, password: e.target.value })} required />
                  <Button type="submit" disabled={busy} className="w-full">{busy ? "..." : "ورود"}</Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={doSignUp} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2"><Input placeholder="نام" value={signUp.firstName} onChange={(e) => setSignUp({ ...signUp, firstName: e.target.value })} required /><Input placeholder="نام خانوادگی" value={signUp.lastName} onChange={(e) => setSignUp({ ...signUp, lastName: e.target.value })} required /></div>
                  <Input placeholder="کد دانشجویی" value={signUp.studentCode} onChange={(e) => setSignUp({ ...signUp, studentCode: e.target.value })} required />
                  <Input type="email" placeholder="ایمیل دانشگاهی" value={signUp.email} onChange={(e) => setSignUp({ ...signUp, email: e.target.value })} required />
                  <Input type="password" placeholder="رمز عبور" value={signUp.password} onChange={(e) => setSignUp({ ...signUp, password: e.target.value })} minLength={8} required />
                  <Button type="submit" disabled={busy} className="w-full">{busy ? "..." : "ثبت‌نام"}</Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
