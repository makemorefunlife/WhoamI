/**
 * Forces the floating bottom dock (StitchScrollDock) fully out of the way
 * whenever a full-screen sheet/dialog is open. Those sheets already sit
 * above the dock in z-index, but on mobile several of them anchor to the
 * bottom of the viewport (items-end) — the exact same spot the dock floats
 * in — so the dock could still show through / sit right at the edge of a
 * dialog's action buttons. The dock and any overlay's buttons must never
 * occupy the same screen region; hiding the dock outright while any
 * overlay is open is the simplest way to guarantee that, rather than
 * relying on z-index/opacity alone.
 *
 * Counter-based (not a plain boolean) so two overlays that happen to be
 * open at once — or one that opens before another finishes closing —
 * don't let the second one's close prematurely reveal the dock while the
 * first is still up.
 */

type Listener = (hidden: boolean) => void;

let count = 0;
const listeners = new Set<Listener>();

function notify() {
  const hidden = count > 0;
  listeners.forEach((fn) => fn(hidden));
}

export function pushDockOverlayLock() {
  count += 1;
  notify();
}

export function popDockOverlayLock() {
  count = Math.max(0, count - 1);
  notify();
}

export function subscribeDockOverlayLock(listener: Listener) {
  listeners.add(listener);
  listener(count > 0);
  return () => {
    listeners.delete(listener);
  };
}
