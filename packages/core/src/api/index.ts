import type { Client } from './client';
import { createProfilesApi } from './profiles';
import { createDiscoveryApi } from './discovery';
import { createIntroductionsApi } from './introductions';
import { createConnectionsApi } from './connections';
import { createPostsApi } from './posts';
import { createApplicationsApi } from './applications';
import { createSafetyApi } from './safety';
import { createVerificationApi } from './verification';

export * from './client';
export * from './storage';
export * from './rows';
export * from './mappers';
export * from './profiles';
export * from './discovery';
export * from './introductions';
export * from './connections';
export * from './posts';
export * from './applications';
export * from './safety';
export * from './verification';

/**
 * The whole data layer, bound to one Supabase client. Both apps call this once
 * and pass the result through context.
 */
export function createApi(client: Client) {
  const profiles = createProfilesApi(client);
  return {
    profiles,
    discovery: createDiscoveryApi(client, profiles),
    introductions: createIntroductionsApi(client, profiles),
    connections: createConnectionsApi(client, profiles),
    posts: createPostsApi(client, profiles),
    applications: createApplicationsApi(client),
    safety: createSafetyApi(client, profiles),
    verification: createVerificationApi(client),
  };
}

export type PeachesApi = ReturnType<typeof createApi>;
