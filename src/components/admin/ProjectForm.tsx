"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { saveProject } from "@/app/admin/actions";

export type ProjectFormValues = {
  id?: string; slug: string; titleKa: string; titleEn: string; summaryKa: string; summaryEn: string;
  introKa: string; introEn: string; category: "identity" | "digital";
  headlineKa: string; headlineEn: string; tagsKa: string; tagsEn: string; clientKa: string; clientEn: string;
  servicesKa: string; servicesEn: string; teamKa: string; teamEn: string; websiteUrl: string; accent: string;
  year: number; published: boolean; coverSrc: string; coverPoster: string; coverAspect: number; toneA: string; toneB: string;
  blocks: EditBlock[];
};
type EditBlock = { key: string; bg: string } & ({ kind: "media"; src: string; poster: string; aspect: number; wide: boolean } | { kind: "text"; ka: string; en: string });

const KA_LATIN: Record<string, string> = { ა: "a", ბ: "b", გ: "g", დ: "d", ე: "e", ვ: "v", ზ: "z", თ: "t", ი: "i", კ: "k", ლ: "l", მ: "m", ნ: "n", ო: "o", პ: "p", ჟ: "zh", რ: "r", ს: "s", ტ: "t", უ: "u", ფ: "p", ქ: "k", ღ: "gh", ყ: "q", შ: "sh", ჩ: "ch", ც: "ts", ძ: "dz", წ: "ts", ჭ: "ch", ხ: "kh", ჯ: "j", ჰ: "h" };
const slugify = (s: string) => [...s.toLowerCase()].map(c => KA_LATIN[c] ?? c).join("").normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
const isVideo = (src: string) => /\.(mp4|webm|mov)$/i.test(src);
let keySeq = 0;
const newKey = () => `b${Date.now()}-${keySeq++}`;

/** Uploads one file and measures it in the browser (width / height → aspect). */
async function upload(file: File): Promise<{ url: string; aspect: number }> {
  const body = new FormData(); body.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `upload failed (${res.status})`);
  const local = URL.createObjectURL(file);
  const aspect = await new Promise<number>(resolve => {
    if (file.type.startsWith("video/")) {
      const v = document.createElement("video"); v.preload = "metadata";
      v.onloadedmetadata = () => resolve(v.videoWidth / v.videoHeight || 1.5); v.onerror = () => resolve(1.5); v.src = local;
    } else {
      const img = new Image(); img.onload = () => resolve(img.naturalWidth / img.naturalHeight || 1.5); img.onerror = () => resolve(1.5); img.src = local;
    }
  });
  URL.revokeObjectURL(local);
  return { url: json.url, aspect: Math.round(aspect * 1000) / 1000 };
}

