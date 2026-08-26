import type { FacilityId, FacilityMeta } from '../types';

export const FACILITIES: Record<FacilityId, FacilityMeta> = {
  goods: {
    id: 'goods',
    name: '忍具屋',
    shortName: '忍具屋',
    description: 'お土産・グッズ販売',
  },
  amuse: {
    id: 'amuse',
    name: '修行アトラクション',
    shortName: '修行場',
    description: '手裏剣投げ・忍者迷路など',
  },
  cafe: {
    id: 'cafe',
    name: '忍者茶屋',
    shortName: '茶屋',
    description: '飲食・休憩処',
  },
};

export const FACILITY_ORDER: FacilityId[] = ['goods', 'amuse', 'cafe'];

export const FACILITY_COLOR: Record<FacilityId, string> = {
  goods: '#b6924f',
  amuse: '#3d5a3a',
  cafe: '#8a6d4a',
};
