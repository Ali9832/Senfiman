import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, ClipboardList, MessageCircle, MessagesSquare, Plus, Send, Vote } from "lucide-react";
import Tickets from "@/pages/Tickets";
import StudentVoice from "@/pages/StudentVoice";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useChat } from "@/store/chat";
import { toast } from "sonner";

const CAMPAIGNS = [
  { id: "food", title: "کارزار بهبود کیفیت غذای سلف", description: "درخواست انتشار ماهانه نتایج ارزیابی غذا و اقدام‌های اصلاحی", supporters: 486, deadline: "۲۰ مهر" },
  { id: "library", title: "افزایش ساعت کتابخانه در ایام امتحانات", description: "فعالیت کتابخانه مرکزی تا ساعت ۲۲ در بازه امتحانات", supporters: 312, deadline: "۲۵ مهر" },
  { id: "transport", title: "بازنگری ساعت سرویس خوابگاه‌ها", description: "هماهنگ‌سازی آخرین سرویس با پایان کلاس‌های عصر", supporters: 279, deadline: "۳۰ مهر" },
];

function FullChat() {
  const navigate = useNavigate();
  const { conversations, activeId, draft, setDraft, send, startNew, closeActive, setActive } = useChat();
  const active = conversations.find((item) => item.id === activeId) ?? conversations[0];
  return <div className="grid lg:grid-cols-[17rem_1fr] gap-4 min-h-[34rem]">
    <Card><CardHeader><Button className="w-full gap-2" onClick={startNew}><Plus className="h-4 w-4" />گفت‌وگوی جدید</Button></CardHeader><CardContent className="space-y-2 max-h-[29rem] overflow-y-auto">{conversations.map((conversation) => <button key={conversation.id} onClick={() => setActive(conversation.id)} className={`w-full rounded-xl border p-3 text-right ${conversation.id === activeId ? "border-primary bg-primary/5" : "hover:bg-muted"}`}><div className="flex justify-between gap-2"><p className="text-sm font-semibold truncate">{conversation.title}</p><Badge variant={conversation.status === "open" ? "secondary" : "outline"} className="text-[10px]">{conversation.status === "open" ? "باز" : "پایان‌یافته"}</Badge></div><p className="text-[11px] text-muted-foreground mt-1">{conversation.messages.length} پیام</p></button>)}</CardContent></Card>
    <Card className="flex flex-col"><CardHeader className="border-b flex flex-row items-center justify-between"><div><CardTitle className="text-base flex items-center gap-2"><MessageCircle className="h-4 w-4 text-emerald-600" />{active?.title}</CardTitle><p className="text-xs text-muted-foreground mt-1">روابط عمومی آنلاین · پاسخ در همین صفحه و پنجره شناور همگام می‌شود</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => navigate(-1)}><ArrowRight className="h-4 w-4 ml-1" />بازگشت</Button>{active?.status === "open" && <Button size="sm" variant="secondary" onClick={() => { closeActive(); toast.success("گفت‌وگو پایان یافت؛ می‌توانید موضوع جدیدی شروع کنید"); }}>پایان گفتگو</Button>}</div></CardHeader><CardContent className="flex-1 flex flex-col py-4"><div className="flex-1 max-h-[25rem] overflow-y-auto space-y-3 pl-2">{active?.messages.map((message) => <div key={message.id} className={`max-w-[80%] rounded-2xl p-3 text-sm leading-6 ${message.sender === "student" ? "mr-auto bg-primary text-primary-foreground rounded-bl-sm" : "ml-auto bg-muted rounded-br-sm"}`}>{message.body}</div>)}</div><div className="pt-4 border-t mt-4"><Textarea disabled={active?.status === "closed"} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={active?.status === "closed" ? "این گفت‌وگو پایان یافته است؛ گفت‌وگوی جدید بسازید." : "پیام خود را بنویسید..."} rows={3} /><Button disabled={!draft.trim() || active?.status === "closed"} onClick={send} className="mt-2 gap-2"><Send className="h-4 w-4" />ارسال پیام</Button></div></CardContent></Card>
  </div>;
}

export default function StudentCommunication() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "requests";
  const [joined, setJoined] = useState<string[]>([]);
  return <div className="max-w-6xl mx-auto space-y-5">
    <div><h1 className="text-2xl font-bold flex items-center gap-2"><MessagesSquare className="h-6 w-6 text-primary" />مرکز ارتباط دانشجویی</h1><p className="text-sm text-muted-foreground mt-1">درخواست دانشگاهی یا خوابگاهی، پیشنهاد و انتقاد، کارزار و گفت‌وگوی آنلاین در یک بخش</p></div>
    <Tabs value={tab} onValueChange={(value) => setSearchParams({ tab: value })} className="space-y-5"><TabsList className="grid grid-cols-4 h-auto"><TabsTrigger value="requests" className="gap-1 py-2"><ClipboardList className="h-4 w-4" />درخواست‌ها</TabsTrigger><TabsTrigger value="feedback" className="gap-1 py-2"><MessagesSquare className="h-4 w-4" />بازخورد</TabsTrigger><TabsTrigger value="campaigns" className="gap-1 py-2"><Vote className="h-4 w-4" />کارزارها</TabsTrigger><TabsTrigger value="chat" className="gap-1 py-2"><MessageCircle className="h-4 w-4" />گفت‌وگو</TabsTrigger></TabsList>
      <TabsContent value="requests"><Tickets /></TabsContent>
      <TabsContent value="feedback"><StudentVoice /></TabsContent>
      <TabsContent value="campaigns"><div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{CAMPAIGNS.map((campaign) => { const isJoined = joined.includes(campaign.id); return <Card key={campaign.id} className="h-full"><CardHeader><div className="flex justify-between gap-2"><Vote className="h-7 w-7 text-primary" /><Badge variant="outline">تا {campaign.deadline}</Badge></div><CardTitle className="text-base leading-7 mt-3">{campaign.title}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground leading-6">{campaign.description}</p><p className="text-xs text-muted-foreground mt-4">{campaign.supporters + (isJoined ? 1 : 0)} حامی</p><Button className="w-full mt-3 gap-2" variant={isJoined ? "secondary" : "default"} disabled={isJoined} onClick={() => { setJoined([...joined, campaign.id]); toast.success("حمایت شما از کارزار ثبت شد"); }}>{isJoined ? <><CheckCircle2 className="h-4 w-4" />عضو کارزار شدید</> : "پیوستن به کارزار"}</Button></CardContent></Card>; })}</div></TabsContent>
      <TabsContent value="chat"><FullChat /></TabsContent>
    </Tabs>
  </div>;
}
