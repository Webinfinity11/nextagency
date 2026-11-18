"use server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/login-limit";
import { notifyContact } from "@/lib/mail";
import { isLocale } from "@/content/locales";
// Contact form → stored as a Message, read at /admin/messages (per-IP limit, in memory).
export type SendResult = { ok: true } | { ok: false; error: "invalid" | "busy" | "failed" };
// 5 messages per IP per 10 minutes in production; looser locally so the form can be tried repeatedly.
const WINDOW = 10 * 60 * 1000, PER_IP = process.env.NODE_ENV === "production" ? 5 : 50;
const sent = new Map<string, number[]>();
export async function sendMessage(form: FormData): Promise<SendResult> {
  const v = (k: string, max: number) => String(form.get(k) ?? "").trim().slice(0, max);
  if (v("website", 200)) return { ok: true }; // honeypot: bots fill every field; pretend it worked
  const name = v("name", 120), email = v("email", 200), company = v("company", 160), body = v("message", 5000), locale = v("locale", 4);
  if (!name || !body || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "invalid" };
  const ip = clientIp(await headers()), now = Date.now();
  const recent = (sent.get(ip) ?? []).filter(t => t > now - WINDOW);
  if (recent.length >= PER_IP) return { ok: false, error: "busy" };
  sent.set(ip, [...recent, now]);
  if (sent.size > 5_000) for (const [k, list] of sent) if (!list.some(t => t > now - WINDOW)) sent.delete(k);
  try {
    const loc = isLocale(locale) ? locale : "ka";
    await db.message.create({ data: { name, email, company, body, locale: loc } });
    await notifyContact({ name, email, company, body, locale: loc }); // never throws; the message is already saved
    return { ok: true };
  } catch (e) {
    console.error("contact message not saved", e);
    return { ok: false, error: "failed" };
  }
}
