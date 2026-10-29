import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import {
  TCategory,
  TPriority,
  TStatus,
  categoryFa,
  priorityColor,
  priorityFa,
  statusColor,
  statusFa,
} from "@/lib/tickets";
import { formatJalali, toFa } from "@/lib/jalali";
import TicketDetailDialog from "@/components/TicketDetailDialog";

type Row = {
  id: string;
  title: string;
  status: TStatus;
  category: TCategory;
  priorityFinal: TPriority | null;
  prioritySuggested: TPriority;
  roomNo: string | null;
  createdAt: string;
};

export default function RoleTicketsList({
  title,
  subtitle,
  scope,
  roleLabel,
}: {
  title: string;
  subtitle: string;
  scope: "warden" | "services";
  roleLabel: string;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<"open" | "all">("open");

  async function load() {
    setLoading(true);
    try {
      const statusQuery = tab === "open"
        ? ""
        : "";
      const { tickets } = await api<{ tickets: Row[] }>(`/api/tickets?scope=${scope}${statusQuery}`);
      const visible = tab === "open"
        ? tickets.filter((ticket) => !["closed", "rejected", "cancelled"].includes(ticket.status))
        : tickets;
      setRows(visible);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const poll = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(poll);
  }, [scope, tab]);

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{title}</h1>
          <Badge variant="secondary">نقش: {roleLabel}</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant={tab === "open" ? "default" : "outline"} onClick={() => setTab("open")}>باز</Button>
        <Button size="sm" variant={tab === "all" ? "default" : "outline"} onClick={() => setTab("all")}>همه</Button>
      </div>

      {loading ? (
        <div className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">تیکتی وجود ندارد</div>
      ) : (
        <div className="space-y-2">
          {rows.map((ticket) => (
            <Card key={ticket.id} className="cursor-pointer hover:shadow-md transition" onClick={() => setSelected(ticket.id)}>
              <CardContent className="py-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{ticket.title}</p>
                  <div className="flex flex-wrap items-center gap-1 mt-1">
                    <Badge variant="outline" className="text-xs">{categoryFa[ticket.category]}</Badge>
                    <Badge className={`${priorityColor[ticket.priorityFinal ?? ticket.prioritySuggested]} text-xs`}>
                      {priorityFa[ticket.priorityFinal ?? ticket.prioritySuggested]}
                    </Badge>
                    {ticket.roomNo && <span className="text-xs text-muted-foreground">اتاق {toFa(ticket.roomNo)}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{formatJalali(new Date(ticket.createdAt))}</p>
                </div>
                <Badge className={statusColor[ticket.status]}>{statusFa[ticket.status]}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TicketDetailDialog ticketId={selected} onClose={() => setSelected(null)} onChange={() => void load()} />
    </div>
  );
}
