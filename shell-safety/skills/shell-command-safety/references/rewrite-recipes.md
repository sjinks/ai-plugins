# Rewrite Recipes

Copy-paste safe rewrites for every pattern ID in [patterns-catalog.md](./patterns-catalog.md). Each recipe is keyed by the catalog ID and shows a minimal, drop-in-replacement form.

## 1. Git commit messages

### GC1 — Multi-line `-m`

```sh
# Bad
git commit -m "Subject\n\nBody"

# Good — heredoc into process substitution
git commit -F <(cat <<'EOF'
Subject

Body paragraph.
EOF
)

# Good — write to a file then read
cat > /tmp/COMMIT_MSG.txt <<'EOF'
Subject

Body paragraph.
EOF
git commit -F /tmp/COMMIT_MSG.txt
```

### GC2 — Repeated `-m`

Prefer `-F` for any commit with more than a subject line.

### GC3 — Substitution in `-m`

```sh
# Bad
git commit -m "Fix: $(cat issue.txt)"

# Good
git commit -F issue.txt
```

### GC4 — Variable in `-m`

```sh
# Bad
git commit -m "Fix: $TITLE"

# Good
printf '%s\n' "$TITLE" > /tmp/COMMIT_MSG.txt
git commit -F /tmp/COMMIT_MSG.txt
```

### GC5 — Backtick substitution

```sh
# Bad
git commit -m "ship at `date`"

# Good
date > /tmp/COMMIT_MSG.txt
git commit -F /tmp/COMMIT_MSG.txt
```

### GC6 — Backtick inside `-m`

```sh
# Bad
git commit -m "use `foo()` here"

# Good — heredoc with quoted terminator (no expansion)
git commit -F <(cat <<'EOF'
use `foo()` here
EOF
)
```

### GC7 — Apostrophe in single-quoted `-m`

```sh
# Bad
git commit -m 'it\'s broken'

# Good — double quotes (no shell metachars in message)
git commit -m "it's broken"

# Better — file
printf "%s\n" "it's broken" > /tmp/COMMIT_MSG.txt
git commit -F /tmp/COMMIT_MSG.txt
```

### GC8 — Emoji/unicode

```sh
# Good — UTF-8 file
printf '🎉 ship\n' > /tmp/COMMIT_MSG.txt
git commit -F /tmp/COMMIT_MSG.txt
```

## 2. Git destructive operations

### GD1 — Hard reset

```sh
# Verify clean tree first
git status --porcelain   # must be empty before --hard
git stash push -m 'pre-reset' --include-untracked  # if any
git reset --hard HEAD~3
```

### GD2 — Force push

```sh
# Bad
git push --force origin feature

# Good — refuse if branch is protected
case "$(git rev-parse --abbrev-ref HEAD)" in
  main|master|release/*|production|prod)
    echo "refuse: protected branch" >&2; exit 1;;
esac
git push --force-with-lease origin "$(git rev-parse --abbrev-ref HEAD)"
```

### GD3 — Branch deletion

```sh
# Confirm unmerged commits are intentional
git log --oneline main..feature   # show what would be lost
git branch -D feature
```

### GD4 — Clean untracked

```sh
git clean -ndx           # dry-run, lists what would be removed
git clean -fdx           # only after reviewing the dry-run
```

### GD5 — Detached checkout

```sh
# Want a branch from a sha?
git checkout -b new-branch 4a8c2f1

# Want to inspect read-only?
git switch --detach 4a8c2f1   # makes the intent explicit
```

### GD6 — Rewrite pushed history

Refuse without explicit user confirmation. If confirmed:

```sh
# Confirm no one else has based work on these commits
git fetch origin
git log --oneline origin/main..HEAD
git rebase -i origin/main
git push --force-with-lease origin "$(git rev-parse --abbrev-ref HEAD)"
```

### GD7 — Submodule deinit

```sh
cd <submodule>
git status   # confirm nothing local to keep
cd -
git submodule deinit -- <submodule>
# Avoid --force unless the dry-status confirmed no loss
```

### GD8 — Tag deletion on remote

```sh
# Verify no release / package references the tag first
git tag -l 'v*' | xargs -I{} echo "consumer-check: {}"
git push --delete origin v1.2.3
```

