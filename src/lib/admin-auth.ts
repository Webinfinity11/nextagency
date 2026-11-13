import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
// One admin, credentials from env (ADMIN_EMAIL / ADMIN_PASSWORD). The session is "<expiry>.<hmac>" in an httpOnly cookie.
const COOKIE = "na_admin";
const MAX_AGE = 60 * 60 * 24 * 7;
const secret = () => {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set (32+ characters)");
  return s;
};
const sign = (value: string) => createHmac("sha256", secret()).update(value).digest("hex");
const same = (a: string, b: string) => timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
export function checkCredentials(email: string, password: string) {
  const e = process.env.ADMIN_EMAIL, p = process.env.ADMIN_PASSWORD;
  if (!e || !p) return false;
  // Evaluate both so a wrong email takes as long as a wrong password.
  const ok = [same(email.trim().toLowerCase(), e.trim().toLowerCase()), same(password, p)];
  return ok[0] && ok[1];
}
export async function startSession() {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  (await cookies()).set(COOKIE, `${exp}.${sign(exp)}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: MAX_AGE });
}
export async function endSession() { (await cookies()).delete(COOKIE); }
export async function isAdmin() {
  const [exp, mac] = ((await cookies()).get(COOKIE)?.value ?? "").split(".");
  if (!exp || !mac || Number(exp) < Date.now() / 1000) return false;
  return same(mac, sign(exp));
}
/** Every admin page, action and route calls this first. */
export async function requireAdmin() { if (!(await isAdmin())) redirect("/admin/login"); }
