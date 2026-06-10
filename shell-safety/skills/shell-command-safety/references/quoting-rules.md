# Quoting & Expansion Rules

Reference for bash and zsh quoting and expansion. Use this when the [patterns catalog](./patterns-catalog.md) flags a quoting issue and the recipe in [rewrite-recipes.md](./rewrite-recipes.md) is not enough.

## 1. Quoting characters

### Single quotes `'...'`

- No expansion of any kind. Every character is literal.
- Cannot contain a single quote — not even with a backslash.
- To include a single quote, end the single-quoted string, add an escaped quote, restart: `'it'\''s'`.

### Double quotes `"..."`

- Preserve literal value of everything **except** `$`, `` ` ``, `\`, and (when history expansion is on) `!`.
- Variable expansion, command substitution, and arithmetic expansion still happen.
- A backslash inside double quotes only escapes `$`, `` ` ``, `"`, `\`, and newline.

### Backslash `\`

- Outside quotes, escapes the next character (loses any special meaning).
- Inside double quotes, only meaningful before `$`, `` ` ``, `"`, `\`, newline.
- Inside single quotes, literal.

### ANSI-C quoting `$'...'` (bash/zsh)

- Like single quotes, but supports C-style escapes: `\n`, `\t`, `\xHH`, `\uHHHH`.
- Use for embedding literal newlines/tabs that single quotes cannot contain.

```sh
printf '%s\n' $'first\nsecond'
```

## 2. Expansions and their order

Bash performs expansions in this order on each token:

1. Brace expansion: `{a,b}c` → `ac bc`. Not subject to quoting; expands unquoted only.
2. Tilde expansion: `~` → `$HOME`, `~user` → user's home. Only at the start of a word.
3. Parameter expansion: `$var`, `${var:-default}`, `${var/old/new}`.
4. Command substitution: `$(cmd)` or `` `cmd` ``.
5. Arithmetic expansion: `$((expr))`.
6. Word splitting: splits unquoted expansions on `IFS`.
7. Pathname expansion (globbing): `*`, `?`, `[abc]`.
8. Quote removal: removes the quote characters that survived.

Key point: **word splitting** and **pathname expansion** happen on **unquoted** expansions. Quoting suppresses both.

## 3. `$@` vs `$*` vs `"$@"` vs `"$*"`

| Form | Behavior |
|------|----------|
| `$*` | All positional arguments joined by the first character of `IFS` (default: space). Word-splits and globbed. |
| `$@` | All positional arguments as separate words. Word-splits and globbed. |
| `"$*"` | All arguments as a single string, joined by `IFS[0]`. |
| `"$@"` | Each argument as a separate quoted word. Preserves spaces in arguments. **Always prefer this.** |

```sh
fn() { for a in "$@"; do echo "[$a]"; done; }
fn 'a b' c
# Output:
# [a b]
# [c]
```

## 4. Variable defaults and assertions

| Form | Behavior |
|------|----------|
| `${var:-default}` | Use `default` if `var` is unset or empty. |
| `${var-default}` | Use `default` if `var` is unset (empty is OK). |
| `${var:=default}` | Assign `default` if unset/empty, then expand. |
| `${var:?error}` | Error and exit if unset/empty. Useful as an assertion. |
| `${var:+alt}` | Use `alt` if `var` is set and non-empty. |

```sh
: "${BUILD_DIR:?must be set}"
rm -rf -- "$BUILD_DIR"
```

## 5. Argument separator `--`

Most utilities accept `--` to mark the end of options. Everything after is treated as a positional argument, even if it begins with `-`.

```sh
rm -- -file        # delete a file literally named "-file"
grep -- -pattern file
```

## 6. Heredoc variants

| Form | Expansion in body | Indentation handling |
|------|-------------------|----------------------|
| `<<EOF` | Yes (variables, substitutions) | Terminator must be at column 0. |
| `<<'EOF'` | No (literal body) | Terminator must be at column 0. |
| `<<-EOF` | Yes | Strips leading **tabs** (not spaces) from each line and the terminator. |
| `<<-'EOF'` | No | Strips leading tabs. |

```sh
# Literal body, indented for readability
cat <<-'EOF'
	$literal stays as $literal
	`backticks` stay literal
