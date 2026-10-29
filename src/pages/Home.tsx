import { Link } from "react-router-dom";
import { BarChart3, ClipboardCheck, ClipboardList, LayoutDashboard, PackageCheck, ShieldCheck, Users } from "lucide-react";
import Dashboard from "@/pages/Dashboard";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_LABELS, FULL_ACCESS_ROLES, type Permission } from "@/lib/access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const links: Array<{ label: string; description: string; path: string; permission: Permission; icon: React.ReactNode }> = [
  { label: "کارتابل درخواست‌ها", description: "بررسی و ارجاع درخواست‌های دانشجویی", path: "/warden/tickets", permission: "tickets.manage", icon: <ClipboardList className="h-5 w-5" /> },
  { label: "کنترل کیفیت", description: "بازرسی و ثبت گزارش خدمات", path: "/quality-control", permission: "quality.manage", icon: <ClipboardCheck className="h-5 w-5" /> },
  { label: "انبار", description: "رسیدگی به درخواست اقلام", path: "/warehouse/requests", permission: "warehouse.manage", icon: <PackageCheck className="h-5 w-5" /> },
  { label: "مدیریت سامانه", description: "ساختمان‌ها، کاربران و نقش‌ها", path: "/admin", permission: "administration.manage", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "گزارش مدیریتی", description: "شاخص‌ها و تحلیل عملکرد", path: "/admin/tickets-dashboard", permission: "administration.manage", icon: <BarChart3 className="h-5 w-5" /> },
  { label: "خدمات دانشجویی", description: "تعریف خدمت و کار دانشجویی", path: "/student-services", permission: "student_jobs.manage", icon: <Users className="h-5 w-5" /> },
  { label: "خدمات خوابگاهی", description: "نوبت لباسشویی و وسایل امانی", path: "/student-services", permission: "dorm.use", icon: <Users className="h-5 w-5" /> },
];

export default function Home() {
  const { user, roles, can } = useAuth();
  if (user?.studentProfile) return <Dashboard />;
  const fullAccess = roles.some((role) => FULL_ACCESS_ROLES.includes(role));
  const visibleLinks = links.filter((item) => can(item.permission));

  return <div className="max-w-5xl mx-auto space-y-5">
    <div className="flex items-start justify-between gap-3 flex-wrap"><div><h1 className="text-2xl font-bold">میزکار سازمانی</h1><p className="text-sm text-muted-foreground mt-1">خوش آمدید، {user?.firstName} {user?.lastName}</p></div>{fullAccess && <Badge className="gap-1"><ShieldCheck className="h-3.5 w-3.5" />شورای ناظر · دسترسی کامل</Badge>}</div>
    <Card><CardHeader className="pb-3"><CardTitle className="text-base">سمت‌های فعال</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{roles.map((role) => <Badge key={role} variant="secondary">{ROLE_LABELS[role]}</Badge>)}</CardContent></Card>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{visibleLinks.map((item) => <Link key={item.path + item.label} to={item.path}><Card className="h-full hover:border-primary/50 hover:shadow-md transition"><CardContent className="py-5"><div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">{item.icon}</div><p className="font-semibold">{item.label}</p><p className="text-xs text-muted-foreground mt-1">{item.description}</p></CardContent></Card></Link>)}</div>
  </div>;
}
