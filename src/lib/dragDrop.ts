import type { FacilityId } from '../types';

/** シフト表のドラッグ&ドロップで使うdataTransferのMIMEタイプ。 */
export const SHIFT_DRAG_MIME = 'application/x-ninja-shift-drag';

/**
 * ドラッグ中のペイロード。
 * - facility: 従業員行の「対応可能施設バッジ」をドラッグ中(その従業員の新規配置を作る)
 * - shift: 既存の配置セルをドラッグ中(別の日付・従業員へ移動、または既存配置と入れ替え)
 */
export type ShiftDragPayload =
  | { kind: 'facility'; employeeId: string; facility: FacilityId }
  | { kind: 'shift'; shiftId: string };

export function setShiftDragPayload(e: React.DragEvent, payload: ShiftDragPayload) {
  e.dataTransfer.setData(SHIFT_DRAG_MIME, JSON.stringify(payload));
  e.dataTransfer.effectAllowed = 'move';
}

export function readShiftDragPayload(e: React.DragEvent): ShiftDragPayload | null {
  const raw = e.dataTransfer.getData(SHIFT_DRAG_MIME);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ShiftDragPayload;
  } catch {
    return null;
  }
}
