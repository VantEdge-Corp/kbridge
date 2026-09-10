import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AREAS, BRAND, LEGAL_VERSIONS, LIMITS, isValidEmail, isValidLinkedin } from '@peaches/core';
import { api, errorMessage } from '../lib/api';
import { Button } from '../components/Button';
import { Checkbox, Input, Notice, Select, TextArea } from '../components/Field';
import { Group, GroupSection } from '../components/Group';
import { usePageTitle } from '../hooks/usePageTitle';
import { PublicFrame } from './PublicFrame';

interface Form {
  email: string;
  firstName: string;
  age: string;
  areaId: string;
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
  areaId: '',
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

const WHY_MAX = 600;

function validate(f: Form): Partial<Record<keyof Form, string>> {
  const errors: Partial<Record<keyof Form, string>> = {};
  if (!isValidEmail(f.email)) errors.email = 'Enter a valid email address.';
  if (!f.firstName.trim()) errors.firstName = 'Your first name is required.';
  if (f.age && (Number(f.age) < 18 || Number(f.age) > 120)) errors.age = 'You must be 18 or older.';
  if (!f.areaId) errors.areaId = 'Choose the area you live in.';
  if (!f.occupation.trim()) errors.occupation = 'Tell us what you do.';
  if (f.yearsExperience && (Number(f.yearsExperience) < 0 || Number(f.yearsExperience) > 80)) errors.yearsExperience = 'Enter a number between 0 and 80.';
  if (!isValidLinkedin(f.linkedinUrl)) errors.linkedinUrl = 'Enter a LinkedIn profile URL.';
  if (!f.why.trim()) errors.why = `Tell us why ${BRAND.name}.`;
  if (!f.age18) errors.age18 = 'Required.';
  if (!f.agreeTerms) errors.agreeTerms = 'Required.';
  return errors;
}

const AREA_OPTIONS = AREAS.map((a) => ({ value: a.id, label: a.name }));

export function Apply() {
  usePageTitle('Apply');
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(EMPTY);
  const [trap, setTrap] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errors = validate(form);
  const show = (key: keyof Form) => (touched ? errors[key] ?? null : null);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const digits = (v: string) => v.replace(/[^0-9]/g, '');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (trap) return; // honeypot: silently ignore bots
    if (Object.keys(errors).length > 0) return;
    setBusy(true);
    setError(null);
    try {
      const { statusToken } = await api.applications.submit({
        email: form.email,
        firstName: form.firstName,
        age: form.age ? Number(form.age) : null,
        areaId: form.areaId || null,
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
      navigate(`/status/${statusToken}`, { replace: true, state: { justSubmitted: true } });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PublicFrame
      title="Apply for membership"
      lede={`A few minutes. Every application is read by a person, and nothing here is shown publicly. You will get a link to check your status.`}
    >
      <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-6" data-testid="apply-form">
        <div className="absolute left-[-9999px] top-auto w-px h-px overflow-hidden" aria-hidden="true">
          <label>
            Do not fill this field
            <input type="text" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
          </label>
        </div>

        <Group>
          <GroupSection eyebrow="Contact">
            <div className="space-y-4">
              <Input label="Email" type="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={show('email')} />
              <div className="grid grid-cols-[1fr_120px] gap-3">
                <Input label="First name" autoComplete="given-name" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} error={show('firstName')} />
                <Input label="Age" inputMode="numeric" value={form.age} onChange={(e) => set('age', digits(e.target.value))} error={show('age')} />
              </div>
              <Select label="Area" help="Only the area name is ever shown to other members." options={AREA_OPTIONS} placeholder="Choose your area" value={form.areaId} onChange={(e) => set('areaId', e.target.value)} error={show('areaId')} />
            </div>
          </GroupSection>

          <GroupSection eyebrow="Work">
            <div className="space-y-4">
              <Input label="Occupation" placeholder="e.g. Product designer" value={form.occupation} onChange={(e) => set('occupation', e.target.value)} error={show('occupation')} />
              <div className="grid grid-cols-[1fr_140px] gap-3">
                <Input label="Employer" optional value={form.employer} onChange={(e) => set('employer', e.target.value)} />
                <Input label="Years" inputMode="numeric" value={form.yearsExperience} onChange={(e) => set('yearsExperience', digits(e.target.value))} error={show('yearsExperience')} />
              </div>
              <Input label="LinkedIn" optional type="url" placeholder="linkedin.com/in/you" value={form.linkedinUrl} onChange={(e) => set('linkedinUrl', e.target.value)} error={show('linkedinUrl')} />
            </div>
          </GroupSection>

          <GroupSection eyebrow="Education">
            <div className="grid grid-cols-[1fr_1fr] gap-3">
              <Input label="School" optional value={form.school} onChange={(e) => set('school', e.target.value)} />
              <Input label="Degree" optional placeholder="e.g. B.S. Biology" value={form.degree} onChange={(e) => set('degree', e.target.value)} />
            </div>
          </GroupSection>

          <GroupSection eyebrow="About you">
            <div className="space-y-4">
              <TextArea label="Short bio" hint={`${form.bio.length}/${LIMITS.bioMax}`} maxLength={LIMITS.bioMax} rows={3} value={form.bio} onChange={(e) => set('bio', e.target.value)} />
              <TextArea label={`Why ${BRAND.name}`} hint={`${form.why.length}/${WHY_MAX}`} maxLength={WHY_MAX} rows={4} value={form.why} onChange={(e) => set('why', e.target.value)} error={show('why')} />
            </div>
          </GroupSection>

          <GroupSection eyebrow="Consent">
          <Checkbox label="I am 18 years of age or older." checked={form.age18} onChange={(e) => set('age18', e.target.checked)} error={show('age18')} />
          <Checkbox
            label={
              <>
                I have read and agree to the{' '}
                <Link to="/terms" target="_blank" className="text-text underline underline-offset-2">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" target="_blank" className="text-text underline underline-offset-2">
                  Privacy Policy
                </Link>
                .
              </>
            }
            checked={form.agreeTerms}
            onChange={(e) => set('agreeTerms', e.target.checked)}
            error={show('agreeTerms')}
          />
          </GroupSection>
        </Group>

        {error ? <Notice tone="danger">{error}</Notice> : null}
        {touched && Object.keys(errors).length > 0 ? <Notice tone="danger">Please fix the highlighted fields.</Notice> : null}

        <div className="flex items-center justify-between gap-4">
          <p className="text-caption text-text-muted">Reviewed within a few days. No account until admitted.</p>
          <Button type="submit" disabled={busy}>
            {busy ? 'Submitting' : 'Submit application'}
          </Button>
        </div>
      </form>
    </PublicFrame>
  );
}
