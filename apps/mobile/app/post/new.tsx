import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LIMITS, type UploadBody } from '@peaches/core';
import { Button } from '@/components/Button';
import { ErrorText } from '@/components/ErrorText';
import { Field } from '@/components/Field';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { colors, radius, spacing, text } from '@/constants/theme';
import { api } from '@/lib/api';
import { useMember } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';
import { pickImage } from '@/lib/images';

export default function NewPost() {
  const router = useRouter();
  const { userId } = useMember();
  const [body, setBody] = useState('');
  const [photo, setPhoto] = useState<(UploadBody & { previewUri: string }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choosePhoto = async () => {
    try {
      const upload = await pickImage({ aspect: [4, 3] });
      if (!upload) return;
      const base64 = arrayBufferToBase64(upload.body as ArrayBuffer);
      setPhoto({ ...upload, previewUri: `data:${upload.contentType};base64,${base64}` });
    } catch (e) {
      Alert.alert('Could not add photo', errorMessage(e));
    }
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.posts.create(userId, body, photo ? { body: photo.body, contentType: photo.contentType, size: photo.size } : null);
      router.back();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Header title="New post" back right={<Button title="Post" size="small" onPress={submit} loading={busy} disabled={!body.trim()} />} />
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={text.caption}>Members see your first name, area, and verification. Plans, questions, and observations do well here.</Text>
          <Field multiline autoFocus value={body} onChangeText={setBody} placeholder="What's on your mind?" maxLength={LIMITS.postBodyMax} helper={`${body.length}/${LIMITS.postBodyMax}`} style={{ minHeight: 160 }} />
          {photo ? (
            <View>
              <Image source={{ uri: photo.previewUri }} style={styles.preview} contentFit="cover" />
              <Pressable accessibilityRole="button" accessibilityLabel="Remove photo" onPress={() => setPhoto(null)} style={styles.remove}>
                <Icon name="x" size={14} color={colors.onIvory} />
              </Pressable>
            </View>
          ) : (
            <Button title="Add a photo" icon="image" variant="secondary" size="small" onPress={choosePhoto} style={{ alignSelf: 'flex-start' }} />
          )}
          <ErrorText message={error} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return globalThis.btoa(binary);
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl, gap: spacing.lg },
  preview: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.lg, backgroundColor: colors.surfaceElevated },
  remove: { position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.ivory, alignItems: 'center', justifyContent: 'center' },
});
