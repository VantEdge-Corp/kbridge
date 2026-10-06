import { Image } from 'expo-image';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ProfileFact } from '@peaches/core';
import { radius, spacing } from '@/constants/theme';
import { useStyles, useTheme, type Theme } from '@/lib/theme';
import { FACT_ICON, Icon } from './Icon';
import { MonogramPortrait } from './MonogramPortrait';

/** Profile photos are inset 16px, 4:5, radius xl, with the hairline ring. */
export const PROFILE_PHOTO_ASPECT = 4 / 5;

export function ProfilePhoto({ uri, firstName, index, width }: { uri: string | null; firstName: string; index: number; width: number }) {
  const styles = useStyles(makeStyles);
  const height = Math.round(width / PROFILE_PHOTO_ASPECT);
  if (!uri) return <MonogramPortrait firstName={firstName} width={width} height={height} radius={radius.xl} style={styles.block} />;
  return (
    <View style={[styles.photoFrame, styles.block, { width, height }]}>
      <Image source={{ uri }} style={{ width, height }} contentFit="cover" transition={150} accessibilityLabel={`${firstName}'s photo ${index + 1}`} />
    </View>
  );
}

/** The bio in a card: a small-caps label, then the text in the display serif, as on the web. */
export function PullQuote({ eyebrow, children }: { eyebrow: string; children: string }) {
  const styles = useStyles(makeStyles);
  const { text } = useTheme();
  return (
    <View style={[styles.card, styles.block, styles.quote]}>
      <Text style={text.eyebrow}>{eyebrow}</Text>
      <Text style={text.quote}>{children}</Text>
    </View>
  );
}

/** A card that holds a note written to the viewer. */
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

/** One horizontally scrolling card of icon and value items with vertical hairlines between them. */
export function VitalsStrip({ items }: { items: ReadonlyArray<ProfileFact> }) {
  const styles = useStyles(makeStyles);
  const { colors, text } = useTheme();
  if (items.length === 0) return null;
  return (
    <View style={[styles.card, styles.block]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vitalsRow}>
        {items.map((item, i) => (
          <React.Fragment key={item.kind}>
            {i > 0 ? <View style={styles.vitalDivider} /> : null}
            <View style={styles.vital} accessibilityLabel={`${item.label}: ${item.value}`}>
              <Icon name={FACT_ICON[item.kind]} size={18} color={colors.mutedForeground} />
              <Text style={text.body}>{item.value}</Text>
            </View>
          </React.Fragment>
        ))}
      </ScrollView>
    </View>
  );
}

/** An icon row for the details group. The label is only spoken, never drawn. */
export function DetailRow({ fact }: { fact: ProfileFact }) {
  const styles = useStyles(makeStyles);
  const { colors, text } = useTheme();
  return (
    <View style={styles.detail} accessibilityLabel={`${fact.label}: ${fact.value}`}>
      <Icon name={FACT_ICON[fact.kind]} size={18} color={colors.mutedForeground} />
      <Text style={[text.body, styles.detailValue]}>{fact.value}</Text>
    </View>
  );
}

/** A section title and its content, 16px above. */
export function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  const styles = useStyles(makeStyles);
  const { text } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={text.section} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    block: { marginHorizontal: spacing.lg },
    photoFrame: {
      borderRadius: radius.xl,
      overflow: 'hidden',
      backgroundColor: colors.muted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.imageRing,
    },
    card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl },
    quote: { padding: 20, gap: spacing.sm },
    note: { padding: spacing.lg, gap: spacing.sm },
    vitalsRow: { alignItems: 'center' },
    vital: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, minHeight: 52 },
    vitalDivider: { width: 1, alignSelf: 'stretch', marginVertical: spacing.md, backgroundColor: colors.border },
    detail: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: 14, minHeight: 52 },
    detailValue: { flex: 1 },
    section: { marginHorizontal: spacing.lg, marginTop: spacing.lg, gap: spacing.md },
  });
