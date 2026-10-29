export const DEMO_PERSONAS = [
  {
    id: "student-resident", label: "دانشجوی خوابگاهی مکانیک", group: "student",
    description: "غیربومی، روزانه، مجاز به تحصیل و ساکن خوابگاه امینیان",
    user: { id: "demo-student-mechanical-resident", email: "mechanical.resident@senfi.demo", firstName: "سارا", lastName: "احمدی", studentCode: "14021234", roles: ["student"], studentProfile: { housing: "resident", origin: "non_local", studyType: "day", academicStanding: "eligible", facultyId: "mechanical", dormId: "aminian", blockId: "b2" } },
  },
  {
    id: "student-local", label: "دانشجوی غیردرخوابگاه مکانیک", group: "student",
    description: "بومی، روزانه، مجاز به تحصیل و بدون دسترسی خدمات خوابگاهی",
    user: { id: "demo-student-mechanical-local", email: "mechanical.local@senfi.demo", firstName: "علی", lastName: "رضایی", studentCode: "14019876", roles: ["student"], studentProfile: { housing: "non_resident", origin: "local", studyType: "day", academicStanding: "eligible", facultyId: "mechanical" } },
  },
  {
    id: "student-electrical", label: "دانشجوی برق", group: "student",
    description: "غیربومی، روزانه، مجاز به تحصیل و غیردرخوابگاه",
    user: { id: "demo-student-electrical", email: "electrical.student@senfi.demo", firstName: "مریم", lastName: "کاظمی", studentCode: "14024567", roles: ["student"], studentProfile: { housing: "non_resident", origin: "non_local", studyType: "day", academicStanding: "eligible", facultyId: "electrical" } },
  },
  {
    id: "student-extended", label: "دانشجوی شبانه سنواتی", group: "student",
    description: "غیربومی، غیردرخوابگاه و دارای وضعیت سنواتی",
    user: { id: "demo-extended", email: "extended.student@senfi.demo", firstName: "نگار", lastName: "دانشجو", studentCode: "13984567", roles: ["student"], studentProfile: { housing: "non_resident", origin: "non_local", studyType: "evening", academicStanding: "extended", facultyId: "chemistry" } },
  },
  {
    id: "block-assistant", label: "همیار سرپرست بلوک", group: "organization",
    description: "دانشجوی خوابگاهی با دسترسی کارتابل بلوک",
    user: { id: "demo-block-assistant", email: "assistant@senfi.demo", firstName: "محمد", lastName: "همیار", studentCode: "14014567", roles: ["student", "block_assistant"], studentProfile: { housing: "resident", origin: "non_local", studyType: "day", academicStanding: "eligible", facultyId: "civil", dormId: "aminian", blockId: "b2" }, dormScope: ["aminian:b2"] },
  },
  {
    id: "student-worker", label: "کار دانشجویی", group: "organization",
    description: "دانشجوی مسئول خدمت واگذارشده مانند لباسشویی یا تجهیزات ورزشی",
    user: { id: "demo-student-worker", email: "student.worker@senfi.demo", firstName: "رضا", lastName: "همکار دانشجویی", studentCode: "14022345", roles: ["student", "student_worker"], studentProfile: { housing: "resident", origin: "non_local", studyType: "day", academicStanding: "eligible", facultyId: "mechanical", dormId: "aminian", blockId: "b1" }, dormScope: ["aminian:b1"] },
  },
  {
    id: "faculty-council", label: "شورای صنفی دانشکده", group: "organization",
    description: "مدیریت خدمات و کمدهای همان دانشکده",
    user: { id: "demo-faculty-council", email: "faculty.council@senfi.demo", firstName: "عضو", lastName: "شورای دانشکده", studentCode: "14005678", roles: ["student", "faculty_council"], studentProfile: { housing: "non_resident", origin: "local", studyType: "day", academicStanding: "eligible", facultyId: "electrical" }, facultyScope: ["electrical"] },
  },
  {
    id: "dorm-council", label: "شورای صنفی خوابگاه", group: "organization",
    description: "مدیریت خدمات همان خوابگاه",
    user: { id: "demo-dorm-council", email: "dorm.council@senfi.demo", firstName: "عضو", lastName: "شورای خوابگاه", studentCode: "14006789", roles: ["student", "dorm_council"], studentProfile: { housing: "resident", origin: "non_local", studyType: "day", academicStanding: "eligible", facultyId: "industrial", dormId: "aminian", blockId: "b1" }, dormScope: ["aminian"] },
  },
  {
    id: "council-secretary", label: "دبیر شورای صنفی", group: "organization",
    description: "تعریف خدمات، کار دانشجویی و نظرسنجی",
    user: { id: "demo-secretary", email: "secretary@senfi.demo", firstName: "دبیر", lastName: "شورای صنفی", studentCode: "14007890", roles: ["student", "council_secretary"], studentProfile: { housing: "resident", origin: "non_local", studyType: "day", academicStanding: "eligible", facultyId: "mechanical", dormId: "reyhaneh" } },
  },
  {
    id: "warden", label: "سرپرست خوابگاه", group: "organization",
    description: "رسیدگی به درخواست‌ها و امور خوابگاه",
    user: { id: "demo-warden", email: "warden@senfi.demo", firstName: "سرپرست", lastName: "خوابگاه", studentCode: null, roles: ["warden"], dormScope: ["aminian"] },
  },
  {
    id: "head-dormitories", label: "رئیس اداره سراها", group: "oversight",
    description: "عضو شورای ناظر با دسترسی کامل",
    user: { id: "demo-head", email: "dorm.head@senfi.demo", firstName: "رئیس", lastName: "اداره سراها", studentCode: null, roles: ["head_of_dormitories"] },
  },
  {
    id: "student-affairs-director", label: "مدیر دانشجویی", group: "oversight",
    description: "عضو شورای ناظر با دسترسی کامل",
    user: { id: "demo-director", email: "director@senfi.demo", firstName: "مدیر", lastName: "دانشجویی", studentCode: null, roles: ["student_affairs_director"] },
  },
  {
    id: "student-affairs-vice", label: "معاون دانشجویی", group: "oversight",
    description: "عضو شورای ناظر با دسترسی کامل",
    user: { id: "demo-vice", email: "vice@senfi.demo", firstName: "معاون", lastName: "دانشجویی", studentCode: null, roles: ["student_affairs_vice_chancellor"] },
  },
] as const;

