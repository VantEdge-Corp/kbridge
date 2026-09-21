import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import {
  AREAS,
  CHILDREN_OPTIONS,
  COUNTRIES,
  DEGREE_LEVEL_OPTIONS,
  DRINKING_OPTIONS,
  EMPLOYMENT_STATUS_OPTIONS,
  EXERCISE_OPTIONS,
  INDUSTRY_OPTIONS,
  INTERESTS,
  LANGUAGE_OPTIONS,
  LIMITS,
  RACE_ETHNICITY_OPTIONS,
  RELATIONSHIP_INTENT_OPTIONS,
  SMOKING_OPTIONS,
  STUDENT_STATUS_OPTIONS,
  areaById,
  cmFromFeetInches,
  countryName,
  labelFor,
  type ChildrenPlan,
  type DegreeLevel,
  type DrinkingHabit,
  type EmploymentStatus,
  type ExerciseHabit,
  type Industry,
  type RaceEthnicity,
  type RelationshipIntent,
  type SmokingHabit,
  type StudentStatus,
} from '@peaches/core';
import { Button } from '@/components/Button';
import { ErrorText } from '@/components/ErrorText';
import { Field } from '@/components/Field';
import { Group } from '@/components/Group';
import { Header } from '@/components/Header';
import { Loading } from '@/components/Loading';
import { PickerModal, type PickerOption } from '@/components/PickerModal';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { SettingsRow } from '@/components/SettingsRow';
import { ChipRow, TagChip } from '@/components/TagChip';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/lib/theme';
import { api } from '@/lib/api';
import { useMember } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';

const COUNTRY_OPTIONS: PickerOption[] = COUNTRIES.map((c) => ({ value: c.code, label: c.name }));
const INTEREST_OPTIONS: PickerOption[] = INTERESTS.map((i) => ({ value: i, label: i }));
const AREA_OPTIONS: PickerOption[] = AREAS.map((a) => ({ value: a.id, label: a.name }));

type Picker =
  | 'area'
  | 'industry'
  | 'studentStatus'
  | 'nationalities'
  | 'raceEthnicities'
  | 'languages'
  | 'relationshipIntent'
  | 'drinking'
  | 'smoking'
  | 'exercise'
  | 'children'
  | 'interests'
  | 'degreeLevel'
  | 'employmentStatus'
  | null;

interface Form {
  firstName: string;
  age: string;
  feet: string;
  inches: string;
  industry: Industry | null;
  studentStatus: StudentStatus | null;
  nationalities: string[];
  raceEthnicities: RaceEthnicity[];
  preferNotToSay: boolean;
  languages: string[];
  relationshipIntent: RelationshipIntent | null;
  drinking: DrinkingHabit | null;
  smoking: SmokingHabit | null;
  exercise: ExerciseHabit | null;
  children: ChildrenPlan | null;
  interests: string[];
  bio: string;
  areaId: string | null;
  school: string;
  degreeLevel: DegreeLevel | null;
  fieldOfStudy: string;
  graduationYear: string;
  currentlyEnrolled: boolean;
  educationDisplayEnabled: boolean;
  occupation: string;
  employer: string;
  employmentStatus: EmploymentStatus | null;
  employerDisplayEnabled: boolean;
}

