import { ShieldHalf } from 'lucide-react';
import { NinjaAvatar } from './NinjaAvatar';
import type { Employee } from '../types';

const SIZE_PX: Record<'sm' | 'md', number> = { sm: 44, md: 64 };

interface ChatPersonAvatarProps {
  /** employees行に紐づく相手の場合はEmployeeを渡す。マネージャー(employees行なし)ならundefined。 */
  employee?: Employee;
  size?: 'sm' | 'md';
}

/** チャット用のアバター。マネージャーはemployees行を持たないため、忍者アバターの代わりに固定アイコンを表示する。 */
export function ChatPersonAvatar({ employee, size = 'sm' }: ChatPersonAvatarProps) {
  if (employee) return <NinjaAvatar employee={employee} mood="neutral" size={size} />;
  const px = SIZE_PX[size];
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold"
      style={{ width: px, height: px }}
    >
      <ShieldHalf size={px * 0.45} />
    </div>
  );
}
