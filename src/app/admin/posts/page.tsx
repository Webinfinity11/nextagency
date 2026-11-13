import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { deletePost, togglePostPublished } from "../actions";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
export default async function Posts({ searchParams }: PageProps<"/admin/posts">) {
  await requireAdmin();
  const { saved } = await searchParams;
  const posts = await db.post.findMany({ orderBy: { publishedAt: "desc" } });
  const fmt = new Intl.DateTimeFormat("ka-GE", { day: "numeric", month: "short", year: "numeric" });
  return <>
    <AdminHeader />
    <main className="admin-main">
      <div className="admin-title-row">
        <div><h1>ბლოგი</h1><p className="admin-muted">სტატიები თარიღით. დამალული სტატია საიტზე არ ჩანს.</p></div>
        <Link className="admin-btn admin-btn-primary" href="/admin/posts/new">+ ახალი სტატია</Link>
      </div>
      {saved && <p className="admin-notice" role="status">შენახულია.</p>}
      {posts.length === 0 ? <p className="admin-empty">ჯერ სტატია არ არის. დაწერე პირველი.</p> :
      <ol className="admin-list">
        {posts.map(p => <li key={p.id} className={p.published ? "" : "is-hidden"}>
          <div className="admin-thumb" style={{ background: "#e8e6df" }}>{p.coverSrc && <img src={p.coverSrc} alt="" />}</div>
          <div className="admin-list-text">
            <Link href={`/admin/posts/${p.id}`} className="admin-list-title">{p.titleKa} <span>/ {p.titleEn}</span></Link>
            <span className="admin-muted">{fmt.format(p.publishedAt)} · /{p.slug}{p.published ? "" : " · დამალულია"}</span>
          </div>
          <div className="admin-actions">
            <form action={togglePostPublished}><input type="hidden" name="id" value={p.id} /><button className="admin-btn">{p.published ? "დამალვა" : "გამოქვეყნება"}</button></form>
            {p.published && <Link className="admin-btn" href={`/ka/blog/${p.slug}`} target="_blank">ნახვა ↗</Link>}
            <Link className="admin-btn" href={`/admin/posts/${p.id}`}>რედაქტირება</Link>
            <form action={deletePost}><input type="hidden" name="id" value={p.id} /><ConfirmButton className="admin-btn admin-btn-danger" message={`წავშალო „${p.titleKa}“? ამას ვერ დააბრუნებ.`}>წაშლა</ConfirmButton></form>
          </div>
        </li>)}
      </ol>}
    </main>
  </>;
}
