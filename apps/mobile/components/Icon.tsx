import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { iconSizes } from '@/constants/theme';
import { useTheme } from '@/lib/theme';

export type IconName = ComponentProps<typeof Feather>['name'];

/** Thin, monochrome, outline icons. Defaults to 20px in the current muted tone. */
export function Icon({ name, size = iconSizes.md, color }: { name: IconName; size?: number; color?: string }) {
  const { colors } = useTheme();
  return <Feather name={name} size={size} color={color ?? colors.textSecondary} />;
}
