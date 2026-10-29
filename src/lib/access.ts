export type Role =
  | "student"
  | "block_assistant"
  | "student_worker"
  | "faculty_council"
  | "dorm_council"
  | "council_member"
  | "council_secretary"
  | "central_council"
  | "warden"
  | "services"
  | "warehouse"
  | "head_of_dormitories"
  | "student_affairs_director"
  | "student_affairs_vice_chancellor"
  | "admin";

export type Permission =
  | "student.use"
  | "dorm.use"
  | "organization.view"
  | "tickets.manage"
  | "quality.manage"
  | "warehouse.manage"
  | "complaints.manage"
  | "lockers.manage"
  | "student_jobs.manage"
  | "student_jobs.approve"
  | "surveys.manage"
  | "roles.manage"
  | "dorm_services.operate"
  | "dorm_services.manage"
  | "administration.manage";

export type StudentProfile = {
  housing: "resident" | "non_resident";
  origin: "local" | "non_local";
  studyType: "day" | "evening";
  academicStanding: "eligible" | "extended";
  facultyId: string;
  dormId?: string;
  blockId?: string;
};

export const ALL_PERMISSIONS: Permission[] = [
  "student.use",
  "dorm.use",
  "organization.view",
  "tickets.manage",
  "quality.manage",
  "warehouse.manage",
  "complaints.manage",
  "lockers.manage",
  "student_jobs.manage",
  "student_jobs.approve",
  "surveys.manage",
  "roles.manage",
  "dorm_services.operate",
  "dorm_services.manage",
  "administration.manage",
];

export const ROLE_LABELS: Record<Role, string> = {
  student: "دانشجو",
  block_assistant: "همیار سرپرست بلوک",
  student_worker: "کار دانشجویی",
  faculty_council: "شورای صنفی دانشکده",
  dorm_council: "شورای صنفی خوابگاه",
  council_member: "عضو شورای صنفی",
  council_secretary: "دبیر شورای صنفی",
  central_council: "شورای صنفی مرکزی",
  warden: "سرپرست خوابگاه",
  services: "مجری خدمات",
  warehouse: "انباردار",
  head_of_dormitories: "رئیس اداره سراها",
  student_affairs_director: "مدیر دانشجویی",
  student_affairs_vice_chancellor: "معاون دانشجویی",
  admin: "مدیر سامانه",
};

export const FULL_ACCESS_ROLES: Role[] = [
  "head_of_dormitories",
  "student_affairs_director",
  "student_affairs_vice_chancellor",
  "admin",
];

export const ROLE_PERMISSIONS: Partial<Record<Role, Permission[]>> = {
  student: ["student.use"],
  block_assistant: ["student.use", "dorm.use", "organization.view", "tickets.manage"],
  student_worker: ["student.use", "dorm_services.operate"],
  faculty_council: ["student.use", "organization.view", "tickets.manage", "lockers.manage", "student_jobs.manage", "surveys.manage"],
  dorm_council: ["student.use", "dorm.use", "organization.view", "tickets.manage", "student_jobs.manage", "surveys.manage"],
  council_member: ["student.use", "organization.view", "tickets.manage", "quality.manage", "student_jobs.manage", "surveys.manage"],
  council_secretary: ["student.use", "organization.view", "tickets.manage", "complaints.manage", "lockers.manage", "student_jobs.manage", "surveys.manage", "roles.manage"],
  central_council: ["student.use", "organization.view", "tickets.manage", "quality.manage", "complaints.manage", "lockers.manage", "student_jobs.manage", "surveys.manage", "roles.manage"],
  warden: ["organization.view", "tickets.manage", "dorm.use"],
  services: ["organization.view", "tickets.manage"],
  warehouse: ["organization.view", "warehouse.manage"],
};

export function hasPermission(roles: Role[], permission: Permission) {
  if (roles.some((role) => FULL_ACCESS_ROLES.includes(role))) return true;
  return roles.some((role) => ROLE_PERMISSIONS[role]?.includes(permission));
}

export function defaultPermissionsForRole(role: Role): Permission[] {
  return FULL_ACCESS_ROLES.includes(role) ? [...ALL_PERMISSIONS] : [...(ROLE_PERMISSIONS[role] ?? [])];
}

export const ROLE_SCOPE_LABELS: Record<Role, string> = {
  student: "فقط حساب و خدمات شخصی",
  block_assistant: "خوابگاه و بلوک تخصیص‌یافته",
  student_worker: "فقط خدمت و شیفت واگذارشده",
  faculty_council: "فقط دانشکده تخصیص‌یافته",
  dorm_council: "فقط خوابگاه تخصیص‌یافته",
  council_member: "واحد شورایی تخصیص‌یافته",
  council_secretary: "اعضا و خدمات شورای تحت مدیریت",
  central_council: "همه شوراها؛ بدون تنظیمات حاکمیتی",
  warden: "خوابگاه‌های تخصیص‌یافته",
  services: "درخواست‌های ارجاع‌شده به واحد خدمات",
  warehouse: "انبار و درخواست‌های کالای تخصیص‌یافته",
  head_of_dormitories: "سراسری؛ دسترسی کامل شورای ناظر",
  student_affairs_director: "سراسری؛ دسترسی کامل شورای ناظر",
  student_affairs_vice_chancellor: "سراسری؛ دسترسی کامل شورای ناظر",
  admin: "سراسری؛ دسترسی کامل فنی",
};

export function isStudentRole(roles: Role[]) {
  return roles.some((role) => ["student", "block_assistant", "student_worker", "faculty_council", "dorm_council", "council_member", "council_secretary"].includes(role));
}

export function canUseDormServices(profile?: StudentProfile) {
  return profile?.housing === "resident";
}
