// ─────────────────────────────────────────────────────────────────────────────
// photos.js — Real profile photos in the public 'profile-photos' bucket
// (migration 009). Paths are <user_id>/<uuid>.<ext>; RLS lets a member write
// only under their own folder. Public bucket → render by URL, no signed URLs.
//
// This is the non-biometric foundation. A future "Photo Verified" badge (a
// vendor liveness/selfie-match) would set profiles.photo_verified; the vendor
// holds the biometric data, we store only the boolean.
// ─────────────────────────────────────────────────────────────────────────────

import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase.js';

const BUCKET = 'profile-photos';
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
export const PHOTO_LIMIT = 6;

export function publicUrl(path) {
  if (!path) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// Opens the library and returns the picked asset (with base64), or null if the
// user cancelled. Throws if permission is denied.
export async function pickPhoto() {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error('Photo library access was denied.');
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    base64: true,
    exif: false,
    allowsEditing: true,
    aspect: [3, 4],
  });
  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0];
}

export async function addProfilePhoto(userId, asset, currentPaths = []) {
  if (!asset?.base64) throw new Error('No photo selected.');
  if (currentPaths.length >= PHOTO_LIMIT) throw new Error(`Up to ${PHOTO_LIMIT} photos.`);
  const approxBytes = asset.fileSize || Math.floor(asset.base64.length * 0.75);
  if (approxBytes > MAX_BYTES) throw new Error('Photo is larger than 8 MB.');

  const contentType = ALLOWED.includes(asset.mimeType) ? asset.mimeType : 'image/jpeg';
  const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
  const rand = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const path = `${userId}/${rand}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, decode(asset.base64), { contentType, cacheControl: '3600', upsert: false });
  if (upErr) throw new Error(upErr.message || 'Upload failed.');

  const nextPaths = [...currentPaths, path];
  const { error: dbErr } = await supabase
    .from('profiles')
    .update({ photo_paths: nextPaths, photos_uploaded: nextPaths.length })
    .eq('id', userId);
  if (dbErr) throw new Error(dbErr.message || 'Could not save photo.');
  return nextPaths;
}

export async function removeProfilePhoto(userId, path, currentPaths = []) {
  const nextPaths = currentPaths.filter(p => p !== path);
  const { error: dbErr } = await supabase
    .from('profiles')
    .update({ photo_paths: nextPaths, photos_uploaded: nextPaths.length })
    .eq('id', userId);
  if (dbErr) throw new Error(dbErr.message || 'Could not remove photo.');
  supabase.storage.from(BUCKET).remove([path]).catch(() => {}); // best-effort
  return nextPaths;
}
