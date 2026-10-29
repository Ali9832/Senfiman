import { useMemo, useState } from "react";
import { AlertTriangle, BriefcaseBusiness, CheckCircle2, Clock3, Dumbbell, Plus, ScanLine, Settings2, Timer, WashingMachine } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { isAssetOverdue, useDormServices, type DormAsset, type LaundryReservation } from "@/store/dormServices";
import { useStudentServices, type StudentService } from "@/store/studentServices";
import { toast } from "sonner";

const CATEGORY_LABELS: Record<DormAsset["category"], string> = { vacuum: "جاروبرقی", iron: "اتو", sports: "وسایل ورزشی", other: "سایر" };

function faDateTime(value: string) {
  return new Intl.DateTimeFormat("fa-IR", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function remaining(value?: string) {
  if (!value) return "—";
  const minutes = Math.round((new Date(value).getTime() - Date.now()) / 60000);
  if (minutes < 0) return `${Math.abs(minutes)} دقیقه تأخیر`;
  if (minutes < 60) return `${minutes} دقیقه باقی‌مانده`;
  return `${Math.floor(minutes / 60)} ساعت و ${minutes % 60} دقیقه باقی‌مانده`;
}

export default function StudentServices() {
  const { user, can } = useAuth();
  const dorm = useDormServices();
  const jobs = useStudentServices();
  const isResident = user?.studentProfile?.housing === "resident";
  const canOperate = can("dorm_services.operate");
  const canManage = can("dorm_services.manage");
  const canDefineJobs = can("student_jobs.manage");
  const [reserveOpen, setReserveOpen] = useState(false);
  const [confirmReservationOpen, setConfirmReservationOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState("");
  const [selectedStart, setSelectedStart] = useState("");
  const [checkoutAsset, setCheckoutAsset] = useState<DormAsset | null>(null);
  const [checkout, setCheckout] = useState({ name: "", studentCode: "", room: "", hours: "2", cardImageName: "" });
  const [replacement, setReplacement] = useState<LaundryReservation | null>(null);
  const [replacementForm, setReplacementForm] = useState({ name: "", studentCode: "", room: "", cardImageName: "" });
  const [jobOpen, setJobOpen] = useState(false);
  const [jobForm, setJobForm] = useState<Omit<StudentService, "id">>({ title: "", category: "student_job", audience: "dorm_students", description: "" });
  const [assetOpen, setAssetOpen] = useState(false);
  const [assetForm, setAssetForm] = useState({ name: "", category: "other" as DormAsset["category"], dormId: "aminian", location: "" });

  const scopedDormIds = useMemo(() => {
    if (canManage) return [];
    const scopes = user?.dormScope?.map((scope) => scope.split(":")[0]) ?? [];
    if (user?.studentProfile?.dormId) scopes.push(user.studentProfile.dormId);
    return [...new Set(scopes)];
  }, [canManage, user]);
  const availableMachines = dorm.machines.filter((machine) => machine.active && (scopedDormIds.length === 0 || scopedDormIds.includes(machine.dormId)));
  const visibleAssets = dorm.assets.filter((asset) => scopedDormIds.length === 0 || scopedDormIds.includes(asset.dormId || (asset.location.includes("ریحانه") ? "reyhaneh" : "aminian")));
  const visibleReservations = dorm.reservations.filter((reservation) => canManage || availableMachines.some((machine) => machine.id === reservation.machineId));

  const slots = useMemo(() => {
    const rows: Array<{ start: string; end: string; label: string }> = [];
    for (let day = 1; day <= 7; day++) {
      for (let hour = 8; hour < 23; hour++) {
        const start = new Date();
        start.setDate(start.getDate() + day);
        start.setHours(hour, 0, 0, 0);
        const end = new Date(start.getTime() + dorm.settings.slotMinutes * 60000);
        rows.push({ start: start.toISOString(), end: end.toISOString(), label: faDateTime(start.toISOString()) });
      }
    }
    return rows;
  }, [dorm.settings.slotMinutes]);

  const blockedRooms = useMemo(() => new Set(visibleAssets.filter((asset) => asset.category === "vacuum" && isAssetOverdue(asset) && asset.room).map((asset) => asset.room!)), [visibleAssets]);
  const myReservations = dorm.reservations.filter((item) => item.userId === user?.id && ["booked", "checked_in"].includes(item.status));
  const selectedSlot = slots.find((slot) => slot.start === selectedStart);
  const slotTaken = !!dorm.reservations.find((item) => item.machineId === selectedMachine && item.startAt === selectedStart && item.status !== "missed");

  function reviewReservation() {
    if (!user || !selectedMachine || !selectedSlot) return toast.error("دستگاه و نوبت را انتخاب کنید");
    if (slotTaken) return toast.error("این نوبت قبلاً رزرو شده است");
    setReserveOpen(false);
    setConfirmReservationOpen(true);
  }

  function reserve() {
    if (!user || !selectedMachine || !selectedSlot) return toast.error("دستگاه و نوبت را انتخاب کنید");
    if (slotTaken) return toast.error("این نوبت قبلاً رزرو شده است");
    dorm.reserveLaundry({ machineId: selectedMachine, startAt: selectedSlot.start, endAt: selectedSlot.end, userId: user.id, studentName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(), studentCode: user.studentCode ?? "", room: user.studentProfile?.blockId ?? "ثبت نشده" });
    setReserveOpen(false);
    setConfirmReservationOpen(false);
    setSelectedStart("");
    toast.success("نوبت لباسشویی رزرو شد");
  }

  function lendAsset() {
    if (!checkoutAsset || !checkout.name.trim() || !checkout.studentCode.trim() || !checkout.room.trim()) return toast.error("اطلاعات دانشجو و اتاق کامل نیست");
    if (blockedRooms.has(checkout.room) && checkoutAsset.category === "vacuum") return toast.error("این اتاق به علت تأخیر قبلی امکان دریافت جاروبرقی ندارد");
    if (!checkout.cardImageName) return toast.error("تصویر کارت دانشجویی را ثبت کنید");
    const borrowedAt = new Date();
    const dueAt = new Date(borrowedAt.getTime() + Number(checkout.hours) * 60 * 60 * 1000);
    dorm.checkoutAsset(checkoutAsset.id, { borrowerId: `student-${checkout.studentCode}`, borrowerName: checkout.name, studentCode: checkout.studentCode, room: checkout.room, borrowedAt: borrowedAt.toISOString(), dueAt: dueAt.toISOString(), cardImageName: checkout.cardImageName });
    setCheckoutAsset(null);
    setCheckout({ name: "", studentCode: "", room: "", hours: "2", cardImageName: "" });
    toast.success("تحویل وسیله و کارت دانشجویی ثبت شد");
  }

  function replaceSlot() {
    if (!replacement || !replacementForm.name || !replacementForm.studentCode || !replacementForm.cardImageName) return toast.error("اطلاعات و تصویر کارت دانشجوی جایگزین کامل نیست");
    dorm.updateReservation(replacement.id, { studentName: replacementForm.name, studentCode: replacementForm.studentCode, room: replacementForm.room, userId: `student-${replacementForm.studentCode}`, replacedStudentName: replacement.studentName, replacementCardImageName: replacementForm.cardImageName });
    setReplacement(null);
    setReplacementForm({ name: "", studentCode: "", room: "", cardImageName: "" });
    toast.success("نوبت سوخته به دانشجوی جایگزین واگذار شد");
  }

  function addJob() {
    if (!jobForm.title.trim()) return toast.error("عنوان کار دانشجویی الزامی است");
    jobs.addService({ ...jobForm, title: jobForm.title.trim() });
    setJobOpen(false);
    setJobForm({ title: "", category: "student_job", audience: "dorm_students", description: "" });
    toast.success("کار دانشجویی تعریف شد");
  }

  function addAsset() {
    if (!assetForm.name.trim() || !assetForm.location.trim()) return toast.error("نام و محل نگهداری را وارد کنید");
    dorm.addAsset(assetForm);
    setAssetOpen(false);
    setAssetForm({ name: "", category: "other", dormId: "aminian", location: "" });
    toast.success("وسیله جدید اضافه شد");
  }

  if (!isResident && !canOperate && !canManage) {
    const publicJobs = jobs.services.filter((item) => item.category === "student_job" && item.audience === "all_students");
    return <div className="max-w-5xl mx-auto space-y-5">
      <div><h1 className="text-2xl font-bold">فرصت‌های کار دانشجویی</h1><p className="text-sm text-muted-foreground mt-1">فرصت‌های قابل ثبت‌نام برای همه دانشجویان</p></div>
      <Card className="border-blue-500/30 bg-blue-500/5"><CardContent className="py-4 flex gap-3"><BriefcaseBusiness className="h-5 w-5 text-blue-600 shrink-0" /><div><p className="text-sm font-semibold">حساب غیردرخوابگاه</p><p className="text-xs text-muted-foreground mt-1">رزرو لباسشویی، موجودی وسایل خوابگاه و امانت تجهیزات فقط برای دانشجویان ساکن خوابگاه نمایش داده می‌شود.</p></div></CardContent></Card>
      <div className="grid md:grid-cols-2 gap-4">{publicJobs.length ? publicJobs.map((job) => <Card key={job.id}><CardContent className="py-5"><BriefcaseBusiness className="h-6 w-6 text-primary" /><p className="font-semibold mt-3">{job.title}</p><p className="text-sm text-muted-foreground mt-1">{job.description}</p><Badge variant="outline" className="mt-3">ویژه همه دانشجویان</Badge></CardContent></Card>) : <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">در حال حاضر فرصت عمومی فعالی وجود ندارد.</CardContent></Card>}</div>
    </div>;
  }

  return <div className="max-w-6xl mx-auto space-y-5">
    <div className="flex items-start justify-between gap-3 flex-wrap"><div><h1 className="text-2xl font-bold">خدمات خوابگاهی و کار دانشجویی</h1><p className="text-sm text-muted-foreground mt-1">رزرو نوبت، مشاهده موجودی و ثبت تحویل خدمات</p></div><div className="flex gap-2">{canDefineJobs && <Dialog open={jobOpen} onOpenChange={setJobOpen}><DialogTrigger asChild><Button variant="outline" className="gap-1"><BriefcaseBusiness className="h-4 w-4" />تعریف کار</Button></DialogTrigger><DialogContent className="[direction:rtl]"><DialogHeader><DialogTitle>تعریف کار دانشجویی</DialogTitle></DialogHeader><div className="space-y-3"><div><Label>عنوان</Label><Input value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} placeholder="مثلاً مسئول تحویل جاروبرقی" /></div><div><Label>توضیح وظایف</Label><Input value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} /></div><Select value={jobForm.audience} onValueChange={(audience: StudentService["audience"]) => setJobForm({ ...jobForm, audience })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="dorm_students">دانشجویان خوابگاهی</SelectItem><SelectItem value="all_students">همه دانشجویان</SelectItem></SelectContent></Select><Button className="w-full" onClick={addJob}>انتشار</Button></div></DialogContent></Dialog>}{canManage && <Dialog open={assetOpen} onOpenChange={setAssetOpen}><DialogTrigger asChild><Button className="gap-1"><Plus className="h-4 w-4" />افزودن وسیله</Button></DialogTrigger><DialogContent className="[direction:rtl]"><DialogHeader><DialogTitle>افزودن وسیله امانی</DialogTitle></DialogHeader><div className="space-y-3"><div><Label>نام وسیله</Label><Input value={assetForm.name} onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })} /></div><Select value={assetForm.category} onValueChange={(category: DormAsset["category"]) => setAssetForm({ ...assetForm, category })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="vacuum">جاروبرقی</SelectItem><SelectItem value="iron">اتو</SelectItem><SelectItem value="sports">ورزشی</SelectItem><SelectItem value="other">سایر</SelectItem></SelectContent></Select><div><Label>خوابگاه</Label><Select value={assetForm.dormId} onValueChange={(dormId) => setAssetForm({ ...assetForm, dormId })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="aminian">خوابگاه پسرانه امینیان</SelectItem><SelectItem value="reyhaneh">خوابگاه دخترانه ریحانه</SelectItem></SelectContent></Select></div><div><Label>محل نگهداری</Label><Input value={assetForm.location} onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })} /></div><Button className="w-full" onClick={addAsset}>ثبت وسیله</Button></div></DialogContent></Dialog>}</div></div>

    {!isResident && !canOperate && !canManage && <Card className="border-amber-500/40 bg-amber-500/5"><CardContent className="py-4 flex gap-3"><AlertTriangle className="h-5 w-5 text-amber-600" /><div><p className="text-sm font-semibold">خدمات رزروی ویژه دانشجویان خوابگاهی است</p><p className="text-xs text-muted-foreground mt-1">وضعیت موجودی قابل مشاهده است، اما رزرو و امانت برای حساب شما فعال نیست.</p></div></CardContent></Card>}

    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="grid grid-cols-4 h-auto"><TabsTrigger value="overview" className="gap-1 py-2"><Timer className="h-4 w-4" />نمای کلی</TabsTrigger><TabsTrigger value="laundry" className="gap-1 py-2"><WashingMachine className="h-4 w-4" />لباسشویی</TabsTrigger><TabsTrigger value="assets" className="gap-1 py-2"><Dumbbell className="h-4 w-4" />وسایل امانی</TabsTrigger><TabsTrigger value="jobs" className="gap-1 py-2"><BriefcaseBusiness className="h-4 w-4" />کارها</TabsTrigger></TabsList>

      <TabsContent value="overview" className="space-y-4">
        {myReservations.map((reservation) => <Card key={reservation.id} className="border-blue-500/40 bg-blue-500/5"><CardContent className="py-4 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><Clock3 className="h-5 w-5 text-blue-600" /><div><p className="font-semibold">نوبت لباسشویی شما</p><p className="text-sm text-muted-foreground mt-1">{faDateTime(reservation.startAt)} · {dorm.machines.find((item) => item.id === reservation.machineId)?.name}</p></div></div><Badge>{reservation.status === "checked_in" ? "حضور تأیید شد" : "رزرو شده"}</Badge></CardContent></Card>)}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"><Card><CardContent className="py-5"><WashingMachine className="h-6 w-6 text-primary" /><p className="font-semibold mt-3">لباسشویی</p><p className="text-xs text-muted-foreground mt-1">{availableMachines.length} دستگاه فعال</p></CardContent></Card><Card><CardContent className="py-5"><Dumbbell className="h-6 w-6 text-primary" /><p className="font-semibold mt-3">وسایل آزاد</p><p className="text-xs text-muted-foreground mt-1">{visibleAssets.filter((item) => item.status === "available").length} مورد قابل تحویل</p></CardContent></Card><Card><CardContent className="py-5"><Clock3 className="h-6 w-6 text-amber-600" /><p className="font-semibold mt-3">در امانت</p><p className="text-xs text-muted-foreground mt-1">{visibleAssets.filter((item) => item.status === "borrowed").length} مورد</p></CardContent></Card><Card className={blockedRooms.size ? "border-destructive/40" : ""}><CardContent className="py-5"><AlertTriangle className="h-6 w-6 text-destructive" /><p className="font-semibold mt-3">اتاق مسدود</p><p className="text-xs text-muted-foreground mt-1">{blockedRooms.size} اتاق به علت تأخیر</p></CardContent></Card></div>
      </TabsContent>

      <TabsContent value="laundry" className="space-y-4">
        <div className="flex justify-between gap-3 flex-wrap"><div><h2 className="font-bold text-lg">رزرو لباسشویی</h2><p className="text-xs text-muted-foreground mt-1">رزرو هفتگی به‌طور پیش‌فرض جمعه ساعت {dorm.settings.bookingOpenHour} تا {dorm.settings.bookingCloseHour} باز می‌شود.</p></div>{(isResident || canManage) && <Dialog open={reserveOpen} onOpenChange={setReserveOpen}><DialogTrigger asChild><Button className="gap-1"><Plus className="h-4 w-4" />رزرو نوبت</Button></DialogTrigger><DialogContent className="[direction:rtl]"><DialogHeader><DialogTitle>درخواست نوبت لباسشویی</DialogTitle></DialogHeader><div className="space-y-3"><div><Label>دستگاه</Label><Select value={selectedMachine} onValueChange={setSelectedMachine}><SelectTrigger><SelectValue placeholder="انتخاب دستگاه" /></SelectTrigger><SelectContent>{availableMachines.map((machine) => <SelectItem key={machine.id} value={machine.id}>{machine.name} · {machine.block}</SelectItem>)}</SelectContent></Select></div><div><Label>زمان</Label><Select value={selectedStart} onValueChange={setSelectedStart}><SelectTrigger><SelectValue placeholder="انتخاب نوبت" /></SelectTrigger><SelectContent>{slots.map((slot) => { const taken = dorm.reservations.some((item) => item.machineId === selectedMachine && item.startAt === slot.start && item.status !== "missed"); return <SelectItem key={slot.start} value={slot.start} disabled={taken}>{slot.label}{taken ? " · پر" : " · آزاد"}</SelectItem>; })}</SelectContent></Select></div><Button className="w-full" onClick={reviewReservation}>بررسی و تأیید نوبت</Button></div></DialogContent></Dialog>}</div>
        {canManage && <Card className="border-primary/30"><CardHeader><CardTitle className="text-base flex items-center gap-2"><Settings2 className="h-4 w-4" />تنظیم قواعد رزرو</CardTitle></CardHeader><CardContent className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3"><div><Label className="text-xs">روز بازشدن رزرو</Label><Select value={String(dorm.settings.bookingWeekday)} onValueChange={(value) => dorm.updateSettings({ bookingWeekday: Number(value) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="5">جمعه</SelectItem><SelectItem value="4">پنج‌شنبه</SelectItem><SelectItem value="6">شنبه</SelectItem></SelectContent></Select></div><div><Label className="text-xs">ساعت شروع ثبت هفتگی</Label><Input type="number" value={dorm.settings.bookingOpenHour} onChange={(e) => dorm.updateSettings({ bookingOpenHour: Number(e.target.value) })} /></div><div><Label className="text-xs">ساعت پایان</Label><Input type="number" value={dorm.settings.bookingCloseHour} onChange={(e) => dorm.updateSettings({ bookingCloseHour: Number(e.target.value) })} /></div><div><Label className="text-xs">حداقل فاصله رزرو (ساعت)</Label><Input type="number" value={dorm.settings.minAdvanceHours} onChange={(e) => dorm.updateSettings({ minAdvanceHours: Number(e.target.value) })} /></div><div><Label className="text-xs">مهلت تأخیر (دقیقه)</Label><Input type="number" value={dorm.settings.graceMinutes} onChange={(e) => dorm.updateSettings({ graceMinutes: Number(e.target.value) })} /></div><div><Label className="text-xs">مدت هر نوبت (دقیقه)</Label><Input type="number" value={dorm.settings.slotMinutes} onChange={(e) => dorm.updateSettings({ slotMinutes: Number(e.target.value) })} /></div></CardContent></Card>}
        {(canOperate || canManage) && <Card><CardHeader><CardTitle className="text-base">کنترل حضور و جایگزینی نوبت</CardTitle></CardHeader><CardContent className="space-y-2">{visibleReservations.length === 0 ? <p className="text-sm text-muted-foreground py-6 text-center">رزروی ثبت نشده است.</p> : visibleReservations.map((reservation) => <div key={reservation.id} className="rounded-xl border p-3 flex items-center justify-between gap-3 flex-wrap"><div><p className="text-sm font-semibold">{reservation.studentName} · {reservation.studentCode}</p><p className="text-xs text-muted-foreground mt-1">{faDateTime(reservation.startAt)} · اتاق {reservation.room}</p>{reservation.replacedStudentName && <p className="text-[11px] text-amber-600 mt-1">جایگزین نوبت {reservation.replacedStudentName}</p>}</div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => dorm.updateReservation(reservation.id, { status: "checked_in" })}><ScanLine className="h-4 w-4 ml-1" />تأیید کارت</Button><Button size="sm" variant="secondary" disabled={Date.now() < new Date(reservation.startAt).getTime() + dorm.settings.graceMinutes * 60000} onClick={() => setReplacement(reservation)}>جایگزینی پس از {dorm.settings.graceMinutes} دقیقه</Button></div></div>)}</CardContent></Card>}
      </TabsContent>

      <TabsContent value="assets" className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">{visibleAssets.map((asset) => { const overdue = isAssetOverdue(asset); return <Card key={asset.id} className={overdue ? "border-destructive/50" : ""}><CardHeader className="pb-2"><div className="flex items-start justify-between gap-2"><div><CardTitle className="text-base">{asset.name}</CardTitle><p className="text-xs text-muted-foreground mt-1">{asset.location}</p></div><Badge variant={asset.status === "available" ? "secondary" : overdue ? "destructive" : "outline"}>{asset.status === "available" ? "آزاد" : asset.status === "maintenance" ? "خارج از سرویس" : overdue ? "دارای تأخیر" : "در امانت"}</Badge></div></CardHeader><CardContent>{asset.status === "borrowed" ? <div className="space-y-2"><p className="text-sm">تحویل به: <span className="font-semibold">{asset.borrowerName}</span> · اتاق {asset.room}</p><p className={`text-xs ${overdue ? "text-destructive font-semibold" : "text-muted-foreground"}`}>{remaining(asset.dueAt)}</p><p className="text-xs text-muted-foreground">موعد تحویل: {asset.dueAt ? faDateTime(asset.dueAt) : "—"}</p>{canOperate || canManage ? <Button size="sm" onClick={() => { dorm.returnAsset(asset.id); toast.success("بازگشت وسیله و تحویل کارت ثبت شد"); }}>ثبت بازگشت و تحویل کارت</Button> : null}</div> : <div className="flex items-center justify-between gap-2"><p className="text-sm text-emerald-700 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" />آماده تحویل</p>{(canOperate || canManage) && <Button size="sm" variant="outline" onClick={() => setCheckoutAsset(asset)}>ثبت امانت</Button>}</div>}</CardContent></Card>; })}</div>
      </TabsContent>

      <TabsContent value="jobs" className="space-y-3"><div className="grid md:grid-cols-2 gap-4">{jobs.services.filter((item) => item.category === "student_job").map((job) => <Card key={job.id}><CardContent className="py-5"><BriefcaseBusiness className="h-6 w-6 text-primary" /><p className="font-semibold mt-3">{job.title}</p><p className="text-sm text-muted-foreground mt-1">{job.description}</p><Badge variant="outline" className="mt-3">{job.audience === "dorm_students" ? "ویژه خوابگاه" : "همه دانشجویان"}</Badge></CardContent></Card>)}</div></TabsContent>
    </Tabs>

    <Dialog open={!!checkoutAsset} onOpenChange={(open) => !open && setCheckoutAsset(null)}><DialogContent className="[direction:rtl]"><DialogHeader><DialogTitle>ثبت امانت {checkoutAsset?.name}</DialogTitle></DialogHeader><div className="space-y-3"><div><Label>نام دانشجو</Label><Input value={checkout.name} onChange={(e) => setCheckout({ ...checkout, name: e.target.value })} /></div><div className="grid grid-cols-2 gap-2"><div><Label>شماره دانشجویی</Label><Input value={checkout.studentCode} onChange={(e) => setCheckout({ ...checkout, studentCode: e.target.value })} /></div><div><Label>اتاق</Label><Input value={checkout.room} onChange={(e) => setCheckout({ ...checkout, room: e.target.value })} /></div></div><div><Label>مدت امانت</Label><Select value={checkout.hours} onValueChange={(hours) => setCheckout({ ...checkout, hours })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">۱ ساعت</SelectItem><SelectItem value="2">۲ ساعت</SelectItem><SelectItem value="3">۳ ساعت</SelectItem></SelectContent></Select></div><div><Label>تصویر کارت دانشجویی</Label><Input type="file" accept="image/*" capture="environment" onChange={(e) => setCheckout({ ...checkout, cardImageName: e.target.files?.[0]?.name ?? "" })} /><p className="text-[11px] text-muted-foreground mt-1">تصویر فقط تا زمان بازگشت وسیله نگهداری می‌شود.</p></div><Button className="w-full" onClick={lendAsset}><ScanLine className="h-4 w-4 ml-1" />ثبت کارت و تحویل وسیله</Button></div></DialogContent></Dialog>

    <Dialog open={!!replacement} onOpenChange={(open) => !open && setReplacement(null)}><DialogContent className="[direction:rtl]"><DialogHeader><DialogTitle>واگذاری نوبت استفاده‌نشده</DialogTitle></DialogHeader><p className="text-xs text-muted-foreground">پس از گذشت {dorm.settings.graceMinutes} دقیقه، مسئول لباسشویی می‌تواند با بررسی کارت دانشجویی نوبت را واگذار کند.</p><div className="space-y-3"><div><Label>نام دانشجوی جایگزین</Label><Input value={replacementForm.name} onChange={(e) => setReplacementForm({ ...replacementForm, name: e.target.value })} /></div><div className="grid grid-cols-2 gap-2"><Input placeholder="شماره دانشجویی" value={replacementForm.studentCode} onChange={(e) => setReplacementForm({ ...replacementForm, studentCode: e.target.value })} /><Input placeholder="اتاق" value={replacementForm.room} onChange={(e) => setReplacementForm({ ...replacementForm, room: e.target.value })} /></div><div><Label>تصویر کارت دانشجوی جایگزین</Label><Input type="file" accept="image/*" capture="environment" onChange={(e) => setReplacementForm({ ...replacementForm, cardImageName: e.target.files?.[0]?.name ?? "" })} /></div><Button className="w-full" onClick={replaceSlot}>ثبت جایگزین</Button></div></DialogContent></Dialog>

    <Dialog open={confirmReservationOpen} onOpenChange={setConfirmReservationOpen}><DialogContent className="[direction:rtl] max-w-md"><DialogHeader><DialogTitle>تأیید نهایی نوبت لباسشویی</DialogTitle></DialogHeader><div className="rounded-2xl border bg-primary/5 p-5 space-y-3"><div className="flex justify-between gap-3"><span className="text-sm text-muted-foreground">دستگاه</span><span className="font-semibold">{dorm.machines.find((item) => item.id === selectedMachine)?.name ?? "—"}</span></div><div className="flex justify-between gap-3"><span className="text-sm text-muted-foreground">بلوک</span><span className="font-semibold">{dorm.machines.find((item) => item.id === selectedMachine)?.block ?? "—"}</span></div><div className="flex justify-between gap-3"><span className="text-sm text-muted-foreground">روز و ساعت</span><span className="font-semibold text-left">{selectedSlot ? faDateTime(selectedSlot.start) : "—"}</span></div></div><p className="text-sm leading-6">آیا از ثبت این نوبت مطمئن هستید؟ پس از تأیید، نوبت در صفحه شما و کارتابل مسئول لباسشویی نمایش داده می‌شود.</p><div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => { setConfirmReservationOpen(false); setReserveOpen(true); }}>ویرایش زمان</Button><Button onClick={reserve}>تأیید و ثبت نوبت</Button></div></DialogContent></Dialog>
  </div>;
}
