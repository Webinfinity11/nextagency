---
id: loader-verification
title: Loader v3 worker მზადაა ინტეგრაციისთვის
kind: convention
status: active
date: 2026-11-11
updated: 2026-11-11
tags: [loader, verification]
sources:
  - commit: f3ed51e
supersedes: []
superseded_by: null
review: null
---
Isolated worker 747EA5DF commit 130272c მზადაა; main-ში ჯერ არ არის ინტეგრირებული. Boiling unchanged 23×110ms; NEXT crossfade2.48, clip wipe3.42, centered nav travel3.97–4.57, slide4.9–5.5, AGENCY5.5–5.9. loader:done releases hero at4.9s; loader:settled~5.9s. build/lint and ka/en×1440/390 animated/repeat/reduced geometry checks passed; handoff max0.026px. Evidence lives in worker docs/verify/loader-v3-*. Nested agency SVG needs width/height attrs plus CSS; horizontal wordmark overflow stays visible.