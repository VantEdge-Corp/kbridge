// ─────────────────────────────────────────────────────────────────────────────
// MatchModal.js — the moment of mutual interest. Shown when a like comes
// back mutual: both portraits, an ampersand, and a way into the new
// correspondence.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { Portrait, Button, Label, Rule } from './ui.js';
import { colors, fonts, spacing } from '../theme.js';

export default function MatchModal({ visible, me, other, onMessage, onClose }) {
  if (!other) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <View style={styles.sheet}>
          <Label style={{ textAlign: 'center', color: colors.accent }}>A mutual interest</Label>
          <Rule style={{ marginVertical: spacing(2) }} />

          <View style={styles.portraits}>
            <Portrait profile={me} width={92} />
            <Text style={styles.amp}>&</Text>
            <Portrait profile={other} width={92} />
          </View>

          <Text style={styles.title}>
            You and {other.name} have chosen one another.
          </Text>
          <Text style={styles.body}>A correspondence is now open.</Text>

          <Button title="Begin the correspondence" onPress={onMessage} style={{ marginTop: spacing(3) }} />
          <Button title="Keep browsing" variant="ghost" onPress={onClose} style={{ marginTop: spacing(1.5) }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(14,13,11,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing(3),
  },
  sheet: {
    width: '100%',
    maxWidth: 400,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    padding: spacing(3),
  },
  portraits: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(2),
    marginVertical: spacing(1),
  },
  amp: {
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontSize: 34,
    color: colors.accent,
  },
  title: {
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing(2),
  },
  body: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing(1),
  },
});
