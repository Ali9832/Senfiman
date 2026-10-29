import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultPermissionsForRole, type Permission, type Role, type StudentProfile } from "@/lib/access";

export type AccessCategory = "student_affairs" | "councils" | "students";

export type AccessUnit = {
  id: string;
  category: AccessCategory;
  name: string;
  description: string;
  scopeType: "university" | "faculty" | "dorm" | "student_group";
  scopeId?: string;
};

export type ManagedMember = {
  id: string;
  unitId: string;
  name: string;
  title: string;
  role: Role;
  permissions: Permission[];
  studentCode?: string;
  studentProfile?: StudentProfile;
  permissionMode?: "role_default" | "custom";
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  "student.use": "خدمات دانشجویی",
  "dorm.use": "خدمات خوابگاه",
  "organization.view": "میزکار سازمانی",
  "tickets.manage": "مدیریت درخواست‌ها",
  "quality.manage": "کنترل کیفیت",
  "warehouse.manage": "مدیریت انبار",
  "complaints.manage": "رسیدگی به شکایت‌ها",
  "lockers.manage": "مدیریت کمدها",
  "student_jobs.manage": "تعریف کار دانشجویی",
  "student_jobs.approve": "تأیید کارکرد و پرداخت",
  "surveys.manage": "مدیریت نظرسنجی",
  "roles.manage": "تعریف اعضا و نقش‌ها",
  "dorm_services.operate": "تحویل خدمات خوابگاهی",
  "dorm_services.manage": "تنظیم خدمات خوابگاهی",
  "administration.manage": "مدیریت کل سامانه",
};

export const ACCESS_UNITS: AccessUnit[] = [
  { id: "oversight", category: "student_affairs", name: "شورای ناظر", description: "معاون دانشجویی، مدیر دانشجویی و رئیس اداره سراها", scopeType: "university" },
  { id: "wardens-female", category: "student_affairs", name: "سرپرستان خوابگاه‌های دخترانه", description: "تعریف سرپرست هر سرا و محدوده دسترسی او", scopeType: "dorm", scopeId: "female" },
  { id: "wardens-male", category: "student_affairs", name: "سرپرستان خوابگاه‌های پسرانه", description: "تعریف سرپرست هر سرا و محدوده دسترسی او", scopeType: "dorm", scopeId: "male" },
  { id: "central-council", category: "councils", name: "شورای صنفی مرکزی", description: "دبیر شورای مرکزی و اعضا", scopeType: "university" },
  { id: "faculty-mechanical", category: "councils", name: "شورای صنفی دانشکده مکانیک", description: "دبیر و اعضای شورای دانشکده", scopeType: "faculty", scopeId: "mechanical" },
  { id: "faculty-electrical", category: "councils", name: "شورای صنفی برق و کامپیوتر", description: "دبیر و اعضای شورای دانشکده", scopeType: "faculty", scopeId: "electrical" },
  { id: "faculty-chemistry", category: "councils", name: "شورای صنفی دانشکده شیمی", description: "دبیر و اعضای شورای دانشکده", scopeType: "faculty", scopeId: "chemistry" },
  { id: "faculty-industrial", category: "councils", name: "شورای صنفی صنایع و مواد", description: "دبیر و اعضای شورای دانشکده", scopeType: "faculty", scopeId: "industrial" },
  { id: "faculty-civil", category: "councils", name: "شورای صنفی دانشکده عمران", description: "دبیر و اعضای شورای دانشکده", scopeType: "faculty", scopeId: "civil" },
  { id: "faculty-basic", category: "councils", name: "شورای صنفی علوم پایه", description: "دبیر و اعضای شورای دانشکده", scopeType: "faculty", scopeId: "basic" },
  { id: "dorm-aminian", category: "councils", name: "شورای صنفی خوابگاه امینیان", description: "دبیر و اعضای شورای خوابگاه", scopeType: "dorm", scopeId: "aminian" },
  { id: "dorm-reyhaneh", category: "councils", name: "شورای صنفی خوابگاه ریحانه", description: "دبیر و اعضای شورای خوابگاه", scopeType: "dorm", scopeId: "reyhaneh" },
  { id: "students-resident", category: "students", name: "دانشجویان خوابگاهی", description: "تفکیک دخترانه، پسرانه، بلوک و اتاق", scopeType: "student_group" },
  { id: "students-nonresident", category: "students", name: "دانشجویان غیردرخوابگاه", description: "بومی یا غیربومی، روزانه یا شبانه و وضعیت سنوات", scopeType: "student_group" },
  { id: "block-assistants", category: "students", name: "همیاران سرپرست بلوک", description: "دانشجوی دارای دسترسی محدود همان بلوک", scopeType: "student_group" },
  { id: "student-workers", category: "students", name: "کارهای دانشجویی", description: "لباسشویی، وسایل ورزشی، جاروبرقی و سایر خدمات", scopeType: "student_group" },
];

