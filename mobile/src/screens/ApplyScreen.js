// ─────────────────────────────────────────────────────────────────────────────
// ApplyScreen.js — the public application, on the phone. Mirrors the web
// form (src/routes/Apply.jsx) field-for-field and submits through the same
// contract: upload face + passport to the private verifications bucket,
// insert the applications row, then land on the status screen.
//
// The web's in-browser face match (face-api.js) is browser-only and never
// blocked submission anyway — on mobile the committee reviews by hand.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { Screen, Label, Rule, Field, Button, ErrorText, BackBar } from '../components/ui.js';
import { submitApplication } from '../lib/applications.js';
import { uploadVerification, assetBytes } from '../lib/storage.js';
import { colors, fonts, spacing } from '../theme.js';

const WHY_MAX = 600;
const SUMMARY_MAX = 320;
export const STATUS_TOKEN_KEY = 'kbridge_status_token';

const PICKER_OPTIONS = {
  mediaTypes: ['images'],
  quality: 0.8,
  base64: true,
  exif: false,
};

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
  if (!f.facePhoto) errs.facePhoto = 'Required.';
  if (!f.passportPhoto) errs.passportPhoto = 'Required.';
  if (!f.why?.trim()) errs.why = 'Required.';
  return errs;
}

function PhotoField({ label, hint, asset, onPick, error }) {
  const [pickError, setPickError] = useState('');

  const pick = async (fromCamera) => {
    setPickError('');
    try {
      const perm = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setPickError(fromCamera ? 'Camera access was denied.' : 'Photo library access was denied.');
        return;
      }
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
        : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
      if (!result.canceled && result.assets?.[0]) onPick(result.assets[0]);
    } catch (e) {
      setPickError(e.message || 'Could not open the picker.');
    }
  };

  return (
    <View style={{ marginBottom: spacing(3) }}>
      <Label style={{ marginBottom: spacing(0.75) }}>
        {label} <Text style={{ color: colors.accent }}>*</Text>
      </Label>
      <Text style={photoStyles.hint}>{hint}</Text>

      {!asset ? (
        <View style={photoStyles.pickRow}>
          <Pressable onPress={() => pick(false)} style={({ pressed }) => [photoStyles.pickButton, pressed && { opacity: 0.6 }]}>
            <Feather name="image" size={14} color={colors.muted} />
            <Text style={photoStyles.pickLabel}>Photo library</Text>
          </Pressable>
          <Pressable onPress={() => pick(true)} style={({ pressed }) => [photoStyles.pickButton, pressed && { opacity: 0.6 }]}>
            <Feather name="camera" size={14} color={colors.muted} />
            <Text style={photoStyles.pickLabel}>Take photo</Text>
          </Pressable>
        </View>
      ) : (
        <View style={photoStyles.preview}>
          <Image source={{ uri: asset.uri }} style={photoStyles.thumb} />
          <View style={{ flex: 1, marginLeft: spacing(1.5) }}>
            <Text style={photoStyles.previewName} numberOfLines={1}>
              {asset.fileName || 'Photo selected'}
            </Text>
            <Text style={photoStyles.previewSize}>
              {(assetBytes(asset) / 1024 / 1024).toFixed(2)} MB
            </Text>
          </View>
          <Pressable onPress={() => onPick(null)} hitSlop={10} style={{ padding: spacing(1) }}>
            <Feather name="x" size={16} color={colors.muted} />
          </Pressable>
        </View>
      )}

      {(error || pickError) ? <Text style={photoStyles.error}>{pickError || error}</Text> : null}
    </View>
  );
}

export default function ApplyScreen({ navigation }) {
  const [fields, setFields] = useState({
    email: '', first_name: '', age: '', city: '',
    profession: '', company: '', linkedin_url: '', years_experience: '',
    school: '', degree: '',
    bio: '', why: '',
    facePhoto: null, passportPhoto: null,
  });
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState('');
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
      setStage('Uploading face photo…');
      const face_photo_path = await uploadVerification(fields.facePhoto, 'face');

      setStage('Uploading passport photo…');
      const passport_photo_path = await uploadVerification(fields.passportPhoto, 'passport');

      setStage('Submitting application…');
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
        face_photo_path,
        passport_photo_path,
      });

      await AsyncStorage.setItem(STATUS_TOKEN_KEY, status_token).catch(() => {});
      navigation.replace('Status', { token: status_token, justSubmitted: true });
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      setSubmitting(false);
      setStage('');
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
        We verify identity by hand from your photo and a US passport before
        approving accounts. Submit once, you'll hear back within a few days.
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

      <SectionLabel>III — Identity</SectionLabel>
      <Text style={styles.sectionNote}>
        Two images. The committee reviews them by hand. Stored privately —
        only admins can view, and only while your application is open.
      </Text>
      <PhotoField
        label="Clear photo of your face"
        hint="A recent photo, neutral lighting, no sunglasses or hat. A selfie is fine."
        asset={fields.facePhoto}
        onPick={update('facePhoto')}
        error={showErr('facePhoto')}
      />
      <PhotoField
        label="US passport"
        hint="The photo page of a current US passport. Make sure the name and photo are readable."
        asset={fields.passportPhoto}
        onPick={update('passportPhoto')}
        error={showErr('passportPhoto')}
      />

      <SectionLabel>IV — About you</SectionLabel>
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

      <ErrorText>{error}</ErrorText>
      <Rule style={{ marginVertical: spacing(2) }} />
      <Text style={styles.submitNote}>
        {submitting && stage ? stage : 'Reviewed within a few days · No account until approved'}
      </Text>
      <Button
        title={submitting ? 'Submitting…' : 'Submit application'}
        onPress={onSubmit}
        disabled={submitting}
      />
      <Text style={styles.privacyNote}>
        Photos are private. We never sell, publish, or repost them.
      </Text>
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
  sectionNote: {
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontSize: 13,
    lineHeight: 19,
    color: '#a89d87',
    marginBottom: spacing(2),
    marginTop: -spacing(1),
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

const photoStyles = StyleSheet.create({
  hint: {
    fontFamily: fonts.mono,
    fontSize: 9,
    lineHeight: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.faint,
    marginBottom: spacing(1.5),
  },
  pickRow: {
    flexDirection: 'row',
    gap: spacing(1.5),
  },
  pickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(1),
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
    paddingVertical: spacing(2.5),
  },
  pickLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: spacing(1.5),
  },
  thumb: {
    width: 64,
    height: 64,
    backgroundColor: colors.raised,
  },
  previewName: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.text,
  },
  previewSize: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.faint,
    marginTop: 3,
  },
  error: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.danger,
    marginTop: spacing(1),
  },
});
