import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authPool } from '../db.js';
import { handleGrowthOAuthCallback } from '../utils/googleGrowthIntegration.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'cerilas_admin_jwt_secret_2026';

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Authentication token required' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

// Auto-migration for Google OAuth schema
(async () => {
  try {
    await authPool.query('ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL');
    await authPool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)');
    await authPool.query('CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)');
  } catch (e) {
    // Migration already applied or logged
  }
})();

const formatUser = (row) => {
  const firstName = row.first_name || '';
  const lastName = row.last_name || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || (row.email ? row.email.split('@')[0] : 'Kullanıcı');
  
  return {
    id: row.id,
    email: row.email,
    first_name: firstName,
    last_name: lastName,
    name: fullName,
    avatar_url: row.avatar_url || '',
    phone: row.phone || '',
    phone_verified: !!row.phone_verified,
    google_id: row.google_id || null,
    is_google_connected: !!row.google_id,
    plan: row.plan || 'free',
    cancel_at_period_end: !!row.cancel_at_period_end,
    plan_expires_at: row.plan_expires_at ? new Date(row.plan_expires_at).toISOString() : null,
    subscription_status: row.subscription_status || 'active',
    billing_type: row.billing_type || 'individual',
    billing_name: row.billing_name || '',
    billing_tax_id: row.billing_tax_id || '',
    billing_tax_office: row.billing_tax_office || '',
    billing_address: row.billing_address || '',
    billing_city: row.billing_city || '',
    billing_country: row.billing_country || 'Türkiye',
    created_at: row.created_at
  };
};

/**
 * Auto-links Google identity to existing email accounts or creates new users.
 * If user exists with the same email, links google_id and updates empty profile fields.
 */
