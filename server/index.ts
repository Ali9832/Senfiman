import "dotenv/config";
import { randomBytes } from "node:crypto";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { z } from "zod";
import {
  AppRole,
  BuildingKind,
  ComplaintKind,
  ComplaintStatus,
  ItemRequestStatus,
  Prisma,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@prisma/client";
import {
  clearSession,
  hashPassword,
  issueSession,
  prisma,
  publicUser,
  publicDormTestEmail,
  publicDormTestUserId,
  requireAuth,
  requireRole,
  type AuthenticatedRequest,
  verifyPassword,
} from "./auth.js";

export const app = express();
const port = Number(process.env.PORT ?? 3001);
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:8080";
const authSelect = {
  id: true,
  email: true,
  profile: { select: { firstName: true, lastName: true, studentCode: true } },
  roles: { select: { role: true } },
} as const;

const authAttempts = new Map<string, { count: number; resetAt: number }>();
const authRateLimit = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const key = `${req.ip}:${req.path}`;
  const now = Date.now();
  const attempt = authAttempts.get(key);
  if (!attempt || attempt.resetAt <= now) {
    authAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return next();
  }
  if (attempt.count >= 10) {
    res.setHeader("Retry-After", Math.ceil((attempt.resetAt - now) / 1000));
    return res.status(429).json({ error: "Too many authentication attempts. Please try again later." });
  }
  attempt.count += 1;
  return next();
};

// Behind Vercel the client IP is in X-Forwarded-For; without this every user shares one rate-limit bucket.
app.set("trust proxy", process.env.VERCEL ? 1 : false);
app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  next();
});
app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json({ limit: "4mb" }));
app.use(cookieParser());

// Vercel rejects request bodies over 4.5 MB (base64 adds ~33%), so keep files small.
const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;
const attachmentInput = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().max(150).optional(),
  sizeBytes: z.number().int().positive().max(MAX_ATTACHMENT_BYTES),
  data: z.string().regex(/^[A-Za-z0-9+/=]+$/),
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/auth/signup", authRateLimit, async (req, res, next) => {
  try {
    const body = z.object({
      email: z.string().trim().email().max(320),
      password: z.string().min(8).max(128),
      firstName: z.string().trim().min(1).max(120),
      lastName: z.string().trim().min(1).max(120),
      studentCode: z.string().trim().min(1).max(100),
    }).parse(req.body);
    const email = body.email.toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (exists) return res.status(409).json({ error: "An account with this email already exists." });

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(body.password),
        profile: {
          create: {
            firstName: body.firstName,
            lastName: body.lastName,
            studentCode: body.studentCode,
          },
        },
        roles: { create: { role: "student" } },
      },
      select: authSelect,
    });
    issueSession(res, user.id, user.roles.map(({ role }) => role));
    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", authRateLimit, async (req, res, next) => {
  try {
    const body = z.object({
      email: z.string().trim().email().max(320),
      password: z.string().min(1).max(128),
    }).parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      include: { profile: true, roles: { select: { role: true } } },
    });
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    issueSession(res, user.id, user.roles.map(({ role }) => role));
    return res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/logout", (_req, res) => {
  clearSession(res);
  res.status(204).end();
});

app.get("/api/auth/me", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (req.auth!.publicDormTest) {
      return res.json({ user: { id: publicDormTestUserId, email: publicDormTestEmail, firstName: "حالت", lastName: "آزمایشی", studentCode: null, roles: [AppRole.admin] } });
    }
    const user = await prisma.user.findUnique({ where: { id: req.auth!.userId }, select: authSelect });
    if (!user) {
      clearSession(res);
      return res.status(401).json({ error: "Session user no longer exists." });
    }
    return res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/buildings", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const kind = z.enum(["faculty", "dorm", "cafeteria", "other"]).optional().parse(req.query.kind);
    const buildings = await prisma.building.findMany({
      where: kind ? { kind } : undefined,
      orderBy: { name: "asc" },
    });
    return res.json({ buildings });
  } catch (error) {
    next(error);
  }
});

const dormRoomInput = z.object({
  number: z.string().trim().min(1).max(100),
  floor: z.string().trim().min(1).max(100),
  capacity: z.number().int().min(1).max(1000),
}).strict();

app.get("/api/dorms/:buildingId/rooms", requireAuth, async (req, res, next) => {
  try {
    const { buildingId } = z.object({ buildingId: z.string().uuid() }).parse(req.params);
    const building = await prisma.building.findFirst({ where: { id: buildingId, kind: BuildingKind.dorm }, select: { id: true } });
    if (!building) return res.status(404).json({ error: "Dormitory not found." });
    const rooms = await prisma.dormRoom.findMany({ where: { buildingId }, orderBy: [{ floor: "asc" }, { number: "asc" }] });
    return res.json({ rooms });
  } catch (error) { next(error); }
});

app.post("/api/dorms/:buildingId/rooms", requireAuth, requireRole(AppRole.admin), async (req, res, next) => {
  try {
    const { buildingId } = z.object({ buildingId: z.string().uuid() }).parse(req.params);
    const body = dormRoomInput.parse(req.body) as { number: string; floor: string; capacity: number };
    const building = await prisma.building.findFirst({ where: { id: buildingId, kind: BuildingKind.dorm }, select: { id: true } });
    if (!building) return res.status(404).json({ error: "Dormitory not found." });
    const room = await prisma.dormRoom.create({ data: { buildingId, ...body } });
    return res.status(201).json({ room });
  } catch (error) { next(error); }
});

