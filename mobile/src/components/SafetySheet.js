// ─────────────────────────────────────────────────────────────────────────────
// SafetySheet.js — the block / report menu, shown from a correspondence.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { REPORT_REASONS } from '../lib/safety.js';
import { colors, fonts, spacing } from '../theme.js';

export default function SafetySheet({ visible, otherName, onBlock, onReport, onClose }) {
  const [mode, setMode] = useState('menu');
  useEffect(() => { if (visible) setMode('menu'); }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          {mode === 'menu' ? (
            <>
              <Text style={styles.title}>{otherName || 'This member'}</Text>
              <Row label="Report" danger onPress={() => setMode('report')} />
              <Row label="Block" danger onPress={onBlock} />
              <Row label="Cancel" onPress={onClose} />
            </>
          ) : (
            <>
              <Text style={styles.title}>Report — what's wrong?</Text>
              {REPORT_REASONS.map(r => (
                <Row key={r} label={r} onPress={() => onReport(r)} />
              ))}
              <Row label="Back" onPress={() => setMode('menu')} />
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Row({ label, danger, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
      <Text style={[styles.rowText, danger && { color: colors.danger }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(14,13,11,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.raised,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    paddingHorizontal: spacing(2),
    paddingTop: spacing(2),
    paddingBottom: spacing(4),
  },
  title: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.muted,
    paddingHorizontal: spacing(1),
    paddingBottom: spacing(1),
  },
  row: {
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(1),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  rowText: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.text,
  },
});