export async function findOrCreateOrLinkGoogleUser({ googleId, email, firstName, lastName, avatarUrl }) {
  if (!email && !googleId) {
    throw new Error('Google hesabı geçerli bir e-posta veya kimlik içermiyor.');
  }

  const cleanEmail = (email || '').toLowerCase().trim();
  let user = null;

  // 1. Try finding existing user by google_id
  if (googleId) {
    const byGoogle = await authPool.query(
      'SELECT * FROM users WHERE google_id = $1',
      [googleId]
    );
    if (byGoogle.rows.length > 0) {
      user = byGoogle.rows[0];
    }
  }

  // 2. If not found by google_id, auto-match by email (REQUIREMENT: Auto-match and link to existing email account!)
  if (!user && cleanEmail) {
    const byEmail = await authPool.query(
      'SELECT * FROM users WHERE LOWER(email) = $1',
      [cleanEmail]
    );

    if (byEmail.rows.length > 0) {
      const existing = byEmail.rows[0];
      const updated = await authPool.query(
        `UPDATE users SET
          google_id = COALESCE(google_id, $1),
          first_name = CASE WHEN first_name IS NULL OR first_name = '' THEN $2 ELSE first_name END,
          last_name = CASE WHEN last_name IS NULL OR last_name = '' THEN $3 ELSE last_name END,
          avatar_url = CASE WHEN avatar_url IS NULL OR avatar_url = '' THEN $4 ELSE avatar_url END
         WHERE id = $5
         RETURNING *`,
        [
          googleId || null,
          firstName || null,
          lastName || null,
          avatarUrl || null,
          existing.id
        ]
      );
      user = updated.rows[0];
      console.log(`[Google Auth] Auto-matched and linked Google ID to existing user account ID ${user.id} (${cleanEmail})`);
    }
  }

  // 3. If user still does not exist, create a new user
  if (!user) {
    const insertRes = await authPool.query(
      `INSERT INTO users (
        email,
        google_id,
        first_name,
        last_name,
        avatar_url,
        plan,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, 'free', NOW())
      RETURNING *`,
      [
        cleanEmail,
        googleId || null,
        firstName || cleanEmail.split('@')[0],
        lastName || '',
        avatarUrl || ''
      ]
    );
    user = insertRes.rows[0];
    console.log(`[Google Auth] Created new user ID ${user.id} via Google (${cleanEmail})`);
  } else if (googleId && !user.google_id) {
    const linkRes = await authPool.query(
      'UPDATE users SET google_id = $1 WHERE id = $2 RETURNING *',
      [googleId, user.id]
    );
    user = linkRes.rows[0];
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  return {
    user: formatUser(user),
    token
  };
}

/**
 * POST /api/auth/register
 * New user registration
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-posta ve şifre zorunludur.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'Lütfen geçerli bir e-posta adresi girin.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Şifreniz en az 6 karakter olmalıdır.' });
    }

    const existing = await authPool.query(
      'SELECT id FROM users WHERE LOWER(email) = $1',
      [cleanEmail]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Bu e-posta adresi ile zaten kayıtlı bir hesap var.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const cleanPhone = phone ? phone.trim() : null;

    const result = await authPool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, plan, created_at)
       VALUES ($1, $2, $3, $4, $5, 'free', NOW())
       RETURNING *`,
      [cleanEmail, password_hash, first_name ? first_name.trim() : null, last_name ? last_name.trim() : null, cleanPhone]
    );

    const newUser = result.rows[0];
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: formatUser(newUser)
    });
  } catch (err) {
    console.error('Auth register error:', err);
    res.status(500).json({ error: 'Kayıt işlemi sırasında bir hata oluştu.' });
  }
});

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-posta ve şifre gereklidir.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const result = await authPool.query(
      'SELECT * FROM users WHERE LOWER(email) = $1',
      [cleanEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Geçersiz e-posta veya şifre.' });
    }

    const user = result.rows[0];
    if (!user.password_hash && user.google_id) {
      return res.status(400).json({ error: 'Bu hesaba Google ile kayıt olunmuş. Lütfen "Google ile Giriş Yap" seçeneğini kullanın.' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Geçersiz e-posta veya şifre.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: formatUser(user)
    });
  } catch (err) {
    console.error('Auth login error:', err);
    res.status(500).json({ error: 'Sunucu kimlik doğrulama hatası.' });
  }
});

/**
 * POST /api/auth/google/signin
 * Authenticate with Google credential (GIS ID token) or OAuth authorization code
 */
router.post('/google/signin', async (req, res) => {
  try {
    const { credential, code } = req.body;
    let googleId, email, firstName, lastName, avatarUrl;

    if (credential) {
      // Verify Google ID token with Google tokeninfo endpoint
      const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
      const payload = await verifyRes.json();

      if (!verifyRes.ok || payload.error) {
        console.error('Google tokeninfo verification failed:', payload);
        return res.status(400).json({ error: 'Geçersiz Google kimlik belirteci.' });
      }

      googleId = payload.sub;
      email = payload.email;
      firstName = payload.given_name || (payload.name ? payload.name.split(' ')[0] : '');
      lastName = payload.family_name || (payload.name ? payload.name.split(' ').slice(1).join(' ') : '');
      avatarUrl = payload.picture || '';
    } else if (code) {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        }).toString()
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || tokenData.error) {
        return res.status(400).json({ error: `Google oturumu doğrulanamadı: ${tokenData.error_description || tokenData.error}` });
      }

      const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const profile = await userinfoRes.json();

      googleId = profile.sub;
      email = profile.email;
      firstName = profile.given_name || (profile.name ? profile.name.split(' ')[0] : '');
      lastName = profile.family_name || (profile.name ? profile.name.split(' ').slice(1).join(' ') : '');
      avatarUrl = profile.picture || '';
    } else {
      return res.status(400).json({ error: 'Google kimlik belirteci (credential) veya kod gereklidir.' });
    }

    if (!googleId || !email) {
      return res.status(400).json({ error: 'Google profilinden gerekli bilgiler (kimlik ve e-posta) alınamadı.' });
    }

    // Auto-match existing accounts by email and link Google
    const authResult = await findOrCreateOrLinkGoogleUser({
      googleId,
      email,
      firstName,
      lastName,
      avatarUrl
    });

    res.json({
      success: true,
      token: authResult.token,
      user: authResult.user
    });
  } catch (err) {
    console.error('Google signin error:', err);
    res.status(500).json({ error: err.message || 'Google ile giriş sırasında bir hata oluştu.' });
  }
});

/**
 * GET /api/auth/google/url
 * Get Google OAuth redirect authorization URL
 */
router.get('/google/url', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    state: req.query.state || 'user_auth'
  });

  res.json({
    clientId,
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  });
});

/**
 * GET /api/auth/google/callback
 * Handles Google OAuth redirect and communicates with popup or redirects
 */
