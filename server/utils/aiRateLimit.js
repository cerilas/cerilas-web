export const AI_HOURLY_LIMIT = 3;

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

export async function checkAiRateLimit(pool, toolSlug, visitorId, clientIp) {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as count,
        COALESCE(GREATEST(1, CEIL(EXTRACT(EPOCH FROM (MIN(created_at) + INTERVAL '1 hour' - NOW())) / 60))::int, 0) as reset_minutes
      FROM tool_usage_events
      WHERE tool_slug = $1 
        AND (
          (visitor_id IS NOT NULL AND visitor_id = $2)
          OR (metadata->>'ip' = $3)
        )
        AND event_type = 'ai_scan'
        AND created_at > NOW() - INTERVAL '1 hour'
    `, [toolSlug, visitorId || 'none', clientIp]);

    const usedCount = parseInt(result.rows[0]?.count || '0', 10);
    const resetInMinutes = usedCount > 0 ? parseInt(result.rows[0]?.reset_minutes || '0', 10) : 0;
    const remaining = Math.max(0, AI_HOURLY_LIMIT - usedCount);

    return {
      allowed: usedCount < AI_HOURLY_LIMIT,
      limit: AI_HOURLY_LIMIT,
      used: usedCount,
      remaining,
      resetInMinutes
    };
  } catch (err) {
    console.error('Error checking AI rate limit:', err);
    return {
      allowed: true,
      limit: AI_HOURLY_LIMIT,
      used: 0,
      remaining: AI_HOURLY_LIMIT,
      resetInMinutes: 0
    };
  }
}
