import { LuBan, LuBookmark, LuBookmarkCheck, LuLink, LuMessageCircle, LuMessageSquareText, LuTrash2, LuUser, LuFlag } from 'react-icons/lu';
import { Link, useNavigate } from 'react-router-dom';
import { timeAgo, type Post } from '@peaches/core';
import { ActionContextMenu, MoreMenu, type MenuAction } from '@/components/ActionMenu';
import { PersonAvatar } from '@/components/PersonAvatar';
import { VerificationBadge } from '@/components/VerificationBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface PostHandlers {
  onToggleSave: (post: Post) => void;
  onRequestConversation: (post: Post) => void;
  onReport?: (post: Post) => void;
  onBlockAuthor?: (post: Post) => void;
  onDelete?: (post: Post) => void;
}

function copyLink(post: Post) {
  const url = `${window.location.origin}/post/${post.id}`;
  void navigator.clipboard
    .writeText(url)
    .then(() => toast.add({ title: 'Link copied', type: 'success' }))
    .catch(() => toast.add({ title: 'Could not copy the link', description: url, type: 'error' }));
}

function postActions(post: Post, handlers: PostHandlers, navigate: (to: string) => void, detail: boolean): MenuAction[] {
  const actions: MenuAction[] = [];
  if (!detail) actions.push({ label: 'Open post', icon: LuMessageCircle, onSelect: () => navigate(`/post/${post.id}`) });
  if (!post.own) actions.push({ label: `View ${post.author.firstName}'s profile`, icon: LuUser, onSelect: () => navigate(`/profile/${post.author.id}`) });
  actions.push({ label: post.savedByViewer ? 'Remove from saved' : 'Save post', icon: post.savedByViewer ? LuBookmarkCheck : LuBookmark, onSelect: () => handlers.onToggleSave(post) });
  if (!post.own) actions.push({ label: 'Request conversation', icon: LuMessageSquareText, onSelect: () => handlers.onRequestConversation(post) });
  actions.push({ label: 'Copy link', icon: LuLink, onSelect: () => copyLink(post) });
  if (post.own && handlers.onDelete) {
    const onDelete = handlers.onDelete;
    actions.push({ label: 'Delete post', icon: LuTrash2, onSelect: () => onDelete(post), destructive: true, separated: true });
  }
  if (!post.own && handlers.onReport) {
    const onReport = handlers.onReport;
    actions.push({ label: 'Report post', icon: LuFlag, onSelect: () => onReport(post), destructive: true, separated: true });
  }
  if (!post.own && handlers.onBlockAuthor) {
    const onBlock = handlers.onBlockAuthor;
    actions.push({ label: `Block ${post.author.firstName}`, icon: LuBan, onSelect: () => onBlock(post), destructive: true, separated: !handlers.onReport });
  }
  return actions;
}

/** A feed post: author, text, an optional photo, and quiet actions. No follower counts, no public popularity. */
export function PostCard({ post, detail = false, ...handlers }: { post: Post; detail?: boolean } & PostHandlers) {
  const navigate = useNavigate();
  const verified = post.author.publicVerificationBadges.length > 0;
  const actions = postActions(post, handlers, navigate, detail);
  return (
    <ActionContextMenu actions={actions}>
      <Card size="sm" className="gap-3" data-testid="post-card">
        <CardHeader className="flex items-center gap-3">
          <Link to={`/profile/${post.author.id}`} aria-label={`${post.author.firstName}'s profile`} className="shrink-0 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <PersonAvatar name={post.author.firstName} src={post.author.photos[0] ?? null} className="size-9" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Link to={`/profile/${post.author.id}`} className="truncate text-sm font-medium underline-offset-4 hover:underline">
                {post.author.firstName}
              </Link>
              {verified ? <VerificationBadge /> : null}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {post.author.displayArea} · <time dateTime={post.createdAt}>{timeAgo(post.createdAt)}</time>
            </p>
          </div>
          <MoreMenu actions={actions} label="Post options" className="-mr-2 text-muted-foreground" />
        </CardHeader>
        <CardContent className="gap-3">
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{post.body}</p>
          {post.photoUrl ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
              <img src={post.photoUrl} alt="" loading="lazy" className="size-full object-cover" />
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-foreground/10 ring-inset" />
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="gap-1 px-2">
          {detail ? (
            <span className="inline-flex h-8 items-center gap-1.5 px-2.5 text-sm text-muted-foreground">
              <LuMessageCircle className="size-4" />
              {post.commentCount}
              <span className="sr-only">comments</span>
            </span>
          ) : (
            <Link
              to={`/post/${post.id}`}
              aria-label={`${post.commentCount} comments`}
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <LuMessageCircle className="size-4" />
              {post.commentCount ? <span>{post.commentCount}</span> : null}
            </Link>
          )}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handlers.onToggleSave(post)}
                  aria-pressed={post.savedByViewer}
                  aria-label={post.savedByViewer ? 'Remove from saved' : 'Save'}
                  className={cn(post.savedByViewer ? 'text-foreground' : 'text-muted-foreground')}
                />
              }
            >
              {post.savedByViewer ? <LuBookmarkCheck /> : <LuBookmark />}
            </TooltipTrigger>
            <TooltipContent>{post.savedByViewer ? 'Saved' : 'Save'}</TooltipContent>
          </Tooltip>
          {!post.own ? (
            <Button variant="ghost" size="sm" onClick={() => handlers.onRequestConversation(post)} className="ml-auto text-muted-foreground hover:text-foreground">
              <LuMessageSquareText data-icon="inline-start" />
              Request conversation
            </Button>
          ) : null}
        </CardFooter>
      </Card>
    </ActionContextMenu>
  );
}
