import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { app } from "./index";
import { prisma, publicDormTestEmail } from "./auth";

let server: Server;
let baseUrl: string;
const buildingId = "a13d2a6f-4d42-4c21-b5ef-f74284585c71";
const roomId = "5d392d39-a23e-4860-b68d-4c7e5144e282";

before(async () => {
  process.env.PUBLIC_TEST_MODE = "true";
  (prisma.building as any).findMany = async () => [{ id: buildingId, name: "Dorm", kind: "dorm" }];
  (prisma.building as any).findFirst = async () => ({ id: buildingId });
  (prisma.building as any).create = async ({ data }: any) => ({ id: buildingId, ...data });
  (prisma.dormRoom as any).create = async ({ data }: any) => ({ id: roomId, ...data });
  (prisma.dormRoom as any).findFirst = async () => ({ id: roomId });
  (prisma.user as any).upsert = async () => ({ email: publicDormTestEmail });
  (prisma.profile as any).findMany = async () => [{ id: "profile", firstName: "Test", lastName: "User", studentCode: "1" }];
  (prisma.userRole as any).findMany = async () => [];
  (prisma.profile as any).count = async () => 1;
  (prisma.mealTransfer as any).count = async () => 0;
  (prisma.mealTransfer as any).findMany = async () => [];
  (prisma.lockerReservation as any).count = async () => 0;
  (prisma.qcInspection as any).count = async () => 0;
  (prisma.building as any).delete = async () => ({});
  (prisma.dormRoomInspection as any).create = async ({ data }: any) => ({ id: "report", ...data });
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  delete process.env.PUBLIC_TEST_MODE;
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await prisma.$disconnect();
});

function request(path: string, method = "GET", body?: unknown) {
  return fetch(`${baseUrl}${path}`, { method, headers: { "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
}

test("public mode permits administrator access without login", async () => {
  const me = await request("/api/auth/me");
  assert.equal(me.status, 200);
  assert.equal((await me.json()).user.email, publicDormTestEmail);
  const overview = await request("/api/admin/overview");
  assert.equal((await overview.json()).profiles.length, 1);
  assert.equal((await request("/api/admin/buildings", "POST", { name: "Dorm", kind: "dorm" })).status, 201);
  assert.equal((await request("/api/admin/buildings", "POST", { name: "Other", kind: "faculty" })).status, 201);
  assert.equal((await request(`/api/dorms/${buildingId}/rooms`, "POST", { number: "214", floor: "2", capacity: 4 })).status, 201);
  const results = Object.fromEntries(["beds", "closet", "lighting", "cooling", "heating", "sockets", "window", "internet", "cleanliness"].map((id) => [id, "ok"]));
  assert.equal((await request("/api/qc/inspections", "POST", { facultyId: buildingId, inspectionType: "room", locationValue: "214", results, details: {}, customItems: [] })).status, 201);
  assert.equal((await request("/api/admin/users", "POST", {})).status, 400);
  assert.equal((await request(`/api/admin/buildings/${buildingId}`, "DELETE")).status, 204);
  assert.equal((await request("/api/meal-transfers")).status, 200);
  process.env.PUBLIC_TEST_MODE = "false";
  assert.equal((await request("/api/auth/me")).status, 401);
});
