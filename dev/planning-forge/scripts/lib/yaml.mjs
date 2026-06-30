// Minimal, dependency-free YAML loader for the Planning Forge metamodel subset.
//
// Supported (intentionally small):
//   - block mappings: `key: value` and `key:` followed by an indented block
//   - block sequences: `- scalar`, `- { flow }`, `- [ flow ]`, and
//     `- key: value` mapping items with aligned continuation keys
//   - scalars: double-quoted (JSON string semantics), single-quoted
//     (`''` escapes a quote), and plain scalars (`null`/`~`, `true`/`false`,
//     integers, floats, otherwise a plain string)
//   - flow collections (`[...]`, `{...}`) when they are JSON-parseable
//   - full-line comments (first non-space char `#`) and blank lines
//
// Deliberately unsupported (rejected with a clear error rather than mis-parsed):
//   - tabs in indentation
//   - anchors/aliases, tags, multiple documents, block scalars (`|`, `>`)
//   - trailing inline comments (a `#` after a value is treated as data, since
//     refs/URLs legitimately contain `#`)
//   - duplicate mapping keys (rejected, since last-wins would silently change
//     the semantic model on an authoring typo)
//
// Authoring rules that match standard YAML:
//   - Block sequence items must be indented deeper than their parent key.
//   - A plain scalar containing `": "` is parsed as a mapping (YAML semantics);
//     quote a list/value string that legitimately contains a colon-space.
//   - Any value that must stay a string (for example `schema_version`) should be
//     quoted, exactly as JSON requires.

function tokenize(text) {
  const tokens = [];
  const rawLines = text.split('\n');
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].replace(/\r$/, '');
    const indentMatch = /^[ \t]*/.exec(line)[0];
    if (indentMatch.includes('\t')) {
      throw new Error(`YAML line ${i + 1}: tabs are not allowed in indentation`);
    }
    if (/^\s*$/.test(line)) continue;
    if (/^\s*#/.test(line)) continue;
    const indent = indentMatch.length;
    tokens.push({ indent, content: line.slice(indent), line: i + 1 });
  }
  return tokens;
}

function readQuoted(content, line) {
  const quote = content[0];
  if (quote === '"') {
    // Use JSON semantics; the whole content must be a single JSON string.
    try {
      const value = JSON.parse(content);
      if (typeof value !== 'string') {
        throw new Error('not a string');
      }
      return value;
    } catch {
      throw new Error(`YAML line ${line}: invalid double-quoted scalar ${content}`);
    }
  }
  // Single-quoted: must start and end with ', '' escapes a quote.
  if (content[content.length - 1] !== "'" || content.length < 2) {
    throw new Error(`YAML line ${line}: unterminated single-quoted scalar ${content}`);
  }
  const inner = content.slice(1, -1);
  let out = '';
  for (let i = 0; i < inner.length; i++) {
    if (inner[i] === "'") {
      if (inner[i + 1] === "'") {
        out += "'";
        i++;
      } else {
        throw new Error(`YAML line ${line}: invalid single-quoted scalar ${content}`);
      }
    } else {
      out += inner[i];
    }
  }
  return out;
}

function checkFlowDuplicateKeys(content, line) {
  let index = 0;

  function fail(message) {
    throw new Error(`YAML line ${line}: ${message}`);
  }

  function skipWhitespace() {
    while (/\s/.test(content[index] || '')) index++;
  }

  function readJsonString() {
    const start = index;
    index++;
    while (index < content.length) {
      if (content[index] === '\\') {
        index += 2;
        continue;
      }
      if (content[index] === '"') {
        index++;
        return JSON.parse(content.slice(start, index));
      }
      index++;
    }
    fail('unterminated string in flow value');
  }

  function parsePrimitive() {
    const start = index;
    while (index < content.length && !/[\s,}\]]/.test(content[index])) index++;
    if (start === index) fail(`unsupported flow value ${content}`);
  }

  function parseValue() {
    skipWhitespace();
    if (content[index] === '{') return parseObject();
    if (content[index] === '[') return parseArray();
    if (content[index] === '"') return readJsonString();
    return parsePrimitive();
  }

  function parseObject() {
    const keys = new Set();
    index++;
    skipWhitespace();
    if (content[index] === '}') {
      index++;
      return;
    }
    while (index < content.length) {
      skipWhitespace();
      if (content[index] !== '"') fail(`unsupported flow value ${content} (object keys must be quoted)`);
      const key = readJsonString();
      if (keys.has(key)) fail(`duplicate key '${key}' in flow mapping`);
      keys.add(key);
      skipWhitespace();
      if (content[index] !== ':') fail(`unsupported flow value ${content} (expected ':' after key)`);
      index++;
      parseValue();
      skipWhitespace();
      if (content[index] === ',') {
        index++;
        continue;
      }
      if (content[index] === '}') {
        index++;
        return;
      }
      fail(`unsupported flow value ${content}`);
    }
    fail('unterminated flow mapping');
  }

  function parseArray() {
    index++;
    skipWhitespace();
    if (content[index] === ']') {
      index++;
      return;
    }
    while (index < content.length) {
      parseValue();
      skipWhitespace();
      if (content[index] === ',') {
        index++;
        continue;
      }
      if (content[index] === ']') {
        index++;
        return;
      }
      fail(`unsupported flow value ${content}`);
    }
    fail('unterminated flow sequence');
  }

  parseValue();
  skipWhitespace();
  if (index !== content.length) fail(`unsupported flow value ${content}`);
}

