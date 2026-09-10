import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/constants/theme';

interface Props<K extends string> {
  items: ReadonlyArray<{ key: K; label: string; badge?: number }>;
  value: K;
  onChange: (key: K) => void;
}

/** Text tabs: selected is ivory with a 1px ivory underline, others muted. */
export function SegmentedTabs<K extends string>({ items, value, onChange }: Props<K>) {
  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map((item) => {
          const selected = item.key === value;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => onChange(item.key)}
              style={[styles.tab, selected && styles.tabSelected]}
            >
              <Text style={[styles.label, selected && styles.labelSelected]}>{item.label}</Text>
              {item.badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge > 99 ? '99+' : item.badge}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderBottomWidth: 1, borderBottomColor: colors.border },
  row: { paddingHorizontal: spacing.lg, gap: spacing.xl },
  tab: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'transparent', marginBottom: -1, flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 },
  tabSelected: { borderBottomColor: colors.ivory },
  label: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  labelSelected: { color: colors.ivory },
  badge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.ivory, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { fontSize: 10, color: colors.onIvory, fontWeight: '600' },
});
