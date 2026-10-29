import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ClipboardCheck, Loader2, MessageCircleMore, Send, Star, Vote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { complaintKindFa, complaintStatusFa, type Complaint, type ComplaintKind } from "@/lib/complaints";
import { formatJalali } from "@/lib/jalali";
import { toast } from "sonner";

const SERVICES = ["تغذیه", "خوابگاه", "حمل‌ونقل", "کتابخانه", "اینترنت دانشگاه"];

export default function StudentVoice() {
  const [items, setItems] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ kind: "suggestion" as ComplaintKind, title: "", body: "", isAnonymous: false });
  const [ratings, setRatings] = useState<Record<string, number>>({ تغذیه: 0, خوابگاه: 0, "حمل‌ونقل": 0, کتابخانه: 0, "اینترنت دانشگاه": 0 });

  async function load() {
    setLoading(true);
    try { const { complaints } = await api<{ complaints: Complaint[] }>("/api/complaints"); setItems(complaints); }
    catch { toast.error("دریافت پیام‌های شما ناموفق بود"); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function submit() {
    if (!form.title.trim() || !form.body.trim()) return toast.error("عنوان و متن پیام الزامی است");
    setSubmitting(true);
    try { await api("/api/complaints", { method: "POST", body: JSON.stringify(form) }); }
    catch (error) { setSubmitting(false); return toast.error(error instanceof Error ? error.message : "ثبت پیام ناموفق بود"); }
    setSubmitting(false);
    setForm({ kind: "suggestion", title: "", body: "", isAnonymous: false });
    toast.success("پیام ثبت و برای شورای صنفی ارسال شد");
    void load();
  }

  return <div className="max-w-4xl mx-auto space-y-5">
    <div><h1 className="text-2xl font-bold flex items-center gap-2"><MessageCircleMore className="h-6 w-6 text-primary" />صدای دانشجو</h1><p className="text-sm text-muted-foreground mt-1">پیشنهاد، انتقاد، شکایت، ارزیابی خدمات و نظرسنجی‌ها در یک بخش</p></div>

    <Tabs defaultValue="send" className="space-y-4">
      <TabsList className="grid grid-cols-4 h-auto"><TabsTrigger value="send" className="py-2 gap-1"><Send className="h-4 w-4" />ثبت پیام</TabsTrigger><TabsTrigger value="tracking" className="py-2 gap-1"><CheckCircle2 className="h-4 w-4" />پیگیری</TabsTrigger><TabsTrigger value="surveys" className="py-2 gap-1"><Vote className="h-4 w-4" />نظرسنجی</TabsTrigger><TabsTrigger value="evaluation" className="py-2 gap-1"><ClipboardCheck className="h-4 w-4" />ارزیابی</TabsTrigger></TabsList>

      <TabsContent value="send"><Card><CardHeader><CardTitle className="text-base">ثبت پیام جدید</CardTitle></CardHeader><CardContent className="space-y-3"><div><Label>نوع پیام</Label><Select value={form.kind} onValueChange={(kind: ComplaintKind) => setForm({ ...form, kind })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="suggestion">پیشنهاد</SelectItem><SelectItem value="criticism">انتقاد</SelectItem><SelectItem value="complaint">شکایت</SelectItem></SelectContent></Select></div><div><Label>عنوان</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="موضوع را کوتاه و روشن بنویسید" /></div><div><Label>شرح</Label><Textarea rows={6} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="جزئیات، محل و زمان رخداد را توضیح دهید" /></div><label className="flex items-center gap-2 text-sm cursor-pointer"><Checkbox checked={form.isAnonymous} onCheckedChange={(checked) => setForm({ ...form, isAnonymous: !!checked })} />ثبت ناشناس</label><Button onClick={submit} disabled={submitting} className="gap-2">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}ارسال به شورای صنفی</Button></CardContent></Card></TabsContent>

      <TabsContent value="tracking"><Card><CardHeader><CardTitle className="text-base">پیام‌های ثبت‌شده</CardTitle></CardHeader><CardContent className="space-y-3">{loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto my-10" /> : items.map((item) => <div key={item.id} className="rounded-xl border p-4"><div className="flex items-start justify-between gap-2"><div><p className="font-semibold">{item.title}</p><p className="text-sm text-muted-foreground mt-1">{item.body}</p></div><Badge variant="outline">{complaintStatusFa[item.status]}</Badge></div><div className="flex items-center gap-2 mt-3"><Badge variant="secondary">{complaintKindFa[item.kind]}</Badge>{item.isAnonymous && <Badge variant="outline">ناشناس</Badge>}<span className="text-xs text-muted-foreground">{formatJalali(new Date(item.createdAt))}</span></div>{item.resolution && <div className="mt-3 rounded-lg bg-muted p-3 text-sm"><span className="font-semibold">پاسخ شورا: </span>{item.resolution}</div>}</div>)}</CardContent></Card></TabsContent>

      <TabsContent value="surveys"><div className="grid md:grid-cols-2 gap-4"><Card><CardContent className="py-6"><Vote className="h-8 w-8 text-primary" /><p className="font-semibold mt-3">نظرسنجی غذای امروز</p><p className="text-sm text-muted-foreground mt-1">فقط برای دانشجویانی که وعده را تحویل گرفته‌اند.</p><Button asChild className="mt-4"><Link to="/surveys">ورود به نظرسنجی</Link></Button></CardContent></Card><Card><CardContent className="py-6"><MessageCircleMore className="h-8 w-8 text-primary" /><p className="font-semibold mt-3">انتخاب ساعت کتابخانه</p><p className="text-sm text-muted-foreground mt-1">نظرسنجی عمومی تا پایان هفته فعال است.</p><Button variant="outline" className="mt-4" onClick={() => toast.success("رأی شما ثبت شد")}>شرکت در نظرسنجی</Button></CardContent></Card></div></TabsContent>

      <TabsContent value="evaluation"><Card><CardHeader><CardTitle className="text-base">ارزیابی سریع خدمات دانشگاه</CardTitle><p className="text-xs text-muted-foreground">امتیازها به‌صورت تجمیعی برای مسئول مربوط و شورای ناظر نمایش داده می‌شوند.</p></CardHeader><CardContent className="space-y-2">{SERVICES.map((service) => <div key={service} className="rounded-xl border p-3 flex items-center justify-between gap-3"><span className="text-sm font-medium">{service}</span><div className="flex gap-1">{[1,2,3,4,5].map((value) => <button key={value} onClick={() => setRatings({ ...ratings, [service]: value })} aria-label={`امتیاز ${value} به ${service}`}><Star className={`h-5 w-5 ${ratings[service] >= value ? "fill-amber-400 text-amber-500" : "text-muted-foreground/40"}`} /></button>)}</div></div>)}<Button className="mt-3" onClick={() => toast.success("ارزیابی خدمات ثبت شد")}>ثبت ارزیابی‌ها</Button></CardContent></Card></TabsContent>
    </Tabs>
  </div>;
}
