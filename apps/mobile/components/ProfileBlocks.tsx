import { Image } from 'expo-image';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { fonts, radius, spacing } from '@/constants/theme';
import { useStyles, useTheme, type Theme } from '@/lib/theme';
import { Icon, type IconName } from './Icon';
import { MonogramPortrait } from './MonogramPortrait';

/** Profile photos are inset 16px, 4:5, radius lg, with the hairline ring. */
export const PROFILE_PHOTO_ASPECT = 4 / 5;

export function ProfilePhoto({ uri, firstName, index, width }: { uri: string | null; firstName: string; index: number; width: number }) {
  const styles = useStyles(makeStyles);
  const height = Math.round(width / PROFILE_PHOTO_ASPECT);
  if (!uri) return <MonogramPortrait firstName={firstName} width={width} height={height} radius={radius.lg} style={styles.block} />;
  return (
    <View style={[styles.photoFrame, styles.block, { width, height }]}>
      <Image source={{ uri }} style={{ width, height }} contentFit="cover" transition={150} accessibilityLabel={`${firstName}'s photo ${index + 1}`} />
    </View>
  );
}

/** The bio as an editorial pull-quote: an eyebrow and Georgia 20/28 on a surface card. */
export function PullQuote({ eyebrow, children }: { eyebrow: string; children: string }) {
  const styles = useStyles(makeStyles);
  const { text } = useTheme();
  return (
    <View style={[styles.card, styles.block, styles.quote]}>
      <Text style={text.eyebrow}>{eyebrow}</Text>
      <Text style={styles.quoteText}>{children}</Text>
    </View>
  );
}

/** A surface card that holds a note written to the viewer. */
export function NoteCard({ eyebrow, children }: { eyebrow: string; children: string }) {
  const styles = useStyles(makeStyles);
  const { text } = useTheme();
  return (
    <View style={[styles.card, styles.block, styles.note]}>
      <Text style={text.eyebrow}>{eyebrow}</Text>
      <Text style={text.body}>{children}</Text>
    </View>
  );
}

export interface Vital {
  icon: IconName;
  value: string;
  /** Accessibility name for the value, e.g. "Height". */
  label: string;
}

/** One horizontally scrolling surface card of icon + value items with vertical hairlines between them. */
export function VitalsStrip({ items }: { items: Vital[] }) {
  const styles = useStyles(makeStyles);
  const { colors, text } = useTheme();
  if (items.length === 0) return null;
  return (
    <View style={[styles.card, styles.block]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vitalsRow}>
        {items.map((item, i) => (
          <React.Fragment key={item.label}>
            {i > 0 ? <View style={styles.vitalDivider} /> : null}
            <View style={styles.vital} accessibilityLabel={`${item.label}: ${item.value}`}>
              <Icon name={item.icon} size={18} color={colors.textSecondary} />
              <Text style={text.body}>{item.value}</Text>
            </View>
          </React.Fragment>
        ))}
      </ScrollView>
    </View>
  );
}

/** An icon row for the details group. The label is only spoken, never drawn. */
export function DetailRow({ icon, value, label }: { icon: IconName; value: string | null | undefined; label: string }) {
  const styles = useStyles(makeStyles);
  const { colors, text } = useTheme();
  if (!value) return null;
  return (
    <View style={styles.detail} accessibilityLabel={`${label}: ${value}`}>
      <Icon name={icon} size={18} color={colors.textSecondary} />
      <Text style={[text.body, styles.detailValue]}>{value}</Text>
    </View>
  );
}

/** Eyebrow plus content, 32px above. */
export function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  const styles = useStyles(makeStyles);
  const { text } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={text.eyebrow}>{title}</Text>
      {children}
    </View>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  block: { marginHorizontal: spacing.lg },
  photoFrame: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.imageRing,
  },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg },
  quote: { padding: 20, gap: spacing.md },
  quoteText: { fontFamily: fonts.display, fontSize: 20, lineHeight: 28, color: colors.ivory },
  note: { padding: spacing.lg, gap: spacing.sm },
  vitalsRow: { alignItems: 'center' },
  vital: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, minHeight: 52 },
  vitalDivider: { width: 1, alignSelf: 'stretch', marginVertical: spacing.md, backgroundColor: colors.border },
  detail: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: 14, minHeight: 52 },
  detailValue: { flex: 1 },
  section: { marginHorizontal: spacing.lg, marginTop: spacing.lg, gap: spacing.md },
});
