import { useEffect, useMemo, useRef } from "react";

/**
 * Drag-to-multi-select range fill. Bind the returned handlers to each
 * cell button with `bind(item)`.
 *
 * Behavior — modeled after spreadsheet cell selection:
 *
 *   - `pointerdown` snapshots the cell's current state, records it as
 *     the drag anchor, and decides the drag mode (anchor was selected
 *     → unselect mode; anchor was unselected → select mode). No state
 *     change happens yet.
 *   - `pointerenter` on any cell expands the drag to the *entire range*
 *     between the anchor and the entered cell (via `items` order). Every
 *     cell in that range is set to the drag mode; any cell that was in
 *     the previous drag range but isn't in the new one is reverted to
 *     its pre-drag state from the snapshot.
 *   - `pointerup` on the anchor with no drag detected runs `onTap`,
 *     leaving existing tap behavior (anchor-fill, etc.) untouched.
 *
 * Pointer capture is released on down so cross-cell `pointerenter`
 * fires on touch devices. Global `pointerup` / `pointercancel`
 * terminate the drag without reverting cells.
 */
export function useDragSelect<T>({
  items,
  getKey = (x) => x as unknown as string | number,
  isSelected,
  onTap,
  setItem,
}: {
  /** Ordered list of grid items, in visual order. */
  items: T[];
  /** Stable id for an item (defaults to identity — fine for primitives). */
  getKey?: (item: T) => string | number;
  isSelected: (item: T) => boolean;
  /** Plain tap on a cell with no drag — runs anchor-fill / toggle logic. */
  onTap: (item: T) => void;
  /** Direct selection setter, called per affected cell during a drag. */
  setItem: (item: T, selected: boolean) => void;
}) {
  const idxByKey = useMemo(() => {
    const m = new Map<string | number, number>();
    items.forEach((it, i) => m.set(getKey(it), i));
    return m;
  }, [items, getKey]);

  const dragRef = useRef<{
    anchorItem: T;
    anchorIdx: number;
    mode: boolean; // target selected state for cells in the drag range
    snapshot: Map<string | number, boolean>; // pre-drag state per touched cell
    lastRange: T[];
    dragged: boolean;
  } | null>(null);

  // Pointerup outside any bound cell ends the drag without reverting.
  useEffect(() => {
    const handler = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointerup", handler);
    window.addEventListener("pointercancel", handler);
    return () => {
      window.removeEventListener("pointerup", handler);
      window.removeEventListener("pointercancel", handler);
    };
  }, []);

  return (item: T) => ({
    onPointerDown: (e: React.PointerEvent) => {
      // Release the implicit pointer capture so cross-cell pointerenter
      // events actually fire on touch devices.
      const target = e.currentTarget as Element & {
        releasePointerCapture?: (id: number) => void;
      };
      if (target.releasePointerCapture) {
        try {
          target.releasePointerCapture(e.pointerId);
        } catch {
          // Some platforms throw if capture isn't held — safe to ignore.
        }
      }
      const idx = idxByKey.get(getKey(item)) ?? -1;
      if (idx === -1) return;
      const wasSelected = isSelected(item);
      dragRef.current = {
        anchorItem: item,
        anchorIdx: idx,
        mode: !wasSelected,
        snapshot: new Map([[getKey(item), wasSelected]]),
        lastRange: [],
        dragged: false,
      };
    },
    onPointerEnter: () => {
      const s = dragRef.current;
      if (!s) return;
      const idx = idxByKey.get(getKey(item));
      if (idx === undefined) return;

      const lo = Math.min(s.anchorIdx, idx);
      const hi = Math.max(s.anchorIdx, idx);
      const newRange = items.slice(lo, hi + 1);
      const newKeys = new Set(newRange.map(getKey));

      // The drag has crossed cells — mark it so onPointerUp won't run
      // tap behavior, even if we eventually end up back on the anchor.
      if (newRange.length > 1 || idx !== s.anchorIdx) s.dragged = true;

      // Apply mode to every cell in the new range; snapshot original
      // state the first time each cell is touched.
      for (const it of newRange) {
        const key = getKey(it);
        if (!s.snapshot.has(key)) s.snapshot.set(key, isSelected(it));
        setItem(it, s.mode);
      }
      // Revert cells that dropped out of the range to their pre-drag
      // state. Cells outside both the old and new range are left alone.
      for (const it of s.lastRange) {
        const key = getKey(it);
        if (!newKeys.has(key)) {
          setItem(it, s.snapshot.get(key) ?? false);
        }
      }
      s.lastRange = newRange;
    },
    onPointerUp: () => {
      const s = dragRef.current;
      dragRef.current = null;
      if (!s) return;
      if (!s.dragged) onTap(s.anchorItem);
    },
  });
}
