import { useState } from 'react';
import { Link } from 'react-router-dom';
import { timeAgo, type Post } from '@peaches/core';
import { Avatar } from './MonogramPortrait';
import { VerificationBadge } from './VerificationBadge';
import { Icon } from './icons';

/** Feed post inside a grouped container: 36px avatar, name, verification, time, text, optional single photo, thin actions. */
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
    <article className="bg-surface border border-border rounded-lg p-4" data-testid="post-card">
      <header className="flex items-center gap-3">
        <Link to={`/profile/${post.author.id}`} aria-label={`${post.author.firstName}'s profile`} className="rounded-full shrink-0 focus-ring">
          <Avatar name={post.author.firstName} src={post.author.photos[0] ?? null} size={36} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link to={`/profile/${post.author.id}`} className="text-body text-text font-medium truncate hover:underline underline-offset-4 decoration-1">
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
            <button type="button" aria-label="More" onClick={() => setMenu((m) => !m)} className="w-10 h-10 inline-flex items-center justify-center rounded-md text-text-muted motion hover:text-text hover:bg-surface-hover focus-ring">
              <Icon name="more" size={20} />
            </button>
            {menu ? (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
                <div role="menu" className="absolute right-0 top-full mt-1 z-50 min-w-44 bg-surface-elevated border border-border rounded-md py-1 shadow-sheet">
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
        <div className="relative mt-3 aspect-[4/3] rounded-md overflow-hidden bg-canvas">
          <img src={post.photoUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-md ring-1 ring-inset ring-image-ring" />
        </div>
      ) : null}
      <footer className="mt-3 -ml-2.5 -mb-1 flex items-center gap-2">
        <Link to={`/post/${post.id}`} className="inline-flex items-center gap-1.5 h-10 px-2.5 rounded-md text-body-sm text-text-muted motion hover:text-text hover:bg-surface-hover focus-ring" aria-label={`${post.commentCount} comments`}>
          <Icon name="comment" size={20} />
          {post.commentCount ? <span>{post.commentCount}</span> : null}
        </Link>
        <button
          type="button"
          onClick={() => onToggleSave(post)}
          aria-pressed={post.savedByViewer}
          aria-label={post.savedByViewer ? 'Remove from saved' : 'Save'}
          className={`inline-flex items-center h-10 px-2.5 rounded-md motion hover:bg-surface-hover focus-ring ${post.savedByViewer ? 'text-ivory' : 'text-text-muted hover:text-text'}`}
        >
          <Icon name="bookmark" size={20} fill={post.savedByViewer ? 'currentColor' : 'none'} />
        </button>
        {!post.own ? (
          <button type="button" onClick={() => onRequestConversation(post)} className="ml-auto inline-flex items-center gap-2 h-10 px-3 rounded-md text-body-sm text-text-secondary motion hover:text-text hover:bg-surface-hover focus-ring">
            <Icon name="message" size={18} />
            Request conversation
          </button>
        ) : null}
      </footer>
    </article>
  );
}
