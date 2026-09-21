import { LIMITS, validateIntroNote } from '@peaches/core';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/lib/theme';
import { errorMessage } from '@/lib/errors';
import { Button } from './Button';
import { Field } from './Field';
import { Sheet } from './Sheet';

interface Props {
  visible: boolean;
  onClose: () => void;
  recipientFirstName: string;
  /** Called with the validated note; throw to show the error inline. */
  onSubmit: (note: string) => Promise<void>;
  /** Copy for the context, e.g. "About their post". */
  context?: string;
}

/** The one restrained primary action: a written introduction, never a like. */
export function IntroductionNoteSheet({ visible, onClose, recipientFirstName, onSubmit, context }: Props) {
  const { colors, text } = useTheme();
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (visible) {
      setNote('');
      setError(null);
      setSending(false);
    }
  }, [visible]);

  const problem = validateIntroNote(note);

  const submit = async () => {
    if (problem) {
      setError(problem);
      return;
    }
    setSending(true);
    setError(null);
    try {
      await onSubmit(note.trim());
    } catch (e) {
      setError(errorMessage(e));
      setSending(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={`Introduce yourself to ${recipientFirstName}`}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {context ? <Text style={[text.caption, { marginBottom: spacing.sm }]}>{context}</Text> : null}
        <Text style={[text.bodySmall, { marginBottom: spacing.md }]}>
          A few sincere sentences go further than a line. {recipientFirstName} sees your note before deciding.
        </Text>
        <Field
          multiline
          value={note}
          onChangeText={setNote}
          placeholder="What caught your attention, and what would you like to talk about?"
          maxLength={LIMITS.introNoteMax}
          error={error}
          autoFocus
        />
        <View style={styles.footer}>
          <Text style={[text.caption, note.length > 0 && !problem && { color: colors.textSecondary }]}>
            {note.trim().length}/{LIMITS.introNoteMax}
            {problem && note.length > 0 ? ` · ${problem}` : ''}
          </Text>
          <Button title="Send request" onPress={submit} loading={sending} disabled={!!problem} size="small" />
        </View>
      </KeyboardAvoidingView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md, gap: spacing.md },
});
