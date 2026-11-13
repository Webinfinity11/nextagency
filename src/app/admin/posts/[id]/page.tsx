import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PostForm } from "@/components/admin/PostForm";
export default async function EditPost({ params }: PageProps<"/admin/posts/[id]">) {
  await requireAdmin();
  const p = await db.post.findUnique({ where: { id: (await params).id } });
  if (!p) notFound();
  return <><AdminHeader /><main className="admin-main"><h1>{p.titleKa}</h1>
    <PostForm initial={{ id: p.id, slug: p.slug, titleKa: p.titleKa, titleEn: p.titleEn, excerptKa: p.excerptKa, excerptEn: p.excerptEn, bodyKa: p.bodyKa, bodyEn: p.bodyEn, coverSrc: p.coverSrc ?? "", coverAspect: p.coverAspect, published: p.published, publishedAt: p.publishedAt.toISOString().slice(0, 10) }} />
  </main></>;
}
