import { isAdmin } from "@/lib/admin-auth";
import { MAX_UPLOAD_BYTES, MEDIA_TYPES, saveUpload } from "@/lib/media";
// Admin-only upload: one file per request, returns its public URL.
export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) return Response.json({ error: "no file" }, { status: 400 });
  if (!MEDIA_TYPES[file.type]) return Response.json({ error: `unsupported type: ${file.type || "unknown"}` }, { status: 415 });
  if (file.size > MAX_UPLOAD_BYTES) return Response.json({ error: "file larger than 200 MB" }, { status: 413 });
  return Response.json({ url: await saveUpload(file) });
}