function parseFlow(content, line) {
  try {
    checkFlowDuplicateKeys(content, line);
    return JSON.parse(content);
  } catch (err) {
    if (err.message.startsWith(`YAML line ${line}:`)) throw err;
    throw new Error(`YAML line ${line}: unsupported flow value ${content} (use JSON-compatible flow or block style)`);
  }
}

function parseScalar(content, line) {
  if (content === '' || content === '~' || content === 'null') return null;
  if (content === 'true') return true;
  if (content === 'false') return false;
  if (content[0] === '"' || content[0] === "'") return readQuoted(content, line);
  if (content[0] === '|' || content[0] === '>') {
    throw new Error(`YAML line ${line}: block scalars are not supported (quote the value to keep it literal)`);
  }
  // Anchors (&x), aliases (*x), and tags (!x) are unsupported; reject them
  // rather than mis-parsing them as plain strings. A literal value that must
  // start with one of these characters can be quoted.
  if (content[0] === '&' || content[0] === '*' || content[0] === '!') {
    throw new Error(`YAML line ${line}: anchors, aliases, and tags are not supported (quote the value to keep it literal)`);
  }
  if (content[0] === '[' || content[0] === '{') return parseFlow(content, line);
  if (/^-?[0-9]+$/.test(content)) return Number.parseInt(content, 10);
  if (/^-?[0-9]+\.[0-9]+$/.test(content)) return Number.parseFloat(content);
  return content;
}

function splitKey(token) {
  const c = token.content;
  if (c[0] === '"' || c[0] === "'") {
    throw new Error(`YAML line ${token.line}: quoted mapping keys are not supported`);
  }
  for (let k = 0; k < c.length; k++) {
    if (c[k] === ':' && (k + 1 === c.length || c[k + 1] === ' ')) {
      return { key: c.slice(0, k).trim(), rest: c.slice(k + 1).trim() };
    }
  }
  throw new Error(`YAML line ${token.line}: expected 'key: value' mapping`);
}

function looksLikeMapping(rest) {
  if (rest[0] === '"' || rest[0] === "'" || rest[0] === '[' || rest[0] === '{') return false;
  for (let k = 0; k < rest.length; k++) {
    if (rest[k] === ':' && (k + 1 === rest.length || rest[k + 1] === ' ')) return true;
  }
  return false;
}

function parseBlock(tokens, start, indent) {
  const first = tokens[start];
  if (first.content === '-' || first.content.startsWith('- ')) {
    return parseSequence(tokens, start, indent);
  }
  return parseMapping(tokens, start, indent);
}

function parseMapping(tokens, start, indent) {
  const map = Object.create(null);
  let i = start;
  while (i < tokens.length) {
    const tok = tokens[i];
    if (tok.indent < indent) break;
    if (tok.indent > indent) throw new Error(`YAML line ${tok.line}: unexpected indentation in mapping`);
    if (tok.content === '-' || tok.content.startsWith('- ')) {
      throw new Error(`YAML line ${tok.line}: unexpected sequence item in mapping`);
    }
    const { key, rest } = splitKey(tok);
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      throw new Error(`YAML line ${tok.line}: duplicate key '${key}'`);
    }
    if (rest === '') {
      const childStart = i + 1;
      if (childStart < tokens.length && tokens[childStart].indent > indent) {
        const [value, next] = parseBlock(tokens, childStart, tokens[childStart].indent);
        map[key] = value;
        i = next;
      } else {
        map[key] = null;
        i = childStart;
      }
    } else {
      map[key] = parseScalar(rest, tok.line);
      i += 1;
    }
  }
  return [map, i];
}

function parseSequence(tokens, start, indent) {
  const arr = [];
  let i = start;
  while (i < tokens.length) {
    const tok = tokens[i];
    if (tok.indent < indent) break;
    if (tok.indent > indent) throw new Error(`YAML line ${tok.line}: unexpected indentation in sequence`);
    if (!(tok.content === '-' || tok.content.startsWith('- '))) break;
    const rest = tok.content === '-' ? '' : tok.content.slice(2);
    if (rest === '') {
      const childStart = i + 1;
      if (childStart < tokens.length && tokens[childStart].indent > indent) {
        const [value, next] = parseBlock(tokens, childStart, tokens[childStart].indent);
        arr.push(value);
        i = next;
      } else {
        arr.push(null);
        i = childStart;
      }
    } else if (looksLikeMapping(rest)) {
      const itemIndent = indent + 2;
      const itemTokens = [{ indent: itemIndent, content: rest, line: tok.line }];
      let j = i + 1;
      while (j < tokens.length && tokens[j].indent >= itemIndent) {
        itemTokens.push(tokens[j]);
        j++;
      }
      const [value, next] = parseBlock(itemTokens, 0, itemIndent);
      if (next !== itemTokens.length) {
        throw new Error(`YAML line ${itemTokens[next].line}: unexpected indentation in sequence item`);
      }
      arr.push(value);
      i = j;
    } else {
      arr.push(parseScalar(rest, tok.line));
      i += 1;
    }
  }
  return [arr, i];
}

/**
 * Parse a YAML document (metamodel subset) into a JavaScript value.
 * Throws on unsupported constructs rather than guessing.
 */
export function parseYaml(text) {
  const tokens = tokenize(text);
  if (tokens.length === 0) return null;
  const baseIndent = tokens[0].indent;
  const [value, next] = parseBlock(tokens, 0, baseIndent);
  if (next !== tokens.length) {
    throw new Error(`YAML line ${tokens[next].line}: unexpected indentation`);
  }
  return value;
}
