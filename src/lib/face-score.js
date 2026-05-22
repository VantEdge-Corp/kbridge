// face-score.js — appearance scoring via Claude vision
// Scores a profile photo and returns structured breakdown
// Used both during onboarding (applicant scores themselves) and in the admin panel

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

/**
 * Score an applicant's portrait using Claude vision.
 * Pass a base64-encoded image (PNG or JPEG).
 * Returns a FaceScore object or throws on error.
 *
 * @param {string} imageBase64 — raw base64, no data URI prefix
 * @param {string} mediaType  — "image/jpeg" | "image/png" | "image/webp"
 * @param {string} apiKey     — Anthropic API key (stored in admin settings)
 */
export async function scorePortrait(imageBase64, mediaType = "image/jpeg", apiKey) {
  if (!apiKey) throw new Error("No Anthropic API key configured.");

  const prompt = `You are the photo reviewer for an exclusive private membership club. 
Analyze this portrait photograph and return ONLY a valid JSON object — no markdown, no preamble.

Score the following on a scale of 1–10 (10 = exceptional):

{
  "overall": <number>,
  "symmetry": <number>,
  "presentation": <number>,
  "photo_quality": <number>,
  "vitality": <number>,
  "note": "<one concise sentence, professional tone>",
  "tier_recommendation": "<one of: complimentary | founding | member | observer>",
  "pricing_note": "<one clause explaining the recommendation>"
}

Scoring guide:
- overall 9–10: genuinely striking, camera-ready
- overall 7–8: clearly attractive, strong presentation
- overall 5–6: appealing, standard presentation
- overall 1–4: unclear photo or significant presentation issues

tier_recommendation guide:
- complimentary (free membership): overall 9–10
- founding (50% off): overall 7–8
- member (25% off): overall 5–6
- observer (standard): overall 1–4

Return ONLY the JSON object.`;

  const resp = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: imageBase64 },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Anthropic API error ${resp.status}: ${body}`);
  }

  const data = await resp.json();
  const raw = data.content?.[0]?.text ?? "";

  try {
    return JSON.parse(raw.trim());
  } catch {
    throw new Error(`Failed to parse score response: ${raw}`);
  }
}

/**
 * Convert a tier_recommendation string to a display price.
 * Keeps tiers.js as the source of truth for base prices.
 */
export function scoreToPricingDisplay(tierRec) {
  switch (tierRec) {
    case "complimentary":
      return { label: "Complimentary", price: "$0", note: "Membership fee waived", badge: "◈ Exceptional" };
    case "founding":
      return { label: "Founding — 50% off", price: "$60", note: "per month (reg. $120)", badge: "◇ Distinguished" };
    case "member":
      return { label: "Member — 25% off", price: "$24", note: "per month (reg. $32)", badge: "◆ Preferred" };
    default:
      return { label: "Standard pricing", price: null, note: null, badge: null };
  }
}

/**
 * Generate a stable mock score for development / gradient placeholders.
 * Seeded by string hash so the same placeholder always gets the same score.
 */
export function mockScore(seed = "default") {
  const h = seed.split("").reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
  const overall = 5 + (Math.abs(h) % 5); // 5–9
  return {
    overall,
    symmetry: 5 + (Math.abs(h >> 2) % 5),
    presentation: 5 + (Math.abs(h >> 4) % 5),
    photo_quality: 6 + (Math.abs(h >> 6) % 4),
    vitality: 5 + (Math.abs(h >> 8) % 5),
    note: "Placeholder score — real analysis pending photo upload.",
    tier_recommendation: overall >= 9 ? "complimentary" : overall >= 7 ? "founding" : overall >= 5 ? "member" : "observer",
    pricing_note: "Score generated from placeholder portrait.",
    _mock: true,
  };
}