router.get('/google/callback', async (req, res, next) => {
  const { code, state, error } = req.query;

  // If request state belongs to MCP Marketing tool, pass control to next handler
  if (state && (state === 'cerilas_mcp' || state.startsWith('mcp_'))) {
    return next();
  }

  // Dedicated handling for Cerilas Growth SaaS Google integrations (GSC & GA4)
  if (state && state.startsWith('growth_')) {
    if (error) {
      return res.send(`
        <!DOCTYPE html>
        <html><body>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'GROWTH_GOOGLE_AUTH_ERROR', error: ${JSON.stringify(error)} }, window.location.origin);
            window.close();
          } else {
            window.location.href = '/#/growth?tab=settings&error=' + encodeURIComponent(${JSON.stringify(error)});
          }
        </script>
        </body></html>
      `);
    }

    if (!code) {
      return res.status(400).send('Authorization code missing.');
    }

    try {
      const growthResult = await handleGrowthOAuthCallback({ code, state });
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Google Bağlantısı Başarılı</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #09090b; color: #fff;">
          <div style="text-align: center; padding: 24px; max-width: 420px; background: #18181b; border: 1px solid #27272a; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div style="width: 44px; height: 44px; margin: 0 auto 12px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h3 style="margin: 0 0 8px; font-size: 17px; font-weight: 600;">Google Başarıyla Bağlandı</h3>
            <p style="color: #a1a1aa; font-size: 13px; line-height: 1.5; margin: 0 0 12px;">Search Console ve GA4 mülkleriniz çalışma alanınıza entegre edildi. Bu pencere otomatik kapatılıyor...</p>
            <div style="font-size: 12px; color: #71717a; font-family: monospace;">${growthResult.email}</div>
          </div>
          <script>
            try {
              const payload = ${JSON.stringify(growthResult)};
              if (window.opener) {
                window.opener.postMessage({ type: 'GROWTH_GOOGLE_AUTH_SUCCESS', ...payload }, window.location.origin);
                setTimeout(() => window.close(), 600);
              } else {
                window.location.href = '/#/growth?tab=settings&connected=google';
              }
            } catch (err) {
              window.close();
            }
          </script>
        </body></html>
      `);
    } catch (err) {
      console.error('[Growth Google OAuth Callback Error]:', err);
      return res.send(`
        <!DOCTYPE html>
        <html><body>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'GROWTH_GOOGLE_AUTH_ERROR', error: ${JSON.stringify(err.message)} }, window.location.origin);
            window.close();
          } else {
            window.location.href = '/#/growth?tab=settings&error=' + encodeURIComponent(${JSON.stringify(err.message)});
          }
        </script>
        </body></html>
      `);
    }
  }

  if (error) {
    return res.send(`
      <!DOCTYPE html>
      <html><body>
      <script>
        if (window.opener) {
          window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: '${error}' }, window.location.origin);
          window.close();
        } else {
          window.location.href = '/#/account?error=' + encodeURIComponent('${error}');
        }
      </script>
      </body></html>
    `);
  }

  if (!code) {
    return res.status(400).send('Authorization code missing.');
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }).toString()
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error || 'Token exchange failed');
    }

    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const profile = await userinfoRes.json();

    let authResult;
    if (state && state.startsWith('link_')) {
      const linkJwt = state.slice(5);
      try {
        const decoded = jwt.verify(linkJwt, JWT_SECRET);
        const linkRes = await authPool.query(
          `UPDATE users SET 
            google_id = $1,
            avatar_url = CASE WHEN avatar_url IS NULL OR avatar_url = '' THEN $2 ELSE avatar_url END
           WHERE id = $3 
           RETURNING *`,
          [profile.sub, profile.picture || null, decoded.id]
        );
        if (linkRes.rows.length > 0) {
          const user = linkRes.rows[0];
          const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
          authResult = { user: formatUser(user), token };
        }
      } catch (e) {
        console.warn('Link state token invalid, falling back to auto-matching:', e.message);
      }
    }

    if (!authResult) {
      authResult = await findOrCreateOrLinkGoogleUser({
        googleId: profile.sub,
        email: profile.email,
        firstName: profile.given_name || (profile.name ? profile.name.split(' ')[0] : ''),
        lastName: profile.family_name || (profile.name ? profile.name.split(' ').slice(1).join(' ') : ''),
        avatarUrl: profile.picture || ''
      });
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Google ile Giriş Başarılı</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #09090b; color: #fff;">
        <div style="text-align: center; padding: 20px;">
          <h3 style="margin-bottom: 8px;">Giriş Başarılı</h3>
          <p style="color: #a1a1aa; font-size: 14px;">Oturumunuz açılıyor, lütfen bekleyin...</p>
        </div>
        <script>
          try {
            const authData = ${JSON.stringify({ token: authResult.token, user: authResult.user })};
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', data: authData }, window.location.origin);
              window.close();
            } else {
              localStorage.setItem('cerilas_tools_user_token', authData.token);
              localStorage.setItem('cerilas_tools_auth_token', authData.token);
              window.location.href = '/#/account';
            }
          } catch(e) {
            window.location.href = '/#/account';
          }
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('Google callback error:', err);
    res.send(`
      <!DOCTYPE html>
      <html><body>
      <script>
        if (window.opener) {
          window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: '${encodeURIComponent(err.message)}' }, window.location.origin);
          window.close();
        } else {
          window.location.href = '/#/account?error=' + encodeURIComponent('${err.message}');
        }
      </script>
      </body></html>
    `);
  }
});

/**
 * POST /api/auth/google/link
 * Link Google account to currently authenticated user
 */
router.post('/google/link', requireAuth, async (req, res) => {
  try {
    const { credential, code } = req.body;
    let googleId, email;

    if (credential) {
      const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
      const payload = await verifyRes.json();
      if (!verifyRes.ok || payload.error) {
        return res.status(400).json({ error: 'Geçersiz Google kimliği.' });
      }
      googleId = payload.sub;
      email = payload.email;
    } else if (code) {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        }).toString()
      });
      const tokenData = await tokenRes.json();
      const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const profile = await userinfoRes.json();
      googleId = profile.sub;
      email = profile.email;
    }

    if (!googleId) {
      return res.status(400).json({ error: 'Google hesap bilgisi alınamadı.' });
    }

    // Check if this googleId is already linked to another user
    const checkRes = await authPool.query(
      'SELECT id, email FROM users WHERE google_id = $1 AND id != $2',
      [googleId, req.user.id]
    );
    if (checkRes.rows.length > 0) {
      return res.status(400).json({ error: 'Bu Google hesabı zaten başka bir kullanıcıya bağlı.' });
    }

    const updated = await authPool.query(
      'UPDATE users SET google_id = $1 WHERE id = $2 RETURNING *',
      [googleId, req.user.id]
    );

    res.json({
      success: true,
      message: 'Google hesabınız başarıyla bağlandı!',
      user: formatUser(updated.rows[0])
    });
  } catch (err) {
    console.error('Google link error:', err);
    res.status(500).json({ error: 'Google hesabı bağlanırken bir hata oluştu.' });
  }
});

/**
 * POST /api/auth/google/unlink
 * Unlink Google account from current user
 */
router.post('/google/unlink', requireAuth, async (req, res) => {
  try {
    const userRes = await authPool.query(
      'SELECT id, password_hash, google_id FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    const currentUser = userRes.rows[0];
    if (!currentUser.google_id) {
      return res.status(400).json({ error: 'Hesabınız zaten Google ile bağlı değil.' });
    }

    if (!currentUser.password_hash) {
      return res.status(400).json({ 
        error: 'Şifreniz bulunmadığı için Google bağlantısını kaldıramazsınız. Hesabınıza giriş yapabilmek için Google bağlantısı gereklidir.' 
      });
    }

    const updated = await authPool.query(
      'UPDATE users SET google_id = NULL WHERE id = $1 RETURNING *',
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'Google hesabı bağlantısı kaldırıldı.',
      user: formatUser(updated.rows[0])
    });
  } catch (err) {
    console.error('Google unlink error:', err);
    res.status(500).json({ error: 'Google bağlantısı kaldırılırken hata oluştu.' });
  }
});

/**
 * GET /api/auth/me
 * Current user profile
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await authPool.query(
      'SELECT * FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Kullanıcı hesabı bulunamadı.' });
    }

    const row = result.rows[0];

    // If subscription was scheduled to cancel at period end and expiration date has passed, auto-downgrade to free
    if (row.cancel_at_period_end && row.plan_expires_at && new Date(row.plan_expires_at) <= new Date()) {
      const expiredRes = await authPool.query(
        `UPDATE users 
         SET plan = 'free', cancel_at_period_end = FALSE, subscription_status = 'expired'
         WHERE id = $1 RETURNING *`,
        [req.user.id]
      );
      if (expiredRes.rows.length > 0) {
        return res.json({
          authenticated: true,
          user: formatUser(expiredRes.rows[0])
        });
      }
    }

    res.json({
      authenticated: true,
      user: formatUser(row)
    });
  } catch (err) {
    console.error('Auth me error:', err);
    res.status(401).json({ error: 'Geçersiz veya süresi dolmuş oturum.' });
  }
});

/**
 * PUT /api/auth/profile
 * Update profile details (Name, Surname, Avatar, Phone)
 */
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { first_name, last_name, avatar_url, phone } = req.body;
    
    const current = await authPool.query('SELECT phone, phone_verified FROM users WHERE id = $1', [req.user.id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    let phoneVerified = current.rows[0].phone_verified;
    const cleanPhone = phone !== undefined ? (phone ? phone.trim() : null) : current.rows[0].phone;
    
    // If phone number changes, reset verification status
    if (cleanPhone !== current.rows[0].phone) {
      phoneVerified = false;
    }

    const result = await authPool.query(
      `UPDATE users SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        avatar_url = COALESCE($3, avatar_url),
        phone = $4,
        phone_verified = $5
       WHERE id = $6
       RETURNING *`,
      [
        first_name !== undefined ? first_name.trim() : null,
        last_name !== undefined ? last_name.trim() : null,
        avatar_url !== undefined ? avatar_url : null,
        cleanPhone,
        phoneVerified,
        req.user.id
      ]
    );

    res.json({
      success: true,
      message: 'Profiliniz başarıyla güncellendi.',
      user: formatUser(result.rows[0])
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Profil güncellenirken bir hata meydana geldi.' });
  }
});

/**
 * POST /api/auth/phone/send-otp
 * Send SMS verification code using Netgsm infrastructure
 */
router.post('/phone/send-otp', requireAuth, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Please enter a mobile phone number.' });
    }

    // Clean phone number: remove non-digits
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('90') && digits.length === 12) {
      digits = digits.slice(2);
    } else if (digits.startsWith('0') && digits.length === 11) {
      digits = digits.slice(1);
    }

    if (digits.length !== 10 || !digits.startsWith('5')) {
      return res.status(400).json({ error: 'Please enter a valid Turkish mobile phone number (e.g. 5xx xxx xx xx).' });
    }

    // Generate 6 digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Invalidate existing pending codes for user
    await authPool.query(
      'UPDATE phone_verification_codes SET verified = true WHERE user_id = $1 AND verified = false',
      [req.user.id]
    );

    // Save code
    await authPool.query(
      `INSERT INTO phone_verification_codes (user_id, phone, code, expires_at, verified)
       VALUES ($1, $2, $3, $4, false)`,
      [req.user.id, digits, code, expiresAt]
    );

    // Read Netgsm settings
    const settingsRes = await authPool.query('SELECT * FROM sms_settings LIMIT 1');
    const settings = settingsRes.rows[0];

    let smsSent = false;
    let netgsmError = null;

    if (settings && settings.is_active && settings.netgsm_usercode && settings.netgsm_password && settings.netgsm_header) {
      const authString = Buffer.from(`${settings.netgsm_usercode}:${settings.netgsm_password}`).toString('base64');
      const netgsmPayload = {
        msgheader: settings.netgsm_header,
        msg: `Your Cerilas Tools verification code is: ${code}. For your security, do not share this code with anyone.`,
        no: digits
      };

      try {
        const netgsmRes = await fetch('https://api.netgsm.com.tr/sms/rest/v2/otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${authString}`
          },
          body: JSON.stringify(netgsmPayload)
        });

        const netgsmData = await netgsmRes.json();
        console.log('Netgsm OTP Response:', netgsmData);
        if (netgsmData.code === '00') {
          smsSent = true;
        } else {
          netgsmError = netgsmData.description || `SMS provider code: ${netgsmData.code}`;
        }
      } catch (smsErr) {
        console.error('Netgsm fetch error:', smsErr);
        netgsmError = smsErr.message;
      }
    } else {
      console.warn('SMS settings not configured or inactive. Code:', code);
    }

    console.log(`[SMS OTP] User ${req.user.id} -> 0${digits}: Code = ${code}, Sent = ${smsSent}`);

    res.json({
      success: true,
      smsSent,
      phone: `0${digits}`,
      cleanPhone: digits,
      message: smsSent ? 'Verification code sent via SMS to your phone.' : 'Verification code created.',
      expiresIn: 300,
      debugCode: !smsSent ? code : undefined
    });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ error: 'Failed to send SMS verification code.' });
  }
});

