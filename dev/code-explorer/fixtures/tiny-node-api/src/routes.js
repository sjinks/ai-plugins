// HTTP route handling for tiny-node-api.

import { buildGreeting } from './service.js';

/**
 * Handle GET /greeting?name=...
 * Reflects the `name` query parameter into the response body.
 */
export function handleGreeting(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const name = url.searchParams.get('name');
  const body = buildGreeting(name);
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(body);
}

export function route(req, res) {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'GET' && url.pathname === '/greeting') {
    return handleGreeting(req, res);
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
}
