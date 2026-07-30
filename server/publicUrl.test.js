import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PUBLIC_URL,
  normalizePublicUrl,
} from './publicUrl.js';

test('public URL defaults to the non-redirecting canonical domain', () => {
  assert.equal(normalizePublicUrl(), 'https://cerilas.com');
  assert.equal(DEFAULT_PUBLIC_URL, 'https://cerilas.com');
});

test('public URL removes paths and trailing slashes', () => {
  assert.equal(
    normalizePublicUrl('https://cerilas.com/some/path/'),
    'https://cerilas.com'
  );
});

test('legacy www configuration resolves to the non-redirecting domain', () => {
  assert.equal(
    normalizePublicUrl('https://www.cerilas.com/'),
    'https://cerilas.com'
  );
});

test('public URL rejects unsupported and invalid values', () => {
  assert.equal(normalizePublicUrl('javascript:alert(1)'), DEFAULT_PUBLIC_URL);
  assert.equal(normalizePublicUrl('not a URL'), DEFAULT_PUBLIC_URL);
});
