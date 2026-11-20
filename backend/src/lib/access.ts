import "server-only";

/**
 * Verifies a Cloudflare Access JWT (the `Cf-Access-Jwt-Assertion` header or
 * the `CF_Authorization` cookie) inside the Worker, as Cloudflare recommends:
 * signature against the team's public keys, plus issuer, audience and expiry.
 * https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/
 */

interface Jwk extends JsonWebKey {
  kid?: string;
}

export interface AccessPayload {
  email?: string;
  sub?: string;
  iss?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
}

const KEYS_TTL_MS = 60 * 60 * 1000;
/** A token with an unknown key id may force a refetch, but at most this often. */
const MIN_REFRESH_INTERVAL_MS = 60 * 1000;
let cachedKeys: { teamDomain: string; keys: Jwk[]; fetchedAt: number } | null = null;

function normalizeTeamDomain(value: string): string {
  return value.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

function base64UrlToBytes(input: string): Uint8Array<ArrayBuffer> {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeJson<T>(segment: string): T {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(segment))) as T;
}

async function loadKeys(teamDomain: string, forceRefresh = false): Promise<Jwk[]> {
  const now = Date.now();
  const cached = cachedKeys && cachedKeys.teamDomain === teamDomain ? cachedKeys : null;
  if (cached) {
    const age = now - cached.fetchedAt;
    if (age < KEYS_TTL_MS && (!forceRefresh || age < MIN_REFRESH_INTERVAL_MS)) {
      return cached.keys;
    }
  }

  const response = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) {
    throw new Error(`Could not load Cloudflare Access keys (${response.status}).`);
  }
  const body = (await response.json()) as { keys?: Jwk[] };
  const keys = body.keys ?? [];
  cachedKeys = { teamDomain, keys, fetchedAt: now };
  return keys;
}

/**
 * Returns the verified payload, or `null` if the token is missing, forged,
 * expired, or was issued for a different Access application.
 */
export async function verifyAccessJwt(
  token: string | undefined,
  options: { teamDomain: string; audience: string }
): Promise<AccessPayload | null> {
  if (!token) return null;
  const teamDomain = normalizeTeamDomain(options.teamDomain);
  if (!teamDomain || !options.audience) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerPart, payloadPart, signaturePart] = parts;

  try {
    const header = decodeJson<{ alg?: string; kid?: string }>(headerPart);
    if (header.alg !== "RS256" || !header.kid) return null;

    let keys = await loadKeys(teamDomain);
    let jwk = keys.find((key) => key.kid === header.kid);
    if (!jwk) {
      // Access rotates keys; refetch once before giving up.
      keys = await loadKeys(teamDomain, true);
      jwk = keys.find((key) => key.kid === header.kid);
    }
    if (!jwk) return null;

    const publicKey = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      publicKey,
      base64UrlToBytes(signaturePart),
      new TextEncoder().encode(`${headerPart}.${payloadPart}`)
    );
    if (!valid) return null;

    const payload = decodeJson<AccessPayload>(payloadPart);
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number" || payload.exp <= nowSeconds) return null;
    if (typeof payload.nbf === "number" && payload.nbf > nowSeconds + 60) return null;
    if (payload.iss !== `https://${teamDomain}`) return null;

    const audiences = Array.isArray(payload.aud) ? payload.aud : payload.aud ? [payload.aud] : [];
    if (!audiences.includes(options.audience)) return null;

    return payload;
  } catch {
    return null;
  }
}
