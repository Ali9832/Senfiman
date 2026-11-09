# سامانه شورای صنفی دانشجویان

این مخزن شامل رابط React/Vite، API مبتنی بر Express و پایگاه داده PostgreSQL/Prisma است. حالت نمایشی فرانت‌اند همچنان در دسترس است و مهاجرت سرویس‌های قدیمی Supabase به API محلی به‌صورت تدریجی انجام می‌شود.

## اجرای نمایشی فرانت‌اند

```sh
npm ci
npm run dev
```

سایت روی `http://127.0.0.1:5173` اجرا می‌شود. مقدار `VITE_DEMO_MODE=true` برای حالت نمایشی است.

## اجرای فرانت‌اند و API محلی

1. فایل `.env.example` را به `.env` کپی و مقدارهای امن را تنظیم کنید.
2. PostgreSQL را با `docker compose up -d postgres` اجرا کنید.
3. دستورات زیر را اجرا کنید:

```sh
npm ci
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev:server
npm run dev
```

Vite مسیر `/api` را به `http://127.0.0.1:3001` هدایت می‌کند. برای اتصال واقعی فرانت‌اند به API، مقدار `VITE_DEMO_MODE=false` لازم است.

## بک‌اند خوابگاه

پس از بررسی وضعیت دیتابیس و اجرای مایگریشن‌ها، مدیر می‌تواند از `POST /api/admin/buildings` با نوع `dorm` خوابگاه بسازد. مسیرهای اتاق عبارت‌اند از:

- `GET /api/dorms/:buildingId/rooms`: فهرست اتاق‌های خوابگاه برای کاربران واردشده.
- `POST /api/dorms/:buildingId/rooms`: ثبت اتاق توسط مدیر، با بدنه `{ "number": "214", "floor": "2", "capacity": 4 }`.
- `PATCH /api/dorms/:buildingId/rooms/:roomId`: ویرایش شماره، طبقه یا ظرفیت توسط مدیر.
- `GET /api/dorms/:buildingId/rooms/:roomId/inspections`: سوابق بازرسی برای مدیر و اعضای شورا.

مدیر می‌تواند در پنل مدیریت، خوابگاه و اتاق‌های آن را ثبت کند. در صفحه بازرسی خوابگاه، اتاق ثبت‌شده انتخاب می‌شود و گزارش‌ها و سوابق آن نمایش داده می‌شوند. فرم با `POST /api/qc/inspections` گزارش را ذخیره می‌کند؛ برای هر مورد خراب، توضیح الزامی است.

برای Vercel، `DATABASE_URL` و `JWT_SECRET` و `VITE_DEMO_MODE=false` را در تنظیمات پروژه تعریف کنید و `FRONTEND_ORIGIN` را برابر نشانی سایت قرار دهید. پیش از اجرا، وضعیت مایگریشن دیتابیس مقصد و دسترسی شبکه آن را بررسی کنید. امکانات قدیمی وابسته به Supabase به تنظیمات جداگانه نیاز دارند.

استقرار فعلی Vercel با `PUBLIC_TEST_MODE=true` برای آزمایش بدون ورود تنظیم شده است. در این حالت همه دارندگان نشانی به کل API با دسترسی مدیر دسترسی دارند. برای پایان آزمایش، مقدار را در `vercel.json` به `false` تغییر دهید و دوباره مستقر کنید. برای اجرای همین حالت در محیط محلی، علاوه بر `PUBLIC_TEST_MODE=true` مقدار `VITE_DEMO_MODE=false` را تنظیم کنید.

## بررسی‌ها

```sh
npm run build
npm run test:smoke
npm run test:api
```

فایل‌های `.env` و `.env.local`، پوشه `node_modules` و خروجی `dist` در کنترل نسخه نگهداری نمی‌شوند.
