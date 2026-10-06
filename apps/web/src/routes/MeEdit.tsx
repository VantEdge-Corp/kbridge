import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
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
import { useAuth, useMember } from '@/auth/AuthProvider';
import { PageHeader } from '@/components/AppShell';
import { CheckboxField, MultiSelectField, SearchSelectField, SelectField, SwitchField, TextareaField, TextField } from '@/components/form';
import { LoadingBlock } from '@/components/Loading';
import { LoadError, Notice } from '@/components/Notice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/toast';
import { useAsync } from '@/hooks/useAsync';
import { usePageTitle } from '@/hooks/usePageTitle';
import { api, errorMessage } from '@/lib/api';

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

function FormCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="gap-5">{children}</CardContent>
    </Card>
  );
}

export function MeEdit() {
  usePageTitle('Edit profile');
  const { user, email, profile } = useMember();
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { data: priv, loading, error, reload } = useAsync(() => api.profiles.getPrivate(user.id, email), [user.id]);

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
      toast.add({ title: 'Profile saved', type: 'success' });
      navigate('/me');
    } catch (err) {
      setSaveError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingBlock />;
  if (error) return <LoadError message={error} onRetry={reload} />;

  return (
    <div className="mx-auto max-w-[720px]">
      <PageHeader title="Edit profile" description="What other members see, and the private details that shape who you meet." back="/me" />
      <form onSubmit={(e) => void onSubmit(e)} className="grid gap-6" noValidate>
        <FormCard title="Basics">
          <div className="grid grid-cols-[1fr_112px] gap-3">
            <TextField label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            <TextField label="Age" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, ''))} />
          </div>
          <div className="grid gap-3">
            <SwitchField label="Show my height" checked={hasHeight} onCheckedChange={setHasHeight} />
            <div className="grid grid-cols-2 gap-3">
              <SelectField aria-label="Feet" options={FEET} value={height.feet} disabled={!hasHeight} onValueChange={(v) => setHeight((h) => ({ ...h, feet: v || h.feet }))} />
              <SelectField aria-label="Inches" options={INCHES} value={height.inches} disabled={!hasHeight} onValueChange={(v) => setHeight((h) => ({ ...h, inches: v || h.inches }))} />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-3">
            <SearchSelectField label="Your area" description="Private. Others see only the area name." options={AREA_OPTIONS} placeholder="Choose your area" value={areaId} onValueChange={setAreaId} />
            <SelectField label="Maximum distance" description="A hard boundary for discovery." options={DISTANCE_OPTIONS} value={maxDistance} onValueChange={(v) => setMaxDistance(v || maxDistance)} />
          </div>
          <TextareaField label="Bio" hint={`${bio.length}/${LIMITS.bioMax}`} maxLength={LIMITS.bioMax} rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
        </FormCard>

        <FormCard title="Work">
          <TextField label="Occupation" value={employment.occupation} onChange={(e) => setEmployment((v) => ({ ...v, occupation: e.target.value }))} />
          <TextField label="Employer" value={employment.employer} onChange={(e) => setEmployment((v) => ({ ...v, employer: e.target.value }))} />
          <SwitchField label="Show employer on my profile" description="Occupation is always shown" checked={employment.publicEmployerDisplayEnabled} onCheckedChange={(v) => setEmployment((s) => ({ ...s, publicEmployerDisplayEnabled: v }))} />
          <Separator />
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-3">
            <SelectField label="Employment status" options={EMPLOYMENT_STATUS_OPTIONS} value={employment.employmentStatus} onValueChange={(v) => setEmployment((s) => ({ ...s, employmentStatus: (v || s.employmentStatus) as EmploymentStatus }))} />
            <SelectField label="Field" options={INDUSTRY_OPTIONS} placeholder="Choose a field" value={industry} onValueChange={setIndustry} />
          </div>
          <SelectField label="Standing" options={STUDENT_STATUS_OPTIONS} placeholder="Student or professional" value={studentStatus} onValueChange={setStudentStatus} />
        </FormCard>

        <FormCard title="Education">
          <TextField label="School" value={education.school} onChange={(e) => setEducation((v) => ({ ...v, school: e.target.value }))} />
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-3">
            <SelectField label="Degree level" options={DEGREE_LEVEL_OPTIONS} value={education.degreeLevel} onValueChange={(v) => setEducation((s) => ({ ...s, degreeLevel: (v || s.degreeLevel) as DegreeLevel }))} />
            <TextField label="Field of study" value={education.fieldOfStudy} onChange={(e) => setEducation((v) => ({ ...v, fieldOfStudy: e.target.value }))} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 sm:items-end sm:gap-3">
            <SelectField label="Graduation year" options={YEARS} placeholder="Year" value={education.graduationYear ? String(education.graduationYear) : ''} onValueChange={(v) => setEducation((s) => ({ ...s, graduationYear: v ? Number(v) : null }))} />
            <CheckboxField label="Currently enrolled" checked={education.currentlyEnrolled} onCheckedChange={(v) => setEducation((s) => ({ ...s, currentlyEnrolled: v }))} className="sm:h-9 sm:items-center" />
          </div>
          <SwitchField label="Show education on my profile" checked={education.publicDisplayEnabled} onCheckedChange={(v) => setEducation((s) => ({ ...s, publicDisplayEnabled: v }))} />
        </FormCard>

        <FormCard title="Background" description="Optional. Nothing here is required, and you can keep race or ethnicity private.">
          <MultiSelectField label="Nationality" options={COUNTRY_OPTIONS} values={nationalities} onValuesChange={setNationalities} placeholder="Add one or more" />
          <div className="grid gap-3">
            <MultiSelectField
              label="Race / ethnicity"
              optional
              options={RACE_ETHNICITY_OPTIONS}
              values={preferNotToSay ? [] : raceEthnicities}
              onValuesChange={setRaceEthnicities}
              placeholder={preferNotToSay ? 'Prefer not to say' : 'Add one or more'}
              disabled={preferNotToSay}
            />
            <SwitchField label="Prefer not to say" description="Hides this field and keeps it out of matching entirely" checked={preferNotToSay} onCheckedChange={setPreferNotToSay} />
          </div>
          <MultiSelectField label="Languages" options={LANGUAGE_OPTIONS} values={languages} onValuesChange={setLanguages} placeholder="Add one or more" />
        </FormCard>

        <FormCard title="Intent and lifestyle">
          <SelectField label="Relationship intent" options={RELATIONSHIP_INTENT_OPTIONS} placeholder="Choose" value={intent} onValueChange={setIntent} />
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-3">
            <SelectField label="Drinking" options={DRINKING_OPTIONS} placeholder="Not set" value={drinking} onValueChange={setDrinking} />
            <SelectField label="Smoking" options={SMOKING_OPTIONS} placeholder="Not set" value={smoking} onValueChange={setSmoking} />
            <SelectField label="Exercise" options={EXERCISE_OPTIONS} placeholder="Not set" value={exercise} onValueChange={setExercise} />
            <SelectField label="Children" options={CHILDREN_OPTIONS} placeholder="Not set" value={children} onValueChange={setChildren} />
          </div>
        </FormCard>

        <FormCard title="Interests" description={`Up to ${LIMITS.interestsMax}. They show on your profile and help people start a conversation.`}>
          <MultiSelectField aria-label="Interests" options={INTEREST_OPTIONS} values={interests} onValuesChange={setInterests} max={LIMITS.interestsMax} placeholder={`Up to ${LIMITS.interestsMax}`} />
        </FormCard>

        {saveError ? <Notice tone="danger">{saveError}</Notice> : null}
        <div className="sticky bottom-16 z-10 -mx-4 flex justify-end gap-2 border-t bg-background px-4 py-3 md:bottom-0 md:mx-0 md:rounded-xl md:border md:px-4">
          <Button type="button" variant="ghost" onClick={() => navigate('/me')} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !firstName.trim()}>
            {busy ? <Spinner data-icon="inline-start" /> : null}
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