EOF
```

## 7. zsh-specific pitfalls

### Unmatched globs

By default, zsh raises `zsh: no matches found` when a glob has no matches. Quote the glob or use the `(N)` qualifier to make it expand to empty.

```sh
ls *.foo(N)   # expands to empty if no matches
```

### Equals expansion

zsh expands a bare `=word` at the start of a token to the full path of `word` (like `which word`). Avoid bare `==` or `===`:

```sh
echo '==='     # quote
[[ a == b ]]   # safe; inside [[ ]]
```

### Read-only special variables

These cannot be assigned in zsh: `status`, `pipestatus`, `argv`, `path`, `cdpath`, `fpath`, `mailpath`, `manpath`, `module_path`, `prompt`, `psvar`. Use other names (`exit_code`, etc.).

### `setopt`/`unsetopt` shell options

- `nounset` — equivalent to `set -u`.
- `errexit` — equivalent to `set -e`.
- `pipefail` — equivalent to `set -o pipefail`.
- `extendedglob` — adds `^`, `~`, `(...)` glob operators.
- `globdots` — globs match dotfiles.

## 8. Process substitution

`<(cmd)` and `>(cmd)` (bash/zsh, not POSIX) provide a filename that streams from/to the command.

```sh
diff <(sort a.txt) <(sort b.txt)
tee >(grep foo > foo.log) >(grep bar > bar.log)
```

Useful with `git commit -F`:

```sh
git commit -F <(printf 'Subject\n\nBody\n')
```

## 9. Shell-mode safety idioms

```sh
#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'
```

- `set -e` — exit on error.
- `set -u` — error on unset variable.
- `set -o pipefail` — exit if any command in a pipeline fails.
- `IFS=$'\n\t'` — restrict word splitting to newline and tab; safer than the default space-tab-newline.

For finer control, wrap risky blocks:

```sh
{ set +e; risky; rc=$?; set -e; } 
if (( rc != 0 )); then echo "expected failure ($rc)" >&2; fi
```

## 10. Common ambiguous constructs

### `$(cat file)` vs `<file`

If a command accepts input from stdin or a file argument, prefer the file form:

```sh
# Less safe — embeds file content as argv
foo "$(cat msg)"

# Better — file as argument
foo --file msg
# Or stdin
foo < msg
```

### `set -x` and secrets

Trace prints the post-expansion command. If a secret is in scope, the trace leaks it.

```sh
{ set -x
  do_safe_thing
  set +x
}
# Then run the secret-bearing command outside the trace
auth_call --token-file=/tmp/token
```

### `$?` after a pipeline

Without `pipefail`, `$?` is the exit code of the **last** command in the pipeline.

```sh
set -o pipefail
cmd1 | cmd2
echo "$?"   # non-zero if either failed
```

### Brace expansion is not file expansion

`{a,b}c` is brace expansion (always expands to `ac bc`). `*c` is pathname expansion (matches existing files). They are different mechanisms.

### `read` with default `IFS`

```sh
read -r line          # uses IFS; trims surrounding whitespace
IFS= read -r line     # preserves whitespace
while IFS= read -r line; do ...; done < file
```

For NUL-delimited input from `find -print0`:

```sh
while IFS= read -r -d '' file; do ...; done < <(find . -print0)
```

## 11. Reference

- bash manual: <https://www.gnu.org/software/bash/manual/bash.html>
- zsh manual: <https://zsh.sourceforge.io/Doc/Release/zsh_toc.html>
- POSIX shell command language: <https://pubs.opengroup.org/onlinepubs/9699919799/utilities/V3_chap02.html>
