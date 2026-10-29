import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, Search, BookOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { KnowledgeBaseArticle, KnowledgeBaseCategory, knowledgeBaseCategoryFa } from "@/lib/knowledgeBase";
import { formatJalali } from "@/lib/jalali";

type Article = KnowledgeBaseArticle;

const CATS: KnowledgeBaseCategory[] = ["facilities", "services", "safety", "admin"];

export default function KnowledgeBase() {
  const { hasAnyRole } = useAuth();
  const canEdit = hasAnyRole("admin", "central_council");
  const [rows, setRows] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<KnowledgeBaseCategory | "all">("all");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Article | null>(null);
  const [form, setForm] = useState({ title: "", category: "facilities" as KnowledgeBaseCategory, content: "", tags: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { articles } = await api<{ articles: Article[] }>("/api/kb");
      setRows(articles);
    } catch { toast.error("خطا در دریافت پایگاه دانش"); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.title.trim() || !form.content.trim()) return toast.error("عنوان و محتوا الزامی است");
    setSaving(true);
    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
    try {
      await api("/api/kb", { method: "POST", body: JSON.stringify({ title: form.title.trim(), category: form.category, content: form.content.trim(), tags }) });
    } catch (error) {
      setSaving(false);
      return toast.error(error instanceof Error ? error.message : "خطا در ذخیره مقاله");
    }
    setSaving(false);
    toast.success("مقاله اضافه شد");
    setForm({ title: "", category: "facilities", content: "", tags: "" });
    setOpen(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("حذف مقاله؟")) return;
    try { await api(`/api/kb/${id}`, { method: "DELETE" }); }
    catch (error) { return toast.error(error instanceof Error ? error.message : "خطا در حذف مقاله"); }
    setSelected(null);
    load();
  }

  const filtered = rows.filter((r) => {
    if (cat !== "all" && r.category !== cat) return false;
    if (q && !(r.title.includes(q) || r.content.includes(q) || r.tags.some((t) => t.includes(q)))) return false;
    return true;
  });

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="h-6 w-6 text-primary" />پایگاه دانش</h1>
          <p className="text-sm text-muted-foreground mt-1">راه‌حل مشکلات پرتکرار خوابگاه</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />مقاله جدید</Button></DialogTrigger>
            <DialogContent dir="rtl" className="max-w-lg">
              <DialogHeader><DialogTitle>افزودن مقاله</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>عنوان</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div>
                  <Label>دسته</Label>
                  <Select value={form.category} onValueChange={(v: KnowledgeBaseCategory) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{knowledgeBaseCategoryFa[c]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>محتوا</Label><Textarea rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
                <div><Label>تگ‌ها (با کاما جدا)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="برق، لامپ" /></div>
                <Button onClick={save} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "ذخیره"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجو..." className="pr-9" />
        </div>
        <Select value={cat} onValueChange={(v: any) => setCat(v)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه دسته‌ها</SelectItem>
            {CATS.map((c) => <SelectItem key={c} value={c}>{knowledgeBaseCategoryFa[c]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <div className="w-16 h-16 rounded-2xl bg-muted mx-auto flex items-center justify-center text-3xl">📚</div>
          <p className="mt-3">مقاله‌ای یافت نشد</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <Card key={a.id} className="cursor-pointer hover:shadow-md transition" onClick={() => setSelected(a)}>
              <CardContent className="py-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{a.title}</p>
                  <Badge variant="outline" className="text-xs shrink-0">{knowledgeBaseCategoryFa[a.category]}</Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{a.content}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {a.tags.map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent dir="rtl" className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader><DialogTitle className="text-right">{selected.title}</DialogTitle></DialogHeader>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline">{knowledgeBaseCategoryFa[selected.category]}</Badge>
                {selected.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
              </div>
              <p className="text-xs text-muted-foreground">{formatJalali(new Date(selected.createdAt))}</p>
              <div className="whitespace-pre-wrap text-sm leading-7">{selected.content}</div>
              {canEdit && (
                <Button variant="destructive" size="sm" onClick={() => remove(selected.id)} className="gap-1 w-fit">
                  <Trash2 className="h-4 w-4" />حذف
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
