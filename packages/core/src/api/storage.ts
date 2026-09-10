import type { Client } from './client';
import { ApiError } from './client';

export const BUCKETS = {
  profilePhotos: 'profile-photos',
  postPhotos: 'post-photos',
} as const;

export type Bucket = (typeof BUCKETS)[keyof typeof BUCKETS];

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export interface UploadBody {
  /** A Blob/File on the web, an ArrayBuffer on React Native. */
  body: Blob | ArrayBuffer;
  contentType: string;
  /** Size in bytes when known ahead of time (React Native). */
  size?: number;
}

export function extensionFor(contentType: string): string {
  switch (contentType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      throw new ApiError('Please choose a JPEG, PNG, or WebP image.');
  }
}

export function publicUrl(client: Client, bucket: Bucket, path: string): string {
  return client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export function newObjectPath(userId: string, contentType: string): string {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${userId}/${stamp}-${rand}.${extensionFor(contentType)}`;
}

export function validateUpload(upload: UploadBody): void {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(upload.contentType)) {
    throw new ApiError('Please choose a JPEG, PNG, or WebP image.');
  }
  const size = upload.size ?? (upload.body instanceof ArrayBuffer ? upload.body.byteLength : upload.body.size);
  if (size > MAX_UPLOAD_BYTES) throw new ApiError('Photos must be 8 MB or smaller.');
}

export async function uploadImage(client: Client, bucket: Bucket, userId: string, upload: UploadBody): Promise<string> {
  validateUpload(upload);
  const path = newObjectPath(userId, upload.contentType);
  const { error } = await client.storage.from(bucket).upload(path, upload.body, {
    contentType: upload.contentType,
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw new ApiError(error.message);
  return path;
}

export async function removeObjects(client: Client, bucket: Bucket, paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  // Best effort: the database row is the source of truth, storage is cleaned up opportunistically.
  await client.storage.from(bucket).remove(paths);
}
