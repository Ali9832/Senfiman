import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { formatJalali, toFa } from "@/lib/jalali";
import TicketDetailDialog from "@/components/TicketDetailDialog";

type ItemRequest = {
  id: string;
  ticketId: string;
  items: { name?: string; qty?: number }[];
  status: "requested" | "fulfilled" | "cancelled";
  createdAt: string;
  ticket: { id: string; title: string; roomNo: string | null; buildingId: string | null };
};

export default function WarehouseRequests() {
  const [rows, setRows] = useState<ItemRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"requested" | "fulfilled">("requested");
  const [selected, setSelected] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { itemRequests } = await api<{ itemRequests: ItemRequest[] }>(`/api/item-requests?status=${tab}`);
      setRows(itemRequests);
    } catch (error) {
      setRows([]);
      toast.error(error instanceof Error ? error.message : "دریافت درخواست‌ها ناموفق بود");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const poll = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(poll);
  }, [tab]);

  async function fulfill(id: string) {
    try {
      await api(`/api/item-requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "fulfilled" }),
      });
      toast.success("اقلام آماده اعلام شد");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تأمین اقلام ناموفق بود");
    }
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">درخواست‌های خرید</h1>
          <Badge variant="secondary">نقش: انباردار</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">تأمین اقلام مورد نیاز مجری‌ها</p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant={tab === "requested" ? "default" : "outline"} onClick={() => setTab("requested")}>در انتظار تأمین</Button>
        <Button size="sm" variant={tab === "fulfilled" ? "default" : "outline"} onClick={() => setTab("fulfilled")}>آماده‌شده</Button>
      </div>

      {loading ? (
        <div className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">درخواستی وجود ندارد</div>
      ) : (
        <div className="space-y-2">
          {rows.map((request) => (
            <Card key={request.id}>
              <CardContent className="py-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <button className="font-semibold text-right" onClick={() => setSelected(request.ticketId)}>
                    {request.ticket.title}
                  </button>
                  {request.ticket.roomNo && <Badge variant="outline" className="text-xs">اتاق {toFa(request.ticket.roomNo)}</Badge>}
                </div>
                <ul className="list-disc pr-5 text-sm">
                  {request.items.map((item, index) => (
                    <li key={index}>{item.name ?? "قلم"}{item.qty ? ` × ${toFa(item.qty)}` : ""}</li>
                  ))}
                </ul>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{formatJalali(new Date(request.createdAt))}</span>
                  {request.status === "requested" && <Button size="sm" onClick={() => void fulfill(request.id)}>اعلام آماده</Button>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TicketDetailDialog ticketId={selected} onClose={() => setSelected(null)} onChange={() => void load()} />
    </div>
  );
}
