import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Screen, ScreenHeader, Portrait, Label, Rule, Badge, Button, Loading, ErrorText } from '../components/ui.js';
import { useAuth } from '../auth/AuthContext.js';
import { displayProfile } from '../lib/profile.js';
import { pickPhoto, addProfilePhoto, removeProfilePhoto, publicUrl, PHOTO_LIMIT } from '../lib/photos.js';
import { colors, fonts, spacing } from '../theme.js';

const TIER_LABELS = { observer: 'Observer', member: 'Member', founding: 'Founding' };

export default function ProfileScreen() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const photoKey = (profile?.photo_paths || []).join(',');
  const [paths, setPaths] = useState(profile?.photo_paths || []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setPaths(profile?.photo_paths || []); }, [photoKey]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const onAdd = async () => {
    setError('');
    try {
      const asset = await pickPhoto();
      if (!asset) return;
      setBusy(true);
      const next = await addProfilePhoto(user.id, asset, paths);
      setPaths(next);
      await refreshProfile();
    } catch (e) {
      setError(e.message || 'Could not add photo.');
    } finally {
      setBusy(false);
    }
  };

  const onRemove = (path) => {
    Alert.alert('Remove photo', 'Remove this photo from your profile?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setError('');
          setBusy(true);
          try {
            const next = await removeProfilePhoto(user.id, path, paths);
            setPaths(next);
            await refreshProfile();
          } catch (e) {
            setError(e.message || 'Could not remove photo.');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const p = displayProfile(profile);

  if (!p) {
    return (
      <Screen>
        <ScreenHeader label="Profile" />
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen scroll refreshing={refreshing} onRefresh={onRefresh}>
      <ScreenHeader label="Profile" right={<Label style={{ color: colors.accent }}>{p.memberNumber}</Label>} />

      <Portrait profile={p} width="100%" ratio={4 / 3} fontSize={96} />

      <View style={{ marginTop: spacing(3) }}>
        <Text style={styles.name}>
          {p.name}
          {p.age ? <Text style={styles.age}>, {p.age}</Text> : null}
        </Text>
        {p.city ? <Text style={styles.city}>{p.city}</Text> : null}

        <View style={styles.badges}>
          <Badge tone="accent">{TIER_LABELS[p.tier] || p.tier}</Badge>
          {p.photoVerified ? <Badge tone="accent">Photo verified</Badge> : null}
          {p.identityVerified ? <Badge>Identity verified</Badge> : null}
        </View>

        <Rule style={{ marginVertical: spacing(3) }} />

        {/* Photos */}
        <View style={styles.photoHeader}>
          <Label>Photos</Label>
          <Label style={{ color: colors.faint }}>{paths.length}/{PHOTO_LIMIT}</Label>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing(1.5) }}>
          {paths.map((path) => (
            <View key={path} style={styles.photoTile}>
              <Image source={{ uri: publicUrl(path) }} style={styles.photoImg} resizeMode="cover" />
              <Pressable onPress={() => onRemove(path)} hitSlop={8} style={styles.removeBtn} disabled={busy}>
                <Feather name="x" size={13} color={colors.text} />
              </Pressable>
            </View>
          ))}
          {paths.length < PHOTO_LIMIT ? (
            <Pressable onPress={onAdd} style={styles.addTile} disabled={busy}>
              {busy ? (
                <ActivityIndicator color={colors.accent} />
              ) : (
                <>
                  <Feather name="plus" size={20} color={colors.muted} />
                  <Text style={styles.addLabel}>Add</Text>
                </>
              )}
            </Pressable>
          ) : null}
        </ScrollView>
        <ErrorText>{error}</ErrorText>

        <Rule style={{ marginVertical: spacing(3) }} />

        {p.occupation ? <Detail label="Occupation" value={p.occupation} /> : null}
        {p.education ? <Detail label="Education" value={p.education} /> : null}
        {p.bio ? <Detail label="About" value={p.bio} /> : null}
        {p.communities.length > 0 ? (
          <Detail label="Communities" value={p.communities.join(' · ')} />
        ) : null}

        <Text style={styles.footnote}>
          Editing the rest of your dossier — bio, preferences — lives on the web for now.
        </Text>

        <Button title="Sign out" variant="danger" onPress={signOut} style={{ marginTop: spacing(3) }} />
      </View>
    </Screen>
  );
}

function Detail({ label, value }) {
  return (
    <View style={{ marginBottom: spacing(2.5) }}>
      <Label style={{ marginBottom: spacing(0.75) }}>{label}</Label>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  name: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.text,
  },
  age: {
    fontStyle: 'italic',
    color: colors.accentBright,
  },
  city: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.muted,
    marginTop: spacing(1),
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(1),
    marginTop: spacing(2),
  },
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photoTile: {
    width: 96,
    height: 128,
    marginRight: spacing(1.5),
    backgroundColor: colors.raised,
    overflow: 'hidden',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(14,13,11,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTile: {
    width: 96,
    height: 128,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(0.5),
  },
  addLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  detailValue: {
    fontFamily: fonts.display,
    fontSize: 16,
    lineHeight: 23,
    color: colors.text,
  },
  footnote: {
    fontFamily: fonts.mono,
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 0.5,
    color: colors.faint,
    marginTop: spacing(2),
  },
});
