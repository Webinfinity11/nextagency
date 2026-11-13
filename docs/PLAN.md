# NEXT AGENCY — first slice

## Site plan

This slice ships the loader, compact navigation, animated hero, logo-based future showreel slot, and one supporting/closing section. Everything after the hero is **TBD**, to be decided with the owner one section at a time. Candidates: work/cases, services, approach, team, contact, footer. Navigation labels are placeholders; all four section links currently point to the supporting section. The CTA goes to the visibly unfinished contact note, not a fabricated email address.

Admin comes later: Prisma + PostgreSQL, one admin login, Cloudflare R2 media storage. No admin, CMS, database, Three.js or R3F is installed in this slice.

Deployment target: Railway. Next.js App Router + TypeScript + Tailwind; `output: 'standalone'`. `pnpm build` builds and copies public/static assets into the standalone directory; `pnpm start` runs its server. Railway supplies `PORT`; set `HOSTNAME=0.0.0.0`. No Vercel-specific services. Use a supported Node LTS release in deployment; local validation used the machine's Node 25.

## Loader specification and authored timings

Times below are milliseconds relative to `loader:start` (client animation setup), not navigation or network startup. The overlay exists in server HTML; root/body overflow is locked before hydration. Completion dispatches `loader:done`, releases scrolling, shows the navigation mark and unmounts the overlay. Performance marks make duration independently measurable.

| Phase                   | Start |  End | Implementation                                                                                                                                                                                                                        |
| ----------------------- | ----: | ---: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shard flicker           |     0 | 2400 | Six N/X pieces, ten fixed poses; recursive 60–110ms timer selects pose order. Transforms jump immediately, two layers crossfade opacity for 75ms. Small SVG turbulence/displacement and subpixel sine jitter, maximum 0.12° rotation. |
| Flicker dissolve        |  2400 | 2800 | `power2.inOut`; timer and ticker removed at 2800.                                                                                                                                                                                     |
| Clean wordmark assembly |  2520 | 3120 | Small cut-direction offsets; 320ms piece tweens and 280ms total stagger, `power2.out`.                                                                                                                                                |
| Hold                    |  3120 | 3270 | Crisp white full wordmark on black.                                                                                                                                                                                                   |
| White wipe              |  3270 | 3870 | Full viewport, downward transform, `power2.inOut`.                                                                                                                                                                                    |
| Mark inversion          |  3270 | 3870 | `mix-blend-mode: difference` tracks the wipe edge; normal black copy at 3870.                                                                                                                                                         |
| Background reveal       |  3870 | 4470 | Black backing removed; white wipe fades, `power2.out`.                                                                                                                                                                                |
| Navigation reveal       |  3870 | 4470 | Links/CTA fade.                                                                                                                                                                                                                       |
| Logo travel             |  3870 | 4870 | Center to actual nav bounding box; translation and scale with `power3.inOut`. Destination recomputed on resize.                                                                                                                       |
| Complete                |  4870 | 4870 | Overlay removed, nav logo shown, scroll resumed, hero starts.                                                                                                                                                                         |

`sessionStorage['next-agency:loaded']` skips subsequent loaders in the same session. A tiny synchronous head script sets `data-loader='skip'` before paint; CSS removes the overlay immediately. Hero entrance still plays. If storage is blocked the loader plays normally.

Reduced motion: no flicker, no logo travel, no smooth scrolling, no phrase loop, no scroll scaling; clean logo and overlay fade away over 400ms. Text stays visible without transforms. The media section becomes a single viewport to avoid an unnecessary static 250vh hold.

## Hero specification

Manrope (Latin, weight 800 headings) and Noto Sans Georgian via `next/font`, one stack `var(--font-latin), var(--font-georgian)` for both locales so Latin and digits always render in Manrope; original English and Georgian placeholder text in `src/content/{en,ka}/hero.ts`. All numeric claims are visibly labelled illustrative. Georgian headings stay in Mkhedruli: browsers do not map `text-transform: uppercase` to Mtavruli, so `html[lang=ka]` headings set `text-transform: none` and a 1.2 line height so ascenders/descenders fit the reveal masks.

