import type { Client } from './client';
import { chunk, unwrap, unwrapMaybe } from './client';
import { BUCKETS, removeObjects, uploadImage, type UploadBody } from './storage';
import { toOwnProfile, toPreferences, toPrivate, toPublicProfile } from './mappers';
import { OWN_PROFILE_COLUMNS, PUBLIC_PROFILE_COLUMNS } from './rows';
import type { MemberPrivateRow, OwnProfileRow, PreferencesRow, PublicProfileRow } from './rows';
import type {
  ChildrenPlan,
  DrinkingHabit,
  Education,
  Employment,
  ExerciseHabit,
  Industry,
  OwnProfile,
  PrivateUserData,
  PublicProfile,
  RaceEthnicity,
  RaceEthnicityDisclosure,
  RelationshipIntent,
  SmokingHabit,
  StudentStatus,
} from '../types/profile';
import type { Preferences } from '../types/preferences';
import { LIMITS } from '../constants/limits';
import { ApiError } from './client';

/** Fields a member edits on their own public profile. */
export interface PublicProfilePatch {
  firstName?: string;
  age?: number | null;
  height?: number | null;
  industry?: Industry | null;
  studentStatus?: StudentStatus | null;
  nationalities?: string[];
  raceEthnicities?: RaceEthnicity[];
  raceEthnicityDisclosure?: RaceEthnicityDisclosure;
  languages?: string[];
  relationshipIntent?: RelationshipIntent | null;
  lifestyle?: {
    drinking?: DrinkingHabit | null;
    smoking?: SmokingHabit | null;
    exercise?: ExerciseHabit | null;
    children?: ChildrenPlan | null;
  };
  interests?: string[];
  bio?: string;
}

export interface PrivatePatch {
  areaId?: string | null;
  maxDistanceMiles?: number;
  education?: Education;
  employment?: Employment;
}