app.patch("/api/dorms/:buildingId/rooms/:roomId", requireAuth, requireRole(AppRole.admin), async (req, res, next) => {
  try {
    const { buildingId, roomId } = z.object({ buildingId: z.string().uuid(), roomId: z.string().uuid() }).parse(req.params);
    const body = dormRoomInput.partial().refine((value) => Object.keys(value).length > 0).parse(req.body);
    const result = await prisma.dormRoom.updateMany({ where: { id: roomId, buildingId, building: { kind: BuildingKind.dorm } }, data: body });
    if (!result.count) return res.status(404).json({ error: "Room not found." });
    const room = await prisma.dormRoom.findUnique({ where: { id: roomId } });
    return res.json({ room });
  } catch (error) { next(error); }
});

app.get("/api/dorms/:buildingId/rooms/:roomId/inspections", requireAuth, requireRole(AppRole.admin, AppRole.council_member, AppRole.central_council), async (req, res, next) => {
  try {
    const { buildingId, roomId } = z.object({ buildingId: z.string().uuid(), roomId: z.string().uuid() }).parse(req.params);
    const room = await prisma.dormRoom.findFirst({ where: { id: roomId, buildingId, building: { kind: BuildingKind.dorm } }, select: { id: true } });
    if (!room) return res.status(404).json({ error: "Room not found." });
    const inspections = await prisma.dormRoomInspection.findMany({ where: { roomId }, orderBy: { createdAt: "desc" }, take: 200 });
    return res.json({ inspections });
  } catch (error) { next(error); }
});

app.get("/api/profile/me", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: req.auth!.userId },
      select: { residentBuildingId: true },
    });
    return res.json({ profile });
  } catch (error) {
    next(error);
  }
});

const mealTransferInput = z.object({
  receiverStudentCode: z.string().trim().min(1).max(100),
  receiverLastName: z.string().trim().min(1).max(120),
  mealDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealKind: z.enum(["lunch", "dinner"]),
  mealName: z.string().trim().max(500).optional(),
  transferType: z.enum(["send", "request"]).default("send"),
});

function parseMealDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new z.ZodError([{ code: "custom", path: ["mealDate"], message: "Invalid meal date." }]);
  }
  return date;
}

function startOfCurrentWeek() {
  const now = new Date();
  const day = now.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceMonday));
}

function mealTransferForClient(
  transfer: {
    id: string;
    senderId: string;
    receiverId: string | null;
    receiverStudentCode: string;
    receiverLastName: string;
    mealDate: Date;
    mealKind: "lunch" | "dinner";
    mealName: string | null;
    transferType: "send" | "request";
    status: "pending" | "approved" | "rejected" | "consumed" | "expired";
    qrToken: string;
    createdAt: Date;
    respondedAt: Date | null;
    consumedAt: Date | null;
  },
  viewerId: string,
) {
  return {
    id: transfer.id,
    sender_id: transfer.senderId,
    receiver_id: transfer.receiverId,
    receiver_student_code: transfer.receiverStudentCode,
    receiver_last_name: transfer.receiverLastName,
    meal_date: transfer.mealDate.toISOString().slice(0, 10),
    meal_kind: transfer.mealKind,
    meal_name: transfer.mealName,
    transfer_type: transfer.transferType,
    status: transfer.status,
    qr_token: transfer.senderId === viewerId ? transfer.qrToken : null,
    created_at: transfer.createdAt.toISOString(),
    responded_at: transfer.respondedAt?.toISOString() ?? null,
    consumed_at: transfer.consumedAt?.toISOString() ?? null,
  };
}

