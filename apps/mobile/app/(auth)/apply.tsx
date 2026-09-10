import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AREAS, BRAND, LEGAL_VERSIONS, LIMITS, areaById, isValidEmail, isValidLinkedin } from '@peaches/core';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { ErrorText } from '@/components/ErrorText';
import { Field } from '@/components/Field';
import { Header } from '@/components/Header';
import { PickerModal } from '@/components/PickerModal';
import { Group } from '@/components/Group';
import { Screen } from '@/components/Screen';
import { SettingsRow } from '@/components/SettingsRow';
import { colors, spacing, text } from '@/constants/theme';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { saveStatusToken } from '@/lib/storage';
import { LEGAL_URLS } from '@/lib/supabase';

const WHY_MAX = 600;

interface Form {
  email: string;
  firstName: string;
  age: string;
  areaId: string | null;
  occupation: string;
  employer: string;
  yearsExperience: string;
  linkedinUrl: string;
  school: string;
  degree: string;
  bio: string;
  why: string;
  age18: boolean;
  agreeTerms: boolean;
}

const EMPTY: Form = {
  email: '',
  firstName: '',
  age: '',
  areaId: null,
  occupation: '',
  employer: '',
  yearsExperience: '',
  linkedinUrl: '',
  school: '',
  degree: '',
  bio: '',
  why: '',
  age18: false,
  agreeTerms: false,
};

function validate(f: Form): Partial<Record<keyof Form, string>> {
  const e: Partial<Record<keyof Form, string>> = {};
  if (!isValidEmail(f.email)) e.email = 'Enter a valid email address.';
  if (!f.firstName.trim()) e.firstName = 'Your first name is required.';
  const age = Number(f.age);
  if (!f.age || !Number.isInteger(age) || age < 18 || age > 120) e.age = 'Enter your age (18 or older).';
  if (!f.areaId) e.areaId = 'Choose the area you live in.';
  if (!f.occupation.trim()) e.occupation = 'Tell us what you do.';
  if (f.yearsExperience && (Number(f.yearsExperience) < 0 || Number(f.yearsExperience) > 80)) e.yearsExperience = 'Enter a number between 0 and 80.';
  if (!isValidLinkedin(f.linkedinUrl)) e.linkedinUrl = 'Enter a LinkedIn profile URL.';
  if (!f.why.trim()) e.why = `Tell us why ${BRAND.name}.`;
  if (!f.age18) e.age18 = 'Required.';
  if (!f.agreeTerms) e.agreeTerms = 'Required.';
  return e;
}

const AREA_OPTIONS = AREAS.map((a) => ({ value: a.id, label: a.name }));