- Header: full wordmark travel target, four placeholder links, CTA; visible keyboard focus.
- Two independently aligned two-line headline groups, 5.2vw clamped desktop, 9vw stacked mobile. Semantic h1 label; animated words hidden from screen readers.
- Entrance: left group +300ms, right +400ms; 700ms `power3.out`, 60ms stagger; yPercent 105 → 0. Three stat lines +1050/+1170/+1290ms; 550ms, 25ms stagger.
- Idle phrase loop: initial 4.4s hold after entrance; outgoing 500ms `power3.in` with 200ms total stagger; replacement at +700ms, 1000ms `expo.out` with 400ms total stagger. The loop pauses offscreen and when the document is hidden. Both phrases share one fixed box.
- Future showreel slot: black/white original logo artwork, no copied media. 250vh wrapper, 100vh CSS sticky child, no GSAP pin. Entrance yPercent 100 → 0 in 1200ms `power3.out` on completion.
- Scroll frame: 150vh range beginning when wrapper reaches viewport top. Hold scale 1 for the first 20%; then scale 1 → .65 and radius 0 → 24px for the remaining 80%, `power2.inOut`, scrub .3. Logo pieces assemble on the same range.
- Inner parallax: yPercent −20 → 0 over the first 70vh document scroll, linear, scrub .5.
- Supporting section: 100vh minimum, SplitText line masks scrub from section top at viewport bottom to top at viewport top. Closing heading: two masked lines, 110 → 0 yPercent, 900ms `power3.out`, 120ms stagger, once at 80% viewport.
- Lenis lerp .125 and smoothWheel, driven by GSAP ticker; scroll updates ScrollTrigger; lag smoothing disabled. Stopped during loader, absent for reduced motion.

## Locale routing

Two locales, Georgian default: `/ka` and `/en` (`src/content/locales.ts`). `src/proxy.ts` redirects any path without a locale prefix to `/ka` + path (`/` → `/ka`); its matcher skips `_next`, `api` and any path with a file extension, so `public/` assets are never redirected. The root layout lives in `src/app/[locale]/layout.tsx` (`generateStaticParams` for both, `dynamicParams = false`, unknown locale → `notFound()`), sets `<html lang>`, per-locale metadata, canonical and `hreflang` alternates (`x-default` → `/ka`; origin from `NEXT_PUBLIC_SITE_URL`). Skip link, smooth scroll, nav and loader sit in the layout so future pages share them; server components pass `getContent(locale)` copy down as props, so content can later come from Prisma with the same `HeroContent` shape. The nav switcher keeps the current path under the other locale. Switching is a client navigation that remounts the root layout (React resets `data-loader` to `running`), so the loader remembers in module state that it already ran and finishes without showing the overlay; the hero entrance replays normally.

## Reference technique → our logo-based version

| Reference technique                  | Our original version                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Rough raster frame swaps             | Deterministic N ribbon/triangles and X chevron/shard poses, randomly ordered; SVG edge roughness. |
| Flicker → clean brand                | All 20 parts of our wordmark assemble along their cut directions.                                 |
| White field wipe and mark inversion  | Original white wordmark with edge-accurate difference inversion, then normal black travel copy.   |
| Center mark → navigation             | Our full wordmark travels to our measured nav target.                                             |
| Masked editorial word entrance       | Original “ONE STEP / BEYOND.” and “YOUR NEXT / STARTS HERE.” copy and alternative phrases.        |
| Time-driven phrase alternation       | Two original phrase layouts, visibility-aware playback.                                           |
| Sticky film scale/parallax           | Oversized original logo panel with scroll assembly, future showreel slot.                         |
| SplitText support and closing reveal | Original agency positioning sentence and closing invitation.                                      |

No reference text, imagery, marks or font assets are part of the application. Research screenshots remain read-only reference material.

## Validation and deliberate boundaries

