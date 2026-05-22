// ─────────────────────────────────────────────────────────────────────────────
// storage.js — Helpers for the 'verifications' bucket.
//
// Anonymous applicants upload here directly (RLS allows insert from anon),
// and only admins can read (via the is_admin() function from migration 004).
// The bucket itself is created by migration 005.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "./supabase.js";

const BUCKET = "verifications";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function uuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  );
}

function extensionOf(file) {
  if (file?.name) {
    const i = file.name.lastIndexOf(".");
    if (i > 0) return file.name.slice(i + 1).toLowerCase();
  }
  if (file?.type === "image/png")  return "png";
  if (file?.type === "image/webp") return "webp";
  return "jpg";
}

/**
 * Upload a verification photo. `kind` is a short label that becomes part
 * of the filename so admins can tell face vs. passport at a glance.
 *
 * @param {File} file
 * @param {"face"|"passport"} kind
 * @returns {Promise<string>} the stored path
 */
export async function uploadVerification(file, kind) {
  if (!file) throw new Error("No file selected.");
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("File must be a JPEG, PNG, or WebP image.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("File is larger than 8 MB.");
  }

  const path = `${uuid()}-${kind}.${extensionOf(file)}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw new Error(error.message || "Upload failed.");
  return path;
}

/**
 * Create a short-lived signed URL so admins can view a verification file.
 *
 * @param {string} path
 * @param {number} ttlSeconds  default 5 minutes
 * @returns {Promise<string|null>}
 */
export async function getSignedUrl(path, ttlSeconds = 300) {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, ttlSeconds);
  if (error) return null;
  return data?.signedUrl ?? null;
}
