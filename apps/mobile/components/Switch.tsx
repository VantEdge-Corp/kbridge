import { useEffect, useState } from 'react';
import { Platform, Switch as NativeSwitch, type SwitchProps } from 'react-native';
import { useTheme } from '@/lib/theme';

/**
 * The platform switch in shadcn/ui's colors: `primary` when on, `input` when
 * off, with a `primary-foreground` thumb when on (dark on light in dark mode).
 */
export function Switch(props: Omit<SwitchProps, 'trackColor' | 'thumbColor' | 'ios_backgroundColor'>) {
  const { colors, isDark } = useTheme();
  // iOS 26 drops a thumb color set before the switch is on screen and draws the
  // default white thumb instead, so the color goes on a frame after mount; later
  // changes (toggling, a theme switch) apply directly.
  const [onScreen, setOnScreen] = useState(Platform.OS !== 'ios');
  useEffect(() => {
    if (onScreen) return;
    const frame = requestAnimationFrame(() => setOnScreen(true));
    return () => cancelAnimationFrame(frame);
  }, [onScreen]);
  const off = isDark ? colors.muted : colors.input;
  const thumb = props.value ? colors.primaryForeground : isDark ? colors.foreground : colors.background;
  return <NativeSwitch trackColor={{ true: colors.primary, false: off }} ios_backgroundColor={off} thumbColor={onScreen ? thumb : undefined} {...props} />;
}
