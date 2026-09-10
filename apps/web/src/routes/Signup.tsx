import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, errorMessage } from '../lib/api';
import { supabase } from '../lib/supabase';
import { Button, LinkButton } from '../components/Button';
import { Checkbox, Input, Notice } from '../components/Field';
import { Group, GroupSection } from '../components/Group';
import { LoadingBlock } from '../components/Loading';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAsync } from '../hooks/useAsync';
import { PublicFrame } from './PublicFrame';

const MIN_PASSWORD = 6;

export function Signup() {
  usePageTitle('Create your account');
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useAsync(() => api.applications.forSignup(token), [token]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (data) setEmail(data.email);
  }, [data]);

  const problems: string[] = [];
  if (password.length < MIN_PASSWORD) problems.push(`Password must be at least ${MIN_PASSWORD} characters.`);
  if (password !== confirm) problems.push('Passwords do not match.');
  if (!agree) problems.push('Please accept the Terms and Privacy Policy.');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (problems.length > 0) return;
    setBusy(true);
    setSubmitError(null);
    try {
      const { data: result, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password });
      if (signUpError) throw signUpError;
      if (result.user) await api.applications.recordProfileConsent(result.user.id);
      if (result.session) navigate('/home', { replace: true });
      else navigate('/login?confirm=1', { replace: true });
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <PublicFrame title="Create your account">
        <LoadingBlock />
      </PublicFrame>
    );
  }
  if (error || !data) {
    return (
      <PublicFrame title="This link isn't ready." lede={error ?? 'This signup link is invalid or your application has not been admitted yet.'}>
        <LinkButton to={`/status/${token}`} variant="secondary">
          Check your status
        </LinkButton>
      </PublicFrame>
    );
  }

  return (
    <PublicFrame title={`Welcome, ${data.firstName}.`} lede="Choose a password to create your account. Your email is the one you applied with.">
      <Group>
        <GroupSection>
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4" noValidate>
        <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} help="Must match your admitted application." />
        <Input label="Password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Input label="Confirm password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <Checkbox
          label={
            <>
              I agree to the{' '}
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
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
        />
        {submitError ? <Notice tone="danger">{submitError}</Notice> : null}
        <Button type="submit" disabled={busy || problems.length > 0} className="w-full">
          {busy ? 'Creating account' : 'Create account'}
        </Button>
        {problems.length > 0 && (password || confirm) ? <p className="text-body-sm text-text-muted">{problems[0]}</p> : null}
      </form>
        </GroupSection>
      </Group>
    </PublicFrame>
  );
}
