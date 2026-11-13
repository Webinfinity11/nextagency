import "server-only";
// Failed admin logins per IP and in total, over a 15-minute window (counts reset on restart). In memory: fine for the single
// Railway instance this site runs on; move it to the database if the app ever scales out.
const WINDOW = 15 * 60 * 1000, PER_IP = 5, TOTAL = 50;
const fails = new Map<string, number[]>();
const recent = (key: string) => (fails.get(key) ?? []).filter(t => t > Date.now() - WINDOW);
export function loginBlocked(ip: string) { return recent(ip).length >= PER_IP || recent("*").length >= TOTAL; }
export function recordFailure(ip: string) {
  for (const key of [ip, "*"]) fails.set(key, [...recent(key), Date.now()]);
  if (fails.size > 10_000) fails.clear();
}
export function clearFailures(ip: string) { fails.delete(ip); }