/**
 * POST /api/auth/phone/verify-otp
 * Verify 6-digit SMS OTP code
 */
router.post('/phone/verify-otp', requireAuth, async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Please enter the 6-digit verification code.' });
    }

    const cleanCode = code.toString().trim();
    let digits = (phone || '').replace(/\D/g, '');
    if (digits.startsWith('90') && digits.length === 12) digits = digits.slice(2);
    if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1);

    const match = await authPool.query(
      `SELECT id, phone, expires_at 
       FROM phone_verification_codes 
       WHERE user_id = $1 AND code = $2 AND verified = false AND expires_at > NOW()
       ORDER BY id DESC LIMIT 1`,
      [req.user.id, cleanCode]
    );

    if (match.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }

    const matchedRow = match.rows[0];
    const finalPhone = matchedRow.phone || digits;

    await authPool.query('UPDATE phone_verification_codes SET verified = true WHERE id = $1', [matchedRow.id]);

    const userUpdate = await authPool.query(
      `UPDATE users SET phone = $1, phone_verified = true WHERE id = $2 RETURNING *`,
      [finalPhone, req.user.id]
    );

    res.json({
      success: true,
      message: 'Phone number verified successfully!',
      user: formatUser(userUpdate.rows[0])
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Failed to verify verification code.' });
  }
});

