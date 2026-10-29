import { Database } from "@/integrations/supabase/types";

export type TStatus = Database["public"]["Enums"]["ticket_status"];
export type TPriority = Database["public"]["Enums"]["ticket_priority"];
export type TCategory = Database["public"]["Enums"]["ticket_category"];
export type CKind = Database["public"]["Enums"]["complaint_kind"];
export type CStatus = Database["public"]["Enums"]["complaint_status"];

export const statusFa: Record<TStatus, string> = {
  submitted: "ثبت‌شده",
  pending_warden: "در انتظار سرپرست",
  assigned: "ارجاع‌شده",
  awaiting_student_time: "در انتظار تأیید زمان",
  in_progress: "در حال انجام",
  needs_items: "نیاز به اقلام",
  items_requested: "درخواست خرید ثبت شد",
  items_ready: "اقلام آماده",
  completed: "اتمام کار",
  closed: "بسته‌شده",
  reopened: "بازگشایی شده",
  rejected: "رد شده",
  cancelled: "منصرف شده",
};

export const statusColor: Record<TStatus, string> = {
  submitted: "bg-muted text-muted-foreground",
  pending_warden: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  assigned: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200",
  awaiting_student_time: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200",
  needs_items: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
  items_requested: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
  items_ready: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  closed: "bg-green-200 text-green-900 dark:bg-green-900/60 dark:text-green-100",
  reopened: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200",
  rejected: "bg-destructive/15 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

export const priorityFa: Record<TPriority, string> = {
  critical: "بحرانی",
  high: "بالا",
  medium: "متوسط",
  low: "پایین",
};
export const priorityColor: Record<TPriority, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500 text-white",
  medium: "bg-amber-400 text-amber-950",
  low: "bg-muted text-muted-foreground",
};

export const categoryFa: Record<TCategory, string> = {
  facilities: "تأسیسات فنی",
  services: "خدمات و عمومی",
  safety: "ایمنی و اضطراری",
  admin: "اداری و رفاهی",
  complaint: "شکایت/انتقاد/پیشنهاد",
};

export const complaintKindFa: Record<CKind, string> = {
  complaint: "شکایت",
  criticism: "انتقاد",
  suggestion: "پیشنهاد",
};
export const complaintStatusFa: Record<CStatus, string> = {
  open: "باز",
  in_review: "در حال بررسی",
  resolved: "حل شده",
  rejected: "رد شده",
};
