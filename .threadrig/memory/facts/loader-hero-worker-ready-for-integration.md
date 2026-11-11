---
id: loader-hero-worker-ready-for-integration
title: Loader/Hero worker ready for integration
kind: convention
status: active
date: 2026-11-11
updated: 2026-11-11
tags: [loader, hero, verification]
sources:
  - commit: 3faa4c8
supersedes: []
superseded_by: null
review: null
---
Isolated worker 9FDECF69-DFD8-491B-9752-9AADC41CFC59 prepared Next.js 16.4.6 / GSAP / Lenis first slice; owner integration is pending. Loader authored 4870ms, Chrome measurement 4871.6ms. Build/lint, standalone server and Playwright checks passed. Difference compositing follows the white wipe edge, then normal black logo travels to nav. ThreadRig embedded browser suspends animation frames as with the reference; use headless Chrome motion captures. The worker contains docs/PLAN.md and docs/verify with evidence.