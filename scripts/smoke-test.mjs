import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createServer } from "node:net";

const baseUrl = process.env.SMOKE_BASE_URL || "http://127.0.0.1:5173";
const basePath = new URL(baseUrl).pathname.replace(/\/+$/, "");
const appPath = (path) => `${basePath}${path}` || "/";
const edge = process.env.EDGE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const port = await new Promise((resolvePort, rejectPort) => {
  const server = createServer();
  server.once("error", rejectPort);
  server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    if (!address || typeof address === "string") return rejectPort(new Error("پورت آزاد پیدا نشد"));
    server.close(() => resolvePort(address.port));
  });
});
const profileDir = await mkdtemp(join(tmpdir(), "senfi-smoke-"));
const browser = spawn(edge, ["--headless=new", "--disable-gpu", "--disable-extensions", "--no-default-browser-check", "--window-size=1440,1000", "--remote-debugging-address=127.0.0.1", `--remote-debugging-port=${port}`, `--user-data-dir=${profileDir}`, "--no-first-run", `${baseUrl}/auth`], { stdio: ["ignore", "ignore", "pipe"] });
let browserStderr = "";
browser.stderr?.on("data", (chunk) => { browserStderr += chunk.toString(); });
const results = [];

const delay = (ms) => new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
function record(name, passed, detail = "") {
  results.push({ name, passed, detail });
  console.log(`${passed ? "PASS" : "FAIL"} | ${name}${detail ? ` | ${detail}` : ""}`);
  if (!passed) throw new Error(name);
}

class Cdp {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
  }
  async open() {
    await new Promise((resolveOpen, reject) => {
      this.socket.onopen = resolveOpen;
      this.socket.onerror = reject;
      this.socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (!message.id) return;
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
      };
      this.socket.onclose = () => {
        for (const pending of this.pending.values()) pending.reject(new Error("ارتباط با مرورگر آزمایشی قطع شد"));
        this.pending.clear();
      };
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolveSend, reject) => {
      this.pending.set(id, { resolve: resolveSend, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression) {
    const response = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
    return response.result.value;
  }
  async waitFor(expression, timeout = 8000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      if (await this.evaluate(`Boolean(${expression})`)) return;
      await delay(100);
    }
    throw new Error(`Timeout: ${expression}`);
  }
  async navigate(path) {
    await this.send("Page.navigate", { url: `${baseUrl}${path}` });
    await this.waitFor("document.readyState !== 'loading'");
    await delay(350);
  }
  async clickExpression(expression) {
    const found = await this.evaluate(`(() => { const element = ${expression}; if (!element) return false; element.scrollIntoView({ block: 'center', inline: 'center' }); return true; })()`);
    if (!found) throw new Error(`Element not found: ${expression}`);
    await delay(100);
    const rect = await this.evaluate(`(() => { const element = ${expression}; if (!element) return null; const rect = element.getBoundingClientRect(); return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; })()`);
    if (!rect) throw new Error(`Element not found: ${expression}`);
    await this.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: rect.x, y: rect.y });
    await this.send("Input.dispatchMouseEvent", { type: "mousePressed", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
    await this.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
    await delay(250);
  }
  async clickText(text, selector = "button") {
    const safe = JSON.stringify(text);
    await this.clickExpression(`[...document.querySelectorAll(${JSON.stringify(selector)})].find((element) => element.textContent?.trim().includes(${safe}))`);
  }
  async fill(selector, value) {
    const changed = await this.evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!element) return false; const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, ${JSON.stringify(value)}); element.dispatchEvent(new Event('input', { bubbles: true })); element.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
    if (!changed) throw new Error(`Field not found: ${selector}`);
    await delay(100);
  }
}

async function connect() {
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      const pages = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
      const page = pages.find((item) => item.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await delay(100);
  }
  const detail = browserStderr.trim().slice(-1200);
  throw new Error(`مرورگر آزمایشی آماده نشد${detail ? `: ${detail}` : ""}`);
}

