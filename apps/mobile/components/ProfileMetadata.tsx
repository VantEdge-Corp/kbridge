import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, text } from '@/constants/theme';
import { ChipRow, TagChip } from './TagChip';

export function MetaRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={[text.caption, styles.label]}>{label}</Text>
      <Text style={[text.body, styles.value]}>{value}</Text>
    </View>
  );
}

export function MetaChips({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <View style={styles.row}>
      <Text style={[text.caption, styles.label]}>{label}</Text>
      <View style={styles.value}>
        <ChipRow>
          {items.map((i) => (
            <TagChip key={i} label={i} />
          ))}
        </ChipRow>
      </View>
    </View>
  );
}

export function MetaSection({ title, children }: { title: string; children: React.ReactNode }) {
  const kids = React.Children.toArray(children).filter(Boolean);
  if (kids.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={[text.eyebrow, styles.sectionTitle]}>{title}</Text>
      {kids}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: spacing.md },
  sectionTitle: { marginBottom: 2 },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  label: { width: 92, paddingTop: 3 },
  value: { flex: 1 },
});
