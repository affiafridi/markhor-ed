/**
 * Lets the focus transition ask the pinned scroll to re-measure.
 *
 * The same indirection as scroll-sync, and for the same reason: the hook
 * that owns the ScrollTrigger is the only thing allowed to touch it, but the
 * moment to refresh is known by the transition. A module-level slot keeps
 * the two from importing each other.
 */
type Refresh = () => void;

let refresh: Refresh | null = null;

/** Registered by the pinned scroll sequence. Pass null to clear on unmount. */
export function registerStoryRefresh(next: Refresh | null): void {
  refresh = next;
}

/**
 * Re-measures the pinned distance.
 *
 * Only safe when nothing is animating: the pin's length depends on whether a
 * product is open, so refreshing while that is changing recomputes under a
 * move still in flight.
 */
export function refreshStoryScroll(): void {
  refresh?.();
}
