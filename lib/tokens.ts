import { createHash, randomBytes, randomInt } from "node:crypto";

export function generateInviteToken() {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateOneTimeCode(length = 6) {
  const max = 10 ** length;
  return randomInt(0, max).toString().padStart(length, "0");
}