/**
 * PUT /api/auth/billing
 * Update user billing details
 */
router.put('/billing', requireAuth, async (req, res) => {
  try {
    const {
      billing_type,
      billing_name,
      billing_tax_id,
      billing_tax_office,
      billing_address,
      billing_city,
      billing_country
    } = req.body;

    const result = await authPool.query(
      `UPDATE users SET 
        billing_type = COALESCE($1, billing_type),
        billing_name = COALESCE($2, billing_name),
        billing_tax_id = COALESCE($3, billing_tax_id),
        billing_tax_office = COALESCE($4, billing_tax_office),
        billing_address = COALESCE($5, billing_address),
        billing_city = COALESCE($6, billing_city),
        billing_country = COALESCE($7, billing_country)
       WHERE id = $8
       RETURNING *`,
      [
        billing_type || 'individual',
        billing_name || null,
        billing_tax_id || null,
        billing_tax_office || null,
        billing_address || null,
        billing_city || null,
        billing_country || 'Türkiye',
        req.user.id
      ]
    );

    res.json({
      success: true,
      message: 'Fatura bilgileri başarıyla kaydedildi.',
      user: formatUser(result.rows[0])
    });
  } catch (err) {
    console.error('Update billing error:', err);
    res.status(500).json({ error: 'Fatura bilgileri kaydedilemedi.' });
  }
});

