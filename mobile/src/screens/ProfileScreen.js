import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen, ScreenHeader, Portrait, Label, Rule, Badge, Button, Loading } from '../components/ui.js';
import { useAuth } from '../auth/AuthContext.js';
import { displayProfile } from '../lib/profile.js';
import { colors, fonts, spacing } from '../theme.js';

const TIER_LABELS = { observer: 'Observer', member: 'Member', founding: 'Founding' };

export default function ProfileScreen() {
  const { profile, refreshProfile, signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
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
          {p.identityVerified ? <Badge>Identity verified</Badge> : null}
          {p.educationVerified ? <Badge>Education verified</Badge> : null}
        </View>

        <Rule style={{ marginVertical: spacing(3) }} />

        {p.occupation ? <Detail label="Occupation" value={p.occupation} /> : null}
        {p.education ? <Detail label="Education" value={p.education} /> : null}
        {p.bio ? <Detail label="About" value={p.bio} /> : null}
        {p.communities.length > 0 ? (
          <Detail label="Communities" value={p.communities.join(' · ')} />
        ) : null}

        <Text style={styles.footnote}>
          Editing your dossier — photos, bio, preferences — lives on the web for now.
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
