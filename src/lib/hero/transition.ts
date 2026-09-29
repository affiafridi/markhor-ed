import { EASE, gsap } from "@/lib/animation";
import { FOCUS_DURATION, planExit } from "./focus";
import { wrapOffset } from "./layout";
import { heroStage } from "./stage";

/**
 * Seconds. Mirrors `--duration-scene` in tokens.css so the DOM palette and
 * the 3D stage finish together. Change both.
 */
export const TRANSITION_DURATION = 0.9;

/** Slightly quicker when the user is flicking through with a drag. */
export const TRANSITION_DURATION_FAST = 0.7;

/**
 * Reduced motion still moves — briefly.
 *
 * Snapping the stage between products reads as a glitch rather than as calm;
 * a short translation with a crossfade is the accessible equivalent of the
 * full transition, and is what the brand direction asks for. The long travel
 * that reduced motion actually removes is the pinned scroll sequence, the
 * pointer parallax and the idle product drift — all of which stay off.
 */
export const TRANSITION_DURATION_REDUCED = 0.4;

/**
 * The house glide.
 *
 * Quartic ease-out. Deliberately not `expo.out`, which front-loads roughly
 * two thirds of the movement into the first fifth of the duration and reads
 * as a snap followed by drift. This keeps speed through the middle of the
 * move, which is what makes a heavy object feel like it is gliding.
 */
export const TRANSITION_EASE = EASE.outQuart;

export interface TransitionContext {
  fromIndex: number;
  toIndex: number;
  /** +1 when advancing, -1 when going back. Lets participants move with it. */
  direction: number;
  /** Seconds. */
  duration: number;
  ease: string;
}

/**
 * Something that animates alongside a product change.
 *
 * Receives the *same* timeline the stage is tweened on, so anything added
 * here shares one clock and one easing family — that is what stops the hero
 * reading as several separate animations that happen to fire together.
 *
 * `timeline` is null when the change must be instant (reduced motion). A
 * participant must then apply its end state directly.
 */
export type TransitionParticipant = (
  timeline: gsap.core.Timeline | null,
  context: TransitionContext,
) => void;

const participants = new Set<TransitionParticipant>();

/** Returns an unregister function. */
export function registerTransitionParticipant(
  participant: TransitionParticipant,
): () => void {
  participants.add(participant);
  return () => {
    participants.delete(participant);
  };
}

let timeline: gsap.core.Timeline | null = null;

export interface ProductTransitionOptions {
  targetPosition: number;
  fromIndex: number;
  toIndex: number;
  /** Product count, used to resolve the shortest direction of travel. */
  total: number;
  duration?: number;
  /** Skip the animation entirely — reduced motion. */
  immediate?: boolean;
}

/**
 * The one and only way a product change is animated.
 *
 * Every input — prev/next, keyboard, the product list, drag, swipe and
 * scroll — arrives here, so there is a single implementation, a single
 * duration and a single curve.
 *
 * It builds one timeline: the stage scalar at position 0, then every
 * registered participant. Because the 3D scene derives product position,
 * depth, scale, rotation, opacity, lighting, glow and floor reflection from
 * that one scalar, all of them are already synchronised by construction —
 * only the DOM pieces need to join the timeline.
 *
 * Re-entrant: a new call kills the running timeline and continues from
 * wherever the stage currently is, so interrupting a transition never jumps.
 */
export function runProductTransition(options: ProductTransitionOptions): void {
  timeline?.kill();
  timeline = null;

  const duration = options.duration ?? TRANSITION_DURATION;
  const context: TransitionContext = {
    fromIndex: options.fromIndex,
    toIndex: options.toIndex,
    direction: Math.sign(wrapOffset(options.toIndex, options.fromIndex, options.total)),
    duration,
    ease: TRANSITION_EASE,
  };

  if (options.immediate) {
    heroStage.position = options.targetPosition;
    for (const participant of participants) participant(null, context);
    return;
  }

  const next = gsap.timeline({
    defaults: { duration, ease: TRANSITION_EASE },
    onComplete: () => {
      timeline = null;
    },
  });

  next.to(heroStage, { position: options.targetPosition, overwrite: true }, 0);
  for (const participant of participants) participant(next, context);

  timeline = next;
}

/**
 * Eases the stage back onto a product without changing which one is active.
 *
 * Used when a drag is released short of the commit threshold: the product has
 * not changed, so running the product transition would make the copy flicker
 * out and back for no reason. Same curve, so it feels like the same system.
 */
