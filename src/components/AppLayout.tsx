import { useState } from "react";
import { PUBLIC_TEST_MODE } from "@/lib/api";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  UtensilsCrossed,
  BookOpen,
  GraduationCap,
  User,
  ChevronDown,
  Menu,
  X,
  ClipboardCheck,
  Lock,
  Building2,
  Landmark,
  CalendarRange,
  BookMarked,
  LogOut,
  MessageSquare,
  Wrench,
  PackageCheck,
  PhoneCall,
  MessageCircle,
  Home,
  BedDouble,
  ClipboardList,
  MessagesSquare,
  CircleHelp,
  BriefcaseBusiness,
  BarChart3,
  ChartNoAxesCombined,
  QrCode,
  Receipt,
  SlidersHorizontal,
  WashingMachine,
  Vote,
  ArrowRight,
  UserCog,
  Shield,
  Maximize2,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { cn } from "@/lib/utils";
import LiveClock from "@/components/LiveClock";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import type { Permission } from "@/lib/access";
import { FULL_ACCESS_ROLES, ROLE_LABELS } from "@/lib/access";
import { api, DEMO_MODE } from "@/lib/api";
import { toast } from "sonner";
import { useChat } from "@/store/chat";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  action?: () => void;
  children?: NavChild[];
  permission?: Permission;
}

interface NavChild {
  label: string;
  path?: string;
  icon?: React.ReactNode;
  action?: () => void;
  permission?: Permission;
}

