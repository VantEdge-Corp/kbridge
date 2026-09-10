import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { errorMessage } from '../lib/api';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { Input, Notice } from '../components/Field';
import { Group, GroupSection } from '../components/Group';
import { usePageTitle } from '../hooks/usePageTitle';
import { PublicFrame } from './PublicFrame';

export function Login() {
  usePageTitle('Sign in');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) throw signInError;
      navigate('/home', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PublicFrame title="Sign in" lede="Members sign in with the email they applied with.">
      <Group>
        <GroupSection>
          <form onSubmit={(e) => void onSubmit(e)} className="space-y-4" noValidate data-testid="login-form">
            {params.get('confirm') === '1' ? <Notice>Account created. Confirm it from the email we sent you, then sign in.</Notice> : null}
            <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error ? <Notice tone="danger">{error}</Notice> : null}
            <Button type="submit" disabled={busy || !email || !password} className="w-full">
              {busy ? 'Signing in' : 'Sign in'}
            </Button>
          </form>
        </GroupSection>
      </Group>
      <div className="mt-8 space-y-2 text-body-sm text-text-muted">
        <p>
          Not a member yet?{' '}
          <Link to="/apply" className="text-text underline underline-offset-2">
            Apply
          </Link>
        </p>
        <p>Applied already? Use the status link from your application to check on it or create your account.</p>
      </div>
    </PublicFrame>
  );
}
