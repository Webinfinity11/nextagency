---
id: stack-next-js-gsap-lenis-custom-admin-prisma-postgres-on-railway
title: "Stack: Next.js + GSAP\/Lenis + custom admin (Prisma\/Postgres) on Railway"
status: active
date: 2026-11-11
updated: 2026-11-11
tags: [stack, architecture, admin]
sources: []
supersedes: []
superseded_by: null
review: null
---
## გადაწყვეტილება
Agency site built with Next.js (App Router, TS, Tailwind), GSAP (ScrollTrigger, SplitText) + Lenis for motion, optional R3F/Three for 3D. Admin panel is custom-built (Prisma + PostgreSQL) for blogs and projects, extended later. Deployed on Railway. Motion reference: tinywins.com (Next.js + GSAP + ScrollTrigger + SplitText + Lenis + Three/Spline + Sanity) — recreate techniques, not their design/assets.

## რატომ
Reference site uses this exact animation stack on Next.js; user chose a custom admin over Payload/Sanity for full control.

## უარყოფილი ალტერნატივები
Vue/Nuxt (React ecosystem better for R3F/Spline, reference is Next). Payload CMS and Sanity — user preferred own admin.