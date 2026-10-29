import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ColorTheme = "ocean" | "sunset" | "forest" | "royal";
export type Major = "mechanical" | "electrical" | "chemistry" | "civil" | "industrial" | "basic";
export type ThemeMode = "auto" | "light" | "dark";
export type ReminderKey = "weeklyMealReservation" | "mealPickup" | "mealSurvey" | "laundryTurn";
export type ReminderSettings = Record<ReminderKey, boolean>;

export const COLOR_THEMES: Record<ColorTheme, { label: string; primary: string; accent: string; preview: string }> = {
  ocean:  { label: "اقیانوس", primary: "217 50% 23%", accent: "199 90% 50%",  preview: "#1a4a7e" },
  sunset: { label: "غروب",     primary: "14 80% 45%",  accent: "38 92% 56%",   preview: "#c44a1a" },
  forest: { label: "جنگل",     primary: "150 45% 25%", accent: "120 50% 50%",  preview: "#2a6b4a" },
  royal:  { label: "سلطنتی",   primary: "265 50% 35%", accent: "45 80% 60%",   preview: "#5a3a9e" },
};

export const MAJORS: Record<Major, { label: string; emoji: string; gradient: string }> = {
  mechanical:  { label: "مهندسی مکانیک",       emoji: "⚙️", gradient: "from-slate-100 via-blue-50 to-zinc-100 dark:from-slate-900 dark:via-blue-950 dark:to-zinc-900" },
  electrical:  { label: "مهندسی برق و کامپیوتر", emoji: "💡", gradient: "from-amber-50 via-yellow-50 to-orange-100 dark:from-amber-950 dark:via-yellow-950 dark:to-orange-950" },
  chemistry:   { label: "مهندسی شیمی",          emoji: "🧪", gradient: "from-emerald-50 via-teal-50 to-cyan-100 dark:from-emerald-950 dark:via-teal-950 dark:to-cyan-950" },
  civil:       { label: "مهندسی عمران",         emoji: "🏗️", gradient: "from-stone-100 via-amber-50 to-yellow-100 dark:from-stone-900 dark:via-amber-950 dark:to-yellow-950" },
  industrial:  { label: "صنایع و مواد",         emoji: "🏭", gradient: "from-orange-50 via-red-50 to-rose-100 dark:from-orange-950 dark:via-red-950 dark:to-rose-950" },
  basic:       { label: "علوم پایه",            emoji: "🔬", gradient: "from-violet-50 via-purple-50 to-fuchsia-100 dark:from-violet-950 dark:via-purple-950 dark:to-fuchsia-950" },
};

type State = {
  studentId: string;
  colorTheme: ColorTheme;
  major: Major;
  facultyConfirmed: boolean;
  themeMode: ThemeMode;
  reminders: ReminderSettings;
  setStudentId: (v: string) => void;
  setColorTheme: (v: ColorTheme) => void;
  setMajor: (v: Major) => void;
  setThemeMode: (v: ThemeMode) => void;
  toggleReminder: (key: ReminderKey) => void;
};

export const usePreferences = create<State>()(
  persist(
    (set) => ({
      studentId: "98123456",
      colorTheme: "ocean",
      major: "mechanical",
      facultyConfirmed: false,
      themeMode: "auto",
      reminders: {
        weeklyMealReservation: true,
        mealPickup: true,
        mealSurvey: true,
        laundryTurn: true,
      },
      setStudentId: (v) => set({ studentId: v }),
      setColorTheme: (v) => set({ colorTheme: v }),
      setMajor: (v) => set({ major: v, facultyConfirmed: true }),
      setThemeMode: (v) => set({ themeMode: v }),
      toggleReminder: (key) => set((state) => ({ reminders: { ...state.reminders, [key]: !state.reminders[key] } })),
    }),
    { name: "app-preferences" }
  )
);
