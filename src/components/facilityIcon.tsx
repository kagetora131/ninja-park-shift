import { Coffee, ShoppingBag, Swords } from 'lucide-react';
import type { FacilityId } from '../types';

export const FACILITY_ICON: Record<FacilityId, typeof Swords> = {
  goods: ShoppingBag,
  amuse: Swords,
  cafe: Coffee,
};
