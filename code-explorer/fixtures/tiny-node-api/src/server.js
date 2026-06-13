// HTTP server entrypoint for tiny-node-api.

import { createServer } from 'node:http';
import { loadConfig } from './config.js';
import { route } from './routes.js';

export function createApp() {
  return createServer(route);
}

const { port } = loadConfig();
const server = createApp();
server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`tiny-node-api listening on ${port}`);
});
