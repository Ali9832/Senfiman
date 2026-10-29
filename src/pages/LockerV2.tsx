import { useEffect, useState, useMemo } from "react";
import { Lock, CheckCircle2, Plus, Settings2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DEMO_MODE } from "@/lib/api";

const faculties = [
  { id: "mechanical",    name: "دانشکده مکانیک" },
  { id: "electrical",    name: "دانشکده برق و کامپیوتر" },
  { id: "chemistry",     name: "دانشکده شیمی" },
  { id: "industrial",    name: "دانشکده صنایع و مواد" },
  { id: "civil",         name: "دانشکده عمران" },
  { id: "basicSciences", name: "دانشکده علوم پایه" },
];

type Locker = { id: string; faculty_id: string; number: number; is_available: boolean };
type Reservation = { id: string; locker_id: string; user_id: string; status: string };
type LockerStatus = "free" | "reserved" | "unavailable";

function demoLockers(facultyId: string): Locker[] {
  const key = `demo-lockers-${facultyId}`;
  const stored = localStorage.getItem(key);
  if (stored) return JSON.parse(stored);
  const rows = Array.from({ length: 32 }, (_, index) => ({ id: `${facultyId}-${index + 1}`, faculty_id: facultyId, number: index + 1, is_available: index % 11 !== 0 }));
  localStorage.setItem(key, JSON.stringify(rows));
  return rows;
}

function demoReservations(): Reservation[] {
  return JSON.parse(localStorage.getItem("demo-locker-reservations") || "[]");
}

