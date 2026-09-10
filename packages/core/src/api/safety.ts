import type { Client } from './client';
import { ApiError, unwrap } from './client';
import { BUCKETS, removeObjects } from './storage';
import type { ReportRow } from './rows';
import type { ProfilesApi } from './profiles';
import type { Report, ReportStatus } from '../types/social';
import type { PublicProfile } from '../types/profile';

export function createSafetyApi(client: Client, profiles: ProfilesApi) {
  async function block(viewerId: string, blockedId: string): Promise<void> {
    if (viewerId === blockedId) throw new ApiError("You can't block yourself.");
    await client.from('blocks').upsert({ blocker_id: viewerId, blocked_id: blockedId }, { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true });
  }

  async function unblock(viewerId: string, blockedId: string): Promise<void> {
    await client.from('blocks').delete().eq('blocker_id', viewerId).eq('blocked_id', blockedId);
  }

  async function listBlockedIds(viewerId: string): Promise<string[]> {
    const rows = unwrap(await client.from('blocks').select('blocked_id').eq('blocker_id', viewerId)) as Array<{ blocked_id: string }>;
    return rows.map((r) => r.blocked_id);
  }

  async function listBlocked(viewerId: string): Promise<PublicProfile[]> {
    return profiles.getMany(await listBlockedIds(viewerId));
  }

  async function report(input: {
    reporterId: string;
    reportedId: string;
    reason: string;
    detail?: string;
    matchId?: string | null;
    postId?: string | null;
  }): Promise<void> {
    unwrap(
      await client
        .from('reports')
        .insert({
          reporter_id: input.reporterId,
          reported_id: input.reportedId,
          reason: input.reason,
          detail: input.detail?.trim() || null,
          match_id: input.matchId ?? null,
          post_id: input.postId ?? null,
        })
        .select('id'),
    );
  }

  /** Removes stored photos (not covered by the database cascade), then the account itself. */
  async function deleteMyAccount(photoPaths: string[]): Promise<void> {
    await removeObjects(client, BUCKETS.profilePhotos, photoPaths);
    const { error } = await client.rpc('delete_my_account');
    if (error) throw new ApiError(error.message, error.code ?? null);
  }

  const admin = {
    async listReports(): Promise<Report[]> {
      const rows = unwrap(await client.from('reports').select('*').order('created_at', { ascending: false })) as ReportRow[];
      const ids = new Set<string>();
      for (const r of rows) {
        ids.add(r.reported_id);
        if (r.reporter_id) ids.add(r.reporter_id);
      }
      const names = unwrap(await client.from('profiles').select('id, first_name').in('id', Array.from(ids))) as Array<{
        id: string;
        first_name: string;
      }>;
      const byId = new Map(names.map((n) => [n.id, n.first_name]));
      return rows.map((r) => ({
        id: r.id,
        reporterId: r.reporter_id,
        reportedId: r.reported_id,
        reason: r.reason,
        detail: r.detail,
        matchId: r.match_id,
        postId: r.post_id,
        status: (['open', 'reviewed', 'actioned', 'dismissed'] as const).includes(r.status as ReportStatus) ? (r.status as ReportStatus) : 'open',
        createdAt: r.created_at,
        reporter: r.reporter_id ? { id: r.reporter_id, firstName: byId.get(r.reporter_id) ?? 'Former member' } : null,
        reported: { id: r.reported_id, firstName: byId.get(r.reported_id) ?? 'Member' },
      }));
    },
    async updateReportStatus(id: string, status: ReportStatus): Promise<void> {
      unwrap(await client.from('reports').update({ status }).eq('id', id).select('id'));
    },
  };

  return { block, unblock, listBlockedIds, listBlocked, report, deleteMyAccount, admin };
}

export type SafetyApi = ReturnType<typeof createSafetyApi>;
