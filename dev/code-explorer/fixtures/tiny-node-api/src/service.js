// Business logic: build a greeting string.

import { loadConfig } from './config.js';

/**
 * Build a greeting for the given name.
 * NOTE: name is used as-is with no length limit or sanitization.
 */
export function buildGreeting(name) {
  const { greetingPrefix } = loadConfig();
  const who = name && name.trim() !== '' ? name : 'world';
  return `${greetingPrefix}, ${who}!`;
}
