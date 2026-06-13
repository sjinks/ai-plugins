import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildGreeting } from '../src/service.js';

test('buildGreeting uses the provided name', () => {
  assert.equal(buildGreeting('Ada'), 'Hello, Ada!');
});

test('buildGreeting falls back to world for empty name', () => {
  assert.equal(buildGreeting(''), 'Hello, world!');
  assert.equal(buildGreeting(null), 'Hello, world!');
});
