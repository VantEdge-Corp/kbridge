import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckboxField, TextField } from '@/components/form';
import { LoadingBlock } from '@/components/Loading';
import { Notice } from '@/components/Notice';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useAsync } from '@/hooks/useAsync';
import { usePageTitle } from '@/hooks/usePageTitle';
import { api, errorMessage } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { PublicFrame } from '@/routes/PublicFrame';

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
      <PublicFrame kicker="Your membership" title="Create your account">
        <LoadingBlock />
      </PublicFrame>
    );
  }
  if (error || !data) {
    return (
      <PublicFrame kicker="Your membership" title="This link isn't ready." lede={error ?? 'This signup link is invalid or your application has not been admitted yet.'}>
        <Link to={`/status/${token}`} className={buttonVariants({ variant: 'outline' })}>
          Check your status
        </Link>
      </PublicFrame>
    );
  }

  const legalLink = (to: string, label: string) => (
    <Link to={to} target="_blank" className="font-medium text-foreground underline underline-offset-4">
      {label}
    </Link>
  );

  return (
    <PublicFrame kicker="Your membership" title={`Welcome, ${data.firstName}.`} lede="Choose a password to create your account. Your email is the one you applied with.">
      <Card>
        <CardContent>
          <form onSubmit={(e) => void onSubmit(e)} className="grid gap-5" noValidate>
            <TextField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} description="Must match your admitted application." />
            <TextField label="Password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <TextField label="Confirm password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <CheckboxField
              label={
                <span>
                  I agree to the {legalLink('/terms', 'Terms of Service')} and {legalLink('/privacy', 'Privacy Policy')}.
                </span>
              }
              checked={agree}
              onCheckedChange={setAgree}
            />
            {submitError ? <Notice tone="danger">{submitError}</Notice> : null}
            <Button type="submit" size="lg" disabled={busy || problems.length > 0} className="w-full">
              {busy ? <Spinner data-icon="inline-start" /> : null}
              Create account
            </Button>
            {problems.length > 0 && (password || confirm) ? <p className="text-sm text-muted-foreground">{problems[0]}</p> : null}
          </form>
        </CardContent>
      </Card>
    </PublicFrame>
  );
}
