#!/usr/bin/env node
// Validate generated Code Explorer exploration artifacts.
//
// Usage:
//   node code-explorer/scripts/validate-artifacts.mjs <artifact-dir> [--strict] [--repo-root <path>]
//
// <artifact-dir> is the docs/codebase-exploration directory to validate.
// --strict        treat warnings as errors (exit 1 if any warning).
// --repo-root     repository root used to resolve file references
//                 (defaults to the current working directory).
//
// Exit codes:
//   0 = valid (no errors; warnings allowed unless --strict)
//   1 = validation errors
//   2 = invalid usage or missing artifact directory

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSchema, validate } from './lib/json-schema.mjs';
import { parseArgs } from './lib/cli.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const SCHEMA_DIR = resolve(SCRIPT_DIR, '..', 'shared', 'schemas');

const ID_PREFIXES = [
  'COMPONENT', 'ENTRYPOINT', 'FLOW', 'SYMBOL', 'CONTRACT', 'CONFIG',
  'OBS', 'SEC', 'PERF', 'RISK', 'GAP', 'QUESTION', 'EVIDENCE',
];
const ID_RE = new RegExp(`^(${ID_PREFIXES.join('|')})-[0-9]{3,}$`);

// Required markdown artifacts (00-13 are the base set).
const REQUIRED_MARKDOWN = [
  '00_EXECUTIVE_SUMMARY.md', '01_REPOSITORY_MAP.md', '02_BUILD_AND_RUNTIME.md',
  '03_ARCHITECTURE_OVERVIEW.md', '04_ENTRYPOINTS.md', '05_DOMAIN_MODEL.md',
  '06_DATAFLOWS_AND_TRUST_BOUNDARIES.md', '07_FUNCTION_AND_SYMBOL_INVENTORY.md',
  '08_DEPENDENCY_GRAPH.md', '09_TEST_COVERAGE_MAP.md', '10_RISK_REGISTER.md',
  '11_CHANGE_IMPACT_GUIDE.md', '12_OPEN_QUESTIONS.md', '13_AGENT_NAVIGATION_GUIDE.md',
];

// Additive markdown artifacts (14-18). Validated (non-empty) only when present;
// their absence is not an error.
const ADDITIVE_MARKDOWN = [
  '14_API_AND_CONTRACTS.md', '15_CONFIG_SURFACE.md',
  '16_OBSERVABILITY_MAP.md', '17_SECURITY_SENSITIVE_CODE.md',
  '18_PERFORMANCE_AND_SCALABILITY.md',
];

// JSON artifact -> schema filename. Required ones must exist; additive ones
// are validated only when present.
const JSON_ARTIFACTS = [
  { file: 'repository_index.json', schema: 'repository_index.schema.json', required: true },
  { file: 'entrypoints.json', schema: 'entrypoints.schema.json', required: true },
  { file: 'dataflows.json', schema: 'dataflows.schema.json', required: true },
  { file: 'symbol_index.json', schema: 'symbol_index.schema.json', required: true },
  { file: 'important_functions.json', schema: 'important_functions.schema.json', required: true },
  { file: 'dependency_graph.json', schema: 'dependency_graph.schema.json', required: true, checkIds: false },
  { file: 'test_map.json', schema: 'test_map.schema.json', required: true },
  { file: 'risks.json', schema: 'risks.schema.json', required: true },
  { file: 'open_questions.json', schema: 'open_questions.schema.json', required: false },
  { file: 'evidence_index.json', schema: 'evidence_index.schema.json', required: false },
  { file: 'contracts.json', schema: 'contracts.schema.json', required: false },
  { file: 'config_surface.json', schema: 'config_surface.schema.json', required: false },
  { file: 'observability_map.json', schema: 'observability_map.schema.json', required: false },
  { file: 'security_sensitive_code.json', schema: 'security_sensitive_code.schema.json', required: false },
  { file: 'performance_findings.json', schema: 'performance_findings.schema.json', required: false },
];

// Required top-level sections per key markdown artifact.
const REQUIRED_SECTIONS = {
  '00_EXECUTIVE_SUMMARY.md': ['## Scope', '## Repository status', '## Important limitations'],
  '01_REPOSITORY_MAP.md': ['## Languages', '## Top-level directories', '## Limitations'],
  '10_RISK_REGISTER.md': ['## Summary', '## Risks'],
  '12_OPEN_QUESTIONS.md': ['# Open Questions'],
};

const ARG_SPEC = {
  positionals: [{ name: 'dir', required: true }],
  flags: {
    '--strict': { type: 'boolean' },
    '--repo-root': { type: 'value', default: process.cwd() },
  },
};

function collectIds(node, into) {
  if (node === null || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) collectIds(item, into);
    return;
  }
  for (const [k, v] of Object.entries(node)) {
    if (k === 'id' && typeof v === 'string') into.push(v);
    else collectIds(v, into);
  }
}

