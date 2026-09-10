import type { Client } from './client';
import { ApiError, unwrap } from './client';
import type { ApplicationDbRow } from './rows';
import type {
  AdminApplicationStatus,
  ApplicationRow,
  ApplicationStatusRecord,
  ApplicationSubmission,
  PublicApplicationStatus,
} from '../types/social';
import { LEGAL_VERSIONS } from '../constants/limits';

export const ADMIN_STATUSES: readonly AdminApplicationStatus[] = ['pending', 'waitlisted', 'approved', 'claimed', 'rejected'];

function publicStatus(value: string): PublicApplicationStatus {
  return value === 'waitlisted' || value === 'approved' || value === 'claimed' ? value : 'pending';
}

function adminStatus(value: string): AdminApplicationStatus {
  return (ADMIN_STATUSES as readonly string[]).includes(value) ? (value as AdminApplicationStatus) : 'pending';
}

export function toApplicationRow(r: ApplicationDbRow): ApplicationRow {
  return {
    id: r.id,
    email: r.email,
    status: adminStatus(r.status),
    firstName: r.first_name,
    age: r.age,
    city: r.city,
    occupation: r.profession ?? r.occupation,
    company: r.company,
    yearsExperience: r.years_experience,
    linkedinUrl: r.linkedin_url ?? r.link,
    school: r.school,
    degree: r.degree,
    bio: r.bio,
    why: r.why,
    internalNote: r.internal_note,
    score: r.score == null ? null : Number(r.score),
    createdAt: r.created_at,
    decidedAt: r.decided_at,
    claimedBy: r.claimed_by,
    ageConfirmed: r.age_confirmed,
    termsVersion: r.terms_version,
    privacyVersion: r.privacy_version,
    consentedAt: r.consented_at,
  };
}

export function createApplicationsApi(client: Client) {
  /**
   * Public: submit an application. The server stamps consent time and keeps
   * committee-owned columns out of reach. Returns the status token, which is
   * the applicant's only credential until they are admitted.
   */
  async function submit(input: ApplicationSubmission): Promise<{ statusToken: string; email: string }> {
    const payload = {
      email: input.email.trim().toLowerCase(),
      first_name: input.firstName.trim(),
      age: input.age,
      area_id: input.areaId,
      profession: input.occupation.trim(),
      company: input.employer.trim(),
      years_experience: input.yearsExperience,
      linkedin_url: input.linkedinUrl.trim(),
      school: input.school.trim(),
      degree: input.degree.trim(),
      bio: input.bio.trim(),
      why: input.why.trim(),
      age_confirmed: input.consent.ageConfirmed,
      terms_version: input.consent.termsVersion,
      privacy_version: input.consent.privacyVersion,
    };
    const result = await client.rpc('submit_application', { p_payload: payload });
    if (result.error) {
      if (result.error.code === '23505') throw new ApiError('An application from this email is already on file.', '23505');
      throw new ApiError(result.error.message, result.error.code ?? null);
    }
    const row = (result.data as Array<{ status_token: string; email: string }> | null)?.[0];
    if (!row) throw new ApiError('The application could not be submitted.');
    return { statusToken: row.status_token, email: row.email };
  }

  async function status(token: string): Promise<ApplicationStatusRecord | null> {
    const data = unwrap(await client.rpc('get_application_status', { p_token: token.trim() })) as Array<{
      status: string;
      first_name: string;
      created_at: string;
    }> | null;
    const row = data?.[0];
    if (!row) return null;
    return { status: publicStatus(row.status), firstName: row.first_name, createdAt: row.created_at };
  }

  async function forSignup(token: string): Promise<{ email: string; firstName: string } | null> {
    const data = unwrap(await client.rpc('get_application_for_signup', { p_token: token.trim() })) as Array<{
      email: string;
      first_name: string;
    }> | null;
    const row = data?.[0];
    return row ? { email: row.email, firstName: row.first_name } : null;
  }

  /** Best effort: the approved application already holds the same acceptance. */
  async function recordProfileConsent(userId: string): Promise<void> {
    try {
      await client
        .from('profiles')
        .update({
          terms_version: LEGAL_VERSIONS.terms,
          privacy_version: LEGAL_VERSIONS.privacy,
          consented_at: new Date().toISOString(),
        })
        .eq('id', userId);
    } catch {
      /* non-fatal */
    }
  }

  const admin = {
    async list(options: { status?: AdminApplicationStatus; search?: string } = {}): Promise<ApplicationRow[]> {
      let query = client.from('applications').select('*').order('created_at', { ascending: false });
      if (options.status) query = query.eq('status', options.status);
      const rows = (unwrap(await query) as ApplicationDbRow[]).map(toApplicationRow);
      const q = options.search?.trim().toLowerCase();
      if (!q) return rows;
      return rows.filter((r) =>
        [r.firstName, r.email, r.city, r.occupation, r.company, r.school].some((v) => v?.toLowerCase().includes(q)),
      );
    },
    async decide(id: string, status: AdminApplicationStatus, decidedBy: string): Promise<void> {
      const row =
        status === 'pending'
          ? { status, decided_at: null, decided_by: null, updated_at: new Date().toISOString() }
          : { status, decided_at: new Date().toISOString(), decided_by: decidedBy, updated_at: new Date().toISOString() };
      unwrap(await client.from('applications').update(row).eq('id', id).select('id'));
    },
    async saveNote(id: string, note: string): Promise<void> {
      unwrap(await client.from('applications').update({ internal_note: note, updated_at: new Date().toISOString() }).eq('id', id).select('id'));
    },
  };

  return { submit, status, forSignup, recordProfileConsent, admin };
}

export type ApplicationsApi = ReturnType<typeof createApplicationsApi>;
