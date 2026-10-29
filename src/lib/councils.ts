export type CouncilKind = "central" | "faculty" | "dorm";
export type CaseState = "نتیجه تأییدشده" | "در حال پیگیری" | "تحقق جزئی" | "نتیجه منفی" | "خروجی واحد اجرایی";

export type CouncilPost = {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  type: "خبر" | "گزارش میدانی" | "گزارش تصویری" | "اطلاعیه";
  image?: string;
  imageCaption?: string;
  pinned?: boolean;
};

export type CouncilCase = {
  id: string;
  title: string;
  state: CaseState;
  summary: string;
  councilRole: string;
  executionOwner: string;
  lastUpdate: string;
};

export type CouncilInfo = {
  id: string;
  unitId: string;
  name: string;
  shortName: string;
  kind: CouncilKind;
  facultyId?: string;
  dormId?: string;
  description: string;
  office: string;
  phone: string;
  email: string;
  accent: string;
  focusAreas: string[];
  archive: { period: string; messageBlocks: number; directPosts: number; forwards: number };
  channels: Array<{ name: string; handle: string }>;
  posts: CouncilPost[];
  notices: Array<{ title: string; date: string; priority: "normal" | "important" }>;
  cases: CouncilCase[];
  letters: Array<{ title: string; status: string; updatedAt: string; destination: string; nextStep: string }>;
  reports: Array<{ title: string; period: string; summary: string }>;
};

const images = {
  meeting: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
  campus: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
  building: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80",
};
const imageCaption = "تصویر نمایه؛ گزارش Word تصویر آرشیوی ضمیمه نداشت";

type Seed = Omit<CouncilInfo, "email" | "channels"> & { channel: string };
function council(input: Seed): CouncilInfo {
  return {
    ...input,
    email: `${input.id}@senfi.demo`,
    channels: ["تلگرام", "بله", "روبیکا", "ایتا"].map((name) => ({ name, handle: input.channel })),
  };
}