export function createProfilesApi(client: Client) {
  async function getMany(ids: readonly string[]): Promise<PublicProfile[]> {
    const unique = Array.from(new Set(ids));
    if (unique.length === 0) return [];
    const rows: PublicProfileRow[] = [];
    for (const batch of chunk(unique, 100)) {
      const data = unwrap(await client.from('public_profiles').select(PUBLIC_PROFILE_COLUMNS).in('id', batch));
      rows.push(...(data as PublicProfileRow[]));
    }
    return rows.map((r) => toPublicProfile(client, r));
  }

  /** Same as getMany but keyed by id, for joining onto other rows. */
  async function getMap(ids: readonly string[]): Promise<Map<string, PublicProfile>> {
    const list = await getMany(ids);
    return new Map(list.map((p) => [p.id, p]));
  }

  async function get(id: string): Promise<PublicProfile | null> {
    const data = unwrapMaybe(
      await client.from('public_profiles').select(PUBLIC_PROFILE_COLUMNS).eq('id', id).maybeSingle(),
    );
    return data ? toPublicProfile(client, data as PublicProfileRow) : null;
  }

  async function getOwn(userId: string): Promise<OwnProfile | null> {
    const data = unwrapMaybe(await client.from('profiles').select(OWN_PROFILE_COLUMNS).eq('id', userId).maybeSingle());
    return data ? toOwnProfile(client, data as OwnProfileRow) : null;
  }

  async function updatePublic(userId: string, patch: PublicProfilePatch): Promise<void> {
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.firstName !== undefined) {
      const name = patch.firstName.trim();
      if (!name) throw new ApiError('First name is required.');
      row.first_name = name;
    }
    if (patch.age !== undefined) row.age = patch.age;
    if (patch.height !== undefined) row.height_cm = patch.height;
    if (patch.industry !== undefined) row.industry = patch.industry;
    if (patch.studentStatus !== undefined) row.student_status = patch.studentStatus;
    if (patch.nationalities !== undefined) row.nationalities = patch.nationalities;
    if (patch.raceEthnicityDisclosure !== undefined) {
      row.race_ethnicity_disclosure = patch.raceEthnicityDisclosure;
      if (patch.raceEthnicityDisclosure !== 'disclosed') row.race_ethnicities = [];
    }
    if (patch.raceEthnicities !== undefined) {
      row.race_ethnicities = patch.raceEthnicities;
      if (patch.raceEthnicities.length > 0 && patch.raceEthnicityDisclosure === undefined) {
        row.race_ethnicity_disclosure = 'disclosed';
      }
    }
    if (patch.languages !== undefined) row.languages = patch.languages;
    if (patch.relationshipIntent !== undefined) row.relationship_intent = patch.relationshipIntent;
    if (patch.lifestyle !== undefined) {
      const current = await client.from('profiles').select('lifestyle').eq('id', userId).maybeSingle();
      const existing = (unwrapMaybe(current) as { lifestyle: Record<string, unknown> | null } | null)?.lifestyle ?? {};
      row.lifestyle = { ...existing, ...patch.lifestyle };
    }
    if (patch.interests !== undefined) {
      if (patch.interests.length > LIMITS.interestsMax) throw new ApiError(`Choose up to ${LIMITS.interestsMax} interests.`);
      row.interests = patch.interests;
    }
    if (patch.bio !== undefined) {
      if (patch.bio.length > LIMITS.bioMax) throw new ApiError(`Keep your bio under ${LIMITS.bioMax} characters.`);
      row.bio = patch.bio.trim();
    }
    unwrap(await client.from('profiles').update(row).eq('id', userId).select('id'));
  }

  async function getPrivate(userId: string, email: string): Promise<PrivateUserData> {
    await ensureRows(userId);
    const [priv, own] = await Promise.all([
      client.from('member_private').select('*').eq('user_id', userId).single(),
      client.from('profiles').select('is_admin, terms_version, privacy_version').eq('id', userId).single(),
    ]);
    const p = unwrap(priv) as MemberPrivateRow;
    const o = unwrap(own) as { is_admin: boolean; terms_version: string | null; privacy_version: string | null };
    return toPrivate(p, {
      email,
      isAdmin: !!o.is_admin,
      termsVersion: o.terms_version,
      privacyVersion: o.privacy_version,
    });
  }

  async function updatePrivate(userId: string, patch: PrivatePatch): Promise<void> {
    await ensureRows(userId);
    const row: Record<string, unknown> = {};
    if (patch.areaId !== undefined) row.area_id = patch.areaId;
    if (patch.maxDistanceMiles !== undefined) row.max_distance_miles = patch.maxDistanceMiles;
    if (patch.education) {
      row.school = patch.education.school.trim();
      row.degree_level = patch.education.degreeLevel;
      row.field_of_study = patch.education.fieldOfStudy.trim();
      row.graduation_year = patch.education.graduationYear;
      row.currently_enrolled = patch.education.currentlyEnrolled;
      row.education_display_enabled = patch.education.publicDisplayEnabled;
    }
    if (patch.employment) {
      row.occupation = patch.employment.occupation.trim();
      row.employer = patch.employment.employer.trim();
      row.employment_status = patch.employment.employmentStatus;
      row.employer_display_enabled = patch.employment.publicEmployerDisplayEnabled;
    }
    if (Object.keys(row).length === 0) return;
    unwrap(await client.from('member_private').update(row).eq('user_id', userId).select('user_id'));
  }

  async function getPreferences(userId: string): Promise<Preferences> {
    await ensureRows(userId);
    const data = unwrapMaybe(await client.from('member_preferences').select('user_id, prefs').eq('user_id', userId).maybeSingle());
    return toPreferences((data as PreferencesRow | null)?.prefs);
  }

  async function savePreferences(userId: string, prefs: Preferences): Promise<void> {
    unwrap(
      await client
        .from('member_preferences')
        .upsert({ user_id: userId, prefs, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
        .select('user_id'),
    );
  }

  /** Members created before migration 013 may lack the companion rows. */
  async function ensureRows(userId: string): Promise<void> {
    await Promise.all([
      client.from('member_private').upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true }),
      client.from('member_preferences').upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true }),
    ]);
  }

  async function addPhoto(userId: string, currentPaths: string[], upload: UploadBody): Promise<string[]> {
    if (currentPaths.length >= LIMITS.photos) throw new ApiError(`You can have up to ${LIMITS.photos} photos.`);
    const path = await uploadImage(client, BUCKETS.profilePhotos, userId, upload);
    const next = [...currentPaths, path];
    unwrap(
      await client
        .from('profiles')
        .update({ photo_paths: next, photos_uploaded: next.length, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select('id'),
    );
    return next;
  }

  async function removePhoto(userId: string, currentPaths: string[], path: string): Promise<string[]> {
    const next = currentPaths.filter((p) => p !== path);
    unwrap(
      await client
        .from('profiles')
        .update({ photo_paths: next, photos_uploaded: next.length, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select('id'),
    );
    await removeObjects(client, BUCKETS.profilePhotos, [path]);
    return next;
  }

  async function reorderPhotos(userId: string, paths: string[]): Promise<void> {
    unwrap(await client.from('profiles').update({ photo_paths: paths, updated_at: new Date().toISOString() }).eq('id', userId).select('id'));
  }

  return {
    getMany,
    getMap,
    get,
    getOwn,
    updatePublic,
    getPrivate,
    updatePrivate,
    getPreferences,
    savePreferences,
    ensureRows,
    addPhoto,
    removePhoto,
    reorderPhotos,
  };
}

export type ProfilesApi = ReturnType<typeof createProfilesApi>;
