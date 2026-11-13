"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { savePost } from "@/app/admin/actions";
import { MediaPicker, slugify } from "./ProjectForm";
export type PostFormValues = {
  id?: string; slug: string; titleKa: string; titleEn: string; excerptKa: string; excerptEn: string; bodyKa: string; bodyEn: string;
  coverSrc: string; coverAspect: number; published: boolean; publishedAt: string;
};
export function PostForm({ initial }: { initial: PostFormValues }) {
  const [state, action, pending] = useActionState(savePost, undefined);
  const [v, setV] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(!!initial.id);
  const set = <K extends keyof PostFormValues>(k: K, value: PostFormValues[K]) => setV(s => ({ ...s, [k]: value }));
  const title = (k: "titleKa" | "titleEn", value: string) => setV(s => { const n = { ...s, [k]: value }; if (!slugTouched) n.slug = slugify(n.titleEn || n.titleKa); return n; });
  const pair = (label: string, base: "title" | "excerpt" | "body", rows?: number) => <fieldset className="admin-pair">
    <legend>{label}</legend>
    {(["Ka", "En"] as const).map(sfx => { const k = `${base}${sfx}` as const; const F = rows ? "textarea" : "input"; return <label key={sfx}><span>{sfx === "Ka" ? "ქართ." : "ENG"}</span>
      <F name={k} value={v[k]} rows={rows} required={base === "title"} onChange={e => base === "title" ? title(k as "titleKa" | "titleEn", e.target.value) : set(k, e.target.value)} />
    </label>; })}
  </fieldset>;
  return <form action={action} className="admin-form">
    {v.id && <input type="hidden" name="id" value={v.id} />}
    <input type="hidden" name="coverSrc" value={v.coverSrc} />
    <input type="hidden" name="coverAspect" value={v.coverAspect} />
    <section className="admin-card">
      <h2>სტატია</h2>
      {pair("სათაური *", "title")}
      <label className="admin-field">ბმული (slug) *
        <div className="admin-slug"><span>/blog/</span><input name="slug" value={v.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" onChange={e => { setSlugTouched(true); set("slug", e.target.value.toLowerCase()); }} /></div>
      </label>
      <div className="admin-grid-3">
        <label className="admin-field">თარიღი<input type="date" name="publishedAt" value={v.publishedAt} onChange={e => set("publishedAt", e.target.value)} required /></label>
        <label className="admin-check"><input type="checkbox" name="published" checked={v.published} onChange={e => set("published", e.target.checked)} />საიტზე ჩანს</label>
      </div>
      {pair("მოკლე აღწერა (სიაში და სტატიის თავში)", "excerpt", 2)}
    </section>
    <section className="admin-card">
      <h2>ქავერი</h2>
      <MediaPicker label="ფოტო" src={v.coverSrc} accept="image/*" onChange={m => setV(s => ({ ...s, coverSrc: m?.url ?? "", coverAspect: m?.aspect ?? s.coverAspect }))} />
    </section>
    <section className="admin-card">
      <h2>ტექსტი</h2>
      <p className="admin-muted">ცარიელი ხაზი = ახალი აბზაცი · „## “ ხაზის დასაწყისში = სათაური · „- “ = სიის პუნქტი.</p>
      {pair("ტექსტი", "body", 16)}
    </section>
    <div className="admin-savebar">
      {state?.error && <p className="admin-error" role="alert">{state.error}</p>}
      <Link className="admin-btn" href="/admin/posts">გაუქმება</Link>
      <button className="admin-btn admin-btn-primary" disabled={pending}>{pending ? "ინახება…" : "შენახვა"}</button>
    </div>
  </form>;
}
