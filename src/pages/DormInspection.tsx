import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  BedDouble, Lightbulb, ThermometerSnowflake, ThermometerSun, Wifi, SprayCan, Bath,
  Refrigerator, Dumbbell, BookOpen, WashingMachine, Trees, Plug, DoorClosed, ScanEye,
  CheckCircle2, XCircle, Plus, ArrowRight, ChevronDown, Building2,
} from "lucide-react";

type DormType =
  | "room" | "hallway" | "restroom" | "bathroom" | "kitchen"
  | "gym" | "studyroom" | "laundry" | "prayer" | "yard";

const TYPE_META: Record<DormType, { label: string; title: string; field: string; placeholder: string }> = {
  room:      { label: "اتاق",            title: "بازرسی اتاق",             field: "شماره اتاق", placeholder: "مثال: ۲۱۴" },
  hallway:   { label: "راهرو",           title: "بازرسی راهرو",            field: "طبقه",       placeholder: "مثال: طبقه دوم" },
  restroom:  { label: "سرویس بهداشتی",   title: "بازرسی سرویس بهداشتی",    field: "طبقه",       placeholder: "مثال: طبقه سوم" },
  bathroom:  { label: "حمام",            title: "بازرسی حمام",             field: "طبقه",       placeholder: "مثال: طبقه اول" },
  kitchen:   { label: "آشپزخانه",        title: "بازرسی آشپزخانه",         field: "طبقه/شماره", placeholder: "مثال: طبقه چهارم" },
  gym:       { label: "باشگاه ورزشی",    title: "بازرسی باشگاه ورزشی",     field: "موقعیت",     placeholder: "مثال: زیرزمین" },
  studyroom: { label: "سالن مطالعه",     title: "بازرسی سالن مطالعه",      field: "موقعیت",     placeholder: "مثال: طبقه همکف" },
  laundry:   { label: "رختشویخانه",      title: "بازرسی رختشویخانه",       field: "موقعیت",     placeholder: "مثال: طبقه اول" },
  prayer:    { label: "نمازخانه",        title: "بازرسی نمازخانه",         field: "موقعیت",     placeholder: "مثال: طبقه همکف" },
  yard:      { label: "محوطه",           title: "بازرسی محوطه",            field: "موقعیت",     placeholder: "مثال: حیاط شمالی" },
};

type Item = { id: string; label: string; Icon: any };

