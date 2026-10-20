// Swipe card: drag right = "know", left = "again". Pointer events, so mouse, touch and pen behave the same.
export const THRESHOLD = 0.28; // share of the card width that commits a swipe
export const FLICK = 0.6;      // px/ms: a fast flick commits even when short

// "right" | "left" | null for a finished drag.
export function decide(dx, width, velocity = 0) {
  if (Math.abs(dx) >= width * THRESHOLD || (Math.abs(velocity) >= FLICK && Math.abs(dx) > 24)) return dx > 0 ? "right" : "left";
  return null;
}

// Wires one card element. onSwipe(direction) runs after the fly-out animation.
// Buttons stay the primary path for keyboard and screen-reader users; this only adds the gesture.
export function attachSwipe(card, onSwipe) {
  let x0 = 0, t0 = 0, dx = 0, id = null;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const set = (x, animate) => {
    card.style.transition = animate && !reduced ? "transform var(--dur-swipe) var(--ease)" : "none";
    card.style.transform = x ? `translateX(${x}px) rotate(${x / 20}deg)` : "";
    card.dataset.drag = x > 20 ? "right" : x < -20 ? "left" : "";
  };
  card.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || e.target.closest("button, input, a")) return;
    id = e.pointerId; x0 = e.clientX; t0 = performance.now(); dx = 0;
    card.setPointerCapture(id);
  });
  card.addEventListener("pointermove", (e) => {
    if (e.pointerId !== id) return;
    dx = e.clientX - x0;
    set(dx, false);
  });
  const end = (e) => {
    if (e.pointerId !== id) return;
    id = null;
    const dir = e.type === "pointerup" ? decide(dx, card.offsetWidth, dx / Math.max(performance.now() - t0, 1)) : null;
    if (!dir) return set(0, true);
    fly(card, dir, () => onSwipe(dir), reduced);
  };
  card.addEventListener("pointerup", end);
  card.addEventListener("pointercancel", end);
}

// Animates the card off screen, then resets it for the next word.
export function fly(card, dir, done, reduced = matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const x = (dir === "right" ? 1 : -1) * (innerWidth + card.offsetWidth);
  card.dataset.drag = dir;
  card.style.transition = reduced ? "none" : "transform var(--dur-swipe) var(--ease)";
  card.style.transform = `translateX(${x}px) rotate(${x / 40}deg)`;
  setTimeout(() => {
    card.style.transition = "none";
    card.style.transform = "";
    card.dataset.drag = "";
    done();
  }, reduced ? 0 : 260);
}