const INITIAL_MEMBERS: ManagedMember[] = [
  { id: "m-vice", unitId: "oversight", name: "دکتر نادری", title: "معاون دانشجویی", role: "student_affairs_vice_chancellor", permissions: ["administration.manage", "roles.manage", "dorm_services.manage"] },
  { id: "m-director", unitId: "oversight", name: "دکتر احمدی", title: "مدیر دانشجویی", role: "student_affairs_director", permissions: ["administration.manage", "roles.manage", "dorm_services.manage"] },
  { id: "m-head", unitId: "oversight", name: "مهندس رضایی", title: "رئیس اداره سراها", role: "head_of_dormitories", permissions: ["administration.manage", "roles.manage", "dorm_services.manage"] },
  { id: "m-warden-f", unitId: "wardens-female", name: "خانم محمدی", title: "سرپرست خوابگاه ریحانه", role: "warden", permissions: ["organization.view", "tickets.manage", "dorm.use"] },
  { id: "m-warden-m", unitId: "wardens-male", name: "آقای کریمی", title: "سرپرست خوابگاه امینیان", role: "warden", permissions: ["organization.view", "tickets.manage", "dorm.use"] },
  { id: "m-central-secretary", unitId: "central-council", name: "سارا اکبری", title: "دبیر شورای صنفی مرکزی", role: "council_secretary", permissions: ["roles.manage", "student_jobs.manage", "surveys.manage", "complaints.manage"] },
  { id: "m-mechanical-secretary", unitId: "faculty-mechanical", name: "امیرحسین توکلی", title: "دبیر شورای دانشکده مکانیک", role: "faculty_council", permissions: ["student.use", "organization.view", "tickets.manage", "lockers.manage", "student_jobs.manage", "surveys.manage"] },
  { id: "m-electrical-secretary", unitId: "faculty-electrical", name: "علی مرادی", title: "دبیر شورای دانشکده", role: "faculty_council", permissions: ["lockers.manage", "student_jobs.manage", "surveys.manage"] },
  { id: "m-chemistry-secretary", unitId: "faculty-chemistry", name: "نگار محمدی", title: "دبیر شورای دانشکده شیمی", role: "faculty_council", permissions: ["student.use", "organization.view", "tickets.manage", "lockers.manage", "student_jobs.manage", "surveys.manage"] },
  { id: "m-industrial-secretary", unitId: "faculty-industrial", name: "پارسا کریمی", title: "دبیر شورای صنایع و مواد", role: "faculty_council", permissions: ["student.use", "organization.view", "tickets.manage", "lockers.manage", "student_jobs.manage", "surveys.manage"] },
  { id: "m-civil-secretary", unitId: "faculty-civil", name: "زهرا موسوی", title: "دبیر شورای دانشکده عمران", role: "faculty_council", permissions: ["student.use", "organization.view", "tickets.manage", "lockers.manage", "student_jobs.manage", "surveys.manage"] },
  { id: "m-basic-secretary", unitId: "faculty-basic", name: "کیانا احمدی", title: "دبیر شورای علوم پایه", role: "faculty_council", permissions: ["student.use", "organization.view", "tickets.manage", "lockers.manage", "student_jobs.manage", "surveys.manage"] },
  { id: "m-dorm-member", unitId: "dorm-aminian", name: "محمد حسینی", title: "عضو شورای خوابگاه", role: "dorm_council", permissions: ["student_jobs.manage", "surveys.manage"] },
  { id: "m-dorm-reyhaneh", unitId: "dorm-reyhaneh", name: "فاطمه رحیمی", title: "دبیر شورای خوابگاه ریحانه", role: "dorm_council", permissions: ["student.use", "dorm.use", "organization.view", "tickets.manage", "student_jobs.manage", "surveys.manage"] },
  { id: "m-worker-laundry", unitId: "student-workers", name: "رضا کاظمی", title: "مسئول شیفت لباسشویی", role: "student_worker", permissions: ["student.use", "dorm_services.operate"], studentCode: "14022345" },
  { id: "m-assistant", unitId: "block-assistants", name: "مهدی صادقی", title: "همیار بلوک ۲ امینیان", role: "block_assistant", permissions: ["student.use", "dorm.use", "tickets.manage"], studentCode: "14014567" },
  { id: "m-student-mech-resident", unitId: "students-resident", name: "سارا احمدی", title: "دانشجوی خوابگاهی مکانیک", role: "student", permissions: ["student.use"], permissionMode: "role_default", studentCode: "14021234", studentProfile: { housing: "resident", origin: "non_local", studyType: "day", academicStanding: "eligible", facultyId: "mechanical", dormId: "aminian", blockId: "b2" } },
  { id: "m-student-mech-local", unitId: "students-nonresident", name: "علی رضایی", title: "دانشجوی غیردرخوابگاه مکانیک", role: "student", permissions: ["student.use"], permissionMode: "role_default", studentCode: "14019876", studentProfile: { housing: "non_resident", origin: "local", studyType: "day", academicStanding: "eligible", facultyId: "mechanical" } },
  { id: "m-student-electrical", unitId: "students-nonresident", name: "مریم کاظمی", title: "دانشجوی غیردرخوابگاه برق", role: "student", permissions: ["student.use"], permissionMode: "role_default", studentCode: "14024567", studentProfile: { housing: "non_resident", origin: "non_local", studyType: "day", academicStanding: "eligible", facultyId: "electrical" } },
];

