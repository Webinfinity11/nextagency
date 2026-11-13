import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteProject, moveProject, togglePublished } from "./actions";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
const CATEGORY = { identity: "იდენტობა", digital: "ციფრული" } as const;
export default async function AdminHome({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const { saved } = await searchParams;
  const projects = await db.project.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  return <>
    <AdminHeader />
    <main className="admin-main">
      <div className="admin-title-row">
        <div><h1>პროექტები</h1><p className="admin-muted">რიგი აქ = რიგი საიტზე. დამალული პროექტი საიტზე არ ჩანს.</p></div>
        <Link className="admin-btn admin-btn-primary" href="/admin/projects/new">+ ახალი პროექტი</Link>
      </div>
      {saved && <p className="admin-notice" role="status">შენახულია.</p>}
      {projects.length === 0 ? <p className="admin-empty">ჯერ პროექტი არ არის. დაამატე პირველი.</p> :
      <ol className="admin-list">
        {projects.map((p, i) => <li key={p.id} className={p.published ? "" : "is-hidden"}>
          <div className="admin-thumb" style={{ background: `linear-gradient(135deg, ${p.toneA}, ${p.toneB})` }}>
            {p.coverKind === "image" && p.coverSrc && <img src={p.coverSrc} alt="" />}
            {p.coverKind === "video" && p.coverSrc && (p.coverPoster ? <img src={p.coverPoster} alt="" /> : <video src={p.coverSrc} muted preload="metadata" />)}
          </div>
          <div className="admin-list-text">
            <Link href={`/admin/projects/${p.id}`} className="admin-list-title">{p.titleKa} <span>/ {p.titleEn}</span></Link>
            <span className="admin-muted">{CATEGORY[p.category]} · {p.year} · /{p.slug}{p.published ? "" : " · დამალულია"}</span>
          </div>
          <div className="admin-actions">
            <form action={moveProject}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="dir" value="-1" /><button className="admin-icon" disabled={i === 0} aria-label="ზემოთ">↑</button></form>
            <form action={moveProject}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="dir" value="1" /><button className="admin-icon" disabled={i === projects.length - 1} aria-label="ქვემოთ">↓</button></form>
            <form action={togglePublished}><input type="hidden" name="id" value={p.id} /><button className="admin-btn">{p.published ? "დამალვა" : "გამოქვეყნება"}</button></form>
            {p.published && <Link className="admin-btn" href={`/ka/work/${p.slug}`} target="_blank">ნახვა ↗</Link>}
            <Link className="admin-btn" href={`/admin/projects/${p.id}`}>რედაქტირება</Link>
            <form action={deleteProject}><input type="hidden" name="id" value={p.id} /><ConfirmButton className="admin-btn admin-btn-danger" message={`წავშალო „${p.titleKa}“? ამას ვერ დააბრუნებ.`}>წაშლა</ConfirmButton></form>
          </div>
        </li>)}
      </ol>}
    </main>
  </>;
}