app.get("/api/meal-transfers", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const transfers = await prisma.mealTransfer.findMany({
      where: {
        OR: [
          { senderId: req.auth!.userId },
          { receiverId: req.auth!.userId },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return res.json({ transfers: transfers.map((transfer) => mealTransferForClient(transfer, req.auth!.userId)) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/meal-transfers", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = mealTransferInput.parse(req.body);
    const mealDate = parseMealDate(body.mealDate);
    const today = new Date();
    const todayStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    if (mealDate < todayStart) return res.status(400).json({ error: "Meal date cannot be in the past." });

    const recipient = await prisma.profile.findUnique({
      where: { studentCode: body.receiverStudentCode },
      select: { id: true, lastName: true },
    });
    if (!recipient || recipient.lastName?.trim() !== body.receiverLastName) {
      return res.status(404).json({ error: "Recipient was not found." });
    }
    if (recipient.id === req.auth!.userId) {
      return res.status(400).json({ error: "You cannot transfer a meal to yourself." });
    }

    const weekUsage = await prisma.mealTransfer.count({
      where: { senderId: req.auth!.userId, createdAt: { gte: startOfCurrentWeek() } },
    });
    if (weekUsage >= 3) return res.status(409).json({ error: "Weekly transfer limit reached." });

    const transfer = await prisma.mealTransfer.create({
      data: {
        senderId: req.auth!.userId,
        receiverId: recipient.id,
        receiverStudentCode: body.receiverStudentCode,
        receiverLastName: body.receiverLastName,
        mealDate,
        mealKind: body.mealKind,
        mealName: body.mealName || null,
        transferType: body.transferType,
        status: body.transferType === "send" ? "approved" : "pending",
        qrToken: randomBytes(32).toString("hex"),
      },
    });
    return res.status(201).json({ transfer: mealTransferForClient(transfer, req.auth!.userId) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/meal-transfers/:id/respond", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const { status } = z.object({ status: z.enum(["approved", "rejected"]) }).parse(req.body);
    const transfer = await prisma.mealTransfer.findUnique({ where: { id } });
    if (!transfer) return res.status(404).json({ error: "Meal transfer not found." });
    if (transfer.receiverId !== req.auth!.userId) return res.status(403).json({ error: "Only the recipient can respond." });
    if (transfer.transferType !== "request" || transfer.status !== "pending") {
      return res.status(409).json({ error: "This transfer cannot be responded to." });
    }

    const updated = await prisma.mealTransfer.update({
      where: { id },
      data: { status, respondedAt: new Date() },
    });
    return res.json({ transfer: mealTransferForClient(updated, req.auth!.userId) });
  } catch (error) {
    next(error);
  }
});

app.post(
  "/api/meal-transfers/consume",
  requireAuth,
  requireRole(AppRole.council_member, AppRole.admin, AppRole.central_council),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { qrToken } = z.object({ qrToken: z.string().trim().min(32).max(191) }).parse(req.body);
      const transfer = await prisma.mealTransfer.findUnique({ where: { qrToken } });
      if (!transfer) return res.status(404).json({ error: "QR token is invalid." });
      if (transfer.status === "consumed") return res.status(409).json({ error: "QR token has already been consumed." });
      if (transfer.status !== "approved") return res.status(409).json({ error: "Meal transfer is not approved." });

      const today = new Date();
      const todayStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      if (transfer.mealDate < todayStart) {
        await prisma.mealTransfer.update({
          where: { id: transfer.id },
          data: { status: "expired" },
        });
        return res.status(409).json({ error: "QR token has expired." });
      }

      const consumed = await prisma.mealTransfer.updateMany({
        where: { id: transfer.id, status: "approved" },
        data: { status: "consumed", consumedAt: new Date(), consumedBy: req.auth!.userId },
      });
      if (consumed.count === 0) return res.status(409).json({ error: "Meal transfer status changed. Scan again." });

      return res.json({
        meal: transfer.mealName ?? (transfer.mealKind === "lunch" ? "ناهار" : "شام"),
        receiver: `${transfer.receiverLastName} (${transfer.receiverStudentCode})`,
        date: transfer.mealDate.toISOString().slice(0, 10),
      });
    } catch (error) {
      next(error);
    }
  },
);

const ticketInput = z.object({
  title: z.string().trim().min(1).max(500),
  description: z.string().trim().min(1).max(10_000),
  category: z.nativeEnum(TicketCategory),
  prioritySuggested: z.nativeEnum(TicketPriority).default(TicketPriority.medium),
  roomNo: z.string().trim().max(100).nullable().optional(),
  buildingId: z.string().min(1).nullable().optional(),
});

const ticketListSelect = {
  id: true, title: true, description: true, status: true, category: true,
  priorityFinal: true, prioritySuggested: true, roomNo: true, buildingId: true,
  createdBy: true, wardenId: true, assignedTo: true, slaDueAt: true,
  closedAt: true, satisfaction: true, satisfactionNote: true,
  createdAt: true, updatedAt: true,
} as const;

function hasAnyRole(roles: AppRole[], ...allowed: AppRole[]) {
  return roles.some((role) => allowed.includes(role));
}

function slaDueAt(priority: TicketPriority) {
  const hours: Record<TicketPriority, number> = {
    critical: 2,
    high: 12,
    medium: 48,
    low: 120,
  };
  return new Date(Date.now() + hours[priority] * 60 * 60 * 1000);
}

async function getTicketForUser(ticketId: string, req: AuthenticatedRequest) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket || !req.auth) return null;

  const { roles, userId } = req.auth;
  const allowed = ticket.createdBy === userId
    || ticket.assignedTo === userId
    || ticket.wardenId === userId
    || (ticket.wardenId === null && roles.includes(AppRole.warden))
    || hasAnyRole(roles, AppRole.admin, AppRole.central_council, AppRole.council_secretary)
    || (roles.includes(AppRole.warehouse)
      && await prisma.itemRequest.count({ where: { ticketId } }) > 0);
  return allowed ? ticket : null;
}

app.get("/api/tickets", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const status = z.nativeEnum(TicketStatus).optional().parse(req.query.status);
    const scope = z.enum(["warden", "services"]).optional().parse(req.query.scope);
    const { roles, userId } = req.auth!;
    if (scope === "warden" && !hasAnyRole(roles, AppRole.warden, AppRole.admin, AppRole.central_council)) {
      return res.status(403).json({ error: "Warden access is required." });
    }
    if (scope === "services" && !hasAnyRole(roles, AppRole.services, AppRole.admin, AppRole.central_council)) {
      return res.status(403).json({ error: "Services access is required." });
    }
    const where = scope === "warden"
      ? (hasAnyRole(roles, AppRole.admin, AppRole.central_council)
        ? (status ? { status } : undefined)
        : {
            ...(status ? { status } : {}),
            OR: [{ wardenId: userId }, { wardenId: null }],
          })
      : scope === "services"
        ? (hasAnyRole(roles, AppRole.admin, AppRole.central_council)
          ? (status ? { status } : undefined)
          : { ...(status ? { status } : {}), assignedTo: userId })
        : hasAnyRole(roles, AppRole.admin, AppRole.central_council, AppRole.council_secretary)
      ? (status ? { status } : undefined)
      : {
          ...(status ? { status } : {}),
          OR: [
            { createdBy: userId },
            { assignedTo: userId },
            { wardenId: userId },
            ...(roles.includes(AppRole.warehouse) ? [{ itemRequests: { some: {} } }] : []),
          ],
        };
    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      select: ticketListSelect,
    });
    return res.json({ tickets });
  } catch (error) {
    next(error);
  }
});

