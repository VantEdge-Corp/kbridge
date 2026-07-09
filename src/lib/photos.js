// ─────────────────────────────────────────────────────────────────────────────
// photos.js — Profile photos in the public 'profile-photos' bucket
// (migration 009), browser edition. Same contract as mobile/src/lib/photos.js;
// paths are <user_id>/<uuid>.<ext> and RLS restricts writes to your own folder.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "./supabase.js";

const BUCKET = "profile-photos";
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
export const PHOTO_LIMIT = 6;

export function publicUrl(path) {
  if (!path) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function extOf(file) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export async function uploadProfilePhoto(userId, file, currentPaths = []) {
  if (!file) throw new Error("No file selected.");
  if (!ALLOWED.includes(file.type)) throw new Error("Must be a JPEG, PNG, or WebP image.");
  if (file.size > MAX_BYTES) throw new Error("Image is larger than 8 MB.");
  if (currentPaths.length >= PHOTO_LIMIT) throw new Error(`Up to ${PHOTO_LIMIT} photos.`);

  const rand = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const path = `${userId}/${rand}.${extOf(file)}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: "3600", upsert: false });
  if (upErr) throw new Error(upErr.message || "Upload failed.");

  const nextPaths = [...currentPaths, path];
  const { error: dbErr } = await supabase
    .from("profiles")
    .update({ photo_paths: nextPaths, photos_uploaded: nextPaths.length })
    .eq("id", userId);
  if (dbErr) throw new Error(dbErr.message || "Could not save photo.");
  return nextPaths;
}

export async function removeProfilePhoto(userId, path, currentPaths = []) {
  const nextPaths = currentPaths.filter(p => p !== path);
  const { error: dbErr } = await supabase
    .from("profiles")
    .update({ photo_paths: nextPaths, photos_uploaded: nextPaths.length })
    .eq("id", userId);
  if (dbErr) throw new Error(dbErr.message || "Could not remove photo.");
  supabase.storage.from(BUCKET).remove([path]).catch(() => {});
  return nextPaths;
}
