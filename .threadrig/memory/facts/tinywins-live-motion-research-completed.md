---
id: tinywins-live-motion-research-completed
title: TinyWins live motion research completed
kind: convention
status: active
date: 2026-11-11
updated: 2026-11-11
tags: [tinywins, motion, reference]
sources:
  - commit: 3faa4c8
supersedes: []
superseded_by: null
review: null
---
Live loader verified as 11 PNG frames (1076x764), random 60–110ms timer plus 75ms opacity transitions; authored GSAP exit completes at 4.87s after timeline starts. Body fixed/overflow hidden locks scrolling until ready. Hero uses manual word masks, CSS sticky video inside 250vh wrapper, scale 1→.65 across primary scroll; no loader WebGL. Footer canvas is an interactive sticker deformation renderer. Worker 0ADD238A docs/research/tinywins-motion.md and 10 frames completed; previous research blocker resolved by continuing live site.