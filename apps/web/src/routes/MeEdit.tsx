import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AREAS,
  CHILDREN_OPTIONS,
  COUNTRIES,
  DEGREE_LEVEL_OPTIONS,
  DISTANCE_OPTIONS_MILES,
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
  cmFromFeetInches,
  type ChildrenPlan,
  type DegreeLevel,
  type DrinkingHabit,
  type Education,
  type Employment,
  type EmploymentStatus,
  type ExerciseHabit,
  type Industry,
  type RaceEthnicity,
  type RelationshipIntent,
  type SmokingHabit,
  type StudentStatus,
} from '@peaches/core';
import { api, errorMessage } from '../lib/api';
import { useAuth, useMember } from '../auth/AuthProvider';
import { PageHeader } from '../components/AppShell';
import { Button } from '../components/Button';
import { Checkbox, Input, Label, Notice, Select, TextArea, Toggle } from '../components/Field';
import { LoadingBlock } from '../components/Loading';
import { MultiSelect } from '../components/MultiSelect';
import { Group, GroupSection } from '../components/Group';
import { useAsync } from '../hooks/useAsync';
import { usePageTitle } from '../hooks/usePageTitle';

const FEET = ['4', '5', '6', '7'].map((f) => ({ value: f, label: `${f} ft` }));
const INCHES = Array.from({ length: 12 }, (_, i) => ({ value: String(i), label: `${i} in` }));
const AREA_OPTIONS = AREAS.map((a) => ({ value: a.id, label: a.name }));
const DISTANCE_OPTIONS = DISTANCE_OPTIONS_MILES.map((m) => ({ value: String(m), label: `${m} miles` }));
const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({ value: c.code, label: c.name }));
const INTEREST_OPTIONS = INTERESTS.map((i) => ({ value: i, label: i }));
const YEARS = Array.from({ length: 2035 - 1975 + 1 }, (_, i) => String(2035 - i)).map((y) => ({ value: y, label: y }));

function feetInches(cm: number | null): { feet: string; inches: string } {
  if (!cm) return { feet: '5', inches: '8' };
  const total = Math.round(cm / 2.54);
  return { feet: String(Math.min(7, Math.max(4, Math.floor(total / 12)))), inches: String(total % 12) };
}