function buildNavItems(isResident: boolean): NavItem[] {
  return [
  {
    label: "خانه",
    icon: <Home className="h-5 w-5" />,
    path: "/",
  },
  {
    label: "برنامه من",
    icon: <CalendarDays className="h-5 w-5" />,
    permission: "student.use",
    children: [
      { label: "تقویم", path: "/calendar", icon: <CalendarRange className="h-4 w-4" /> },
      { label: "برنامه کلاسی", path: "/schedule" },
      { label: "امتحانات", path: "/exams" },
    ],
  },
  {
    label: "خدمات دانشجویی",
    icon: <GraduationCap className="h-5 w-5" />,
    permission: "student.use",
    children: [
      { label: "تغذیه", path: "/meal", icon: <UtensilsCrossed className="h-4 w-4" /> },
      { label: "کتابخانه", path: "/library", icon: <BookMarked className="h-4 w-4" /> },
      { label: "کمد دانشکده", path: "/locker-v2", icon: <Lock className="h-4 w-4" /> },
      { label: "خوابگاه", path: "/aminian", icon: <BedDouble className="h-4 w-4" /> },
      { label: "انتقال وعده غذا", path: "/meal-transfer", icon: <UtensilsCrossed className="h-4 w-4" /> },
      { label: isResident ? "خدمات خوابگاهی و کار دانشجویی" : "فرصت‌های کار دانشجویی", path: "/student-services", icon: <WashingMachine className="h-4 w-4" /> },
    ],
  },
  {
    label: "مرکز ارتباط دانشجویی",
    icon: <MessagesSquare className="h-5 w-5" />,
    permission: "student.use",
    path: "/communication",
  },
  {
    label: "پرتال شورای صنفی",
    icon: <Landmark className="h-5 w-5" />,
    permission: "student.use",
    path: "/council",
  },
  {
    label: "راهنما و منابع",
    icon: <CircleHelp className="h-5 w-5" />,
    permission: "student.use",
    children: [
      { label: "پایگاه دانش", path: "/kb", icon: <BookMarked className="h-4 w-4" /> },
      { label: "منابع دانشگاهی", path: "/resources", icon: <BookOpen className="h-4 w-4" /> },
      { label: "تلفن داخلی", path: "/contact", icon: <PhoneCall className="h-4 w-4" /> },
      { label: "پروفایل و یادآوری‌ها", path: "/profile", icon: <SlidersHorizontal className="h-4 w-4" /> },
    ],
  },
  {
    label: "میزکار سازمانی",
    icon: <BriefcaseBusiness className="h-5 w-5" />,
    permission: "organization.view",
    children: [
      { label: "کارتابل سرپرست", path: "/warden/tickets", icon: <ClipboardList className="h-4 w-4" />, permission: "tickets.manage" },
      { label: "عملیات خدمات", path: "/services/tickets", icon: <Wrench className="h-4 w-4" />, permission: "tickets.manage" },
      { label: "بازرسی کیفیت", path: "/quality-control", icon: <ClipboardCheck className="h-4 w-4" />, permission: "quality.manage" },
      { label: "بازرسی خوابگاه", path: "/quality-control-dorm", icon: <Building2 className="h-4 w-4" />, permission: "quality.manage" },
      { label: "انبار", path: "/warehouse/requests", icon: <PackageCheck className="h-4 w-4" />, permission: "warehouse.manage" },
      { label: "رسیدگی به شکایت‌ها", path: "/secretary/complaints", icon: <MessageSquare className="h-4 w-4" />, permission: "complaints.manage" },
      { label: "اسکن غذا", path: "/scan-meal", icon: <QrCode className="h-4 w-4" />, permission: "surveys.manage" },
      { label: "رسیدهای کمد", path: "/council/locker-receipts", icon: <Receipt className="h-4 w-4" />, permission: "lockers.manage" },
      { label: "تعریف خدمات دانشجویی", path: "/student-services", icon: <WashingMachine className="h-4 w-4" />, permission: "student_jobs.manage" },
      { label: "خدمات خوابگاهی", path: "/student-services", icon: <WashingMachine className="h-4 w-4" />, permission: "dorm.use" },
      { label: "مدیریت نظرسنجی", path: "/surveys", icon: <Vote className="h-4 w-4" />, permission: "surveys.manage" },
      { label: "گزارش‌ها", path: "/admin/tickets-dashboard", icon: <BarChart3 className="h-4 w-4" />, permission: "administration.manage" },
    ],
  },
  {
    label: "مدیریت و تصمیم‌یار",
    icon: <LayoutDashboard className="h-5 w-5" />,
    permission: "administration.manage",
    children: [
      { label: "داشبورد مدیریتی", path: "/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
      { label: "کاربران و نقش‌ها", path: "/admin/access", icon: <UserCog className="h-4 w-4" />, permission: "roles.manage" },
      { label: "شاخص‌ها", path: "/admin/tickets-dashboard", icon: <BarChart3 className="h-4 w-4" /> },
      { label: "تحلیل درخواست‌ها", path: "/admin/tickets-dashboard", icon: <ChartNoAxesCombined className="h-4 w-4" /> },
      { label: "تحلیل کیفیت خدمات", path: "/quality-control-v2", icon: <ClipboardCheck className="h-4 w-4" /> },
    ],
  },
];
}

function NavGroup({ item, collapsed, can }: { item: NavItem; collapsed: boolean; can: (permission: Permission) => boolean }) {
  const location = useLocation();
  const visibleChildren = item.children?.filter((child) => !child.permission || can(child.permission)) ?? [];
  const isChildActive = visibleChildren.some((c) => location.pathname === c.path);
  const [open, setOpen] = useState(!!isChildActive);

  if (item.path) {
    const active = location.pathname === item.path;
    return (
      <Link
        to={item.path}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
          active
            ? "bg-accent text-accent-foreground font-semibold shadow-sm"
            : "text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground"
        )}
      >
        <span className="shrink-0">{item.icon}</span>
        {!collapsed && <span className="text-sm">{item.label}</span>}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
          isChildActive
            ? "bg-white/15 text-primary-foreground font-semibold"
            : "text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground"
        )}
      >
        <span className="shrink-0">{item.icon}</span>
        {!collapsed && (
          <>
            <span className="text-sm flex-1 text-right">{item.label}</span>
            <ChevronDown
              className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")}
            />
          </>
        )}
      </button>
      {!collapsed && open && (
        <div className="mt-1 mr-4 border-r border-white/20 pr-3 space-y-1">
          {visibleChildren.map((child) => {
            const active = location.pathname === child.path;
            const className = cn(
              "flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 text-right",
              active
                ? "bg-accent text-accent-foreground font-semibold"
                : "text-primary-foreground/70 hover:bg-white/10 hover:text-primary-foreground"
            );
            if (child.action) {
              return (
                <button key={child.label} type="button" onClick={child.action} className={className}>
                  {child.icon && <span className="shrink-0">{child.icon}</span>}
                  {child.label}
                </button>
              );
            }
            return (
              <Link
                key={child.path ?? child.label}
                to={child.path ?? "/"}
                className={className}
              >
                {child.icon && <span className="shrink-0">{child.icon}</span>}
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user, roles, signOut, refresh, can } = useAuth();
  const fullAccess = roles.some((role) => FULL_ACCESS_ROLES.includes(role));
  const isImpersonating = DEMO_MODE && !!localStorage.getItem("demo-impersonated-user");
  const [chatOpen, setChatOpen] = useState(false);
  const { conversations, activeId, draft, setDraft, send } = useChat();
  const activeChat = conversations.find((conversation) => conversation.id === activeId) ?? conversations[0];

  async function returnToOwner() {
    const personaId = localStorage.getItem("demo-owner-persona") || "student-affairs-director";
    await api("/api/auth/login", { method: "POST", body: JSON.stringify({ personaId }) });
    localStorage.removeItem("demo-owner-persona");
    await refresh();
    navigate("/admin/access", { replace: true });
    toast.success("به حساب مدیر بازگشتید");
  }

  return (
    <div className="min-h-screen flex bg-muted/30 font-vazir">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-full bg-primary z-30 flex flex-col transition-all duration-300 shadow-2xl",
          collapsed ? "w-16" : "w-64",
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/20">
          {!collapsed && (
            <div>
              <p className="text-primary-foreground font-bold text-base leading-tight">سامانه دانشجویی</p>
              <p className="text-primary-foreground/60 text-xs mt-0.5">دانشگاه صنعتی</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="p-1.5 rounded-lg text-primary-foreground/70 hover:bg-white/10 hover:text-primary-foreground hidden lg:flex"
          >
            {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {buildNavItems(user?.studentProfile?.housing === "resident").filter((item) => !item.permission || can(item.permission)).map((item) => (
            <NavGroup key={item.label} item={item} collapsed={collapsed} can={can} />
          ))}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="px-4 py-3 border-t border-white/20">
            <p className="text-primary-foreground/40 text-xs text-center">نسخه ۱.۰.۰</p>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300",
          collapsed ? "lg:mr-16" : "lg:mr-64"
        )}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-4 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-foreground hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </button>
          {location.pathname !== "/" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-1.5 shrink-0"
              aria-label="بازگشت به صفحه قبل"
            >
              <ArrowRight className="h-4 w-4" />
              <span className="hidden sm:inline">بازگشت</span>
            </Button>
          )}
          <div className="flex-1 flex items-center">
            <LiveClock compact />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5" title="مشاهده حساب و تغییر نقش">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "کاربر سامانه"}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 max-h-[70vh] overflow-y-auto [direction:rtl]">
                <DropdownMenuLabel>
                  <p className="font-semibold">{[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "کاربر سامانه"}</p>
                  <p className="text-xs font-normal text-muted-foreground mt-0.5" dir="ltr">{user?.email}</p>
                </DropdownMenuLabel>
                {can("roles.manage") && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to="/admin/access" className="flex items-center gap-2 py-2"><UserCog className="h-4 w-4" /><span><span className="block text-sm font-medium">مدیریت کاربران و نقش‌ها</span><span className="block text-[11px] text-muted-foreground mt-0.5">تعریف اعضا، مجوزها و ورود با نقش</span></span></Link>
                    </DropdownMenuItem>
                  </>
                )}
                {isImpersonating && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => void returnToOwner()} className="cursor-pointer text-primary font-medium">
                      <Shield className="h-4 w-4 ml-2" />بازگشت به حساب مدیر
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-xs bg-accent/30 text-accent-foreground px-2 py-0.5 rounded-full">{fullAccess ? "شورای ناظر · دسترسی کامل" : ROLE_LABELS[roles[roles.length - 1]] ?? "کاربر"}</span>
            {!PUBLIC_TEST_MODE && <Button variant="ghost" size="sm" onClick={signOut} className="gap-1">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">خروج</span>
            </Button>}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
      <button
        type="button"
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 left-6 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="چت آنلاین با روابط عمومی"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
      </button>
      {chatOpen && (
        <div className="fixed bottom-24 left-6 z-40 w-[min(20rem,calc(100vw-3rem))] max-w-sm rounded-2xl border bg-background shadow-2xl overflow-hidden" dir="rtl">
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between"><div><p className="font-semibold text-sm">روابط عمومی آنلاین</p><p className="text-[11px] opacity-80">همگام با صفحه کامل گفتگو</p></div><div className="flex items-center gap-1"><button onClick={() => { setChatOpen(false); navigate("/communication?tab=chat"); }} className="p-1.5 rounded-lg hover:bg-white/15" aria-label="باز کردن گفت‌وگو در صفحه کامل"><Maximize2 className="h-4 w-4" /></button><button onClick={() => setChatOpen(false)} className="p-1.5 rounded-lg hover:bg-white/15 text-xl leading-none" aria-label="بستن">×</button></div></div>
          <div className="p-4 space-y-3"><div className="max-h-48 overflow-y-auto space-y-2">{activeChat?.messages.slice(-4).map((message) => <div key={message.id} className={`rounded-lg p-3 text-sm ${message.sender === "student" ? "bg-primary text-primary-foreground mr-6" : "bg-muted ml-6"}`}>{message.body}</div>)}</div><textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="پیام خود را بنویسید..." className="w-full rounded-lg border bg-background p-2 text-sm min-h-20 resize-none" /><Button className="w-full" disabled={!draft.trim()} onClick={send}>ارسال پیام</Button></div>
        </div>
      )}
    </div>
  );
}