type State = {
  members: ManagedMember[];
  addMember: (member: Omit<ManagedMember, "id">) => void;
  updateMember: (id: string, patch: Partial<Omit<ManagedMember, "id">>) => void;
  togglePermission: (id: string, permission: Permission) => void;
  resetPermissions: (id: string) => void;
};

export const useAccessManagement = create<State>()(
  persist(
    (set) => ({
      members: INITIAL_MEMBERS,
      addMember: (member) => set((state) => ({ members: [...state.members, { ...member, id: `member-${Date.now()}` }] })),
      updateMember: (id, patch) => set((state) => ({ members: state.members.map((member) => member.id === id ? { ...member, ...patch } : member) })),
      togglePermission: (id, permission) => set((state) => ({ members: state.members.map((member) => {
        if (member.id !== id) return member;
        const current = member.permissionMode === "custom" ? member.permissions : defaultPermissionsForRole(member.role);
        return { ...member, permissionMode: "custom", permissions: current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission] };
      }) })),
      resetPermissions: (id) => set((state) => ({ members: state.members.map((member) => member.id === id ? { ...member, permissionMode: "role_default", permissions: defaultPermissionsForRole(member.role) } : member) })),
    }),
    {
      name: "access-management",
      version: 2,
      merge: (persisted, current) => {
        const saved = persisted as Partial<State> | undefined;
        const savedMembers = saved?.members ?? [];
        const missingSeeds = INITIAL_MEMBERS.filter((seed) => !savedMembers.some((member) => member.id === seed.id));
        return { ...current, ...saved, members: [...savedMembers, ...missingSeeds] };
      },
    },
  ),
);
