import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AREAS, BRAND, LEGAL_VERSIONS, LIMITS, isValidEmail, isValidLinkedin } from '@peaches/core';
import { CheckboxField, SearchSelectField, TextareaField, TextField } from '@/components/form';
import { Notice } from '@/components/Notice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { usePageTitle } from '@/hooks/usePageTitle';
import { api, errorMessage } from '@/lib/api';
import { PublicFrame } from '@/routes/PublicFrame';

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

/** One titled card of the form. */
function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <p className="kicker text-muted-foreground">{title}</p>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="gap-5">{children}</CardContent>
    </Card>
  );
}

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

  const legalLink = (to: string, label: string) => (
    <Link to={to} target="_blank" className="font-medium text-foreground underline underline-offset-4">
      {label}
    </Link>
  );

  return (
    <PublicFrame kicker="By application" title="Apply for membership" lede="A few minutes. Every application is read by a person, and nothing here is shown publicly. You will get a link to check your status.">
      <form onSubmit={(e) => void onSubmit(e)} noValidate className="grid gap-6" data-testid="apply-form">
        <div className="absolute top-auto left-[-9999px] h-px w-px overflow-hidden" aria-hidden="true">
          <label>
            Do not fill this field
            <input type="text" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
          </label>
        </div>

        <Section title="Contact">
          <TextField label="Email" type="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={show('email')} />
          <div className="grid grid-cols-[1fr_112px] gap-3">
            <TextField label="First name" autoComplete="given-name" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} error={show('firstName')} />
            <TextField label="Age" inputMode="numeric" value={form.age} onChange={(e) => set('age', digits(e.target.value))} error={show('age')} />
          </div>
          <SearchSelectField
            label="Area"
            description="Only the area name is ever shown to other members."
            options={AREA_OPTIONS}
            placeholder="Choose your area"
            value={form.areaId}
            onValueChange={(v) => set('areaId', v)}
            error={show('areaId')}
          />
        </Section>

        <Section title="Work">
          <TextField label="Occupation" placeholder="e.g. Product designer" value={form.occupation} onChange={(e) => set('occupation', e.target.value)} error={show('occupation')} />
          <div className="grid grid-cols-[1fr_112px] gap-3">
            <TextField label="Employer" optional value={form.employer} onChange={(e) => set('employer', e.target.value)} />
            <TextField label="Years" inputMode="numeric" value={form.yearsExperience} onChange={(e) => set('yearsExperience', digits(e.target.value))} error={show('yearsExperience')} />
          </div>
          <TextField label="LinkedIn" optional type="url" placeholder="linkedin.com/in/you" value={form.linkedinUrl} onChange={(e) => set('linkedinUrl', e.target.value)} error={show('linkedinUrl')} />
        </Section>

        <Section title="Education">
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-3">
            <TextField label="School" optional value={form.school} onChange={(e) => set('school', e.target.value)} />
            <TextField label="Degree" optional placeholder="e.g. B.S. Biology" value={form.degree} onChange={(e) => set('degree', e.target.value)} />
          </div>
        </Section>

        <Section title="About you">
          <TextareaField label="Short bio" hint={`${form.bio.length}/${LIMITS.bioMax}`} maxLength={LIMITS.bioMax} rows={3} value={form.bio} onChange={(e) => set('bio', e.target.value)} />
          <TextareaField label={`Why ${BRAND.name}`} hint={`${form.why.length}/${WHY_MAX}`} maxLength={WHY_MAX} rows={4} value={form.why} onChange={(e) => set('why', e.target.value)} error={show('why')} />
        </Section>

        <Section title="Consent">
          <CheckboxField label="I am 18 years of age or older." checked={form.age18} onCheckedChange={(v) => set('age18', v)} error={show('age18')} />
          <CheckboxField
            label={
              <span>
                I have read and agree to the {legalLink('/terms', 'Terms of Service')} and {legalLink('/privacy', 'Privacy Policy')}.
              </span>
            }
            checked={form.agreeTerms}
            onCheckedChange={(v) => set('agreeTerms', v)}
            error={show('agreeTerms')}
          />
        </Section>

        {error ? <Notice tone="danger">{error}</Notice> : null}
        {touched && Object.keys(errors).length > 0 ? <Notice tone="danger">Please fix the highlighted fields.</Notice> : null}

        <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">Reviewed within a few days. No account until admitted.</p>
          <Button type="submit" size="lg" disabled={busy}>
            {busy ? <Spinner data-icon="inline-start" /> : null}
            Submit application
          </Button>
        </div>
      </form>
    </PublicFrame>
  );
}