app.post("/api/tickets", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = ticketInput.parse(req.body);
    if (body.buildingId) {
      const building = await prisma.building.findUnique({ where: { id: body.buildingId }, select: { id: true } });
      if (!building) return res.status(400).json({ error: "Selected building does not exist." });
    }
    const warden = body.buildingId
      ? await prisma.userRole.findFirst({
          where: {
            role: AppRole.warden,
            user: { profile: { is: { residentBuildingId: body.buildingId } } },
          },
          select: { userId: true },
        })
      : null;
    const ticket = await prisma.ticket.create({
      data: {
        createdBy: req.auth!.userId,
        title: body.title,
        description: body.description,
        category: body.category,
        prioritySuggested: body.prioritySuggested,
        roomNo: body.roomNo || null,
        buildingId: body.buildingId || null,
        status: TicketStatus.pending_warden,
        wardenId: warden?.userId ?? null,
        slaDueAt: slaDueAt(body.prioritySuggested),
      },
    });
    await prisma.ticketEvent.create({
      data: { ticketId: ticket.id, actorId: req.auth!.userId, action: "created", toStatus: ticket.status },
    });
    if (ticket.wardenId) {
      await prisma.notification.create({
        data: {
          userId: ticket.wardenId,
          ticketId: ticket.id,
          title: "تیکت جدید",
          body: ticket.title,
          link: "/warden/tickets",
        },
      });
    }
    return res.status(201).json({ ticket });
  } catch (error) {
    next(error);
  }
});

app.get("/api/tickets/:id", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    const ticket = await getTicketForUser(id, req);
    if (!ticket) return res.status(404).json({ error: "Ticket not found." });

    const canReadInternalComments = hasAnyRole(
      req.auth!.roles,
      AppRole.admin,
      AppRole.central_council,
      AppRole.warden,
      AppRole.services,
    );
    const [events, comments, schedules, itemRequests, attachments] = await Promise.all([
      prisma.ticketEvent.findMany({ where: { ticketId: id }, orderBy: { createdAt: "asc" } }),
      prisma.ticketComment.findMany({
        where: {
          ticketId: id,
          OR: [
            { isInternal: false },
            { userId: req.auth!.userId },
            ...(canReadInternalComments ? [{ isInternal: true }] : []),
          ],
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.ticketSchedule.findMany({ where: { ticketId: id }, orderBy: { createdAt: "asc" } }),
      prisma.itemRequest.findMany({ where: { ticketId: id }, orderBy: { createdAt: "asc" } }),
      prisma.ticketAttachment.findMany({
        where: { ticketId: id },
        select: { id: true, filePath: true, mimeType: true, sizeBytes: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);
    return res.json({ ticket, events, comments, schedules, itemRequests, attachments });
  } catch (error) {
    next(error);
  }
});

app.post("/api/tickets/:id/attachments", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    const ticket = await getTicketForUser(id, req);
    if (!ticket) return res.status(404).json({ error: "Ticket not found." });
    const body = attachmentInput.parse(req.body);
    const buffer = Buffer.from(body.data, "base64");
    if (buffer.length !== body.sizeBytes || buffer.length > MAX_ATTACHMENT_BYTES) {
      return res.status(400).json({ error: "Invalid attachment size." });
    }
    const safeName = body.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const attachment = await prisma.ticketAttachment.create({
      data: {
        ticketId: id,
        userId: req.auth!.userId,
        filePath: `${req.auth!.userId}/${id}/${safeName}`,
        mimeType: body.mimeType ?? null,
        sizeBytes: buffer.length,
        data: buffer,
      },
    });
    return res.status(201).json({ attachment: { id: attachment.id, fileName: safeName, mimeType: attachment.mimeType, sizeBytes: attachment.sizeBytes } });
  } catch (error) {
    next(error);
  }
});

app.get("/api/ticket-attachments/:id", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    const attachment = await prisma.ticketAttachment.findUnique({ where: { id } });
    if (!attachment || !await getTicketForUser(attachment.ticketId, req)) return res.status(404).json({ error: "Attachment not found." });
    if (!attachment.data) return res.status(404).json({ error: "Attachment file is missing." });
    const buffer = Buffer.from(attachment.data);
    res.setHeader("Content-Type", attachment.mimeType ?? "application/octet-stream");
    res.setHeader("Content-Length", buffer.length);
    return res.send(buffer);
  } catch (error) {
    next(error);
  }
});

app.patch("/api/tickets/:id", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    const current = await getTicketForUser(id, req);
    if (!current) return res.status(404).json({ error: "Ticket not found." });
    const hasItemRequest = req.auth!.roles.includes(AppRole.warehouse)
      ? await prisma.itemRequest.count({ where: { ticketId: id } }) > 0
      : false;
    const canUpdate = current.createdBy === req.auth!.userId
      || current.assignedTo === req.auth!.userId
      || current.wardenId === req.auth!.userId
      || hasAnyRole(req.auth!.roles, AppRole.admin, AppRole.central_council, AppRole.warden)
      || hasItemRequest;
    if (!canUpdate) return res.status(403).json({ error: "You do not have permission to update this ticket." });

    const body = z.object({
      status: z.nativeEnum(TicketStatus).optional(),
      priorityFinal: z.nativeEnum(TicketPriority).nullable().optional(),
      assignedTo: z.string().min(1).nullable().optional(),
      wardenId: z.string().min(1).nullable().optional(),
      satisfaction: z.number().int().min(1).max(5).nullable().optional(),
      satisfactionNote: z.string().max(2000).nullable().optional(),
      closedAt: z.coerce.date().nullable().optional(),
      reopenCount: z.number().int().min(0).optional(),
    }).parse(req.body);
    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        status: body.status,
        priorityFinal: body.priorityFinal,
        assignedTo: body.assignedTo,
        wardenId: body.wardenId,
        satisfaction: body.satisfaction,
        satisfactionNote: body.satisfactionNote,
        closedAt: body.closedAt,
        reopenCount: body.reopenCount,
      },
    });
    if (body.status && body.status !== current.status) {
      await prisma.ticketEvent.create({
        data: {
          ticketId: id,
          actorId: req.auth!.userId,
          action: "status_changed",
          fromStatus: current.status,
          toStatus: body.status,
        },
      });
      if (body.status === TicketStatus.items_ready) {
        const recipientIds = [...new Set(
          [ticket.assignedTo, ticket.createdBy]
            .filter((id): id is string => Boolean(id) && id !== req.auth!.userId),
        )];
        if (recipientIds.length) {
          await prisma.notification.createMany({
            data: recipientIds.map((userId) => ({
              userId,
              ticketId: ticket.id,
              title: "اقلام تیکت آماده شد",
              body: ticket.title,
              link: `/tickets?ticket=${ticket.id}`,
            })),
          });
        }
      }
    }
    return res.json({ ticket });
  } catch (error) {
    next(error);
  }
});

