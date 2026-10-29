import { useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  School, Lightbulb, ThermometerSnowflake, ThermometerSun, Projector,
  Computer, ScanEye, Clock, SprayCan, Wifi, Bath,
  CheckCircle2, XCircle, Plus, ArrowRight, ChevronDown,
} from "lucide-react";

const faculties = [
  { id: "mechanical",    name: "دانشکده مکانیک" },
  { id: "electrical",    name: "دانشکده برق و کامپیوتر" },
  { id: "chemistry",     name: "دانشکده شیمی" },
  { id: "industrial",    name: "دانشکده صنایع و مواد" },
  { id: "civil",         name: "دانشکده عمران" },
  { id: "basicSciences", name: "دانشکده علوم پایه" },
];

type InspectionType = "classroom" | "hallway" | "restroom";

const LOC_LABELS: Record<InspectionType, { title: string; field: string; placeholder: string }> = {
  classroom: { title: "بازرسی کلاس", field: "شماره اتاق", placeholder: "مثال: ۱۰۱" },
  hallway:   { title: "بازرسی راهرو", field: "طبقه", placeholder: "مثال: طبقه دوم" },
  restroom:  { title: "بازرسی سرویس بهداشتی", field: "طبقه", placeholder: "مثال: طبقه چهارم" },
};

type Item = { id: string; label: string; Icon: any };

const CHECKLISTS: Record<InspectionType, Item[]> = {
  classroom: [
    { id: "chairs",      label: "صندلی‌ها",          Icon: School },
    { id: "lighting",    label: "روشنایی",           Icon: Lightbulb },
    { id: "cooling",     label: "سیستم سرمایش",      Icon: ThermometerSnowflake },
    { id: "heating",     label: "سیستم گرمایش",      Icon: ThermometerSun },
    { id: "projector",   label: "پرژکتور",           Icon: Projector },
    { id: "screen",      label: "پرده نمایش",        Icon: Computer },
    { id: "window",      label: "پرده‌های پنجره‌ها", Icon: ScanEye },
    { id: "clock",       label: "ساعت",              Icon: Clock },
    { id: "whiteboard",  label: "تخته وایت‌برد",     Icon: Computer },
    { id: "cleanliness", label: "نظافت",             Icon: SprayCan },
  ],
  hallway: [
    { id: "internet",        label: "وضعیت اینترنت", Icon: Wifi },
    { id: "cleanliness",     label: "نظافت",         Icon: SprayCan },
    { id: "mirror",          label: "آینه قدی",      Icon: ScanEye },
    { id: "waterDispenser",  label: "آبسردکن",       Icon: Bath },
  ],
  restroom: [
    { id: "cleanliness", label: "نظافت",         Icon: SprayCan },
    { id: "hotWater",    label: "آب گرم",        Icon: ThermometerSun },
    { id: "fans",        label: "هواکش‌ها",      Icon: ThermometerSnowflake },
    { id: "lighting",    label: "روشنایی",       Icon: Lightbulb },
    { id: "soap",        label: "مایع دستشویی", Icon: SprayCan },
    { id: "mirror",      label: "آینه",          Icon: ScanEye },
    { id: "sinks",       label: "روشویی‌ها",     Icon: Bath },
    { id: "paperTowels", label: "دستمال کاغذی", Icon: SprayCan },
  ],
};

const schema = z.object({
  facultyId: z.string().min(1, "لطفاً دانشکده را انتخاب کنید"),
  inspectionType: z.enum(["classroom", "hallway", "restroom"]),
  locationValue: z.string().trim().min(1, "لطفاً شماره/طبقه را وارد کنید"),
});
type FormData = z.infer<typeof schema>;

type Result = "ok" | "notok" | null;

export default function QualityControlV2() {
  const { user } = useAuth();
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
    defaultValues: { facultyId: "", inspectionType: "classroom", locationValue: "" },
    mode: "onChange",
  });
  const watchType = form.watch("inspectionType") as InspectionType;

  const onStart = (data: FormData) => {
    setFormData(data);
    setItems(CHECKLISTS[data.inspectionType]);
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
    const newItem: Item = { id: `custom_${Date.now()}`, label: name, Icon: Plus };
    setItems((s) => [...s, newItem]);
    setCustomName("");
    setCustomOpen(false);
    toast.success(`مورد جدید "${name}" اضافه شد`);
  };

  const submitReport = async () => {
    if (!formData || !user) return;
    // unchecked items
    const unchecked = items.find((i) => results[i.id] == null);
    if (unchecked) { toast.error("لطفاً تمام موارد را بررسی کنید"); setOpenItems((s) => ({ ...s, [unchecked.id]: true })); return; }
    // notok without details
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
      facultyId: formData.facultyId,
      inspectionType: formData.inspectionType,
      locationValue: formData.locationValue,
      results,
      details,
      customItems,
    }) }).then(() => ({ error: null })).catch((e) => ({ error: e }));
    setSubmitting(false);
    if (error) { toast.error("خطا در ثبت: " + error.message); return; }
    toast.success("گزارش بازرسی با موفقیت ثبت شد");
    form.reset({ facultyId: "", inspectionType: "classroom", locationValue: "" });
    setStep("form");
  };

  if (step === "form") {
    return (
      <div className="max-w-xl mx-auto py-6 px-4">
        <Card>
          <CardHeader><CardTitle>ثبت بازرسی جدید</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onStart, onInvalid)} className="space-y-5">
              <div>
                <Label>دانشکده</Label>
                <Select value={form.watch("facultyId")} onValueChange={(v) => form.setValue("facultyId", v, { shouldValidate: true })}>
                  <SelectTrigger className={form.formState.errors.facultyId ? "border-destructive" : ""}>
                    <SelectValue placeholder="انتخاب دانشکده" />
                  </SelectTrigger>
                  <SelectContent>
                    {faculties.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {form.formState.errors.facultyId && <p className="text-xs text-destructive mt-1">{form.formState.errors.facultyId.message}</p>}
              </div>

              <div>
                <Label>نوع بازرسی</Label>
                <RadioGroup
                  value={watchType}
                  onValueChange={(v) => form.setValue("inspectionType", v as InspectionType, { shouldValidate: true })}
                  className="grid grid-cols-3 gap-2 mt-2"
                >
                  {(["classroom", "hallway", "restroom"] as InspectionType[]).map((t) => (
                    <Label key={t} className="flex items-center justify-center gap-2 border rounded-md py-2 cursor-pointer hover:bg-accent has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
                      <RadioGroupItem value={t} className="sr-only" />
                      {t === "classroom" ? "کلاس" : t === "hallway" ? "راهرو" : "سرویس بهداشتی"}
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label>{LOC_LABELS[watchType].field}</Label>
                <Input
                  {...form.register("locationValue")}
                  placeholder={LOC_LABELS[watchType].placeholder}
                  className={form.formState.errors.locationValue ? "border-destructive" : ""}
                />
                {form.formState.errors.locationValue && <p className="text-xs text-destructive mt-1">{form.formState.errors.locationValue.message}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "در حال پردازش..." : "شروع بازرسی"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2
  const facultyName = faculties.find((f) => f.id === formData!.facultyId)?.name;
  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <Card>
        <CardHeader>
          <CardTitle>{LOC_LABELS[formData!.inspectionType].title} {formData!.locationValue}</CardTitle>
          <p className="text-sm text-muted-foreground">{facultyName}</p>
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
            <Button type="button" className="flex-1" onClick={submitReport} disabled={submitting}>
              {submitting ? "در حال پردازش..." : "ثبت گزارش"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
