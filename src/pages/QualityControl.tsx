import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { QcInspection } from "@/lib/qualityControl";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ClipboardCheck, Star, Camera, History, Loader2, Filter } from "lucide-react";

type LocType = "cafeteria" | "dorm" | "classroom" | "restroom";
type Building = { id: string; name: string; kind: string };

const LOC_LABELS: Record<LocType, string> = {
  cafeteria: "سلف",
  dorm: "خوابگاه",
  classroom: "کلاس",
  restroom: "سرویس بهداشتی",
};

// criterion sets per location type
const CRITERIA: Record<LocType, { key: string; label: string }[]> = {
  cafeteria: [
    { key: "cleanliness", label: "نظافت" },
    { key: "taste", label: "طعم غذا" },
    { key: "portion", label: "اندازه پرس" },
    { key: "staff", label: "برخورد کارکنان" },
  ],
  dorm: [
    { key: "cleanliness", label: "نظافت عمومی" },
    { key: "heating", label: "گرمایش/سرمایش" },
    { key: "water", label: "آب گرم" },
    { key: "internet", label: "اینترنت" },
  ],
  classroom: [
    { key: "cleanliness", label: "نظافت" },
    { key: "video", label: "ویدئو/پروژکتور" },
    { key: "lighting", label: "روشنایی" },
    { key: "temperature", label: "دما" },
  ],
  restroom: [
    { key: "cleanliness", label: "نظافت" },
    { key: "supplies", label: "صابون/دستمال" },
    { key: "smell", label: "بو" },
    { key: "plumbing", label: "لوله‌کشی" },
  ],
};

export default function QualityControl() {
  const { user } = useAuth();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [locType, setLocType] = useState<LocType>("cafeteria");
  const [buildingId, setBuildingId] = useState<string>("");
  const [locValue, setLocValue] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [overall, setOverall] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [history, setHistory] = useState<QcInspection[]>([]);
  const [historyFilter, setHistoryFilter] = useState<string>("all");

  const loadAll = async () => {
    try {
      const [{ buildings }, { inspections }] = await Promise.all([
        api<{ buildings: Building[] }>("/api/buildings"),
        api<{ inspections: QcInspection[] }>("/api/qc/inspections"),
      ]);
      setBuildings(buildings);
      setHistory(inspections);
    } catch { toast.error("خطا در دریافت اطلاعات بازرسی"); }
  };

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { setScores({}); }, [locType]);

  const submit = async () => {
    if (!user) return;
    if (!locValue.trim()) return toast.error("شماره/طبقه را وارد کنید");
    if (!overall) return toast.error("امتیاز کلی را انتخاب کنید");
    setSubmitting(true);
    const photo_path: string | null = null;
    if (photo) {
      const path = `${user.id}/${Date.now()}_${photo.name}`;
      const uerr = null;
      if (uerr) { setSubmitting(false); return toast.error("آپلود عکس: " + uerr.message); }
      void path;
    }
    const { error } = await api("/api/qc/inspections", { method: "POST", body: JSON.stringify({
      buildingId: buildingId || null,
      locationType: locType,
      locationValue: locValue.trim(),
      scores,
      overallRating: overall,
      notes: notes || null,
      photoPath: null,
    }) }).then(() => ({ error: null })).catch((e) => ({ error: e }));
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("بازرسی ثبت شد ✅");
    setLocValue(""); setScores({}); setOverall(0); setNotes(""); setPhoto(null);
    loadAll();
  };

  const filteredHistory = history.filter((h) =>
    historyFilter === "all" ? true : h.buildingId === historyFilter
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6 text-primary" />بازرسی کیفیت
        </h1>
        <p className="text-sm text-muted-foreground mt-1">سلف، خوابگاه، کلاس، سرویس بهداشتی</p>
      </div>

      <Tabs defaultValue="new">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="new">بازرسی جدید</TabsTrigger>
          <TabsTrigger value="history"><History className="h-4 w-4 ml-1" />تاریخچه</TabsTrigger>
        </TabsList>

        <TabsContent value="new">
          <Card>
            <CardHeader><CardTitle className="text-base">ثبت بازرسی</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">نوع مکان</Label>
                  <Select value={locType} onValueChange={(v) => setLocType(v as LocType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(LOC_LABELS) as LocType[]).map((k) => (
                        <SelectItem key={k} value={k}>{LOC_LABELS[k]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">ساختمان</Label>
                  <Select value={buildingId} onValueChange={setBuildingId}>
                    <SelectTrigger><SelectValue placeholder="انتخاب کنید" /></SelectTrigger>
                    <SelectContent>
                      {buildings.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs">شماره/طبقه/توضیح موقعیت</Label>
                <Input value={locValue} onChange={(e) => setLocValue(e.target.value)} placeholder="مثلاً کلاس ۱۰۳ — طبقه دوم" />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">معیارها (۱ تا ۵)</Label>
                {CRITERIA[locType].map((c) => (
                  <div key={c.key} className="flex items-center justify-between gap-2 p-2 bg-muted/40 rounded-lg">
                    <span className="text-sm">{c.label}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setScores({ ...scores, [c.key]: n })}
                          className="p-1"
                        >
                          <Star className={`h-5 w-5 ${(scores[c.key] ?? 0) >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <Label className="text-xs">امتیاز کلی</Label>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setOverall(n)} className="p-1">
                      <Star className={`h-7 w-7 ${overall >= n ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs">توضیحات</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </div>

              <div>
                <Label className="text-xs flex items-center gap-1"><Camera className="h-3 w-3" />تصویر (اختیاری)</Label>
                <Input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
              </div>

              <Button onClick={submit} disabled={submitting} className="w-full gap-1">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}ثبت بازرسی
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={historyFilter} onValueChange={setHistoryFilter}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه ساختمان‌ها</SelectItem>
                  {buildings.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {filteredHistory.length === 0 && (
              <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">بازرسی‌ای ثبت نشده</CardContent></Card>
            )}

            {filteredHistory.map((h) => (
              <Card key={h.id}>
                <CardContent className="py-3 space-y-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{LOC_LABELS[h.locationType as LocType]}</Badge>
                      <span className="text-sm font-medium">{h.locationValue}</span>
                    </div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={`h-4 w-4 ${(h.overallRating ?? 0) >= n ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`} />
                      ))}
                    </div>
                  </div>
                  {h.building?.name && <p className="text-xs text-muted-foreground">{h.building.name}</p>}
                  {h.notes && <p className="text-sm">{h.notes}</p>}
                  {h.photoPath && <QcPhoto path={h.photoPath} />}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QcPhoto({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    setUrl(null);
  }, [path]);
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer">
      <img src={url} alt="" className="mt-2 rounded-lg max-h-40 object-cover" />
    </a>
  );
}