export function MeEdit() {
  usePageTitle('Edit profile');
  const { user, email, profile } = useMember();
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { data: priv, loading, error } = useAsync(() => api.profiles.getPrivate(user.id, email), [user.id]);

  const [firstName, setFirstName] = useState(profile.firstName);
  const [age, setAge] = useState(profile.age ? String(profile.age) : '');
  const [hasHeight, setHasHeight] = useState(profile.height != null);
  const [height, setHeight] = useState(feetInches(profile.height));
  const [industry, setIndustry] = useState<string>(profile.industry ?? '');
  const [studentStatus, setStudentStatus] = useState<string>(profile.studentStatus ?? '');
  const [nationalities, setNationalities] = useState<string[]>(profile.nationalities);
  const [preferNotToSay, setPreferNotToSay] = useState(profile.raceEthnicityDisclosure === 'prefer_not_to_say');
  const [raceEthnicities, setRaceEthnicities] = useState<string[]>(profile.raceEthnicities);
  const [languages, setLanguages] = useState<string[]>(profile.languages);
  const [intent, setIntent] = useState<string>(profile.relationshipIntent ?? '');
  const [drinking, setDrinking] = useState<string>(profile.lifestyle.drinking ?? '');
  const [smoking, setSmoking] = useState<string>(profile.lifestyle.smoking ?? '');
  const [exercise, setExercise] = useState<string>(profile.lifestyle.exercise ?? '');
  const [children, setChildren] = useState<string>(profile.lifestyle.children ?? '');
  const [interests, setInterests] = useState<string[]>(profile.interests);
  const [bio, setBio] = useState(profile.bio);

  const [areaId, setAreaId] = useState('');
  const [maxDistance, setMaxDistance] = useState('25');
  const [education, setEducation] = useState<Education>({ school: '', degreeLevel: 'bachelor', fieldOfStudy: '', graduationYear: null, currentlyEnrolled: false, publicDisplayEnabled: true });
  const [employment, setEmployment] = useState<Employment>({ occupation: '', employer: '', employmentStatus: 'employed', publicEmployerDisplayEnabled: true });

  useEffect(() => {
    if (!priv) return;
    setAreaId(priv.areaId ?? '');
    setMaxDistance(String(priv.maxDistanceMiles));
    if (priv.education) setEducation(priv.education);
    if (priv.employment) setEmployment(priv.employment);
    else setEmployment((e) => ({ ...e, occupation: profile.occupation }));
  }, [priv, profile.occupation]);

  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setSaveError(null);
    try {
      await api.profiles.updatePublic(user.id, {
        firstName,
        age: age ? Number(age) : null,
        height: hasHeight ? cmFromFeetInches(Number(height.feet), Number(height.inches)) : null,
        industry: (industry || null) as Industry | null,
        studentStatus: (studentStatus || null) as StudentStatus | null,
        nationalities,
        raceEthnicityDisclosure: preferNotToSay ? 'prefer_not_to_say' : raceEthnicities.length > 0 ? 'disclosed' : 'not_provided',
        raceEthnicities: preferNotToSay ? [] : (raceEthnicities as RaceEthnicity[]),
        languages,
        relationshipIntent: (intent || null) as RelationshipIntent | null,
        lifestyle: {
          drinking: (drinking || null) as DrinkingHabit | null,
          smoking: (smoking || null) as SmokingHabit | null,
          exercise: (exercise || null) as ExerciseHabit | null,
          children: (children || null) as ChildrenPlan | null,
        },
        interests,
        bio,
      });
      await api.profiles.updatePrivate(user.id, {
        areaId: areaId || null,
        maxDistanceMiles: Number(maxDistance),
        education,
        employment,
      });
      await refreshProfile();
      navigate('/me');
    } catch (err) {
      setSaveError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingBlock />;
  if (error) return <Notice tone="danger">{error}</Notice>;

  return (
    <div className="max-w-[720px]">
      <PageHeader title="Edit profile" back="/me" />
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-5" noValidate>
        <Group>
          <GroupSection eyebrow="Basics">
          <div className="space-y-4">
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            <Input label="Age" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, ''))} />
          </div>
          <div>
            <Label>Height</Label>
            <div className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center">
              <Select aria-label="Feet" options={FEET} value={height.feet} disabled={!hasHeight} onChange={(e) => setHeight((h) => ({ ...h, feet: e.target.value }))} />
              <Select aria-label="Inches" options={INCHES} value={height.inches} disabled={!hasHeight} onChange={(e) => setHeight((h) => ({ ...h, inches: e.target.value }))} />
              <Checkbox label="Show" checked={hasHeight} onChange={(e) => setHasHeight(e.target.checked)} className="min-h-0 py-0" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Select label="Your area" help="Private. Others see only the area name." options={AREA_OPTIONS} placeholder="Choose your area" value={areaId} onChange={(e) => setAreaId(e.target.value)} />
            <Select label="Maximum distance" help="A hard boundary for discovery." options={DISTANCE_OPTIONS} value={maxDistance} onChange={(e) => setMaxDistance(e.target.value)} />
          </div>
          <TextArea label="Bio" hint={`${bio.length}/${LIMITS.bioMax}`} maxLength={LIMITS.bioMax} rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          </GroupSection>
        </Group>

        <Group>
          <GroupSection eyebrow="Work">
          <div className="space-y-4">
          <Input label="Occupation" value={employment.occupation} onChange={(e) => setEmployment((v) => ({ ...v, occupation: e.target.value }))} />
          <Input label="Employer" value={employment.employer} onChange={(e) => setEmployment((v) => ({ ...v, employer: e.target.value }))} />
          <Toggle label="Show employer on my profile" description="Occupation is always shown" checked={employment.publicEmployerDisplayEnabled} onChange={(v) => setEmployment((s) => ({ ...s, publicEmployerDisplayEnabled: v }))} />
          <div className="grid sm:grid-cols-2 gap-3">
            <Select label="Employment status" options={EMPLOYMENT_STATUS_OPTIONS} value={employment.employmentStatus} onChange={(e) => setEmployment((v) => ({ ...v, employmentStatus: e.target.value as EmploymentStatus }))} />
            <Select label="Field" options={INDUSTRY_OPTIONS} placeholder="Choose a field" value={industry} onChange={(e) => setIndustry(e.target.value)} />
          </div>
          <Select label="Standing" options={STUDENT_STATUS_OPTIONS} placeholder="Student or professional" value={studentStatus} onChange={(e) => setStudentStatus(e.target.value)} />
          </div>
          </GroupSection>
        </Group>

        <Group>
          <GroupSection eyebrow="Education">
          <div className="space-y-4">
          <Input label="School" value={education.school} onChange={(e) => setEducation((v) => ({ ...v, school: e.target.value }))} />
          <div className="grid sm:grid-cols-2 gap-3">
            <Select label="Degree level" options={DEGREE_LEVEL_OPTIONS} value={education.degreeLevel} onChange={(e) => setEducation((v) => ({ ...v, degreeLevel: e.target.value as DegreeLevel }))} />
            <Input label="Field of study" value={education.fieldOfStudy} onChange={(e) => setEducation((v) => ({ ...v, fieldOfStudy: e.target.value }))} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3 items-end">
            <Select label="Graduation year" options={YEARS} placeholder="Year" value={education.graduationYear ? String(education.graduationYear) : ''} onChange={(e) => setEducation((v) => ({ ...v, graduationYear: e.target.value ? Number(e.target.value) : null }))} />
            <Checkbox label="Currently enrolled" checked={education.currentlyEnrolled} onChange={(e) => setEducation((v) => ({ ...v, currentlyEnrolled: e.target.checked }))} />
          </div>
          <Toggle label="Show education on my profile" checked={education.publicDisplayEnabled} onChange={(v) => setEducation((s) => ({ ...s, publicDisplayEnabled: v }))} />
          </div>
          </GroupSection>
        </Group>

        <Group>
          <GroupSection eyebrow="Background">
          <div className="space-y-4">
          <div>
            <Label>Nationality</Label>
            <MultiSelect label="Nationality" options={COUNTRY_OPTIONS} values={nationalities} onChange={setNationalities} searchable placeholder="Add one or more" />
          </div>
          <div>
            <Label optional>Race / ethnicity</Label>
            <MultiSelect label="Race / ethnicity" options={RACE_ETHNICITY_OPTIONS} values={preferNotToSay ? [] : raceEthnicities} onChange={setRaceEthnicities} placeholder={preferNotToSay ? 'Prefer not to say' : 'Add one or more'} />
            <Toggle label="Prefer not to say" description="Hides this field and keeps it out of matching entirely" checked={preferNotToSay} onChange={setPreferNotToSay} />
          </div>
          <div>
            <Label>Languages</Label>
            <MultiSelect label="Languages" options={LANGUAGE_OPTIONS} values={languages} onChange={setLanguages} searchable placeholder="Add one or more" />
          </div>
          </div>
          </GroupSection>
        </Group>

        <Group>
          <GroupSection eyebrow="Intent & lifestyle">
          <div className="space-y-4">
          <Select label="Relationship intent" options={RELATIONSHIP_INTENT_OPTIONS} placeholder="Choose" value={intent} onChange={(e) => setIntent(e.target.value)} />
          <div className="grid sm:grid-cols-2 gap-3">
            <Select label="Drinking" options={DRINKING_OPTIONS} placeholder="Not set" value={drinking} onChange={(e) => setDrinking(e.target.value)} />
            <Select label="Smoking" options={SMOKING_OPTIONS} placeholder="Not set" value={smoking} onChange={(e) => setSmoking(e.target.value)} />
            <Select label="Exercise" options={EXERCISE_OPTIONS} placeholder="Not set" value={exercise} onChange={(e) => setExercise(e.target.value)} />
            <Select label="Children" options={CHILDREN_OPTIONS} placeholder="Not set" value={children} onChange={(e) => setChildren(e.target.value)} />
          </div>
          </div>
          </GroupSection>
        </Group>

        <Group>
          <GroupSection eyebrow="Interests">
          <div className="space-y-4">
          <MultiSelect label="Interests" options={INTEREST_OPTIONS} values={interests} onChange={setInterests} searchable max={LIMITS.interestsMax} placeholder={`Up to ${LIMITS.interestsMax}`} />
          </div>
          </GroupSection>
        </Group>

        {saveError ? <Notice tone="danger">{saveError}</Notice> : null}
        <div className="flex justify-end gap-3 pb-6">
          <Button variant="ghost" onClick={() => navigate('/me')} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !firstName.trim()}>
            {busy ? 'Saving' : 'Save changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
