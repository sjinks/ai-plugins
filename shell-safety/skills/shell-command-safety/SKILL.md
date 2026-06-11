---
name: shell-command-safety
description: "Use when: composing or running any shell command in run_in_terminal, terminal, bash, zsh, or sh. Triggers: git commit, git push, git reset, git rebase, git clean, git checkout, rm, mv, cp, chmod, chown, kill, pkill, sudo, dd, mkfs, npm publish, pip install, docker, kubectl, helm, terraform, pulumi, aws, gcloud, az, psql, mysql, mongosh, redis-cli, ssh, scp, rsync, gpg, curl, wget, eval, find -delete, xargs, tar, unzip, systemctl, shutdown, reboot. Also use when drafting commit messages, handling paths with spaces or special characters, quoting variables, escaping arguments, using pipes, redirects, heredocs, command substitution, glob expansion, multi-line strings, the -m or -F flag, variable expansion, force-pushing, hard-resetting, or rewriting history."
argument-hint: "Paste the command you are about to run; the skill validates it."
user-invocable: true
---

# Shell Command Safety

## When to Use

Before composing or running any shell command that is not trivially safe. Trivially safe means: `git status`, `git log --oneline`, `ls`, `ls -la`, `pwd`, `whoami`, `cat <single-file-no-special-chars>`, `which <cmd>`, `--version` / `--help` queries.

Everything else needs validation. In particular:

- Any `git commit`, `git push`, `git reset`, `git rebase`, `git clean`, `git checkout`, `git branch -D`, `git tag`.
- Any `rm`, `mv`, `cp`, `chmod`, `chown`, `find -delete`, `dd`, `mkfs`, `truncate`.
- Any `sudo`, `kill -9`, `pkill`, `shutdown`, `reboot`, `systemctl stop/disable`.
- Any pipe (`|`), redirect (`>`, `>>`, `2>&1`), heredoc (`<<EOF`), command substitution (`$(...)`, backticks), glob (`*`, `?`), brace expansion (`{a,b}`).
- Any path with spaces, special characters, or that comes from a variable (`$VAR`, `"$VAR"`).
- Any `ssh`, `scp`, `rsync --delete`, `curl ... | sh`, `wget ... | bash`.
- Any cloud CLI mutation (`aws *-delete`, `aws s3 sync --delete`, `gcloud ... delete`, `az ... delete`).
- Any IaC mutation (`terraform destroy`, `terraform apply -auto-approve`, `pulumi destroy --yes`).
- Any container mass-mutation (`docker system prune`, `docker rm $(docker ps -aq)`, `kubectl delete namespace`).
- Any database mutation (`DROP`, `TRUNCATE`, `DELETE FROM ... ;` without `WHERE`, `FLUSHALL`, `dropDatabase()`).
- Any secret variable in echo, env dump, or command-line flag (`--password=`, `--token=`).

## Procedure

