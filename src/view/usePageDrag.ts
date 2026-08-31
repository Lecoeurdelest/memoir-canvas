/**
 * TASK-035 — a pointer gesture becomes a page turn.
 *
 * `FR-BOOK-08` removed every visible turn control, so this is the only pointer route through the
 * book and it has to be right. The arithmetic is pure and exported, because the interesting part
 * — how far is far enough, and which way is forward — is exactly what a DOM-less test can pin.
 *
 * R5: reports a gesture. It never decides whether the turn is allowed; that stays with the wedge
 * in `useSpreadNavigation`.
 */

import { useCallback, useRef, useState } from 'react';

/**
 * Half the page must be crossed before the leaf commits. Lower and the book turns when a reader
 * only meant to scroll past it; higher and it feels stuck.
 */
export const COMMIT_AT = 0.42;

/** Signed −1…1. Dragging LEFT is negative and turns forward, the way a right-hand page does. */
export function progressOf(dx: number, width: number): number {
  if (width <= 0) return 0;
  return Math.max(-1, Math.min(1, dx / (width / 2)));
}

export function commits(progress: number): boolean {
  return Math.abs(progress) >= COMMIT_AT;
}

/** Forward when the page was pulled leftward across the gutter. */
export function directionOf(progress: number): 1 | -1 {
  return progress < 0 ? 1 : -1;
}

/** Degrees the lifted leaf is rotated for a given progress. Negative progress lifts it forward. */
export function angleOf(progress: number): number {
  return -progress * 168;
}

/** A quarter of the book's height, pulled down, closes it. */
export const CLOSE_AT = 0.25;

/**
 * Whether a gesture was a page turn or the book being shut.
 *
 * The test is which way the hand travelled FURTHEST, not which crossed a line first: a downward
 * drag always drifts sideways a little, and without this a shut book would sometimes turn a page
 * on its way closed.
 */
export function isPullDown(dx: number, dy: number, height: number): boolean {
  if (height <= 0) return false;
  return dy > Math.abs(dx) && dy / height >= CLOSE_AT;
}

export interface PageDrag {
  /** −1…1 while a finger is down, 0 at rest. */
  progress: number;
  dragging: boolean;
  bind: {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerCancel: (e: React.PointerEvent<HTMLElement>) => void;
  };
}

export function usePageDrag(
  turn: (direction: 1 | -1) => void,
  /** Pulling the book down shuts it (FR-BOOK-08). Omit and a downward drag does nothing. */
  pullDown?: () => void,
): PageDrag {
  const from = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const [progress, setProgress] = useState(0);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    // A drag that starts on a control is that control's business, not the book's.
    if ((e.target as HTMLElement).closest('button, select, input, a')) return;
    const box = e.currentTarget.getBoundingClientRect();
    from.current = { x: e.clientX, y: e.clientY, width: box.width, height: box.height };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (!from.current) return;
    const { x, y, width, height } = from.current;
    // A shutting gesture must not also lift a page on the way down.
    if (isPullDown(e.clientX - x, e.clientY - y, height)) return setProgress(0);
    setProgress(progressOf(e.clientX - x, width));
  }, []);

  const release = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!from.current) return;
      const { x, y, width, height } = from.current;
      const dx = e.clientX - x;
      const settled = progressOf(dx, width);
      from.current = null;
      setProgress(0);

      if (pullDown && isPullDown(dx, e.clientY - y, height)) return pullDown();
      if (commits(settled)) turn(directionOf(settled));
    },
    [turn, pullDown],
  );

  return {
    progress,
    dragging: from.current !== null,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp: release,
      onPointerCancel: release,
    },
  };
}
