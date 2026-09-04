import { ArrowLeftRight, Frown, Meh, Moon, Smile } from 'lucide-react';
import { generateNinjaAvatar } from '../lib/avatar';
import { FACILITY_COLOR } from '../data/facilities';
import { MOOD_COLOR } from '../lib/mood';
import { useLabelContext } from '../hooks/LabelContext';
import type { Employee, FacilityId, Mood } from '../types';

const MOOD_ICON: Record<Mood, typeof Smile> = {
  happy: Smile,
  neutral: Meh,
  tired: Moon,
  unhappy: Frown,
};

const SIZE_PX: Record<'sm' | 'md' | 'lg', number> = {
  sm: 44,
  md: 64,
  lg: 92,
};

interface NinjaAvatarProps {
  employee: Employee;
  mood: Mood;
  facility?: FacilityId;
  size?: 'sm' | 'md' | 'lg';
  title?: string;
}

export function NinjaAvatar({ employee, mood, facility, size = 'md', title }: NinjaAvatarProps) {
  const { employeeName, facilityName, t } = useLabelContext();
  const px = SIZE_PX[size];
  const dataUri = generateNinjaAvatar(employee.avatarBase, mood, {
    top: employee.avatarTop,
    skinColor: employee.avatarSkinColor,
    glasses: employee.avatarGlasses,
  });
  const MoodIcon = MOOD_ICON[mood];
  const isHelping = facility && facility !== employee.mainFacility;
  const backgroundColor = FACILITY_COLOR[facility ?? employee.mainFacility];

  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: px }}>
      <div
        className="relative rounded-full transition-shadow duration-300"
        style={{
          width: px,
          height: px,
          boxShadow: `0 0 0 3px ${MOOD_COLOR[mood]}, 0 0 14px 1px ${MOOD_COLOR[mood]}55`,
        }}
        title={title}
      >
        <div
          className="h-full w-full overflow-hidden rounded-full"
          style={{ backgroundColor }}
        >
          <img src={dataUri} alt={employeeName(employee)} width={px} height={px} className="h-full w-full" />
        </div>

        {/* 表情アイコンバッジ */}
        <div
          className="absolute bottom-0 right-0 flex items-center justify-center rounded-full border-2 border-void"
          style={{
            width: px * 0.36,
            height: px * 0.36,
            background: MOOD_COLOR[mood],
          }}
        >
          <MoodIcon size={px * 0.22} strokeWidth={2.5} color="#0a0d12" />
        </div>

        {/* 応援(掛け持ち)バッジ */}
        {isHelping && (
          <div
            className="absolute left-0 top-0 flex items-center justify-center rounded-full border-2 border-void bg-void"
            style={{ width: px * 0.34, height: px * 0.34 }}
            title={t('avatar.helpBadgeTitle', { facility: facilityName(employee.mainFacility) })}
          >
            <ArrowLeftRight size={px * 0.2} strokeWidth={2.5} color="var(--color-gold)" />
          </div>
        )}
      </div>
    </div>
  );
}