export default function LockerV2() {
  const { user, can } = useAuth();
  const canManage = can("lockers.manage");
  const availableFaculties = useMemo(() => {
    const allowed = user?.facultyScope?.length ? user.facultyScope : user?.studentProfile?.facultyId ? [user.studentProfile.facultyId] : faculties.map((faculty) => faculty.id);
    return faculties.filter((faculty) => allowed.includes(faculty.id));
  }, [user]);
  const [facultyId, setFacultyId] = useState<string>("");
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [myRes, setMyRes] = useState<{ res: Reservation; locker: Locker } | null>(null);
  const [pending, setPending] = useState<Locker | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState(false);

  // Load user's active reservation globally
  const loadMine = async () => {
    if (!user) return;
    if (DEMO_MODE) {
      const reservation = demoReservations().find((item) => item.user_id === user.id && item.status === "active");
      if (!reservation) return setMyRes(null);
      const locker = demoLockers(reservation.locker_id.split("-").slice(0, -1).join("-")).find((item) => item.id === reservation.locker_id);
      setMyRes(locker ? { res: reservation, locker } : null);
      return;
    }
    const { data: r } = await (supabase as any)
      .from("faculty_locker_reservations")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    if (r) {
      const { data: l } = await (supabase as any).from("faculty_lockers").select("*").eq("id", r.locker_id).single();
      setMyRes({ res: r, locker: l });
    } else {
      setMyRes(null);
    }
  };

  // Load lockers + reservations for selected faculty
  const loadFaculty = async (fid: string) => {
    if (DEMO_MODE) {
      setLockers(demoLockers(fid));
      setReservations(demoReservations());
      return;
    }
    const [{ data: ls }, { data: rs }] = await Promise.all([
      (supabase as any).from("faculty_lockers").select("*").eq("faculty_id", fid).order("number"),
      (supabase as any).from("faculty_locker_reservations").select("*").eq("status", "active"),
    ]);
    setLockers(ls || []);
    setReservations(rs || []);
  };

  useEffect(() => { loadMine(); }, [user]);
  useEffect(() => { if (!facultyId && availableFaculties[0]) setFacultyId(availableFaculties[0].id); }, [availableFaculties, facultyId]);
  useEffect(() => { if (facultyId) loadFaculty(facultyId); }, [facultyId]);

  // Realtime
  useEffect(() => {
    if (DEMO_MODE) return;
    const ch = supabase
      .channel("flr_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "faculty_locker_reservations" }, () => {
        if (facultyId) loadFaculty(facultyId);
        loadMine();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [facultyId, user]);

  const resByLockerId = useMemo(() => {
    const m = new Map<string, Reservation>();
    reservations.forEach((r) => m.set(r.locker_id, r));
    return m;
  }, [reservations]);

  const statusOf = (l: Locker): LockerStatus => {
    if (!l.is_available) return "unavailable";
    if (resByLockerId.has(l.id)) return "reserved";
    return "free";
  };

  const counts = useMemo(() => {
    let free = 0, reserved = 0, unavailable = 0;
    lockers.forEach((l) => {
      const s = statusOf(l);
      if (s === "free") free++; else if (s === "reserved") reserved++; else unavailable++;
    });
    return { free, reserved, unavailable, total: lockers.length };
  }, [lockers, resByLockerId]);

  const onLockerClick = (l: Locker) => {
    const s = statusOf(l);
    if (s !== "free") return;
    if (myRes) { toast.error("شما قبلاً یک کمد رزرو کرده‌اید. ابتدا آن را لغو کنید."); return; }
    setPending(l);
  };

  const confirmReserve = async () => {
    if (!pending || !user) return;
    setBusy(true);
    if (DEMO_MODE) {
      const next = [...demoReservations(), { id: `reservation-${Date.now()}`, locker_id: pending.id, user_id: user.id, status: "active" }];
      localStorage.setItem("demo-locker-reservations", JSON.stringify(next));
      setBusy(false);
      toast.success(`کمد شماره ${pending.number} با موفقیت رزرو شد 🎉`);
      setPending(null);
      await Promise.all([loadMine(), loadFaculty(facultyId)]);
      return;
    }
    const { error } = await (supabase as any).from("faculty_locker_reservations").insert({
      locker_id: pending.id, user_id: user.id, status: "active",
    });
    setBusy(false);
    if (error) {
      if (error.code === "23505") toast.error("این کمد قبلاً رزرو شده است");
      else toast.error("خطا: " + error.message);
      setPending(null);
      if (facultyId) loadFaculty(facultyId);
      return;
    }
    toast.success(`کمد شماره ${pending.number} با موفقیت رزرو شد 🎉`);
    setPending(null);
    await Promise.all([loadMine(), loadFaculty(facultyId)]);
  };

  const cancelReservation = async () => {
    if (!myRes) return;
    setBusy(true);
    if (DEMO_MODE) {
      localStorage.setItem("demo-locker-reservations", JSON.stringify(demoReservations().map((item) => item.id === myRes.res.id ? { ...item, status: "cancelled" } : item)));
      setBusy(false);
      setConfirmCancel(false);
      toast.success("رزرو لغو شد");
      setMyRes(null);
      if (facultyId) await loadFaculty(facultyId);
      return;
    }
    const { error } = await (supabase as any)
      .from("faculty_locker_reservations")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", myRes.res.id);
    setBusy(false);
    setConfirmCancel(false);
    if (error) { toast.error("خطا: " + error.message); return; }
    toast.success("رزرو لغو شد");
    setMyRes(null);
    if (facultyId) loadFaculty(facultyId);
  };

  const facultyName = faculties.find((f) => f.id === facultyId)?.name;
  const myFacultyName = myRes ? faculties.find((f) => f.id === myRes.locker.faculty_id)?.name : "";

  function addLocker() {
    if (!facultyId || !canManage) return;
    const nextNumber = Math.max(0, ...lockers.map((locker) => locker.number)) + 1;
    const next = [...lockers, { id: `${facultyId}-${nextNumber}`, faculty_id: facultyId, number: nextNumber, is_available: true }];
    setLockers(next);
    if (DEMO_MODE) localStorage.setItem(`demo-lockers-${facultyId}`, JSON.stringify(next));
    toast.success(`کمد شماره ${nextNumber} اضافه شد`);
  }

  function toggleLastLocker() {
    if (!facultyId || !canManage) return;
    const target = [...lockers].reverse().find((locker) => !resByLockerId.has(locker.id));
    if (!target) return toast.error("کمد قابل تغییر وجود ندارد");
    const next = lockers.map((locker) => locker.id === target.id ? { ...locker, is_available: !locker.is_available } : locker);
    setLockers(next);
    if (DEMO_MODE) localStorage.setItem(`demo-lockers-${facultyId}`, JSON.stringify(next));
    toast.success(`وضعیت کمد شماره ${target.number} تغییر کرد`);
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">کمد دانشکده</h1>
        <p className="text-sm text-muted-foreground">رزرو دانشجو و مدیریت کمدهای هر دانشکده در یک صفحه یکپارچه</p>
      </div>

      {myRes && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-md bg-green-50 border border-green-300 text-green-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            <span>کمد شماره {myRes.locker.number} ({myFacultyName}) به شما تعلق دارد.</span>
          </div>
          <Button size="sm" variant="destructive" onClick={() => setConfirmCancel(true)}>لغو رزرو</Button>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>انتخاب دانشکده</CardTitle></CardHeader>
        <CardContent>
          <Select value={facultyId} onValueChange={setFacultyId}>
            <SelectTrigger><SelectValue placeholder="یک دانشکده انتخاب کنید" /></SelectTrigger>
            <SelectContent>
              {availableFaculties.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {canManage && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2"><Settings2 className="h-5 w-5 text-primary" /><div><p className="text-sm font-semibold">مدیریت کمدهای {facultyName ?? "دانشکده"}</p><p className="text-xs text-muted-foreground">شورای هر دانشکده فقط محدوده اختصاص‌یافته به خود را مدیریت می‌کند.</p></div></div>
            <div className="flex gap-2"><Button size="sm" variant="outline" onClick={toggleLastLocker}>تغییر وضعیت آخرین کمد</Button><Button size="sm" onClick={addLocker} className="gap-1"><Plus className="h-4 w-4" />افزودن کمد</Button></div>
          </CardContent>
        </Card>
      )}

      {!facultyId ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-3">
            <Lock className="h-7 w-7" />
          </div>
          <p>ابتدا دانشکده را انتخاب کنید</p>
        </div>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{facultyName}</Badge>
              <Badge variant="outline">{counts.total} کمد</Badge>
              <Badge className="bg-green-600">{counts.free} آزاد</Badge>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-muted border" /> آزاد ({counts.free})</span>
              <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-green-200 border border-green-400" /> رزرو شده ({counts.reserved})</span>
              <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-red-200 border border-red-400" /> غیرقابل رزرو</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
              {lockers.map((l) => {
                const s = statusOf(l);
                const isMine = myRes?.locker.id === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => onLockerClick(l)}
                    disabled={s !== "free"}
                    className={cn(
                      "aspect-square rounded-md border flex flex-col items-center justify-center text-xs font-medium transition",
                      s === "free" && "bg-muted/40 hover:bg-primary hover:text-primary-foreground cursor-pointer",
                      s === "reserved" && "bg-green-100 text-green-800 border-green-400 cursor-not-allowed",
                      s === "unavailable" && "bg-red-100 text-red-700 border-red-300 opacity-60 cursor-not-allowed",
                      isMine && "ring-2 ring-primary",
                    )}
                  >
                    <Lock className="h-3 w-3 mb-0.5" />
                    <span>{l.number}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأیید رزرو کمد</AlertDialogTitle>
            <AlertDialogDescription>
              آیا می‌خواهید کمد شماره {pending?.number} در {facultyName} را رزرو کنید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReserve} disabled={busy}>
              {busy ? "در حال پردازش..." : "بله، رزرو کن"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>لغو رزرو کمد</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از لغو رزرو کمد شماره {myRes?.locker.number} مطمئن هستید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={cancelReservation} disabled={busy} className="bg-destructive hover:bg-destructive/90">
              {busy ? "..." : "بله، لغو کن"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
