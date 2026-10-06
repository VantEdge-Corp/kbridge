import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { alpha, radius, spacing } from '@/constants/theme';
import { useStyles, useTheme, type Theme } from '@/lib/theme';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

/** shadcn/ui's Sheet from the bottom: `popover` ground, top radius xl, a grabber, 24px padding. */
export function Sheet({ visible, onClose, title, children }: Props) {
  const styles = useStyles(makeStyles);
  const { text } = useTheme();
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

/** One entry of an item's menu: the same list its ⋯ button and its long-press open, as the web's menus. */
export interface SheetAction {
  label: string;
  onPress: () => void;
  icon?: IconName;
  destructive?: boolean;
}

/** A menu in a sheet, drawn like shadcn's DropdownMenu: icon and label rows, destructive entries in red, then Cancel. */
export function ActionSheet({ visible, onClose, title, actions }: { visible: boolean; onClose: () => void; title?: string; actions: SheetAction[] }) {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <View style={styles.menu} accessibilityRole="menu">
        {actions.map((a, i) => {
          const tint = a.destructive ? colors.destructive : colors.foreground;
          return (
            <React.Fragment key={a.label}>
              {i > 0 ? <View style={styles.separator} /> : null}
              <Pressable
                accessibilityRole="menuitem"
                onPress={() => {
                  onClose();
                  a.onPress();
                }}
                style={({ pressed }) => [styles.item, pressed && { backgroundColor: a.destructive ? alpha(colors.destructive, 0.1) : colors.accent }]}
              >
                {a.icon ? <Icon name={a.icon} size={18} color={a.destructive ? colors.destructive : colors.mutedForeground} /> : null}
                <Text style={[styles.itemLabel, { color: tint }]}>{a.label}</Text>
              </Pressable>
            </React.Fragment>
          );
        })}
      </View>
      <Button title="Cancel" variant="outline" onPress={onClose} fullWidth style={styles.cancel} />
    </Sheet>
  );
}

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    panel: {
      backgroundColor: colors.popover,
      borderTopLeftRadius: radius.xxl,
      borderTopRightRadius: radius.xxl,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: colors.border,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: -8 },
      elevation: 16,
    },
    handle: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: alpha(colors.mutedForeground, 0.35), marginBottom: spacing.lg },
    title: { marginBottom: spacing.lg },
    menu: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, overflow: 'hidden' },
    separator: { height: 1, backgroundColor: colors.border, marginLeft: spacing.lg },
    item: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
    itemLabel: { fontSize: 15 },
    cancel: { marginTop: spacing.md },
  });
