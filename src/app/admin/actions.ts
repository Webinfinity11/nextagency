"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { clearFailures, clientIp, loginBlocked, recordFailure } from "@/lib/login-limit";
import { db } from "@/lib/db";
import { checkCredentials, endSession, requireAdmin, startSession } from "@/lib/admin-auth";
import type { Block } from "@/content/projects";

export type FormState = { error?: string; email?: string } | undefined;

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "");
  const ip = clientIp(await headers());
  if (loginBlocked(ip)) return { error: "ძალიან ბევრი წარუმატებელი ცდა. სცადე 15 წუთში.", email };
  if (!checkCredentials(email, String(form.get("password") ?? ""))) {
    recordFailure(ip);
    await new Promise(r => setTimeout(r, 800));
    return { error: "ელფოსტა ან პაროლი არასწორია.", email }; // React resets the form; keep the email
  }
  clearFailures(ip);
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX = /^#[0-9a-f]{6}$/i;
const isMedia = (v: unknown): v is string => typeof v === "string" && /^\/media\/[\w./-]+$/.test(v) && !v.includes("..");
const aspectOf = (v: unknown) => { const n = Number(v); return Number.isFinite(n) && n > 0.1 && n < 10 ? n : 1.5; };
const isVideo = (src: string) => /\.(mp4|webm|mov)$/i.test(src);
const tagList = (v: string) => v.split(",").map(t => t.trim()).filter(Boolean).slice(0, 8);

function parseBlocks(raw: string): Block[] {
  let list: unknown;
  try { list = JSON.parse(raw || "[]"); } catch { return []; }
  if (!Array.isArray(list)) return [];
  return list.flatMap((b): Block[] => {
    const bg = HEX.test(String(b?.bg ?? "")) ? String(b.bg) : undefined;
    if (b?.kind === "text") {
      const ka = String(b.ka ?? "").trim(), en = String(b.en ?? "").trim();
      return ka || en ? [{ kind: "text", ka, en, bg }] : [];
    }
    if (isMedia(b?.src)) {
      return [{ kind: isVideo(b.src) ? "video" : "image", src: b.src, poster: isMedia(b.poster) ? b.poster : undefined, aspect: aspectOf(b.aspect), wide: !!b.wide, bg }];
    }
    return [];
  });
}

export async function saveProject(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  const text = (k: string) => String(form.get(k) ?? "").trim();
  const slug = text("slug").toLowerCase();
  const year = Number(text("year"));
  const category = text("category");
  if (!text("titleKa") || !text("titleEn")) return { error: "სათაური ორივე ენაზე სავალდებულოა." };
  if (!SLUG.test(slug)) return { error: "ბმული (slug) მხოლოდ ლათინური პატარა ასოებით, ციფრებით და ტირეებით." };
  if (!Number.isInteger(year) || year < 1990 || year > 2100) return { error: "წელი არასწორია." };
  if (category !== "identity" && category !== "digital") return { error: "აირჩიე კატეგორია." };
  if (text("websiteUrl") && !/^https?:\/\/\S+$/i.test(text("websiteUrl"))) return { error: "საიტის ბმული უნდა იწყებოდეს https://-ით." };
  const taken = await db.project.findUnique({ where: { slug }, select: { id: true } });
  if (taken && taken.id !== id) return { error: `ბმული „${slug}“ უკვე სხვა პროექტს აქვს.` };

  const coverSrc = isMedia(form.get("coverSrc")) ? text("coverSrc") : null;
  const data = {
    slug, year, category: category as "identity" | "digital",
    titleKa: text("titleKa"), titleEn: text("titleEn"),
    summaryKa: text("summaryKa"), summaryEn: text("summaryEn"),
    introKa: text("introKa"), introEn: text("introEn"),
    headlineKa: text("headlineKa"), headlineEn: text("headlineEn"),
    tagsKa: tagList(text("tagsKa")), tagsEn: tagList(text("tagsEn")),
    clientKa: text("clientKa"), clientEn: text("clientEn"),
    servicesKa: text("servicesKa"), servicesEn: text("servicesEn"),
    teamKa: text("teamKa"), teamEn: text("teamEn"),
    websiteUrl: /^https?:\/\/\S+$/i.test(text("websiteUrl")) ? text("websiteUrl") : null,
    accent: HEX.test(text("accent")) ? text("accent") : "#1d1d1d",
    published: form.get("published") === "on",
    coverKind: coverSrc ? (isVideo(coverSrc) ? "video" as const : "image" as const) : "gradient" as const,
    coverSrc, coverPoster: coverSrc && isVideo(coverSrc) && isMedia(form.get("coverPoster")) ? text("coverPoster") : null,
    coverAspect: aspectOf(form.get("coverAspect")),
    toneA: HEX.test(text("toneA")) ? text("toneA") : "#d9d9d9",
    toneB: HEX.test(text("toneB")) ? text("toneB") : "#8a8a8a",
    blocks: parseBlocks(text("blocks")),
  };
  if (id) await db.project.update({ where: { id }, data });
  else {
    const last = await db.project.aggregate({ _max: { order: true } });
    await db.project.create({ data: { ...data, order: (last._max.order ?? 0) + 1 } });
  }
  redirect("/admin?saved=1");
}

