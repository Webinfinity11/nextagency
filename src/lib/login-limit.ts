import "server-only";
// Failed admin logins per client IP over a 15-minute window (counts reset on restart).  In memory: fine for
// the single Railway instance; move it to the database if the app ever scales out. There is deliberately no
// global lockout — anyone could use it to lock the owner out. The long ADMIN_PASSWORD is the real defence.
const WINDOW = 15 * 60 * 1000, PER_IP = 5;
const fails = new Map<string, number[]>();
const recent = (ip: string) => (fails.get(ip) ?? []).filter(t => t > Date.now() - WINDOW);
export function loginBlocked(ip: string) { return recent(ip).length >= PER_IP; }
export function recordFailure(ip: string) {
  fails.set(ip, [...recent(ip), Date.now()]);
  if (fails.size > 5_000) for (const key of fails.keys()) if (!recent(key).length) fails.delete(key);
}
export function clearFailures(ip: string) { fails.delete(ip); }
/** Railway's proxy appends the real client address last; earlier X-Forwarded-For entries are client-supplied. */
export function clientIp(h: Headers) {
  return h.get("x-forwarded-for")?.split(",").at(-1)?.trim() || h.get("x-real-ip") || "unknown";
}