function MediaPicker({ label, src, accept, onChange, hint }: { label: string; src: string; accept: string; hint?: string; onChange: (v: { url: string; aspect: number } | null) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <div className="admin-media">
    <span className="admin-label">{label}</span>
    <div className="admin-media-box">
      {src ? (isVideo(src) ? <video src={src} muted loop autoPlay playsInline /> : <img src={src} alt="" />) : <span className="admin-muted">{busy ? "იტვირთება…" : "ფაილი არ არის"}</span>}
    </div>
    <div className="admin-media-row">
      <label className="admin-btn">{src ? "შეცვლა" : "ატვირთვა"}
        <input type="file" accept={accept} hidden disabled={busy} onChange={async e => {
          const file = e.target.files?.[0]; e.target.value = ""; if (!file) return;
          setBusy(true); setError("");
          try { onChange(await upload(file)); } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
        }} />
      </label>
      {src && <button type="button" className="admin-btn" onClick={() => onChange(null)}>მოშორება</button>}
      {busy && <span className="admin-muted">იტვირთება…</span>}
    </div>
    {hint && <span className="admin-hint">{hint}</span>}
    {error && <span className="admin-error">{error}</span>}
  </div>;
}

function Pair({ label, name, values, onChange, area, required }: { label: string; name: string; values: [string, string]; onChange?: (lang: 0 | 1, v: string) => void; area?: boolean; required?: boolean }) {
  const Field = area ? "textarea" : "input";
  return <fieldset className="admin-pair">
    <legend>{label}</legend>
    {(["Ka", "En"] as const).map((suffix, i) => <label key={suffix}><span>{suffix === "Ka" ? "ქართ." : "ENG"}</span>
      <Field name={`${name}${suffix}`} value={values[i]} required={required} rows={area ? 4 : undefined} onChange={e => onChange?.(i as 0 | 1, e.target.value)} />
    </label>)}
  </fieldset>;
}

export function ProjectForm({ initial }: { initial: ProjectFormValues }) {
  const [state, action, pending] = useActionState(saveProject, undefined);
  const [v, setV] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(!!initial.id);
  const set = <K extends keyof ProjectFormValues>(k: K, value: ProjectFormValues[K]) => setV(s => ({ ...s, [k]: value }));
  const pair = (base: "title" | "summary" | "intro" | "headline" | "tags" | "client" | "services" | "team") => ({
    values: [v[`${base}Ka`], v[`${base}En`]] as [string, string],
    onChange: (lang: 0 | 1, value: string) => setV(s => {
      const next = { ...s, [`${base}${lang ? "En" : "Ka"}`]: value };
      if (base === "title" && !slugTouched) next.slug = slugify(next.titleEn || next.titleKa);
      return next;
    }),
  });
  const setBlock = (key: string, patch: Partial<EditBlock>) => setV(s => ({ ...s, blocks: s.blocks.map(b => b.key === key ? { ...b, ...patch } as EditBlock : b) }));
  const moveBlock = (i: number, d: number) => setV(s => { const b = [...s.blocks]; [b[i], b[i + d]] = [b[i + d], b[i]]; return { ...s, blocks: b }; });
  const blocksJson = JSON.stringify(v.blocks.map(b => b.kind === "text" ? { kind: "text", ka: b.ka, en: b.en, bg: b.bg || undefined } : { kind: "media", src: b.src, poster: b.poster || undefined, aspect: b.aspect, wide: b.wide, bg: b.bg || undefined }));

  return <form action={action} className="admin-form">
    {v.id && <input type="hidden" name="id" value={v.id} />}
    <input type="hidden" name="coverSrc" value={v.coverSrc} />
    <input type="hidden" name="coverPoster" value={v.coverPoster} />
    <input type="hidden" name="coverAspect" value={v.coverAspect} />
    <input type="hidden" name="blocks" value={blocksJson} />

    <section className="admin-card">
      <h2>ძირითადი</h2>
      <Pair label="სათაური *" name="title" required {...pair("title")} />
      <label className="admin-field">ბმული (slug) *
        <div className="admin-slug"><span>/work/</span><input name="slug" value={v.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" onChange={e => { setSlugTouched(true); set("slug", e.target.value.toLowerCase()); }} /></div>
        <span className="admin-hint">ლათინური პატარა ასოები, ციფრები და ტირე. ივსება სათაურიდან.</span>
      </label>
      <div className="admin-grid-3">
        <label className="admin-field">კატეგორია
          <select name="category" value={v.category} onChange={e => set("category", e.target.value as ProjectFormValues["category"])}><option value="identity">იდენტობა</option><option value="digital">ციფრული</option></select>
        </label>
        <label className="admin-field">წელი<input name="year" type="number" min={1990} max={2100} value={v.year} onChange={e => set("year", Number(e.target.value))} required /></label>
        <label className="admin-check"><input type="checkbox" name="published" checked={v.published} onChange={e => set("published", e.target.checked)} />საიტზე ჩანს</label>
      </div>
      <Pair label="მოკლე აღწერა (ბარათზე)" name="summary" {...pair("summary")} />
    </section>

    <section className="admin-card">
      <h2>ქავერი</h2>
      <p className="admin-muted">ჩანს მთავარ გვერდზე, ნამუშევრების სიაში და პროექტის გვერდის თავში.</p>
      <div className="admin-grid-2">
        <MediaPicker label="ფოტო ან ვიდეო" src={v.coverSrc} accept="image/*,video/mp4,video/webm,video/quicktime"
          onChange={m => setV(s => ({ ...s, coverSrc: m?.url ?? "", coverAspect: m?.aspect ?? s.coverAspect, coverPoster: m && isVideo(m.url) ? s.coverPoster : "" }))} />
        {isVideo(v.coverSrc) && <MediaPicker label="ვიდეოს პოსტერი (სურვილისამებრ)" src={v.coverPoster} accept="image/*" hint="ჩანს, სანამ ვიდეო ჩაიტვირთება." onChange={m => set("coverPoster", m?.url ?? "")} />}
      </div>
      {!v.coverSrc && <div className="admin-tones">
        <span className="admin-muted">ფაილის გარეშე ქავერი გრადიენტია:</span>
        <label><input type="color" name="toneA" value={v.toneA} onChange={e => set("toneA", e.target.value)} /> 1</label>
        <label><input type="color" name="toneB" value={v.toneB} onChange={e => set("toneB", e.target.value)} /> 2</label>
        <span className="admin-swatch" style={{ background: `linear-gradient(135deg, ${v.toneA}, ${v.toneB})` }} />
      </div>}
      {v.coverSrc && <><input type="hidden" name="toneA" value={v.toneA} /><input type="hidden" name="toneB" value={v.toneB} /></>}
    </section>

    <section className="admin-card">
      <h2>პროექტის გვერდი</h2>
      <p className="admin-muted">მარცხენა სვეტი: ტეგები, ქვესათაური, აღწერა და ფაქტები. ცარიელი ველი გვერდზე არ ჩანს.</p>
      <Pair label="ტეგები (მძიმით გამოყავი: UX/UI დიზაინი, ვებ დეველოპმენტი)" name="tags" {...pair("tags")} />
      <Pair label="ქვესათაური" name="headline" {...pair("headline")} />
      <Pair label="აღწერა" name="intro" area {...pair("intro")} />
      <Pair label="კლიენტი" name="client" {...pair("client")} />
      <Pair label="რა გავაკეთეთ" name="services" {...pair("services")} />
      <Pair label="გუნდი (თითო ადამიანი ახალ ხაზზე)" name="team" area {...pair("team")} />
      <div className="admin-grid-2">
        <label className="admin-field">საიტის ბმული (ღილაკი „საიტის ნახვა“)
          <input name="websiteUrl" type="url" placeholder="https://" value={v.websiteUrl} onChange={e => set("websiteUrl", e.target.value)} />
        </label>
        <label className="admin-field">მარჯვენა პანელის ფერი
          <span className="admin-tones" style={{ marginTop: 0 }}><input type="color" name="accent" value={v.accent} onChange={e => set("accent", e.target.value)} /><span className="admin-swatch" style={{ background: v.accent }} /></span>
        </label>
      </div>
      <div className="admin-blocks">
        <span className="admin-label">მარჯვენა პანელის ბლოკები (ზემოდან ქვემოთ, როგორც გვერდზე)</span>
        {v.blocks.length === 0 && <p className="admin-muted">ჯერ ცარიელია. დაამატე ფოტო, ვიდეო ან ტექსტი.</p>}
        {v.blocks.map((b, i) => <div className="admin-block" key={b.key}>
          <div className="admin-block-bar">
            <strong>{i + 1}. {b.kind === "text" ? "ტექსტი" : isVideo(b.src) ? "ვიდეო" : "ფოტო"}</strong>
            <span>
              <button type="button" className="admin-icon" disabled={i === 0} onClick={() => moveBlock(i, -1)} aria-label="ზემოთ">↑</button>
              <button type="button" className="admin-icon" disabled={i === v.blocks.length - 1} onClick={() => moveBlock(i, 1)} aria-label="ქვემოთ">↓</button>
              <button type="button" className="admin-btn admin-btn-danger" onClick={() => setV(s => ({ ...s, blocks: s.blocks.filter(x => x.key !== b.key) }))}>მოშორება</button>
            </span>
          </div>
          <div className="admin-tones" style={{ margin: "0 0 12px" }}>
            <label className="admin-check" style={{ margin: 0 }}><input type="checkbox" checked={!!b.bg} onChange={e => setBlock(b.key, { bg: e.target.checked ? v.accent : "" })} />საკუთარი ფონის ფერი</label>
            {b.bg && <input type="color" value={b.bg} onChange={e => setBlock(b.key, { bg: e.target.value })} />}
          </div>
          {b.kind === "text"
            ? <Pair label="ტექსტი" name={`block-${b.key}-`} area values={[b.ka, b.en]} onChange={(lang, value) => setBlock(b.key, lang ? { en: value } : { ka: value })} />
            : <div className="admin-grid-2">
                <MediaPicker label="ფაილი" src={b.src} accept="image/*,video/mp4,video/webm,video/quicktime" onChange={m => m ? setBlock(b.key, { src: m.url, aspect: m.aspect }) : setV(s => ({ ...s, blocks: s.blocks.filter(x => x.key !== b.key) }))} />
                <div>
                  <label className="admin-check"><input type="checkbox" checked={b.wide} onChange={e => setBlock(b.key, { wide: e.target.checked })} />სრულ სიგანეზე</label>
                  <p className="admin-hint">თუ არ არის მონიშნული, ორი მომდევნო ბლოკი გვერდიგვერდ დადგება.</p>
                  {isVideo(b.src) && <MediaPicker label="პოსტერი (სურვილისამებრ)" src={b.poster} accept="image/*" onChange={m => setBlock(b.key, { poster: m?.url ?? "" })} />}
                </div>
              </div>}
        </div>)}
        <div className="admin-media-row">
          <label className="admin-btn">+ ფოტო / ვიდეო
            <input type="file" hidden multiple accept="image/*,video/mp4,video/webm,video/quicktime" onChange={async e => {
              const files = [...(e.target.files ?? [])]; e.target.value = "";
              for (const file of files) {
                const key = newKey();
                setV(s => ({ ...s, blocks: [...s.blocks, { key, kind: "media", src: "", poster: "", aspect: 1.5, wide: true, bg: "" }] }));
                try { const m = await upload(file); setBlock(key, { src: m.url, aspect: m.aspect }); }
                catch (err) { alert(`${file.name}: ${(err as Error).message}`); setV(s => ({ ...s, blocks: s.blocks.filter(x => x.key !== key) })); }
              }
            }} />
          </label>
          <button type="button" className="admin-btn" onClick={() => setV(s => ({ ...s, blocks: [...s.blocks, { key: newKey(), kind: "text", ka: "", en: "", bg: "" }] }))}>+ ტექსტი</button>
        </div>
      </div>
    </section>

    <div className="admin-savebar">
      {state?.error && <p className="admin-error" role="alert">{state.error}</p>}
      <Link className="admin-btn" href="/admin">გაუქმება</Link>
      <button className="admin-btn admin-btn-primary" disabled={pending || v.blocks.some(b => b.kind === "media" && !b.src)}>{pending ? "ინახება…" : "შენახვა"}</button>
    </div>
  </form>;
}
