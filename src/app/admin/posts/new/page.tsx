import { requireAdmin } from "@/lib/admin-auth";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PostForm } from "@/components/admin/PostForm";
export default async function NewPost() {
  await requireAdmin();
  return <><AdminHeader /><main className="admin-main"><h1>ახალი სტატია</h1>
    <PostForm initial={{ slug: "", titleKa: "", titleEn: "", excerptKa: "", excerptEn: "", bodyKa: "", bodyEn: "", coverSrc: "", coverAspect: 1.6, published: true, publishedAt: new Date().toISOString().slice(0, 10) }} />
  </main></>;
}
