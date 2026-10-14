/**
 * A JWT is revoked when it was issued before the user's last password change.
 * `iat` has second precision, so compare at second granularity to keep the
 * token issued right after a reset valid.
 */
export function isTokenRevoked(decoded, passwordChangedAt) {
  if (!passwordChangedAt || !decoded?.iat) return false;
  const changedAtSec = Math.floor(new Date(passwordChangedAt).getTime() / 1000);
  return decoded.iat < changedAtSec;
}
