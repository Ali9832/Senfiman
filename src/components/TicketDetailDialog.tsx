import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
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
import { Loader2, Star } from "lucide-react";

type Ticket = {
  id: string;
  title: string;
  description: string;
  category: TCategory;
  status: TStatus;
  priority_suggested: TPriority;
  priority_final: TPriority | null;
  created_by: string;
  assigned_to: string | null;
  warden_id: string | null;
  room_no: string | null;
  building_id: string | null;
  sla_due_at: string | null;
  satisfaction: number | null;
  reopen_count: number;
  created_at: string;
};

type Event = {
  id: string;
  action: string;
  from_status: TStatus | null;
  to_status: TStatus | null;
  created_at: string;
};

type Comment = { id: string; body: string; created_at: string };
type Schedule = { id: string; proposed_at: string; student_confirmed: boolean | null };
type ItemRequest = {
  id: string;
  status: "requested" | "fulfilled" | "cancelled";
  items: { name?: string; qty?: number }[];
};

type ApiTicket = {
  id: string;
  title: string;
  description: string;
  category: TCategory;
  status: TStatus;
  prioritySuggested: TPriority;
  priorityFinal: TPriority | null;
  createdBy: string;
  assignedTo: string | null;
  wardenId: string | null;
  roomNo: string | null;
  buildingId: string | null;
  slaDueAt: string | null;
  satisfaction: number | null;
  reopenCount: number;
  createdAt: string;
};

type ApiEvent = {
  id: string;
  action: string;
  fromStatus: TStatus | null;
  toStatus: TStatus | null;
  createdAt: string;
};

type ApiComment = { id: string; body: string; createdAt: string };
type ApiSchedule = { id: string; proposedAt: string; studentConfirmed: boolean | null };
type ApiItemRequest = {
  id: string;
  status: ItemRequest["status"];
  items: ItemRequest["items"];
};

type TicketPatch = Partial<Pick<Ticket, "status" | "priority_final" | "assigned_to" | "warden_id" | "satisfaction" | "reopen_count">> & {
  closed_at?: string | null;
};

function toTicket(ticket: ApiTicket): Ticket {
  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    category: ticket.category,
    status: ticket.status,
    priority_suggested: ticket.prioritySuggested,
    priority_final: ticket.priorityFinal,
    created_by: ticket.createdBy,
    assigned_to: ticket.assignedTo,
    warden_id: ticket.wardenId,
    room_no: ticket.roomNo,
    building_id: ticket.buildingId,
    sla_due_at: ticket.slaDueAt,
    satisfaction: ticket.satisfaction,
    reopen_count: ticket.reopenCount,
    created_at: ticket.createdAt,
  };
}