app.delete(
  "/api/tickets/:id",
  requireAuth,
  requireRole(AppRole.admin, AppRole.central_council),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const id = z.string().min(1).parse(req.params.id);
      await prisma.ticket.delete({ where: { id } });
      return res.status(204).end();
    } catch (error) {
      next(error);
    }
  },
);

app.post("/api/tickets/:id/comments", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    if (!await getTicketForUser(id, req)) return res.status(404).json({ error: "Ticket not found." });
    const body = z.object({
      body: z.string().trim().min(1).max(5000),
      isInternal: z.boolean().default(false),
    }).parse(req.body);
    if (body.isInternal && !hasAnyRole(req.auth!.roles, AppRole.admin, AppRole.central_council, AppRole.warden, AppRole.services)) {
      return res.status(403).json({ error: "Internal comments require a staff role." });
    }
    const comment = await prisma.ticketComment.create({
      data: { ticketId: id, userId: req.auth!.userId, body: body.body, isInternal: body.isInternal },
    });
    return res.status(201).json({ comment });
  } catch (error) {
    next(error);
  }
});

app.post("/api/tickets/:id/schedules", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    if (!await getTicketForUser(id, req)) return res.status(404).json({ error: "Ticket not found." });
    const body = z.object({
      proposedAt: z.coerce.date(),
      studentConfirmed: z.boolean().nullable().optional(),
    }).parse(req.body);
    const schedule = await prisma.ticketSchedule.create({
      data: {
        ticketId: id,
        proposedBy: req.auth!.userId,
        proposedAt: body.proposedAt,
        studentConfirmed: body.studentConfirmed ?? null,
      },
    });
    return res.status(201).json({ schedule });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/ticket-schedules/:id", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    const schedule = await prisma.ticketSchedule.findUnique({ where: { id }, select: { ticketId: true } });
    if (!schedule || !await getTicketForUser(schedule.ticketId, req)) {
      return res.status(404).json({ error: "Schedule not found." });
    }
    const body = z.object({ studentConfirmed: z.boolean() }).parse(req.body);
    const updated = await prisma.ticketSchedule.update({
      where: { id },
      data: {
        studentConfirmed: body.studentConfirmed,
        confirmedAt: body.studentConfirmed ? new Date() : null,
      },
    });
    return res.json({ schedule: updated });
  } catch (error) {
    next(error);
  }
});

app.get(
  "/api/ticket-assignees",
  requireAuth,
  requireRole(AppRole.warden, AppRole.admin, AppRole.central_council),
  async (_req, res, next) => {
    try {
      const roles = await prisma.userRole.findMany({
        where: { role: AppRole.services },
        select: {
          userId: true,
          user: { select: { profile: { select: { firstName: true, lastName: true } } } },
        },
      });
      return res.json({
        users: roles.map(({ userId, user }) => ({
          id: userId,
          name: `${user.profile?.firstName ?? ""} ${user.profile?.lastName ?? ""}`.trim() || "بدون نام",
        })),
      });
    } catch (error) {
      next(error);
    }
  },
);

app.post(
  "/api/tickets/:id/item-requests",
  requireAuth,
  requireRole(AppRole.warden, AppRole.services, AppRole.admin, AppRole.central_council),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const id = z.string().min(1).parse(req.params.id);
      if (!await prisma.ticket.findUnique({ where: { id }, select: { id: true } })) {
        return res.status(404).json({ error: "Ticket not found." });
      }
      const body = z.object({
        items: z.array(z.record(z.string(), z.unknown())).min(1),
        notes: z.string().max(2000).nullable().optional(),
      }).parse(req.body);
      const itemRequest = await prisma.itemRequest.create({
        data: {
          ticketId: id,
          requestedBy: req.auth!.userId,
          items: body.items as Prisma.InputJsonValue,
          notes: body.notes ?? null,
        },
      });
      return res.status(201).json({ itemRequest });
    } catch (error) {
      next(error);
    }
  },
);

