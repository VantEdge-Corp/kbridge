import type { Client } from './client';
import { ApiError, uniqueChannelName, unwrap } from './client';
import { BUCKETS, publicUrl, removeObjects, uploadImage, type UploadBody } from './storage';
import type { PostCommentRow, PostRow } from './rows';
import type { ProfilesApi } from './profiles';
import type { Post, PostComment } from '../types/social';
import { LIMITS } from '../constants/limits';

const POST_COLUMNS = 'id, author_id, body, photo_path, created_at';
const COMMENT_COLUMNS = 'id, post_id, author_id, body, created_at';

export function createPostsApi(client: Client, profiles: ProfilesApi) {
  async function hydrate(rows: PostRow[], viewerId: string): Promise<Post[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);
    const [authors, comments, saves] = await Promise.all([
      profiles.getMap(rows.map((r) => r.author_id)),
      client.from('post_comments').select('post_id').in('post_id', ids).then((r) => unwrap(r) as Array<{ post_id: string }>),
      client
        .from('post_saves')
        .select('post_id')
        .eq('user_id', viewerId)
        .in('post_id', ids)
        .then((r) => unwrap(r) as Array<{ post_id: string }>),
    ]);
    const counts = new Map<string, number>();
    for (const c of comments) counts.set(c.post_id, (counts.get(c.post_id) ?? 0) + 1);
    const saved = new Set(saves.map((s) => s.post_id));
    const out: Post[] = [];
    for (const r of rows) {
      const author = authors.get(r.author_id);
      if (!author) continue;
      out.push({
        id: r.id,
        author,
        body: r.body,
        photoUrl: r.photo_path ? publicUrl(client, BUCKETS.postPhotos, r.photo_path) : null,
        createdAt: r.created_at,
        commentCount: counts.get(r.id) ?? 0,
        savedByViewer: saved.has(r.id),
        own: r.author_id === viewerId,
      });
    }
    return out;
  }

  async function listFeed(viewerId: string, options: { limit?: number; before?: string } = {}): Promise<Post[]> {
    let query = client
      .from('posts')
      .select(POST_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(options.limit ?? 30);
    if (options.before) query = query.lt('created_at', options.before);
    const rows = unwrap(await query) as PostRow[];
    return hydrate(rows, viewerId);
  }

  async function listByAuthor(authorId: string, viewerId: string, limit = 20): Promise<Post[]> {
    const rows = unwrap(
      await client.from('posts').select(POST_COLUMNS).eq('author_id', authorId).order('created_at', { ascending: false }).limit(limit),
    ) as PostRow[];
    return hydrate(rows, viewerId);
  }

  async function listSaved(viewerId: string): Promise<Post[]> {
    const saves = unwrap(
      await client.from('post_saves').select('post_id, created_at').eq('user_id', viewerId).order('created_at', { ascending: false }),
    ) as Array<{ post_id: string }>;
    if (saves.length === 0) return [];
    const rows = unwrap(await client.from('posts').select(POST_COLUMNS).in('id', saves.map((s) => s.post_id))) as PostRow[];
    const order = new Map(saves.map((s, i) => [s.post_id, i]));
    rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    return hydrate(rows, viewerId);
  }

  async function create(viewerId: string, body: string, photo?: UploadBody | null): Promise<Post> {
    const text = body.trim();
    if (!text) throw new ApiError('Write something first.');
    if (text.length > LIMITS.postBodyMax) throw new ApiError(`Keep posts under ${LIMITS.postBodyMax} characters.`);
    const photoPath = photo ? await uploadImage(client, BUCKETS.postPhotos, viewerId, photo) : null;
    const row = unwrap(
      await client.from('posts').insert({ author_id: viewerId, body: text, photo_path: photoPath }).select(POST_COLUMNS).single(),
    ) as PostRow;
    const [post] = await hydrate([row], viewerId);
    if (!post) throw new ApiError('The post could not be loaded.');
    return post;
  }

  async function remove(post: Pick<Post, 'id' | 'photoUrl'> & { photoPath?: string | null }): Promise<void> {
    unwrap(await client.from('posts').delete().eq('id', post.id).select('id'));
    if (post.photoPath) await removeObjects(client, BUCKETS.postPhotos, [post.photoPath]);
  }

  async function setSaved(viewerId: string, postId: string, saved: boolean): Promise<void> {
    if (saved) {
      await client.from('post_saves').upsert({ user_id: viewerId, post_id: postId }, { onConflict: 'user_id,post_id', ignoreDuplicates: true });
    } else {
      await client.from('post_saves').delete().eq('user_id', viewerId).eq('post_id', postId);
    }
  }

  async function listComments(postId: string): Promise<PostComment[]> {
    const rows = unwrap(
      await client.from('post_comments').select(COMMENT_COLUMNS).eq('post_id', postId).order('created_at', { ascending: true }),
    ) as PostCommentRow[];
    const authors = await profiles.getMap(rows.map((r) => r.author_id));
    const out: PostComment[] = [];
    for (const r of rows) {
      const author = authors.get(r.author_id);
      if (!author) continue;
      out.push({ id: r.id, postId: r.post_id, author, body: r.body, createdAt: r.created_at });
    }
    return out;
  }

  async function addComment(viewerId: string, postId: string, body: string): Promise<void> {
    const text = body.trim();
    if (!text) throw new ApiError('Write a comment first.');
    if (text.length > LIMITS.commentBodyMax) throw new ApiError(`Keep comments under ${LIMITS.commentBodyMax} characters.`);
    unwrap(await client.from('post_comments').insert({ post_id: postId, author_id: viewerId, body: text }).select('id'));
  }

  async function removeComment(commentId: string): Promise<void> {
    unwrap(await client.from('post_comments').delete().eq('id', commentId).select('id'));
  }

  function subscribeFeed(onChange: () => void): () => void {
    const channel = client
      .channel(uniqueChannelName('feed'))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => onChange())
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }

  return { listFeed, listByAuthor, listSaved, create, remove, setSaved, listComments, addComment, removeComment, subscribeFeed };
}

export type PostsApi = ReturnType<typeof createPostsApi>;
