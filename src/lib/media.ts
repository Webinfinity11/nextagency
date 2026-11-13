import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
// Uploads live on disk under UPLOAD_DIR (on Railway: a mounted volume) and are served by /media/[...path].
export function uploadRoot() {
  const dir = process.env.UPLOAD_DIR || "./uploads";
  // The standalone server chdirs into .next/standalone, which every build replaces: a relative path would lose files.
  if (process.env.NODE_ENV === "production" && !path.isAbsolute(dir)) throw new Error("UPLOAD_DIR must be an absolute path in production (e.g. a Railway volume such as /data/uploads)");
  return path.resolve(/*turbopackIgnore: true*/ dir);
}
export const MEDIA_TYPES: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "image/gif": "gif",
  "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov",
};
export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;
/** Stores the file under a random name in a yyyy-mm folder and returns its public URL. */
export async function saveUpload(file: File): Promise<string> {
  const ext = MEDIA_TYPES[file.type];
  if (!ext) throw new Error(`unsupported type ${file.type}`);
  const month = new Date().toISOString().slice(0, 7);
  const name = `${randomBytes(12).toString("hex")}.${ext}`;
  const dir = path.join(/*turbopackIgnore: true*/ uploadRoot(), month);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(/*turbopackIgnore: true*/ dir, name), Buffer.from(await file.arrayBuffer()));
  return `/media/${month}/${name}`;
}
