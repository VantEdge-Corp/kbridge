import { Link, useLocation, useParams } from 'react-router-dom';
import { longDate, type PublicApplicationStatus } from '@peaches/core';
import { api } from '../lib/api';
import { LinkButton } from '../components/Button';
import { Notice } from '../components/Field';
import { Group, GroupSection } from '../components/Group';
import { LoadingBlock } from '../components/Loading';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAsync } from '../hooks/useAsync';
import { PublicFrame } from './PublicFrame';

const VIEW: Record<PublicApplicationStatus, { eyebrow: string; title: string; body: string }> = {
  pending: { eyebrow: 'Under review', title: 'Your application is with the committee.', body: 'Most decisions take a few days. Nothing to do for now; check back here whenever you like.' },
  waitlisted: { eyebrow: 'Deferred', title: "We'd like a bit more time.", body: 'Your application is on hold rather than declined. We will revisit it as the community grows.' },
  approved: { eyebrow: 'Admitted', title: 'Welcome.', body: 'The committee has admitted you. Create your account to complete your profile and start meeting people.' },
  claimed: { eyebrow: 'Active member', title: "You're a member.", body: 'Your account is set up. Sign in to continue.' },
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
        <LinkButton to="/apply" variant="secondary">
          Submit an application
        </LinkButton>
      </PublicFrame>
    );
  }
  const view = VIEW[data.status];
  return (
    <PublicFrame title={view.title} lede={view.body}>
      <div className="space-y-6" data-testid="status-page" data-status={data.status}>
        {justSubmitted ? (
          <Notice>
            Application received. Keep this link: it is the only way to check your status or create your account later.
          </Notice>
        ) : null}
        <Group>
          <GroupSection>
            <dl className="grid grid-cols-[120px_1fr] gap-y-2.5 text-body-sm">
              <dt className="text-text-muted">Status</dt>
              <dd className="text-text">{view.eyebrow}</dd>
              <dt className="text-text-muted">Applicant</dt>
              <dd className="text-text">{data.firstName}</dd>
              <dt className="text-text-muted">Submitted</dt>
              <dd className="text-text">{longDate(data.createdAt)}</dd>
            </dl>
          </GroupSection>
        </Group>
        {data.status === 'approved' ? <LinkButton to={`/signup/${token}`}>Create your account</LinkButton> : null}
        {data.status === 'claimed' ? (
          <LinkButton to="/login" variant="secondary">
            Sign in
          </LinkButton>
        ) : null}
        <p className="text-body-sm text-text-muted">
          Bookmark this page to return.{' '}
          <Link to="/" className="underline underline-offset-2 hover:text-text">
            Back to start
          </Link>
        </p>
      </div>
    </PublicFrame>
  );
}