async function login(cdp, label) {
  await cdp.evaluate("localStorage.removeItem('demo-persona'); localStorage.removeItem('demo-impersonated-user'); localStorage.removeItem('demo-owner-persona');");
  await cdp.navigate("/auth");
  if (label === "مدیر دانشجویی") await cdp.clickText("شورای ناظر");
  if (label === "کار دانشجویی") await cdp.clickText("مسئولان و شوراها");
  await cdp.waitFor(`document.body.innerText.includes(${JSON.stringify(label)})`);
  await cdp.clickText(label);
  await cdp.waitFor(`location.pathname === ${JSON.stringify(appPath("/"))} && !document.body.innerText.includes('ورود به سامانه دانشجویی')`);
}

let cdp;
try {
  cdp = new Cdp(await connect());
  await cdp.open();
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  await login(cdp, "دانشجوی خوابگاهی مکانیک");
  record("ورود دانشجوی خوابگاهی مکانیک", await cdp.evaluate("document.body.innerText.includes('سارا احمدی')"));
  record("نمایش چهار رسانه مرتبط در خانه مکانیک", await cdp.evaluate("document.body.innerText.includes('شورای صنفی مرکزی') && document.body.innerText.includes('شورای صنفی دانشکده مکانیک') && document.body.innerText.includes('روابط عمومی دانشگاه') && document.body.innerText.includes('معاونت دانشجویی')"));
  await cdp.clickText("خدمات دانشجویی");
  const residentNav = await cdp.evaluate("document.querySelector('nav')?.innerText || ''");
  record("نمایش منوی خدمات خوابگاهی برای ساکن", residentNav.includes("خدمات خوابگاهی و کار دانشجویی"), residentNav.replace(/\\n/g, " / "));
  await cdp.navigate("/student-services");
  await cdp.clickText("لباسشویی");
  const residentServicesText = await cdp.evaluate("document.querySelector('main')?.innerText || ''");
  record("نمایش رزرو لباسشویی برای ساکن", residentServicesText.includes("رزرو لباسشویی") && await cdp.evaluate("[...document.querySelectorAll('button')].some((button) => button.textContent?.includes('رزرو نوبت'))"), residentServicesText.slice(0, 500).replace(/\\n/g, " / "));
  await cdp.clickText("وسایل امانی");
  record("محدود شدن موجودی به خوابگاه امینیان", await cdp.evaluate("document.body.innerText.includes('جاروبرقی شماره ۱') && !document.body.innerText.includes('ست راکت بدمینتون')"));
  await cdp.clickText("لباسشویی");

  await cdp.clickText("رزرو نوبت");
  await cdp.waitFor("document.querySelector('[role=dialog]')");
  await cdp.clickExpression("document.querySelector('[role=dialog] button[role=combobox]')");
  await cdp.waitFor("document.querySelector('[role=option]:not([data-disabled])')");
  await cdp.clickExpression("document.querySelector('[role=option]:not([data-disabled])')");
  await cdp.clickExpression("document.querySelectorAll('[role=dialog] button[role=combobox]')[1]");
  await cdp.waitFor("document.querySelector('[role=option]:not([data-disabled])')");
  await cdp.clickExpression("document.querySelector('[role=option]:not([data-disabled])')");
  await cdp.clickText("بررسی و تأیید نوبت", "[role=dialog] button");
  await cdp.waitFor("document.body.innerText.includes('تأیید نهایی نوبت لباسشویی') && document.body.innerText.includes('آیا از ثبت این نوبت مطمئن هستید؟')");
  record("نمایش خلاصه و تأیید دومرحله‌ای نوبت", true);
  await cdp.clickText("تأیید و ثبت نوبت", "[role=dialog] button");
  await cdp.waitFor("JSON.parse(localStorage.getItem('dorm-services')).state.reservations.some((item) => item.userId === 'demo-student-mechanical-resident')");
  await cdp.clickText("نمای کلی");
  await cdp.waitFor("document.body.innerText.includes('نوبت لباسشویی شما')");
  record("ثبت عملی نوبت لباسشویی", await cdp.evaluate("JSON.parse(localStorage.getItem('dorm-services')).state.reservations.some((item) => item.userId === 'demo-student-mechanical-resident')"));
  await cdp.navigate("/");
  await cdp.clickExpression("document.querySelector('button[aria-label=\"چت آنلاین با روابط عمومی\"]')");
  await cdp.waitFor("document.querySelector('button[aria-label=\"باز کردن گفت‌وگو در صفحه کامل\"]')");
  await cdp.fill("textarea", "پیام نیمه‌تمام برای ادامه در صفحه کامل");
  await cdp.clickExpression("document.querySelector('button[aria-label=\"باز کردن گفت‌وگو در صفحه کامل\"]')");
  await cdp.waitFor(`location.pathname === ${JSON.stringify(appPath("/communication"))} && location.search.includes('tab=chat')`);
  record("انتقال گفت‌وگوی شناور به صفحه کامل با حفظ متن", await cdp.evaluate("document.querySelector('textarea')?.value === 'پیام نیمه‌تمام برای ادامه در صفحه کامل'"));
  await cdp.clickText("ارسال پیام");
  await cdp.waitFor("document.body.innerText.includes('پیام نیمه‌تمام برای ادامه در صفحه کامل')");
  await cdp.clickText("گفت‌وگوی جدید");
  record("امکان پایان و شروع موضوع گفت‌وگوی جدید", await cdp.evaluate("document.body.innerText.includes('گفت‌وگوی جدید') && document.body.innerText.includes('موضوع موردنظرتان را بنویسید')"));

  await login(cdp, "دانشجوی غیردرخوابگاه مکانیک");
  await cdp.clickText("خدمات دانشجویی");
  record("عنوان شخصی‌سازی‌شده منوی دانشجوی غیردرخوابگاه", await cdp.evaluate("document.body.innerText.includes('فرصت‌های کار دانشجویی') && !document.body.innerText.includes('خدمات خوابگاهی و کار دانشجویی')"));
  await cdp.navigate("/student-services");
  record("پنهان بودن رزرو و موجودی خوابگاه برای غیردرخوابگاه", await cdp.evaluate("document.body.innerText.includes('حساب غیردرخوابگاه') && ![...document.querySelectorAll('button')].some((button) => button.textContent?.includes('رزرو نوبت')) && !document.body.innerText.includes('جاروبرقی شماره ۱')"));
  await cdp.navigate("/quality-control");
  record("مسدود بودن صفحه مدیریتی برای دانشجوی عادی", await cdp.evaluate("document.body.innerText.includes('دسترسی محدود')"));
  await cdp.navigate("/student-voice");
  await cdp.fill("input", "پیشنهاد آزمایشی ارتباط بخش‌ها");
  await cdp.fill("textarea", "این پیام توسط آزمون مرورگری برای بررسی ثبت و پیگیری ایجاد شده است.");
  await cdp.clickText("ارسال به شورای صنفی");
  await cdp.waitFor("JSON.parse(localStorage.getItem('demo-complaints')).some((item) => item.title === 'پیشنهاد آزمایشی ارتباط بخش‌ها')");
  record("ثبت واقعی پیشنهاد در صدای دانشجو", true);

  await login(cdp, "دانشجوی برق");
  record("نمایش خبر شورای برق در خانه دانشجوی برق", await cdp.evaluate("document.body.innerText.includes('شورای صنفی برق و کامپیوتر')"));
  await cdp.navigate("/locker-v2");
  await cdp.waitFor("document.body.innerText.includes('دانشکده برق و کامپیوتر')");
  record("محدود شدن کمد به دانشکده برق", await cdp.evaluate("document.body.innerText.includes('دانشکده برق و کامپیوتر') && !document.body.innerText.includes('دانشکده مکانیک')"));
  await cdp.navigate("/contact");
  await cdp.fill("input", "خوابگاه ریحانه");
  await cdp.waitFor("document.body.innerText.includes('سرپرستی خوابگاه ریحانه')");
  record("جست‌وجوی سریع دفترچه تلفن", await cdp.evaluate("document.body.innerText.includes('سرپرستی خوابگاه ریحانه') && !document.body.innerText.includes('دفتر دانشکده مکانیک')"));

  await login(cdp, "کار دانشجویی");
  await cdp.navigate("/student-services");
  await cdp.clickText("لباسشویی");
  await cdp.waitFor("document.body.innerText.includes('کنترل حضور و جایگزینی نوبت')");
  await cdp.clickText("تأیید کارت");
  await cdp.waitFor("JSON.parse(localStorage.getItem('dorm-services')).state.reservations.some((item) => item.userId === 'demo-student-mechanical-resident' && item.status === 'checked_in')");
  record("تأیید کارت و حضور توسط مسئول لباسشویی", true);
  await cdp.clickText("وسایل امانی");
  await cdp.waitFor("[...document.querySelectorAll('button')].some((button) => button.textContent?.includes('ثبت بازگشت و تحویل کارت'))");
  await cdp.clickText("ثبت بازگشت و تحویل کارت");
  await cdp.waitFor("JSON.parse(localStorage.getItem('dorm-services')).state.assets.some((item) => item.id === 'vacuum-1' && item.status === 'available')");
  record("ثبت بازگشت وسیله و تحویل کارت دانشجویی", true);

  await login(cdp, "مدیر دانشجویی");
  await cdp.navigate("/admin/access");
  await cdp.waitFor("document.querySelector('[role=switch][data-state=checked]')");
  const switchState = await cdp.evaluate(`(() => { const root = document.querySelector('[role=switch][data-state=checked]'); const thumb = root?.firstElementChild; if (!root || !thumb) return null; const rootRect = root.getBoundingClientRect(); const thumbRect = thumb.getBoundingClientRect(); return { background: getComputedStyle(root).backgroundColor, onRight: thumbRect.left + thumbRect.width / 2 > rootRect.left + rootRect.width / 2 }; })()`);
  record("کلید فعال آبی است", switchState?.background === "rgb(37, 99, 235)", switchState?.background);
  record("دایره کلید فعال در سمت راست است", switchState?.onRight === true);
  await cdp.clickExpression("document.querySelector('[role=switch][data-state=checked]')");
  await cdp.waitFor("document.querySelector('[role=switch][data-state=unchecked]')");
  await cdp.clickExpression("document.querySelector('[role=switch][data-state=unchecked]')");
  await cdp.waitFor("document.querySelector('[role=switch][data-state=checked]')");
  const toggledSwitch = await cdp.evaluate(`(() => { const root = document.querySelector('[role=switch][data-state=checked]'); const thumb = root?.firstElementChild; if (!root || !thumb) return false; const rootRect = root.getBoundingClientRect(); const thumbRect = thumb.getBoundingClientRect(); return getComputedStyle(root).backgroundColor === 'rgb(37, 99, 235)' && thumbRect.left + thumbRect.width / 2 > rootRect.left + rootRect.width / 2; })()`);
  record("تغییر خاموش/روشن کلید و بازگشت صحیح دایره", toggledSwitch);
  await cdp.clickText("دانشجویان");
  await cdp.clickText("دانشجویان خوابگاهی");
  const residentSeedVisible = await cdp.evaluate("document.body.innerText.includes('سارا احمدی') && document.body.innerText.includes('دانشجوی خوابگاهی مکانیک')");
  await cdp.clickText("دانشجویان غیردرخوابگاه");
  const nonResidentSeedsVisible = await cdp.evaluate("document.body.innerText.includes('علی رضایی') && document.body.innerText.includes('مریم کاظمی') && document.body.innerText.includes('دانشکده برق و کامپیوتر')");
  record("ثبت سه دانشجوی نمونه در مدیریت نقش‌ها", residentSeedVisible && nonResidentSeedsVisible);
  await cdp.navigate("/council");
  record("بارگذاری پرتال شورای صنفی", await cdp.evaluate("document.body.innerText.includes('تابلوی پیگیری شفاف') && document.body.innerText.includes('مالک اجرا مشخص است')"));
  await cdp.navigate("/council/central");
  record("پر شدن صفحه شورای مرکزی با محتوای گزارش", await cdp.evaluate("document.body.innerText.includes('رو‌در‌رو') && document.body.innerText.includes('۶۵۲۱') && document.body.innerText.includes('صندوق رفاه دانشجویان')"));
  record("تفکیک نقش شورا از مسئول اجرا", await cdp.evaluate("document.body.innerText.includes('نقش شورا') && document.body.innerText.includes('مسئول اجرا') && document.body.innerText.includes('خروجی واحد اجرایی')"));
  await cdp.navigate("/council/reyhaneh");
  record("نمایش پرونده واقعی ژنراتور ریحانه", await cdp.evaluate("document.body.innerText.includes('نصب ژنراتور و اتاقک عایق صدا') && document.body.innerText.includes('نتیجه تأییدشده')"));
  await cdp.navigate("/student-voice");
  record("بارگذاری صدای دانشجو", await cdp.evaluate("document.body.innerText.includes('ثبت پیام') && document.body.innerText.includes('ارزیابی')"));
  await cdp.navigate("/complaints");
  await cdp.waitFor(`location.pathname === ${JSON.stringify(appPath("/student-voice"))}`);
  record("هدایت مسیر قدیمی شکایت به صدای دانشجو", true);
  await cdp.navigate("/councils/mechanical");
  await cdp.waitFor(`location.pathname === ${JSON.stringify(appPath("/council/mechanical"))}`);
  record("هدایت مسیر قدیمی شورا به صفحه اختصاصی", true);

  const fullAccessRoutes = [
    "/calendar", "/library", "/schedule", "/exams", "/meal", "/meal-transfer", "/resources", "/tickets", "/kb",
    "/warden/tickets", "/services/tickets", "/warehouse/requests", "/secretary/complaints", "/locker-v2", "/profile",
    "/student-services", "/surveys", "/quality-control", "/quality-control-v2", "/quality-control-dorm", "/scan-meal",
    "/council/locker-receipts", "/admin", "/admin/access", "/admin/tickets-dashboard", "/communication", "/council", "/council/central", "/council/mechanical", "/council/electrical", "/council/chemistry", "/council/industrial", "/council/civil", "/council/basic", "/council/aminian", "/council/reyhaneh", "/aminian", "/reyhaneh", "/contact",
  ];
  for (const route of fullAccessRoutes) {
    console.log(`CHECK | ${route}`);
    await cdp.navigate(route);
    const healthy = await cdp.evaluate("!document.querySelector('vite-error-overlay') && !document.body.innerText.includes('صفحه پیدا نشد') && !document.body.innerText.includes('دسترسی محدود')");
    if (!healthy) throw new Error(`Route failed: ${route}`);
    if (/^\/council\/(central|mechanical|electrical|chemistry|industrial|civil|basic|aminian|reyhaneh)$/.test(route)) {
      const completeCouncilPage = await cdp.evaluate("['دامنه آرشیو و موضوعات اصلی','تابلوی شفاف پرونده‌ها','رسانه و آخرین پست‌ها','اطلاعیه‌ها','گالری رسانه‌ای','نامه‌های در حال پیگیری','گزارش عملکرد','ارتباط با روابط عمومی','کانال‌ها و مجراهای رسمی'].every((title) => document.body.innerText.includes(title))");
      if (!completeCouncilPage) throw new Error(`Council structure failed: ${route}`);
    }
  }
  record("بارگذاری همه صفحات اصلی با دسترسی کامل", true, `${fullAccessRoutes.length} مسیر`);
  record("ساختار ثابت رسانه‌ای برای همه شوراها", true, "۹ صفحه شورا");

  console.log(`\n${results.length} آزمون مرورگری با موفقیت انجام شد.`);
} catch (error) {
  console.error(`\nSmoke test failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  cdp?.socket.close();
  browser.kill();
  await delay(300);
  const safeRoot = resolve(tmpdir());
  const safeProfile = resolve(profileDir);
  if (safeProfile.startsWith(safeRoot)) await rm(safeProfile, { recursive: true, force: true }).catch(() => {});
}
