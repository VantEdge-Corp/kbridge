import { useState } from 'react';
import { Link } from 'react-router-dom';
import { timeAgo, type Post } from '@peaches/core';
import { Avatar } from './MonogramPortrait';
import { VerificationBadge } from './VerificationBadge';
import { Icon } from './icons';

/** Feed post: small avatar, name, verification, time, text, optional single photo, restrained actions. */
export function PostCard({
  post,
  onToggleSave,
  onRequestConversation,
  onReport,
  onDelete,
}: {
  post: Post;
  onToggleSave: (post: Post) => void;
  onRequestConversation: (post: Post) => void;
  onReport?: (post: Post) => void;
  onDelete?: (post: Post) => void;
}) {
  const [menu, setMenu] = useState(false);
  const verified = post.author.publicVerificationBadges.length > 0;
  return (
    <article className="border border-border rounded-lg bg-surface p-4" data-testid="post-card">
      <header className="flex items-center gap-3">
        <Link to={`/profile/${post.author.id}`} aria-label={`${post.author.firstName}'s profile`} className="rounded-full shrink-0">
          <Avatar name={post.author.firstName} src={post.author.photos[0] ?? null} size={36} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link to={`/profile/${post.author.id}`} className="text-body text-text font-medium truncate hover:underline underline-offset-2">
              {post.author.firstName}
            </Link>
            {verified ? <VerificationBadge /> : null}
          </div>
          <p className="text-caption text-text-muted truncate">
            {post.author.displayArea} · <time dateTime={post.createdAt}>{timeAgo(post.createdAt)}</time>
          </p>
        </div>
        {(onReport && !post.own) || (onDelete && post.own) ? (
          <div className="relative">
            <button type="button" aria-label="More" onClick={() => setMenu((m) => !m)} className="w-9 h-9 inline-flex items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-surface-hover">
              <Icon name="more" size={18} />
            </button>
            {menu ? (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
                <div role="menu" className="absolute right-0 top-full mt-1 z-50 min-w-40 bg-surface-elevated border border-border rounded-md py-1 shadow-xl">
                  {post.own && onDelete ? (
                    <button type="button" role="menuitem" className="w-full text-left px-4 h-11 text-body-sm text-danger hover:bg-surface-hover" onClick={() => { setMenu(false); onDelete(post); }}>
                      Delete post
                    </button>
                  ) : null}
                  {!post.own && onReport ? (
                    <button type="button" role="menuitem" className="w-full text-left px-4 h-11 text-body-sm text-text hover:bg-surface-hover" onClick={() => { setMenu(false); onReport(post); }}>
                      Report post
                    </button>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </header>
      <p className="mt-3 text-body text-text whitespace-pre-wrap break-words">{post.body}</p>
      {post.photoUrl ? (
        <div className="mt-3 aspect-[4/3] rounded-[12px] overflow-hidden border border-border bg-canvas">
          <img src={post.photoUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        </div>
      ) : null}
      <footer className="mt-3 flex items-center gap-1 -ml-2">
        <Link to={`/post/${post.id}`} className="inline-flex items-center gap-1.5 h-9 px-2 rounded-md text-body-sm text-text-muted hover:text-text hover:bg-surface-hover" aria-label={`${post.commentCount} comments`}>
          <Icon name="comment" size={18} />
          <span>{post.commentCount || ''}</span>
        </Link>
        <button
          type="button"
          onClick={() => onToggleSave(post)}
          aria-pressed={post.savedByViewer}
          aria-label={post.savedByViewer ? 'Remove from saved' : 'Save'}
          className={`inline-flex items-center gap-1.5 h-9 px-2 rounded-md text-body-sm hover:bg-surface-hover ${post.savedByViewer ? 'text-ivory' : 'text-text-muted hover:text-text'}`}
        >
          <Icon name="bookmark" size={18} fill={post.savedByViewer ? 'currentColor' : 'none'} />
        </button>
        {!post.own ? (
          <button type="button" onClick={() => onRequestConversation(post)} className="ml-auto inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border text-body-sm text-text hover:bg-surface-hover">
            <Icon name="message" size={16} />
            Request conversation
          </button>
        ) : null}
      </footer>
    </article>
  );
}
