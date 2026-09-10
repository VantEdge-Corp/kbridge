import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/constants/theme';

interface Props<K extends string> {
  items: ReadonlyArray<{ key: K; label: string; badge?: number }>;
  value: K;
  onChange: (key: K) => void;
}

/** Text tabs, 14px medium, 20px apart. The active tab is ivory with a 2px underline that hugs the label. */
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
  row: { paddingHorizontal: spacing.lg, gap: 20 },
  tab: { paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1, flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 },
  tabSelected: { borderBottomColor: colors.ivory },
  label: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  labelSelected: { color: colors.ivory },
  badge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { fontSize: 11, color: colors.text, fontWeight: '600' },
});
