#!/usr/bin/env node
// Summarize generated exploration artifacts into a short status line per artifact.
//
// Usage:
//   node code-explorer/scripts/summarize-artifacts.mjs <artifact-dir>
//
// Read-only. Prints counts (risks by severity, entrypoints, open questions,
// symbols by tier, etc.) so a human or agent can sanity-check an exploration
// run at a glance. Exit code is always 0 unless usage is invalid (2).

import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

function loadJson(p) {
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function countBy(arr, key) {
  const out = {};
  for (const item of arr) {
    const k = item && item[key] !== undefined ? item[key] : 'unknown';
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}

function main() {
  const dirArg = process.argv[2];
  if (!dirArg) {
    process.stderr.write('Usage: summarize-artifacts.mjs <artifact-dir>\n');
    process.exit(2);
  }
  const dir = resolve(dirArg);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    process.stderr.write(`Error: artifact directory not found: ${dir}\n`);
    process.exit(2);
  }
  const mr = join(dir, 'machine-readable');
  const lines = ['Exploration artifact summary', ''];

  const risks = loadJson(join(mr, 'risks.json'));
  if (risks && Array.isArray(risks.data)) {
    const bySev = countBy(risks.data, 'severity');
    lines.push(`Risks: ${risks.data.length} (${formatCounts(bySev)})`);
  }

  const entrypoints = loadJson(join(mr, 'entrypoints.json'));
  if (entrypoints && Array.isArray(entrypoints.data)) {
    const traced = entrypoints.data.filter((e) => e.traced).length;
    lines.push(`Entrypoints: ${entrypoints.data.length} (${traced} traced)`);
  }

  const symbols = loadJson(join(mr, 'symbol_index.json'));
  if (symbols && Array.isArray(symbols.data)) {
    const byTier = countBy(symbols.data, 'tier');
    lines.push(`Symbols: ${symbols.data.length} (${formatCounts(byTier, 'tier ')})`);
  }

  const flows = loadJson(join(mr, 'dataflows.json'));
  if (flows && Array.isArray(flows.data)) lines.push(`Data flows: ${flows.data.length}`);

  const questions = loadJson(join(mr, 'open_questions.json'));
  if (questions && Array.isArray(questions.data)) lines.push(`Open questions: ${questions.data.length}`);

  const contracts = loadJson(join(mr, 'contracts.json'));
  if (contracts && Array.isArray(contracts.data)) lines.push(`Contracts: ${contracts.data.length}`);

  const sec = loadJson(join(mr, 'security_sensitive_code.json'));
  if (sec && Array.isArray(sec.data)) lines.push(`Security-sensitive sites: ${sec.data.length}`);

  const evidence = loadJson(join(mr, 'evidence_index.json'));
  if (evidence && Array.isArray(evidence.data)) lines.push(`Evidence records: ${evidence.data.length}`);

  if (lines.length === 2) lines.push('(no machine-readable artifacts found)');
  process.stdout.write(lines.join('\n') + '\n');
}

function formatCounts(obj, prefix = '') {
  return Object.entries(obj)
    .map(([k, v]) => `${prefix}${k}: ${v}`)
    .join(', ');
}

main();
