import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppRole, PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET must be set in production.");
}
const secret = jwtSecret ?? "development-only-change-me-before-production";
const cookieName = process.env.AUTH_COOKIE_NAME ?? "senfi_session";

export type AuthenticatedRequest = Request & {
  auth?: { userId: string; roles: AppRole[]; publicDormTest?: boolean };
};

export const publicDormTestUserId = "00000000-0000-4000-8000-000000000001";
export const publicDormTestEmail = "public-dorm-test@invalid.example";

export function publicUser(user: {
  id: string;
  email: string;
  profile: { firstName: string | null; lastName: string | null; studentCode: string | null } | null;
  roles: { role: AppRole }[];
}) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.profile?.firstName ?? null,
    lastName: user.profile?.lastName ?? null,
    studentCode: user.profile?.studentCode ?? null,
    roles: user.roles.map(({ role }) => role),
  };
}

export function issueSession(res: Response, userId: string, roles: AppRole[]) {
  const token = jwt.sign({ sub: userId, roles }, secret, { expiresIn: "8h" });
  res.cookie(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearSession(res: Response) {
  res.clearCookie(cookieName, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.[cookieName];
  if (process.env.PUBLIC_TEST_MODE === "true") {
    try {
      const user = await prisma.user.upsert({
        where: { id: publicDormTestUserId },
        create: { id: publicDormTestUserId, email: publicDormTestEmail, passwordHash: "!public-test-login-disabled!" },
        update: {},
        select: { email: true },
      });
      if (user.email !== publicDormTestEmail) return res.status(409).json({ error: "Test user ID is already in use." });
      req.auth = { userId: publicDormTestUserId, roles: [AppRole.admin], publicDormTest: true };
      return next();
    } catch (error) {
      return next(error);
    }
  }
  if (!token) return res.status(401).json({ error: "Authentication required." });

  try {
    const payload = jwt.verify(token, secret) as jwt.JwtPayload;
    if (!payload.sub || typeof payload.sub !== "string") throw new Error("Invalid token subject.");
    const roles = await prisma.userRole.findMany({
      where: { userId: payload.sub },
      select: { role: true },
    });
    req.auth = { userId: payload.sub, roles: roles.map(({ role }) => role) };
    next();
  } catch {
    clearSession(res);
    return res.status(401).json({ error: "Invalid or expired session." });
  }
}

export function requireRole(...allowed: AppRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.auth) return res.status(401).json({ error: "Authentication required." });
    if (req.auth.roles.some((role) => allowed.includes(role))) return next();
    return res.status(403).json({ error: "You do not have permission to perform this action." });
  };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}