export default function TicketDetailDialog({
  ticketId,
  onClose,
  onChange,
}: {
  ticketId: string | null;
  onClose: () => void;
  onChange?: () => void;
}) {
  const { user, hasRole, hasAnyRole } = useAuth();
  const [t, setT] = useState<Ticket | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [itemReqs, setItemReqs] = useState<ItemRequest[]>([]);
  const [newComment, setNewComment] = useState("");
  const [proposedAt, setProposedAt] = useState("");
  const [itemsText, setItemsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);

  async function load() {
    if (!ticketId) return;
    setLoading(true);
    try {
      const data = await api<{
        ticket: ApiTicket;
        events: ApiEvent[];
        comments: ApiComment[];
        schedules: ApiSchedule[];
        itemRequests: ApiItemRequest[];
      }>(`/api/tickets/${ticketId}`);
      setT(toTicket(data.ticket));
      setEvents(data.events.map((event) => ({
        id: event.id,
        action: event.action,
        from_status: event.fromStatus,
        to_status: event.toStatus,
        created_at: event.createdAt,
      })));
      setComments(data.comments.map((comment) => ({
        id: comment.id,
        body: comment.body,
        created_at: comment.createdAt,
      })));
      setSchedules(data.schedules.map((schedule) => ({
        id: schedule.id,
        proposed_at: schedule.proposedAt,
        student_confirmed: schedule.studentConfirmed,
      })));
      setItemReqs(data.itemRequests);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "دریافت جزئیات تیکت ناموفق بود");
      onClose();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ticketId) void load();
    else setT(null);
  }, [ticketId]);

  if (!ticketId) return null;

  const isOwner = t && user?.id === t.created_by;
  const isAdmin = hasAnyRole("admin", "central_council");
  const isWarden = t && (isAdmin || user?.id === t.warden_id || hasRole("warden"));
  const isServices = t && (isAdmin || user?.id === t.assigned_to || hasRole("services"));

  async function update(patch: TicketPatch, action?: string) {
    if (!t) return;
    const payload: Record<string, unknown> = {};
    if ("status" in patch) payload.status = patch.status;
    if ("priority_final" in patch) payload.priorityFinal = patch.priority_final;
    if ("assigned_to" in patch) payload.assignedTo = patch.assigned_to;
    if ("warden_id" in patch) payload.wardenId = patch.warden_id;
    if ("satisfaction" in patch) payload.satisfaction = patch.satisfaction;
    if ("reopen_count" in patch) payload.reopenCount = patch.reopen_count;
    if ("closed_at" in patch) payload.closedAt = patch.closed_at;
    try {
      await api(`/api/tickets/${t.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      if (action) toast.success(action);
      await load();
      onChange?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "به‌روزرسانی تیکت ناموفق بود");
    }
  }

  async function addComment() {
    if (!t || !newComment.trim()) return;
    try {
      await api(`/api/tickets/${t.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: newComment.trim() }),
      });
      setNewComment("");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ثبت پیام ناموفق بود");
    }
  }

  async function proposeTime() {
    if (!t || !proposedAt) return;
    try {
      await api(`/api/tickets/${t.id}/schedules`, {
        method: "POST",
        body: JSON.stringify({ proposedAt: new Date(proposedAt).toISOString() }),
      });
      await update({ status: "awaiting_student_time" }, "زمان پیشنهادی ثبت شد");
      setProposedAt("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ثبت زمان ناموفق بود");
    }
  }

  async function confirmTime(id: string, confirmed: boolean) {
    try {
      await api(`/api/ticket-schedules/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ studentConfirmed: confirmed }),
      });
      if (confirmed) await update({ status: "in_progress" }, "زمان تأیید شد");
      else await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "به‌روزرسانی زمان ناموفق بود");
    }
  }

  async function requestItems() {
    if (!t || !itemsText.trim()) return;
    const items = itemsText.split("\n")
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({ name, qty: 1 }));
    try {
      await api(`/api/tickets/${t.id}/item-requests`, {
        method: "POST",
        body: JSON.stringify({ items }),
      });
      await update({ status: "items_requested" }, "درخواست اقلام ثبت شد");
      setItemsText("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ثبت درخواست اقلام ناموفق بود");
    }
  }

  async function fulfillRequest(id: string) {
    if (!t) return;
    try {
      await api(`/api/item-requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "fulfilled" }),
      });
      await update({ status: "items_ready" }, "اقلام آماده اعلام شد");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تأمین اقلام ناموفق بود");
    }
  }

  async function rate() {
    if (!t || rating < 1) return;
    await update(
      { satisfaction: rating, status: "closed", closed_at: new Date().toISOString() },
      "تشکر! نظر شما ثبت شد",
    );
  }

  async function reopen() {
    if (!t) return;
    await update(
      { status: "reopened", reopen_count: t.reopen_count + 1, closed_at: null },
      "تیکت بازگشایی شد",
    );
  }

  return (
    <Dialog open={!!ticketId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        {loading || !t ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-right">{t.title}</DialogTitle>
            </DialogHeader>

            <div className="flex flex-wrap items-center gap-2">
              <Badge className={statusColor[t.status]}>{statusFa[t.status]}</Badge>
              <Badge className={priorityColor[t.priority_final ?? t.priority_suggested]}>
                اولویت: {priorityFa[t.priority_final ?? t.priority_suggested]}
              </Badge>
              <Badge variant="outline">{categoryFa[t.category]}</Badge>
              {t.room_no && <Badge variant="outline">اتاق {toFa(t.room_no)}</Badge>}
              {t.sla_due_at && <Badge variant="outline" className="text-xs">مهلت: {formatJalali(new Date(t.sla_due_at))}</Badge>}
            </div>

            <p className="text-sm text-foreground whitespace-pre-wrap">{t.description}</p>

            {isWarden && t.status === "pending_warden" && (
              <div className="rounded-lg border p-3 space-y-3">
                <div className="font-semibold text-sm">اقدام سرپرست</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">اولویت نهایی</Label>
                    <Select defaultValue={t.priority_final ?? t.priority_suggested} onValueChange={(value) => void update({ priority_final: value as TPriority })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(["critical", "high", "medium", "low"] as TPriority[]).map((priority) => (
                          <SelectItem key={priority} value={priority}>{priorityFa[priority]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <AssignToServices onPick={(id) => void update({ assigned_to: id, status: "assigned" }, "تیکت ارجاع شد")} />
                </div>
                <Button variant="destructive" size="sm" onClick={() => void update({ status: "rejected" }, "تیکت رد شد")}>رد تیکت</Button>
              </div>
            )}

            {isServices && (t.status === "assigned" || t.status === "in_progress" || t.status === "items_requested" || t.status === "items_ready") && (
              <div className="rounded-lg border p-3 space-y-3">
                <div className="font-semibold text-sm">اقدام مجری</div>
                {(t.status === "items_requested" || t.status === "items_ready") && (
                  <div className="rounded-md bg-teal-50 dark:bg-teal-950/30 p-3 space-y-2">
                    <p className="text-sm">
                      {t.status === "items_ready"
                        ? "اقلام درخواستی توسط انباردار آماده شده است. کار را ادامه دهید و پس از انجام، اتمام کار را اعلام کنید."
                        : "درخواست کالا برای انبار ثبت شده است. پس از آماده‌شدن اقلام، وضعیت این تیکت خودکار به‌روزرسانی می‌شود."}
                    </p>
                    {t.status === "items_ready" && <Button size="sm" onClick={() => void update({ status: "completed" }, "کار به‌اتمام رسید")}>
                      اعلام اتمام کار
                    </Button>}
                  </div>
                )}
                {t.status === "assigned" && (
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-xs">پیشنهاد زمان مراجعه</Label>
                      <Input type="datetime-local" value={proposedAt} onChange={(event) => setProposedAt(event.target.value)} />
                    </div>
                    <Button size="sm" onClick={() => void proposeTime()} disabled={!proposedAt}>ثبت</Button>
                  </div>
                )}
                {t.status !== "items_ready" && t.status !== "items_requested" && <div>
                  <Label className="text-xs">نیاز به اقلام (هر خط یک قلم)</Label>
                  <Textarea rows={2} value={itemsText} onChange={(event) => setItemsText(event.target.value)} placeholder={"مثلاً: لامپ LED ۱۲ وات\nشیر آب"} />
                  <Button size="sm" className="mt-1" onClick={() => void requestItems()} disabled={!itemsText.trim()}>ثبت درخواست خرید</Button>
                </div>}
                {t.status !== "items_ready" && t.status !== "items_requested" && <Button size="sm" onClick={() => void update({ status: "completed" }, "کار به‌اتمام رسید")}>اعلام اتمام کار</Button>}
              </div>
            )}

            {(hasAnyRole("warehouse", "admin", "central_council")) && itemReqs.length > 0 && (
              <div className="rounded-lg border p-3 space-y-2">
                <div className="font-semibold text-sm">درخواست‌های خرید</div>
                {itemReqs.map((request) => (
                  <div key={request.id} className="flex items-center justify-between text-sm">
                    <div>
                      <ul className="list-disc pr-4">
                        {request.items.map((item, index) => <li key={index}>{item.name ?? "قلم"}{item.qty ? ` × ${toFa(item.qty)}` : ""}</li>)}
                      </ul>
                      <span className="text-xs text-muted-foreground">{request.status}</span>
                    </div>
                    {request.status === "requested" && <Button size="sm" onClick={() => void fulfillRequest(request.id)}>اعلام آماده</Button>}
                  </div>
                ))}
              </div>
            )}

            {isOwner && schedules.some((schedule) => schedule.student_confirmed === null) && (
              <div className="rounded-lg border p-3 space-y-2">
                <div className="font-semibold text-sm">زمان پیشنهادی برای مراجعه</div>
                {schedules.filter((schedule) => schedule.student_confirmed === null).map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between">
                    <span className="text-sm">
                      {formatJalali(new Date(schedule.proposed_at))} ساعت{" "}
                      {toFa(new Date(schedule.proposed_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }))}
                    </span>
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => void confirmTime(schedule.id, true)}>تأیید</Button>
                      <Button size="sm" variant="outline" onClick={() => void confirmTime(schedule.id, false)}>رد</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isOwner && t.status === "completed" && !t.satisfaction && (
              <div className="rounded-lg border p-3 space-y-2">
                <div className="font-semibold text-sm">رضایت شما از انجام کار</div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button key={score} onClick={() => setRating(score)} aria-label={`امتیاز ${score}`}>
                      <Star className={`h-7 w-7 ${score <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => void rate()} disabled={rating < 1}>ثبت رضایت و بستن</Button>
                  <Button size="sm" variant="outline" onClick={() => void reopen()}>ناراضی‌ام، بازگشایی</Button>
                </div>
              </div>
            )}

            {isOwner && (t.status === "pending_warden" || t.status === "submitted") && (
              <Button variant="outline" size="sm" onClick={() => void update({ status: "cancelled" }, "تیکت لغو شد")}>انصراف از تیکت</Button>
            )}

            <div className="space-y-2">
              <div className="font-semibold text-sm">گفتگو</div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="rounded-md bg-muted/50 p-2 text-sm">
                    <div className="text-xs text-muted-foreground mb-1">{formatJalali(new Date(comment.created_at))}</div>
                    {comment.body}
                  </div>
                ))}
                {comments.length === 0 && <div className="text-xs text-muted-foreground">پیامی وجود ندارد</div>}
              </div>
              <div className="flex gap-2">
                <Textarea rows={2} value={newComment} onChange={(event) => setNewComment(event.target.value)} placeholder="پیام جدید..." />
                <Button size="sm" onClick={() => void addComment()} disabled={!newComment.trim()}>ارسال</Button>
              </div>
            </div>

            <details>
              <summary className="text-sm font-semibold cursor-pointer">تاریخچه رویدادها</summary>
              <ol className="mt-2 space-y-1 text-xs text-muted-foreground border-r pr-3">
                {events.map((event) => (
                  <li key={event.id}>
                    {formatJalali(new Date(event.created_at))} — {event.action}
                    {event.from_status && event.to_status && <> : {statusFa[event.from_status]} → {statusFa[event.to_status]}</>}
                  </li>
                ))}
              </ol>
            </details>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AssignToServices({ onPick }: { onPick: (userId: string) => void }) {
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    void api<{ users: { id: string; name: string }[] }>("/api/ticket-assignees")
      .then((data) => setUsers(data.users))
      .catch(() => setUsers([]));
  }, []);

  return (
    <div>
      <Label className="text-xs">ارجاع به مجری</Label>
      <Select onValueChange={onPick}>
        <SelectTrigger><SelectValue placeholder={users.length ? "انتخاب مجری" : "مجری ثبت نشده"} /></SelectTrigger>
        <SelectContent>
          {users.map((user) => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
