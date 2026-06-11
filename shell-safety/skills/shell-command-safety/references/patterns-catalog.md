# Patterns Catalog

Full catalog of dangerous shell command patterns. Each entry has an ID, an example, a brief explanation of why it fails, and a cross-reference to the rewrite in [rewrite-recipes.md](./rewrite-recipes.md). For quoting fundamentals, see [quoting-rules.md](./quoting-rules.md).

The catalog is documentation-only in v1 — there is no runtime enforcement. Use it as the lookup table when the SKILL.md checklist flags a pattern.

## 1. Git commit message hazards

### GC1 — Multi-line message via `-m "...\n..."`

Example: `git commit -m "Subject\n\nBody"`

Why it fails: The shell does not interpret `\n` inside a double-quoted argument to `-m`. The literal characters `\n` end up in the commit message instead of newlines.

Rewrite: see GC1 in [rewrite-recipes.md](./rewrite-recipes.md#gc1).

### GC2 — Repeated `-m` for paragraphs

Example: `git commit -m "Subject" -m "Body line 1" -m "Body line 2"`

Why it fails: Works, but each `-m` becomes a paragraph; harder to author bodies with bullet lists and code blocks. Authors often forget the blank line between subject and body works by accident.

Rewrite: see GC2.

### GC3 — Command substitution inside `-m`

Example: `git commit -m "Fix bug as described in $(cat issue.txt)"`

Why it fails: Quoting, embedded newlines, shell special characters in the substituted text all leak into the commit-message argument and may produce malformed messages or shell parse errors.

Rewrite: see GC3.

### GC4 — Variable expansion with unintended splitting

Example: `git commit -m "Fix $TITLE"`

Why it fails: If `$TITLE` contains newlines, they are preserved (different from `\n`), but if it contains backticks, unbalanced quotes, or shell metacharacters, the message becomes ambiguous.

Rewrite: see GC4.

### GC5 — Backtick substitution in `-m`

Example: `` git commit -m "ship at $(date)" ``

Why it fails: Backticks are deprecated for substitution; nested quoting collides; harder to escape.

Rewrite: see GC5.

### GC6 — Backtick or quote character inside `-m`

Example: ``git commit -m "use `foo()` here"``

Why it fails: The backtick triggers command substitution; the substitution of `foo()` fails because it is not a command.

Rewrite: see GC6.

### GC7 — Apostrophe in single-quoted `-m`

Example: `git commit -m 'it\'s broken'`

Why it fails: Single quotes do not support backslash escapes; the message terminates early and the shell parses the rest as a separate token.

Rewrite: see GC7.

### GC8 — Emoji or unicode in non-UTF-8 terminal

Example: `git commit -m "🎉 ship"`

Why it fails: Most modern terminals handle this, but legacy terminals or non-UTF-8 locales can mangle multi-byte characters.

Rewrite: see GC8.

## 2. Git destructive operations

### GD1 — Hard reset

Example: `git reset --hard HEAD~3`

Why it fails: Discards staged and unstaged changes silently; lost work is unrecoverable unless found in reflog.

Rewrite: see GD1.

### GD2 — Force push

Example: `git push --force origin feature-branch` or `git push -f`

Why it fails: Overwrites remote history; teammates who pulled the old history get conflicts; destroys work if the branch is shared.

Rewrite: see GD2.

### GD3 — Branch deletion

Example: `git branch -D feature-x`

Why it fails: `-D` deletes regardless of merge state; commits not merged elsewhere become unreachable.

Rewrite: see GD3.

### GD4 — Clean untracked

Example: `git clean -fdx`

Why it fails: Removes all untracked and ignored files, including local-only configuration, build artifacts, and notes.

Rewrite: see GD4.

### GD5 — Detached HEAD checkout

Example: `git checkout 4a8c2f1`

Why it fails: Commits made on detached HEAD are lost when you switch back; users often intend to create a branch.

Rewrite: see GD5.

### GD6 — Rewrite pushed history

Example: `git rebase -i origin/main` then `git push --force`

Why it fails: Pushed commits are part of the shared history; rewriting them silently breaks every clone.

Rewrite: see GD6.

### GD7 — Submodule deinit force

Example: `git submodule deinit --force <module>`

Why it fails: Discards local changes inside the submodule working tree.

Rewrite: see GD7.

### GD8 — Tag deletion on remote

Example: `git push --delete origin v1.2.3`

Why it fails: Releases, package registries, and CI pipelines may reference the tag; deleting can break consumers.

Rewrite: see GD8.

## 3. Filesystem destruction

### FS1 — Recursive force delete

Example: `rm -rf ./build`

Why it fails: Even with an explicit path, missing space (`rm -rf ./ build`) or a typo can wipe the parent.

Rewrite: see FS1.

### FS2 — Delete with variable

Example: `rm -rf "$BUILD_DIR"`

Why it fails: If `$BUILD_DIR` is unset (e.g., due to a typo or sourcing failure), this expands to `rm -rf ""` (no-op) or `rm -rf /` if a default was set.

Rewrite: see FS2.

### FS3 — Unbounded glob delete

Example: `rm -rf *`

Why it fails: Expands to every file in the current directory, including dotfiles if `dotglob` is on (bash) or in zsh with `setopt globdots`. Cannot recover.

Rewrite: see FS3.

### FS4 — Delete from `/` or `~`

Example: `rm -rf /something`, `rm -rf ~/Downloads/old`

Why it fails: A trailing-slash typo (`rm -rf / something`) wipes the root; `~/Downloads/*` may be misexpanded.

Rewrite: see FS4.

### FS5 — `find ... -delete` or `-exec rm`

Example: `find . -name '*.log' -delete`

Why it fails: A typo in the pattern (`-name '*'`) deletes everything matched.

Rewrite: see FS5.

### FS6 — `truncate -s 0` on logs

Example: `truncate -s 0 /var/log/app.log`

Why it fails: Generally safe with explicit path, but `truncate -s 0 *.log` deletes content of every matching file.

Rewrite: see FS6.

### FS7 — `dd` to a device

Example: `dd if=image.iso of=/dev/sdb`

Why it fails: Overwrites the device; a typo (`of=/dev/sda`) destroys the system disk.

Rewrite: see FS7.

### FS8 — `mkfs.*`

Example: `mkfs.ext4 /dev/sdb1`

Why it fails: Wipes a partition; wrong partition wipes user data.

Rewrite: see FS8.

### FS9 — `chmod -R 777`

Example: `chmod -R 777 /var/www`

Why it fails: World-writable + executable on everything is a security disaster; almost never the right intent.

Rewrite: see FS9.

### FS10 — `chown -R` outside project root

Example: `sudo chown -R user:user /var`

Why it fails: Changing ownership of system directories breaks the OS.

Rewrite: see FS10.

## 4. Quoting & expansion

### Q1 — Unquoted variable in argument

Example: `rm $file`

Why it fails: If `$file` contains spaces, it splits into multiple arguments. Globbing characters expand.

Rewrite: see Q1.

### Q2 — Unquoted variable in path

Example: `cd $dir`

Why it fails: Same as Q1.

Rewrite: see Q2.

### Q3 — Word splitting in `for` loop

Example: `for f in $(ls)`

Why it fails: `ls` output splits on whitespace; filenames with spaces become multiple iterations.

Rewrite: see Q3.

### Q4 — Unquoted glob expansion

Example: `mv *.log /tmp`

Why it fails: If no files match, bash passes the literal `*.log`; zsh by default raises `no matches found`. If a file is literally named `*.log` (rare), it is treated as a glob.

Rewrite: see Q4.

### Q5 — `$@` vs `"$@"`

Example: `cmd $@`

Why it fails: Unquoted `$@` performs word splitting on each argument.

Rewrite: see Q5.

### Q6 — Path with spaces

Example: `cat /tmp/my file.txt`

Why it fails: Two arguments to `cat`: `/tmp/my` and `file.txt`.

Rewrite: see Q6.

### Q7 — Variable in single quotes

Example: `echo '$HOME'`

Why it fails: Single quotes prevent expansion; literal `$HOME` is printed.

Rewrite: see Q7.

### Q8 — Mixed single/double quotes

Example: `echo "it's $name"`

Why it fails: Works, but a missing closing quote can swallow the rest of the script.

Rewrite: see Q8.

### Q9 — Backslash in single quotes

Example: `echo 'a\nb'`

Why it fails: Inside single quotes, `\n` is literal. `echo -e` is non-portable.

Rewrite: see Q9.

### Q10 — Filename starting with `-`

Example: `rm -file`

Why it fails: `rm` parses `-file` as an option (`-f -i -l -e`), not a filename.

Rewrite: see Q10.

### Q11 — History expansion in Bash double quotes

Example: `echo "deploy!"`

Why it fails: In interactive Bash with history expansion enabled, `!` inside double quotes can trigger history expansion. The shell may error with `event not found` or substitute previous history unexpectedly.

Rewrite: see Q11.

## 5. Command substitution & pipes

### CS1 — Backticks for substitution

Example: `` echo "today is `date`" ``

Why it fails: Backticks do not nest; harder to escape than `$(...)`.

Rewrite: see CS1.

### CS2 — Unquoted nested `$(...)`

Example: `echo $(echo $(date))`

Why it fails: Word splitting at each level; trailing newlines stripped.

Rewrite: see CS2.

### CS3 — Pipe from network to interpreter

Example: `curl https://example.com/install.sh | sh`

Why it fails: Server-side compromise, MitM, or even server-side detection of `User-Agent: curl` can deliver malicious code; no chance to inspect.

Rewrite: see CS3.

### CS4 — `eval` on a variable

Example: `eval "$cmd"`

Why it fails: Untrusted content runs with current shell privileges; impossible to sanitize fully.

Rewrite: see CS4.

### CS5 — `xargs` without `-0` for filenames

Example: `find . -name '*.log' | xargs rm`

Why it fails: Filenames with spaces, quotes, or newlines split incorrectly.

Rewrite: see CS5.

### CS6 — Pipeline missing `pipefail`

Example: `set -e; cmd1 | cmd2`

Why it fails: With default `pipefail` off, the pipeline's exit status is `cmd2`'s; `cmd1` failure is silently dropped.

Rewrite: see CS6.

## 6. Heredoc & multi-line

### HD1 — Indented heredoc terminator

Example: `cat <<EOF` with the closing `EOF` indented.

Why it fails: `<<EOF` requires the terminator at column 0; indented terminator continues reading lines.

Rewrite: see HD1.

### HD2 — Unwanted expansion in heredoc

Example: `cat <<EOF` with `$var` intended as literal.

Why it fails: Unquoted terminator allows variable expansion.

Rewrite: see HD2.

### HD3 — Heredoc to root-owned file

Example: `cat <<EOF > /etc/foo.conf`

Why it fails: Redirection is performed by the current (non-root) shell; the file write fails.

Rewrite: see HD3.

### HD4 — `echo -e` for multi-line

Example: `echo -e "a\nb"`

Why it fails: `-e` is non-portable (POSIX `echo` does not support it); `printf` is portable.

Rewrite: see HD4.

## 7. Process control

### PC1 — `kill -9`

Example: `kill -9 1234`

Why it fails: Skips `SIGTERM`; the process cannot clean up (release locks, flush buffers).

Rewrite: see PC1.

### PC2 — Broad `pkill`

Example: `pkill node`

Why it fails: Kills every process whose name matches, including unrelated ones; `pkill -f` matches command line.

Rewrite: see PC2.

### PC3 — Background in agent terminal

Example: `node server.js &`

Why it fails: The agent terminal does not reliably manage backgrounded jobs; output capture and termination become unreliable.

Rewrite: see PC3.

### PC4 — `sleep` to wait

Example: `sleep 5; check_status`

Why it fails: Polling is brittle and wastes time; the agent should rely on the terminal completion signal.

Rewrite: see PC4.

## 8. Network & supply-chain

### NS1 — `curl | bash`

Example: `curl -fsSL https://example.com/install.sh | bash`

Why it fails: Same as CS3 — no inspection, no integrity check.

Rewrite: see NS1.

### NS2 — `npm install -g`

Example: `npm install -g some-tool`

Why it fails: Global installs pollute the system, require sudo on default Node setups, and shadow local versions.

Rewrite: see NS2.

### NS3 — `npm publish`

Example: `npm publish`

Why it fails: Publishes to the registry; cannot fully unpublish 24h after; supply-chain impact.

Rewrite: see NS3.

### NS4 — `pip install` without venv

Example: `pip install requests`

Why it fails: Pollutes system Python; can break OS packages on distros that ship Python.

Rewrite: see NS4.

### NS5 — `sudo <package-manager>`

Example: `sudo apt install foo`

Why it fails: Privileged install; verify intent; on managed hosts may break policy.

Rewrite: see NS5.

### NS6 — `ssh host '<long pipeline>'`

Example: `ssh prod "find / -name '*.log' | xargs rm"`

Why it fails: Double-nested quoting; remote shell parses `'...'` then re-parses the inner pipeline. Easy to escape wrong.

Rewrite: see NS6.

## 9. Permission escalation

### PE1 — `sudo <anything>`

Example: `sudo make install`

Why it fails: Privileged action; agent should not silently escalate; if chained into a pipe, the wrong process gets root.

Rewrite: see PE1.

### PE2 — Interactive root shell

Example: `sudo -i`, `sudo su -`

Why it fails: Spawns a root shell the agent cannot reliably exit; subsequent commands all run as root.

Rewrite: see PE2.

### PE3 — Setuid

Example: `chmod u+s /usr/local/bin/myscript`

Why it fails: Any user can run with owner's privileges; almost always a security mistake.

Rewrite: see PE3.

## 10. Output capture & redirection

### OR1 — Overwrite redirection

Example: `cmd > important.log`

Why it fails: Replaces the file contents; if it was the only copy of useful data, gone.

Rewrite: see OR1.

### OR2 — Wrong `2>&1` order

Example: `cmd 2>&1 > log`

Why it fails: `2>&1` duplicates stderr to the current stdout (terminal), then `>log` redirects stdout to the file. Stderr is not captured.

Rewrite: see OR2.

### OR3 — Swallowed stderr

Example: `cmd > /dev/null`

Why it fails: Only stdout is silenced; stderr still leaks. May confuse callers.

Rewrite: see OR3.

### OR4 — Sudo with redirect

Example: `echo foo | sudo > /etc/file`

Why it fails: The redirection is done by the current shell, not by sudo; permission denied or wrong owner.

Rewrite: see OR4.

## 11. Shell mode safety

### SM1 — Script without `set -e`

Example: A multi-step script without `set -euo pipefail`.

Why it fails: An intermediate failure does not abort; the next step runs with bad state.

Rewrite: see SM1.

### SM2 — `cd && cmd` without `set -e`

Example: `cd /tmp/build && rm -rf *`

Why it fails: If `cd` fails (typo, missing dir), `rm -rf *` runs in the current directory.

Rewrite: see SM2.

### SM3 — Bash-only constructs in `sh`

Example: `#!/bin/sh` with `[[ ... ]]`, arrays, `read -p`, `let`.

Why it fails: `/bin/sh` may be `dash`/`ash`/`busybox`; bash extensions fail.

Rewrite: see SM3.

### SM4 — `status` as variable in zsh

Example: `status=$(curl ...)` in zsh.

Why it fails: `status` is a read-only special variable in zsh; assignment errors out.

Rewrite: see SM4.

### SM5 — Bare `==` in zsh

Example: `echo ===`

Why it fails: zsh's `equals expansion` triggers on bare `=word`; `==` and `===` behave unexpectedly.

Rewrite: see SM5.

### SM6 — `IFS` mutation without restore

Example: `IFS=,` followed by other commands.

Why it fails: In an interactive shell or sourced script, `IFS` change persists, breaking later commands' word splitting.

Rewrite: see SM6.

### SM7 — `set -x` with secrets in scope

Example: `set -x; auth_call --token=$TOKEN`

Why it fails: Trace output prints the resolved command, leaking the token.

Rewrite: see SM7.

## 12. SSH & remote execution

### RX1 — Quoting double-nesting

Example: `ssh host "grep $pattern /var/log/$file"`

Why it fails: Local shell expands `$pattern` and `$file`; remote shell re-parses. Easy to escape wrong.

Rewrite: see RX1.

### RX2 — Disabling host verification

Example: `ssh -o StrictHostKeyChecking=no user@host`

Why it fails: Defeats SSH MitM protection; long-lived sessions to misidentified hosts.

Rewrite: see RX2.

### RX3 — Removing known-host entry

Example: `ssh-keygen -R host`

Why it fails: Hides legitimate host-key change warnings; next connection silently trusts a new key.

Rewrite: see RX3.

### RX4 — Remote glob expansion

Example: `scp host:/var/log/*.log .`

Why it fails: The remote shell expands the glob; if filenames contain spaces, escaping is wrong.

Rewrite: see RX4.

### RX5 — `rsync --delete`

Example: `rsync -a --delete src/ dst/`

Why it fails: Removes files in `dst/` not present in `src/`. A typo in `src/` deletes everything in `dst/`.

Rewrite: see RX5.

### RX6 — Agent forwarding to untrusted host

Example: `ssh -A user@untrusted`

Why it fails: The untrusted host can use your local SSH agent to authenticate to any host you trust.

Rewrite: see RX6.

### RX7 — `sshpass`

Example: `sshpass -p "$PASS" ssh user@host`

Why it fails: Password visible in process list (`ps`); insecure compared to key auth.

Rewrite: see RX7.

## 13. GPG & signing

### GP1 — Deleting secret keys

Example: `gpg --delete-secret-keys ABCD1234`

Why it fails: Permanent loss; encrypted data with that key becomes unrecoverable.

Rewrite: see GP1.

### GP2 — Exporting secret keys to stdout

Example: `gpg --export-secret-keys ABCD1234`

Why it fails: Secret key material appears in terminal output, shell history, agent logs.

Rewrite: see GP2.

### GP3 — `--batch --yes` with destructive op

Example: `gpg --batch --yes --delete-keys ABCD1234`

Why it fails: Skips confirmation prompts; one typo wipes a key.

Rewrite: see GP3.

### GP4 — `--no-verify` on signed commits/tags

Example: `git commit -S --no-verify`

Why it fails: Bypasses pre-commit/pre-push hooks that may enforce signing; defeats team policy.

Rewrite: see GP4.

### GP5 — Untrusted key import

Example: `gpg --import < untrusted.asc`

Why it fails: Trust pollution; future verifications succeed against attacker-controlled keys.

Rewrite: see GP5.

### GP6 — Passphrase on command line

Example: `gpg --passphrase "secret" --decrypt file.gpg`

Why it fails: Visible in `ps`, shell history, audit logs.

Rewrite: see GP6.

## 14. Cloud CLIs

### CL1 — `aws s3 rm --recursive`

Example: `aws s3 rm s3://bucket/path --recursive`

Why it fails: Mass-deletes objects; no undo if versioning is off; wrong prefix wipes more than intended.

Rewrite: see CL1.

### CL2 — `aws s3 sync --delete`

Example: `aws s3 sync ./local s3://bucket --delete`

Why it fails: Removes any object on the bucket side not present in `./local`. Empty `./local` wipes the bucket.

Rewrite: see CL2.

### CL3 — IAM destruction

Example: `aws iam delete-role --role-name X`

Why it fails: Removes critical identity; can lock out infrastructure.

Rewrite: see CL3.

### CL4 — EC2 termination

Example: `aws ec2 terminate-instances --instance-ids i-0abc`

Why it fails: Wrong instance ID terminates the wrong machine.

Rewrite: see CL4.

### CL5 — RDS deletion

Example: `aws rds delete-db-instance --db-instance-identifier prod`

Why it fails: Without `--skip-final-snapshot` it asks for a snapshot identifier; with it, data is gone.

Rewrite: see CL5.

### CL6 — GCP project deletion

Example: `gcloud projects delete my-project`

Why it fails: Removes the entire project; resources go to lien-protected limbo then are deleted.

Rewrite: see CL6.

### CL7 — GCP VM deletion

Example: `gcloud compute instances delete my-vm`

Why it fails: Wrong VM name deletes production.

Rewrite: see CL7.

### CL8 — Azure resource group deletion

Example: `az group delete --name prod`

Why it fails: Removes every resource in the group.

Rewrite: see CL8.

### CL9 — Default profile/region/context

Example: `aws s3 rm s3://bucket --recursive` with `AWS_PROFILE` unset and default pointing at prod.

Why it fails: Silent cross-environment action; you think dev but hit prod.

Rewrite: see CL9.

### CL10 — Echoing secret env var

Example: `echo $AWS_SECRET_ACCESS_KEY`

Why it fails: Secret in terminal output, shell history, scrollback.

Rewrite: see CL10.

## 15. Infrastructure as Code

### IC1 — `terraform destroy`

Example: `terraform destroy -auto-approve`

Why it fails: Tears down every managed resource in the workspace.

Rewrite: see IC1.

### IC2 — `terraform apply -auto-approve`

Example: `terraform apply -auto-approve`

Why it fails: Skips human review of the plan; applies whatever the configuration says.

Rewrite: see IC2.

### IC3 — `terraform apply` without prior `plan`

Example: `terraform apply`

Why it fails: No visibility into what will change.

Rewrite: see IC3.

### IC4 — `terraform state rm` / `state mv`

Example: `terraform state rm aws_instance.web`

Why it fails: Terraform forgets the resource; next apply may recreate it; drift.

Rewrite: see IC4.

### IC5 — `terraform workspace delete`

Example: `terraform workspace delete prod`

Why it fails: Removes state metadata; orphans the real resources.

Rewrite: see IC5.

### IC6 — `pulumi destroy --yes`

Example: `pulumi destroy --yes`

Why it fails: Same as IC1 for Pulumi stacks.

Rewrite: see IC6.

### IC7 — `pulumi stack rm --force`

Example: `pulumi stack rm --force prod`

Why it fails: Loses stack history; cannot rollback.

Rewrite: see IC7.

### IC8 — Backend reconfiguration

Example: `terraform init -migrate-state` while another operator holds the lock.

Why it fails: State corruption if the lock check is bypassed.

Rewrite: see IC8.

## 16. Containers & orchestration

### OK1 — `docker system prune -af --volumes`

Example: `docker system prune -af --volumes`

Why it fails: Deletes every image, container, network, and volume not currently in use; loses data in detached volumes.

Rewrite: see OK1.

### OK2 — Mass container removal

Example: `docker rm -f $(docker ps -aq)`

Why it fails: Stops and removes every container, including production-relevant ones.

Rewrite: see OK2.

### OK3 — `docker run --privileged`

Example: `docker run --privileged ...`

Why it fails: Container has near-full host access; escapes are trivial.

Rewrite: see OK3.

### OK4 — `docker run -v /:/host`

Example: `docker run -v /:/host ubuntu sh`

Why it fails: Mounts host root inside the container; any write affects the host.

Rewrite: see OK4.

### OK5 — Namespace deletion

Example: `kubectl delete namespace staging`

Why it fails: Cascade-deletes every object in the namespace; PVCs go too unless retain policy.

Rewrite: see OK5.

### OK6 — Apply from URL

Example: `kubectl apply -f https://example.com/manifest.yaml`

Why it fails: Untrusted source; manifest may contain malicious workloads.

Rewrite: see OK6.

### OK7 — `kubectl drain`

Example: `kubectl drain node-1`

Why it fails: May fail because of `daemonsets`; without `--ignore-daemonsets` and `--delete-emptydir-data` decisions, behavior is surprising.

Rewrite: see OK7.

### OK8 — PVC deletion

Example: `kubectl delete pvc data-0`

Why it fails: With dynamic provisioning + `Delete` reclaim policy, the underlying volume is deleted.

Rewrite: see OK8.

### OK9 — Default context

Example: `kubectl apply -f svc.yaml` with `current-context` pointing at prod.

Why it fails: Silent cross-cluster action.

Rewrite: see OK9.

### OK10 — `helm uninstall`

Example: `helm uninstall my-release`

Why it fails: Removes the release; PVCs may or may not survive depending on chart.

Rewrite: see OK10.

### OK11 — Helm install without `--atomic`

Example: `helm install foo ./chart`

Why it fails: Failed install leaves half-deployed resources.

Rewrite: see OK11.

### OK12 — `kubectl exec` for write operations

Example: `kubectl exec -it pod-0 -- sh -c "echo data > /etc/config"`

Why it fails: Bypasses GitOps; change vanishes on pod restart; no audit trail.

Rewrite: see OK12.

## 17. Database CLIs

### DB1 — `DROP DATABASE`/`DROP TABLE`

Example: `psql -c "DROP TABLE users;"`

Why it fails: Schema and data loss; no undo on most engines.

Rewrite: see DB1.

### DB2 — `TRUNCATE` / `DELETE` without `WHERE`

Example: `DELETE FROM orders;`

Why it fails: Removes every row.

Rewrite: see DB2.

### DB3 — `UPDATE` without `WHERE`

Example: `UPDATE users SET status='inactive';`

Why it fails: Mutates every row.

Rewrite: see DB3.

### DB4 — `psql` URI with password

Example: `psql postgres://user:secret@host/db`

Why it fails: Password in shell history, process list, scrollback.

Rewrite: see DB4.

### DB5 — `mysql -p<pass>`

Example: `mysql -uuser -psecret`

Why it fails: Same as DB4 — visible everywhere.

Rewrite: see DB5.

### DB6 — `redis-cli FLUSHALL`

Example: `redis-cli FLUSHALL`

Why it fails: Wipes every key in every database.

Rewrite: see DB6.

### DB7 — `redis-cli CONFIG SET`

Example: `redis-cli CONFIG SET maxmemory 0`

Why it fails: Runtime change not persisted in config file; drift.

Rewrite: see DB7.

### DB8 — `db.dropDatabase()`

Example: `mongosh "$URI" --eval "db.dropDatabase()"`

Why it fails: Schema and data loss.

Rewrite: see DB8.

### DB9 — Connecting to prod by default

Example: `psql $DATABASE_URL` where the env var points to prod.

Why it fails: Silent cross-environment action.

Rewrite: see DB9.

### DB10 — `pg_restore --clean`

Example: `pg_restore --clean -d prod backup.dump`

Why it fails: Drops live objects before restore; if restore fails, target is empty.

Rewrite: see DB10.

## 18. Systemd & service control

### SS1 — `systemctl stop <critical>`

Example: `systemctl stop sshd`

Why it fails: On a remote host, you lock yourself out.

Rewrite: see SS1.

### SS2 — `systemctl disable --now`

Example: `systemctl disable --now sshd`

Why it fails: Same as SS1, plus persists across reboot.

Rewrite: see SS2.

### SS3 — Unit edit without `daemon-reload`

Example: Edit `/etc/systemd/system/foo.service` then `systemctl restart foo`.

Why it fails: systemd uses the cached unit; changes appear not to take effect.

Rewrite: see SS3.

### SS4 — `shutdown` / `reboot` / `halt` / `poweroff`

Example: `shutdown now`

Why it fails: Host downtime; on a remote host you are gone.

Rewrite: see SS4.

### SS5 — `journalctl --vacuum-size=0`

Example: `journalctl --vacuum-size=0`

Why it fails: Wipes the journal; forensics lost.

Rewrite: see SS5.

## 19. Secret & environment hygiene

### SE1 — Echo of secret var

Example: `echo $TOKEN`

Why it fails: Secret in terminal, scrollback, shell history.

Rewrite: see SE1.

### SE2 — Env dump to file

Example: `env > env.txt`

Why it fails: Every credential the shell holds ends up in a file.

Rewrite: see SE2.

### SE3 — Secret on command line

Example: `curl --header "Authorization: Bearer abc123"`

Why it fails: Visible in `ps`, shell history.

Rewrite: see SE3.

### SE4 — Auth header in shell history

Example: `curl -H "Authorization: Bearer $TOKEN" https://api/...`

Why it fails: `$TOKEN` does not appear in history, but the surrounding command might leak via reverse-search; expansion is logged in `set -x`.

Rewrite: see SE4.

### SE5 — Secret in tracked file

Example: `echo "API_KEY=abc" >> .env`

Why it fails: If `.env` is not in `.gitignore`, the secret is committed.

Rewrite: see SE5.

### SE6 — `set -x` while a secret is in scope

Example: `set -x; do_thing --token=$TOKEN`

Why it fails: Trace prints the resolved token.

Rewrite: see SE6.

### SE7 — Secret echoed to log

Example: `grep -r PASSWORD . > findings.txt`

Why it fails: Search hits include the secret value.

Rewrite: see SE7.

### SE8 — History expansion in double quotes

Example: `echo "wow!"`

Why it fails: `!` triggers history expansion in interactive bash; can substitute previous commands.

Rewrite: see SE8.

## 20. Archive & compression

### AR1 — `tar -xf untrusted.tar`

Example: `tar -xf received.tar`

Why it fails: Members can overwrite existing files; the archive may be a "zip slip" with `..` paths.

Rewrite: see AR1.

### AR2 — Tar with absolute/`..` paths

Example: Archive contains `/etc/passwd` or `../escape`.

Why it fails: Extraction writes outside the target directory.

Rewrite: see AR2.

### AR3 — `unzip untrusted.zip` to existing dir

Example: `unzip received.zip`

Why it fails: Overwrites files silently; same zip-slip risk.

Rewrite: see AR3.

### AR4 — Tar over network without checksum

Example: `curl https://.../archive.tar.gz | tar -xzf -`

Why it fails: Truncation results in partial extraction with no error.

Rewrite: see AR4.

### AR5 — `rm -rf` after partial extract

Example: `tar -xf foo.tar || rm -rf foo`

Why it fails: Hides extraction errors; you never see the partial state.

Rewrite: see AR5.

## 21. Encoding & locale

### EN1 — CRLF line endings

Example: A shell script saved with CRLF on Windows.

Why it fails: `\r` becomes part of every command; `bash` errors with `bad interpreter` or `command not found`.

Rewrite: see EN1.

### EN2 — UTF-8 BOM

Example: A shell script saved with a UTF-8 BOM by an editor.

Why it fails: Shebang parsing fails because the BOM precedes `#!`.

Rewrite: see EN2.

### EN3 — Locale-dependent `sort`

Example: `sort file.txt`

Why it fails: Locale collation reorders bytes differently across systems; reproducibility breaks.

Rewrite: see EN3.

### EN4 — `grep -P` portability

Example: `grep -P 'foo' file`

Why it fails: PCRE support not present on BSD `grep` (macOS default).

Rewrite: see EN4.

### EN5 — Locale-dependent `date`

Example: `date +'%B %d'`

Why it fails: Localized month names; cross-host scripts diverge.

Rewrite: see EN5.