export default function Apply() {
  const router = useRouter();
  const [form, setForm] = useState<Form>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errors = useMemo(() => validate(form), [form]);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const show = (key: keyof Form) => (touched ? errors[key] : undefined);

  const submit = async () => {
    setTouched(true);
    if (Object.keys(errors).length > 0) {
      setError('Please check the highlighted fields.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { statusToken } = await api.applications.submit({
        email: form.email,
        firstName: form.firstName,
        age: Number(form.age),
        areaId: form.areaId,
        occupation: form.occupation,
        employer: form.employer,
        yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : null,
        linkedinUrl: form.linkedinUrl,
        school: form.school,
        degree: form.degree,
        bio: form.bio,
        why: form.why,
        consent: { ageConfirmed: form.age18, termsVersion: LEGAL_VERSIONS.terms, privacyVersion: LEGAL_VERSIONS.privacy },
      });
      await saveStatusToken(statusToken);
      router.replace({ pathname: '/(auth)/status', params: { token: statusToken, submitted: '1' } });
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Header back title="Apply" />
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={text.bodySmall}>
            {BRAND.name} is a members-only community in {BRAND.market}. Applications are read by a person, usually within a few days. No account
            exists until you are admitted.
          </Text>

          <Text style={[text.eyebrow, styles.firstSection]}>Contact</Text>
          <Field label="Email" value={form.email} onChangeText={(v) => set('email', v)} error={show('email')} autoCapitalize="none" keyboardType="email-address" autoCorrect={false} />
          <View style={styles.pair}>
            <Field label="First name" containerStyle={{ flex: 2 }} value={form.firstName} onChangeText={(v) => set('firstName', v)} error={show('firstName')} autoCapitalize="words" />
            <Field label="Age" containerStyle={{ flex: 1 }} value={form.age} onChangeText={(v) => set('age', v.replace(/[^0-9]/g, ''))} error={show('age')} keyboardType="number-pad" />
          </View>

          <Text style={[text.eyebrow, styles.section]}>Where you live</Text>
          <Group flush>
            <SettingsRow label="Area" value={areaById(form.areaId)?.name ?? 'Choose'} onPress={() => setAreaOpen(true)} />
          </Group>
          {show('areaId') ? <Text style={styles.err}>{errors.areaId}</Text> : null}
          <Text style={text.caption}>Other members only ever see a coarse label like &quot;Duluth area&quot;.</Text>

          <Text style={[text.eyebrow, styles.section]}>Work</Text>
          <Field label="What you do" placeholder="e.g. Product designer" value={form.occupation} onChangeText={(v) => set('occupation', v)} error={show('occupation')} />
          <Field label="Employer (optional)" value={form.employer} onChangeText={(v) => set('employer', v)} />
          <View style={styles.pair}>
            <Field label="Years of experience" containerStyle={{ flex: 1 }} value={form.yearsExperience} onChangeText={(v) => set('yearsExperience', v.replace(/[^0-9]/g, ''))} error={show('yearsExperience')} keyboardType="number-pad" />
          </View>
          <Field label="LinkedIn (optional)" value={form.linkedinUrl} onChangeText={(v) => set('linkedinUrl', v)} error={show('linkedinUrl')} autoCapitalize="none" keyboardType="url" autoCorrect={false} />

          <Text style={[text.eyebrow, styles.section]}>Education</Text>
          <Field label="School (optional)" value={form.school} onChangeText={(v) => set('school', v)} />
          <Field label="Degree (optional)" placeholder="e.g. B.S. Computer Science" value={form.degree} onChangeText={(v) => set('degree', v)} />

          <Text style={[text.eyebrow, styles.section]}>About you</Text>
          <Field label="A short summary (optional)" multiline value={form.bio} onChangeText={(v) => set('bio', v)} maxLength={LIMITS.bioMax} helper={`${form.bio.length}/${LIMITS.bioMax}`} />
          <Field label={`Why ${BRAND.name}?`} multiline value={form.why} onChangeText={(v) => set('why', v)} error={show('why')} maxLength={WHY_MAX} helper={`${form.why.length}/${WHY_MAX}`} />

          <Text style={[text.eyebrow, styles.section]}>Consent</Text>
          <Checkbox checked={form.age18} onChange={(v) => set('age18', v)} accessibilityLabel="I am 18 years of age or older">
            <Text style={text.bodySmall}>I am 18 years of age or older.</Text>
            {show('age18') ? <Text style={styles.err}>{errors.age18}</Text> : null}
          </Checkbox>
          <Checkbox checked={form.agreeTerms} onChange={(v) => set('agreeTerms', v)} accessibilityLabel="I agree to the Terms of Service and Privacy Policy">
            <Text style={text.bodySmall}>
              I have read and agree to the{' '}
              <Text style={styles.link} onPress={() => Linking.openURL(LEGAL_URLS.terms)}>
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text style={styles.link} onPress={() => Linking.openURL(LEGAL_URLS.privacy)}>
                Privacy Policy
              </Text>
              .
            </Text>
            {show('agreeTerms') ? <Text style={styles.err}>{errors.agreeTerms}</Text> : null}
          </Checkbox>

          <ErrorText message={error} />
          <Button title="Submit application" onPress={submit} loading={busy} fullWidth />
          <Text style={[text.micro, { textAlign: 'center' }]}>You will receive a reference token to check your status.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
      <PickerModal visible={areaOpen} onClose={() => setAreaOpen(false)} title="Your area" options={AREA_OPTIONS} selected={form.areaId ? [form.areaId] : []} onChange={(v) => set('areaId', v[0] ?? null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxxl, gap: spacing.lg },
  pair: { flexDirection: 'row', gap: spacing.md },
  firstSection: { marginTop: spacing.sm },
  section: { marginTop: spacing.lg },
  err: { ...text.caption, color: colors.danger },
  link: { color: colors.ivory, textDecorationLine: 'underline' },
});