app.patch("/api/item-requests/:id", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    const existing = await prisma.itemRequest.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Item request not found." });
    const canUpdate = existing.requestedBy === req.auth!.userId
      || hasAnyRole(req.auth!.roles, AppRole.warehouse, AppRole.admin, AppRole.central_council);
    if (!canUpdate) return res.status(403).json({ error: "You do not have permission to update this item request." });

    const body = z.object({ status: z.nativeEnum(ItemRequestStatus) }).parse(req.body);
    const itemRequest = await prisma.itemRequest.update({
      where: { id },
      data: {
        status: body.status,
        fulfilledBy: body.status === ItemRequestStatus.fulfilled ? req.auth!.userId : null,
        fulfilledAt: body.status === ItemRequestStatus.fulfilled ? new Date() : null,
      },
    });
    if (body.status === ItemRequestStatus.fulfilled) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: existing.ticketId },
        select: { id: true, title: true, status: true, assignedTo: true, createdBy: true },
      });
      if (ticket && ticket.status !== TicketStatus.items_ready && ticket.status !== TicketStatus.completed && ticket.status !== TicketStatus.closed) {
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { status: TicketStatus.items_ready },
        });
        await prisma.ticketEvent.create({
          data: {
            ticketId: ticket.id,
            actorId: req.auth!.userId,
            action: "status_changed",
            fromStatus: ticket.status,
            toStatus: TicketStatus.items_ready,
          },
        });
        const recipientIds = [...new Set(
          [ticket.assignedTo, ticket.createdBy]
            .filter((userId): userId is string => Boolean(userId) && userId !== req.auth!.userId),
        )];
        if (recipientIds.length) {
          await prisma.notification.createMany({
            data: recipientIds.map((userId) => ({
              userId,
              ticketId: ticket.id,
              title: "اقلام تیکت آماده شد",
              body: ticket.title,
              link: `/tickets?ticket=${ticket.id}`,
            })),
          });
        }
      }
    }
    return res.json({ itemRequest });
  } catch (error) {
    next(error);
  }
});

app.get("/api/item-requests", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!hasAnyRole(req.auth!.roles, AppRole.warehouse, AppRole.admin, AppRole.central_council)) {
      return res.status(403).json({ error: "Warehouse access is required." });
    }
    const status = z.nativeEnum(ItemRequestStatus).optional().parse(req.query.status);
    if (hasAnyRole(req.auth!.roles, AppRole.warehouse, AppRole.admin, AppRole.central_council)) {
      const fulfilledRequests = await prisma.itemRequest.findMany({
        where: { status: ItemRequestStatus.fulfilled },
        select: { ticketId: true },
      });
      const ticketIds = [...new Set(fulfilledRequests.map(({ ticketId }) => ticketId))];
      if (ticketIds.length) {
        await prisma.ticket.updateMany({
          where: {
            id: { in: ticketIds },
            status: { in: [TicketStatus.items_requested, TicketStatus.needs_items] },
          },
          data: { status: TicketStatus.items_ready },
        });
      }
    }
    const itemRequests = await prisma.itemRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      include: { ticket: { select: { id: true, title: true, roomNo: true, buildingId: true } } },
      take: 200,
    });
    return res.json({ itemRequests });
  } catch (error) {
    next(error);
  }
});

const complaintCreateInput = z.object({
  kind: z.nativeEnum(ComplaintKind),
  title: z.string().trim().min(1).max(500),
  body: z.string().trim().min(1).max(10_000),
  isAnonymous: z.boolean().default(false),
});
const complaintUpdateInput = z.object({
  status: z.nativeEnum(ComplaintStatus).optional(),
  resolution: z.string().trim().max(10_000).nullable().optional(),
}).strict();

app.post("/api/complaints", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = complaintCreateInput.parse(req.body);
    const complaint = await prisma.complaint.create({
      data: { kind: body.kind, title: body.title, body: body.body, isAnonymous: body.isAnonymous, createdBy: body.isAnonymous ? null : req.auth!.userId },
    });
    const secretaries = await prisma.userRole.findMany({ where: { role: AppRole.council_secretary }, select: { userId: true } });
    if (secretaries.length) {
      await prisma.notification.createMany({
        data: secretaries.map(({ userId }) => ({ userId, title: "شکایت/پیشنهاد جدید", body: complaint.title, link: "/secretary/complaints" })),
      });
    }
    return res.status(201).json({ complaint });
  } catch (error) { next(error); }
});

app.get("/api/complaints", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const scope = z.enum(["secretary"]).optional().parse(req.query.scope);
    const privileged = hasAnyRole(req.auth!.roles, AppRole.council_secretary, AppRole.admin, AppRole.central_council);
    if (scope === "secretary" && !privileged) return res.status(403).json({ error: "Secretary access is required." });
    const complaints = await prisma.complaint.findMany({
      where: scope === "secretary" ? undefined : { createdBy: req.auth!.userId },
      orderBy: { createdAt: "desc" }, take: 200,
    });
    return res.json({ complaints });
  } catch (error) { next(error); }
});

