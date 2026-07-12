type Listener = (locked: boolean) => void;

let dockLocked = false;
const listeners = new Set<Listener>();

export function setRelationHubDockLocked(locked: boolean) {
  if (dockLocked === locked) return;
  dockLocked = locked;
  listeners.forEach((fn) => fn(locked));
}

export function getRelationHubDockLocked() {
  return dockLocked;
}

export function subscribeRelationHubDockLock(listener: Listener) {
  listeners.add(listener);
  listener(dockLocked);
  return () => {
    listeners.delete(listener);
  };
}

export const RELATION_HUB_DOCK_LOCK_MESSAGE =
  "친구를 먼저 등록해야 이용할 수 있어요!";