export const COUNCILS: CouncilInfo[] = [
  council({
    id: "central", unitId: "central-council", name: "شورای صنفی مرکزی", shortName: "شورای مرکزی", kind: "central",
    description: "هماهنگی شوراها، تبدیل مسائل پراکنده به پرونده قابل پیگیری و مطالبه‌گری در سطح دانشگاه و شبکه ملی",
    office: "ساختمان امور دانشجویی، طبقه دوم", phone: "داخلی ۲۱۰", channel: "@senfi_central", accent: "from-blue-800 to-indigo-500",
    focusAreas: ["تغذیه و سلف", "خوابگاه و رفاه", "آموزش", "کار دانشجویی", "انتخابات", "اینترنت", "مطالبات ملی"],
    archive: { period: "۲۳ آذر ۱۴۰۳ تا ۱۳ شهریور ۱۴۰۵", messageBlocks: 230, directPosts: 181, forwards: 10 },
    posts: [
      { id: "c-facing", title: "رو‌در‌رو؛ شروع مسیر پاسخ‌گویی عمومی", excerpt: "نخستین نشست با معاونت دانشجویی در ۱۳ مهر ۱۴۰۵ برگزار شد. پرسش‌ها و پاسخ‌ها باید به پرونده‌های دارای مسئول و موعد بعدی تبدیل شوند.", date: "۱۳ مهر ۱۴۰۵", type: "گزارش میدانی", image: images.meeting, imageCaption, pinned: true },
      { id: "c-national", title: "پیگیری ملی تعرفه غذای دانشجویان نوبت دوم", excerpt: "نامه ۲۶ شهریور با امضای ۵۶ شورا و حمایت منطقه‌ای ۳۰ شهریور ثبت شد؛ پرونده هنوز در انتظار تصمیم مرجع ملی است.", date: "۳۰ شهریور ۱۴۰۵", type: "خبر", image: images.campus, imageCaption },
      { id: "c-data", title: "واقعیت‌سنجی تغذیه با داده دانشجویان", excerpt: "۶۵۲۱ پاسخ دانشجویی و دیدگاه ۳۷ دبیر شورای صنفی برای سنجش نگرانی‌ها و کیفیت اجرای سیاست تغذیه تجمیع شد.", date: "تابستان ۱۴۰۵", type: "خبر" },
      { id: "c-registry", title: "هر مسئله با کد، مسئول و مدرک ثبت شود", excerpt: "پیشنهاد گزارش برای دوره بعد: منبع، فوریت، مسئول پیگیری، واحد مجری، آخرین اقدام و شاهد نتیجه در یک پرونده ثابت ثبت شود.", date: "۱۷ مهر ۱۴۰۵", type: "اطلاعیه" },
    ],
    notices: [
      { title: "ثبت مسئله برای نشست بعدی «رو‌در‌رو»", date: "درگاه ارتباط با شورا", priority: "important" },
      { title: "پرونده تعرفه غذای نوبت دوم در انتظار تصمیم ملی است", date: "آخرین وضعیت: ۳۰ شهریور", priority: "normal" },
      { title: "گزارش‌ها با تفکیک نقش شورا و واحد اجرایی منتشر می‌شوند", date: "رویه ثابت", priority: "normal" },
    ],
    cases: [
      { id: "c-gen", title: "ژنراتور خوابگاه ریحانه", state: "نتیجه تأییدشده", summary: "خطر قطعی برق، آسانسور و سرمایش تا نصب ژنراتور و اتاقک عایق صدا پیگیری و مستقل تأیید شد.", councilRole: "تجمیع مطالبه و ارجاع تا سطح مدیریت", executionOwner: "مدیریت و تأسیسات دانشگاه", lastUpdate: "۱۴۰۴" },
      { id: "c-exam", title: "درخواست تغییر زمان امتحانات", state: "نتیجه منفی", summary: "مطالبه در جلسه ریاست و شورای آموزشی بررسی شد، اما تعویق کامل پذیرفته نشد؛ پاسخ منفی نیز شفاف ثبت شده است.", councilRole: "طرح رسمی مطالبه و بازگرداندن پاسخ", executionOwner: "شورای آموزشی دانشگاه", lastUpdate: "۱۴۰۴" },
      { id: "c-food", title: "واکنش فوری به ریسک سلامت افطار", state: "نتیجه تأییدشده", summary: "پس از گزارش خرابی فرنی‌ها، اقلام مرجوع، نمونه‌برداری رسمی و تأمین‌کننده برای پاسخ‌گویی فراخوانده شد.", councilRole: "حضور میدانی و فعال‌کردن زنجیره پاسخ", executionOwner: "معاونت دانشجویی، مرکز بهداشت و تأمین‌کننده", lastUpdate: "۱۹ اسفند ۱۴۰۳" },
      { id: "c-new", title: "پشتیبانی ثبت‌نام ورودی‌های جدید", state: "خروجی واحد اجرایی", summary: "اسکان ۴۲۰ دانشجو و صدور بیش از ۱۰۰۰ کارت خروجی دانشگاه است؛ شورا در تخصیص اتاق و پاسخ اولیه همکاری کرد.", councilRole: "همکاری اجرایی و ارجاع مسئله", executionOwner: "معاونت دانشجویی و واحد صدور کارت", lastUpdate: "مهر ۱۴۰۴" },
    ],
    letters: [
      { title: "بازنگری تعرفه غذای دانشجویان نوبت دوم", status: "در انتظار تصمیم ملی", updatedAt: "۳۰ شهریور ۱۴۰۵", destination: "صندوق رفاه دانشجویان", nextStep: "ثبت پاسخ رسمی و اثر آن بر تعرفه" },
      { title: "راه‌اندازی سلف مکمل", status: "در حال آماده‌سازی", updatedAt: "مهر ۱۴۰۵", destination: "مدیریت تغذیه", nextStep: "ثبت تاریخ بهره‌برداری واقعی؛ وعده به‌معنای اجرا نیست" },
    ],
    reports: [
      { title: "نمای مدیریتی عملکرد دوره", period: "۱۴۰۳ تا ۱۴۰۵", summary: "۹۸۹ بلوک پیام از ۹ آرشیو رسمی و بیش از ۱۸۰ سند بررسی شده‌اند؛ معیار گزارش، زنجیره مسئله تا نتیجه است، نه تعداد پست." },
      { title: "نتایج مستقیم و قابل لمس", period: "۱۴۰۴ و ۱۴۰۵", summary: "بازگشت تحویل مرسولات، تمدید مهلت کارآموزی از ۶ تا ۱۰ تیر، رزرو جیره خشک در سه سرا و استقرار دستگاه قهوه کتابخانه ثبت شده‌اند." },
      { title: "وضعیت راهبردی", period: "جمع‌بندی دوره", summary: "شفافیت و نظارت تغذیه توسعه‌یافته‌تر است؛ ایمنی، محیط‌زیست، حمل‌ونقل و تثبیت کارگروه‌ها هنوز شاخص و زمان‌بندی روشن می‌خواهند." },
    ],
  }),
  council({
    id: "mechanical", unitId: "faculty-mechanical", name: "شورای صنفی دانشکده مکانیک", shortName: "شورای مکانیک", kind: "faculty", facultyId: "mechanical",
    description: "پیگیری مسائل آموزشی و ثبت‌نام، زیرساخت دانشکده، کمدها و همراهی ورودی‌های جدید",
    office: "دانشکده مکانیک، اتاق شورای صنفی", phone: "داخلی ۳۲۱", channel: "@senfi_mech", accent: "from-slate-800 to-blue-500",
    focusAreas: ["ثبت‌نام و ظرفیت", "آزمایشگاه و کارگاه", "ترم آخر", "کارآموزی", "کمدها", "زیرساخت"],
    archive: { period: "۲۴ آذر ۱۴۰۳ تا ۴ شهریور ۱۴۰۵", messageBlocks: 184, directPosts: 94, forwards: 47 },
    posts: [
      { id: "m-academic", title: "هسته اصلی پیگیری: آموزش و انتخاب واحد", excerpt: "ظرفیت، تداخل، گروه جدید، آزمایشگاه، کارگاه و مسائل ترم آخر موردی جمع‌آوری و به آموزش منتقل شده‌اند.", date: "۱۴۰۳ تا ۱۴۰۵", type: "گزارش میدانی", image: images.building, imageCaption, pinned: true },
      { id: "m-locker", title: "مدیریت مستقیم کمدهای مکانیک", excerpt: "ربات Mechlocker برای ارتباط و مدیریت کمدها استفاده شده و حدود ۱۰۰ قفل کمد تعمیر شده است.", date: "۱۴۰۴", type: "خبر", image: images.campus, imageCaption },
      { id: "m-new", title: "همراهی ثبت‌نام ورودی‌های ۱۴۰۴", excerpt: "اعضای شورا در روزهای ثبت‌نام برای پاسخ اولیه و ارجاع مسائل آموزشی حضور داشتند.", date: "مهر ۱۴۰۴", type: "خبر" },
    ],
    notices: [
      { title: "تصمیم زمان‌بندی امتحان در اختیار آموزش است؛ شورا مطالبه و پاسخ را منتشر می‌کند", date: "شفاف‌سازی مسئولیت", priority: "important" },
      { title: "خرابی کلاس، آزمایشگاه یا کمد را با شماره فضا ثبت کنید", date: "فرم ارتباط با شورا", priority: "normal" },
    ],
    cases: [
      { id: "m-symbol", title: "نشان محیطی دانشکده مکانیک", state: "نتیجه تأییدشده", summary: "ایده با مشارکت دانشجویان و همکاری مجموعه هنری به نصب رسید.", councilRole: "ایده‌پردازی، مشارکت و هماهنگی", executionOwner: "دانشکده و مجموعه هنری", lastUpdate: "۱۴۰۴" },
      { id: "m-electric", title: "تابلو برق و سرمایش طبقه اول", state: "نتیجه تأییدشده", summary: "سیم‌کشی تابلو برق تکمیل و کولرهای طبقه اول قابل استفاده شد.", councilRole: "گزارش نقص و پیگیری", executionOwner: "تأسیسات دانشگاه", lastUpdate: "۱۴۰۴" },
      { id: "m-open", title: "سرویس بانوان و تجهیزات کلاس", state: "در حال پیگیری", summary: "فاضلاب، کمبود صندلی و برخی نواقص روشنایی و ویدئوپروژکتور در پایان بازه باز مانده‌اند.", councilRole: "ثبت و تکرار مطالبه", executionOwner: "مدیریت دانشکده و تأسیسات", lastUpdate: "شهریور ۱۴۰۵" },
    ],
    letters: [
      { title: "رفع نواقص سرویس بانوان و تجهیزات کلاس", status: "باز", updatedAt: "۴ شهریور ۱۴۰۵", destination: "مدیریت دانشکده", nextStep: "بازدید مجدد و ثبت تصویر نتیجه" },
      { title: "ظرفیت و ارائه درس‌های موردنیاز", status: "پیگیری نیم‌سالانه", updatedAt: "هر نیم‌سال", destination: "آموزش دانشکده", nextStep: "انتشار تصمیم نهایی هر درس" },
    ],
    reports: [
      { title: "گزارش خدمات زیرساختی", period: "۱۴۰۴", summary: "تعمیر حدود ۱۰۰ قفل کمد، اصلاح روشنایی سالن امتحان، نظافت راهرو و تعمیر بخشی از درها، شیشه‌ها و سرویس‌ها ثبت شده است." },
      { title: "میراث دوره‌های قبل", period: "آرشیو تاریخی", summary: "گزارش دوره‌های قدیمی با برچسب «دوره قبل» نگهداری می‌شود تا با عملکرد اعضای فعلی مخلوط نشود." },
    ],
  }),
  council({
    id: "electrical", unitId: "faculty-electrical", name: "شورای صنفی برق و کامپیوتر", shortName: "شورای برق و کامپیوتر", kind: "faculty", facultyId: "electrical",
    description: "پیگیری تجهیزات کلاس، سرمایش، ایمنی، کمدها، ساختمان جدید و رسانه مشترک دانشجویی",
    office: "دانشکده برق، طبقه همکف", phone: "داخلی ۳۴۲", channel: "@senfi_ce", accent: "from-amber-700 to-orange-400",
    focusAreas: ["تجهیزات کلاس", "سرمایش", "ایمنی", "کمدها", "ساختمان جدید", "رسانه مشترک"],
    archive: { period: "۲۱ اسفند ۱۴۰۳ تا ۲۳ مرداد ۱۴۰۵", messageBlocks: 92, directPosts: 34, forwards: 44 },
    posts: [
      { id: "e-inventory", title: "فهرست‌برداری تجهیزات کلاس‌ها", excerpt: "تجهیزات، پرده، سرمایش و خرابی‌های فوری کلاس‌ها ثبت شد تا درخواست‌های کلی به فهرست قابل اقدام تبدیل شوند.", date: "۱۴۰۴", type: "گزارش میدانی", image: images.building, imageCaption, pinned: true },
      { id: "e-media", title: "VoltBit؛ رسانه مشترک با انجمن‌های علمی", excerpt: "تولید رسانه با همکاری انجمن‌های علمی و استودیو، نمونه هم‌افزایی صنفی و علمی دانشکده است.", date: "۱۴۰۴", type: "خبر", image: images.meeting, imageCaption },
      { id: "e-office", title: "حضور هفتگی و درگاه QR ارتباط", excerpt: "هویت بصری، کد QR کانال و زمان حضور هفتگی برای کوتاه‌کردن مسیر ارتباط ایجاد شد.", date: "۱۴۰۴", type: "اطلاعیه" },
    ],
    notices: [
      { title: "سرمایش همه کلاس‌ها تکمیل نشده و پرونده باز است", date: "آخرین وضعیت گزارش", priority: "important" },
      { title: "خرابی فوری و خطر ایمنی را با شماره کلاس ارسال کنید", date: "پاسخ فوری", priority: "normal" },
    ],
    cases: [
      { id: "e-cool", title: "سرمایش و تجهیزات کلاس", state: "تحقق جزئی", summary: "بخشی از تجهیزات تعمیر یا جایگزین شد، اما سرمایش همه کلاس‌ها محقق نشد.", councilRole: "فهرست‌برداری و نامه رسمی", executionOwner: "مدیریت دانشکده و تأسیسات", lastUpdate: "مرداد ۱۴۰۵" },
      { id: "e-water", title: "آبسردکن و دسترسی به لیوان", state: "نتیجه تأییدشده", summary: "آبسردکن تعمیر و نگهدارنده لیوان و لیوان مصرفی فراهم شد.", councilRole: "گزارش و پیگیری مستقیم", executionOwner: "خدمات دانشکده", lastUpdate: "۱۴۰۴" },
      { id: "e-new-building", title: "ساختمان جدید دانشکده", state: "در حال پیگیری", summary: "موضوع در آرشیو باز مانده و مدرک کافی برای اعلام تکمیل وجود ندارد.", councilRole: "مطالبه و اطلاع‌رسانی وضعیت", executionOwner: "مدیریت دانشگاه", lastUpdate: "مرداد ۱۴۰۵" },
      { id: "e-failed", title: "فضای سبز و دوربین‌ها", state: "نتیجه منفی", summary: "در بازه گزارش نتیجه قابل اتکایی برای این دو مطالبه ثبت نشده است.", councilRole: "ثبت مطالبه", executionOwner: "پشتیبانی و حراست", lastUpdate: "مرداد ۱۴۰۵" },
    ],
    letters: [
      { title: "تکمیل سرمایش کلاس‌های باقیمانده", status: "تحقق جزئی", updatedAt: "۲۳ مرداد ۱۴۰۵", destination: "مدیریت دانشکده", nextStep: "انتشار فهرست کلاس‌های رفع‌شده و باز" },
      { title: "تعیین تکلیف ساختمان جدید", status: "پاسخ نهایی نامشخص", updatedAt: "۲۳ مرداد ۱۴۰۵", destination: "مدیریت دانشگاه", nextStep: "دریافت زمان‌بندی رسمی یا ثبت عدم امکان" },
    ],
    reports: [
      { title: "کارنامه مطالبات", period: "۱۴۰۳ تا ۱۴۰۵", summary: "آبسردکن و بخشی از تجهیزات نتیجه داشته؛ سرمایش و میز و صندلی جزئی و فضای سبز و دوربین‌ها بدون نتیجه کامل مانده‌اند." },
      { title: "رسانه و ورزش", period: "۱۴۰۴", summary: "رسانه VoltBit و پشتیبانی تیم مینی‌فوتبال در کنار پیگیری‌های خدماتی ثبت شده‌اند." },
    ],
  }),
  council({
    id: "chemistry", unitId: "faculty-chemistry", name: "شورای صنفی شیمی و پلیمر", shortName: "شورای شیمی و پلیمر", kind: "faculty", facultyId: "chemistry",
    description: "دریافت مسائل آموزشی و آزمایشگاهی، ارتباط نمایندگان ورودی‌ها و ارجاع مطالبات پلیمر",
    office: "دانشکده شیمی، اتاق ۱۰۵", phone: "داخلی ۳۶۰", channel: "@senfi_chem", accent: "from-emerald-800 to-teal-400",
    focusAreas: ["انتخاب واحد", "پلیمر", "رضایت‌سنجی", "آزمایشگاه", "تجهیزات", "نمایندگان ورودی"],
    archive: { period: "۲۸ آذر ۱۴۰۳ تا ۱۴ آبان ۱۴۰۴", messageBlocks: 39, directPosts: 15, forwards: 23 },
    posts: [
      { id: "ch-liaisons", title: "نماینده هر ورودی؛ مسیر کوتاه‌تر مسائل آموزشی", excerpt: "نمایندگان ورودی‌ها مسائل انتخاب واحد و کیفیت آموزشی را جمع‌آوری و به دانشکده منتقل کردند.", date: "۱۴۰۴", type: "خبر", image: images.meeting, imageCaption, pinned: true },
      { id: "ch-survey", title: "رضایت‌سنجی پیش از جلسه با دانشکده", excerpt: "فرم‌ها تجربه پراکنده دانشجویان را به داده قابل ارائه در نشست‌ها تبدیل کردند.", date: "۱۴۰۴", type: "گزارش میدانی", image: images.campus, imageCaption },
      { id: "ch-channel", title: "عملکرد فقط با تعداد پست سنجیده نمی‌شود", excerpt: "بخشی از ارتباط در واتساپ، فرم و جلسه انجام شده و بازنشر کانال عملکرد مستقل شمرده نمی‌شود.", date: "جمع‌بندی گزارش", type: "اطلاعیه" },
    ],
    notices: [
      { title: "مسائل پلیمر پس از جمع‌بندی محلی به شورای مرکزی ارجاع می‌شوند", date: "روال پیگیری", priority: "important" },
      { title: "برای هر مسئله، درس، ورودی و مدرک مرتبط را ثبت کنید", date: "فرم آموزشی", priority: "normal" },
    ],
    cases: [
      { id: "ch-polymer", title: "مسائل آموزشی دانشجویان پلیمر", state: "در حال پیگیری", summary: "موضوعات ابتدا در واحد جمع‌آوری و سپس برای پیگیری گسترده‌تر به شورای مرکزی ارجاع شده‌اند.", councilRole: "تجمیع محلی و ارجاع", executionOwner: "آموزش دانشکده و شورای مرکزی", lastUpdate: "آبان ۱۴۰۴" },
      { id: "ch-registration", title: "مشکلات انتخاب واحد", state: "تحقق جزئی", summary: "نمایندگان ورودی مسیر پاسخ‌گویی را فعال کرده‌اند؛ نتیجه هر درس باید جدا ثبت شود.", councilRole: "دریافت مورد و پیگیری گروهی", executionOwner: "آموزش دانشکده", lastUpdate: "۱۴۰۴" },
      { id: "ch-equipment", title: "تجهیزات آموزشی و آزمایشگاهی", state: "در حال پیگیری", summary: "موضوع در فرم‌ها و جلسات مطرح شده، اما گزارش برای اعلام رفع کامل کافی نیست.", councilRole: "نیازسنجی و طرح مطالبه", executionOwner: "دانشکده و آزمایشگاه", lastUpdate: "آبان ۱۴۰۴" },
    ],
    letters: [
      { title: "جمع‌بندی مسائل آموزشی پلیمر", status: "ارجاع‌شده", updatedAt: "۱۴ آبان ۱۴۰۴", destination: "شورای مرکزی و آموزش", nextStep: "ثبت پاسخ برای هر موضوع" },
      { title: "نیازهای تجهیزات آموزشی", status: "در حال مستندسازی", updatedAt: "آبان ۱۴۰۴", destination: "مدیریت دانشکده", nextStep: "تکمیل فهرست و اولویت" },
    ],
    reports: [
      { title: "گزارش ارتباطات آموزشی", period: "۱۴۰۳ تا ۱۴۰۴", summary: "فرم رضایت‌سنجی، نمایندگان ورودی و نشست با دانشکده ابزارهای اصلی پیگیری بوده‌اند." },
      { title: "شفافیت رسانه", period: "جمع‌بندی آرشیو", summary: "۲۳ بازنشر از ۳۹ بلوک کانال عملکرد مستقل محسوب نشده و فعالیت خارج از کانال هم باید با سند ارزیابی شود." },
    ],
  }),
  council({
    id: "industrial", unitId: "faculty-industrial", name: "شورای صنفی صنایع و مواد", shortName: "شورای صنایع و مواد", kind: "faculty", facultyId: "industrial",
    description: "پیگیری ارائه درس، تداخل‌ها، ارزیابی استاد، تجهیزات آموزشی، سرویس‌ها و کمدها",
    office: "دانشکده صنایع، دفتر شورا", phone: "داخلی ۳۷۵", channel: "@senfi_ie", accent: "from-rose-800 to-orange-400",
    focusAreas: ["ارائه درس", "تداخل برنامه", "ارزیابی استاد", "تجهیزات", "سرویس‌ها", "کمدها"],
    archive: { period: "۲۳ آذر ۱۴۰۳ تا ۲۹ خرداد ۱۴۰۵", messageBlocks: 40, directPosts: 36, forwards: 4 },
    posts: [
      { id: "i-forms", title: "از فرم مسئله تا آمار قابل ارائه", excerpt: "درخواست‌های آموزشی و خدماتی با فرم و آمار جمع شده‌اند تا انجام‌شده، جزئی، جاری و بی‌شاهد از هم جدا باشد.", date: "۱۴۰۴ و ۱۴۰۵", type: "گزارش میدانی", image: images.meeting, imageCaption, pinned: true },
      { id: "i-courses", title: "ظرفیت دانشکده‌های دیگر برای درس‌های خاص", excerpt: "هماهنگی بین‌دانشکده‌ای به‌عنوان راه‌حل برخی درس‌های کم‌ظرفیت یا تخصصی دنبال شده است.", date: "۱۴۰۴", type: "خبر", image: images.building, imageCaption },
    ],
    notices: [
      { title: "وضعیت هر درخواست با برچسب نتیجه منتشر می‌شود", date: "انجام‌شده، جزئی، جاری، بی‌شاهد", priority: "important" },
      { title: "مشکل درس یا تداخل را همراه کد درس ثبت کنید", date: "پیش از حذف و اضافه", priority: "normal" },
    ],
    cases: [
      { id: "i-course", title: "ارائه درس و تداخل برنامه", state: "تحقق جزئی", summary: "بخشی از نیازها با هماهنگی داخلی و ظرفیت دانشکده‌های دیگر پاسخ گرفته است.", councilRole: "آمارگیری و هماهنگی بین‌دانشکده‌ای", executionOwner: "آموزش دانشکده‌ها", lastUpdate: "خرداد ۱۴۰۵" },
      { id: "i-facilities", title: "تخته، تجهیزات و سرویس‌ها", state: "در حال پیگیری", summary: "نواقص ثبت و در جلسات مطرح شده‌اند؛ نتیجه هر مورد باید با شاهد تکمیل شود.", councilRole: "فهرست‌برداری و پیگیری", executionOwner: "مدیریت دانشکده", lastUpdate: "خرداد ۱۴۰۵" },
      { id: "i-locker", title: "کمدهای دانشجویی", state: "در حال پیگیری", summary: "نیاز و سازوکار مدیریت مطرح شده، اما شاهد تکمیل سراسری وجود ندارد.", councilRole: "دریافت تقاضا و طراحی سازوکار", executionOwner: "دانشکده", lastUpdate: "خرداد ۱۴۰۵" },
    ],
    letters: [
      { title: "رفع تداخل و ارائه دروس موردنیاز", status: "پیگیری نیم‌سالانه", updatedAt: "خرداد ۱۴۰۵", destination: "آموزش دانشکده", nextStep: "ثبت نتیجه هر کد درس" },
      { title: "تکمیل تجهیزات و کمدها", status: "باز", updatedAt: "۲۹ خرداد ۱۴۰۵", destination: "مدیریت دانشکده", nextStep: "بازدید و ثبت شاهد انجام" },
    ],
    reports: [
      { title: "گزارش مسائل آموزشی", period: "۱۴۰۳ تا ۱۴۰۵", summary: "ارائه درس، تداخل برنامه و ارزیابی استاد با تکیه بر فرم و آمار دانشجویان دنبال شده‌اند." },
      { title: "گزارش خدمات دانشکده", period: "۱۴۰۴ و ۱۴۰۵", summary: "تخته، سرویس، تجهیزات و کمد در پرونده‌های جدا نگهداری می‌شوند تا ادعای کلی جای نتیجه موردی را نگیرد." },
    ],
  }),
  council({
    id: "civil", unitId: "faculty-civil", name: "شورای صنفی دانشکده عمران", shortName: "شورای عمران", kind: "faculty", facultyId: "civil",
    description: "دفتر هفتگی و ارتباط ناشناس برای پیگیری زیرساخت، آموزش، کمد، ورزش و برنامه‌های مشترک",
    office: "دانشکده عمران، طبقه اول", phone: "داخلی ۳۸۴", channel: "@senfi_civil", accent: "from-stone-800 to-amber-500",
    focusAreas: ["زیرساخت کلاس", "بازسازی", "کمدها", "آموزش", "ورزش", "مجمع عمومی"],
    archive: { period: "۲۳ آذر ۱۴۰۳ تا ۶ اسفند ۱۴۰۴", messageBlocks: 136, directPosts: 57, forwards: 51 },
    posts: [
      { id: "cv-office", title: "دفتر هفتگی، لینک ناشناس و مجمع عمومی", excerpt: "سه مسیر مکمل برای دریافت مسئله و پاسخ‌گویی ایجاد شده تا دانشجو متناسب با موضوع ارتباط بگیرد.", date: "۱۴۰۳ و ۱۴۰۴", type: "خبر", image: images.meeting, imageCaption, pinned: true },
      { id: "cv-class", title: "بهبودهای تأییدشده فضای آموزشی", excerpt: "تخته اتاق ۲۰۴، ۱۲ صندلی آزمایشگاه روسازی، تابلو برق جدید و کولرهای سالن نقشه‌کشی ثبت شده‌اند.", date: "۱۴۰۴", type: "گزارش میدانی", image: images.building, imageCaption },
      { id: "cv-joint", title: "برنامه مشترک چوتاش و سازه پارامتریک", excerpt: "همکاری با معماری برای برنامه علمی و دانشجویی مشترک، بخشی از فعالیت بین‌رشته‌ای شورا بود.", date: "۱۴۰۴", type: "خبر" },
    ],
    notices: [
      { title: "برای پرداخت کمد، رسید و مبنای مبلغ باید روشن باشد", date: "شفافیت مالی", priority: "important" },
      { title: "زمان ملاقات هفتگی و لینک ناشناس در دسترس است", date: "ارتباط با شورا", priority: "normal" },
    ],
    cases: [
      { id: "cv-renovation", title: "بازسازی و تبدیل آزمایشگاه به کلاس", state: "نتیجه تأییدشده", summary: "شروع بازسازی در مرداد ۱۴۰۴ و تبدیل آزمایشگاه شیمی به کلاس ثبت شده است.", councilRole: "انتقال نیاز و پیگیری میدانی", executionOwner: "مدیریت دانشکده", lastUpdate: "مرداد ۱۴۰۴" },
      { id: "cv-classroom", title: "تجهیزات کلاس و آزمایشگاه", state: "نتیجه تأییدشده", summary: "تخته اتاق ۲۰۴، صندلی آزمایشگاه، تابلو برق و سرمایش سالن نقشه‌کشی نتیجه قابل مشاهده دارند.", councilRole: "فهرست نقص و پیگیری", executionOwner: "دانشکده و تأسیسات", lastUpdate: "۱۴۰۴" },
      { id: "cv-locker", title: "مدیریت مستقیم کمدها", state: "تحقق جزئی", summary: "واگذاری انجام شده، اما تفاوت مبالغ، اختیار حقوقی و شفافیت رسیدها نیازمند تکمیل است.", councilRole: "مدیریت واگذاری و پاسخ‌گویی", executionOwner: "شورا با نظارت دانشکده", lastUpdate: "اسفند ۱۴۰۴" },
    ],
    letters: [
      { title: "شفاف‌سازی مالی و حقوقی کمد", status: "نیازمند تکمیل", updatedAt: "۶ اسفند ۱۴۰۴", destination: "مدیریت دانشکده", nextStep: "انتشار تعرفه، رسید و مبنای اختیار" },
      { title: "تکمیل نواقص فضاهای آموزشی", status: "بخشی انجام شد", updatedAt: "اسفند ۱۴۰۴", destination: "پشتیبانی دانشکده", nextStep: "به‌روزرسانی فهرست باز و بسته" },
    ],
    reports: [
      { title: "گزارش زیرساخت", period: "۱۴۰۳ و ۱۴۰۴", summary: "تخته، صندلی، میز، پرده، دستگیره، تابلو برق، سرمایش و تبدیل فضاها در سطح اتاق ثبت شده‌اند." },
      { title: "گزارش ارتباط و مشارکت", period: "دوره شورا", summary: "لینک ناشناس، دفتر هفتگی، مجمع عمومی و جلسه با مدیریت چهار مسیر اصلی تعامل بوده‌اند." },
    ],
  }),
  council({
    id: "basic", unitId: "faculty-basic", name: "شورای صنفی علوم پایه", shortName: "شورای علوم پایه", kind: "faculty", facultyId: "basic",
    description: "پیگیری ظرفیت و ارائه درس، تداخل‌ها، تجهیزات کلاس، آسانسور و همکاری با انجمن‌های علمی",
    office: "ساختمان علوم پایه، اتاق شورا", phone: "داخلی ۳۹۱", channel: "@senfi_basic", accent: "from-violet-800 to-fuchsia-500",
    focusAreas: ["ظرفیت درس", "ارائه درس", "تداخل", "تجهیزات کلاس", "آسانسور", "انتخاب واحد"],
    archive: { period: "۲۴ آذر ۱۴۰۳ تا ۱۶ خرداد ۱۴۰۵", messageBlocks: 97, directPosts: 46, forwards: 44 },
    posts: [
      { id: "b-summer", title: "ارائه درس برنامه‌نویسی تابستان", excerpt: "پس از پیگیری، کلاس برنامه‌نویسی در ۵ تیر ۱۴۰۴ ارائه شد؛ نمونه‌ای با زنجیره روشن مطالبه تا نتیجه.", date: "۵ تیر ۱۴۰۴", type: "خبر", image: images.campus, imageCaption, pinned: true },
      { id: "b-equipment", title: "فهرست نیازهای کلاس و ساختمان", excerpt: "تخته، ویدئوپروژکتور، پرده، ساعت، صندلی، کولر و آسانسور در گزارش خدماتی ثبت شدند.", date: "۱۴۰۴", type: "گزارش میدانی", image: images.building, imageCaption },
    ],
    notices: [
      { title: "درخواست کمد هنوز نتیجه نهایی ثبت‌شده ندارد", date: "پرونده باز", priority: "important" },
      { title: "مسائل امتحان و درس با پاسخ آموزش منتشر می‌شوند", date: "فرم آموزشی", priority: "normal" },
    ],
    cases: [
      { id: "b-programming", title: "کلاس برنامه‌نویسی تابستان", state: "نتیجه تأییدشده", summary: "کلاس پس از پیگیری در ۵ تیر ۱۴۰۴ ارائه شد.", councilRole: "دریافت تقاضا و پیگیری ارائه", executionOwner: "آموزش دانشکده", lastUpdate: "۵ تیر ۱۴۰۴" },
      { id: "b-exams", title: "مسائل امتحان و ارائه درس", state: "تحقق جزئی", summary: "موضوعات جمع‌آوری و پاسخ آموزش بازگردانده شده؛ تصمیم نهایی دانشگاهی است.", councilRole: "جمع‌آوری و بازگرداندن پاسخ", executionOwner: "آموزش دانشکده", lastUpdate: "خرداد ۱۴۰۵" },
      { id: "b-locker", title: "کمدهای دانشجویی", state: "در حال پیگیری", summary: "در آرشیو نتیجه اجرایی قطعی برای کمدها ثبت نشده است.", councilRole: "طرح مطالبه", executionOwner: "مدیریت دانشکده", lastUpdate: "خرداد ۱۴۰۵" },
    ],
    letters: [
      { title: "تعیین تکلیف کمدهای دانشجویی", status: "بدون نتیجه نهایی", updatedAt: "۱۶ خرداد ۱۴۰۵", destination: "مدیریت دانشکده", nextStep: "دریافت پاسخ رسمی و برنامه اجرا" },
      { title: "رفع نواقص تجهیزات کلاس", status: "پیگیری موردی", updatedAt: "خرداد ۱۴۰۵", destination: "پشتیبانی دانشکده", nextStep: "ثبت نتیجه به تفکیک کلاس" },
    ],
    reports: [
      { title: "آموزش و انتخاب واحد", period: "۱۴۰۳ تا ۱۴۰۵", summary: "ظرفیت، ارائه درس، تداخل، استاد مدعو و پاسخ مسائل امتحانی محور ارتباط با آموزش بوده‌اند." },
      { title: "گزارش امکانات", period: "دوره شورا", summary: "نیاز تخته، ویدئوپروژکتور، پرده، ساعت، صندلی، کولر و آسانسور موردی نگهداری می‌شود." },
    ],
  }),
  council({
    id: "aminian", unitId: "dorm-aminian", name: "شورای صنفی خوابگاه امینیان", shortName: "شورای امینیان", kind: "dorm", dormId: "aminian",
    description: "پیگیری میدانی آب، گرمایش و سرمایش، اینترنت، بهداشت، ایمنی، تجهیزات و فضای ورزشی خوابگاه",
    office: "لابی خوابگاه امینیان", phone: "داخلی ۴۱۲", channel: "@senfi_aminian", accent: "from-cyan-800 to-blue-500",
    focusAreas: ["آب و آب گرم", "گرمایش و سرمایش", "اینترنت", "بهداشت", "ایمنی حریق", "تجهیزات", "ورزش"],
    archive: { period: "۲۱ آذر ۱۴۰۳ تا ۲۹ خرداد ۱۴۰۵", messageBlocks: 119, directPosts: 68, forwards: 17 },
    posts: [
      { id: "a-visits", title: "بازدید مشترک و فهرست ۱۴ موردی", excerpt: "بازدیدهای ۱ و ۱۳ اردیبهشت ۱۴۰۴ مسائل را به فهرست قابل پیگیری تبدیل کرد؛ انبار نیز تا مهر ۱۴۰۵ فضای پینگ‌پنگ و فوتبال‌دستی شد.", date: "اردیبهشت ۱۴۰۴ تا مهر ۱۴۰۵", type: "گزارش میدانی", image: images.building, imageCaption, pinned: true },
      { id: "a-water", title: "تأمین اضطراری آب در زمان قطعی", excerpt: "تانکر ۷۰۰۰ لیتری برای استمرار دسترسی ساکنان در وضعیت قطعی آب فراهم شد.", date: "۱۴۰۴", type: "خبر", image: images.campus, imageCaption },
      { id: "a-health", title: "پایش اتاق‌به‌اتاق در دوره آنفلوانزا", excerpt: "آمار اتاق‌ها جمع‌آوری و با بازرسان بهداشت برای رسیدگی هدفمند هماهنگ شد.", date: "۱۴۰۳", type: "خبر" },
    ],
    notices: [
      { title: "پرونده سامانه اطفای حریق تا مشاهده اصلاح کامل باز می‌ماند", date: "مطالبه ایمنی", priority: "important" },
      { title: "قطعی آب یا خرابی تجهیزات را با بلوک و طبقه ثبت کنید", date: "گزارش خدمات", priority: "normal" },
    ],
    cases: [
      { id: "a-hotwater", title: "آب گرم بلوک ۲", state: "نتیجه تأییدشده", summary: "پس از پیشنهاد فنی، خرید قطعه و تغییرات تأسیساتی، مشکل مشخص آب گرم رفع و در گزارش مرکزی تأیید شد.", councilRole: "گزارش فنی و پیگیری", executionOwner: "تأسیسات دانشگاه", lastUpdate: "۱۴۰۴" },
      { id: "a-fire", title: "ایمنی حریق بلوک ۲", state: "در حال پیگیری", summary: "پس از آتش‌سوزی، کپسول، سامانه اعلام و جعبه آتش‌نشانی مطالبه شد؛ رفع کامل تأیید نشده است.", councilRole: "شناسایی ریسک و مطالبه اصلاح", executionOwner: "ایمنی و تأسیسات", lastUpdate: "خرداد ۱۴۰۵" },
      { id: "a-equipment", title: "تجهیزات و زیرساخت خوابگاه", state: "خروجی واحد اجرایی", summary: "مودم، یخچال، صندلی، جاروبرقی، لباسشویی، اتو، کمد و شبکه خروجی اداره خوابگاه‌اند که با پیگیری‌ها هم‌راستا بوده‌اند.", councilRole: "نیازسنجی و انتقال اولویت", executionOwner: "اداره خوابگاه‌ها", lastUpdate: "۱۴۰۴" },
      { id: "a-sport", title: "فضای ورزشی و سرعت‌گیر", state: "تحقق جزئی", summary: "گرانول چمن و تبدیل انبار اجرا شد؛ برای دستور سرعت‌گیر شاهد نصب نهایی در گزارش نیست.", councilRole: "پیگیری بازدید و مصوبه", executionOwner: "اداره خوابگاه و پشتیبانی", lastUpdate: "مهر ۱۴۰۵" },
    ],
    letters: [
      { title: "تکمیل تجهیزات ایمنی حریق بلوک ۲", status: "باز", updatedAt: "۲۹ خرداد ۱۴۰۵", destination: "ایمنی و تأسیسات", nextStep: "بازدید مشترک و ثبت تجهیز نصب‌شده" },
      { title: "نصب سرعت‌گیر محوطه", status: "دستور صادر شده", updatedAt: "۵ شهریور ۱۴۰۵", destination: "پشتیبانی دانشگاه", nextStep: "تأیید اجرای فیزیکی" },
    ],
    reports: [
      { title: "پاسخ اجرایی اداره خوابگاه", period: "۱۴۰۴", summary: "تکمیل موتورخانه دو بلوک، ۱۶ مودم، ۱۳ یخچال، ۱۰۰ صندلی، ۲ جاروبرقی، ۲ لباسشویی، ۵ اتو و ۲۵ کمد گزارش شده است." },
      { title: "گزارش بازدید مشترک", period: "اردیبهشت ۱۴۰۴", summary: "۱۴ مسئله ثبت شد تا مسئول، وضعیت و نتیجه هر مورد جداگانه قابل پیگیری باشد." },
    ],
  }),
  council({
    id: "reyhaneh", unitId: "dorm-reyhaneh", name: "شورای صنفی خوابگاه‌های ریحانه و کوثر", shortName: "شورای ریحانه و کوثر", kind: "dorm", dormId: "reyhaneh",
    description: "پیگیری سرمایش، برق اضطراری، تجهیزات، هزینه خوابگاه، تحویل غذا و نمایندگی ساکنان",
    office: "لابی خوابگاه ریحانه", phone: "داخلی ۴۲۱", channel: "@senfi_reyhaneh", accent: "from-pink-800 to-rose-400",
    focusAreas: ["ژنراتور", "سرمایش", "هزینه خوابگاه", "تجهیزات", "تحویل غذا", "آسانسور"],
    archive: { period: "۲۹ آذر ۱۴۰۳ تا ۹ دی ۱۴۰۴", messageBlocks: 52, directPosts: 22, forwards: 22 },
    posts: [
      { id: "r-generator", title: "ژنراتور ریحانه؛ از مسئله تا اجرا", excerpt: "خطر قطعی برق برای آسانسور و سرمایش به مطالبه خوابگاه، ارجاع مرکزی، تصمیم مدیریت و نصب ژنراتور با اتاقک عایق صدا رسید.", date: "۱۴۰۴", type: "گزارش میدانی", image: images.building, imageCaption, pinned: true },
      { id: "r-visit", title: "بازدید مشترک از ۳۳ مسئله خوابگاه", excerpt: "ژنراتور، تصفیه آب، فن‌کویل، سالن مطالعه، دوش، لباسشویی، آسانسور، مرسولات و رفتار سرپرستی یکجا بررسی شدند.", date: "۸ اردیبهشت ۱۴۰۴", type: "گزارش میدانی", image: images.meeting, imageCaption },
      { id: "r-food", title: "تحویل غذا در کوثر برقرار شد", excerpt: "هماهنگی سامانه و تحویل غذا نتیجه داد؛ درخواست تخفیف بوفه در همان بازه نتیجه نگرفت.", date: "۱۴۰۴", type: "خبر" },
    ],
    notices: [
      { title: "اختلاف هزینه خوابگاه هنوز سند تسویه نهایی ندارد", date: "وعده تسویه ترم بعد", priority: "important" },
      { title: "مشکل آسانسور یا برق اضطراری را فوری با طبقه ثبت کنید", date: "گزارش ایمنی", priority: "normal" },
    ],
    cases: [
      { id: "r-gen", title: "نصب ژنراتور و اتاقک عایق صدا", state: "نتیجه تأییدشده", summary: "قوی‌ترین زنجیره گزارش: مسئله، مطالبه، ارجاع، تصمیم، اجرا و تأیید مستقل نتیجه.", councilRole: "ثبت خطر و پیگیری تا مدیریت", executionOwner: "مدیریت دانشگاه و تأسیسات", lastUpdate: "۱۴۰۴" },
      { id: "r-food", title: "تحویل غذا در خوابگاه کوثر", state: "نتیجه تأییدشده", summary: "هماهنگی تحویل غذا انجام و خدمت در دسترس ساکنان قرار گرفت.", councilRole: "انتقال مسئله و هماهنگی سامانه", executionOwner: "مدیریت تغذیه", lastUpdate: "۱۴۰۴" },
      { id: "r-cost", title: "اختلاف هزینه خوابگاه", state: "در حال پیگیری", summary: "پیگیری و وعده تسویه در ترم بعد ثبت شده، اما شاهد مالی نهایی موجود نیست.", councilRole: "ثبت اختلاف و پیگیری پاسخ", executionOwner: "امور مالی و اداره خوابگاه", lastUpdate: "دی ۱۴۰۴" },
      { id: "r-equipment", title: "تجهیز و توسعه خوابگاه", state: "خروجی واحد اجرایی", summary: "۶۵ صندلی، ۲۰ کمد، یخچال، پرده، شبکه و آسانسور خروجی اداره خوابگاه‌اند؛ طبقه چهارم ۷۰٪ پیشرفت گزارش شد.", councilRole: "نیازسنجی و بازدید مشترک", executionOwner: "اداره خوابگاه‌ها", lastUpdate: "۱۴۰۴" },
    ],
    letters: [
      { title: "تسویه اختلاف هزینه خوابگاه", status: "در انتظار سند مالی", updatedAt: "۹ دی ۱۴۰۴", destination: "امور مالی و اداره خوابگاه", nextStep: "ثبت مبلغ، مشمولان و سند تسویه" },
      { title: "تکمیل طبقه چهارم خوابگاه", status: "۷۰٪ پیشرفت گزارش‌شده", updatedAt: "۱۴۰۴", destination: "اداره خوابگاه‌ها", nextStep: "بازدید نهایی و ثبت ظرفیت بهره‌برداری" },
    ],
    reports: [
      { title: "فهرست ۳۳ مسئله خوابگاه", period: "۸ اردیبهشت ۱۴۰۴", summary: "موضوعات زیرساخت، خدمات، تغذیه، مالی و نمایندگی ساکنان در یک بازدید مشترک دسته‌بندی شدند." },
      { title: "پاسخ اجرایی اداره خوابگاه", period: "۱۴۰۴", summary: "صندلی، کمد، یخچال، پرده، ورزش، شبکه، آسانسور و آب‌بندی سرویس‌ها با مالکیت اجرایی اداره خوابگاه ثبت شده‌اند." },
    ],
  }),
];

export function councilForFaculty(facultyId?: string) {
  return COUNCILS.find((item) => item.kind === "faculty" && item.facultyId === facultyId);
}

export function councilById(id?: string) {
  return COUNCILS.find((item) => item.id === id);
}
