import { useCallback, useEffect, useState } from 'react';
import type { Post } from '@peaches/core';
import { api, errorMessage } from '../lib/api';
import { useMember } from '../auth/AuthProvider';
import { PageHeader } from '../components/AppShell';
import { Button, LinkButton } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Notice } from '../components/Field';
import { Icon } from '../components/icons';
import { IntroductionNoteDialog } from '../components/IntroductionNoteDialog';
import { LoadingBlock } from '../components/Loading';
import { PostCard } from '../components/PostCard';
import { ReportDialog } from '../components/ReportDialog';
import { useAsync } from '../hooks/useAsync';
import { usePageTitle } from '../hooks/usePageTitle';

export function Feed() {
  usePageTitle('Feed');
  const { user } = useMember();
  const { data, loading, error, reload, setData } = useAsync(() => api.posts.listFeed(user.id), [user.id]);
  const [request, setRequest] = useState<Post | null>(null);
  const [report, setReport] = useState<Post | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
        setActionError(errorMessage(e));
        setData((list) => (list ? list.map((p) => (p.id === post.id ? { ...p, savedByViewer: !next } : p)) : list));
      }
    },
    [user.id, setData],
  );

  const remove = useCallback(
    async (post: Post) => {
      if (!window.confirm('Delete this post?')) return;
      try {
        await api.posts.remove({ id: post.id, photoUrl: post.photoUrl });
        setData((list) => (list ? list.filter((p) => p.id !== post.id) : list));
      } catch (e) {
        setActionError(errorMessage(e));
      }
    },
    [setData],
  );

  return (
    <div className="max-w-[640px]">
      <PageHeader
        title="Feed"
        actions={
          <LinkButton to="/post/new" size="sm">
            <Icon name="plus" size={16} />
            Post
          </LinkButton>
        }
      />
      {actionError ? (
        <div className="mb-4">
          <Notice tone="danger">{actionError}</Notice>
        </div>
      ) : null}
      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <div className="space-y-3">
          <Notice tone="danger">{error}</Notice>
          <Button variant="secondary" onClick={reload}>
            Try again
          </Button>
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState title="Nothing posted yet." body="Share a plan, a question, or something you noticed around town." action={<LinkButton to="/post/new" variant="secondary">Write the first post</LinkButton>} />
      ) : (
        <div className="space-y-3">
          {data.map((post) => (
            <PostCard key={post.id} post={post} onToggleSave={(p) => void toggleSave(p)} onRequestConversation={setRequest} onReport={setReport} onDelete={(p) => void remove(p)} />
          ))}
        </div>
      )}
      {request ? <IntroductionNoteDialog open onClose={() => setRequest(null)} recipient={request.author} postId={request.id} /> : null}
      {report ? <ReportDialog open onClose={() => setReport(null)} reportedId={report.author.id} reportedName={report.author.firstName} postId={report.id} /> : null}
    </div>
  );
}