## 3. Filesystem destruction

### FS1 — `rm -rf <path>`

```sh
target='./build'
[ -n "$target" ] && [ "$target" != "/" ] && [ "$target" != "$HOME" ] \
  && [ -d "$target" ] \
  && rm -rf -- "$target"
```

### FS2 — `rm -rf "$VAR"`

```sh
: "${BUILD_DIR:?BUILD_DIR is unset}"
[ -n "$BUILD_DIR" ] && [ "$BUILD_DIR" != "/" ] && [ "$BUILD_DIR" != "$HOME" ] \
  && [ -d "$BUILD_DIR" ] \
  && rm -rf -- "$BUILD_DIR"
```

### FS3 — Unbounded glob

```sh
# Bad
rm -rf *

# Good — enumerate explicitly
rm -rf -- build/ dist/ .cache/
```

### FS4 — Delete from `/` or `~`

Refuse. If genuinely required, name the exact subdirectory and add the FS2 guards.

### FS5 — `find ... -delete`

```sh
# Dry-run first
find . -name '*.log' -print
# Then delete
find . -name '*.log' -delete
```

### FS6 — `truncate -s 0`

```sh
[ -f /var/log/app.log ] && truncate -s 0 /var/log/app.log
```

### FS7 — `dd`

Refuse unless the user confirms the device path. When confirmed:

```sh
lsblk /dev/sdb   # show what device is being written
sudo dd if=image.iso of=/dev/sdb bs=4M status=progress conv=fdatasync
```

### FS8 — `mkfs.*`

Same as FS7 — confirm device, then run.

### FS9 — `chmod -R 777`

```sh
# Good — minimal set
chmod -R u=rwX,g=rX,o=rX /var/www
```

### FS10 — `chown -R` outside project

Refuse unless explicit user confirmation; restrict to project root.

## 4. Quoting & expansion

### Q1 — Unquoted variable in arg

```sh
# Bad
rm $file

# Good
rm -- "$file"
```

### Q2 — Unquoted variable path

```sh
# Bad
cd $dir

# Good
cd -- "$dir"
```

### Q3 — `for` over `$(ls)`

```sh
# Bad
for f in $(ls); do ...; done

# Good — glob
for f in *; do ...; done

# Good — NUL-delimited
while IFS= read -r -d '' f; do ...; done < <(find . -type f -print0)
```

### Q4 — Unquoted glob

```sh
# Verify expansion explicitly
ls -- *.log
mv -- *.log /tmp/
```

### Q5 — `"$@"`

```sh
# Bad
cmd $@

# Good
cmd "$@"
```

### Q6 — Path with spaces

```sh
cat "/tmp/my file.txt"
```

### Q7 — Variable in single quotes

```sh
# Bad
echo '$HOME'

# Good — if expansion wanted
echo "$HOME"
```

### Q8 — Mixed quoting

```sh
echo "it's $name"     # fine; verify intent
printf "%s\n" "it's $name"   # safer with printf
```

### Q9 — Backslash escapes

```sh
# Bad
echo 'a\nb'

# Good
printf '%s\n%s\n' a b
```

### Q10 — Filename starting with `-`

```sh
rm -- -file
```

### Q11 — History expansion in Bash double quotes

```sh
# Bad in interactive Bash when history expansion is enabled
echo "deploy!"

# Good — no expansion inside single quotes
echo 'deploy!'

# Good — disable history expansion before using double quotes with literal !
set +H
echo "deploy!"
```

## 5. Command substitution & pipes

### CS1 — Use `$(...)`

```sh
# Bad
echo "today is `date`"

# Good
echo "today is $(date)"
```

### CS2 — Quote substitutions

```sh
echo "$(echo "$(date)")"
```

### CS3 — Pipe from network to interpreter

```sh
# Bad
curl https://example.com/install.sh | sh

# Good
tmp=$(mktemp /tmp/install.XXXXXX.sh)
curl -fsSL --proto '=https' --tlsv1.2 https://example.com/install.sh -o "$tmp"
shasum -a 256 "$tmp"      # compare to a published checksum
${EDITOR:-cat} "$tmp"     # inspect
sh "$tmp"
rm -f -- "$tmp"
```

