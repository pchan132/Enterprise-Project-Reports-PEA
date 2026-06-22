// ============================================================================
// 🛡️ Input Sanitization Utilities
// ป้องกัน XSS, HTML Injection, Protocol Injection
// ============================================================================

/**
 * Maximum lengths for each field type.
 * ป้องกัน payload ขนาดใหญ่เกินไปที่อาจทำให้ DB หรือ memory เกิดปัญหา
 */
export const FIELD_MAX_LENGTHS: Record<string, number> = {
  requestNo: 30,
  firstName: 100,
  lastName: 100,
  phone: 20,
  phone2: 20,
  address: 500,
  subDistrict: 100,
  district: 100,
  province: 100,
  description: 2000,
  link: 2000,
  requestType: 200,
  meterOption: 100,
  caRefNo: 50,
  peaNo: 50,
  status: 100,
};

const DEFAULT_MAX_LENGTH = 500;

/**
 * Strip HTML tags from a string to prevent XSS via stored payloads.
 * Also removes null bytes and other control characters.
 */
export function stripHtmlTags(input: string): string {
  return input
    // Remove null bytes
    .replace(/\0/g, "")
    // Remove HTML tags
    .replace(/<[^>]*>/g, "")
    // Remove HTML entities that could be used for XSS
    .replace(/&#?[a-zA-Z0-9]+;/g, "")
    // Remove other control characters (except newlines and tabs)
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

/**
 * Sanitize a string input:
 * 1. Strip HTML tags
 * 2. Trim whitespace
 * 3. Enforce max length
 */
export function sanitizeString(
  input: string,
  fieldName?: string,
): string {
  const maxLength = fieldName
    ? (FIELD_MAX_LENGTHS[fieldName] ?? DEFAULT_MAX_LENGTH)
    : DEFAULT_MAX_LENGTH;

  const sanitized = stripHtmlTags(input).trim();

  if (sanitized.length > maxLength) {
    return sanitized.slice(0, maxLength);
  }

  return sanitized;
}

/**
 * Validate and sanitize a URL.
 * Only allows http:// and https:// protocols.
 * Prevents javascript:, data:, vbscript: protocol XSS attacks.
 */
export function sanitizeUrl(input: string): string | null {
  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.length > (FIELD_MAX_LENGTHS.link ?? 2000)) {
    return null;
  }

  // Only allow http and https protocols
  const SAFE_URL_PATTERN = /^https?:\/\//i;

  if (!SAFE_URL_PATTERN.test(trimmed)) {
    return null;
  }

  try {
    // Verify it's a valid URL
    new URL(trimmed);
    return trimmed;
  } catch {
    return null;
  }
}

/**
 * Validate phone number format.
 * Allows digits, dashes, plus sign, spaces, and parentheses.
 */
export function isValidPhone(input: string): boolean {
  if (input.length === 0) return false;
  if (input.length > 20) return false;

  // Allow: digits, dashes, plus, spaces, parens
  const PHONE_PATTERN = /^[0-9\-+() ]+$/;
  return PHONE_PATTERN.test(input);
}

/**
 * Sanitize all string values in a request body object.
 * Returns a new object with sanitized values.
 */
export function sanitizeRequestBody(
  body: Record<string, unknown>,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    if (typeof value === "string") {
      if (key === "link") {
        // URL fields get special validation
        sanitized[key] = sanitizeUrl(value) ?? value.trim();
      } else {
        sanitized[key] = sanitizeString(value, key);
      }
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === "string" ? sanitizeString(item, key) : item,
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
