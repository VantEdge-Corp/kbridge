import { Pressable, StyleSheet, Text, View } from 'react-native';
import { alpha, radius, spacing } from '@/constants/theme';
import { useStyles, type Theme } from '@/lib/theme';

interface Props<K extends string> {
  items: ReadonlyArray<{ key: K; label: string; badge?: number }>;
  value: K;
  onChange: (key: K) => void;
}

/**
 * shadcn/ui's Tabs list across the screen: a `muted` track with the chosen
 * segment lifted onto `background` (in dark, `input` at 30% with an `input`
 * border). Counts are small pills, filled when their tab is active.
 */
export function SegmentedTabs<K extends string>({ items, value, onChange }: Props<K>) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {items.map((item) => {
        const selected = item.key === value;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={item.badge ? `${item.label}, ${item.badge}` : item.label}
            onPress={() => onChange(item.key)}
            style={[styles.tab, selected && styles.tabSelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
              {item.label}
            </Text>
            {item.badge ? (
              <View style={[styles.badge, selected && styles.badgeSelected]}>
                <Text style={[styles.badgeText, selected && styles.badgeTextSelected]}>{item.badge > 99 ? '99+' : item.badge}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = ({ colors, isDark }: Theme) =>
  StyleSheet.create({
    track: { flexDirection: 'row', marginHorizontal: spacing.lg, padding: 3, height: 40, borderRadius: radius.lg, backgroundColor: colors.muted },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: 'transparent',
      paddingHorizontal: 8,
    },
    tabSelected: isDark
      ? { backgroundColor: colors.inputBackground, borderColor: colors.input }
      : { backgroundColor: colors.background, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
    label: { fontSize: 14, fontWeight: '500', color: isDark ? colors.mutedForeground : alpha(colors.foreground, 0.6) },
    labelSelected: { color: colors.foreground },
    badge: { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(colors.foreground, 0.1) },
    badgeSelected: { backgroundColor: colors.primary },
    badgeText: { fontSize: 11, fontWeight: '600', color: colors.foreground },
    badgeTextSelected: { color: colors.primaryForeground },
  });
