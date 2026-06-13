// Small, robust command-line argument parser shared by the Code Explorer
// scripts. One implementation avoids the drift that comes from each script
// re-implementing flag handling.
//
// Spec shape:
//   {
//     positionals: [{ name: 'dir', required: true }],
//     flags: {
//       '--strict':    { type: 'boolean' },
//       '--repo-root': { type: 'value', default: process.cwd() },
//     },
//   }
//
// Returns { values, error }:
//   - values: { <positional name>: string|undefined, <flag name w/o dashes,
//               camelCased>: boolean|string }
//   - error:  a usage-error string, or null when parsing succeeded.
//
// Rules enforced for every script:
//   - Unknown flags are an error.
//   - A value flag with no following token, or followed by another --flag, is
//     an error (the flag is never silently swallowed).
//   - Extra positionals beyond the spec are an error.
//   - Missing required positionals are an error.

function flagKey(flag) {
  return flag
    .replace(/^--/, '')
    .replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export function parseArgs(argv, spec) {
  const positionals = spec.positionals || [];
  const flags = spec.flags || {};
  const values = {};

  // Apply flag defaults.
  for (const [flag, def] of Object.entries(flags)) {
    if (def.type === 'boolean') values[flagKey(flag)] = false;
    else if ('default' in def) values[flagKey(flag)] = def.default;
  }

  let positionalIndex = 0;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const def = flags[a];
      if (!def) return { values, error: `unknown flag: ${a}` };
      if (def.type === 'boolean') {
        values[flagKey(a)] = true;
      } else {
        const next = argv[i + 1];
        if (next === undefined || next.startsWith('--')) {
          return { values, error: `${a} requires a value` };
        }
        values[flagKey(a)] = next;
        i++;
      }
    } else if (positionalIndex < positionals.length) {
      values[positionals[positionalIndex].name] = a;
      positionalIndex++;
    } else {
      return { values, error: `unexpected argument: ${a}` };
    }
  }

  for (const p of positionals) {
    if (p.required && values[p.name] === undefined) {
      return { values, error: `missing required argument: <${p.name}>` };
    }
  }

  return { values, error: null };
}