export function settleStage(target: number, duration = 0.55): void {
  timeline?.kill();
  timeline = null;

  gsap.to(heroStage, {
    position: target,
    duration,
    ease: TRANSITION_EASE,
    overwrite: true,
  });
}

/** Stops any running transition. Call on unmount. */
export function killProductTransition(): void {
  timeline?.kill();
  timeline = null;
}

/** True while a product transition is playing. */
export function isTransitioning(): boolean {
  return timeline !== null;
}

/* ---------------------------------------------------------------------------
 * Focus — hero to product detail.
 *
 * A separate timeline from the product transition above, because it is a
 * different move: that one slides the carousel, this one takes it apart. It
 * shares the philosophy though — one scalar, every object deriving itself
 * from it, nothing tweened per object.
 * ------------------------------------------------------------------------ */

let focusTimeline: gsap.core.Timeline | null = null;

export interface FocusTransitionOptions {
  index: number;
  total: number;
  /** Stage position at the moment of selection, for reading the visual row. */
  position: number;
  immediate?: boolean;
  /**
   * Somewhere to hang the DOM side of the move — the hero UI leaving, the
   * detail copy arriving. Built in the *opening* direction only; the return
   * plays the same tweens backwards.
   */
  attach?: (timeline: gsap.core.Timeline | null) => void;
  onComplete?: () => void;
  /** Fires when the return has finished and the hero is whole again. */
  onReturned?: () => void;
}

/**
 * Opens a product into detail.
 *
 * Builds the timeline once and plays it forwards. `releaseFocus` then runs
 * the same instance in reverse rather than composing an opposite move, which
 * is what makes the return an exact rewind: every value retraces the curve it
 * came along, and there is no second set of numbers to keep in step with the
 * first.
 *
 * The stage half is already reversible by construction — it is one scalar,
 * and every product derives its own transform from it, so there is nothing
 * to invert. This extends the same guarantee to the DOM half.
 */
export function runFocusTransition(options: FocusTransitionOptions): void {
  focusTimeline?.kill();
  focusTimeline = null;

  heroStage.focusIndex = options.index;
  heroStage.exitSigns = planExit(options.index, options.position, options.total);

  if (options.immediate) {
    heroStage.focus = 1;
    options.attach?.(null);
    options.onComplete?.();
    return;
  }

  const next = gsap.timeline({
    onComplete: options.onComplete,
    onReverseComplete: () => {
      focusTimeline = null;
      // Held until the very end: the returning products need it while they
      // travel back in from the sides.
      heroStage.focusIndex = -1;
      heroStage.exitSigns = [];
      options.onReturned?.();
    },
  });

  next.to(
    heroStage,
    {
      focus: 1,
      duration: FOCUS_DURATION,
      // Linear on purpose. Every part of the move applies its own easing
      // over its own window — see lib/hero/focus.ts — and those windows
      // unwind correctly when the timeline is played backwards.
      ease: "none",
      overwrite: true,
    },
    0,
  );

  options.attach?.(next);
  focusTimeline = next;
}

/**
 * Returns to the hero, by rewinding the move that got here.
 *
 * `reverse()` rather than a second timeline: the can retraces its exact
 * path, angle and scale, the statement comes back the way it left, and the
 * side products travel in along the lines they went out on.
 */
export function releaseFocus(options: {
  immediate?: boolean;
  onReturned?: () => void;
}): void {
  if (options.immediate || !focusTimeline) {
    focusTimeline?.kill();
    focusTimeline = null;
    heroStage.focus = 0;
    heroStage.focusIndex = -1;
    heroStage.exitSigns = [];
    options.onReturned?.();
    return;
  }

  if (options.onReturned) {
    const previous = focusTimeline.eventCallback("onReverseComplete");
    focusTimeline.eventCallback("onReverseComplete", () => {
      (previous as (() => void) | null)?.();
      options.onReturned?.();
    });
  }

  focusTimeline.reverse();
}

/**
 * True while the focus move is playing, in either direction.
 *
 * Inputs read this and stand down: a wheel gesture arriving mid-transition
 * would otherwise be able to start the return before the opening has landed.
 */
export function isFocusTransitioning(): boolean {
  return focusTimeline !== null && focusTimeline.isActive();
}

/** Stops a running focus move. Call on unmount. */
export function killFocusTransition(): void {
  focusTimeline?.kill();
  focusTimeline = null;
}
