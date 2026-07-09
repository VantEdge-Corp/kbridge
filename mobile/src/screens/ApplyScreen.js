// ─────────────────────────────────────────────────────────────────────────────
// ApplyScreen.js — the public application, on the phone. Mirrors the web form
// (src/routes/Apply.jsx): a written application reviewed by hand by the
// committee. No ID/photo verification — kbridge does not collect government
// IDs or run identity-document checks.
//
// Submit: validate + require the two consents (18+, Terms/Privacy), insert the
// applications row with the accepted document versions, then land on Status.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { View, Text, Linking, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, Label, Rule, Field, Button, Checkbox, ErrorText, BackBar } from '../components/ui.js';
import { submitApplication } from '../lib/applications.js';
import { LEGAL_VERSIONS, LEGAL_URLS } from '../legal.js';
import { colors, fonts, spacing } from '../theme.js';

const WHY_MAX = 600;
const SUMMARY_MAX = 320;
export const STATUS_TOKEN_KEY = 'kbridge_status_token';

function validate(f) {
  const errs = {};
  if (!f.email?.trim()) errs.email = 'Required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errs.email = "Doesn't look like an email.";
  if (!f.first_name?.trim()) errs.first_name = 'Required.';
  if (f.age && (Number(f.age) < 18 || Number(f.age) > 120)) errs.age = 'Must be 18+.';
  if (!f.profession?.trim()) errs.profession = 'Required.';
  if (!f.company?.trim()) errs.company = 'Required.';
  if (f.years_experience && (Number(f.years_experience) < 0 || Number(f.years_experience) > 80)) {
    errs.years_experience = 'Out of range.';
  }
  if (!f.why?.trim()) errs.why = 'Required.';
  if (!f.age18) errs.age18 = 'Required.';
  if (!f.agreeTerms) errs.agreeTerms = 'Required.';
  return errs;
}

