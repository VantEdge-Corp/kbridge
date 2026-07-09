// ─────────────────────────────────────────────────────────────────────────────
// storage.js — Upload verification photos to the private 'verifications'
// bucket from React Native. Takes an expo-image-picker asset (picked with
// base64: true) since RN has no File/Blob pipeline that Supabase storage
// accepts reliably — the base64 → ArrayBuffer route is the supported one.
// ─────────────────────────────────────────────────────────────────────────────

import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase.js';

const BUCKET = 'verifications';
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB, same limit as the web form
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const EXT_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function randomName() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function assetBytes(asset) {
  if (asset?.fileSize) return asset.fileSize;
  if (asset?.base64) return Math.floor(asset.base64.length * 0.75);
  return 0;
}

export async function uploadVerification(asset, kind) {
  if (!asset?.base64) throw new Error('No photo selected.');
  if (assetBytes(asset) > MAX_BYTES) throw new Error('Photo is larger than 8 MB.');

  // The picker re-encodes to JPEG when quality is set; anything it still
  // reports outside the allowed list is uploaded as JPEG.
  const contentType = ALLOWED_TYPES.includes(asset.mimeType) ? asset.mimeType : 'image/jpeg';
  const path = `${randomName()}-${kind}.${EXT_BY_TYPE[contentType]}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, decode(asset.base64), {
      contentType,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw new Error(error.message || 'Upload failed.');
  return path;
}