// Extract file-looking references from arbitrary text/JSON.
// A leading boundary (start-of-string or a non-path character) is matched in a
// non-capturing group rather than a lookbehind, so the pattern works on every
// Node.js runtime, not only those that support lookbehind.
const FILE_REF_RE = /(?:^|[^\w./-])((?:[\w.-]+\/)+[\w.-]+\.[a-zA-Z0-9]{1,6})/g;

function extractFileRefs(text) {
  const refs = new Set();
  let m;
  while ((m = FILE_REF_RE.exec(text)) !== null) {
    const ref = m[1];
    // Skip obvious non-source references.
    if (ref.startsWith('docs/codebase-exploration')) continue;
    if (ref.includes('://')) continue;
    refs.add(ref);
  }
  return [...refs];
}

function main() {
  const { values: args, error } = parseArgs(process.argv.slice(2), ARG_SPEC);
  const report = { ok: [], warnings: [], errors: [] };

  if (error) {
    process.stderr.write(`Error: ${error}\n`);
    process.stderr.write('Usage: validate-artifacts.mjs <artifact-dir> [--strict] [--repo-root <path>]\n');
    process.exit(2);
  }
  const artifactDir = resolve(args.dir);
  if (!existsSync(artifactDir) || !statSync(artifactDir).isDirectory()) {
    process.stderr.write(`Error: artifact directory not found: ${artifactDir}\n`);
    process.exit(2);
  }
  const repoRoot = resolve(args.repoRoot);
  const mrDir = join(artifactDir, 'machine-readable');

  // 1. Required markdown files exist + non-empty + required sections.
  for (const md of REQUIRED_MARKDOWN) {
    const p = join(artifactDir, md);
    if (!existsSync(p)) {
      report.errors.push(`missing required markdown artifact: ${md}`);
      continue;
    }
    const text = readFileSync(p, 'utf8');
    if (text.trim().length === 0) {
      report.errors.push(`markdown artifact is empty: ${md}`);
      continue;
    }
    const sections = REQUIRED_SECTIONS[md];
    if (sections) {
      for (const s of sections) {
        if (!text.includes(s)) {
          report.warnings.push(`${md} is missing expected section "${s}"`);
        }
      }
    }
  }
  const mdFound = REQUIRED_MARKDOWN.filter((m) => existsSync(join(artifactDir, m))).length;
  report.ok.push(`${mdFound}/${REQUIRED_MARKDOWN.length} required markdown artifacts found`);

  // Additive markdown artifacts (14-17): validated (non-empty) only when present.
  let additiveFound = 0;
  for (const md of ADDITIVE_MARKDOWN) {
    const p = join(artifactDir, md);
    if (!existsSync(p)) continue;
    additiveFound++;
    if (readFileSync(p, 'utf8').trim().length === 0) {
      report.errors.push(`additive markdown artifact is empty: ${md}`);
    }
  }
  if (additiveFound > 0) report.ok.push(`${additiveFound} additive markdown artifact(s) present`);

  // Gather evidence IDs across artifacts for cross-reference checks.
  const evidenceIds = new Set();
  const evidencePath = join(mrDir, 'evidence_index.json');
  if (existsSync(evidencePath)) {
    try {
      const ev = JSON.parse(readFileSync(evidencePath, 'utf8'));
      for (const rec of ev.data || []) if (rec && rec.id) evidenceIds.add(rec.id);
    } catch { /* parse error reported below */ }
  }

  // 2-9. JSON artifacts: existence, parse, schema, _meta, IDs.
  for (const art of JSON_ARTIFACTS) {
    const p = join(mrDir, art.file);
    if (!existsSync(p)) {
      if (art.required) report.errors.push(`missing required machine-readable artifact: machine-readable/${art.file}`);
      continue;
    }
    let parsed;
    try {
      parsed = JSON.parse(readFileSync(p, 'utf8'));
    } catch (e) {
      report.errors.push(`${art.file} does not parse: ${e.message}`);
      continue;
    }
    report.ok.push(`${art.file} parsed`);

    // _meta presence + required fields.
    if (!parsed._meta || typeof parsed._meta !== 'object') {
      report.errors.push(`${art.file} is missing _meta object`);
    } else {
      if (!parsed._meta.schema) report.errors.push(`${art.file} _meta.schema is missing`);
      if (!parsed._meta.schemaVersion) report.errors.push(`${art.file} _meta.schemaVersion is missing`);
    }

    // Schema validation.
    const schemaPath = join(SCHEMA_DIR, art.schema);
    if (existsSync(schemaPath)) {
      try {
        const loaded = loadSchema(schemaPath);
        const errs = validate(parsed, loaded);
        if (errs.length === 0) {
          report.ok.push(`${art.file} matched schema`);
        } else {
          for (const e of errs.slice(0, 12)) report.errors.push(`${art.file} schema: ${e}`);
          if (errs.length > 12) report.errors.push(`${art.file} schema: (+${errs.length - 12} more)`);
        }
      } catch (e) {
        report.warnings.push(`could not load schema ${art.schema}: ${e.message}`);
      }
    } else {
      report.warnings.push(`no schema found for ${art.file}`);
    }

    // IDs: valid prefix + unique within artifact.
    // dependency_graph.json node ids are graph-local identifiers, not stable
    // IDs, so they are excluded from this check (checkIds === false).
    if (art.checkIds !== false) {
      const ids = [];
      collectIds(parsed.data, ids);
      const seen = new Set();
      for (const id of ids) {
        if (!ID_RE.test(id)) report.errors.push(`${art.file} has invalid stable ID "${id}"`);
        if (seen.has(id)) report.errors.push(`${art.file} has duplicate ID "${id}"`);
        seen.add(id);
      }
    }

    // Evidence references resolve to evidence_index records, when present.
    if (evidenceIds.size > 0) {
      const evRefs = [];
      const scanUsedBy = (node) => {
        if (node === null || typeof node !== 'object') return;
        if (Array.isArray(node)) { node.forEach(scanUsedBy); return; }
        for (const [k, v] of Object.entries(node)) {
          if (k === 'evidence' && Array.isArray(v)) {
            for (const r of v) if (typeof r === 'string' && r.startsWith('EVIDENCE-')) evRefs.push(r);
          } else scanUsedBy(v);
        }
      };
      scanUsedBy(parsed.data);
      for (const r of evRefs) {
        if (!evidenceIds.has(r)) report.warnings.push(`${art.file} references unknown evidence record ${r}`);
      }
    }
  }

  // 10. High/Critical risks must have evidence and suggested verification.
  const risksPath = join(mrDir, 'risks.json');
  if (existsSync(risksPath)) {
    try {
      const risks = JSON.parse(readFileSync(risksPath, 'utf8'));
      let mediumCount = 0;
      for (const r of risks.data || []) {
        if (r.severity === 'high' || r.severity === 'critical') {
          if (!Array.isArray(r.evidence) || r.evidence.length === 0) {
            report.errors.push(`${r.id || '(no id)'} has severity=${r.severity} but no evidence`);
          }
          if (!r.suggestedVerification || String(r.suggestedVerification).trim() === '') {
            report.errors.push(`${r.id || '(no id)'} has severity=${r.severity} but no suggested verification`);
          }
        }
        if (r.confidence === 'medium') mediumCount++;
      }
      if (mediumCount > 0) report.warnings.push(`${mediumCount} risk(s) have medium confidence`);
    } catch { /* parse error already reported */ }
  }

  // 11. File references in markdown + JSON point to existing files where possible.
  let unverified = 0;
  const allArtifactFiles = [];
  for (const md of [...REQUIRED_MARKDOWN, ...ADDITIVE_MARKDOWN]) {
    const p = join(artifactDir, md);
    if (existsSync(p)) allArtifactFiles.push(p);
  }
  if (existsSync(mrDir)) {
    for (const f of readdirSync(mrDir)) {
      if (f.endsWith('.json')) allArtifactFiles.push(join(mrDir, f));
    }
  }
  const checkedRefs = new Set();
  for (const p of allArtifactFiles) {
    const text = readFileSync(p, 'utf8');
    for (const ref of extractFileRefs(text)) {
      if (checkedRefs.has(ref)) continue;
      checkedRefs.add(ref);
      const abs = resolve(repoRoot, ref);
      if (!existsSync(abs)) unverified++;
    }
  }
  if (unverified > 0) {
    report.warnings.push(`${unverified} file reference(s) could not be verified against repo root ${relative(process.cwd(), repoRoot) || '.'}`);
  } else if (checkedRefs.size > 0) {
    report.ok.push(`all ${checkedRefs.size} file reference(s) resolved`);
  }

  // 15. Low-confidence artifacts should document limitations.
  for (const art of JSON_ARTIFACTS) {
    const p = join(mrDir, art.file);
    if (!existsSync(p)) continue;
    try {
      const parsed = JSON.parse(readFileSync(p, 'utf8'));
      const meta = parsed._meta || {};
      if (meta.confidence === 'low') {
        const lims = meta.limitations;
        if (!Array.isArray(lims) || lims.length === 0) {
          report.warnings.push(`${art.file} has low confidence but no _meta.limitations`);
        }
      }
    } catch { /* already reported */ }
  }

  printReport(report);
  const hasErrors = report.errors.length > 0;
  const failOnWarn = args.strict && report.warnings.length > 0;
  process.exit(hasErrors || failOnWarn ? 1 : 0);
}

function printReport(report) {
  const out = [];
  out.push('Artifact validation report');
  out.push('');
  out.push('OK:');
  for (const m of report.ok) out.push(`- ${m}`);
  out.push('');
  out.push('Warnings:');
  if (report.warnings.length === 0) out.push('- none');
  for (const m of report.warnings) out.push(`- ${m}`);
  out.push('');
  out.push('Errors:');
  if (report.errors.length === 0) out.push('- none');
  for (const m of report.errors) out.push(`- ${m}`);
  out.push('');
  out.push(`Summary: ${report.ok.length} ok, ${report.warnings.length} warning(s), ${report.errors.length} error(s)`);
  process.stdout.write(out.join('\n') + '\n');
}

main();