export function getDemoUser() {
  const impersonated = typeof localStorage === "undefined" ? null : localStorage.getItem("demo-impersonated-user");
  if (impersonated) return JSON.parse(impersonated);
  const personaId = typeof localStorage === "undefined" ? null : localStorage.getItem("demo-persona");
  return DEMO_PERSONAS.find((persona) => persona.id === personaId)?.user ?? null;
}

export const DEMO_BUILDINGS = [
  { id: "b1", name: "دانشکده مهندسی مکانیک", kind: "faculty", capacity: 850 },
  { id: "b2", name: "خوابگاه امینیان", kind: "dorm", capacity: 420 },
  { id: "b3", name: "سلف مرکزی", kind: "cafeteria", capacity: 1200 },
  { id: "b4", name: "دانشکده برق و کامپیوتر", kind: "faculty", capacity: 700 },
  { id: "b5", name: "خوابگاه ریحانه", kind: "dorm", capacity: 380 },
];

export const DEMO_PROFILES = [
  { id: "u1", first_name: "علی", last_name: "رضایی", student_code: "40123456" },
  { id: "u2", first_name: "سارا", last_name: "محمدی", student_code: "40234567" },
  { id: "u3", first_name: "محمد", last_name: "کریمی", student_code: "40345678" },
  { id: "u4", first_name: "نگار", last_name: "احمدی", student_code: "40456789" },
];

export const DEMO_ROLES = [
  { user_id: "u1", role: "student" },
  { user_id: "u2", role: "council_member" },
  { user_id: "u3", role: "warden" },
  { user_id: "u4", role: "services" },
];

export const DEMO_TICKETS = [
  { id: "t1", title: "خرابی سیستم گرمایشی بلوک ۲", status: "open", priority_final: "critical", priority_suggested: "high", sla_due_at: "2026-09-01T10:00:00Z", created_at: "2026-08-31T08:20:00Z", closed_at: null, category: "تأسیسات", requester: "علی رضایی" },
  { id: "t2", title: "درخواست تعمیر صندلی کلاس ۱۰۴", status: "in_progress", priority_final: "medium", priority_suggested: "medium", sla_due_at: "2026-09-04T12:00:00Z", created_at: "2026-08-30T11:00:00Z", closed_at: null, category: "خدمات", requester: "سارا محمدی" },
  { id: "t3", title: "مشکل رزرو وعده ناهار", status: "completed", priority_final: "low", priority_suggested: "low", sla_due_at: "2026-08-29T12:00:00Z", created_at: "2026-08-28T07:10:00Z", closed_at: "2026-08-28T14:10:00Z", category: "تغذیه", requester: "محمد کریمی" },
  { id: "t4", title: "قطعی اینترنت خوابگاه", status: "pending", priority_final: "high", priority_suggested: "high", sla_due_at: "2026-09-02T09:00:00Z", created_at: "2026-09-01T16:40:00Z", closed_at: null, category: "فناوری", requester: "نگار احمدی" },
];

export const DEMO_COMPLAINTS = [
  { id: "c1", createdBy: "demo-admin", isAnonymous: false, kind: "complaint", title: "کیفیت غذای شام", body: "لطفاً کیفیت و تنوع غذای شام سلف مرکزی بررسی شود.", status: "open", assignedSecretary: null, resolution: null, createdAt: "2026-08-31T12:00:00Z", updatedAt: "2026-08-31T12:00:00Z" },
  { id: "c2", createdBy: "demo-admin", isAnonymous: false, kind: "suggestion", title: "افزایش ساعت کتابخانه", body: "پیشنهاد می‌شود ساعت کاری کتابخانه در ایام امتحانات تمدید شود.", status: "in_review", assignedSecretary: null, resolution: null, createdAt: "2026-08-29T09:30:00Z", updatedAt: "2026-08-29T09:30:00Z" },
  { id: "c3", createdBy: "demo-admin", isAnonymous: true, kind: "criticism", title: "نظافت سرویس‌های بلوک A", body: "نظافت سرویس‌های بهداشتی بلوک A نیاز به رسیدگی منظم‌تری دارد.", status: "resolved", assignedSecretary: null, resolution: "مورد به تیم خدمات ارجاع و برطرف شد.", createdAt: "2026-08-25T14:20:00Z", updatedAt: "2026-08-26T10:00:00Z" },
];
