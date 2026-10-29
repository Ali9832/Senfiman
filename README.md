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

## بررسی‌ها

```sh
npm run build
npm run test:smoke
npm run test:api
```

فایل‌های `.env` و `.env.local`، پوشه `node_modules` و خروجی `dist` در کنترل نسخه نگهداری نمی‌شوند.
