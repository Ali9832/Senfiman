import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LaundrySettings = {
  bookingWeekday: number;
  bookingOpenHour: number;
  bookingCloseHour: number;
  minAdvanceHours: number;
  graceMinutes: number;
  slotMinutes: number;
};

export type LaundryMachine = { id: string; name: string; dormId: string; block: string; active: boolean };
export type LaundryReservation = {
  id: string;
  machineId: string;
  startAt: string;
  endAt: string;
  userId: string;
  studentName: string;
  studentCode: string;
  room: string;
  status: "booked" | "checked_in" | "completed" | "missed";
  replacedStudentName?: string;
  replacementCardImageName?: string;
};

export type DormAsset = {
  id: string;
  name: string;
  category: "vacuum" | "iron" | "sports" | "other";
  dormId: string;
  location: string;
  status: "available" | "borrowed" | "maintenance";
  borrowerId?: string;
  borrowerName?: string;
  studentCode?: string;
  room?: string;
  borrowedAt?: string;
  dueAt?: string;
  cardImageName?: string;
};

type State = {
  settings: LaundrySettings;
  machines: LaundryMachine[];
  reservations: LaundryReservation[];
  assets: DormAsset[];
  updateSettings: (patch: Partial<LaundrySettings>) => void;
  addMachine: (machine: Omit<LaundryMachine, "id">) => void;
  reserveLaundry: (reservation: Omit<LaundryReservation, "id" | "status">) => void;
  updateReservation: (id: string, patch: Partial<LaundryReservation>) => void;
  addAsset: (asset: Omit<DormAsset, "id" | "status">) => void;
  checkoutAsset: (id: string, data: Pick<DormAsset, "borrowerId" | "borrowerName" | "studentCode" | "room" | "borrowedAt" | "dueAt" | "cardImageName">) => void;
  returnAsset: (id: string) => void;
  setAssetStatus: (id: string, status: DormAsset["status"]) => void;
};

const now = Date.now();

export const useDormServices = create<State>()(
  persist(
    (set) => ({
      settings: { bookingWeekday: 5, bookingOpenHour: 18, bookingCloseHour: 24, minAdvanceHours: 3, graceMinutes: 5, slotMinutes: 60 },
      machines: [
        { id: "washer-a1", name: "لباسشویی ۱", dormId: "aminian", block: "بلوک ۱", active: true },
        { id: "washer-a2", name: "لباسشویی ۲", dormId: "aminian", block: "بلوک ۲", active: true },
        { id: "washer-r1", name: "لباسشویی ۱", dormId: "reyhaneh", block: "بلوک الف", active: true },
      ],
      reservations: [],
      assets: [
        { id: "vacuum-1", name: "جاروبرقی شماره ۱", category: "vacuum", dormId: "aminian", location: "خوابگاه امینیان · نگهبانی", status: "borrowed", borrowerId: "demo-other", borrowerName: "دانشجوی اتاق ۲۰۴", studentCode: "14021111", room: "۲۰۴", borrowedAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(), dueAt: new Date(now - 20 * 60 * 1000).toISOString(), cardImageName: "student-card-204.jpg" },
        { id: "vacuum-2", name: "جاروبرقی شماره ۲", category: "vacuum", dormId: "aminian", location: "خوابگاه امینیان · نگهبانی", status: "available" },
        { id: "iron-1", name: "اتو شماره ۱", category: "iron", dormId: "aminian", location: "خوابگاه امینیان · نگهبانی", status: "available" },
        { id: "ball-1", name: "توپ فوتبال", category: "sports", dormId: "aminian", location: "انبار ورزشی خوابگاه امینیان", status: "available" },
        { id: "racket-1", name: "ست راکت بدمینتون", category: "sports", dormId: "reyhaneh", location: "انبار ورزشی خوابگاه ریحانه", status: "borrowed", borrowerId: "demo-athlete", borrowerName: "امیر رضایی", studentCode: "14023333", room: "۱۱۰", borrowedAt: new Date(now - 30 * 60 * 1000).toISOString(), dueAt: new Date(now + 90 * 60 * 1000).toISOString(), cardImageName: "student-card-110.jpg" },
      ],
      updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
      addMachine: (machine) => set((state) => ({ machines: [...state.machines, { ...machine, id: `washer-${Date.now()}` }] })),
      reserveLaundry: (reservation) => set((state) => ({ reservations: [...state.reservations, { ...reservation, id: `laundry-${Date.now()}`, status: "booked" }] })),
      updateReservation: (id, patch) => set((state) => ({ reservations: state.reservations.map((item) => item.id === id ? { ...item, ...patch } : item) })),
      addAsset: (asset) => set((state) => ({ assets: [...state.assets, { ...asset, id: `asset-${Date.now()}`, status: "available" }] })),
      checkoutAsset: (id, data) => set((state) => ({ assets: state.assets.map((asset) => asset.id === id ? { ...asset, ...data, status: "borrowed" } : asset) })),
      returnAsset: (id) => set((state) => ({ assets: state.assets.map((asset) => asset.id === id ? { id: asset.id, name: asset.name, category: asset.category, dormId: asset.dormId, location: asset.location, status: "available" } : asset) })),
      setAssetStatus: (id, status) => set((state) => ({ assets: state.assets.map((asset) => asset.id === id ? { ...asset, status } : asset) })),
    }),
    { name: "dorm-services" },
  ),
);

export function isAssetOverdue(asset: DormAsset) {
  return asset.status === "borrowed" && !!asset.dueAt && new Date(asset.dueAt).getTime() < Date.now();
}
