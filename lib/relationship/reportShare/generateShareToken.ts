import { randomBytes } from "node:crypto";

/** Opaque, unguessable share token — not a JWT, carries no data of its own. */
export function generateShareToken(): string {
  return randomBytes(24).toString("base64url");
}