export async function deleteProject(form: FormData) {
  await requireAdmin();
  await db.project.delete({ where: { id: String(form.get("id")) } });
  redirect("/admin");
}

export async function togglePublished(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const p = await db.project.findUniqueOrThrow({ where: { id }, select: { published: true } });
  await db.project.update({ where: { id }, data: { published: !p.published } });
  redirect("/admin");
}

/** Swaps a project with its neighbour in the list (dir = -1 up, 1 down) and renumbers 1…n. */
export async function moveProject(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id")), dir = Number(form.get("dir"));
  const list = await db.project.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }], select: { id: true } });
  const i = list.findIndex(p => p.id === id), j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) redirect("/admin");
  [list[i], list[j]] = [list[j], list[i]];
  await db.$transaction(list.map((p, k) => db.project.update({ where: { id: p.id }, data: { order: k + 1 } })));
  redirect("/admin");
}

export async function toggleMessageRead(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const m = await db.message.findUniqueOrThrow({ where: { id }, select: { read: true } });
  await db.message.update({ where: { id }, data: { read: !m.read } });
  redirect("/admin/messages");
}

export async function deleteMessage(form: FormData) {
  await requireAdmin();
  await db.message.delete({ where: { id: String(form.get("id")) } });
  redirect("/admin/messages");
}

export async function savePost(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  const text = (k: string) => String(form.get(k) ?? "").trim();
  const slug = text("slug").toLowerCase();
  if (!text("titleKa") || !text("titleEn")) return { error: "სათაური ორივე ენაზე სავალდებულოა." };
  if (!SLUG.test(slug)) return { error: "ბმული (slug) მხოლოდ ლათინური პატარა ასოებით, ციფრებით და ტირეებით." };
  const date = new Date(text("publishedAt"));
  if (Number.isNaN(date.getTime())) return { error: "თარიღი არასწორია." };
  const taken = await db.post.findUnique({ where: { slug }, select: { id: true } });
  if (taken && taken.id !== id) return { error: `ბმული „${slug}“ უკვე სხვა სტატიას აქვს.` };
  const data = {
    slug, titleKa: text("titleKa"), titleEn: text("titleEn"), excerptKa: text("excerptKa"), excerptEn: text("excerptEn"),
    bodyKa: text("bodyKa"), bodyEn: text("bodyEn"), publishedAt: date, published: form.get("published") === "on",
    coverSrc: isMedia(form.get("coverSrc")) && !isVideo(text("coverSrc")) ? text("coverSrc") : null, coverAspect: aspectOf(form.get("coverAspect")),
  };
  if (id) await db.post.update({ where: { id }, data }); else await db.post.create({ data });
  redirect("/admin/posts?saved=1");
}

export async function deletePost(form: FormData) {
  await requireAdmin();
  await db.post.delete({ where: { id: String(form.get("id")) } });
  redirect("/admin/posts");
}

export async function togglePostPublished(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const p = await db.post.findUniqueOrThrow({ where: { id }, select: { published: true } });
  await db.post.update({ where: { id }, data: { published: !p.published } });
  redirect("/admin/posts");
}
