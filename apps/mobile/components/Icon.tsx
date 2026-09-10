import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { colors, iconSizes } from '@/constants/theme';

export type IconName = ComponentProps<typeof Feather>['name'];

/** Thin, monochrome, outline icons. Defaults to 20px in the current muted tone. */
export function Icon({ name, size = iconSizes.md, color = colors.textSecondary }: { name: IconName; size?: number; color?: string }) {
  return <Feather name={name} size={size} color={color} />;
}