### CS4 — `eval`

Restructure to avoid `eval`. If a dynamic command is unavoidable, use an array:

```sh
cmd=(rsync -av --delete src/ dst/)
"${cmd[@]}"
```

### CS5 — `xargs` with NUL

```sh
# Bad
find . -name '*.log' | xargs rm

# Good
find . -name '*.log' -print0 | xargs -0 rm --
```

### CS6 — `pipefail`

```sh
set -o pipefail
cmd1 | cmd2 | cmd3
```

## 6. Heredoc & multi-line

### HD1 — Indented heredoc

```sh
# Bad (terminator indented but <<EOF)
cat <<EOF
    line
    EOF

# Good — <<-EOF strips leading TABS (not spaces)
cat <<-EOF
	line
	EOF
```

### HD2 — Suppress expansion

```sh
# Quoted terminator = no expansion
cat <<'EOF'
literal $var and $(cmd)
EOF
```

### HD3 — Heredoc to root-owned file

```sh
sudo tee /etc/foo.conf >/dev/null <<'EOF'
content
EOF
```

### HD4 — `printf` over `echo -e`

```sh
# Bad
echo -e "a\nb"

# Good
printf 'a\nb\n'
```

## 7. Process control

### PC1 — Graceful kill first

```sh
kill "$pid"           # SIGTERM
sleep 1
kill -9 "$pid" 2>/dev/null || true
```

### PC2 — Precise `pkill`

```sh
pgrep -f 'node server.js'   # dry-run
pkill -f 'node server.js'
```

### PC3 — Use async terminal mode

Use the terminal tool's async/background mode instead of `cmd &`.

### PC4 — Do not poll

Rely on the terminal's completion signal; do not write `sleep N` loops.

## 8. Network & supply-chain

### NS1 — Inspect before run

See CS3.

### NS2 — Project-local install

```sh
npm install --save-dev some-tool        # dependency
npx some-tool                            # ad-hoc run
```

### NS3 — `npm publish`

Refuse unless user confirms. When confirmed:

```sh
npm publish --dry-run   # review the tarball contents
npm publish --access public
```

### NS4 — venv

```sh
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
```

### NS5 — `sudo <pm>`

Confirm intent. Prefer `--dry-run` where supported.

### NS6 — SSH script execution

```sh
ssh host bash -s < local-script.sh
```

## 9. Permission escalation

### PE1 — `sudo`

State why sudo is required; do not chain into pipes silently. Prefer:

```sh
sudo -n true 2>/dev/null || { echo "sudo unavailable"; exit 1; }
sudo -- <command>
```

### PE2 — Avoid root shells

Use `sudo -- <command>` for one-shot commands instead of `sudo -i` / `sudo su`.

### PE3 — Setuid

Refuse. Use sudoers rules or a setcap-based capability instead.

## 10. Output capture & redirection

### OR1 — Append instead of overwrite

```sh
cmd >> log.txt
# Or: confirm overwrite
cmd > log.txt   # only after verifying log.txt is disposable
```

### OR2 — Correct stderr merge

```sh
# Bad
cmd 2>&1 > log

# Good
cmd > log 2>&1
# Or shell-portable:
cmd &> log    # bash/zsh only
```

### OR3 — Silence both streams

```sh
cmd > /dev/null 2>&1
```

### OR4 — `sudo tee`

```sh
echo 'content' | sudo tee /etc/foo.conf > /dev/null
```

## 11. Shell mode safety

### SM1 — Strict mode

```sh
#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'
```

### SM2 — Guard `cd`

```sh
cd -- "$dir" || exit 1
rm -rf -- ./build
```

### SM3 — POSIX

```sh
#!/bin/sh
if [ -f "$file" ]; then ...; fi
```

### SM4 — Avoid `status` in zsh

```sh
exit_code=$(curl ...; printf '%s' "$?")
```

### SM5 — Quote `==` in zsh

```sh
echo '==='
[[ "$a" == "$b" ]]
```

### SM6 — Restore IFS

```sh
OLDIFS=$IFS
IFS=,
read -r a b c <<< "$line"
IFS=$OLDIFS
```

