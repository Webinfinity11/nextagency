import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { MEDIA_TYPES, uploadRoot } from "@/lib/media";
const TYPE_BY_EXT = Object.fromEntries(Object.entries(MEDIA_TYPES).map(([type, ext]) => [ext, type]));
// Serves uploaded files. Names are random and never reused, so they can be cached forever.
// Supports Range requests: Safari will not play a video without them.
export async function GET(request: Request, ctx: RouteContext<"/media/[...path]">) {
  const parts = (await ctx.params).path;
  const root = uploadRoot();
  const file = path.resolve(/*turbopackIgnore: true*/ root, ...parts);
  if (!file.startsWith(root + path.sep)) return new Response("Not found", { status: 404 });
  const type = TYPE_BY_EXT[path.extname(file).slice(1)];
  const info = type ? await stat(file).catch(() => null) : null;
  if (!info?.isFile()) return new Response("Not found", { status: 404 });
  const headers: Record<string, string> = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": "public, max-age=31536000, immutable" };
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") ?? "");
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : info.size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : info.size - 1;
    start = Math.max(0, start); end = Math.min(end, info.size - 1);
    if (start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${info.size}` } });
    const body = Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream;
    return new Response(body, { status: 206, headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${info.size}`, "Content-Length": String(end - start + 1) } });
  }
  const body = Readable.toWeb(createReadStream(file)) as ReadableStream;
  return new Response(body, { headers: { ...headers, "Content-Length": String(info.size) } });
}
