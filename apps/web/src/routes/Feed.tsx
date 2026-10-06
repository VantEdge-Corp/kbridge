import { useCallback, useEffect, useState } from 'react';
import { LuNewspaper, LuPlus } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import type { Post } from '@peaches/core';
import { useMember } from '@/auth/AuthProvider';
import { PageHeader } from '@/components/AppShell';
import { useConfirm } from '@/components/ConfirmProvider';
import { EmptyState } from '@/components/EmptyState';
import { IntroductionNoteDialog } from '@/components/IntroductionNoteDialog';
import { RowsSkeleton } from '@/components/Loading';
import { LoadError } from '@/components/Notice';
import { PostCard } from '@/components/PostCard';
import { ReportDialog } from '@/components/ReportDialog';
import { buttonVariants } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { useAsync } from '@/hooks/useAsync';
import { usePageTitle } from '@/hooks/usePageTitle';
import { usePersonActions } from '@/hooks/usePersonActions';
import { api, errorMessage } from '@/lib/api';

export function Feed() {
  usePageTitle('Feed');
  const { user } = useMember();
  const confirm = useConfirm();
  const { data, loading, error, reload, setData } = useAsync(() => api.posts.listFeed(user.id), [user.id]);
  const [request, setRequest] = useState<Post | null>(null);
  const [report, setReport] = useState<Post | null>(null);
  const { blockMember } = usePersonActions({ onBlocked: (id) => setData((list) => (list ? list.filter((p) => p.author.id !== id) : list)) });

  useEffect(() => {
    let timer: number | undefined;
    const unsubscribe = api.posts.subscribeFeed(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(reload, 800);
    });
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [reload]);

  const toggleSave = useCallback(
    async (post: Post) => {
      const next = !post.savedByViewer;
      setData((list) => (list ? list.map((p) => (p.id === post.id ? { ...p, savedByViewer: next } : p)) : list));
      try {
        await api.posts.setSaved(user.id, post.id, next);
      } catch (e) {
        toast.add({ title: 'Could not save', description: errorMessage(e), type: 'error' });
        setData((list) => (list ? list.map((p) => (p.id === post.id ? { ...p, savedByViewer: !next } : p)) : list));
      }
    },
    [user.id, setData],
  );

  const remove = useCallback(
    async (post: Post) => {
      const ok = await confirm({ title: 'Delete this post?', description: 'It disappears from the feed and its comments go with it. This cannot be undone.', confirmLabel: 'Delete', destructive: true });
      if (!ok) return;
      try {
        await api.posts.remove({ id: post.id, photoUrl: post.photoUrl });
        setData((list) => (list ? list.filter((p) => p.id !== post.id) : list));
        toast.add({ title: 'Post deleted', type: 'success' });
      } catch (e) {
        toast.add({ title: 'Could not delete', description: errorMessage(e), type: 'error' });
      }
    },
    [confirm, setData],
  );

  return (
    <div className="mx-auto max-w-[680px]">
      <PageHeader
        title="Feed"
        description="Plans, questions, and things noticed around town."
        actions={
          <Link to="/post/new" className={buttonVariants()}>
            <LuPlus data-icon="inline-start" />
            Post
          </Link>
        }
      />
      {loading ? (
        <RowsSkeleton rows={3} />
      ) : error ? (
        <LoadError message={error} onRetry={reload} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={LuNewspaper}
          title="Nothing posted yet."
          body="Share a plan, a question, or something you noticed around town."
          action={
            <Link to="/post/new" className={buttonVariants({ variant: 'outline' })}>
              Write the first post
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4">
          {data.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onToggleSave={(p) => void toggleSave(p)}
              onRequestConversation={setRequest}
              onReport={setReport}
              onBlockAuthor={(p) => void blockMember(p.author)}
              onDelete={(p) => void remove(p)}
            />
          ))}
        </div>
      )}
      {request ? <IntroductionNoteDialog open onClose={() => setRequest(null)} recipient={request.author} postId={request.id} /> : null}
      {report ? <ReportDialog open onClose={() => setReport(null)} reportedId={report.author.id} reportedName={report.author.firstName} postId={report.id} /> : null}
    </div>
  );
}