1. **Classify.** Identify which category in the [patterns catalog](./references/patterns-catalog.md) the command falls into.
2. **Match.** Walk the [Danger Checklist](#danger-checklist) below for that category. If any item matches, the command needs rewriting.
3. **Rewrite.** Use the recipe in [rewrite-recipes.md](./references/rewrite-recipes.md) keyed by the pattern ID (e.g. `GC1`, `FS3`).
4. **Resolve.** Mentally expand all `$variables`, `$(substitutions)`, and globs. If you cannot resolve a value, do not run the command.
5. **Stop-and-ask** when the command matches the [Stop-and-Ask Cases](#stop-and-ask-cases) list.
6. **Restate.** Before sending the command, restate the resolved form (with variables expanded and quoting visible) in your reply.

For deep quoting questions, consult [quoting-rules.md](./references/quoting-rules.md).

## Danger Checklist

One-line summaries grouped by category. Pattern IDs reference [patterns-catalog.md](./references/patterns-catalog.md) and [rewrite-recipes.md](./references/rewrite-recipes.md).

### Git commit messages

- `GC1` Multi-line message via `-m "...\n..."` → switch to `git commit -F <file>` or `git commit -F <(printf ...)`.
- `GC2` Repeated `-m` for paragraphs → prefer `-F` for multi-paragraph bodies.
- `GC3` `-m "... $(cmd) ..."` → write the substitution to a file, use `-F`.
- `GC4` `-m "... $VAR ..."` with whitespace-sensitive content → use `-F`.
- `GC5` Backtick substitution in `-m` → use `$(...)` and `-F`.
- `GC6` Backtick or quote character inside `-m` → use heredoc or `-F`.
- `GC7` Apostrophe in single-quoted `-m` → switch to double quotes or `-F`.
- `GC8` Emoji/unicode + non-UTF-8 terminal → use `-F` from a UTF-8 file.

### Git destructive operations

- `GD1` `git reset --hard` → confirm working tree clean; stash first.
- `GD2` `git push --force` / `-f` → use `--force-with-lease`; confirm branch is not `main|master|release/*|production`.
- `GD3` `git branch -D` → confirm unmerged commits are intentional.
- `GD4` `git clean -fdx` → dry-run first: `git clean -ndx`.
- `GD5` `git checkout <sha>` (detached) → if you want a branch, add `-b <name>`.
- `GD6` Rebase on shared/pushed branch → block; require explicit user approval.
- `GD7` `git submodule deinit --force` → confirm no unstaged content.
- `GD8` `git push --delete origin <tag>` → confirm tag not referenced by releases.

### Filesystem destruction

- `FS1` `rm -rf <path>` → path must be explicit, not a glob, not a bare variable.
- `FS2` `rm -rf "$DIR"` → verify `$DIR` is set, non-empty, and not `/` or `~`.
- `FS3` `rm -rf *` or any unbounded glob → refuse; require explicit paths.
- `FS4` `rm -rf /...` or `rm -rf ~/...` → refuse without strong justification.
- `FS5` `find ... -delete` or `-exec rm` → dry-run with `-print` first.
- `FS6` `truncate -s 0 <log>` → confirm file path explicitly.
- `FS7` `dd of=/dev/...` → refuse without explicit user confirmation.
- `FS8` `mkfs.*` → refuse without explicit user confirmation.
- `FS9` `chmod -R 777` → refuse; recommend explicit minimum permission set.
- `FS10` `chown -R` outside project root → refuse without explicit user confirmation.

### Quoting & expansion

- `Q1` Unquoted variable in argument (`rm $file`) → `rm -- "$file"`.
- `Q2` Unquoted variable in path (`cd $dir`) → `cd -- "$dir"`.
- `Q3` Word-splitting `for f in $(ls)` → `for f in *` or `while IFS= read -r f`.
- `Q4` Unquoted glob (`mv *.log /tmp`) → verify expansion; quote if literal.
- `Q5` `$@` vs `"$@"` → always `"$@"` to preserve arguments.
- `Q6` Path with spaces (`cat /tmp/my file`) → quote: `"/tmp/my file"`.
- `Q7` `'$HOME'` (single quotes, no expansion) → `"$HOME"` if expansion wanted.
- `Q8` Mixed quoting → verify intent.
- `Q9` `'a\nb'` (backslash literal in single quotes) → `printf '%s\n%s\n' a b`.
- `Q10` Filename starting with `-` (`rm -file`) → `rm -- -file`.
- `Q11` `!` inside Bash double quotes with history expansion enabled → use single quotes, disable history expansion, or avoid interactive history expansion context.

### Command substitution & pipes

- `CS1` Backticks `` `cmd` `` → `$(cmd)`.
- `CS2` Unquoted nested `$(...)` → quote: `"$(...)"`.
- `CS3` `curl ... | sh` / `wget ... | bash` → download to temp, inspect, then run.
- `CS4` `eval "$var"` → refuse; restructure.
- `CS5` `find ... | xargs rm` (no NUL) → `find ... -print0 | xargs -0 rm`.
- `CS6` Pipelines whose first command must succeed → `set -o pipefail`.

### Heredoc & multi-line

- `HD1` `EOF` indented but `<<EOF` not `<<-EOF` → use `<<-EOF` with tabs.
- `HD2` `cat <<EOF` with `$var` literal → use `cat <<'EOF'` (quoted terminator).
- `HD3` `cat <<EOF > /etc/...` (root-owned) → use `sudo tee`.
- `HD4` `echo -e` → use `printf` for portable escapes.

### Process control

- `PC1` `kill -9 <pid>` → try `kill <pid>` first; `-9` last resort.
- `PC2` `pkill <pattern>` → use `pkill -f <exact>` after dry-run `pgrep -f`.
- `PC3` `cmd &` (background in agent terminal) → use the terminal tool's async mode.
- `PC4` `sleep` to wait for a process → refuse; rely on terminal completion signal.

### Network & supply-chain

- `NS1` `curl ... | bash` / `wget ... | sh` → refuse; download, inspect, run.
- `NS2` `npm install -g <pkg>` → prefer project-local install.
- `NS3` `npm publish` → refuse without explicit user confirmation.
- `NS4` `pip install` without venv → use venv.
- `NS5` `sudo <package-manager>` → confirm intent.
- `NS6` `ssh host '<long pipeline>'` → use `ssh host bash -s < script.sh`.

### Permission escalation

- `PE1` `sudo <anything>` → confirm intent; do not chain into pipes silently.
- `PE2` `sudo -i` / `sudo su` → refuse.
- `PE3` `chmod u+s` (setuid) → refuse.

### Output capture & redirection

- `OR1` `> file` overwriting important file → use `>>` or confirm overwrite.
- `OR2` `cmd 2>&1 > log` (wrong order) → `cmd > log 2>&1`.
- `OR3` `cmd > /dev/null` swallowing only stdout → explicit; add `2>&1` only if intended.
- `OR4` `cmd | sudo > file` → `cmd | sudo tee file`.

### Shell mode safety

- `SM1` Script without `set -e` → add `set -euo pipefail`.
- `SM2` `cd && cmd` in script → `set -e` or `cd ... || exit 1`.
- `SM3` `[[ ]]` in `/bin/sh` → use `[ ]` for POSIX.
- `SM4` `status` variable in zsh → use `exit_code`.
- `SM5` Bare `==` in zsh → quote `'=='`.
- `SM6` Mutating `IFS` without restore → subshell or save/restore.
- `SM7` `set -x` left on with secrets in scope → scope tightly.

### SSH & remote

- `RX1` `ssh host '<long pipeline>'` → `ssh host bash -s < script.sh`.
- `RX2` `ssh -o StrictHostKeyChecking=no` → refuse unless ephemeral CI host.
- `RX3` `ssh-keygen -R <host>` → confirm intent.
- `RX4` `scp host:'/path/*.log'` (remote glob) → quote glob explicitly.
- `RX5` `rsync --delete` → dry-run `-n` first.
- `RX6` `ssh -A` to untrusted host → refuse.
- `RX7` `sshpass` in pipeline → refuse; use key auth.

### GPG & signing

- `GP1` `gpg --delete-secret-keys` → refuse without explicit user confirmation.
- `GP2` `gpg --export-secret-keys` to stdout → redirect to 0600 file.
- `GP3` `gpg --batch --yes` with destructive op → confirm intent.
- `GP4` `git commit -S --no-verify` / `git tag -s --no-verify` → refuse; address the hook.
- `GP5` `gpg --import` from untrusted source → verify first.
- `GP6` `--passphrase` on command line → use `--pinentry-mode loopback` with file/stdin.

### Cloud CLIs (AWS / gcloud / az)

- `CL1` `aws s3 rm --recursive` → require `--dryrun` first and confirmation.
- `CL2` `aws s3 sync --delete` → run `--dryrun` first.
- `CL3` `aws iam delete-*` → refuse without explicit user confirmation.
- `CL4` `aws ec2 terminate-instances` → confirm instance IDs explicitly.
- `CL5` `aws rds delete-db-instance` → require final snapshot decision.
- `CL6` `gcloud projects delete` → refuse without explicit user confirmation.
- `CL7` `gcloud compute instances delete` → confirm names explicitly.
- `CL8` `az group delete` → refuse without explicit user confirmation.
- `CL9` Default `--profile`/`--region`/context unset → always specify explicitly.
- `CL10` Echo of secret env var (`echo $AWS_SECRET_ACCESS_KEY`) → refuse.

### Infrastructure as Code

- `IC1` `terraform destroy` → refuse without explicit user confirmation and workspace.
- `IC2` `terraform apply -auto-approve` → require plan review in same session.
- `IC3` `terraform apply` without prior `plan` → run `plan` first.
- `IC4` `terraform state rm` / `state mv` → confirm intent; document.
- `IC5` `terraform workspace delete` → refuse without explicit user confirmation.
- `IC6` `pulumi destroy --yes` → refuse without explicit user confirmation.
- `IC7` `pulumi stack rm --force` → refuse without explicit user confirmation.
- `IC8` Backend reconfiguration → verify state lock.

### Containers & orchestration

- `OK1` `docker system prune -af --volumes` → refuse without explicit user confirmation.
- `OK2` `docker rm -f $(docker ps -aq)` → confirm intent; show resolved IDs.
- `OK3` `docker run --privileged` / `--cap-add=ALL` → refuse without explicit need.
- `OK4` `docker run -v /:/host` → refuse.
- `OK5` `kubectl delete namespace <ns>` → confirm namespace and show object counts.
- `OK6` `kubectl apply -f <url>` → download and inspect first.
- `OK7` `kubectl drain` → show plan; decide on `--ignore-daemonsets`.
- `OK8` `kubectl delete pvc` → refuse without explicit user confirmation.
- `OK9` Default `kubectl --context` unset → always specify explicitly.
- `OK10` `helm uninstall <release>` → confirm release and namespace.
- `OK11` `helm install` without `--atomic` → use `--atomic --timeout`.
- `OK12` `kubectl exec -it ... -- sh` for write ops → suggest manifest edit.

### Database CLIs

- `DB1` `DROP DATABASE`, `DROP TABLE` → refuse without explicit user confirmation.
- `DB2` `TRUNCATE` / `DELETE FROM ...;` without `WHERE` → refuse without explicit user confirmation.
- `DB3` `UPDATE ...;` without `WHERE` → refuse without explicit user confirmation.
- `DB4` `psql` connection string with embedded password → use `~/.pgpass` or env from file.
- `DB5` `mysql -p<pass>` → use `MYSQL_PWD` env from file or `--login-path`.
- `DB6` `redis-cli FLUSHALL` / `FLUSHDB` → refuse without explicit user confirmation.
- `DB7` `redis-cli CONFIG SET` → confirm intent.
- `DB8` `mongosh --eval 'db.dropDatabase()'` → refuse without explicit user confirmation.
- `DB9` Connection defaulting to prod → verify target host explicitly.
- `DB10` `pg_restore --clean` to wrong target → refuse without explicit user confirmation.

### Systemd & service control

- `SS1` `systemctl stop <critical>` (sshd/network) → confirm; warn about lockout.
- `SS2` `systemctl disable --now <critical>` → confirm intent.
- `SS3` Unit file edit without `daemon-reload` → reminder.
- `SS4` `shutdown` / `reboot` / `halt` / `poweroff` → refuse without explicit user confirmation.
- `SS5` `journalctl --vacuum-size=0` → confirm intent.

### Secret & environment hygiene

- `SE1` `echo $SECRET` / `$TOKEN` / `$KEY` / `$PASSWORD` → refuse to echo.
- `SE2` `env` / `printenv` piped to file/log → refuse without explicit user confirmation.
- `SE3` `--password=...` / `--token=...` on command line → use file/stdin.
- `SE4` `curl -H "Authorization: Bearer $TOKEN"` in interactive shell → use config file.
- `SE5` Writing secret into a tracked file → verify gitignore.
- `SE6` `set -x` with secret in scope → disable around block.
- `SE7` Result of secret-search echoed → pipe to 0600 file.
- `SE8` `!` history expansion in double quotes → `set +H` or single quotes.

### Archives

- `AR1` `tar -xf untrusted.tar` → use `--no-overwrite-dir`, verify `tar -tf` first.
- `AR2` `tar -xf` with absolute paths or `../` entries → verify member list first.
- `AR3` `unzip untrusted.zip` to existing dir → `unzip -n` or fresh temp dir.
- `AR4` `tar` over network without checksum → verify checksum.
- `AR5` `rm -rf <extract-dir>` after partial extract → inspect first.

### Encoding & locale

- `EN1` Shell script with CRLF → `dos2unix`.
- `EN2` UTF-8 BOM in shell script → strip BOM.
- `EN3` `sort` / `tr` / `grep` on bytes without `LC_ALL=C` → set `LC_ALL=C`.
- `EN4` `grep -P` portability → use `grep -E` or `rg`.
- `EN5` `date` with locale leakage → set `LC_ALL=C` or use `date -u +'%Y-%m-%dT%H:%M:%SZ'`.

## Stop-and-Ask Cases

Refuse without explicit user confirmation in the same turn. Do not execute and do not propose a wrapper that bypasses the check; ask the user.

- `rm -rf /`, `rm -rf ~`, `rm -rf $VAR` where `$VAR` is empty or unset.
- `git push --force` (or `-f`, without `--force-with-lease`) on any branch matching `main|master|release/*|production|prod`.
- `git reset --hard` when the working tree has staged or unstaged changes.
- `curl ... | sh`, `wget ... | bash`, or any pipe from a network source to an interpreter.
- `eval` on any variable.
- `chmod -R 777`, `chmod u+s`, `chown -R` outside the project root.
- `npm publish`, `pip install` outside a venv, any `sudo <package-manager>`.
- `dd of=/dev/...`, `mkfs.*`, partition tools (`parted`, `fdisk`, `cfdisk`).
- `terraform destroy`, `terraform apply -auto-approve`, `pulumi destroy --yes`, `terraform workspace delete`, `pulumi stack rm --force`.
- `docker system prune -af --volumes`, `docker run --privileged`, `docker run -v /:/host`.
- `kubectl delete namespace`, `kubectl delete pvc`, `kubectl apply -f <url>` from an untrusted URL.
- `DROP DATABASE`, `DROP TABLE`, `TRUNCATE`, unguarded `DELETE FROM` / `UPDATE`, `FLUSHALL`, `FLUSHDB`, `dropDatabase()`.
- `shutdown`, `reboot`, `halt`, `poweroff`, `systemctl stop sshd`, `systemctl disable --now sshd`.
- `aws iam delete-*`, `aws s3 rm --recursive` without prior `--dryrun`, `gcloud projects delete`, `az group delete`.
- `gpg --delete-secret-keys`, `gpg --export-secret-keys` to stdout, `--no-verify` on signed commits/tags.
- `echo`/`env`/`printenv` of secret-named variables to terminal or to a log.
- `ssh -A` to a host you do not control.

## Verification Before Execution

Before sending the command:

1. Restate the command in your reply with all `$VAR` and `$(cmd)` expansions visible.
2. If a variable's value is unknown, do not run; ask or inspect first.
3. If the resolved form matches a Stop-and-Ask case, stop.
4. For destructive operations, name the exact target (path, branch, instance, table, namespace) in your restatement.

## References

- [Patterns catalog](./references/patterns-catalog.md) — full table for every pattern ID.
- [Rewrite recipes](./references/rewrite-recipes.md) — copy-paste safe rewrites keyed by ID.
- [Quoting rules](./references/quoting-rules.md) — bash/zsh quoting and expansion deep dive.
- [Commit message template](./assets/commit-message-template.txt) — for `git commit -F` workflows.