### SM7 — Scope `set -x`

```sh
{ set -x; safe_command; set +x; } 2> debug.log
```

## 12. SSH & remote

### RX1 — Send a script

```sh
ssh host bash -s < local-script.sh
# Or with args
ssh host bash -s arg1 arg2 < local-script.sh
```

### RX2 — Verify host keys

```sh
ssh-keyscan -t ed25519 host >> ~/.ssh/known_hosts
ssh user@host
```

### RX3 — Confirm intent

State explicitly why the entry is being removed; expect host-key rotation.

### RX4 — Quote remote glob

```sh
scp 'host:/var/log/*.log' .
# Or use rsync
rsync -av 'host:/var/log/' ./logs/
```

### RX5 — `rsync` dry-run first

```sh
rsync -av --delete -n src/ dst/   # dry-run
rsync -av --delete    src/ dst/   # only after review
```

### RX6 — Avoid agent forwarding

Use `ProxyJump` or `ssh -o ProxyCommand=...` instead of `-A`.

### RX7 — Key auth

Generate a key, add to `~/.ssh/authorized_keys` on the host, drop `sshpass`.

## 13. GPG & signing

### GP1 — Delete secret keys

Refuse unless user confirms. When confirmed:

```sh
gpg --list-secret-keys ABCD1234     # confirm right key
gpg --delete-secret-keys ABCD1234
```

### GP2 — Export to file

```sh
umask 077
gpg --export-secret-keys --armor ABCD1234 > /tmp/secret.asc
```

### GP3 — Confirm batch

If batch is required, confirm the key fingerprint matches.

### GP4 — Address the hook

Do not pass `--no-verify`. Fix the hook failure instead.

### GP5 — Verify before import

```sh
gpg --show-keys received.asc   # inspect fingerprint
# Verify the fingerprint via out-of-band channel
gpg --import received.asc
```

### GP6 — Pinentry loopback

```sh
gpg --pinentry-mode loopback --passphrase-file /tmp/pass.txt --decrypt file.gpg
# Or read from stdin
gpg --pinentry-mode loopback --passphrase-fd 0 --decrypt file.gpg < pass.txt
```

## 14. Cloud CLIs

### CL1 — `aws s3 rm --recursive`

```sh
aws s3 rm s3://bucket/path --recursive --dryrun
# Review output, then drop --dryrun only after confirmation
aws s3 rm s3://bucket/path --recursive
```

### CL2 — `aws s3 sync --delete`

```sh
aws s3 sync ./local s3://bucket --delete --dryrun
aws s3 sync ./local s3://bucket --delete    # after review
```

### CL3 — IAM

Refuse. If confirmed, list dependent resources first:

```sh
aws iam list-attached-role-policies --role-name X
aws iam delete-role --role-name X
```

### CL4 — EC2 terminate

```sh
aws ec2 describe-instances --instance-ids i-0abc \
  --query 'Reservations[*].Instances[*].[InstanceId,Tags[?Key==`Name`].Value|[0]]' --output text
aws ec2 terminate-instances --instance-ids i-0abc
```

### CL5 — RDS delete

```sh
aws rds delete-db-instance \
  --db-instance-identifier prod \
  --final-db-snapshot-identifier prod-final-$(date +%Y%m%d)
```

### CL6 — GCP project delete

Refuse without explicit user confirmation.

### CL7 — GCP VM delete

```sh
gcloud compute instances describe my-vm --zone=us-central1-a   # confirm
gcloud compute instances delete my-vm --zone=us-central1-a
```

### CL8 — Azure RG delete

Refuse without explicit user confirmation. List first:

```sh
az resource list --resource-group prod -o table
```

### CL9 — Always specify env

```sh
AWS_PROFILE=dev AWS_REGION=us-east-1 aws s3 ls
gcloud --project=dev compute instances list
az --subscription=dev resource list
kubectl --context=dev get pods
```

### CL10 — Refuse to echo

Do not `echo` or print resolved secret env vars.

## 15. Infrastructure as Code

### IC1 — `terraform destroy`