const CHECKLISTS: Record<DormType, Item[]> = {
  room: [
    { id: "beds",        label: "تخت‌ها و تشک",        Icon: BedDouble },
    { id: "closet",      label: "کمد و قفل",           Icon: DoorClosed },
    { id: "lighting",    label: "روشنایی",             Icon: Lightbulb },
    { id: "cooling",     label: "سیستم سرمایش",        Icon: ThermometerSnowflake },
    { id: "heating",     label: "سیستم گرمایش",        Icon: ThermometerSun },
    { id: "sockets",     label: "پریز و کلید برق",     Icon: Plug },
    { id: "window",      label: "پنجره و پرده",        Icon: ScanEye },
    { id: "internet",    label: "وضعیت اینترنت",       Icon: Wifi },
    { id: "cleanliness", label: "نظافت",               Icon: SprayCan },
  ],
  hallway: [
    { id: "lighting",       label: "روشنایی",        Icon: Lightbulb },
    { id: "internet",       label: "وضعیت اینترنت",  Icon: Wifi },
    { id: "waterDispenser", label: "آبسردکن",        Icon: Bath },
    { id: "mirror",         label: "آینه قدی",       Icon: ScanEye },
    { id: "trash",          label: "سطل زباله",      Icon: SprayCan },
    { id: "cleanliness",    label: "نظافت",          Icon: SprayCan },
  ],
  restroom: [
    { id: "cleanliness", label: "نظافت",          Icon: SprayCan },
    { id: "hotWater",    label: "آب گرم",         Icon: ThermometerSun },
    { id: "fans",        label: "هواکش‌ها",       Icon: ThermometerSnowflake },
    { id: "lighting",    label: "روشنایی",        Icon: Lightbulb },
    { id: "soap",        label: "مایع دستشویی",   Icon: SprayCan },
    { id: "sinks",       label: "روشویی‌ها",      Icon: Bath },
    { id: "plumbing",    label: "لوله‌کشی و تخلیه", Icon: Bath },
  ],
  bathroom: [
    { id: "hotWater",    label: "آب گرم",          Icon: ThermometerSun },
    { id: "showerHead",  label: "سردوش و شیر",     Icon: Bath },
    { id: "doorLock",    label: "درب و قفل",       Icon: DoorClosed },
    { id: "fans",        label: "هواکش",           Icon: ThermometerSnowflake },
    { id: "lighting",    label: "روشنایی",         Icon: Lightbulb },
    { id: "drainage",    label: "تخلیه آب",        Icon: Bath },
    { id: "cleanliness", label: "نظافت",           Icon: SprayCan },
  ],
  kitchen: [
    { id: "fridge",      label: "یخچال",            Icon: Refrigerator },
    { id: "stove",       label: "گاز/اجاق",         Icon: ThermometerSun },
    { id: "microwave",   label: "مایکروویو",        Icon: Refrigerator },
    { id: "sink",        label: "سینک و شیر آب",    Icon: Bath },
    { id: "ventilation", label: "هواکش",            Icon: ThermometerSnowflake },
    { id: "sockets",     label: "پریز برق",         Icon: Plug },
    { id: "cleanliness", label: "نظافت",            Icon: SprayCan },
  ],
  gym: [
    { id: "equipment",   label: "سالم بودن دستگاه‌ها", Icon: Dumbbell },
    { id: "mats",        label: "تشک و کفپوش",         Icon: Dumbbell },
    { id: "ventilation", label: "تهویه",               Icon: ThermometerSnowflake },
    { id: "lighting",    label: "روشنایی",             Icon: Lightbulb },
    { id: "safety",      label: "نکات ایمنی",          Icon: ScanEye },
    { id: "cleanliness", label: "نظافت",               Icon: SprayCan },
  ],
  studyroom: [
    { id: "desks",       label: "میز و صندلی",     Icon: BookOpen },
    { id: "lighting",    label: "روشنایی",         Icon: Lightbulb },
    { id: "sockets",     label: "پریز برق",        Icon: Plug },
    { id: "internet",    label: "وضعیت اینترنت",   Icon: Wifi },
    { id: "quiet",       label: "سکوت و آرامش",    Icon: BookOpen },
    { id: "cooling",     label: "سرمایش/گرمایش",   Icon: ThermometerSnowflake },
    { id: "cleanliness", label: "نظافت",           Icon: SprayCan },
  ],
  laundry: [
    { id: "washers",     label: "ماشین‌های لباسشویی", Icon: WashingMachine },
    { id: "dryers",      label: "خشک‌کن / رگال",      Icon: WashingMachine },
    { id: "water",       label: "آب و اتصالات",       Icon: Bath },
    { id: "drainage",    label: "تخلیه آب",           Icon: Bath },
    { id: "lighting",    label: "روشنایی",            Icon: Lightbulb },
    { id: "cleanliness", label: "نظافت",              Icon: SprayCan },
  ],
  prayer: [
    { id: "carpet",      label: "فرش و سجاده",   Icon: BookOpen },
    { id: "lighting",    label: "روشنایی",       Icon: Lightbulb },
    { id: "cooling",     label: "سرمایش/گرمایش", Icon: ThermometerSnowflake },
    { id: "sound",       label: "سیستم صوتی",    Icon: ScanEye },
    { id: "cleanliness", label: "نظافت",         Icon: SprayCan },
  ],
  yard: [
    { id: "lighting",    label: "روشنایی محوطه", Icon: Lightbulb },
    { id: "greenery",    label: "فضای سبز",      Icon: Trees },
    { id: "benches",     label: "نیمکت‌ها",      Icon: BedDouble },
    { id: "trash",       label: "سطل زباله",     Icon: SprayCan },
    { id: "safety",      label: "ایمنی و درب‌ها", Icon: DoorClosed },
    { id: "cleanliness", label: "نظافت",         Icon: SprayCan },
  ],
};

const schema = z.object({
  dormId: z.string().min(1, "لطفاً خوابگاه را انتخاب کنید"),
  inspectionType: z.string().min(1, "لطفاً بخش مورد بازرسی را انتخاب کنید"),
  locationValue: z.string().trim().min(1, "لطفاً شماره/طبقه را وارد کنید"),
});
type FormData = z.infer<typeof schema>;

