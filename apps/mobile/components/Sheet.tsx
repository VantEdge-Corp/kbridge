import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, text } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

/** Bottom sheet: `surfaceElevated`, top radius xl, a 36x4 grabber, 24px padding, soft shadow. */
export function Sheet({ visible, onClose, title, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button" />
        <View style={[styles.panel, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
          <View style={styles.handle} />
          {title ? <Text style={[text.heading, styles.title]}>{title}</Text> : null}
          {children}
        </View>
      </View>
    </Modal>
  );
}

export interface SheetAction {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

export function ActionSheet({ visible, onClose, title, actions }: { visible: boolean; onClose: () => void; title?: string; actions: SheetAction[] }) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <View style={styles.actions}>
        {actions.map((a, i) => (
          <React.Fragment key={a.label}>
            {i > 0 ? <View style={styles.separator} /> : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                onClose();
                a.onPress();
              }}
              style={({ pressed }) => [styles.action, pressed && { backgroundColor: colors.surfaceHover }]}
            >
              <Text style={[text.body, a.destructive && { color: colors.danger }]}>{a.label}</Text>
            </Pressable>
          </React.Fragment>
        ))}
      </View>
      <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.cancel, pressed && { opacity: 0.8 }]}>
        <Text style={[text.body, { color: colors.textSecondary }]}>Cancel</Text>
      </Pressable>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  panel: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 16,
  },
  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, marginBottom: spacing.lg },
  title: { marginBottom: spacing.lg },
  actions: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, overflow: 'hidden' },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: spacing.lg },
  action: { minHeight: 52, justifyContent: 'center', paddingHorizontal: spacing.lg },
  cancel: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
});
