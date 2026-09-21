import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '@/constants/theme';
import { useStyles, useTheme, type Theme } from '@/lib/theme';
import { Button } from './Button';
import { Field } from './Field';
import { Header } from './Header';
import { Icon } from './Icon';

export interface PickerOption {
  value: string;
  label: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: ReadonlyArray<PickerOption>;
  selected: string[];
  onChange: (values: string[]) => void;
  multi?: boolean;
  /** Maximum selections in multi mode. */
  max?: number;
  searchable?: boolean;
  /** Shown above the list, e.g. a "Prefer not to say" control. */
  header?: React.ReactNode;
  /** Allow clearing a single-select value. */
  clearable?: boolean;
}

/** Full-screen list with a search field on top and a Done button. Selected rows show a trailing check. */
export function PickerModal({ visible, onClose, title, options, selected, onChange, multi, max, searchable = true, header, clearable }: Props) {
  const styles = useStyles(makeStyles);
  const { colors, text } = useTheme();
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const toggle = (value: string) => {
    if (!multi) {
      onChange([value]);
      onClose();
      return;
    }
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
      return;
    }
    if (max && selected.length >= max) return;
    onChange([...selected, value]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
        <Header
          title={title}
          right={
            multi ? (
              <Button title="Done" size="small" onPress={onClose} />
            ) : clearable && selected.length > 0 ? (
              <Button
                title="Clear"
                size="small"
                variant="ghost"
                onPress={() => {
                  onChange([]);
                  onClose();
                }}
              />
            ) : (
              <Button title="Close" size="small" variant="ghost" onPress={onClose} />
            )
          }
        />
        {searchable && options.length > 8 ? (
          <View style={styles.search}>
            <Field value={query} onChangeText={setQuery} placeholder="Search" autoCorrect={false} autoCapitalize="none" clearButtonMode="while-editing" />
          </View>
        ) : null}
        {multi && max ? (
          <Text style={[text.caption, styles.count]}>
            {selected.length} of {max} selected
          </Text>
        ) : null}
        {header}
        <FlatList
          data={filtered}
          keyExtractor={(o) => o.value}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const on = selected.includes(item.value);
            return (
              <Pressable
                accessibilityRole={multi ? 'checkbox' : 'radio'}
                accessibilityState={{ checked: on }}
                onPress={() => toggle(item.value)}
                style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceHover }]}
              >
                <Text style={[text.body, on && { color: colors.ivory, fontWeight: '500' }]}>{item.label}</Text>
                {on ? <Icon name="check" size={18} color={colors.ivory} /> : null}
              </Pressable>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={<Text style={[text.caption, styles.empty]}>No matches.</Text>}
        />
      </SafeAreaView>
    </Modal>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  search: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  count: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  list: { paddingBottom: spacing.xxl },
  row: { minHeight: 52, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sep: { height: 1, backgroundColor: colors.border, marginLeft: spacing.lg },
  empty: { padding: spacing.xl, textAlign: 'center' },
});
