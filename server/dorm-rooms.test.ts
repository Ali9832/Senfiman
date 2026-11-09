import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import jwt from "jsonwebtoken";
import { app } from "./index";
import { prisma } from "./auth";

const buildingId = "a13d2a6f-4d42-4c21-b5ef-f74284585c71";
const roomId = "5d392d39-a23e-4860-b68d-4c7e5144e282";
const userId = "1c30fdd6-b447-4e15-9fe9-e6898a1ba420";
const checklist = ["beds", "closet", "lighting", "cooling", "heating", "sockets", "window", "internet", "cleanliness"];
let roles = ["admin"];
let savedInspection: any;
let server: Server;
let baseUrl: string;

before(async () => {
  (prisma.userRole as any).findMany = async () => roles.map((role) => ({ role }));
  (prisma.building as any).findFirst = async ({ where }: any) => where.id === buildingId ? { id: buildingId } : null;
  (prisma.dormRoom as any).findFirst = async ({ where }: any) =>
    where.buildingId === buildingId && (where.number === "214" || where.id === roomId) ? { id: roomId } : null;
  (prisma.dormRoom as any).create = async ({ data }: any) => ({ id: roomId, ...data });
  (prisma.dormRoomInspection as any).create = async ({ data }: any) => (savedInspection = { id: "inspection", ...data });
  (prisma.dormRoomInspection as any).findMany = async () => [savedInspection];
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await prisma.$disconnect();
});

function request(path: string, method = "GET", body?: unknown) {
  const token = jwt.sign({ sub: userId }, process.env.JWT_SECRET ?? "development-only-change-me-before-production");
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: { Cookie: `${process.env.AUTH_COOKIE_NAME ?? "senfi_session"}=${token}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

test("room creation validates input and requires administrator", async () => {
  roles = ["student"];
  assert.equal((await request(`/api/dorms/${buildingId}/rooms`, "POST", { number: "214", floor: "2", capacity: 4 })).status, 403);
  roles = ["admin"];
  assert.equal((await request(`/api/dorms/${buildingId}/rooms`, "POST", { number: "214", floor: "2", capacity: 0 })).status, 400);
  assert.equal((await request(`/api/dorms/${buildingId}/rooms`, "POST", { number: "214", floor: "2", capacity: 4 })).status, 201);
});

test("room inspection requires a complete checklist and saves the report", async () => {
  roles = ["council_member"];
  const report = { facultyId: buildingId, inspectionType: "room", locationValue: "214", results: Object.fromEntries(checklist.map((id) => [id, "ok"])), details: {}, customItems: [] };
  assert.equal((await request("/api/qc/inspections", "POST", { ...report, results: { beds: "ok" } })).status, 400);
  assert.equal((await request("/api/qc/inspections", "POST", { ...report, results: { ...report.results, beds: "notok" } })).status, 400);
  assert.equal((await request("/api/qc/inspections", "POST", { ...report, locationValue: "999" })).status, 404);
  assert.equal((await request("/api/qc/inspections", "POST", { ...report, results: { ...report.results, beds: "notok" }, details: { beds: "خراب" } })).status, 201);
  const history = await request(`/api/dorms/${buildingId}/rooms/${roomId}/inspections`);
  assert.equal(history.status, 200);
  assert.equal((await history.json()).inspections[0].details.beds, "خراب");
  roles = ["student"];
  assert.equal((await request(`/api/dorms/${buildingId}/rooms/${roomId}/inspections`)).status, 403);
});
