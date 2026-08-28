import { useEffect, useRef } from 'react';

const EDGE_SIZE = 90;
const MAX_SPEED = 22;

/**
 * ドラッグ中にポインターが画面の上端/下端に近づいたら、ページを自動的にスクロールする。
 * 従業員一覧やシフト表が縦長になったとき、離れた場所までドラッグする操作を助ける。
 */
export function useAutoScrollOnDrag() {
  const rafIdRef = useRef<number | null>(null);
  const velocityRef = useRef(0);

  useEffect(() => {
    function stop() {
      velocityRef.current = 0;
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    }

    function tick() {
      if (velocityRef.current === 0) {
        rafIdRef.current = null;
        return;
      }
      window.scrollBy(0, velocityRef.current);
      rafIdRef.current = requestAnimationFrame(tick);
    }

    function handleDragOver(e: DragEvent) {
      const y = e.clientY;
      const { innerHeight } = window;
      if (y < EDGE_SIZE) {
        velocityRef.current = -MAX_SPEED * (1 - y / EDGE_SIZE);
      } else if (y > innerHeight - EDGE_SIZE) {
        velocityRef.current = MAX_SPEED * (1 - (innerHeight - y) / EDGE_SIZE);
      } else {
        velocityRef.current = 0;
      }
      if (velocityRef.current !== 0 && rafIdRef.current == null) {
        rafIdRef.current = requestAnimationFrame(tick);
      }
    }

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragend', stop);
    window.addEventListener('drop', stop);
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragend', stop);
      window.removeEventListener('drop', stop);
      stop();
    };
  }, []);
}