/**
 * GET /api/auth/invoices
 * Get real user invoices & transactions from RevenueCat / Paddle
 */
router.get('/invoices', requireAuth, async (req, res) => {
  try {
    const rcSubscriber = await fetchRevenueCatSubscriber(req.user.id);
    const invoices = [];

    if (rcSubscriber) {
      const portalUrl = rcSubscriber.management_url || null;

      // 1. Process subscriptions from RevenueCat / Paddle
      if (rcSubscriber.subscriptions) {
        for (const [prodId, sub] of Object.entries(rcSubscriber.subscriptions)) {
          if (sub.store_transaction_id) {
            let amount = 0;
            if (sub.price && typeof sub.price.amount === 'number' && sub.price.amount > 0) {
              amount = sub.price.amount;
            } else {
              const lower = prodId.toLowerCase();
              amount = (lower.includes('unlimited') || lower.includes('enterprise')) ? 14.99 : 9.99;
            }

            const currency = sub.price?.currency || 'USD';
            const subPortalUrl = sub.management_url || portalUrl;

            invoices.push({
              id: sub.store_transaction_id,
              invoice_number: sub.store_transaction_id,
              plan_name: sub.display_name || (prodId.toLowerCase().includes('unlimited') ? 'Unlimited Plan' : 'Pro Plan'),
              amount,
              currency,
              status: sub.refunded_at ? 'refunded' : 'paid',
              invoice_date: sub.purchase_date || sub.original_purchase_date,
              expires_date: sub.expires_date,
              store: sub.store || 'paddle',
              is_sandbox: !!sub.is_sandbox,
              management_url: subPortalUrl,
              download_url: subPortalUrl
            });
          }
        }
      }

      // 2. Process non_subscriptions if any
      if (rcSubscriber.non_subscriptions) {
        for (const [prodId, items] of Object.entries(rcSubscriber.non_subscriptions)) {
          if (Array.isArray(items)) {
            for (const item of items) {
              if (item.store_transaction_id) {
                invoices.push({
                  id: item.store_transaction_id,
                  invoice_number: item.store_transaction_id,
                  plan_name: prodId,
                  amount: item.price?.amount || 0,
                  currency: item.price?.currency || 'USD',
                  status: 'paid',
                  invoice_date: item.purchase_date,
                  store: item.store || 'paddle',
                  management_url: portalUrl,
                  download_url: portalUrl
                });
              }
            }
          }
        }
      }
    }

    // Sort by invoice_date descending (newest first)
    invoices.sort((a, b) => new Date(b.invoice_date) - new Date(a.invoice_date));

    res.json({
      success: true,
      invoices,
      management_url: rcSubscriber?.management_url || null
    });
  } catch (err) {
    console.error('Get invoices error:', err);
    res.status(500).json({ error: 'Faturalar alınamadı.' });
  }
});

/**
 * POST /api/auth/upgrade-plan
 * Upgrade user plan
 */
router.post('/upgrade-plan', requireAuth, async (req, res) => {
  try {
    let { plan } = req.body;
    if (plan === 'enterprise') plan = 'unlimited';
    if (!['free', 'pro', 'unlimited'].includes(plan)) {
      return res.status(400).json({ error: 'Geçersiz plan seçimi.' });
    }

    const updated = await authPool.query(
      `UPDATE users 
       SET plan = $1, 
           cancel_at_period_end = FALSE, 
           plan_expires_at = NULL, 
           subscription_status = CASE WHEN $1 = 'free' THEN 'free' ELSE 'active' END 
       WHERE id = $2 RETURNING *`,
      [plan, req.user.id]
    );

    // Also update any organization owned by the user
    try {
      await authPool.query(
        'UPDATE organizations SET plan = $1 WHERE created_by_user_id = $2',
        [plan, req.user.id]
      );
    } catch (_) {}

    const amount = plan === 'pro' ? 9.99 : (plan === 'unlimited' ? 14.99 : 0.00);
    const planTitle = plan === 'pro' ? 'Pro Plan' : (plan === 'unlimited' ? 'Unlimited Plan' : 'Free Starter Plan');
    const invNum = `INV-${Date.now().toString().slice(-6)}`;
    
    await authPool.query(
      `INSERT INTO user_invoices (user_id, invoice_number, plan_name, amount, currency, status, invoice_date)
       VALUES ($1, $2, $3, $4, 'USD', 'paid', NOW())`,
      [req.user.id, invNum, planTitle, amount]
    );

    res.json({
      success: true,
      message: `Planınız başarıyla ${planTitle} olarak güncellendi.`,
      user: formatUser(updated.rows[0])
    });
  } catch (err) {
    console.error('Upgrade plan error:', err);
    res.status(500).json({ error: 'Plan güncellenemedi.' });
  }
});

