import pool from '../db.js';

export async function initMcpDb() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS mcp_user_connections (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        mcp_key VARCHAR(128) UNIQUE NOT NULL,
        refresh_token_encrypted TEXT NOT NULL,
        access_token_cached TEXT,
        token_expires_at BIGINT,
        selected_gsc_site VARCHAR(255),
        selected_ga4_property VARCHAR(255),
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_mcp_user_connections_mcp_key ON mcp_user_connections(mcp_key);
      CREATE INDEX IF NOT EXISTS idx_mcp_user_connections_email ON mcp_user_connections(user_email);

      CREATE TABLE IF NOT EXISTS mcp_oauth_states (
        state_id VARCHAR(128) PRIMARY KEY,
        client_id VARCHAR(255),
        redirect_uri TEXT NOT NULL,
        chatgpt_state TEXT,
        code_challenge TEXT,
        code_challenge_method VARCHAR(32),
        scope TEXT,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS mcp_oauth_codes (
        code VARCHAR(128) PRIMARY KEY,
        mcp_key VARCHAR(128) NOT NULL,
        client_id VARCHAR(255),
        redirect_uri TEXT,
        code_challenge TEXT,
        code_challenge_method VARCHAR(32),
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(createTableQuery);
    console.log('[DB] MCP User Connections and OAuth tables verified successfully.');
  } catch (err) {
    console.error('[DB] Failed to initialize MCP table:', err.message);
  }
}
