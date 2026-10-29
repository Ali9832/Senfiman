import { create } from "zustand";
import { persist } from "zustand/middleware";

export type EventKind = "class" | "exam" | "quiz" | "assignment" | "midterm" | "event" | "library";

export const EVENT_KIND_LABELS: Record<EventKind, string> = {
  class: "کلاس",
  exam: "امتحان پایان‌ترم",
  quiz: "کوئیز",
  assignment: "تحویل تمرین/پروژه",
  midterm: "میان‌ترم",
  event: "رویداد دانشگاهی",
  library: "عودت کتاب",
};

export const EVENT_KIND_COLORS: Record<EventKind, string> = {
  class: "bg-blue-500",
  exam: "bg-red-500",
  quiz: "bg-amber-500",
  assignment: "bg-purple-500",
  midterm: "bg-orange-500",
  event: "bg-emerald-500",
  library: "bg-pink-500",
};

export type AppEvent = {
  id: string;
  title: string;
  kind: EventKind;
  date: string; // ISO yyyy-mm-dd (gregorian for sort/compare)
  time?: string; // HH:mm
  endTime?: string;
  location?: string;
  notes?: string;
  // Recurring weekly (for classes)
  weekday?: number; // 0..6 (Saturday-first in display, but use JS 0=Sun)
  recurring?: boolean;
  reminderMinutes?: number;
};

type State = {
  events: AppEvent[];
  add: (e: Omit<AppEvent, "id">) => string;
  update: (id: string, patch: Partial<AppEvent>) => void;
  remove: (id: string) => void;
};

export const useEvents = create<State>()(
  persist(
    (set) => ({
      events: [
        { id: "c1", title: "ریاضی عمومی ۲", kind: "class", date: "2025-09-20", time: "08:00", endTime: "10:00", location: "کلاس ۱۰۳", recurring: true, weekday: 6, notes: "استاد رضایی" },
        { id: "c2", title: "فیزیک پایه", kind: "class", date: "2025-09-21", time: "10:00", endTime: "12:00", location: "آمفی تئاتر", recurring: true, weekday: 0, notes: "استاد احمدی" },
        { id: "e1", title: "مقاومت مصالح — میان‌ترم ۱", kind: "midterm", date: "2026-06-01", time: "09:00", location: "آمفی تئاتر ۱" },
        { id: "e2", title: "ریاضی عمومی ۲ — کوئیز", kind: "quiz", date: "2026-05-30", time: "14:00", location: "کلاس ۲۰۳" },
        { id: "ev1", title: "انتخابات شورای صنفی", kind: "event", date: "2026-06-03" },
      ],
      add: (e) => {
        const id = `ev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        set((s) => ({ events: [...s.events, { id, ...e }] }));
        return id;
      },
      update: (id, patch) => set((s) => ({ events: s.events.map((ev) => (ev.id === id ? { ...ev, ...patch } : ev)) })),
      remove: (id) => set((s) => ({ events: s.events.filter((ev) => ev.id !== id) })),
    }),
    { name: "app-events" }
  )
);
