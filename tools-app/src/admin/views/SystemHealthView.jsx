import React, { useState, useEffect } from 'react';
import { Cpu, Database, CheckCircle2, AlertTriangle, RefreshCw, Server, Zap, ShieldCheck } from 'lucide-react';

export default function SystemHealthView() {
  const [dbStatus, setDbStatus] = useState({ loading: true, ok: false, time: null, latency: null });
  const [apiHealth, setApiHealth] = useState({ loading: true, ok: false });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkHealth = async () => {
    setIsRefreshing(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/db-check');
      const data = await res.json();
      const latency = Math.round(performance.now() - start);
      setDbStatus({
        loading: false,
        ok: data.status === 'success',
        time: data.time,
        host: data.host,
        latency
      });
    } catch (e) {
      setDbStatus({ loading: false, ok: false, error: e.message, latency: null });
    }

    try {
      const healthRes = await fetch('/api/health');
      const healthData = await healthRes.json();
      setApiHealth({ loading: false, ok: healthData.status === 'ok' });
    } catch (e) {
      setApiHealth({ loading: false, ok: false });
    }
    setIsRefreshing(false);
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const endpoints = [
    { path: '/api/health', method: 'GET', description: 'Core application health check probe', auth: 'Public' },
    { path: '/api/tools', method: 'GET', description: 'Full registry and tool database catalog', auth: 'Public' },
    { path: '/api/tools/stats/overview', method: 'GET', description: 'Real-time telemetry and visitor counters', auth: 'Public' },
    { path: '/api/tools/:slug/event', method: 'POST', description: 'Action logger (view, download, copy, use)', auth: 'Cookie Token' },
    { path: '/api/tools/:slug/consume-ai-quota', method: 'POST', description: 'Rate limit enforcer for Gemini AI engines', auth: 'IP + Cookie' },
    { path: '/api/ats/analyze', method: 'POST', description: 'ATS Resume parser and semantic keyword scoring', auth: 'Quota Token' },
    { path: '/api/crawler-checker/analyze', method: 'POST', description: 'AI crawler inspection & robots.txt generator', auth: 'Quota Token' }
  ];

  return (
    <div className="admin-body">
      {/* Header bar */}
      <div className="admin-health-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Infrastructure & Services Health</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Real-time server telemetry and database connection checks
          </span>
        </div>
        <button 
          type="button" 
          className="admin-action-btn primary"
          onClick={checkHealth}
          disabled={isRefreshing}
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <RefreshCw size={14} className={isRefreshing ? 'spin-anim' : ''} />
          <span>{isRefreshing ? 'Pinging...' : 'Ping Services Now'}</span>
        </button>
      </div>

      {/* Health Cards */}
      <div className="admin-health-grid">
        {/* PostgreSQL Health */}
        <div style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--card-border, rgba(0,0,0,0.07))',
          borderRadius: 18,
          padding: '1.4rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              PostgreSQL Telemetry DB
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            {dbStatus.ok ? (
              <>
                <CheckCircle2 size={18} color="#10b981" />
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>Connected</span>
              </>
            ) : (
              <>
                <AlertTriangle size={18} color="#f59e0b" />
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f59e0b' }}>Degraded / Offline</span>
              </>
            )}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Latency: <strong>{dbStatus.latency !== null ? `${dbStatus.latency} ms` : 'N/A'}</strong> | Host: {dbStatus.host || 'Direct Pool'}
          </div>
        </div>

        {/* Express Server */}
        <div style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--card-border, rgba(0,0,0,0.07))',
          borderRadius: 18,
          padding: '1.4rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Express API Runtime
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Server size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <CheckCircle2 size={18} color="#10b981" />
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>Operational</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Port: 3002 | SSR Pre-rendering: Enabled
          </div>
        </div>

        {/* Gemini AI Quotas */}
        <div style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--card-border, rgba(0,0,0,0.07))',
          borderRadius: 18,
          padding: '1.4rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Gemini AI Rate Limiter
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <ShieldCheck size={18} color="#10b981" />
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>Active Protection</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Dynamic sliding window: 3-5 scans/hr per device
          </div>
        </div>
      </div>

      {/* Endpoints Table */}
      <div className="admin-table-container">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>HTTP Method</th>
                <th>API Route</th>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>Security Tier</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((ep, i) => (
                <tr key={i}>
                  <td>
                    <span style={{
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 6,
                      background: ep.method === 'GET' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                      color: ep.method === 'GET' ? '#3b82f6' : '#10b981',
                      fontFamily: 'monospace'
                    }}>
                      {ep.method}
                    </span>
                  </td>
                  <td>
                    <code style={{ fontSize: '0.84rem', color: 'var(--text-main)', fontWeight: 600 }}>
                      {ep.path}
                    </code>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    {ep.description}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      padding: '0.15rem 0.55rem',
                      borderRadius: 999,
                      background: 'rgba(150, 150, 150, 0.1)',
                      color: 'var(--text-muted)'
                    }}>
                      {ep.auth}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
