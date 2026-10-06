import { useState, type FormEvent } from 'react';
import { LuFileX, LuMessageCircle } from 'react-icons/lu';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LIMITS, timeAgo, type Post } from '@peaches/core';
import { useMember } from '@/auth/AuthProvider';
import { PageHeader } from '@/components/AppShell';
import { useConfirm } from '@/components/ConfirmProvider';
import { EmptyState } from '@/components/EmptyState';
import { TextareaField } from '@/components/form';
import { IntroductionNoteDialog } from '@/components/IntroductionNoteDialog';
import { LoadingBlock } from '@/components/Loading';
import { LoadError, Notice } from '@/components/Notice';
import { PersonAvatar } from '@/components/PersonAvatar';
import { PostCard } from '@/components/PostCard';
import { ReportDialog } from '@/components/ReportDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/toast';
import { useAsync } from '@/hooks/useAsync';
import { usePageTitle } from '@/hooks/usePageTitle';
import { usePersonActions } from '@/hooks/usePersonActions';
import { api, errorMessage } from '@/lib/api';

export function PostDetail() {
  usePageTitle('Post');
  const { id = '' } = useParams();
  const { user } = useMember();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { data, loading, error, reload, setData } = useAsync(async () => {
    const [post, comments] = await Promise.all([api.posts.get(id, user.id), api.posts.listComments(id)]);
    return { post, comments };
  }, [id, user.id]);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [request, setRequest] = useState<Post | null>(null);
  const [report, setReport] = useState<Post | null>(null);
  const { blockMember } = usePersonActions({ onBlocked: () => navigate('/feed', { replace: true }) });

  const addComment = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setCommentError(null);
    try {
      await api.posts.addComment(user.id, id, comment);
      setComment('');
      reload();
    } catch (err) {
      setCommentError(errorMessage(err));
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
      setData((d) => (d?.post ? { ...d, post: { ...d.post, savedByViewer: !next } } : d));
      toast.add({ title: 'Could not save', description: errorMessage(err), type: 'error' });
    }
  };

  const remove = async (post: Post) => {
    const ok = await confirm({ title: 'Delete this post?', description: 'It disappears from the feed and its comments go with it. This cannot be undone.', confirmLabel: 'Delete', destructive: true });
    if (!ok) return;
    try {
      await api.posts.remove({ id: post.id, photoUrl: post.photoUrl });
      toast.add({ title: 'Post deleted', type: 'success' });
      navigate('/feed', { replace: true });
    } catch (err) {
      toast.add({ title: 'Could not delete', description: errorMessage(err), type: 'error' });
    }
  };

  return (
    <div className="mx-auto max-w-[680px]">
      <PageHeader title="Post" back="/feed" />
      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <LoadError message={error} onRetry={reload} />
      ) : !data?.post ? (
        <EmptyState icon={LuFileX} title="This post isn't available." body="It may have been deleted, or its author is no longer visible to you." />
      ) : (
        <div className="grid gap-4">
          <PostCard
            post={data.post}
            detail
            onToggleSave={(p) => void toggleSave(p)}
            onRequestConversation={setRequest}
            onReport={setReport}
            onBlockAuthor={(p) => void blockMember(p.author)}
            onDelete={(p) => void remove(p)}
          />
          <Card size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LuMessageCircle className="size-4 text-muted-foreground" />
                Comments
                <span className="text-muted-foreground tabular-nums">{data.comments.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="gap-0">
              <section aria-label="Comments">
                {data.comments.length === 0 ? <p className="pb-4 text-sm text-muted-foreground">No comments yet. Start the conversation.</p> : null}
                {data.comments.map((c, i) => (
                  <div key={c.id}>
                    {i > 0 ? <Separator className="my-3" /> : null}
                    <div className="flex gap-3">
                      <Link to={`/profile/${c.author.id}`} className="shrink-0 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                        <PersonAvatar name={c.author.firstName} src={c.author.photos[0] ?? null} className="size-7" />
                      </Link>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                          <Link to={`/profile/${c.author.id}`} className="font-medium text-foreground underline-offset-4 hover:underline">
                            {c.author.firstName}
                          </Link>{' '}
                          · {timeAgo(c.createdAt)}
                        </p>
                        <p className="mt-0.5 text-sm whitespace-pre-wrap break-words">{c.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </section>
              <Separator className="my-4" />
              <form onSubmit={(e) => void addComment(e)} className="grid gap-3">
                <TextareaField
                  label="Add a comment"
                  hint={`${comment.length}/${LIMITS.commentBodyMax}`}
                  maxLength={LIMITS.commentBodyMax}
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                {commentError ? <Notice tone="danger">{commentError}</Notice> : null}
                <div className="flex justify-end">
                  <Button type="submit" disabled={busy || !comment.trim()}>
                    {busy ? <Spinner data-icon="inline-start" /> : null}
                    Comment
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
      {request ? <IntroductionNoteDialog open onClose={() => setRequest(null)} recipient={request.author} postId={request.id} /> : null}
      {report ? <ReportDialog open onClose={() => setReport(null)} reportedId={report.author.id} reportedName={report.author.firstName} postId={report.id} /> : null}
    </div>
  );
}
