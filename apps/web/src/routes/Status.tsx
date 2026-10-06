import { Link, useLocation, useParams } from 'react-router-dom';
import { longDate, type PublicApplicationStatus } from '@peaches/core';
import { LoadingBlock } from '@/components/Loading';
import { Notice } from '@/components/Notice';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAsync } from '@/hooks/useAsync';
import { usePageTitle } from '@/hooks/usePageTitle';
import { api } from '@/lib/api';
import { PublicFrame } from '@/routes/PublicFrame';

const VIEW: Record<PublicApplicationStatus, { label: string; title: string; body: string }> = {
  pending: { label: 'Under review', title: 'Your application is with the committee.', body: 'Most decisions take a few days. Nothing to do for now; check back here whenever you like.' },
  waitlisted: { label: 'Deferred', title: "We'd like a bit more time.", body: 'Your application is on hold rather than declined. We will revisit it as the community grows.' },
  approved: { label: 'Admitted', title: 'Welcome.', body: 'The committee has admitted you. Create your account to complete your profile and start meeting people.' },
  claimed: { label: 'Active member', title: "You're a member.", body: 'Your account is set up. Sign in to continue.' },
};

export function Status() {
  usePageTitle('Application status');
  const { token = '' } = useParams();
  const location = useLocation();
  const justSubmitted = (location.state as { justSubmitted?: boolean } | null)?.justSubmitted === true;
  const { data, loading, error } = useAsync(() => api.applications.status(token), [token]);

  if (loading) {
    return (
      <PublicFrame title="Application status">
        <LoadingBlock />
      </PublicFrame>
    );
  }
  if (error) {
    return (
      <PublicFrame title="Application status">
        <Notice tone="danger">{error}</Notice>
      </PublicFrame>
    );
  }
  if (!data) {
    return (
      <PublicFrame title="We couldn't find that application." lede="The link may be incomplete. If you have not applied yet, you can do that now.">
        <Link to="/apply" className={buttonVariants({ variant: 'outline' })}>
          Submit an application
        </Link>
      </PublicFrame>
    );
  }
  const view = VIEW[data.status];
  return (
    <PublicFrame title={view.title} lede={view.body}>
      <div className="grid gap-6" data-testid="status-page" data-status={data.status}>
        {justSubmitted ? <Notice title="Application received">Keep this link: it is the only way to check your status or create your account later.</Notice> : null}
        <Card>
          <CardContent>
            <dl className="grid grid-cols-[120px_1fr] gap-y-3 text-sm">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge variant={data.status === 'approved' || data.status === 'claimed' ? 'default' : 'secondary'}>{view.label}</Badge>
              </dd>
              <dt className="text-muted-foreground">Applicant</dt>
              <dd className="font-medium">{data.firstName}</dd>
              <dt className="text-muted-foreground">Submitted</dt>
              <dd>{longDate(data.createdAt)}</dd>
            </dl>
          </CardContent>
        </Card>
        {data.status === 'approved' ? (
          <Link to={`/signup/${token}`} className={buttonVariants({ size: 'lg' })}>
            Create your account
          </Link>
        ) : null}
        {data.status === 'claimed' ? (
          <Link to="/login" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            Sign in
          </Link>
        ) : null}
        <p className="text-sm text-muted-foreground">
          Bookmark this page to return.{' '}
          <Link to="/" className="font-medium text-foreground underline underline-offset-4">
            Back to start
          </Link>
        </p>
      </div>
    </PublicFrame>
  );
}