Reproduce: install Playwright and sharp in a scratch directory, run the production app, then `VERIFY_DEPS=/tmp/your-dir VERIFY_URL=http://localhost:3018 node scripts/verify.mjs`. Chrome channel is required. The script records ~125ms loader/entrance samples and 45×60px wheel input, exports 720px key frames, checks loader duration/removal, scrolling, frame scale, session skip, keyboard/CTA, mobile widths, reduced motion, and console errors. `docs/verify/measurements.json` records actual results; `docs/verify/README.md` records visual review.

The permitted `mix-blend-mode: difference` option keeps the wordmark white on black and black on the descending white field. At 3870ms it switches discretely to the normal black copy before the backdrop fades. Thus the research’s separate black/white opacity ramps are replaced by edge-accurate inversion; all choreography boundaries are retained. Border radius is the one non-transform/opacity animation, explicitly required by the frame specification. SVG distortion is restricted to the small loader cluster. No full-screen filters and no permanent `will-change` hints.

## Open decisions for the owner

1. Approve/edit both languages, real stats and public contact details; choose whether a language switcher is wanted later.
2. Choose real showreel footage and poster, or keep a refined logo motion piece.
3. Choose the next section (work/cases, services, approach, team, contact or footer) before further implementation.
4. Decide navigation destinations and whether the compact mobile header needs a menu as real sections arrive.

## Work

The home Work section is a server-rendered child slot between HeroMedia and support. `src/content/projects.ts` is the async repository boundary for six bilingual placeholder projects and two categories (future Prisma replacement); components receive records through props. Shared cards power the featured 2–1–2 grid, native-scroll-enhanced drag categories, `/[locale]/work`, and static `/[locale]/work/[slug]` case-study stubs. Scoped GSAP/Flip/SplitText handle promotion, reserved row heights, parallax and reveals; reduced motion keeps content visible with native horizontal scrolling. Work metadata includes canonical and ka/en/x-default alternatives. Run `scripts/verify-work.mjs` against the production server for interaction assertions and reference comparisons.

## Admin and projects (database)

Projects live in PostgreSQL (Prisma 7, `prisma/schema.prisma`, client generated into `src/generated/prisma`, `pg` driver adapter). `src/content/projects.ts` keeps the same `Project` shape for the site, now read from the database; only published projects reach the site, ordered by `order`. Home, `/[locale]/work` and `/[locale]/work/[slug]` render per request (`dynamic = "force-dynamic"`), so the build never needs the database and admin changes appear immediately.

`/admin` (own root layout, Georgian UI, `noindex`): one login from `ADMIN_EMAIL` / `ADMIN_PASSWORD`, session = HMAC-signed httpOnly cookie (`SESSION_SECRET`), checked by every page, server action and the upload route. Project list: reorder (↑/↓), hide/publish, view, edit, delete with confirmation. Project form: both languages for title, summary, one-word feeling and intro; slug auto-filled from the title (Georgian transliterated); category, year, published; cover image/video (+ optional poster) or a two-colour gradient; page body blocks — image/video (full width or two side by side) and text — reorderable.

Uploads: `POST /api/admin/upload` (admin only; jpg/png/webp/avif/gif/mp4/webm/mov, 200 MB) writes to `UPLOAD_DIR` under a random name; `/media/[...path]` serves them with immutable caching and Range support (Safari video). Production requires an absolute `UPLOAD_DIR` (Railway volume) because the standalone server runs inside `.next/standalone`, which each build replaces.

Local: Postgres 17 in Docker (`nextagency-pg`, port 5433), `.env` from `.env.example`, `pnpm prisma migrate dev`, then `pnpm db:import-projects "<folder>" [--replace]` to load the agency's web projects (one folder per project: `*_Feature.webp` cover + numbered page screenshots; texts are drafts inside `scripts/import-projects.mts`). Railway: Postgres service + `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET`, a volume and `UPLOAD_DIR`; `railway.json` runs `pnpm db:migrate` before each deploy. Deleting a project does not delete its uploaded files.
