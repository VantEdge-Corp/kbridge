import { Switch as NativeSwitch, type SwitchProps } from 'react-native';
import { useTheme } from '@/lib/theme';

/** The platform switch in shadcn/ui's colors: `primary` when on, `input` when off. */
export function Switch(props: Omit<SwitchProps, 'trackColor' | 'thumbColor' | 'ios_backgroundColor'>) {
  const { colors, isDark } = useTheme();
  const off = isDark ? colors.muted : colors.input;
  return (
    <NativeSwitch
      trackColor={{ true: colors.primary, false: off }}
      ios_backgroundColor={off}
      thumbColor={props.value ? colors.primaryForeground : isDark ? colors.foreground : colors.background}
      {...props}
    />
  );
}
