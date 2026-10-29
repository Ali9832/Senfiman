import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { app } from "./index";
import { prisma } from "./auth";

let server: Server;
let baseUrl: string;
const testUserIds: string[] = [];

before(async () => {
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  if (testUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: testUserIds } } }).catch(() => undefined);
  }
  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
  await prisma.$disconnect();
});

async function signUpTestUser(prefix: string) {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const response = await fetch(`${baseUrl}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: `${prefix}-${unique}@example.test`,
      password: "TestPassword123!",
      firstName: "Test",
      lastName: prefix,
      studentCode: `${prefix}-${unique}`,
    }),
  });
  assert.equal(response.status, 201);
  const data = await response.json() as { user: { id: string; studentCode: string; roles: string[] } };
  const cookie = response.headers.get("set-cookie");
  assert.ok(cookie, "signup must issue a session cookie");
  testUserIds.push(data.user.id);
  return { ...data.user, cookie };
}

test("student session is authenticated but cannot access admin endpoints", async () => {
  const student = await signUpTestUser("student");
  assert.deepEqual(student.roles, ["student"]);

  const currentUser = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Cookie: student.cookie },
  });
  assert.equal(currentUser.status, 200);
  const current = await currentUser.json() as { user: { id: string; roles: string[] } };
  assert.equal(current.user.id, student.id);
  assert.deepEqual(current.user.roles, ["student"]);

  const adminOverview = await fetch(`${baseUrl}/api/admin/overview`, {
    headers: { Cookie: student.cookie },
  });
  assert.equal(adminOverview.status, 403);
});

test("only an authorized cafeteria role can consume an approved meal QR once", async () => {
  const sender = await signUpTestUser("sender");
  const recipient = await signUpTestUser("recipient");
  const today = new Date().toISOString().slice(0, 10);

  const createTransfer = await fetch(`${baseUrl}/api/meal-transfers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sender.cookie },
    body: JSON.stringify({
      receiverStudentCode: recipient.studentCode,
      receiverLastName: "recipient",
      mealDate: today,
      mealKind: "lunch",
      mealName: "غذای آزمایشی",
    }),
  });
  assert.equal(createTransfer.status, 201);
  const { transfer } = await createTransfer.json() as { transfer: { id: string; qr_token: string | null; status: string } };
  assert.equal(transfer.status, "approved");
  assert.ok(transfer.qr_token, "sender must receive a QR token");

  const unauthorizedConsume = await fetch(`${baseUrl}/api/meal-transfers/consume`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: recipient.cookie },
    body: JSON.stringify({ qrToken: transfer.qr_token }),
  });
  assert.equal(unauthorizedConsume.status, 403);

  await prisma.userRole.create({ data: { userId: sender.id, role: "council_member" } });
  const consume = await fetch(`${baseUrl}/api/meal-transfers/consume`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sender.cookie },
    body: JSON.stringify({ qrToken: transfer.qr_token }),
  });
  assert.equal(consume.status, 200);

  const consumeAgain = await fetch(`${baseUrl}/api/meal-transfers/consume`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sender.cookie },
    body: JSON.stringify({ qrToken: transfer.qr_token }),
  });
  assert.equal(consumeAgain.status, 409);
});
