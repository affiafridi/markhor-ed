/**
 * Keeps the pinned scroll position in step with the active product.
 *
 * While the hero is pinned, nothing on screen moves as the page scrolls — the
 * scroll range only selects a product. That means when a button, key or swipe
 * changes the product we can move the scroll position to match *instantly*
 * and invisibly, so the next wheel gesture continues from the right place
 * instead of snapping back.
 *
 * The scroll sequence registers the setter; the carousel calls it. Passing it
 * through this module rather than through props keeps the two hooks
 * independent of each other.
 */
type IndexSyncer = (index: number) => void;

let syncer: IndexSyncer | null = null;

export function registerScrollSync(fn: IndexSyncer | null): void {
  syncer = fn;
}

export function syncScrollToIndex(index: number): void {
  syncer?.(index);
}