type Result = "ok" | "notok" | null;
type Dorm = { id: string; name: string };
type Room = { id: string; number: string; floor: string; capacity: number };
type RoomInspection = { id: string; createdAt: string; results: Record<string, "ok" | "notok">; details: Record<string, string>; customItems: { id: string; label: string }[] };

export default function DormInspection() {
  const { user } = useAuth();
  const [dorms, setDorms] = useState<Dorm[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [history, setHistory] = useState<RoomInspection[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [roomsError, setRoomsError] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const [step, setStep] = useState<"form" | "inspection">("form");
  const [formData, setFormData] = useState<FormData | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [results, setResults] = useState<Record<string, Result>>({});
  const [details, setDetails] = useState<Record<string, string>>({});
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [errorItems, setErrorItems] = useState<Record<string, boolean>>({});
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { dormId: "", inspectionType: "room", locationValue: "" },
    mode: "onChange",
  });
  const watchType = form.watch("inspectionType") as DormType;
  const watchDorm = form.watch("dormId");
  const watchLocation = form.watch("locationValue");
  const selectedRoom = rooms.find((room) => room.number === watchLocation);

  useEffect(() => {
    api<{ buildings: Dorm[] }>("/api/buildings?kind=dorm")
      .then(({ buildings }) => setDorms(buildings))
      .catch(() => toast.error("خطا در دریافت خوابگاه‌ها"));
  }, []);

  useEffect(() => {
    if (!watchDorm || watchType !== "room") { setRooms([]); return; }
    let active = true;
    setRoomsLoading(true);
    setRoomsError(false);
    api<{ rooms: Room[] }>(`/api/dorms/${watchDorm}/rooms`)
      .then(({ rooms: data }) => { if (active) setRooms(data); })
      .catch(() => { if (active) { setRooms([]); setRoomsError(true); } })
      .finally(() => { if (active) setRoomsLoading(false); });
    return () => { active = false; };
  }, [watchDorm, watchType]);

  useEffect(() => {
    if (!watchDorm || watchType !== "room" || !selectedRoom) { setHistory([]); setHistoryError(false); return; }
    let active = true;
    setHistoryLoading(true);
    setHistoryError(false);
    api<{ inspections: RoomInspection[] }>(`/api/dorms/${watchDorm}/rooms/${selectedRoom.id}/inspections`)
      .then(({ inspections }) => { if (active) setHistory(inspections); })
      .catch(() => { if (active) { setHistory([]); setHistoryError(true); } })
      .finally(() => { if (active) setHistoryLoading(false); });
    return () => { active = false; };
  }, [watchDorm, watchType, selectedRoom?.id, step]);

  const onStart = (data: FormData) => {
    setFormData(data);
    setItems(CHECKLISTS[data.inspectionType as DormType]);
    setResults({});
    setDetails({});
    setOpenItems({});
    setErrorItems({});
    setStep("inspection");
  };

  const onInvalid = () => toast.error("لطفاً فیلدهای الزامی را تکمیل کنید");

  const setItemResult = (id: string, r: Result) => {
    setResults((s) => ({ ...s, [id]: r }));
    setErrorItems((s) => ({ ...s, [id]: false }));
    if (r === "ok") {
      setDetails((s) => { const n = { ...s }; delete n[id]; return n; });
      setOpenItems((s) => ({ ...s, [id]: false }));
    }
  };

  const addCustom = () => {
    const name = customName.trim();
    if (!name) { toast.error("نام مورد را وارد کنید"); return; }
    setItems((s) => [...s, { id: `custom_${Date.now()}`, label: name, Icon: Plus }]);
    setCustomName("");
    setCustomOpen(false);
    toast.success(`مورد جدید "${name}" اضافه شد`);
  };

  const submitReport = async () => {
    if (!formData || !user) return;
    const unchecked = items.find((i) => results[i.id] == null);
    if (unchecked) {
      toast.error("لطفاً تمام موارد را بررسی کنید");
      setOpenItems((s) => ({ ...s, [unchecked.id]: true }));
      return;
    }
    const errs: Record<string, boolean> = {};
    const opens: Record<string, boolean> = { ...openItems };
    let hasErr = false;
    for (const i of items) {
      if (results[i.id] === "notok" && !(details[i.id] && details[i.id].trim())) {
        errs[i.id] = true; opens[i.id] = true; hasErr = true;
      }
    }
    if (hasErr) {
      setErrorItems(errs); setOpenItems(opens);
      toast.error("لطفاً برای تمام موارد مشکل‌دار، جزئیات وارد کنید");
      return;
    }
    setSubmitting(true);
    const customItems = items.filter((i) => i.id.startsWith("custom_")).map((i) => ({ id: i.id, label: i.label }));
    const { error } = await api("/api/qc/inspections", { method: "POST", body: JSON.stringify({
      facultyId: formData.dormId,
      inspectionType: formData.inspectionType,
      locationValue: formData.locationValue,
      results,
      details,
      customItems,
    }) }).then(() => ({ error: null })).catch((e) => ({ error: e }));
    setSubmitting(false);
    if (error) { toast.error("خطا در ثبت: " + error.message); return; }
    toast.success("گزارش بازرسی خوابگاه با موفقیت ثبت شد");
    form.reset({ dormId: "", inspectionType: "room", locationValue: "" });
    setStep("form");
  };

  if (step === "form") {
    return (
      <div className="max-w-xl mx-auto py-6 px-4" dir="rtl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />بازرسی کیفیت خوابگاه
            </CardTitle>
            <p className="text-sm text-muted-foreground">خوابگاه و بخش مورد بازرسی را انتخاب کنید</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onStart, onInvalid)} className="space-y-5">
              <div>
                <Label>خوابگاه</Label>
                <Select value={form.watch("dormId")} onValueChange={(v) => { form.setValue("dormId", v, { shouldValidate: true }); form.setValue("locationValue", ""); }}>
                  <SelectTrigger className={form.formState.errors.dormId ? "border-destructive" : ""}>
                    <SelectValue placeholder="انتخاب خوابگاه" />
                  </SelectTrigger>
                  <SelectContent>
                    {dorms.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {form.formState.errors.dormId && <p className="text-xs text-destructive mt-1">{form.formState.errors.dormId.message}</p>}
              </div>

              <div>
                <Label>بخش مورد بازرسی</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {(Object.keys(TYPE_META) as DormType[]).map((t) => (
                    <Button
                      key={t}
                      type="button"
                      variant={watchType === t ? "default" : "outline"}
                      className="h-11 text-sm"
                      onClick={() => { form.setValue("inspectionType", t, { shouldValidate: true }); form.setValue("locationValue", ""); }}
                    >
                      {TYPE_META[t].label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>{TYPE_META[watchType].field}</Label>
                {watchType === "room" ? <>
                  <Select value={watchLocation} onValueChange={(value) => form.setValue("locationValue", value, { shouldValidate: true })} disabled={!watchDorm || roomsLoading || roomsError}>
                    <SelectTrigger className={form.formState.errors.locationValue ? "border-destructive" : ""}><SelectValue placeholder={roomsLoading ? "در حال دریافت اتاق‌ها..." : "انتخاب اتاق"} /></SelectTrigger>
                    <SelectContent>{rooms.map((room) => <SelectItem key={room.id} value={room.number}>اتاق {room.number} · طبقه {room.floor} · ظرفیت {room.capacity}</SelectItem>)}</SelectContent>
                  </Select>
                  {roomsError && <p role="alert" className="text-xs text-destructive mt-1">دریافت اتاق‌ها ناموفق بود. دوباره خوابگاه را انتخاب کنید.</p>}
                  {watchDorm && !roomsLoading && !roomsError && rooms.length === 0 && <p className="text-xs text-muted-foreground mt-1">اتاقی ثبت نشده است؛ مدیر باید ابتدا اتاق را اضافه کند.</p>}
                </> : <Input {...form.register("locationValue")} placeholder={TYPE_META[watchType].placeholder} className={form.formState.errors.locationValue ? "border-destructive" : ""} />}
                {form.formState.errors.locationValue && <p className="text-xs text-destructive mt-1">{form.formState.errors.locationValue.message}</p>}
              </div>

              {watchType === "room" && selectedRoom && <section className="space-y-2 border-t pt-4" aria-label="سوابق بازرسی اتاق">
                <h2 className="font-semibold">سوابق بازرسی اتاق {selectedRoom.number}</h2>
                {historyLoading ? <p className="text-sm">در حال دریافت گزارش‌ها...</p> : historyError ? <p role="alert" className="text-sm text-destructive">دریافت گزارش‌ها ناموفق بود.</p> : history.length === 0 ? <p className="text-sm text-muted-foreground">هنوز گزارشی برای این اتاق ثبت نشده است.</p> : history.map((report) => <details key={report.id} className="rounded-md border p-3 text-sm">
                  <summary className="cursor-pointer font-medium">{new Date(report.createdAt).toLocaleString("fa-IR")}</summary>
                  <ul className="mt-3 space-y-2">{[...CHECKLISTS.room, ...report.customItems.map((item) => ({ ...item, Icon: Plus }))].map((item) => <li key={item.id}><span>{item.label}: {report.results[item.id] === "ok" ? "سالم" : "خراب"}</span>{report.details[item.id] && <p className="text-muted-foreground">{report.details[item.id]}</p>}</li>)}</ul>
                </details>)}
              </section>}

              <Button type="submit" className="w-full h-11">شروع بازرسی</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dormName = dorms.find((d) => d.id === formData!.dormId)?.name;
  return (
    <div className="max-w-2xl mx-auto py-6 px-4" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle>{TYPE_META[formData!.inspectionType as DormType].title} {formData!.locationValue}</CardTitle>
          <p className="text-sm text-muted-foreground">{dormName}</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.map((it) => {
            const r = results[it.id];
            const isOpen = !!openItems[it.id];
            return (
              <Collapsible key={it.id} open={isOpen} onOpenChange={(o) => setOpenItems((s) => ({ ...s, [it.id]: o }))}>
                <CollapsibleTrigger asChild>
                  <button type="button" className="w-full flex items-center justify-between border rounded-md p-3 hover:bg-accent">
                    <span className="flex items-center gap-2">
                      <it.Icon className="h-5 w-5" />
                      <span>{it.label}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      {r === "ok" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                      {r === "notok" && <XCircle className="h-5 w-5 text-destructive" />}
                      <ChevronDown className={"h-4 w-4 transition-transform " + (isOpen ? "rotate-180" : "")} />
                    </span>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="p-3 border-x border-b rounded-b-md -mt-1 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant={r === "ok" ? "default" : "outline"} className={r === "ok" ? "bg-green-600 hover:bg-green-700" : ""} onClick={() => setItemResult(it.id, "ok")}>
                      سالم است
                    </Button>
                    <Button type="button" variant={r === "notok" ? "destructive" : "outline"} onClick={() => setItemResult(it.id, "notok")}>
                      خراب است
                    </Button>
                  </div>
                  {r === "notok" && (
                    <div className="space-y-2">
                      <Textarea
                        value={details[it.id] || ""}
                        onChange={(e) => { setDetails((s) => ({ ...s, [it.id]: e.target.value })); setErrorItems((s) => ({ ...s, [it.id]: false })); }}
                        placeholder="جزئیات مشکل را اینجا بنویسید..."
                        className={errorItems[it.id] ? "border-destructive" : ""}
                      />
                      <Button type="button" className="bg-green-600 hover:bg-green-700" onClick={() => {
                        if (!(details[it.id] || "").trim()) { setErrorItems((s) => ({ ...s, [it.id]: true })); toast.error("لطفاً جزئیات مشکل را وارد کنید"); return; }
                        toast.success("توضیحات ثبت شد");
                      }}>ثبت توضیحات</Button>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            );
          })}

          {customOpen ? (
            <div className="flex gap-2 items-center border rounded-md p-3 bg-muted/50">
              <Input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="نام مورد جدید" />
              <Button type="button" onClick={addCustom}>افزودن</Button>
              <Button type="button" variant="outline" onClick={() => { setCustomOpen(false); setCustomName(""); }}>انصراف</Button>
            </div>
          ) : (
            <Button type="button" variant="outline" className="w-full border-green-600 text-green-700 hover:bg-green-50" onClick={() => setCustomOpen(true)}>
              <Plus className="h-4 w-4 ml-1" /> افزودن مورد جدید
            </Button>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setStep("form")}>
              <ArrowRight className="h-4 w-4 ml-1" /> بازگشت
            </Button>
            <Button type="button" className="flex-1 h-11" onClick={submitReport} disabled={submitting}>
              {submitting ? "در حال پردازش..." : "ثبت گزارش"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
