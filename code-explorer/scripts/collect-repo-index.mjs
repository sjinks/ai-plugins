#!/usr/bin/env node
// Produce a quick static repository summary for the cartography phase.
//
// Usage:
//   node code-explorer/scripts/collect-repo-index.mjs [root]
//
// Prints JSON with files-by-extension, top-level directories, likely
// languages, config files, test files, source files, and ignored candidates.
// This is a read-only helper; it never writes files.

import { existsSync, readdirSync, statSync } from 'node:fs';
import { basename, extname, join, relative, resolve } from 'node:path';

const IGNORE_DIRS = new Set([
  '.git', 'node_modules', 'vendor', 'dist', 'build', 'coverage',
  '.cache', '.next', 'target', '.DS_Store', '.venv', '__pycache__',
]);

const CONFIG_FILES = new Set([
  'package.json', 'pnpm-lock.yaml', 'yarn.lock', 'package-lock.json',
  'composer.json', 'cargo.toml', 'go.mod', 'pyproject.toml', 'requirements.txt',
  'cmakelists.txt', 'makefile', 'dockerfile', 'docker-compose.yml',
  'tsconfig.json', 'phpunit.xml', 'psalm.xml', 'phpstan.neon',
]);

const EXT_LANGUAGE = {
  '.ts': 'TypeScript', '.tsx': 'TypeScript', '.js': 'JavaScript', '.jsx': 'JavaScript',
  '.mjs': 'JavaScript', '.cjs': 'JavaScript', '.php': 'PHP', '.py': 'Python',
  '.go': 'Go', '.rs': 'Rust', '.c': 'C', '.h': 'C/C++ header', '.hpp': 'C++ header',
  '.cc': 'C++', '.cpp': 'C++', '.cxx': 'C++', '.java': 'Java', '.rb': 'Ruby',
  '.cs': 'C#', '.kt': 'Kotlin', '.swift': 'Swift',
};

const SOURCE_EXTS = new Set(Object.keys(EXT_LANGUAGE));

function isTestFile(rel) {
  const b = basename(rel).toLowerCase();
  return (
    /\.(test|spec)\./.test(b) ||
    /(^|\/)(test|tests|__tests__|spec)(\/|$)/.test(rel.toLowerCase())
  );
}

function walk(root) {
  const result = {
    filesTotal: 0,
    directoriesTotal: 0,
    extensions: {},
    topLevelDirectories: [],
    configFiles: [],
    testFiles: [],
    sourceFiles: [],
    ignoredCandidates: [],
  };

  // Top-level entries.
  for (const entry of readdirSync(root)) {
    const abs = join(root, entry);
    let st;
    try {
      st = statSync(abs);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (IGNORE_DIRS.has(entry)) {
        result.ignoredCandidates.push(entry);
      } else {
        result.topLevelDirectories.push(entry);
      }
    }
  }

  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop();
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      continue;
    }
    for (const entry of entries) {
      const abs = join(dir, entry);
      let st;
      try {
        st = statSync(abs);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        if (IGNORE_DIRS.has(entry)) continue;
        result.directoriesTotal++;
        stack.push(abs);
        continue;
      }
      result.filesTotal++;
      const rel = relative(root, abs);
      const ext = extname(entry).toLowerCase();
      if (ext) result.extensions[ext] = (result.extensions[ext] || 0) + 1;
      if (CONFIG_FILES.has(entry.toLowerCase())) result.configFiles.push(rel);
      if (isTestFile(rel)) result.testFiles.push(rel);
      else if (SOURCE_EXTS.has(ext)) result.sourceFiles.push(rel);
    }
  }

  // Likely languages, ordered by source-file count.
  const langCounts = {};
  for (const f of result.sourceFiles) {
    const lang = EXT_LANGUAGE[extname(f).toLowerCase()];
    if (lang) langCounts[lang] = (langCounts[lang] || 0) + 1;
  }
  result.likelyLanguages = Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  result.topLevelDirectories.sort();
  result.configFiles.sort();
  result.ignoredCandidates.sort();
  return result;
}

function main() {
  const rootArg = process.argv[2] || '.';
  const root = resolve(rootArg);
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    process.stderr.write(`Error: not a directory: ${root}\n`);
    process.exit(2);
  }
  const summary = walk(root);
  const output = {
    root: rootArg,
    filesTotal: summary.filesTotal,
    directoriesTotal: summary.directoriesTotal,
    extensions: summary.extensions,
    likelyLanguages: summary.likelyLanguages,
    topLevelDirectories: summary.topLevelDirectories,
    configFiles: summary.configFiles,
    testFiles: summary.testFiles.slice(0, 500),
    sourceFiles: summary.sourceFiles.slice(0, 1000),
    ignoredCandidates: summary.ignoredCandidates,
  };
  process.stdout.write(JSON.stringify(output, null, 2) + '\n');
}

main();
