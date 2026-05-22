// ─────────────────────────────────────────────────────────────────────────────
// face-match.js — Client-side face comparison via face-api.js.
//
// We compare the applicant's selfie against the photo extracted from
// their US passport. The result is a Euclidean distance between two
// 128-dim face descriptors — lower means more similar. ~0.6 is the
// commonly cited "same person" threshold for this model.
//
// All inference runs in the browser. Model weights load once from
// jsdelivr (~6 MB, then browser-cached). No backend, no API key.
//
// This is NOT liveness detection. A determined attacker can pass it
// with two pictures of the same person. It is a useful pre-flag for
// the committee, not a final verdict.
// ─────────────────────────────────────────────────────────────────────────────

// Lazy ESM import — keeps face-api.js out of the main bundle so only
// the /apply route pays the cost.
let faceapiPromise = null;
function getFaceApi() {
  if (!faceapiPromise) faceapiPromise = import("face-api.js");
  return faceapiPromise;
}

// jsdelivr mirrors the npm package's `weights/` directory.
const MODEL_BASE = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights";

let loadPromise = null;

/**
 * Idempotent model loader. Safe to call multiple times — subsequent
 * calls return the same promise.
 */
export function loadFaceModels() {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const faceapi = await getFaceApi();
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_BASE),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_BASE),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_BASE),
    ]);
  })().catch((err) => {
    loadPromise = null;
    throw err;
  });
  return loadPromise;
}

async function descriptorFor(file) {
  const faceapi = await getFaceApi();
  const img = await faceapi.bufferToImage(file);
  const detection = await faceapi
    .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();
  return detection ?? null;
}

/**
 * Compute a face-match result between two image files.
 *
 * @param {File} fileA  typically the selfie
 * @param {File} fileB  typically the passport photo
 * @returns {Promise<{
 *   distance: number|null,
 *   hasFaceA: boolean,
 *   hasFaceB: boolean,
 *   error?: string,
 *   computed_at: string,
 * }>}
 */
export async function computeFaceMatch(fileA, fileB) {
  const computed_at = new Date().toISOString();
  try {
    await loadFaceModels();

    const [a, b] = await Promise.all([
      descriptorFor(fileA),
      descriptorFor(fileB),
    ]);

    const hasFaceA = !!a;
    const hasFaceB = !!b;

    if (!hasFaceA || !hasFaceB) {
      return {
        distance: null,
        hasFaceA,
        hasFaceB,
        error: !hasFaceA && !hasFaceB
          ? "No face detected in either photo."
          : !hasFaceA
            ? "No face detected in selfie."
            : "No face detected in passport photo.",
        computed_at,
      };
    }

    const faceapi = await getFaceApi();
    const distance = faceapi.euclideanDistance(a.descriptor, b.descriptor);
    return { distance, hasFaceA, hasFaceB, computed_at };
  } catch (err) {
    return {
      distance: null,
      hasFaceA: false,
      hasFaceB: false,
      error: err?.message || "Face comparison failed.",
      computed_at,
    };
  }
}

/**
 * Bucket a distance into a human-readable verdict and color.
 * Same thresholds used in Apply (live feedback) and Admin (review).
 */
export function classifyMatch(distance) {
  if (distance == null) {
    return { tier: "unknown", label: "Could not verify", color: "#8a7f6a" };
  }
  if (distance < 0.45) return { tier: "strong",   label: "Strong match",       color: "#7aab8a" };
  if (distance < 0.60) return { tier: "likely",   label: "Likely match",       color: "#c4956c" };
  if (distance < 0.75) return { tier: "weak",     label: "Weak match",         color: "#d4a47c" };
  return                       { tier: "mismatch", label: "Probable mismatch", color: "#8b5a5a" };
}