export default function ApplyScreen({ navigation }) {
  const [fields, setFields] = useState({
    email: '', first_name: '', age: '', city: '',
    profession: '', company: '', linkedin_url: '', years_experience: '',
    school: '', degree: '',
    bio: '', why: '',
    age18: false, agreeTerms: false,
  });
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const update = (k) => (v) => setFields(prev => ({ ...prev, [k]: v }));
  const updateDigits = (k) => (v) => setFields(prev => ({ ...prev, [k]: v.replace(/[^0-9]/g, '') }));

  const errors = validate(fields);
  const showErr = (k) => (touched ? errors[k] : undefined);

  const onSubmit = async () => {
    setTouched(true);
    setError('');
    if (Object.keys(errors).length || submitting) return;

    setSubmitting(true);
    try {
      const { status_token } = await submitApplication({
        email:            fields.email,
        first_name:       fields.first_name,
        age:              fields.age ? parseInt(fields.age, 10) : null,
        city:             fields.city,
        profession:       fields.profession,
        company:          fields.company,
        linkedin_url:     fields.linkedin_url,
        years_experience: fields.years_experience ? parseInt(fields.years_experience, 10) : null,
        school:           fields.school,
        degree:           fields.degree,
        bio:              fields.bio,
        why:              fields.why,
        consent: {
          ageConfirmed:   fields.age18,
          termsVersion:   LEGAL_VERSIONS.terms,
          privacyVersion: LEGAL_VERSIONS.privacy,
        },
      });

      await AsyncStorage.setItem(STATUS_TOKEN_KEY, status_token).catch(() => {});
      navigation.replace('Status', { token: status_token, justSubmitted: true });
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <BackBar onBack={() => navigation.goBack()} right={<Label>The application</Label>} />
      <Rule style={{ marginBottom: spacing(3) }} />

      <Text style={styles.title}>
        Short, specific, <Text style={styles.titleAccent}>read by hand.</Text>
      </Text>
      <Text style={styles.lede}>
        Tell us who you are. Every application is read by hand and reviewed by the
        committee — you'll hear back within a few days.
      </Text>

      <SectionLabel>I — Contact</SectionLabel>
      <Field label="Email" value={fields.email} onChangeText={update('email')} placeholder="you@example.com" keyboardType="email-address" error={showErr('email')} />
      <Field label="First name" value={fields.first_name} onChangeText={update('first_name')} placeholder="Jane" autoCapitalize="words" error={showErr('first_name')} />
      <View style={styles.twoCol}>
        <Field label="Age" value={fields.age} onChangeText={updateDigits('age')} placeholder="29" keyboardType="number-pad" error={showErr('age')} style={styles.col} />
        <Field label="City" value={fields.city} onChangeText={update('city')} placeholder="New York" autoCapitalize="words" style={styles.col} />
      </View>

      <SectionLabel>II — Profession</SectionLabel>
      <Field label="Current role" value={fields.profession} onChangeText={update('profession')} placeholder="Senior Architect" autoCapitalize="words" error={showErr('profession')} />
      <Field label="Company or firm" value={fields.company} onChangeText={update('company')} placeholder="SOM" autoCapitalize="words" error={showErr('company')} />
      <View style={styles.twoCol}>
        <Field label="Years of experience" value={fields.years_experience} onChangeText={updateDigits('years_experience')} placeholder="6" keyboardType="number-pad" error={showErr('years_experience')} style={styles.col} />
        <Field label="LinkedIn URL" value={fields.linkedin_url} onChangeText={update('linkedin_url')} placeholder="linkedin.com/in/…" style={styles.col} />
      </View>
      <View style={styles.twoCol}>
        <Field label="Degree (optional)" value={fields.degree} onChangeText={update('degree')} placeholder="M.Arch" style={styles.col} />
        <Field label="School (optional)" value={fields.school} onChangeText={update('school')} placeholder="Yale" autoCapitalize="words" style={styles.col} />
      </View>

      <SectionLabel>III — About you</SectionLabel>
      <Field
        label="Brief professional summary"
        value={fields.bio}
        onChangeText={update('bio')}
        placeholder="A sentence or two on what you actually do."
        autoCapitalize="sentences"
        multiline
        maxLength={SUMMARY_MAX}
      />
      <Field
        label="Why kbridge"
        value={fields.why}
        onChangeText={update('why')}
        placeholder="The part of why you're here that's true even when it's embarrassing. The committee reads this twice."
        autoCapitalize="sentences"
        multiline
        maxLength={WHY_MAX}
        error={showErr('why')}
      />

      <SectionLabel>IV — Consent</SectionLabel>
      <Checkbox checked={fields.age18} onChange={update('age18')} error={showErr('age18')}>
        I am 18 years of age or older.
      </Checkbox>
      <Checkbox checked={fields.agreeTerms} onChange={update('agreeTerms')} error={showErr('agreeTerms')}>
        I have read and agree to the{' '}
        <Text style={styles.link} onPress={() => Linking.openURL(LEGAL_URLS.terms)}>Terms of Service</Text>
        {' '}and{' '}
        <Text style={styles.link} onPress={() => Linking.openURL(LEGAL_URLS.privacy)}>Privacy Policy</Text>.
      </Checkbox>

      <ErrorText>{error}</ErrorText>
      <Rule style={{ marginVertical: spacing(2) }} />
      <Text style={styles.submitNote}>
        {submitting ? 'Submitting…' : 'Reviewed within a few days · No account until approved'}
      </Text>
      <Button
        title={submitting ? 'Submitting…' : 'Submit application'}
        onPress={onSubmit}
        disabled={submitting}
      />
      <Text style={styles.privacyNote}>Your information is private. We never sell it.</Text>
    </Screen>
  );
}

function SectionLabel({ children }) {
  return (
    <View style={{ marginTop: spacing(3), marginBottom: spacing(2) }}>
      <Label style={{ color: colors.accent }}>{children}</Label>
      <Rule style={{ marginTop: spacing(1) }} />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 37,
    color: colors.text,
  },
  titleAccent: {
    fontStyle: 'italic',
    color: colors.accent,
  },
  lede: {
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 22,
    color: '#a89d87',
    marginTop: spacing(1.5),
  },
  twoCol: {
    flexDirection: 'row',
    gap: spacing(2),
  },
  col: {
    flex: 1,
  },
  link: {
    color: colors.accent,
    textDecorationLine: 'underline',
  },
  submitNote: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.faint,
    marginBottom: spacing(1.5),
  },
  privacyNote: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.faint,
    marginTop: spacing(2),
  },
});
