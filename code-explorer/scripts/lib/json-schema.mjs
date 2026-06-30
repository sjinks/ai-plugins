// Minimal dependency-free JSON Schema validator.
//
// Supports the subset of JSON Schema Draft 2020-12 used by the Code Explorer
// artifact schemas: type, enum, const, required, properties,
// additionalProperties (boolean), items, $ref (local "#/..." and
// "common.schema.json#/..." cross-file), pattern, minLength, minItems,
// minimum, and union types (e.g. ["string", "null"]).
//
// It is intentionally small. It does not implement the full specification
// (no allOf/anyOf/oneOf/if-then-else, no format assertions). The artifact
// schemas are written to stay inside this subset.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

/**
 * Load a schema file and all sibling schemas it may $ref by relative filename.
 * Returns { schema, registry } where registry maps filename -> parsed schema.
 */
export function loadSchema(schemaPath) {
  const registry = new Map();
  const dir = dirname(schemaPath);

  const load = (absPath) => {
    const key = absPath;
    if (registry.has(key)) return registry.get(key);
    const parsed = JSON.parse(readFileSync(absPath, 'utf8'));
    registry.set(key, parsed);
    return parsed;
  };

  const root = load(schemaPath);
  // Eagerly load any cross-file schema referenced via "<file>.json#/...".
  const seen = new Set();
  const scan = (node) => {
    if (node === null || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const item of node) scan(item);
      return;
    }
    for (const [k, v] of Object.entries(node)) {
      if (k === '$ref' && typeof v === 'string' && !v.startsWith('#')) {
        const file = v.split('#')[0];
        const abs = resolve(dir, file);
        if (!seen.has(abs)) {
          seen.add(abs);
          scan(load(abs));
        }
      } else {
        scan(v);
      }
    }
  };
  scan(root);

  return { schema: root, registry, dir, rootPath: schemaPath };
}

function resolveRef(ref, ctx) {
  // ref forms: "#/$defs/x" (within current file) or "file.json#/$defs/x".
  let filePart = '';
  let pointer = ref;
  if (!ref.startsWith('#')) {
    const [f, p] = ref.split('#');
    filePart = f;
    pointer = '#' + (p || '');
  }
  const targetSchema = filePart
    ? ctx.registry.get(resolve(ctx.dir, filePart))
    : ctx.currentSchema;
  if (!targetSchema) return undefined;
  const parts = pointer.replace(/^#\//, '').split('/').filter(Boolean);
  let node = targetSchema;
  for (const part of parts) {
    const key = part.replace(/~1/g, '/').replace(/~0/g, '~');
    if (node === undefined || node === null) return undefined;
    node = node[key];
  }
  return { node, schema: targetSchema };
}

function typeOf(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (Number.isInteger(value)) return 'integer';
  return typeof value; // string, number, boolean, object
}

function matchesType(value, type) {
  const actual = typeOf(value);
  if (type === 'number') return actual === 'number' || actual === 'integer';
  return actual === type;
}

function validateNode(value, schema, ctx, path, errors) {
  if (schema === true || schema === undefined) return;
  if (schema === false) {
    errors.push(`${path}: schema disallows any value`);
    return;
  }

  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref, ctx);
    if (!resolved) {
      errors.push(`${path}: cannot resolve $ref ${schema.$ref}`);
      return;
    }
    const prevSchema = ctx.currentSchema;
    ctx.currentSchema = resolved.schema;
    validateNode(value, resolved.node, ctx, path, errors);
    ctx.currentSchema = prevSchema;
    return;
  }

  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => matchesType(value, t))) {
      errors.push(`${path}: expected type ${types.join('|')}, got ${typeOf(value)}`);
      return;
    }
  }

  if (schema.enum !== undefined) {
    const ok = schema.enum.some((e) => JSON.stringify(e) === JSON.stringify(value));
    if (!ok) {
      errors.push(`${path}: value ${JSON.stringify(value)} not in enum [${schema.enum.join(', ')}]`);
    }
  }

  if (schema.const !== undefined && JSON.stringify(schema.const) !== JSON.stringify(value)) {
    errors.push(`${path}: value must equal ${JSON.stringify(schema.const)}`);
  }

  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${path}: string shorter than minLength ${schema.minLength}`);
    }
    if (schema.pattern !== undefined) {
      let re;
      try {
        re = new RegExp(schema.pattern);
      } catch {
        re = null;
      }
      if (re && !re.test(value)) {
        errors.push(`${path}: string does not match pattern ${schema.pattern}`);
      }
    }
  }

  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`${path}: number below minimum ${schema.minimum}`);
    }
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${path}: array shorter than minItems ${schema.minItems}`);
    }
    if (schema.items !== undefined) {
      value.forEach((item, i) => validateNode(item, schema.items, ctx, `${path}[${i}]`, errors));
    }
  }

  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    if (Array.isArray(schema.required)) {
      for (const key of schema.required) {
        if (!hasOwn(value, key)) {
          errors.push(`${path}: missing required property "${key}"`);
        }
      }
    }
    const props = schema.properties || {};
    for (const [key, sub] of Object.entries(props)) {
      if (hasOwn(value, key)) {
        validateNode(value[key], sub, ctx, `${path}.${key}`, errors);
      }
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!hasOwn(props, key)) {
          errors.push(`${path}: additional property "${key}" is not allowed`);
        }
      }
    }
  }
}

/**
 * Validate a value against a loaded schema bundle.
 * Returns an array of error strings (empty means valid).
 */
export function validate(value, loaded) {
  const ctx = {
    registry: loaded.registry,
    dir: loaded.dir,
    currentSchema: loaded.schema,
  };
  const errors = [];
  validateNode(value, loaded.schema, ctx, '$', errors);
  return errors;
}
