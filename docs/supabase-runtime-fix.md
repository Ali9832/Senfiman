# گزارش رفع خطای Supabase در نسخه وب

تاریخ: ۱۵ آبان ۱۴۰۵ (۶ نوامبر ۲۰۲۶)

## شرح خطا

نسخه Buildشده فرانت‌اند پیش از نمایش رابط کاربری با خطای زیر در Console مرورگر متوقف می‌شد:

```text
Uncaught Error: supabaseUrl is required.
```

فایل JavaScript قدیمی که این خطا در آن مشاهده شد `index-Cl89wQXk.js` بود.

## علت اصلی

در `src/integrations/supabase/client.ts` مقادیر زیر مستقیماً به `createClient()` داده می‌شدند:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

در Build نمایشی GitHub Pages این متغیرها تنظیم نشده بودند. در نتیجه Supabase هنگام import ماژول و پیش از رندر React خطا ایجاد می‌کرد.

## تغییرات انجام‌شده

### ۱. مقاوم‌سازی Supabase client

- URL و Key پیش از استفاده پاک‌سازی و اعتبارسنجی می‌شوند.
- متغیر `SUPABASE_CONFIGURED` اضافه شد تا بخش‌های برنامه از آماده‌بودن اتصال مطلع شوند.
- برای Build نمایشی بدون تنظیمات Supabase، مقادیر محلی و غیرعملیاتی استفاده می‌شود تا SDK هنگام import کرش نکند.
- این مقادیر جایگزین فقط مانع خطای اولیه می‌شوند و به‌عنوان اتصال واقعی استفاده نمی‌شوند.

### ۲. جلوگیری از درخواست شبکه در نسخه Demo

در `src/components/SystemConnect.tsx`:

- اتصال خودکار به Supabase در حالت Demo متوقف شد.
- عملیات ذخیره و قطع اتصال واقعی در نسخه نمایشی غیرفعال شد.
- پیام «نسخه نمایشی» برای کاربر نمایش داده می‌شود.

در `src/pages/CouncilLockerReceipts.tsx`:

- بارگیری و تغییر رسیدهای واقعی بدون تنظیمات Supabase متوقف شد.
- صفحه بدون ایجاد درخواست ناموفق یا خطای Runtime بارگذاری می‌شود.

## آزمون‌های انجام‌شده

Build دقیقاً با شرایط زیر اجرا شد:

```text
VITE_DEMO_MODE=true
VITE_SUPABASE_URL=<empty>
VITE_SUPABASE_PUBLISHABLE_KEY=<empty>
```

نتایج:

- TypeScript و Build تولیدی: موفق
- ۳۱ آزمون مرورگری: موفق
- بارگذاری ۳۹ مسیر اصلی: موفق
- بررسی ۹ صفحه شورای صنفی: موفق
- Build در GitHub Actions: موفق
- خطای `supabaseUrl is required`: بازتولید نشد

## Commit اصلاح کد

```text
1199186 fix: allow demo builds without Supabase credentials
```

نویسنده Commit:

```text
msh804460 <www.msh804460@gmail.com>
```

## وضعیت انتشار آنلاین

کد اصلاح‌شده روی شاخه `main` قرار گرفته است، اما Workflow در مرحله `Configure GitHub Pages` متوقف می‌شود؛ زیرا GitHub Pages مخزن هنوز برای انتشار از GitHub Actions فعال نشده است.

مالک مخزن باید یک‌بار مسیر زیر را تنظیم کند:

```text
Repository Settings → Pages → Build and deployment → Source → GitHub Actions
```

پس از فعال‌سازی Pages باید Workflow دوباره اجرا شود. بعد از Deploy موفق، مرورگر فایل JavaScript جدید را دریافت می‌کند و فایل قدیمی `index-Cl89wQXk.js` دیگر نباید بارگذاری شود.

## تنظیم نسخه عملیاتی

برای اتصال واقعی به Supabase باید متغیرهای زیر در محیط Build/Hosting تعریف شوند:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

مقادیر واقعی این متغیرها نباید داخل Git یا فایل‌های مستندات ثبت شوند.
