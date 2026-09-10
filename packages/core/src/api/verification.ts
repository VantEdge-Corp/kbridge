import type { Client } from './client';
import { ApiError, unwrap } from './client';
import { toVerification } from './mappers';
import type { AdminMemberRow, MemberPrivateRow } from './rows';
import type { VerificationData, VerificationDimension, VerificationState } from '../types/verification';

/** What the committee sees when reviewing verification requests. */
export interface AdminMember {
  id: string;
  firstName: string;
  memberNumber: string | null;
  displayArea: string;
  occupation: string;
  employer: string;
  school: string;
  degreeLevel: string | null;
  fieldOfStudy: string;
  verification: VerificationData;
  suspended: boolean;
  createdAt: string;
  lastActiveAt: string;
  photoCount: number;
}

export function createVerificationApi(client: Client) {
  /** A member asks the committee to review one dimension. */
  async function request(dimension: VerificationDimension): Promise<void> {
    const { error } = await client.rpc('request_verification', { p_dimension: dimension });
    if (error) throw new ApiError(error.message, error.code ?? null);
  }

  const admin = {
    async set(profileId: string, dimension: VerificationDimension, state: VerificationState): Promise<void> {
      const { error } = await client.rpc('set_verification', { p_profile: profileId, p_dimension: dimension, p_state: state });
      if (error) throw new ApiError(error.message, error.code ?? null);
    },
    async setSuspended(profileId: string, suspended: boolean): Promise<void> {
      const { error } = await client.rpc('set_member_suspended', { p_profile: profileId, p_suspended: suspended });
      if (error) throw new ApiError(error.message, error.code ?? null);
    },
    async listMembers(options: { search?: string; pendingOnly?: boolean } = {}): Promise<AdminMember[]> {
      const [profileRows, privateRows] = await Promise.all([
        client
          .from('profiles')
          .select(
            'id, first_name, member_number, display_area, occupation, photo_paths, created_at, last_active_at, suspended_at, ' +
              'verification_identity, verification_education, verification_student, verification_employment',
          )
          .eq('onboarding_complete', true)
          .order('created_at', { ascending: false })
          .then((r) => unwrap(r) as Array<Partial<AdminMemberRow> & { id: string; first_name: string }>),
        client.from('member_private').select('*').then((r) => unwrap(r) as MemberPrivateRow[]),
      ]);
      const priv = new Map(privateRows.map((p) => [p.user_id, p]));
      let members: AdminMember[] = profileRows.map((p) => {
        const mp = priv.get(p.id);
        return {
          id: p.id,
          firstName: p.first_name,
          memberNumber: p.member_number ?? null,
          displayArea: p.display_area ?? 'Metro Atlanta',
          occupation: mp?.occupation ?? p.occupation ?? '',
          employer: mp?.employer ?? '',
          school: mp?.school ?? '',
          degreeLevel: mp?.degree_level ?? null,
          fieldOfStudy: mp?.field_of_study ?? '',
          verification: toVerification(p as AdminMemberRow),
          suspended: !!p.suspended_at,
          createdAt: p.created_at ?? '',
          lastActiveAt: p.last_active_at ?? '',
          photoCount: p.photo_paths?.length ?? 0,
        };
      });
      if (options.pendingOnly) {
        members = members.filter((m) => Object.values(m.verification).includes('pending'));
      }
      const q = options.search?.trim().toLowerCase();
      if (q) {
        members = members.filter((m) =>
          [m.firstName, m.occupation, m.employer, m.school, m.displayArea, m.memberNumber ?? ''].some((v) => v.toLowerCase().includes(q)),
        );
      }
      return members;
    },
  };

  return { request, admin };
}

export type VerificationApi = ReturnType<typeof createVerificationApi>;
