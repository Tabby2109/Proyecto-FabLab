import crypto from "node:crypto";

export function createPasswordResetToken() {
  return crypto.randomBytes(24).toString("hex");
}

export function hashPasswordResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
