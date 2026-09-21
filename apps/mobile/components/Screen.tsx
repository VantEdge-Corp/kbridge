import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useStyles, type Theme } from '@/lib/theme';

interface Props {
  children: React.ReactNode;
  /** Tab screens use ['top'] (the tab bar owns the bottom inset); pushed screens use ['top', 'bottom']. */
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
}

export function Screen({ children, edges = ['top'], style }: Props) {
  const styles = useStyles(makeStyles);
  return (
    <SafeAreaView edges={edges} style={[styles.root, style]}>
      {children}
    </SafeAreaView>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
});
