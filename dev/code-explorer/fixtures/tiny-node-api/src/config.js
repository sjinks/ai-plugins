// Runtime configuration for tiny-node-api.

export function loadConfig() {
  return {
    // Prefix prepended to every greeting. Optional; defaults to "Hello".
    greetingPrefix: process.env.GREETING_PREFIX || 'Hello',
    // Port the HTTP server listens on.
    port: Number(process.env.PORT || 3000),
  };
}