export default function EditProfile() {
  const { colors, text } = useTheme();
  const router = useRouter();
  const { userId, email, profile, refreshProfile } = useMember();
  const [form, setForm] = useState<Form | null>(null);
  const [open, setOpen] = useState<Picker>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [own, priv] = await Promise.all([profile ? Promise.resolve(profile) : refreshProfile(), api.profiles.getPrivate(userId, email)]);
        if (cancelled || !own) return;
        const totalInches = own.height ? Math.round(own.height / 2.54) : null;
        setForm({
          firstName: own.firstName,
          age: own.age != null ? String(own.age) : '',
          feet: totalInches != null ? String(Math.floor(totalInches / 12)) : '',
          inches: totalInches != null ? String(totalInches % 12) : '',
          industry: own.industry,
          studentStatus: own.studentStatus,
          nationalities: own.nationalities,
          raceEthnicities: own.raceEthnicities,
          preferNotToSay: own.raceEthnicityDisclosure === 'prefer_not_to_say',
          languages: own.languages,
          relationshipIntent: own.relationshipIntent,
          drinking: own.lifestyle.drinking,
          smoking: own.lifestyle.smoking,
          exercise: own.lifestyle.exercise,
          children: own.lifestyle.children,
          interests: own.interests,
          bio: own.bio,
          areaId: priv.areaId,
          school: priv.education?.school ?? '',
          degreeLevel: priv.education?.degreeLevel ?? null,
          fieldOfStudy: priv.education?.fieldOfStudy ?? '',
          graduationYear: priv.education?.graduationYear ? String(priv.education.graduationYear) : '',
          currentlyEnrolled: priv.education?.currentlyEnrolled ?? false,
          educationDisplayEnabled: priv.education?.publicDisplayEnabled ?? true,
          occupation: priv.employment?.occupation ?? own.occupation,
          employer: priv.employment?.employer ?? '',
          employmentStatus: priv.employment?.employmentStatus ?? null,
          employerDisplayEnabled: priv.employment?.publicEmployerDisplayEnabled ?? true,
        });
      } catch (e) {
        if (!cancelled) setError(errorMessage(e));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, email]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => (f ? { ...f, [key]: value } : f));

  const pickerConfig = useMemo(() => {
    if (!form || !open) return null;
    const single = <T extends string>(title: string, options: ReadonlyArray<PickerOption>, value: T | null, key: keyof Form) => ({
      title,
      options,
      selected: value ? [value] : [],
      multi: false,
      max: undefined as number | undefined,
      onChange: (values: string[]) => set(key, (values[0] ?? null) as Form[typeof key]),
      clearable: true,
    });
    switch (open) {
      case 'area':
        return { ...single('Your area', AREA_OPTIONS, form.areaId, 'areaId'), clearable: false };
      case 'industry':
        return single('Field of work', INDUSTRY_OPTIONS, form.industry, 'industry');
      case 'studentStatus':
        return single('Student or professional', STUDENT_STATUS_OPTIONS, form.studentStatus, 'studentStatus');
      case 'relationshipIntent':
        return single('Relationship intent', RELATIONSHIP_INTENT_OPTIONS, form.relationshipIntent, 'relationshipIntent');
      case 'drinking':
        return single('Drinking', DRINKING_OPTIONS, form.drinking, 'drinking');
      case 'smoking':
        return single('Smoking', SMOKING_OPTIONS, form.smoking, 'smoking');
      case 'exercise':
        return single('Exercise', EXERCISE_OPTIONS, form.exercise, 'exercise');
      case 'children':
        return single('Children', CHILDREN_OPTIONS, form.children, 'children');
      case 'degreeLevel':
        return single('Degree level', DEGREE_LEVEL_OPTIONS, form.degreeLevel, 'degreeLevel');
      case 'employmentStatus':
        return single('Employment status', EMPLOYMENT_STATUS_OPTIONS, form.employmentStatus, 'employmentStatus');
      case 'nationalities':
        return { title: 'Nationality', options: COUNTRY_OPTIONS, selected: form.nationalities, multi: true, max: 4, onChange: (v: string[]) => set('nationalities', v), clearable: false };
      case 'raceEthnicities':
        return {
          title: 'Race / ethnicity',
          options: RACE_ETHNICITY_OPTIONS,
          selected: form.raceEthnicities,
          multi: true,
          max: undefined,
          onChange: (v: string[]) => setForm((f) => (f ? { ...f, raceEthnicities: v as RaceEthnicity[], preferNotToSay: v.length > 0 ? false : f.preferNotToSay } : f)),
          clearable: false,
        };
      case 'languages':
        return { title: 'Languages', options: LANGUAGE_OPTIONS, selected: form.languages, multi: true, max: 6, onChange: (v: string[]) => set('languages', v), clearable: false };
      case 'interests':
        return { title: 'Interests', options: INTEREST_OPTIONS, selected: form.interests, multi: true, max: LIMITS.interestsMax, onChange: (v: string[]) => set('interests', v), clearable: false };
    }
  }, [form, open]);

  const save = async () => {
    if (!form) return;
    const age = form.age ? Number(form.age) : null;
    if (age != null && (!Number.isInteger(age) || age < 18 || age > 120)) return setError('Enter a valid age (18 or older).');
    const feet = form.feet ? Number(form.feet) : null;
    const inches = form.inches ? Number(form.inches) : 0;
    if ((feet != null && (feet < 3 || feet > 8)) || inches < 0 || inches > 11) return setError('Enter a valid height.');
    const graduationYear = form.graduationYear ? Number(form.graduationYear) : null;
    if (graduationYear != null && (graduationYear < 1950 || graduationYear > 2100)) return setError('Enter a valid graduation year.');
    if (!form.occupation.trim()) return setError('Tell members what you do.');
    setSaving(true);
    setError(null);
    try {
      await api.profiles.updatePublic(userId, {
        firstName: form.firstName,
        age,
        height: feet != null ? cmFromFeetInches(feet, inches) : null,
        industry: form.industry,
        studentStatus: form.studentStatus,
        nationalities: form.nationalities,
        raceEthnicities: form.preferNotToSay ? [] : form.raceEthnicities,
        raceEthnicityDisclosure: form.preferNotToSay ? 'prefer_not_to_say' : form.raceEthnicities.length > 0 ? 'disclosed' : 'not_provided',
        languages: form.languages,
        relationshipIntent: form.relationshipIntent,
        lifestyle: { drinking: form.drinking, smoking: form.smoking, exercise: form.exercise, children: form.children },
        interests: form.interests,
        bio: form.bio,
      });
      await api.profiles.updatePrivate(userId, {
        areaId: form.areaId,
        education: {
          school: form.school,
          degreeLevel: form.degreeLevel ?? 'other',
          fieldOfStudy: form.fieldOfStudy,
          graduationYear,
          currentlyEnrolled: form.currentlyEnrolled,
          publicDisplayEnabled: form.educationDisplayEnabled,
        },
        employment: {
          occupation: form.occupation,
          employer: form.employer,
          employmentStatus: form.employmentStatus ?? (form.employer.trim() ? 'employed' : 'other'),
          publicEmployerDisplayEnabled: form.employerDisplayEnabled,
        },
      });
      await refreshProfile();
      router.back();
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
    }
  };

  if (!form) {
    return (
      <Screen edges={['top', 'bottom']}>
        <Header back title="Edit profile" />
        {error ? <ErrorText message={error} /> : <Loading />}
      </Screen>
    );
  }

  const chips = (values: string[], label: (v: string) => string) =>
    values.length > 0 ? (
      <View style={styles.chips}>
        <ChipRow>
          {values.map((v) => (
            <TagChip key={v} label={label(v)} />
          ))}
        </ChipRow>
      </View>
    ) : null;

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Header back title="Edit profile" right={<Button title="Save" size="small" variant="ghost" onPress={save} loading={saving} />} />
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <SectionHeader title="Basics" first />
          <View style={styles.fields}>
            <Field label="First name" value={form.firstName} onChangeText={(v) => set('firstName', v)} autoCapitalize="words" />
            <View style={styles.pair}>
              <Field label="Age" containerStyle={{ flex: 1 }} value={form.age} onChangeText={(v) => set('age', v.replace(/[^0-9]/g, ''))} keyboardType="number-pad" />
              <Field label="Height (ft)" containerStyle={{ flex: 1 }} value={form.feet} onChangeText={(v) => set('feet', v.replace(/[^0-9]/g, ''))} keyboardType="number-pad" placeholder="5" />
              <Field label="(in)" containerStyle={{ flex: 1 }} value={form.inches} onChangeText={(v) => set('inches', v.replace(/[^0-9]/g, ''))} keyboardType="number-pad" placeholder="10" />
            </View>
            <Field label="About you" multiline value={form.bio} onChangeText={(v) => set('bio', v)} maxLength={LIMITS.bioMax} helper={`${form.bio.length}/${LIMITS.bioMax}`} placeholder="A few honest lines. What you care about, how you spend a Saturday." />
          </View>

          <SectionHeader title="Location" />
          <Group>
            <SettingsRow label="Your area" value={areaById(form.areaId)?.name ?? 'Choose'} onPress={() => setOpen('area')} />
          </Group>
          <Text style={[text.caption, styles.note]}>Private. Others see only a coarse label such as &quot;{areaById(form.areaId)?.publicLabel ?? 'Metro Atlanta'}&quot;.</Text>

          <SectionHeader title="Work" />
          <View style={styles.fields}>
            <Field label="What you do" value={form.occupation} onChangeText={(v) => set('occupation', v)} placeholder="e.g. Product designer" />
            <Field label="Employer" value={form.employer} onChangeText={(v) => set('employer', v)} />
          </View>
          <Group>
            <SettingsRow label="Employment status" value={labelFor(EMPLOYMENT_STATUS_OPTIONS, form.employmentStatus) || 'Choose'} onPress={() => setOpen('employmentStatus')} />
            <SettingsRow label="Field of work" value={labelFor(INDUSTRY_OPTIONS, form.industry) || 'Choose'} onPress={() => setOpen('industry')} />
            <SettingsRow label="Student or professional" value={labelFor(STUDENT_STATUS_OPTIONS, form.studentStatus) || 'Choose'} onPress={() => setOpen('studentStatus')} />
            <SettingsRow label="Show employer on profile" chevron={false} right={<Switch value={form.employerDisplayEnabled} onValueChange={(v) => set('employerDisplayEnabled', v)} trackColor={{ true: colors.ivory, false: colors.borderStrong }} thumbColor={colors.canvas} />} />
          </Group>

          <SectionHeader title="Education" />
          <View style={styles.fields}>
            <Field label="School" value={form.school} onChangeText={(v) => set('school', v)} />
            <Field label="Field of study" value={form.fieldOfStudy} onChangeText={(v) => set('fieldOfStudy', v)} />
            <Field label="Graduation year" value={form.graduationYear} onChangeText={(v) => set('graduationYear', v.replace(/[^0-9]/g, '').slice(0, 4))} keyboardType="number-pad" />
          </View>
          <Group>
            <SettingsRow label="Degree level" value={labelFor(DEGREE_LEVEL_OPTIONS, form.degreeLevel) || 'Choose'} onPress={() => setOpen('degreeLevel')} />
            <SettingsRow label="Currently enrolled" chevron={false} right={<Switch value={form.currentlyEnrolled} onValueChange={(v) => set('currentlyEnrolled', v)} trackColor={{ true: colors.ivory, false: colors.borderStrong }} thumbColor={colors.canvas} />} />
            <SettingsRow label="Show education on profile" chevron={false} right={<Switch value={form.educationDisplayEnabled} onValueChange={(v) => set('educationDisplayEnabled', v)} trackColor={{ true: colors.ivory, false: colors.borderStrong }} thumbColor={colors.canvas} />} />
          </Group>

          <SectionHeader title="Background" />
          <Group>
            <View>
              <SettingsRow label="Nationality" value={form.nationalities.length ? `${form.nationalities.length} selected` : 'Add'} onPress={() => setOpen('nationalities')} />
              {chips(form.nationalities, countryName)}
            </View>
            <View>
              <SettingsRow label="Race / ethnicity" value={form.preferNotToSay ? 'Prefer not to say' : form.raceEthnicities.length ? `${form.raceEthnicities.length} selected` : 'Optional'} onPress={() => setOpen('raceEthnicities')} />
              {!form.preferNotToSay ? chips(form.raceEthnicities, (v) => labelFor(RACE_ETHNICITY_OPTIONS, v as RaceEthnicity)) : null}
            </View>
            <SettingsRow
              label="Prefer not to say"
              description="Hides race/ethnicity and never uses it in matching."
              chevron={false}
              right={<Switch value={form.preferNotToSay} onValueChange={(v) => setForm((f) => (f ? { ...f, preferNotToSay: v, raceEthnicities: v ? [] : f.raceEthnicities } : f))} trackColor={{ true: colors.ivory, false: colors.borderStrong }} thumbColor={colors.canvas} />}
            />
            <View>
              <SettingsRow label="Languages" value={form.languages.length ? `${form.languages.length} selected` : 'Add'} onPress={() => setOpen('languages')} />
              {chips(form.languages, (v) => labelFor(LANGUAGE_OPTIONS, v))}
            </View>
          </Group>

          <SectionHeader title="Intent & lifestyle" />
          <Group>
            <SettingsRow label="Relationship intent" value={labelFor(RELATIONSHIP_INTENT_OPTIONS, form.relationshipIntent) || 'Choose'} onPress={() => setOpen('relationshipIntent')} />
            <SettingsRow label="Drinking" value={labelFor(DRINKING_OPTIONS, form.drinking) || 'Optional'} onPress={() => setOpen('drinking')} />
            <SettingsRow label="Smoking" value={labelFor(SMOKING_OPTIONS, form.smoking) || 'Optional'} onPress={() => setOpen('smoking')} />
            <SettingsRow label="Exercise" value={labelFor(EXERCISE_OPTIONS, form.exercise) || 'Optional'} onPress={() => setOpen('exercise')} />
            <SettingsRow label="Children" value={labelFor(CHILDREN_OPTIONS, form.children) || 'Optional'} onPress={() => setOpen('children')} />
          </Group>

          <SectionHeader title="Interests" />
          <Group>
            <View>
              <SettingsRow label="Interests" value={form.interests.length ? `${form.interests.length} of ${LIMITS.interestsMax}` : 'Add'} onPress={() => setOpen('interests')} />
              {chips(form.interests, (v) => v)}
            </View>
          </Group>

          <ErrorText message={error} />
          <View style={styles.saveWrap}>
            <Button title="Save changes" onPress={save} loading={saving} fullWidth />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {pickerConfig ? (
        <PickerModal
          visible
          onClose={() => setOpen(null)}
          title={pickerConfig.title}
          options={pickerConfig.options}
          selected={pickerConfig.selected}
          onChange={pickerConfig.onChange}
          multi={pickerConfig.multi}
          max={pickerConfig.max}
          clearable={pickerConfig.clearable}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingBottom: spacing.xxxl },
  fields: { paddingHorizontal: spacing.lg, gap: spacing.lg, paddingBottom: spacing.lg },
  pair: { flexDirection: 'row', gap: spacing.md },
  note: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  chips: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, marginTop: -spacing.xs },
  saveWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.xxl },
});