```sh
terraform plan -destroy -out=destroy.plan   # show what dies
# Review, then
terraform apply destroy.plan
```

### IC2 — Reviewed apply

```sh
terraform plan -out=apply.plan
# Review apply.plan
terraform apply apply.plan
```

### IC3 — Plan first

Same as IC2.

### IC4 — Document state changes

```sh
terraform state list
terraform state show aws_instance.web
terraform state rm aws_instance.web   # only with documented reason
```

### IC5 — Workspace delete

Refuse without explicit user confirmation; check resources first.

### IC6 — Pulumi destroy

```sh
pulumi preview --diff
pulumi destroy   # without --yes; require interactive confirm
```

### IC7 — Pulumi stack rm

Refuse without explicit user confirmation.

### IC8 — Backend reconfig

```sh
terraform force-unlock <lock-id>   # only when stuck and you own the lock
terraform init -migrate-state
```

## 16. Containers & orchestration

### OK1 — Docker prune

Refuse `-af --volumes`. Prefer:

```sh
docker image prune        # dangling images only
docker container prune    # exited containers only
docker volume ls          # inspect first
```

### OK2 — Mass remove

```sh
docker ps -aq --filter status=exited
docker rm $(docker ps -aq --filter status=exited)
```

### OK3 — Drop privileges

Use specific capabilities: `--cap-add=NET_ADMIN` etc., not `--privileged` / `--cap-add=ALL`.

### OK4 — Restrict mounts

Mount only the path you need: `-v /tmp/work:/work` instead of `-v /:/host`.

### OK5 — Namespace delete

```sh
kubectl --context=dev -n staging get all,pvc,secrets,cm
kubectl --context=dev delete namespace staging
```

### OK6 — Inspect manifests

```sh
curl -fsSL https://example.com/manifest.yaml -o /tmp/m.yaml
${EDITOR:-cat} /tmp/m.yaml
kubectl apply -f /tmp/m.yaml
```

### OK7 — Drain plan

```sh
kubectl drain node-1 --dry-run=client
kubectl drain node-1 --ignore-daemonsets --delete-emptydir-data
```

### OK8 — PVC delete

Refuse without explicit user confirmation. Confirm reclaim policy first:

```sh
kubectl get pvc data-0 -o jsonpath='{.spec.storageClassName}'
kubectl get sc <sc-name> -o jsonpath='{.reclaimPolicy}'
```

### OK9 — Specify context

```sh
kubectl --context=dev apply -f svc.yaml
```

### OK10 — Helm uninstall

```sh
helm list -n my-ns
helm uninstall my-release -n my-ns
```

### OK11 — Atomic install

```sh
helm install foo ./chart --atomic --timeout 5m
```

### OK12 — Manifest edit

Edit the YAML in git and re-apply rather than `kubectl exec` for write ops.

## 17. Database CLIs

### DB1 — `DROP`

Refuse without explicit user confirmation. When confirmed, take a snapshot/backup first.

### DB2 — `TRUNCATE`/`DELETE`

```sql
BEGIN;
DELETE FROM orders WHERE created_at < '2020-01-01';
-- verify count
SELECT COUNT(*) FROM orders;
COMMIT;
```

### DB3 — `UPDATE`

```sql
BEGIN;
UPDATE users SET status='inactive' WHERE last_login < '2020-01-01';
-- verify count
COMMIT;
```

### DB4 — `psql` credentials

```sh
# Use ~/.pgpass (mode 0600)
echo 'host:5432:db:user:pass' >> ~/.pgpass
chmod 600 ~/.pgpass
psql 'host=host dbname=db user=user'
```

### DB5 — `mysql` credentials

```sh
# Use --login-path
mysql_config_editor set --login-path=prod --host=host --user=user --password
mysql --login-path=prod
```

### DB6 — `redis-cli` flush

Refuse without explicit user confirmation. When confirmed:

```sh
redis-cli -h host -p 6379 FLUSHDB
```

### DB7 — `redis-cli CONFIG SET`

Persist the change in the config file too:

```sh
redis-cli CONFIG SET maxmemory 0
redis-cli CONFIG REWRITE
```

### DB8 — Mongo drop

Refuse without explicit user confirmation; take a backup first.

