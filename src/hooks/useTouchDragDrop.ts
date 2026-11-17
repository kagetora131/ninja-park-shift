import { useEffect, useRef, useState, type RefObject } from 'react';
import type { ShiftDragPayload } from '../lib/dragDrop';

/**
 * スマホ(タッチ)のドラッグ&ドロップ。HTML5のdraggableは指では動かないため、タッチイベントで作る。
 *
 * - ドラッグできる部品には data-dnd="staff"(data-employee-id) か data-dnd="shift"(data-shift-id) を付ける
 *   (data-dnd-label は、ドラッグ中に指のそばに出す名前)
 * - 落とせるマスには data-drop-cell と data-employee-id・data-date を付ける
 * - 表のスクロール枠には data-dnd-scroll を付ける(ドラッグ中に端へ寄せると、自動でスクロールする)
 * - 長押し(約0.3秒)してからドラッグが始まる。すぐ指を動かしたときは、今までどおりのスクロールになる
 */
const LONG_PRESS_MS = 320;
const MOVE_CANCEL_PX = 10;
const EDGE_PX = 48;
const MAX_SCROLL_PX = 14;

export interface DropTarget {
  employeeId: string;
  date: string;
}

export interface TouchGhost {
  x: number;
  y: number;
  label: string;
}

interface Options {
  containerRef: RefObject<HTMLElement | null>;
  /** 落としたとき。target はマスの持ち主(従業員)と日付 */
  onDrop: (payload: ShiftDragPayload, target: DropTarget) => void;
  /** いま指の下にあるマスの印(`${employeeId}_${date}`)。無ければ null */
  onHover: (cellKey: string | null) => void;
}

function payloadFrom(el: HTMLElement): ShiftDragPayload | null {
  const kind = el.dataset.dnd;
  if (kind === 'staff' && el.dataset.employeeId) return { kind: 'staff', employeeId: el.dataset.employeeId };
  if (kind === 'shift' && el.dataset.shiftId) return { kind: 'shift', shiftId: el.dataset.shiftId };
  return null;
}

function targetAt(x: number, y: number): DropTarget | null {
  const cell = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-drop-cell]');
  if (!cell?.dataset.employeeId || !cell.dataset.date) return null;
  return { employeeId: cell.dataset.employeeId, date: cell.dataset.date };
}

export function useTouchDragDrop({ containerRef, onDrop, onHover }: Options): { ghost: TouchGhost | null } {
  const [ghost, setGhost] = useState<TouchGhost | null>(null);
  // 最新の関数を、リスナーを付け直さずに使えるよう参照で持つ
  const onDropRef = useRef(onDrop);
  const onHoverRef = useRef(onHover);
  useEffect(() => {
    onDropRef.current = onDrop;
    onHoverRef.current = onHover;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let pending: { timer: number; x: number; y: number; payload: ShiftDragPayload; label: string } | null = null;
    let dragging: { payload: ShiftDragPayload; label: string } | null = null;
    let lastX = 0;
    let lastY = 0;
    let raf = 0;
    let suppressClickUntil = 0;

    const clearPending = () => {
      if (pending) window.clearTimeout(pending.timer);
      pending = null;
    };

    const stopDragging = () => {
      dragging = null;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      setGhost(null);
      onHoverRef.current(null);
    };

    // ドラッグ中、表の端へ寄せたら表を、画面の上下端へ寄せたらページを、自動でスクロールする
    const autoScroll = () => {
      if (!dragging) {
        raf = 0;
        return;
      }
      const box = container.querySelector<HTMLElement>('[data-dnd-scroll]');
      if (box) {
        const r = box.getBoundingClientRect();
        const inside = lastX >= r.left && lastX <= r.right && lastY >= r.top && lastY <= r.bottom;
        if (inside) {
          const ratio = (distance: number) => Math.max(0, 1 - distance / EDGE_PX);
          const dx = lastX < r.left + EDGE_PX ? -MAX_SCROLL_PX * ratio(lastX - r.left) : lastX > r.right - EDGE_PX ? MAX_SCROLL_PX * ratio(r.right - lastX) : 0;
          const dy = lastY < r.top + EDGE_PX ? -MAX_SCROLL_PX * ratio(lastY - r.top) : lastY > r.bottom - EDGE_PX ? MAX_SCROLL_PX * ratio(r.bottom - lastY) : 0;
          if (dx || dy) box.scrollBy(dx, dy);
        }
      }
      const vh = window.innerHeight;
      if (lastY < 64) window.scrollBy(0, -MAX_SCROLL_PX);
      else if (lastY > vh - 120) window.scrollBy(0, MAX_SCROLL_PX);
      const tgt = targetAt(lastX, lastY);
      onHoverRef.current(tgt ? `${tgt.employeeId}_${tgt.date}` : null);
      raf = requestAnimationFrame(autoScroll);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        clearPending();
        return;
      }
      const el = (e.target as Element).closest<HTMLElement>('[data-dnd]');
      if (!el) return;
      const payload = payloadFrom(el);
      if (!payload) return;
      const touch = e.touches[0];
      clearPending();
      const label = el.dataset.dndLabel ?? '';
      pending = {
        x: touch.clientX,
        y: touch.clientY,
        payload,
        label,
        timer: window.setTimeout(() => {
          if (!pending) return;
          dragging = { payload: pending.payload, label: pending.label };
          lastX = pending.x;
          lastY = pending.y;
          pending = null;
          setGhost({ x: lastX, y: lastY, label: dragging.label });
          if (typeof navigator.vibrate === 'function') navigator.vibrate(15);
          raf = requestAnimationFrame(autoScroll);
        }, LONG_PRESS_MS),
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      if (dragging) {
        // ドラッグ中は、画面が一緒に動かないようにする(長押しの後は、まだスクロールが始まっていない)
        if (e.cancelable) e.preventDefault();
        lastX = touch.clientX;
        lastY = touch.clientY;
        setGhost({ x: lastX, y: lastY, label: dragging.label });
        const tgt = targetAt(lastX, lastY);
        onHoverRef.current(tgt ? `${tgt.employeeId}_${tgt.date}` : null);
        return;
      }
      if (pending && Math.hypot(touch.clientX - pending.x, touch.clientY - pending.y) > MOVE_CANCEL_PX) {
        clearPending(); // 長押しになる前に動いた=スクロールしたい
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      clearPending();
      if (!dragging) return;
      const current = dragging;
      const touch = e.changedTouches[0];
      const target = e.type === 'touchend' && touch ? targetAt(touch.clientX, touch.clientY) : null;
      // 指を離したときに、そのマスの「押した」扱い(click)が起きないようにする
      if (e.cancelable) e.preventDefault();
      suppressClickUntil = Date.now() + 500;
      stopDragging();
      if (target) onDropRef.current(current.payload, target);
    };

    const onClickCapture = (e: MouseEvent) => {
      if (Date.now() < suppressClickUntil) {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    // 長押しで出る端末のメニュー・文字選択を止める(ドラッグの準備中・ドラッグ中だけ)
    const onContextMenu = (e: Event) => {
      if (pending || dragging) e.preventDefault();
    };

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: false });
    container.addEventListener('touchcancel', onTouchEnd, { passive: false });
    container.addEventListener('click', onClickCapture, true);
    container.addEventListener('contextmenu', onContextMenu);
    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
      container.removeEventListener('click', onClickCapture, true);
      container.removeEventListener('contextmenu', onContextMenu);
      clearPending();
      stopDragging();
    };
  }, [containerRef]);

  return { ghost };
}
