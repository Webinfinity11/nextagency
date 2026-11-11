/** Enhance the native scroller; keep links usable without JS and in reduced motion. */
export function enableDrag(viewport: HTMLElement) {
  let target = viewport.scrollLeft, current = target, startX = 0, startY = 0, origin = 0;
  let active = false, axis = "", suppress = false, raf = 0, last = 0;
  const clamp = (x: number) => Math.max(0, Math.min(x, viewport.scrollWidth - viewport.clientWidth));
  const tick = (now: number) => {
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
    last = now;
    current += (target - current) * (1 - Math.pow(0.9, 60 * dt));
    viewport.scrollLeft = current;
    if (Math.abs(target - current) > 0.1) raf = requestAnimationFrame(tick);
    else { viewport.scrollLeft = current = target; raf = 0; last = 0; }
  };
  const down = (e: PointerEvent) => {
    if (!e.isPrimary || e.button !== 0) return;
    cancelAnimationFrame(raf); raf = 0; last = 0;
    active = true; axis = ""; suppress = false;
    startX = e.clientX; startY = e.clientY; origin = current = target = viewport.scrollLeft;
  };
  const move = (e: PointerEvent) => {
    if (!active) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if (!axis && Math.max(Math.abs(dx), Math.abs(dy)) > 6) axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    if (axis !== "x") return;
    e.preventDefault(); suppress = true;
    viewport.dataset.dragging = "true";
    if (!viewport.hasPointerCapture(e.pointerId)) viewport.setPointerCapture(e.pointerId);
    target = clamp(origin - dx * 1.6);
    if (!raf) raf = requestAnimationFrame(tick);
  };
  const up = () => { active = false; delete viewport.dataset.dragging; };
  const click = (e: MouseEvent) => { if (suppress && e.detail !== 0) { e.preventDefault(); e.stopPropagation(); } };
  const focus = (e: FocusEvent) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>(".work-card");
    if (!card) return;
    cancelAnimationFrame(raf); raf = 0;
    const a = card.getBoundingClientRect(), b = viewport.getBoundingClientRect();
    const delta = a.left < b.left + 12 ? a.left - b.left - 12 : a.right > b.right - 12 ? a.right - b.right + 12 : 0;
    viewport.scrollLeft = clamp(viewport.scrollLeft + delta);
    current = target = viewport.scrollLeft;
  };
  viewport.dataset.enhanced = "true";
  viewport.addEventListener("pointerdown", down);
  viewport.addEventListener("pointermove", move);
  viewport.addEventListener("pointerup", up);
  viewport.addEventListener("pointercancel", up);
  viewport.addEventListener("lostpointercapture", up);
  viewport.addEventListener("click", click, true);
  viewport.addEventListener("focusin", focus);
  return () => {
    cancelAnimationFrame(raf);
    delete viewport.dataset.enhanced; delete viewport.dataset.dragging;
    viewport.removeEventListener("pointerdown", down); viewport.removeEventListener("pointermove", move);
    viewport.removeEventListener("pointerup", up); viewport.removeEventListener("pointercancel", up);
    viewport.removeEventListener("lostpointercapture", up); viewport.removeEventListener("click", click, true);
    viewport.removeEventListener("focusin", focus);
  };
}
