// ─────────────────────────────────────────────────────────────────────────────
// UpgradeScreen.js — the membership paywall. Shows the tiers; the Subscribe
// buttons route through lib/purchases.js, which is a documented stub until you
// wire RevenueCat + a dev build (see that file). Reachable from Profile.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Screen, Label, Rule, Button, BackBar } from '../components/ui.js';
import { useAuth } from '../auth/AuthContext.js';
import { TIERS, TIER_ORDER, tierMeets } from '../lib/tiers.js';
import { purchaseTier } from '../lib/purchases.js';
import { colors, fonts, spacing } from '../theme.js';

export default function UpgradeScreen({ navigation }) {
  const { profile } = useAuth();
  const current = profile?.tier || 'observer';
  const [busy, setBusy] = useState(null);

  const subscribe = async (key) => {
    setBusy(key);
    try {
      await purchaseTier(key);
      // On success (once wired), RevenueCat's webhook updates profiles.tier.
    } catch (e) {
      Alert.alert(
        e.notConfigured ? 'Coming soon' : 'Purchase failed',
        e.notConfigured
          ? 'Paid memberships open shortly. You can use every core feature — discover, match, and message — for free in the meantime.'
          : (e.message || 'Something went wrong.'),
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <BackBar onBack={() => navigation.goBack()} right={<Label>Membership</Label>} />
      <Rule style={{ marginBottom: spacing(3) }} />

      <Text style={styles.title}>Choose how you belong.</Text>
      <Text style={styles.lede}>
        Every core feature is free. Paid tiers add reach and access.
      </Text>

      <View style={{ marginTop: spacing(3) }}>
        {TIER_ORDER.map((key) => {
          const tier = TIERS[key];
          const isCurrent = key === current;
          const isDowngrade = tierMeets(current, key) && !isCurrent;
          return (
            <View key={key} style={[styles.card, tier.recommended && styles.cardRecommended]}>
              <View style={styles.cardHead}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(1) }}>
                    <Text style={styles.tierName}>{tier.name}</Text>
                    {tier.recommended ? <Label style={{ color: colors.accent }}>Popular</Label> : null}
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.price}>{tier.price}</Text>
                  {tier.priceMeta ? <Text style={styles.priceMeta}>{tier.priceMeta}</Text> : null}
                </View>
              </View>

              <View style={{ marginTop: spacing(2), gap: spacing(1) }}>
                {tier.features.map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <Feather name="check" size={13} color={colors.accent} />
                    <Text style={styles.feature}>{f}</Text>
                  </View>
                ))}
              </View>

              <View style={{ marginTop: spacing(2.5) }}>
                {isCurrent ? (
                  <View style={styles.currentPill}>
                    <Text style={styles.currentText}>Your tier</Text>
                  </View>
                ) : isDowngrade ? null : (
                  <Button
                    title={busy === key ? 'One moment…' : `Choose ${tier.name}`}
                    onPress={() => subscribe(key)}
                    disabled={!!busy}
                    variant={tier.recommended ? 'primary' : 'outline'}
                  />
                )}
              </View>
            </View>
          );
        })}
      </View>

      <Text style={styles.footnote}>
        Subscriptions are billed by the App Store and renew until canceled. Manage
        or cancel anytime in your App Store account settings.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.text,
  },
  lede: {
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 22,
    color: '#a89d87',
    marginTop: spacing(1.5),
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: spacing(2.5),
    marginBottom: spacing(2),
  },
  cardRecommended: {
    borderColor: colors.accent,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  tierName: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.text,
  },
  price: {
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontSize: 22,
    color: colors.accent,
  },
  priceMeta: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.muted,
    marginTop: 2,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
  },
  feature: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  currentPill: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    paddingVertical: spacing(1.5),
    alignItems: 'center',
  },
  currentText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  footnote: {
    fontFamily: fonts.mono,
    fontSize: 9,
    lineHeight: 15,
    letterSpacing: 0.5,
    color: colors.faint,
    marginTop: spacing(2),
  },
});
