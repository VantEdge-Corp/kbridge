import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, text } from '@/constants/theme';

export function SectionHeader({ title, right, style }: { title: string; right?: React.ReactNode; style?: object }) {
  return (
    <View style={[styles.row, style]}>
      <Text style={text.eyebrow}>{title}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.sm },
});
