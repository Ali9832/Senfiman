export type ApiUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  studentCode: string | null;
  roles: string[];
  studentProfile?: import("./access").StudentProfile;
  facultyScope?: string[];
  dormScope?: string[];
  permissionOverrides?: import("./access").Permission[];
};

import {
  DEMO_BUILDINGS,
  DEMO_COMPLAINTS,
  DEMO_PROFILES,
  DEMO_ROLES,
  DEMO_TICKETS,
  getDemoUser,
} from "./demoData";

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== "false";

const DEMO_COMPLAINTS_KEY = "demo-complaints";

function readDemoComplaints() {
  try {
    const saved = localStorage.getItem(DEMO_COMPLAINTS_KEY);
    return saved ? JSON.parse(saved) : [...DEMO_COMPLAINTS];
  } catch {
    return [...DEMO_COMPLAINTS];
  }
}

function writeDemoComplaints(items: unknown[]) {
  localStorage.setItem(DEMO_COMPLAINTS_KEY, JSON.stringify(items));
}

type ApiError = Error & { status?: number };

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (DEMO_MODE) {
    const method = init.method ?? "GET";
    const roomPath = path.match(/^\/api\/dorms\/([^/]+)\/rooms(?:\/([^/]+))?(?:\/(inspections))?$/);
    if (roomPath) {
      const [, buildingId, roomId, inspections] = roomPath;
      const key = `demo-dorm-rooms-${buildingId}`;
      const rooms = JSON.parse(localStorage.getItem(key) || "[]") as Array<{ id: string; number: string; floor: string; capacity: number }>;
      if (inspections && roomId) return { inspections: JSON.parse(localStorage.getItem(`demo-room-inspections-${roomId}`) || "[]") } as T;
      if (method === "GET") return { rooms } as T;
      const body = typeof init.body === "string" ? JSON.parse(init.body) : {};
      if (rooms.some((room) => room.number === body.number && room.id !== roomId)) throw Object.assign(new Error("Duplicate room"), { status: 409 });
      const room = { id: roomId || crypto.randomUUID(), ...body };
      localStorage.setItem(key, JSON.stringify(roomId ? rooms.map((item) => item.id === roomId ? room : item) : [...rooms, room]));
      return { room } as T;
    }
    if (path === "/api/qc/inspections" && method === "POST" && typeof init.body === "string") {
      const body = JSON.parse(init.body);
      if (body.inspectionType === "room") {
        const rooms = JSON.parse(localStorage.getItem(`demo-dorm-rooms-${body.facultyId}`) || "[]") as Array<{ id: string; number: string }>;
        const room = rooms.find((item) => item.number === body.locationValue);
        if (!room) throw Object.assign(new Error("Room not found"), { status: 404 });
        const key = `demo-room-inspections-${room.id}`;
        const inspection = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), results: body.results, details: body.details, customItems: body.customItems };
        localStorage.setItem(key, JSON.stringify([inspection, ...JSON.parse(localStorage.getItem(key) || "[]")]));
        return { inspection } as T;
      }
    }
    if (path === "/api/auth/me") {
      const user = getDemoUser();
      if (!user) throw Object.assign(new Error("نشست فعالی وجود ندارد"), { status: 401 });
      return { user } as T;
    }
    if (path === "/api/auth/login" || path === "/api/auth/signup") {
      const body = typeof init.body === "string" ? JSON.parse(init.body) : {};
      if (body.user) {
        if (!localStorage.getItem("demo-owner-persona")) localStorage.setItem("demo-owner-persona", localStorage.getItem("demo-persona") || "student-affairs-director");
        localStorage.setItem("demo-impersonated-user", JSON.stringify(body.user));
        localStorage.removeItem("demo-persona");
        return { ok: true } as T;
      }
      localStorage.removeItem("demo-impersonated-user");
      localStorage.setItem("demo-persona", body.personaId || "student-resident");
      return { ok: true } as T;
    }
    if (path === "/api/auth/logout") {
      localStorage.removeItem("demo-persona");
      localStorage.removeItem("demo-impersonated-user");
      localStorage.removeItem("demo-owner-persona");
      return undefined as T;
    }
    if (path === "/api/admin/overview") {
      return {
        buildings: DEMO_BUILDINGS,
        profiles: DEMO_PROFILES,
        roles: DEMO_ROLES,
        stats: { users: 1284, transfers: 342, lockers: 196, qc: 87 },
      } as T;
    }
    if (path.startsWith("/api/tickets") && method === "GET" && !/^\/api\/tickets\/[^?]+/.test(path)) return { tickets: DEMO_TICKETS.map((ticket, index) => ({
      id: ticket.id,
      createdBy: index % 2 === 0 ? (getDemoUser()?.id ?? "demo-user") : "u2",
      title: ticket.title,
      status: ticket.status === "open" ? "pending_warden" : ticket.status,
      category: index === 2 ? "admin" : index === 3 ? "safety" : index === 1 ? "services" : "facilities",
      priorityFinal: ticket.priority_final,
      prioritySuggested: ticket.priority_suggested,
      roomNo: index === 0 ? "۲۰۴" : index === 1 ? "۱۰۱" : null,
      createdAt: ticket.created_at,
    })) } as T;
    if (path.startsWith("/api/tickets/") && method === "GET") {
      const id = path.split("/")[3]?.split("?")[0] ?? "t1";
      const source = DEMO_TICKETS.find((ticket) => ticket.id === id) ?? DEMO_TICKETS[0];
      return { ticket: { id: source.id, createdBy: getDemoUser()?.id ?? "demo-user", title: source.title, description: "شرح کامل درخواست برای نمایش دمو.", status: source.status === "open" ? "pending_warden" : source.status, category: "facilities", priorityFinal: source.priority_final, prioritySuggested: source.priority_suggested, roomNo: "۲۰۴", buildingId: "b2", createdAt: source.created_at }, events: [], comments: [{ id: "cm1", body: "درخواست دریافت و در صف بررسی قرار گرفت.", createdAt: "2026-09-01T09:00:00Z" }], schedules: [], itemRequests: [] } as T;
    }
    if (path.startsWith("/api/tickets") && method !== "GET") return { ticket: { id: `demo-${Date.now()}` } } as T;
    if (path.startsWith("/api/complaints")) {
      const complaints = readDemoComplaints();
      if (method === "POST" && path.split("?")[0] === "/api/complaints") {
        const body = typeof init.body === "string" ? JSON.parse(init.body) : {};
        const now = new Date().toISOString();
        const complaint = {
          id: `complaint-${Date.now()}`,
          createdBy: body.isAnonymous ? null : getDemoUser()?.id ?? "demo-user",
          isAnonymous: Boolean(body.isAnonymous),
          kind: body.kind ?? "suggestion",
          title: body.title ?? "",
          body: body.body ?? "",
          status: "open",
          assignedSecretary: null,
          resolution: null,
          createdAt: now,
          updatedAt: now,
        };
        writeDemoComplaints([complaint, ...complaints]);
        return { complaint } as T;
      }
      if (method === "PATCH") {
        const id = path.split("/")[3]?.split("?")[0];
        const body = typeof init.body === "string" ? JSON.parse(init.body) : {};
        const updated = complaints.map((item: Record<string, unknown>) => item.id === id ? { ...item, ...body, updatedAt: new Date().toISOString() } : item);
        writeDemoComplaints(updated);
        return { complaint: updated.find((item: Record<string, unknown>) => item.id === id) } as T;
      }
      return { complaints } as T;
    }
    if (path.startsWith("/api/buildings")) return { buildings: DEMO_BUILDINGS } as T;
    if (path === "/api/profile/me") {
      const profile = getDemoUser()?.studentProfile;
      const residentBuildingId = profile?.housing === "resident" ? (profile.dormId === "reyhaneh" ? "b5" : "b2") : null;
      return { profile: { residentBuildingId } } as T;
    }
    if (path.startsWith("/api/kb")) return { articles: [
      { id: "kb1", title: "راهنمای ثبت درخواست خدمات", category: "services", content: "مراحل ثبت و پیگیری درخواست‌های دانشجویی در سامانه را در این مقاله می‌خوانید.", tags: ["درخواست", "خدمات"], published: true, authorId: "demo-admin", createdAt: "2026-08-20T09:00:00Z", updatedAt: "2026-08-20T09:00:00Z" },
      { id: "kb2", title: "رفع خرابی برق اتاق", category: "facilities", content: "ابتدا شماره اتاق و شرح خرابی را ثبت کنید؛ درخواست پس از تأیید سرپرست به تیم خدمات ارجاع می‌شود.", tags: ["برق", "خوابگاه"], published: true, authorId: "demo-admin", createdAt: "2026-08-22T11:00:00Z", updatedAt: "2026-08-22T11:00:00Z" },
      { id: "kb3", title: "قوانین رزرو غذا و کمد", category: "admin", content: "رزرو وعده‌های غذایی تا مهلت اعلام‌شده امکان‌پذیر است و هر دانشجو فقط یک کمد فعال می‌تواند داشته باشد.", tags: ["غذا", "کمد", "قوانین"], published: true, authorId: "demo-admin", createdAt: "2026-08-25T08:30:00Z", updatedAt: "2026-08-25T08:30:00Z" },
    ] } as T;
    if (path.startsWith("/api/item-requests")) return { itemRequests: [
      { id: "r1", ticketId: "t1", items: [{ name: "لامپ LED", qty: 12 }, { name: "فیوز مینیاتوری", qty: 4 }], status: "requested", createdAt: "2026-08-31T08:00:00Z", ticket: { id: "t1", title: "تأمین اقلام تعمیر بلوک ۲", roomNo: "۲۰۴", buildingId: "b2" } },
      { id: "r2", ticketId: "t2", items: [{ name: "مایع شوینده", qty: 8 }, { name: "دستکش کار", qty: 20 }], status: "requested", createdAt: "2026-08-29T10:00:00Z", ticket: { id: "t2", title: "درخواست اقلام خدماتی خوابگاه", roomNo: "۱۰۱", buildingId: "b2" } },
      { id: "r3", ticketId: "t3", items: [{ name: "لامپ کم‌مصرف", qty: 6 }], status: "fulfilled", createdAt: "2026-08-27T13:00:00Z", ticket: { id: "t3", title: "تأمین روشنایی راهرو", roomNo: "—", buildingId: "b1" } },
    ] } as T;
    if (path.startsWith("/api/meal-transfers")) return { transfers: [
      { id: "m1", meal: "چلو جوجه", from: "علی رضایی", to: "سارا محمدی", status: "completed", date: "۱۴۰۵/۰۶/۱۰" },
      { id: "m2", meal: "قورمه سبزی", from: "محمد کریمی", to: "نگار احمدی", status: "pending", date: "۱۴۰۵/۰۶/۱۱" },
    ] } as T;
    if (path.startsWith("/api/qc/inspections")) return { inspections: [
      { id: "q1", building_name: "خوابگاه امینیان", score: 86, status: "approved", inspector_name: "علی رضایی", inspected_at: "2026-08-30" },
      { id: "q2", building_name: "سلف مرکزی", score: 72, status: "needs_review", inspector_name: "سارا محمدی", inspected_at: "2026-08-29" },
    ] } as T;
    if (method !== "GET") return {} as T;
  }
  const response = await fetch(path, {
    credentials: "include",
    headers: { ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
    ...init,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const error: ApiError = new Error(data?.error ?? "Request failed.");
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
