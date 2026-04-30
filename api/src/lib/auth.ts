import type { User } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

type AuthTokenPayload = {
  userId: string;
  email: string;
  role: string;
};

function getJwtSecret() {
  return process.env.JWT_SECRET ?? "dev-fablab-secret";
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function createAuthToken(user: User) {
  const payload: AuthTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
}

export function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    profileCompleted: user.profileCompleted,
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
    maternalLastName: user.maternalLastName,
    documentType: user.documentType,
    documentNumber: user.documentNumber,
    career: user.career,
    entryYear: user.entryYear,
    birthDate: user.birthDate,
    sex: user.sex
  };
}

export function buildDisplayName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

