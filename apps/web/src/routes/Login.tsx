import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { TextField } from '@/components/form';
import { Notice } from '@/components/Notice';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { usePageTitle } from '@/hooks/usePageTitle';
import { errorMessage } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { PublicFrame } from '@/routes/PublicFrame';

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
      <Card>
        <CardContent>
          <form onSubmit={(e) => void onSubmit(e)} className="grid gap-5" noValidate data-testid="login-form">
            {params.get('confirm') === '1' ? <Notice>Account created. Confirm it from the email we sent you, then sign in.</Notice> : null}
            <TextField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <TextField label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error ? <Notice tone="danger">{error}</Notice> : null}
            <Button type="submit" size="lg" disabled={busy || !email || !password} className="w-full">
              {busy ? <Spinner data-icon="inline-start" /> : null}
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="mt-8 grid gap-2 text-sm text-muted-foreground">
        <p>
          Not a member yet?{' '}
          <Link to="/apply" className="font-medium text-foreground underline underline-offset-4">
            Apply
          </Link>
        </p>
        <p>Applied already? Use the status link from your application to check on it or create your account.</p>
      </div>
    </PublicFrame>
  );
}
