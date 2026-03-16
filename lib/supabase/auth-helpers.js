import { createSupabaseRouteClient } from "./client";

const USERNAME_REGEX = /^[a-zA-Z0-9]{5,15}$/;
const PASSWORD_SYMBOL_REGEX = /[^A-Za-z0-9]/;

export const USERNAME_INVALID_MESSAGE =
  "the format is invalid, and it must be 5-15 characters long, contain no special characters, and will not be case sensitive.";
export const USERNAME_TAKEN_MESSAGE = "someone's already using this username sorry";
export const USERNAME_MISSING_LOGIN_MESSAGE = "this username doesnt exist create an account";
export const INVALID_PASSWORD_MESSAGE = "invalid password";
export const PASSWORD_MISMATCH_MESSAGE = "passwords do not match";

export function normalizeUsername(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isValidUsername(value) {
  return USERNAME_REGEX.test(typeof value === "string" ? value.trim() : "");
}

export function isValidPassword(value) {
  const password = typeof value === "string" ? value : "";
  return password.length >= 6 && password.length <= 15 && PASSWORD_SYMBOL_REGEX.test(password);
}

export function buildAuthEmailFromUsername(usernameNormalized) {
  // *****&AUTH_EMAIL_FORMAT_PLACEHOLDER
  return `${usernameNormalized}@gutcheck.local`;
}

export async function getUserFromBearerToken(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  if (!token) {
    return { user: null, token: null, error: "Unauthorized" };
  }

  const supabase = createSupabaseRouteClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return { user: null, token: null, error: "Unauthorized" };
  }

  return { user: data.user, token, error: null };
}

export function sanitizeProfilePayload(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const result = {};

  for (const [key, raw] of Object.entries(value)) {
    if (raw === null || raw === undefined) continue;
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      result[key] = trimmed;
      continue;
    }
    if (Array.isArray(raw)) {
      if (!raw.length) continue;
      result[key] = raw;
      continue;
    }
    if (typeof raw === "object") {
      if (!Object.keys(raw).length) continue;
      result[key] = raw;
      continue;
    }
    result[key] = raw;
  }

  return result;
}