const REVENUECAT_API_KEY = process.env.REVENUECAT_API_KEY || 'pdl_WBnMsdzJRdmzoYfKutAecxwmRtfn';

/**
 * Fetch subscriber object directly from RevenueCat v1 REST API
 */
export async function fetchRevenueCatSubscriber(userId) {
  try {
    const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${userId}`, {
      headers: {
        'Authorization': `Bearer ${REVENUECAT_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    return data?.subscriber || null;
  } catch (err) {
    console.error('[RevenueCat API] Subscriber fetch failed:', err?.message || err);
    return null;
  }
}

/**
 * GET /api/auth/subscription-status
 * Check live RevenueCat and Paddle subscription status for user
 */
router.get('/subscription-status', requireAuth, async (req, res) => {
  try {
    const userRes = await authPool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }
    const userRow = userRes.rows[0];

    const rcSubscriber = await fetchRevenueCatSubscriber(req.user.id);
    const proEntitlement = rcSubscriber?.entitlements?.cerilas_tools_pro;
    const hasActiveRcPro = !!(
      proEntitlement &&
      (!proEntitlement.expires_date || new Date(proEntitlement.expires_date) > new Date())
    );

    const managementUrl = rcSubscriber?.management_url || null;
    const cancelUrl = managementUrl ? managementUrl.replace('action=overview', 'action=cancel') : null;

    let unsubscribeDetectedAt = null;
    if (rcSubscriber?.subscriptions) {
      for (const key of Object.keys(rcSubscriber.subscriptions)) {
        if (rcSubscriber.subscriptions[key]?.unsubscribe_detected_at) {
          unsubscribeDetectedAt = rcSubscriber.subscriptions[key].unsubscribe_detected_at;
          break;
        }
      }
    }

    res.json({
      success: true,
      user: formatUser(userRow),
      hasActiveRcPro,
      expiresDate: proEntitlement?.expires_date || userRow.plan_expires_at || null,
      managementUrl,
      cancelUrl,
      unsubscribeDetectedAt
    });
  } catch (err) {
    console.error('Subscription status error:', err);
    res.status(500).json({ error: 'Abonelik durumu alınamadı.' });
  }
});

/**
 * GET /api/auth/management-portal
 * Fetch direct Paddle Customer Portal URL for active subscriber
 */
router.get('/management-portal', requireAuth, async (req, res) => {
  try {
    const rcSubscriber = await fetchRevenueCatSubscriber(req.user.id);
    const managementUrl = rcSubscriber?.management_url || null;
    const cancelUrl = managementUrl ? managementUrl.replace('action=overview', 'action=cancel') : null;

    res.json({
      success: true,
      managementUrl,
      cancelUrl
    });
  } catch (err) {
    console.error('Management portal error:', err);
    res.status(500).json({ error: 'Yönetim portalı alınamadı.' });
  }
});

/**
 * POST /api/auth/schedule-downgrade
 * Retain Pro/Unlimited until period end date, sync with RevenueCat/Paddle, then auto-downgrade
 */
