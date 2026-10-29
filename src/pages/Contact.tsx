import { useMemo, useState } from "react";
import { Building2, Clock3, Copy, MapPin, Phone, Search, ShieldAlert, Star, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type ContactGroup = "all" | "emergency" | "student" | "faculty" | "dorm" | "service";
type DirectoryContact = { name: string; unit: string; extension: string; direct?: string; location: string; hours: string; group: Exclude<ContactGroup, "all">; important?: boolean };

const CONTACTS: DirectoryContact[] = [
  { name: "حراست دانشگاه", unit: "شماره اضطراری", extension: "۱۱۰", direct: "۶۴۵۴۰", location: "ورودی اصلی دانشگاه", hours: "شبانه‌روزی", group: "emergency", important: true },
  { name: "اورژانس دانشگاه", unit: "مرکز بهداشت و درمان", extension: "۱۱۵", direct: "۶۴۵۴۵", location: "درمانگاه دانشگاه", hours: "شبانه‌روزی", group: "emergency", important: true },
  { name: "معاونت دانشجویی", unit: "حوزه معاونت", extension: "۲۰۱", location: "ساختمان امور دانشجویی، طبقه سوم", hours: "۸ تا ۱۵", group: "student" },
  { name: "مدیریت امور دانشجویی", unit: "اداره کل دانشجویی", extension: "۲۰۵", location: "ساختمان امور دانشجویی، طبقه دوم", hours: "۸ تا ۱۵", group: "student" },
  { name: "اداره رفاه دانشجویان", unit: "وام و تسهیلات", extension: "۲۲۱", location: "ساختمان امور دانشجویی، طبقه اول", hours: "۸ تا ۱۴", group: "student" },
  { name: "اداره تغذیه", unit: "سلف و تغذیه", extension: "۲۳۵", location: "سلف مرکزی، دفتر مدیریت", hours: "۷ تا ۱۶", group: "student" },
  { name: "رئیس اداره سراها", unit: "خوابگاه‌ها", extension: "۲۴۰", location: "ساختمان امور دانشجویی، طبقه اول", hours: "۸ تا ۱۵", group: "dorm" },
  { name: "سرپرستی خوابگاه امینیان", unit: "خوابگاه پسرانه", extension: "۴۱۲", location: "خوابگاه امینیان، لابی", hours: "شبانه‌روزی", group: "dorm" },
  { name: "سرپرستی خوابگاه ریحانه", unit: "خوابگاه دخترانه", extension: "۴۲۱", location: "خوابگاه ریحانه، لابی", hours: "شبانه‌روزی", group: "dorm" },
  { name: "دفتر دانشکده مکانیک", unit: "آموزش دانشکده", extension: "۳۲۱", location: "دانشکده مکانیک، طبقه اول", hours: "۸ تا ۱۵", group: "faculty" },
  { name: "دفتر دانشکده برق و کامپیوتر", unit: "آموزش دانشکده", extension: "۳۴۲", location: "دانشکده برق، طبقه همکف", hours: "۸ تا ۱۵", group: "faculty" },
  { name: "دفتر دانشکده شیمی", unit: "آموزش دانشکده", extension: "۳۶۰", location: "دانشکده شیمی، اتاق ۱۰۵", hours: "۸ تا ۱۵", group: "faculty" },
  { name: "دفتر دانشکده صنایع و مواد", unit: "آموزش دانشکده", extension: "۳۷۵", location: "دانشکده صنایع، طبقه اول", hours: "۸ تا ۱۵", group: "faculty" },
  { name: "دفتر دانشکده عمران", unit: "آموزش دانشکده", extension: "۳۸۴", location: "دانشکده عمران، طبقه اول", hours: "۸ تا ۱۵", group: "faculty" },
  { name: "دفتر علوم پایه", unit: "آموزش دانشکده", extension: "۳۹۱", location: "ساختمان علوم پایه", hours: "۸ تا ۱۵", group: "faculty" },
  { name: "کتابخانه مرکزی", unit: "امانت و مرجع", extension: "۲۷۰", location: "ساختمان کتابخانه مرکزی", hours: "۷:۳۰ تا ۲۰", group: "service" },
  { name: "مرکز فناوری اطلاعات", unit: "پشتیبانی شبکه و حساب", extension: "۲۸۰", location: "ساختمان فناوری اطلاعات", hours: "۸ تا ۱۶", group: "service" },
  { name: "اداره آموزش کل", unit: "امور آموزشی", extension: "۲۹۰", location: "ساختمان آموزش", hours: "۸ تا ۱۵", group: "service" },
  { name: "مرکز مشاوره دانشجویی", unit: "مشاوره و سلامت روان", extension: "۲۶۵", location: "ساختمان خدمات دانشجویی", hours: "۸ تا ۱۸", group: "student" },
  { name: "روابط عمومی دانشگاه", unit: "اطلاع‌رسانی", extension: "۲۰۰", direct: "۶۴۵۴۲۰۰۰", location: "ساختمان مرکزی، طبقه دوم", hours: "۸ تا ۱۶", group: "service" },
];

const GROUP_LABELS: Record<ContactGroup, string> = { all: "همه واحدها", emergency: "ضروری", student: "امور دانشجویی", faculty: "دانشکده‌ها", dorm: "خوابگاه‌ها", service: "خدمات عمومی" };

export default function ContactPage() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<ContactGroup>("all");
  const filtered = useMemo(() => CONTACTS.filter((contact) => (group === "all" || contact.group === group) && (!query.trim() || `${contact.name} ${contact.unit} ${contact.extension} ${contact.location}`.includes(query.trim()))), [group, query]);

  return <div className="max-w-6xl mx-auto space-y-6">
    <section className="rounded-3xl bg-gradient-to-l from-primary to-secondary text-primary-foreground p-6 md:p-9"><div className="grid lg:grid-cols-[1.3fr_.7fr] gap-6 items-center"><div><Badge className="bg-white/15 text-white border-white/20">دفترچه تلفن دانشگاه</Badge><h1 className="text-3xl md:text-4xl font-black mt-4">هر شماره، سریع و دقیق در دسترس</h1><p className="text-sm text-white/75 mt-3 leading-7">جست‌وجو میان واحدهای آموزشی، دانشجویی، خوابگاه‌ها، خدمات عمومی و شماره‌های ضروری.</p></div><Card className="bg-white/10 border-white/20 text-white"><CardContent className="py-5 grid grid-cols-2 text-center"><div><p className="text-3xl font-bold">{CONTACTS.length}</p><p className="text-xs opacity-70">شماره ثبت‌شده</p></div><div><p className="text-3xl font-bold">۶</p><p className="text-xs opacity-70">دسته‌بندی</p></div></CardContent></Card></div></section>

    <Card><CardContent className="py-4 flex flex-col md:flex-row gap-3"><div className="relative flex-1"><Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="نام واحد، خدمت، مکان یا شماره داخلی..." className="pr-9" /></div><Select value={group} onValueChange={(value: ContactGroup) => setGroup(value)}><SelectTrigger className="md:w-56"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(GROUP_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></CardContent></Card>

    <div className="flex gap-2 overflow-x-auto pb-1">{(Object.keys(GROUP_LABELS) as ContactGroup[]).map((item) => <Button key={item} size="sm" variant={group === item ? "default" : "outline"} onClick={() => setGroup(item)} className="shrink-0">{GROUP_LABELS[item]}</Button>)}</div>

    {group === "all" && !query && <section><h2 className="font-bold flex items-center gap-2 mb-3"><ShieldAlert className="h-5 w-5 text-destructive" />شماره‌های ضروری</h2><div className="grid md:grid-cols-2 gap-4">{CONTACTS.filter((contact) => contact.important).map((contact) => <Card key={contact.name} className="border-destructive/30 bg-destructive/5"><CardContent className="py-5 flex items-center justify-between gap-3"><div><p className="font-bold">{contact.name}</p><p className="text-xs text-muted-foreground mt-1">{contact.hours}</p></div><a href={`tel:${contact.extension}`} className="h-12 w-12 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"><Phone className="h-5 w-5" /></a></CardContent></Card>)}</div></section>}

    <section><div className="flex items-center justify-between mb-3"><h2 className="font-bold flex items-center gap-2"><Users className="h-5 w-5 text-primary" />{GROUP_LABELS[group]}</h2><Badge variant="outline">{filtered.length} نتیجه</Badge></div>{filtered.length ? <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{filtered.map((contact) => <Card key={`${contact.name}-${contact.extension}`} className="hover:shadow-md hover:border-primary/30 transition"><CardHeader className="pb-2"><div className="flex items-start justify-between gap-3"><div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Building2 className="h-5 w-5" /></div>{contact.important && <Star className="h-4 w-4 fill-amber-400 text-amber-500" />}</div><CardTitle className="text-base mt-3">{contact.name}</CardTitle><p className="text-xs text-muted-foreground">{contact.unit}</p></CardHeader><CardContent className="space-y-2 text-xs text-muted-foreground"><p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{contact.location}</p><p className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5" />{contact.hours}</p><div className="flex gap-2 pt-2"><a href={`tel:${contact.extension}`} className="flex-1 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-center font-semibold"><Phone className="h-3.5 w-3.5 inline ml-1" />داخلی {contact.extension}</a><Button size="sm" variant="outline" onClick={() => { void navigator.clipboard?.writeText(contact.extension); toast.success("شماره داخلی کپی شد"); }}><Copy className="h-4 w-4" /></Button></div>{contact.direct && <p className="text-center" dir="ltr">شماره مستقیم: {contact.direct}</p>}</CardContent></Card>)}</div> : <Card><CardContent className="py-14 text-center text-sm text-muted-foreground">شماره‌ای با این مشخصات پیدا نشد.</CardContent></Card>}</section>
  </div>;
}
