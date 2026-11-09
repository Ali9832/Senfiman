import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Dorm = { id: string; name: string; kind: string };
type Room = { id: string; number: string; floor: string; capacity: number };

export function DormRooms({ buildings }: { buildings: Dorm[] }) {
  const dorms = buildings.filter((building) => building.kind === "dorm");
  const [dormId, setDormId] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [room, setRoom] = useState({ number: "", floor: "", capacity: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!dormId) { setRooms([]); return; }
    let active = true;
    setLoading(true);
    setError("");
    api<{ rooms: Room[] }>(`/api/dorms/${dormId}/rooms`)
      .then(({ rooms: data }) => { if (active) setRooms(data); })
      .catch(() => { if (active) { setRooms([]); setError("دریافت اتاق‌ها ناموفق بود؛ دوباره خوابگاه را انتخاب کنید."); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [dormId]);

  const reset = () => { setEditing(null); setRoom({ number: "", floor: "", capacity: "" }); };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const capacity = Number(room.capacity);
    if (!dormId || !room.number.trim() || !room.floor.trim() || !Number.isInteger(capacity) || capacity < 1 || capacity > 1000) {
      toast.error("شماره، طبقه و ظرفیت معتبر اتاق را وارد کنید");
      return;
    }
    setSaving(true);
    try {
      const { room: saved } = await api<{ room: Room }>(`/api/dorms/${dormId}/rooms${editing ? `/${editing}` : ""}`, {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify({ number: room.number.trim(), floor: room.floor.trim(), capacity }),
      });
      setRooms((current) => editing ? current.map((item) => item.id === editing ? saved : item) : [...current, saved]);
      reset();
      toast.success("اطلاعات اتاق ذخیره شد");
    } catch (cause) {
      const status = (cause as Error & { status?: number }).status;
      toast.error(status === 409 ? "این شماره اتاق قبلاً برای خوابگاه ثبت شده است" : "ذخیره اتاق ناموفق بود؛ دوباره تلاش کنید");
    } finally { setSaving(false); }
  };

  return (
    <section className="space-y-4 border-t pt-5" aria-labelledby="dorm-rooms-title">
      <div><h2 id="dorm-rooms-title" className="font-semibold">مدیریت اتاق‌های خوابگاه</h2><p className="text-sm text-muted-foreground">خوابگاه را انتخاب کنید و شماره، طبقه و ظرفیت اتاق‌های آن را ثبت کنید.</p></div>
      {dorms.length === 0 ? <p className="text-sm text-muted-foreground">ابتدا یک خوابگاه در بخش ساختمان‌ها اضافه کنید.</p> : <>
        <div className="space-y-1"><Label htmlFor="room-dorm">خوابگاه</Label><Select value={dormId} onValueChange={(value) => { setDormId(value); reset(); }}><SelectTrigger id="room-dorm"><SelectValue placeholder="انتخاب خوابگاه" /></SelectTrigger><SelectContent>{dorms.map((dorm) => <SelectItem key={dorm.id} value={dorm.id}>{dorm.name}</SelectItem>)}</SelectContent></Select></div>
        {dormId && <>
          <form onSubmit={save} className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1"><Label htmlFor="room-number">شماره اتاق</Label><Input id="room-number" value={room.number} maxLength={100} onChange={(event) => setRoom({ ...room, number: event.target.value })} required /></div>
            <div className="space-y-1"><Label htmlFor="room-floor">طبقه</Label><Input id="room-floor" value={room.floor} maxLength={100} onChange={(event) => setRoom({ ...room, floor: event.target.value })} required /></div>
            <div className="space-y-1"><Label htmlFor="room-capacity">ظرفیت</Label><Input id="room-capacity" type="number" min="1" max="1000" value={room.capacity} onChange={(event) => setRoom({ ...room, capacity: event.target.value })} required /></div>
            <div className="sm:col-span-3 flex gap-2"><Button type="submit" disabled={saving || loading}>{saving ? "در حال ذخیره..." : editing ? "ذخیره تغییرات" : "افزودن اتاق"}</Button>{editing && <Button type="button" variant="outline" onClick={reset}>انصراف</Button>}</div>
          </form>
          {loading ? <p className="text-sm">در حال دریافت اتاق‌ها...</p> : error ? <p role="alert" className="text-sm text-destructive">{error}</p> : rooms.length === 0 ? <p className="text-sm text-muted-foreground">هنوز اتاقی برای این خوابگاه ثبت نشده است.</p> : <ul className="divide-y rounded-md border">{rooms.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 p-3"><span className="text-sm">اتاق {item.number} · طبقه {item.floor} · ظرفیت {item.capacity} نفر</span><Button type="button" variant="outline" size="sm" onClick={() => { setEditing(item.id); setRoom({ number: item.number, floor: item.floor, capacity: String(item.capacity) }); }}>ویرایش</Button></li>)}</ul>}
        </>}
      </>}
    </section>
  );
}