app.patch("/api/complaints/:id", requireAuth, requireRole(AppRole.council_secretary, AppRole.admin, AppRole.central_council), async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    const body = complaintUpdateInput.parse(req.body);
    if (body.status === undefined && body.resolution === undefined) return res.status(400).json({ error: "At least one complaint field is required." });
    const complaint = await prisma.complaint.update({ where: { id }, data: { status: body.status, resolution: body.resolution } });
    return res.json({ complaint });
  } catch (error) { next(error); }
});

const kbInput = z.object({
  title: z.string().trim().min(1).max(500),
  category: z.enum(["facilities", "services", "safety", "admin"]).default("facilities"),
  content: z.string().trim().min(1).max(50_000),
  tags: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
  published: z.boolean().default(true),
}).strict();

app.get("/api/kb", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const privileged = hasAnyRole(req.auth!.roles, AppRole.admin, AppRole.central_council);
    const articles = await prisma.kbArticle.findMany({ where: privileged ? undefined : { published: true }, orderBy: { createdAt: "desc" }, take: 200 });
    return res.json({ articles });
  } catch (error) { next(error); }
});

app.post("/api/kb", requireAuth, requireRole(AppRole.admin, AppRole.central_council), async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = kbInput.parse(req.body);
    const article = await prisma.kbArticle.create({
      data: {
        title: body.title,
        category: body.category,
        content: body.content,
        tags: body.tags,
        published: body.published,
        authorId: req.auth!.userId,
      },
    });
    return res.status(201).json({ article });
  } catch (error) { next(error); }
});

app.delete("/api/kb/:id", requireAuth, requireRole(AppRole.admin, AppRole.central_council), async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    await prisma.kbArticle.delete({ where: { id } });
    return res.status(204).end();
  } catch (error) { next(error); }
});

const qcScores = z.record(z.string().min(1).max(100), z.number().int().min(1).max(5));
const qcInspectionInput = z.object({
  buildingId: z.string().min(1).nullable().optional(),
  locationType: z.enum(["cafeteria", "dorm", "classroom", "restroom"]),
  locationValue: z.string().trim().min(1).max(500),
  scores: qcScores,
  overallRating: z.number().int().min(1).max(5),
  notes: z.string().trim().max(10_000).nullable().optional(),
  photoPath: z.string().trim().max(2_000).nullable().optional(),
}).strict();
const facultyInspectionInput = z.object({
  facultyId: z.string().min(1).max(191),
  inspectionType: z.enum(["classroom", "hallway", "restroom"]),
  locationValue: z.string().trim().min(1).max(500),
  results: z.record(z.string().min(1), z.enum(["ok", "notok"])),
  details: z.record(z.string(), z.string().max(10_000)),
  customItems: z.array(z.object({ id: z.string().min(1), label: z.string().trim().min(1).max(500) })).max(100),
}).strict();
const dormRoomChecklist = ["beds", "closet", "lighting", "cooling", "heating", "sockets", "window", "internet", "cleanliness"];
const dormRoomInspectionInput = facultyInspectionInput.extend({ inspectionType: z.literal("room") }).superRefine((body, context) => {
  const ids = [...dormRoomChecklist, ...body.customItems.map((item) => item.id)];
  if (new Set(ids).size !== ids.length || Object.keys(body.results).some((id) => !ids.includes(id))) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid checklist items." });
  }
  for (const id of ids) {
    if (!body.results[id] || (body.results[id] === "notok" && !body.details[id]?.trim())) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: `Complete checklist item: ${id}` });
    }
  }
});

app.get("/api/qc/inspections", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const privileged = hasAnyRole(req.auth!.roles, AppRole.council_member, AppRole.central_council, AppRole.admin);
    const where = privileged ? undefined : { userId: req.auth!.userId };
    const [inspections, facultyInspections] = await Promise.all([
      prisma.qcInspection.findMany({ where, include: { building: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" }, take: 200 }),
      prisma.facultyInspection.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 }),
    ]);
    return res.json({ inspections, facultyInspections });
  } catch (error) { next(error); }
});

app.post("/api/qc/inspections", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (req.body?.inspectionType === "room" && req.body?.facultyId) {
      if (!hasAnyRole(req.auth!.roles, AppRole.admin, AppRole.council_member, AppRole.central_council)) {
        return res.status(403).json({ error: "You do not have permission to perform this action." });
      }
      const body = dormRoomInspectionInput.parse(req.body);
      const room = await prisma.dormRoom.findFirst({
        where: { buildingId: body.facultyId, number: body.locationValue, building: { kind: BuildingKind.dorm } },
        select: { id: true },
      });
      if (!room) return res.status(404).json({ error: "Room not found. Register the room first." });
      const inspection = await prisma.dormRoomInspection.create({
        data: { roomId: room.id, userId: req.auth!.userId, results: body.results, details: body.details, customItems: body.customItems },
      });
      return res.status(201).json({ inspection });
    }
    if (req.body && typeof req.body === "object" && "facultyId" in req.body) {
      const body = facultyInspectionInput.parse(req.body);
      const inspection = await prisma.facultyInspection.create({
        data: {
          userId: req.auth!.userId,
          facultyId: body.facultyId,
          inspectionType: body.inspectionType,
          locationValue: body.locationValue,
          results: body.results,
          details: body.details,
          customItems: body.customItems,
        },
      });
      return res.status(201).json({ inspection });
    }
    const body = qcInspectionInput.parse(req.body);
    if (body.buildingId) {
      const building = await prisma.building.findUnique({ where: { id: body.buildingId }, select: { id: true } });
      if (!building) return res.status(400).json({ error: "Building not found." });
    }
    const inspection = await prisma.qcInspection.create({
      data: {
        userId: req.auth!.userId,
        buildingId: body.buildingId ?? null,
        locationType: body.locationType,
        locationValue: body.locationValue,
        scores: body.scores,
        overallRating: body.overallRating,
        notes: body.notes ?? null,
        photoPath: body.photoPath ?? null,
      },
    });
    return res.status(201).json({ inspection });
  } catch (error) { next(error); }
});

