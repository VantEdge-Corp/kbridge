import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LIMITS, timeAgo, type Post } from '@peaches/core';
import { api, errorMessage } from '../lib/api';
import { useMember } from '../auth/AuthProvider';
import { PageHeader } from '../components/AppShell';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Notice, TextArea } from '../components/Field';
import { Group, GroupSection, ROW_HAIRLINE, rowInset } from '../components/Group';
import { IntroductionNoteDialog } from '../components/IntroductionNoteDialog';
import { LoadingBlock } from '../components/Loading';
import { Avatar } from '../components/MonogramPortrait';
import { PostCard } from '../components/PostCard';
import { ReportDialog } from '../components/ReportDialog';
import { useAsync } from '../hooks/useAsync';
import { usePageTitle } from '../hooks/usePageTitle';

export function PostDetail() {
  usePageTitle('Post');
  const { id = '' } = useParams();
  const { user } = useMember();
  const navigate = useNavigate();
  const { data, loading, error, reload, setData } = useAsync(async () => {
    const [post, comments] = await Promise.all([api.posts.get(id, user.id), api.posts.listComments(id)]);
    return { post, comments };
  }, [id, user.id]);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [request, setRequest] = useState<Post | null>(null);
  const [report, setReport] = useState<Post | null>(null);

  const addComment = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setActionError(null);
    try {
      await api.posts.addComment(user.id, id, comment);
      setComment('');
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const toggleSave = async (post: Post) => {
    const next = !post.savedByViewer;
    setData((d) => (d?.post ? { ...d, post: { ...d.post, savedByViewer: next } } : d));
    try {
      await api.posts.setSaved(user.id, post.id, next);
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  const remove = async (post: Post) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.posts.remove({ id: post.id, photoUrl: post.photoUrl });
      navigate('/feed', { replace: true });
    } catch (err) {
      setActionError(errorMessage(err));
    }
  };

  return (
    <div className="max-w-[720px]">
      <PageHeader title="Post" back="/feed" />
      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <Notice tone="danger">{error}</Notice>
      ) : !data?.post ? (
        <EmptyState title="This post isn't available." />
      ) : (
        <div className="space-y-5">
          <PostCard post={data.post} onToggleSave={(p) => void toggleSave(p)} onRequestConversation={setRequest} onReport={setReport} onDelete={(p) => void remove(p)} />
          {actionError ? <Notice tone="danger">{actionError}</Notice> : null}
          <Group>
            <section aria-label="Comments">
              {data.comments.length === 0 ? <p className="px-4 py-4 text-body-sm text-text-muted">No comments yet.</p> : null}
              {data.comments.map((c) => (
                <div key={c.id} className={`${ROW_HAIRLINE} flex gap-3 px-4 py-3.5`} style={rowInset(56)}>
                  <Link to={`/profile/${c.author.id}`} className="shrink-0 rounded-full focus-ring">
                    <Avatar name={c.author.firstName} src={c.author.photos[0] ?? null} size={28} />
                  </Link>
                  <div className="min-w-0">
                    <p className="text-caption text-text-muted">
                      <Link to={`/profile/${c.author.id}`} className="text-text hover:underline underline-offset-4 decoration-1">
                        {c.author.firstName}
                      </Link>{' '}
                      · {timeAgo(c.createdAt)}
                    </p>
                    <p className="mt-0.5 text-body-sm text-text whitespace-pre-wrap break-words">{c.body}</p>
                  </div>
                </div>
              ))}
            </section>
            <GroupSection>
              <form onSubmit={(e) => void addComment(e)} className="space-y-3">
                <TextArea label="Add a comment" hint={`${comment.length}/${LIMITS.commentBodyMax}`} maxLength={LIMITS.commentBodyMax} rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
                <div className="flex justify-end">
                  <Button type="submit" size="sm" disabled={busy || !comment.trim()}>
                    {busy ? 'Posting' : 'Comment'}
                  </Button>
                </div>
              </form>
            </GroupSection>
          </Group>
        </div>
      )}
      {request ? <IntroductionNoteDialog open onClose={() => setRequest(null)} recipient={request.author} postId={request.id} /> : null}
      {report ? <ReportDialog open onClose={() => setReport(null)} reportedId={report.author.id} reportedName={report.author.firstName} postId={report.id} /> : null}
    </div>
  );
}