### DB9 — Verify target

```sh
psql 'host=host dbname=db user=user' -c 'SELECT current_database(), inet_server_addr();'
```

### DB10 — `pg_restore --clean`

Refuse without explicit user confirmation; restore to a temporary database first.

## 18. Systemd & service control

### SS1 — `systemctl stop <critical>`

Confirm intent; warn that an SSH stop locks the operator out. Have a recovery plan (console access).

### SS2 — `systemctl disable --now`

Same as SS1.

### SS3 — `daemon-reload`

```sh
sudo systemctl daemon-reload
sudo systemctl restart foo
```

### SS4 — `shutdown`/`reboot`

Refuse without explicit user confirmation. When confirmed:

```sh
sudo shutdown -r +1 'reboot for kernel upgrade'
```

### SS5 — `journalctl --vacuum`

```sh
sudo journalctl --vacuum-time=7d   # rotate by age, not size=0
```

## 19. Secret & environment hygiene

### SE1 — Do not echo

If the value must be checked, compare a hash:

```sh
printf '%s' "$TOKEN" | shasum -a 256
```

### SE2 — Safe environment snapshot

```sh
# Prefer an allowlist. Do not dump the whole environment and try to filter secrets out.
env | grep -E '^(PATH|HOME|SHELL|USER|PWD|LANG|LC_|TERM)=' > env.safe.txt
chmod 600 env.safe.txt
```

### SE3 — Read from file

```sh
curl --header "@/tmp/auth.txt" https://api/...
# /tmp/auth.txt contains a single line: Authorization: Bearer <token>
```

### SE4 — Auth header from file

```sh
umask 077
auth_header=$(mktemp /tmp/auth-header.XXXXXX)
printf 'Authorization: Bearer %s\n' "$TOKEN" > "$auth_header"
curl --header "@$auth_header" https://api/...
rm -f -- "$auth_header"
```

### SE5 — Gitignore

```sh
grep -qx '.env' .gitignore || echo '.env' >> .gitignore
```

### SE6 — Scope `set -x`

```sh
{ set +x; auth_call --token="$TOKEN"; } 2>/dev/null
```

### SE7 — Restricted output file

```sh
umask 077
grep -r PASSWORD . > findings.txt
```

### SE8 — Disable history expansion

```sh
set +H
echo "wow!"
```

## 20. Archive & compression

### AR1 — Inspect tar first

```sh
tar -tf received.tar | head -50
mkdir -p /tmp/extract
tar -xf received.tar -C /tmp/extract --no-overwrite-dir
```

### AR2 — Refuse absolute/`..`

```sh
tar -tf received.tar | awk '/^\//{abs=1} /\.\./{rel=1} END {exit (abs||rel)}' \
  && tar -xf received.tar -C /tmp/extract
```

### AR3 — Unzip safely

```sh
mkdir -p /tmp/extract
unzip -n received.zip -d /tmp/extract
```

### AR4 — Checksum first

```sh
curl -fsSL "$url" -o /tmp/a.tgz
shasum -a 256 /tmp/a.tgz   # compare to published
tar -xzf /tmp/a.tgz -C /tmp/extract
```

### AR5 — Inspect partial state

```sh
tar -xf foo.tar -C /tmp/extract
ls -la /tmp/extract        # confirm completeness before any rm
```

## 21. Encoding & locale

### EN1 — Convert CRLF

```sh
dos2unix script.sh
# or
sed -i 's/\r$//' script.sh
```

### EN2 — Strip BOM

```sh
sed -i '1s/^\xEF\xBB\xBF//' script.sh
```

### EN3 — Byte-deterministic sort

```sh
LC_ALL=C sort file.txt
LC_ALL=C grep pattern file.txt
LC_ALL=C tr 'a-z' 'A-Z' < file.txt
```

### EN4 — Portable grep

```sh
# Bad on BSD grep
grep -P 'foo' file

# Good
grep -E 'foo' file
# Or use ripgrep
rg 'foo' file
```

### EN5 — Portable date

```sh
LC_ALL=C date '+%B %d'
# Or ISO 8601 UTC
date -u '+%Y-%m-%dT%H:%M:%SZ'
```
