// ============================================================================
// 🛡️ In-Memory Sliding Window Rate Limiter
// ป้องกัน Brute Force, DDoS, และ Abuse
// ============================================================================

type RateLimitEntry = {
  timestamps: number[];
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
};

/**
 * Pre-configured rate limit profiles.
 */
export const RATE_LIMITS = {
  /** Login: 5 attempts per 15 minutes per IP */
  login: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
  /** API writes (POST/PUT/DELETE): 30 requests per minute per IP */
  apiWrite: { maxRequests: 30, windowMs: 60 * 1000 },
  /** API reads (GET): 100 requests per minute per IP */
  apiRead: { maxRequests: 100, windowMs: 60 * 1000 },
} as const;

/**
 * In-memory store for rate limit entries.
 * Key format: `${profile}:${identifier}` (e.g., `login:192.168.1.1`)
 */
const store = new Map<string, RateLimitEntry>();

/**
 * Auto-cleanup interval — removes expired entries every 5 minutes.
 * ป้องกัน memory leak จาก entries ที่หมดอายุ
 */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
  if (cleanupTimer) return;

  cleanupTimer = setInterval(() => {
    const now = Date.now();

    for (const [key, entry] of store.entries()) {
      // Remove entries where all timestamps are expired
      // Use the longest window (15 min) as the expiry threshold
      const maxWindow = RATE_LIMITS.login.windowMs;
      entry.timestamps = entry.timestamps.filter(
        (ts) => now - ts < maxWindow,
      );

      if (entry.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);

  // Allow Node.js to exit even if timer is running (in non-production)
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

/**
 * Check if a request is allowed under the specified rate limit.
 *
 * @param profile - The rate limit profile name (key of RATE_LIMITS)
 * @param identifier - Unique identifier (usually IP address)
 * @returns RateLimitResult with allowed status and remaining count
 *
 * @example
 * ```ts
 * const result = checkRateLimit("login", clientIp);
 * if (!result.allowed) {
 *   return Response.json(
 *     { error: "Too many requests" },
 *     { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } }
 *   );
 * }
 * ```
 */
export function checkRateLimit(
  profile: keyof typeof RATE_LIMITS,
  identifier: string,
): RateLimitResult {
  startCleanup();

  const config = RATE_LIMITS[profile];
  const key = `${profile}:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Get or create entry
  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  // Check if under limit
  if (entry.timestamps.length >= config.maxRequests) {
    // Calculate when the oldest timestamp in the window will expire
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = oldestInWindow + config.windowMs - now;
    const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    };
  }

  // Record this request
  entry.timestamps.push(now);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.timestamps.length,
  };
}

/**
 * Extract client IP from request headers.
 * Checks common proxy headers, falls back to "unknown".
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;

  // Check X-Forwarded-For (set by most reverse proxies)
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    // Take the first IP (client IP), ignore downstream proxies
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  // Check X-Real-IP (set by Nginx)
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  // Fallback
  return "unknown";
}

/**
 * Create a 429 Too Many Requests response.
 */
export function rateLimitResponse(retryAfterSeconds: number): Response {
  return Response.json(
    {
      success: false,
      message: "คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง",
      errorCode: "RATE_LIMITED",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}