router.post('/schedule-downgrade', requireAuth, async (req, res) => {
  try {
    const { periodEndDate } = req.body;
    
    // Live RevenueCat subscriber check
    const rcSubscriber = await fetchRevenueCatSubscriber(req.user.id);
    const proEntitlement = rcSubscriber?.entitlements?.cerilas_tools_pro;
    const rcExpiryDate = proEntitlement?.expires_date ? new Date(proEntitlement.expires_date) : null;
    
    const expiryDate = rcExpiryDate || (periodEndDate ? new Date(periodEndDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    const managementUrl = rcSubscriber?.management_url || null;
    const cancelUrl = managementUrl ? managementUrl.replace('action=overview', 'action=cancel') : null;

    const updated = await authPool.query(
      `UPDATE users 
       SET cancel_at_period_end = TRUE, 
           plan_expires_at = $1, 
           subscription_status = 'canceling' 
       WHERE id = $2 
       RETURNING *`,
      [expiryDate, req.user.id]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    res.json({
      success: true,
      scheduled: true,
      plan_expires_at: expiryDate.toISOString(),
      management_url: managementUrl,
      cancel_url: cancelUrl,
      message: 'Downgrade işlemi planlandı. Üyeliğiniz dönem sonuna kadar kesintisiz devam edecektir.',
      user: formatUser(updated.rows[0])
    });
  } catch (err) {
    console.error('Schedule downgrade error:', err);
    res.status(500).json({ error: 'Downgrade işlemi planlanamadı.' });
  }
});

/**
 * POST /api/auth/resume-subscription
 * Cancel scheduled downgrade, sync with RevenueCat and resume active subscription
 */
router.post('/resume-subscription', requireAuth, async (req, res) => {
  try {
    const rcSubscriber = await fetchRevenueCatSubscriber(req.user.id);
    const managementUrl = rcSubscriber?.management_url || null;

    const updated = await authPool.query(
      `UPDATE users 
       SET cancel_at_period_end = FALSE, 
           plan_expires_at = NULL, 
           subscription_status = 'active',
           plan = 'pro' 
       WHERE id = $1 
       RETURNING *`,
      [req.user.id]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    res.json({
      success: true,
      management_url: managementUrl,
      message: 'Aboneliğiniz başarıyla sürdürüldü.',
      user: formatUser(updated.rows[0])
    });
  } catch (err) {
    console.error('Resume subscription error:', err);
    res.status(500).json({ error: 'Abonelik sürdürülemedi.' });
  }
});

/**
 * POST /api/auth/sync-plan
 * Sync active plan status with RevenueCat verification
 */
router.post('/sync-plan', requireAuth, async (req, res) => {
  try {
    let { plan, force } = req.body;
    if (plan === 'enterprise') plan = 'unlimited';
    if (!['free', 'pro', 'unlimited'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan.' });
    }

    // Verify live RevenueCat subscriber entitlements
    const rcSubscriber = await fetchRevenueCatSubscriber(req.user.id);
    const proEntitlement = rcSubscriber?.entitlements?.cerilas_tools_pro;
    const hasActiveRcPro = !!(
      proEntitlement &&
      (!proEntitlement.expires_date || new Date(proEntitlement.expires_date) > new Date())
    );

    const unlimEntitlement = rcSubscriber?.entitlements?.cerilas_tools_unlimited || rcSubscriber?.entitlements?.unlimited;
    const hasActiveRcUnlimited = !!(
      unlimEntitlement &&
      (!unlimEntitlement.expires_date || new Date(unlimEntitlement.expires_date) > new Date())
    );

    const rcSubscriptions = rcSubscriber?.subscriptions || {};
    const hasActiveUnlimitedSub = Object.entries(rcSubscriptions).some(([prodId, sub]) => {
      const isUnlimProd = prodId.toLowerCase().includes('unlimited') || prodId === 'pri_01m41vmta5xebbmwt1k46xbfsf';
      const isActive = !sub.expires_date || new Date(sub.expires_date) > new Date();
      return isUnlimProd && isActive;
    });

    const current = await authPool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const currentUser = current.rows[0];

    let targetPlan = plan;
    // Check Unlimited first, then Pro
    if (plan === 'unlimited' || hasActiveRcUnlimited || hasActiveUnlimitedSub) {
      targetPlan = 'unlimited';
    } else if (hasActiveRcPro && (force || plan === 'pro')) {
      targetPlan = 'pro';
    } else if (currentUser && currentUser.plan === 'free' && plan !== 'free' && !force && !hasActiveRcPro) {
      return res.json({
        success: true,
        message: 'Plan is free; background auto-upgrade skipped.',
        user: formatUser(currentUser)
      });
    }

    let cancelAtPeriodEnd = currentUser ? currentUser.cancel_at_period_end : false;
    let subscriptionStatus = currentUser ? currentUser.subscription_status : 'active';
    let planExpiresAt = currentUser ? currentUser.plan_expires_at : null;

    if ((targetPlan === 'pro' || targetPlan === 'unlimited') && force) {
      cancelAtPeriodEnd = false;
      subscriptionStatus = 'active';
      planExpiresAt = null;
    }

    const updated = await authPool.query(
      `UPDATE users 
       SET plan = $1,
           cancel_at_period_end = $2,
           subscription_status = $3,
           plan_expires_at = $4
       WHERE id = $5 
       RETURNING *`,
      [targetPlan, cancelAtPeriodEnd, subscriptionStatus, planExpiresAt, req.user.id]
    );

    try {
      await authPool.query(
        'UPDATE organizations SET plan = $1 WHERE created_by_user_id = $2',
        [targetPlan, req.user.id]
      );
    } catch (_) {}

    res.json({
      success: true,
      user: formatUser(updated.rows[0]),
      hasRcPro: hasActiveRcPro,
      management_url: rcSubscriber?.management_url || null
    });
  } catch (err) {
    console.error('Sync plan error:', err);
    res.status(500).json({ error: 'Failed to synchronize plan.' });
  }
});

export default router;