app.get("/api/qc/inspections/:id", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    const inspection = await prisma.qcInspection.findUnique({ where: { id }, include: { building: { select: { id: true, name: true } } } });
    if (!inspection) return res.status(404).json({ error: "Inspection not found." });
    const privileged = hasAnyRole(req.auth!.roles, AppRole.council_member, AppRole.central_council, AppRole.admin);
    if (!privileged && inspection.userId !== req.auth!.userId) return res.status(404).json({ error: "Inspection not found." });
    return res.json({ inspection });
  } catch (error) { next(error); }
});


app.patch("/api/profile/me", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = z.object({ residentBuildingId: z.string().uuid().nullable() }).parse(req.body);
    if (body.residentBuildingId) {
      const building = await prisma.building.findFirst({
        where: { id: body.residentBuildingId, kind: "dorm" },
        select: { id: true },
      });
      if (!building) return res.status(400).json({ error: "The selected building is not a dormitory." });
    }
    const profile = await prisma.profile.update({
      where: { id: req.auth!.userId },
      data: { residentBuildingId: body.residentBuildingId },
      select: { residentBuildingId: true },
    });
    return res.json({ profile });
  } catch (error) {
    next(error);
  }
});

app.get("/api/notifications", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.auth!.userId },
      select: { id: true, title: true, body: true, link: true, readAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return res.json({
      notifications: notifications.map((notification) => ({
        id: notification.id,
        title: notification.title,
        body: notification.body,
        link: notification.link,
        read_at: notification.readAt,
        created_at: notification.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/notifications/mark-all-read", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.auth!.userId, readAt: null },
      data: { readAt: new Date() },
    });
    return res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/overview", requireAuth, requireRole(AppRole.admin), async (req: AuthenticatedRequest, res, next) => {
  try {
    const [buildings, profiles, roleRows, users, transfers, lockers, qc] = await Promise.all([
      prisma.building.findMany({ orderBy: { name: "asc" } }),
      prisma.profile.findMany({
        select: { id: true, firstName: true, lastName: true, studentCode: true },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.userRole.findMany({ select: { userId: true, role: true } }),
      prisma.profile.count(),
      prisma.mealTransfer.count(),
      prisma.lockerReservation.count(),
      prisma.qcInspection.count(),
    ]);
    return res.json({
      buildings,
      profiles: profiles.map((profile) => ({
        id: profile.id,
        first_name: profile.firstName,
        last_name: profile.lastName,
        student_code: profile.studentCode,
      })),
      roles: roleRows.map((row) => ({ user_id: row.userId, role: row.role })),
      stats: { users, transfers, lockers, qc },
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/buildings", requireAuth, requireRole(AppRole.admin), async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = z.object({
      name: z.string().trim().min(1).max(191),
      kind: z.enum(["faculty", "dorm", "cafeteria", "other"]),
    }).parse(req.body) as { name: string; kind: BuildingKind };
    const building = await prisma.building.create({ data: { name: body.name, kind: body.kind } });
    return res.status(201).json({ building });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/users", requireAuth, requireRole(AppRole.admin), async (req, res, next) => {
  try {
    const body = z.object({
      email: z.string().trim().email().max(320),
      password: z.string().min(8).max(128),
      firstName: z.string().trim().min(1).max(120),
      lastName: z.string().trim().min(1).max(120),
      studentCode: z.string().trim().min(1).max(100),
      roles: z.array(z.nativeEnum(AppRole)).max(8).default([AppRole.student]),
    }).parse(req.body);
    const roles = [...new Set([AppRole.student, ...body.roles])];
    const user = await prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        passwordHash: await hashPassword(body.password),
        profile: {
          create: {
            firstName: body.firstName,
            lastName: body.lastName,
            studentCode: body.studentCode,
          },
        },
        roles: { create: roles.map((role) => ({ role })) },
      },
      select: authSelect,
    });
    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/buildings/:id", requireAuth, requireRole(AppRole.admin), async (req, res, next) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    await prisma.building.delete({ where: { id } });
    return res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/users/:userId/roles/:role", requireAuth, requireRole(AppRole.admin), async (req, res, next) => {
  try {
    const { userId, role } = z.object({ userId: z.string().uuid(), role: z.nativeEnum(AppRole) }).parse(req.params);
    const { enabled } = z.object({ enabled: z.boolean() }).parse(req.body);
    if (enabled) {
      await prisma.userRole.upsert({
        where: { userId_role: { userId, role } },
        update: {},
        create: { userId, role },
      });
    } else {
      await prisma.userRole.deleteMany({ where: { userId, role } });
    }
    return res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid request.", details: error.flatten() });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return res.status(409).json({ error: "A record with these unique values already exists." });
  }
  console.error(error);
  return res.status(500).json({ error: "Internal server error." });
});

if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
}
