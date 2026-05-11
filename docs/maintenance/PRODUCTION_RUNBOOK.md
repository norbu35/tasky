# Production Runbook

> Canonical ops reference for the Tasky Phase 1 production environment.
> Maintained by the on-call operator. Every section must be filled before launch.
> See `docs/maintenance/PRODUCTION_READINESS.md` for the readiness gate.

## Table of Contents

1. [Bootstrap](#1-bootstrap)
2. [Secret Injection](#2-secret-injection)
3. [Host Firewall](#3-host-firewall)
4. [SSH Hardening](#4-ssh-hardening)
5. [Encryption at Rest](#5-encryption-at-rest)
6. [Deploy Procedure](#6-deploy-procedure)
7. [Rollback Procedure](#7-rollback-procedure)
8. [Backup Verification + Offsite](#8-backup-verification--offsite)
9. [Restore Drill Evidence](#9-restore-drill-evidence)
10. [WAL Archive Retention](#10-wal-archive-retention)
11. [Blind-Index Key Rotation](#11-blind-index-key-rotation)
12. [JWT Secret Rotation](#12-jwt-secret-rotation)
13. [Encryption Key Rotation](#13-encryption-key-rotation)
14. [Per-Alert Runbook Entries](#14-per-alert-runbook-entries)
15. [On-Call / Paging](#15-on-call--paging)
16. [Incident Response (SEV-1/2/3)](#16-incident-response-sev-123)
17. [Capacity Sizing + Cost Model](#17-capacity-sizing--cost-model)
18. [Cutover Plan](#18-cutover-plan)
19. [Day-2 Plan](#19-day-2-plan)

---

## 1. Bootstrap

Provision a fresh Ubuntu 24.04 VPS and prepare it for the Tasky production stack.

### 1.1 System update and basic dependencies

```bash
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y ca-certificates curl git rsync openssh-client chrony
```

### 1.2 Time synchronisation (chrony)

```bash
sudo apt-get install -y chrony
sudo systemctl enable --now chrony
# Verify
chronyc tracking
```

### 1.3 Swap (2 GB)

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
# Verify
free -h
```

### 1.4 Create deploy user

```bash
# Run as root or a sudo-capable user.
sudo adduser --gecos "" deploy
sudo usermod -aG sudo deploy
sudo usermod -aG docker deploy
```

Copy your SSH public key to the deploy user:

```bash
sudo mkdir -p /home/deploy/.ssh
sudo cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys 2>/dev/null || true
# Or manually:
# echo "ssh-ed25519 AAAA... your-key-comment" | sudo tee /home/deploy/.ssh/authorized_keys
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

### 1.5 Docker Engine + docker-compose plugin

```bash
sudo apt-get install -y docker.io
# If docker-compose-plugin is available in apt:
sudo apt-get install -y docker-compose-plugin
# Verify
docker compose version
```

If `docker-compose-plugin` is not available from apt, install the plugin manually:

```bash
DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
mkdir -p "$DOCKER_CONFIG/cli-plugins"
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
  -o "$DOCKER_CONFIG/cli-plugins/docker-compose"
chmod +x "$DOCKER_CONFIG/cli-plugins/docker-compose"
docker compose version
```

### 1.6 Application directory

```bash
sudo install -d -o deploy -g deploy /opt/tasky
```

### 1.7 Docker userns-remap (future hardening)

Docker userns-remap remaps container users to unprivileged host UIDs, mitigating
container-escape attacks. This is a **planned hardening step** (P2-10) for post-launch.

```bash
# /etc/docker/daemon.json
{
  "userns-remap": "taskydock"
}
# Then: sudo useradd -r -s /bin/false taskydock
# Restart: sudo systemctl restart docker
```

**Not yet applied.** Requires testing that all volume mounts and bind-mount paths
are accessible by the remapped user before enabling in production.

### 1.8 Verify bootstrap

```bash
docker compose version        # docker compose available
systemctl is-active chrony    # time sync running
free -h | grep Swap           # 2G swap present
id deploy                     # deploy user exists with groups
ls -la /opt/tasky             # app dir exists, owned by deploy
```

---

## 2. Secret Injection

All production secrets are injected via a single `.env` file consumed by `docker-compose.production.yml`.

### 2.1 Create the environment file

```bash
sudo -u deploy cp .env.production.example /opt/tasky/.env
```

Edit `/opt/tasky/.env` and fill in every value. Generate secrets with:

```bash
# JWT secret
openssl rand -hex 32
# Encryption key
openssl rand -base64 32
# Blind index key
openssl rand -hex 32
```

### 2.2 File permissions

```bash
sudo chmod 600 /opt/tasky/.env
sudo chown deploy:deploy /opt/tasky/.env
```

### 2.3 Verify

```bash
# Must show: -rw------- 1 deploy deploy
ls -la /opt/tasky/.env
# Must show no world-readable
stat -c '%a' /opt/tasky/.env   # expected: 600
# Confirm no accidental commit
git check-ignore /opt/tasky/.env 2>/dev/null; echo "If this file is in the repo, remove it immediately."
```

### 2.4 Rules

- The `.env` file is never committed to the repository. `.gitignore` includes `.env` at the repo root.
- All secret values must be generated independently for production (do not reuse staging secrets).
- Rotation procedures for each secret are documented in sections 11, 12, and 13.

---

## 3. Host Firewall

Ubuntu 24.04 with `ufw`. The production VPS exposes only SSH, HTTP, and HTTPS.

### 3.1 Install and configure ufw

```bash
sudo apt-get install -y ufw
```

### 3.2 Set default policies

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
```

### 3.3 Allow required services

```bash
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
```

If you have moved SSH to a non-standard port (see section 4), replace `22/tcp` with the chosen port:

```bash
# Example: SSH on port 2222
sudo ufw allow 2222/tcp comment 'SSH'
```

### 3.4 Enable the firewall

```bash
sudo ufw --force enable
```

### 3.5 Verify

```bash
sudo ufw status verbose
```

Expected output (or similar, reflecting your SSH port):

```
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)

New profiles: skip

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW IN    Anywhere                   # SSH
80/tcp                     ALLOW IN    Anywhere                   # HTTP
443/tcp                    ALLOW IN    Anywhere                   # HTTPS
22/tcp (v6)                ALLOW IN    Anywhere (v6)              # SSH
80/tcp (v6)                ALLOW IN    Anywhere (v6)              # HTTP
443/tcp (v6)               ALLOW IN    Anywhere (v6)              # HTTPS
```

### 3.6 Notes

- Docker-managed container ports are bound to `0.0.0.0` inside the container network. The `docker-compose.production.yml` web service publishes ports 80 and 443 to the host. `ufw` rules govern host-level access.
- Do not open database (5432), MinIO (9000/9001), PgBouncer, or metrics ports to the public internet. These are container-internal only.
- Prometheus and Grafana (self-hosted observability) must bind to `127.0.0.1` only. Access via SSH tunnel.

---

## 4. SSH Hardening

### 4.1 Harden sshd_config

Edit `/etc/ssh/sshd_config` and ensure the following directives are set:

```
PubkeyAuthentication yes
PasswordAuthentication no
PermitRootLogin no
ChallengeResponseAuthentication no
UsePAM yes
X11Forwarding no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
```

If you wish to move SSH off port 22 (optional but recommended), also set:

```
Port 2222
```

Apply changes:

```bash
sudo systemctl restart sshd
```

If you changed the port, update the firewall (section 3) **before** restarting sshd.

### 4.2 Install and configure fail2ban

```bash
sudo apt-get install -y fail2ban
```

Create `/etc/fail2ban/jail.local`:

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
banaction = ufw

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
```

If SSH is on a non-standard port, change `port = ssh` to `port = 2222` (or your chosen port).

Start and enable:

```bash
sudo systemctl enable --now fail2ban
```

Verify:

```bash
sudo fail2ban-client status sshd
```

### 4.3 Pre-flight checklist

Before closing your current SSH session, open a **second** terminal and confirm you can still connect with key-based auth. Do not close your working session until the new connection succeeds.

---

## 5. Encryption at Rest

### 5.1 Option A: LUKS on the data volume

Use this option when the VPS provider does not offer built-in encryption or when you control the storage layer.

#### Prerequisites

- A secondary block device (e.g. `/dev/sdb` or `/dev/vdb`) for database and object storage data.
- The data volume must not contain any existing data you need.

#### Format the volume

```bash
# Replace /dev/sdb with your actual data device.
sudo cryptsetup luksFormat /dev/sdb
# Enter a strong passphrase when prompted. Store it in your password manager.
sudo cryptsetup luksOpen /dev/sdb tasky_data
sudo mkfs.ext4 /dev/mapper/tasky_data
```

#### Mount at boot

```bash
sudo mkdir -p /mnt/tasky_data
sudo mount /dev/mapper/tasky_data /mnt/tasky_data

# Add to crypttab (opens at boot)
echo 'tasky_data /dev/sdb none luks' | sudo tee -a /etc/crypttab

# Add to fstab
echo '/dev/mapper/tasky_data /mnt/tasky_data ext4 defaults 0 2' | sudo tee -a /etc/fstab
```

#### Point Docker volumes at the encrypted mount

Edit `/opt/tasky/docker-compose.production.yml` to place Docker named volumes on the encrypted mount by adding this at the top level:

```yaml
volumes:
  production_postgres_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /mnt/tasky_data/postgres
  production_wal_archive:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /mnt/tasky_data/wal_archive
  production_minio_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /mnt/tasky_data/minio
```

Create the directories:

```bash
sudo mkdir -p /mnt/tasky_data/{postgres,wal_archive,minio}
sudo chown -R deploy:deploy /mnt/tasky_data
```

### 5.2 Option B: Provider-side encryption attestation

Many VPS providers (Hetzner, DigitalOcean, Vultr, AWS Lightsail) encrypt block storage at rest by default. To use this option:

1. Confirm in the provider dashboard or documentation that the disk/volume has encryption at rest enabled.
2. Record the attestation here:

```
Provider:       <name>
Volume ID:      <id>
Encryption:     <AES-256 / LUKS / provider-managed>
Attested on:    <YYYY-MM-DD>
Attested by:    <operator name>
```

This attestation satisfies P0-04 when the provider documentation clearly states encryption at rest is active.

### 5.3 Key escrow

Regardless of which option is chosen:

- LUKS passphrases or provider encryption keys must be stored in a password manager accessible to the founder and the designated backup on-call contact.
- Never store encryption keys or passphrases on the VPS itself in plaintext.
- Document the escrow location (e.g. "1Password vault: Tasky Production") in the operator's secure notes.

---

## 6. Deploy Procedure

### 6.1 Pre-deploy checks

```bash
# On your local machine, verify CI is green
gh run list --branch main --limit 3 --json conclusion,name | jq '.[].conclusion'
# All must be "success"

# Verify the image tag you're about to deploy
export TAG=v1.0.0  # adjust to the release tag
echo "Deploying tag: $TAG"
```

### 6.2 Build and push images

```bash
# Trigger the build-and-push workflow on main
gh workflow run build-and-push.yml --ref main
# Or push images manually from CI output
```

### 6.3 Deploy to production VPS

```bash
# SSH into the production VPS
ssh deploy@<PRODUCTION_HOST>

cd /opt/tasky

# Pull latest images
docker compose -f docker-compose.production.yml pull

# Deploy with zero-downtime rolling update
docker compose -f docker-compose.production.yml up -d --remove-orphans

# Wait for health check
until curl -sf http://localhost:8080/actuator/health | grep -q UP; do
  echo "Waiting for app health..."
  sleep 5
done
echo "App is healthy."
```

### 6.4 Post-deploy smoke test

```bash
# 1. Health endpoint
curl -s http://localhost:8080/actuator/health | python3 -m json.tool

# 2. Prometheus metrics available
curl -sf http://localhost:8080/actuator/prometheus | grep -c "jvm_memory"

# 3. Web frontend responds
curl -sf -o /dev/null -w "%{http_code}" https://<DOMAIN>/

# 4. Test login flow (use demo account)
curl -s -X POST https://<DOMAIN>/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"<DEMO_PHONE>","code":"<DEMO_CODE>"}' | python3 -m json.tool
```

### 6.5 Record deployment

Log the deployment in the rehearsal log (section below) with timestamp, tag, and smoke test results.

## 7. Rollback Procedure

### 7.1 Quick rollback (previous image)

If a deployment introduces errors, roll back to the previous known-good image immediately.

```bash
# SSH into the production VPS
ssh deploy@<PRODUCTION_HOST>
cd /opt/tasky

# 1. Identify the current and previous image tags
docker compose -f docker-compose.production.yml images app

# 2. Edit .env to set the previous image tag
# For example, if current is v1.1.0 and you want v1.0.0:
# Edit TASKY_APP_IMAGE_TAG=v1.0.0

# 3. Pull the previous image and restart
docker compose -f docker-compose.production.yml pull app
docker compose -f docker-compose.production.yml up -d app --no-deps

# 4. Verify health
until curl -sf http://localhost:8080/actuator/health | grep -q UP; do
  echo "Waiting for rollback to stabilize..."
  sleep 5
done
echo "Rollback complete. App is healthy on previous version."
```

### 7.2 Database rollback (migration reversal)

**WARNING:** Flyway does not support automatic rollback of applied migrations.
If a migration was applied during the failed deploy:

1. **Do NOT roll back the migration manually** unless you have a tested reverse migration.
2. Instead, write a compensating migration (e.g. `V4__revert_X.sql`) that undoes the change.
3. Deploy the compensating migration as part of a hotfix release.

### 7.3 Full environment rollback

If the VPS itself is compromised or broken:

1. Provision a new VPS following section 1 (Bootstrap).
2. Restore the database from the latest backup (section 9).
3. Deploy the last known-good image tag.
4. Update DNS to point to the new VPS IP.

### 7.4 Rollback drill (P1-13)

Perform quarterly or after significant infrastructure changes:

1. Deploy a deliberately-breaking change to staging (e.g., an API endpoint that returns 500).
2. Observe monitoring: the `High5xxRate` alert should fire within 15 minutes.
3. Execute the quick rollback procedure (7.1).
4. Measure total time from alert to restored service.
5. Record evidence in `docs/maintenance/REHEARSAL_LOG.md`.

Target: rollback completed within **15 minutes** of alert firing.

## 8. Backup Verification + Offsite

### Schedule

The `backup-cron` service runs `docker/backup.sh` hourly inside the compose stack.

### Verification steps

1. Confirm the latest dump exists:

   ```bash
   ls -lh docker/backups/tasky-*.dump | tail -5
   ```

2. Verify the dump is restorable (dry-run restore):

   ```bash
   docker exec tasky-postgres pg_restore --list /path/to/latest.dump | head
   ```

3. Check the Prometheus metric:

   ```bash
   curl -s http://localhost:8080/actuator/prometheus | grep tasky_backup_last_success_unixtime
   ```

   If the value is `0`, no backup has succeeded. The `BackupStale` alert fires if no success is recorded within 2 hours.

### Offsite upload

Offsite upload uses an S3-compatible endpoint (any provider). Configure these env vars in `.env`:

```
OFFSITE_S3_ENDPOINT=https://s3.us-east-1.amazonaws.com
OFFSITE_S3_BUCKET=tasky-production-backups
OFFSITE_S3_ACCESS_KEY=<key>
OFFSITE_S3_SECRET_KEY=<secret>
```

If any variable is unset, the script logs a warning and skips upload — the local dump still succeeds.

Upload path: `s3://<bucket>/<YYYYMMDDTHHMMSS>/tasky.dump`

### RPO / RTO

- **RPO** (Recovery Point Objective): ≤ 1 hour (hourly backup interval + WAL archiving)
- **RTO** (Recovery Time Objective): < 4 hours (restore from dump + replay WAL if needed)

## 9. Restore Drill Evidence

### Procedure (run quarterly or after infrastructure changes)

1. Identify the latest production backup:

   ```bash
   LATEST=$(ls -t docker/backups/tasky-*.dump | head -1)
   echo "Restoring from: $LATEST ($(du -h "$LATEST" | cut -f1))"
   ```

2. Create a temporary restore target (do NOT restore into production):

   ```bash
   docker exec -i tasky-postgres createdb -U tasky tasky_restore_test
   ```

3. Restore into the test database:

   ```bash
   docker exec -i tasky-postgres \
     pg_restore -U tasky -d tasky_restore_test --no-owner --no-privileges \
     < "$LATEST"
   ```

4. Verify row counts match expected ranges:

   ```bash
   docker exec tasky-postgres psql -U tasky -d tasky_restore_test -c \
     "SELECT 'users' AS table, count(*) FROM users UNION ALL
      SELECT 'tasks', count(*) FROM tasks UNION ALL
      SELECT 'bookings', count(*) FROM bookings UNION ALL
      SELECT 'messages', count(*) FROM messages;"
   ```

5. Clean up:

   ```bash
   docker exec -i tasky-postgres dropdb -U tasky tasky_restore_test
   ```

6. Record evidence in the table below.

### Evidence log

| Date         | Backup file                  | Rows verified        | Restore time | Operator | Notes                                   |
| ------------ | ---------------------------- | -------------------- | ------------ | -------- | --------------------------------------- |
| _YYYY-MM-DD_ | _tasky-YYYYMMDDTHHMMSS.dump_ | _users: N, tasks: N_ | _Xm Ys_      | _name_   | _e.g., "All tables present, no errors"_ |

## 10. WAL Archive Retention

### Configuration

WAL archiving is enabled in `docker-compose.production.yml` via Postgres parameters:

- `wal_level=replica`
- `archive_mode=on`
- `archive_command=test ! -f /var/lib/postgresql/wal_archive/%f && cp %p /var/lib/postgresql/wal_archive/%f`

WAL files are stored in the `production_wal_archive` Docker volume.

### Prune policy

`docker/backup.sh` prunes WAL archive files older than **7 days** on every run (hourly).

Manual prune (if needed):

```bash
docker exec tasky-postgres \
  find /var/lib/postgresql/wal_archive -type f -mtime +7 -delete
```

### Monitoring

The `BackupStale` Prometheus alert indirectly monitors backup (and WAL prune) health. If backup runs stop, the alert fires within 2 hours.

## 11. Blind-Index Key Rotation

The blind-index key (`TASKY_BLIND_INDEX_KEY`) is used to create searchable hashes of PII columns (e.g. phone numbers). Rotation requires a dual-key migration to maintain searchability during the transition.

### 11.1 Prerequisites

- A maintenance window of approximately 30-60 minutes (depends on data volume).
- SSH access to the production VPS.
- A generated new blind-index key: `openssl rand -hex 32`.

### 11.2 Procedure

#### Step 1: Announce maintenance window

Post a notice to users (if applicable) and alert the on-call backup contact.

#### Step 2: Generate the new key

```bash
NEW_BLIND_INDEX_KEY="$(openssl rand -hex 32)"
echo "New blind index key: $NEW_BLIND_INDEX_KEY"
# Record this key securely in your password manager.
```

#### Step 3: Enable dual-key mode (application code change)

This step requires a code deployment that supports both the old and new blind-index keys simultaneously. The application must:

1. Read both `TASKY_BLIND_INDEX_KEY` (old) and `TASKY_BLIND_INDEX_KEY_NEW` from the environment.
2. On write: index PII columns with the **new** key.
3. On search: match against **both** old and new index values.

Add to `/opt/tasky/.env`:

```bash
TASKY_BLIND_INDEX_KEY_NEW=<new-key-value>
```

#### Step 4: Backfill existing records

Run the backfill process to re-index all existing PII with the new key. This is typically a one-time script or a migration that:

1. Reads each row containing a blind-indexed column.
2. Computes the new blind index using `TASKY_BLIND_INDEX_KEY_NEW`.
3. Writes the new index value to a dedicated new column (e.g. `phone_blind_index_v2`).

```bash
# Example: trigger the backfill via an admin endpoint or CLI command
# This is application-specific; adapt to the actual Tasky migration tooling.
docker compose -f /opt/tasky/docker-compose.production.yml exec app \
  java -cp app.jar \
  -Dtasky.blind-index.backfill=true \
  -Dtasky.blind-index.new-key="$NEW_BLIND_INDEX_KEY" \
  com.tasky.BlindIndexBackfill
```

Monitor the backfill progress. Verify row counts match expectations.

#### Step 5: Swap keys

Once the backfill is complete and verified:

1. Update `/opt/tasky/.env`:

```bash
# Replace old key with new key
TASKY_BLIND_INDEX_KEY=<new-key-value>
# Remove the dual-key variable
# TASKY_BLIND_INDEX_KEY_NEW=   (delete or comment out)
```

2. Deploy a code change that removes the dual-key logic and reads only `TASKY_BLIND_INDEX_KEY`.

#### Step 6: Restart the application

```bash
cd /opt/tasky
docker compose -f docker-compose.production.yml restart app
```

#### Step 7: Verify

```bash
# Check application health
curl -s http://localhost:8080/actuator/health | python3 -m json.tool
# Test a search that uses a blind-indexed field to confirm results return correctly.
```

#### Step 8: Drop old index column (future cleanup)

After the swap has been in production for at least one full business cycle (e.g. 7 days), run a migration to drop the old blind index column. This is a separate, low-urgency task.

---

## 12. JWT Secret Rotation

The JWT secret (`TASKY_JWT_SECRET`) is used to sign and verify access tokens. Rotation is low-risk because tokens have a short TTL (15 minutes by default, configured via `TASKY_ACCESS_TOKEN_TTL_SECONDS=900`).

### 12.1 Prerequisites

- SSH access to the production VPS.
- No maintenance window is strictly required, but performing the rotation during low-traffic hours reduces the number of users who experience a transient 401.

### 12.2 Procedure

#### Step 1: Generate a new secret

```bash
NEW_JWT_SECRET="$(openssl rand -hex 32)"
echo "New JWT secret: $NEW_JWT_SECRET"
# Record this in your password manager.
```

#### Step 2: Update the environment file

```bash
# On the production VPS, edit /opt/tasky/.env
# Replace TASKY_JWT_SECRET with the new value.
sudo -u deploy sed -i "s/^TASKY_JWT_SECRET=.*/TASKY_JWT_SECRET=${NEW_JWT_SECRET}/" /opt/tasky/.env
```

#### Step 3: Restart the application

```bash
cd /opt/tasky
docker compose -f docker-compose.production.yml restart app
```

#### Step 4: Verify

```bash
# Check application health
curl -s http://localhost:8080/actuator/health | python3 -m json.tool

# Attempt a login to confirm new tokens are issued correctly.
```

#### Step 5: Old tokens expire naturally

Access tokens signed with the old secret will fail verification immediately after restart. Clients will receive 401 responses and should automatically prompt for re-authentication using their refresh token (refresh tokens are also signed, so they will likewise fail; the user must re-login). The disruption window is at most the access token TTL of 15 minutes.

### 12.3 Notes

- Refresh tokens (`TASKY_REFRESH_TOKEN_TTL_SECONDS=1209600`, 14 days) are also signed with this secret. After rotation, all existing refresh tokens become invalid. Users with active sessions will need to log in again.
- If this is unacceptable, implement a refresh-token rotation scheme that supports multiple signing keys. For Phase 1, forced re-login on secret rotation is acceptable.

---

## 13. Encryption Key Rotation

The encryption key (`TASKY_ENCRYPTION_KEY`) is used to encrypt sensitive PII fields (e.g. phone numbers). Rotation requires decrypting all data with the old key and re-encrypting with the new key.

### 13.1 Prerequisites

- A maintenance window of approximately 30-60 minutes (depends on data volume).
- The application must be taken offline or put in read-only mode during the re-encryption process to prevent data corruption.
- SSH access to the production VPS.
- A generated new encryption key: `openssl rand -base64 32`.

### 13.2 Procedure

#### Step 1: Announce maintenance window

Post a user-facing notice: "Tasky will be briefly unavailable for scheduled maintenance." Alert the on-call backup contact.

#### Step 2: Generate the new key

```bash
NEW_ENCRYPTION_KEY="$(openssl rand -base64 32)"
echo "New encryption key: $NEW_ENCRYPTION_KEY"
# Record this in your password manager.
```

#### Step 3: Stop the application

```bash
cd /opt/tasky
docker compose -f docker-compose.production.yml stop app web
# Keep postgres and pgbouncer running for the migration.
```

#### Step 4: Re-encrypt all encrypted data

Run a re-encryption script that:

1. Reads every row with encrypted PII columns.
2. Decrypts using the old `TASKY_ENCRYPTION_KEY`.
3. Re-encrypts using the new key.
4. Writes the updated ciphertext back to the database.

```bash
# Example: trigger the re-encryption via a dedicated CLI command.
# Adapt to actual Tasky migration tooling.
docker compose -f docker-compose.production.yml exec app \
  java -cp app.jar \
  -Dtasky.encryption.old-key="$(grep ^TASKY_ENCRYPTION_KEY /opt/tasky/.env | cut -d= -f2)" \
  -Dtasky.encryption.new-key="$NEW_ENCRYPTION_KEY" \
  com.tasky.EncryptionKeyRotation
```

Monitor the process. Verify the number of rows re-encrypted matches expectations.

#### Step 5: Update the environment file

```bash
# Replace TASKY_ENCRYPTION_KEY with the new value in /opt/tasky/.env
sudo -u deploy sed -i "s|^TASKY_ENCRYPTION_KEY=.*|TASKY_ENCRYPTION_KEY=${NEW_ENCRYPTION_KEY}|" /opt/tasky/.env
```

#### Step 6: Start the application

```bash
cd /opt/tasky
docker compose -f docker-compose.production.yml start app web
```

#### Step 7: Verify

```bash
# Check application health
curl -s http://localhost:8080/actuator/health | python3 -m json.tool
# Verify that encrypted fields (e.g. phone numbers) display correctly in the app.
# Search for a known user's phone number to confirm decryption works end-to-end.
```

#### Step 8: Confirm and close the maintenance window

After verifying correctness, remove the user-facing maintenance notice.

### 13.3 Rollback

If the re-encryption fails partway through:

1. Stop the application: `docker compose -f docker-compose.production.yml stop app web`
2. Restore the most recent database backup (see section 9).
3. Revert `.env` to the old `TASKY_ENCRYPTION_KEY`.
4. Start the application: `docker compose -f docker-compose.production.yml start app web`.

---

## 14. Per-Alert Runbook Entries

### APIHealthDown

**Severity:** critical | **Trigger:** API health unreachable for 2 min

**Diagnosis:**

1. Check if the container is running: `docker ps | grep tasky-app`
2. Check container logs: `docker logs tasky-app --tail 100`
3. Check host resources: `free -h`, `df -h`, `top`

**Common causes:**

- OOM kill (check `dmesg | grep oom`)
- Database unreachable (check `docker logs tasky-postgres --tail 50`)
- Failed migration on startup (look for Flyway errors in app logs)

**Remediation:**

- If OOM: restart container, consider increasing Docker memory limits
- If DB issue: check postgres container, restart both if needed
- If migration failure: do NOT roll back migration manually — contact developer

### High5xxRate

**Severity:** critical | **Trigger:** > 5% 5xx errors over 15 min

**Diagnosis:**

1. Identify failing endpoints: `curl -s http://localhost:8080/actuator/prometheus | grep 'status="5'`
2. Check application logs for exceptions: `docker logs tasky-app --since 15m | grep -i "exception\|error" | tail -30`
3. Check DB connectivity: `docker exec tasky-postgres pg_isready`

**Common causes:**

- Database overload (connection pool exhaustion)
- Unhandled exception in new deployment
- External dependency failure (Facebook Graph API)

**Remediation:**

- If after deploy: roll back to previous image
- If DB overload: check for slow queries in Postgres logs
- If external dependency: check provider status page, enable fallback

### FacebookAuthFailures

**Severity:** critical | **Trigger:** > 30% Facebook auth errors over 10 min

**Diagnosis:**

1. Check Facebook API status: https://developers.facebook.com/status/
2. Test token: `curl https://graph.facebook.com/debug_token?input_token=<app-token>`
3. Check app logs for Facebook-specific errors

**Common causes:**

- Facebook app suspended or rate-limited
- App secret rotated but not updated in env
- Facebook API outage

**Remediation:**

- Verify `TASKY_FACEBOOK_APP_ID` and `TASKY_FACEBOOK_APP_SECRET` in `.env`
- If Facebook outage: no action needed, monitor and wait
- If rate limit: reduce auth attempts, notify users

### DiskFreeLow

**Severity:** warning | **Trigger:** < 15% free on root filesystem for 10 min

**Diagnosis:**

1. Check disk usage: `df -h`
2. Find large files: `du -sh /var/lib/docker/* | sort -rh | head -10`
3. Check backup dir: `du -sh docker/backups/`

**Common causes:**

- Old backups not pruned
- Docker images/containers consuming space
- WAL archive growing unbounded

**Remediation:**

- Prune Docker: `docker system prune -f`
- Prune old backups: `find docker/backups -name '*.dump' -mtime +7 -delete`
- Prune WAL: `docker exec tasky-postgres find /var/lib/postgresql/wal_archive -type f -mtime +7 -delete`
- If persistent: resize volume

### BackupStale

**Severity:** warning | **Trigger:** No successful backup for 2+ hours

**Diagnosis:**

1. Check backup-cron container: `docker logs tasky-backup-cron --tail 50`
2. Verify postgres is accessible from backup container: `docker exec tasky-backup-cron pg_isready -h postgres`
3. Check backup dir permissions: `ls -la docker/backups/`

**Common causes:**

- backup-cron container crashed or restarted
- pg_dump failing (DB corruption, disk full)
- Volume mount issue

**Remediation:**

- Restart backup container: `docker compose restart backup-cron`
- If pg_dump fails: check postgres health and disk space
- Run manual backup: `docker/backup.sh`

## 15. On-Call / Paging

### 15.1 Roles

| Role    | Contact                  | Availability                          |
| ------- | ------------------------ | ------------------------------------- |
| Primary | Founder / operator       | 24/7, respond within 15 min for SEV-1 |
| Backup  | Designated backup person | 24/7, respond within 30 min for SEV-1 |

Both contacts must be stored in a shared password manager vault alongside the runbook link.

### 15.2 Paging channel: Telegram bot (Phase 1)

Telegram provides instant push notifications, is free, and requires no infrastructure beyond the bot token. This is the cheapest and fastest paging solution for a small team.

#### Create the Telegram bot

```bash
# 1. Open Telegram, search for @BotFather, and send:
/newbot
# 2. Follow prompts to name the bot (e.g. "Tasky Alerts").
# 3. Record the bot token returned by BotFather (format: 123456:ABC-DEF...).
```

#### Get the chat ID

```bash
# 1. Create a Telegram group or channel (e.g. "Tasky Production Alerts").
# 2. Add the bot to the group and promote it to admin.
# 3. Send a test message in the group.
# 4. Query the bot API to get the chat ID:
curl -s "https://api.telegram.org/bot<BOT_TOKEN>/getUpdates" | python3 -m json.tool
# 5. Record the chat_id from the response (negative number for groups).
```

#### Configure Alertmanager

Edit `/opt/tasky/tooling/observability/alertmanager/alertmanager.yml` and replace the webhook configuration:

```yaml
route:
  receiver: telegram

receivers:
  - name: telegram
    telegram_configs:
      - bot_token: '<BOT_TOKEN>'
        chat_id: <CHAT_ID>
        parse_mode: 'Markdown'
        send_resolved: true
```

Alternatively, keep the existing webhook config and use a lightweight webhook-to-Telegram bridge, or set the `__ALERT_WEBHOOK_URL__` to a Telegram webhook relay.

#### Test message procedure

```bash
# Send a test alert manually:
curl -s -X POST "https://api.telegram.org/bot<BOT_TOKEN>/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{\"chat_id\": <CHAT_ID>, \"text\": \"TEST: Tasky on-call paging channel is live. If you see this, paging works.\"}"

# Verify the message appears in the Telegram group.
```

#### Monthly test

Run the test message procedure once per month to confirm the bot token is still valid and the group is reachable. Record the test timestamp in the operator's maintenance log.

### 15.3 Alert severity routing

- All firing Prometheus alerts are routed to the Telegram group.
- SEV-1 alerts are additionally routed as a direct Telegram message to the primary and backup contacts (configure Alertmanager `group_by` and `routes` as needed).

---

## 16. Incident Response (SEV-1/2/3)

### 16.1 Severity definitions

| Severity | Definition                              | Response time | Examples                                               |
| -------- | --------------------------------------- | ------------- | ------------------------------------------------------ |
| SEV-1    | Launch-critical flow unavailable        | ≤ 15 min      | Login down, all tasks unviewable, DB unreachable       |
| SEV-2    | Core flow degraded but partially usable | ≤ 30 min      | Slow bookings, one auth provider down, high error rate |
| SEV-3    | Non-critical defect with workaround     | ≤ 4 hours     | UI glitch, non-essential feature broken, cosmetic bug  |

### 16.2 SEV-1 response procedure

1. **Acknowledge** — Primary on-call acknowledges the page in the Telegram alerts group.
2. **Assess** — Determine blast radius: how many users are affected? Is data integrity at risk?
3. **Communicate** — Post to the Telegram group: "SEV-1: <brief description>. Investigating."
4. **Mitigate** — First option is rollback (section 7). Do not attempt to fix forward under pressure.
5. **Resolve** — Confirm the fix is working via smoke test (section 6.4).
6. **Post-mortem** — Within 24 hours, write a brief post-mortem:
   - Timeline (UTC timestamps)
   - Root cause
   - What went wrong / what went right
   - Action items (link to GitHub issues)
7. **Store** — File post-mortem in `docs/maintenance/postmortems/YYYY-MM-DD-<title>.md`.

### 16.3 SEV-2 response procedure

1. **Acknowledge** within 30 minutes.
2. **Assess** severity — if escalation to SEV-1 is warranted, upgrade immediately.
3. **Mitigate** — attempt quick fix; if unstable after 30 minutes, roll back.
4. **Resolve** and verify.
5. **Record** — brief incident summary in the Telegram group or ops log.

### 16.4 SEV-3 response procedure

1. **Record** the issue in the GitHub issue tracker with `severity: SEV-3` label.
2. **Prioritize** in the next sprint planning session.
3. No immediate on-call action required.

### 16.5 Escalation path

```
Alert fires → Telegram group → Primary on-call acknowledges
                                   ↓ (no ack in 15 min)
                               Backup on-call paged
                                   ↓ (no ack in 30 min)
                               Founder contacted directly
```

### 16.6 Incident log template

```markdown
## Incident: <title>

- **Date:** YYYY-MM-DD
- **Duration:** X hours Y minutes
- **Severity:** SEV-1/2/3
- **Impact:** <number of users affected, which flows broken>
- **Root cause:** <one-line summary>
- **Resolution:** <what was done>
- **Action items:**
  1. <item> — #issue-number
```

Store completed logs in `docs/maintenance/postmortems/`.

## 17. Capacity Sizing + Cost Model

### 17.1 Recommended VPS specification

| Component  | Recommended | Rationale                                                                                                 |
| ---------- | ----------- | --------------------------------------------------------------------------------------------------------- |
| vCPU       | 4           | Spring Boot JVM + Postgres + Caddy + MinIO + Prometheus/Grafana                                           |
| RAM        | 8 GB        | JVM heap 2G, Postgres shared_buffers 512M, OS + containers ~5.5G                                          |
| Disk (SSD) | 80 GB       | OS + Docker images ~15 GB, Postgres data ~20 GB headroom, MinIO ~30 GB, backups ~10 GB, WAL archive ~5 GB |
| Bandwidth  | 1 Gbps      | Standard on most providers; Phase 1 traffic will not saturate                                             |

Suitable instance classes: Hetzner CX41, DigitalOcean Premium CPU 4GB/8GB, Vultr 4 vCPU / 8 GB.

### 17.2 Expected load envelope (Phase 1)

Phase 1 targets the Ulaanbaatar citywide launch with a small initial user base. Based on the application architecture (Spring Boot + Postgres + PgBouncer connection pool of 30, HikariCP pool of 20):

| Metric                    | Estimate   | Basis                                                         |
| ------------------------- | ---------- | ------------------------------------------------------------- |
| Concurrent users (peak)   | 100-500    | Phase 1 launch in a single city, organic growth               |
| Requests per second (RPS) | 5-20       | Typical CRUD app: ~10-40 req/user-hour, peak factor 3-5x      |
| Database connections      | 20-30      | HikariCP max pool 20 + PgBouncer pool 30                      |
| Media uploads             | Low        | ID verification images and task photos; bursty, not sustained |
| Storage growth            | ~1-2 GB/mo | User data + media + WAL archive                               |

The performance smoke threshold is p95 latency < 500 ms on the health endpoint. The 4 vCPU / 8 GB spec provides comfortable headroom above this baseline.

### 17.3 Monthly cost model

| Line item                          | Provider / Notes                        | Monthly cost |
| ---------------------------------- | --------------------------------------- | ------------ |
| VPS (4 vCPU / 8 GB / 80 GB)        | Hetzner CX41 or equivalent              | ~$40         |
| Offsite backup storage             | Hetzner Storage Box / Backblaze B2 / S3 | ~$5          |
| Sentry (crash reporting)           | Sentry free tier (5K events/mo)         | $0           |
| Domain                             | Annual ~$12, amortized                  | ~$1          |
| Observability (Prometheus/Grafana) | Self-hosted on the same VPS             | $0           |
| Telegram bot (paging)              | Free tier                               | $0           |
| **Total**                          |                                         | **~$46/mo**  |

Notes:

- Observability (Prometheus, Grafana, Alertmanager, postgres-exporter) runs as additional containers on the same VPS. No separate billing.
- The Sentry free tier covers 5,000 events per month, which is sufficient for Phase 1 traffic.
- SSL certificates are handled automatically by Caddy via Let's Encrypt at no cost.
- Domain cost is annual (~$12/year) and amortized to ~$1/month for the cost model.

### 17.4 Scaling triggers

If any of the following are observed, evaluate a VPS upgrade or architecture changes:

- Sustained CPU usage > 70% during peak hours.
- Memory pressure (OOM kills, heavy swap usage).
- Disk usage > 80% on the data volume.
- PgBouncer connection pool saturation (all connections in use for > 5 minutes).
- p95 API latency exceeding the 500 ms threshold consistently.

---

## 18. Cutover Plan

### 18.1 Pre-cutover checklist

Complete all items before starting the cutover:

- [ ] All P0 items resolved (see PRODUCTION_READINESS.md §13)
- [ ] Production runbook complete (zero `_TODO` markers)
- [ ] Staging rehearsal completed and evidence recorded in REHEARSAL_LOG.md
- [ ] Backup verified: latest dump exists and is restorable (section 9)
- [ ] Monitoring stack healthy: Prometheus scraping, Grafana dashboards loaded, Alertmanager routing to Telegram
- [ ] Legal docs published at public URLs (privacy policy, terms of service)
- [ ] App store submissions approved (Google Play + Apple App Store)

### 18.2 DNS cutover

```bash
# 1. Verify the production VPS is reachable and healthy
curl -sf https://<DOMAIN>/actuator/health
curl -sf https://<DOMAIN>/ -o /dev/null -w "%{http_code}\n"

# 2. Update DNS A record to point to the production VPS IP
# Use your DNS provider's dashboard or CLI:
#   Host: @ (or tasky.mn)
#   Type: A
#   Value: <PRODUCTION_VPS_IP>
#   TTL: 300 (5 min — low for quick rollback)

# 3. Wait for DNS propagation (typically 1-5 min with low TTL)
dig +short <DOMAIN>

# 4. Verify via external check
curl -sf https://<DOMAIN>/actuator/health | grep -q UP
```

### 18.3 App store release

```bash
# 1. Submit to Google Play
cd apps/mobile
eas build --platform android --profile production
# Upload AAB to Google Play Console → Production track
# Submit for review

# 2. Submit to Apple App Store
eas build --platform ios --profile production
# Upload IPA via EAS Submit or Transporter
# Submit for review in App Store Connect

# 3. Both stores: set release to "Manual release" to control timing
```

### 18.4 Communications

| When          | Channel      | Message                                                     |
| ------------- | ------------ | ----------------------------------------------------------- |
| T-24h         | Social media | "Tasky launches tomorrow! 🎉 Ulaanbaatar task marketplace." |
| T-0 (cutover) | Social media | "Tasky is live! Download now: <store links>"                |
| T+1h          | Internal     | Verify metrics, check error rates, confirm no SEV-1 alerts  |
| T+24h         | Internal     | Day-2 check-in (see section 19)                             |

### 18.5 Rollback criteria for cutover

Abort or roll back the cutover if:

1. Health endpoint returns non-UP for more than 5 minutes after DNS propagation.
2. Login flow fails for real users (SEV-1 alert fires).
3. App store review rejects the submission — fix and resubmit.
4. DNS rollback: revert A record to previous IP (or a maintenance page).

## 19. Day-2 Plan

### 19.1 First 48 hours after launch

#### Hour 0–4: Intensive watch

- Operator monitors the Telegram alert channel continuously.
- Check dashboards every 30 minutes: error rate, p95 latency, active users.
- Verify backup ran at least once: `curl -s http://localhost:8080/actuator/prometheus | grep tasky_backup`.
- Respond to any SEV-1 or SEV-2 alerts immediately.

#### Hour 4–24: Stabilization

- Review error logs for non-critical issues: `docker logs tasky-app --since 4h | grep -i "warn\|error" | tail -50`.
- Check Sentry for new crash reports. Triage any new issues.
- Verify first backup offsite upload succeeded (check S3 bucket).
- Post status update to the team: user signups, any issues encountered.

#### Hour 24–48: Normalization

- Review Grafana dashboards for trends: is latency stable? Are there spikes?
- Confirm all scheduled backups completed: check for 24 backup files.
- Review user feedback channels (app store reviews, social media).
- If no SEV-1/SEV-2 incidents occurred, declare the launch stable.

### 19.2 Escalation during Day-2

| Condition                        | Action                                     |
| -------------------------------- | ------------------------------------------ |
| SEV-1 alert fires                | Follow SEV-1 procedure (section 16.2)      |
| SEV-2 alert fires                | Follow SEV-2 procedure (section 16.3)      |
| Sustained high error rate (> 5%) | Evaluate rollback (section 7)              |
| User reports data loss           | Stop app, investigate, restore if needed   |
| App store rejection              | Fix issue, resubmit — no VPS action needed |

### 19.3 Rollback criteria during Day-2

Roll back immediately if:

1. Login or session refresh fails for real users (sustained > 5 min).
2. Task creation or booking confirmation shows sustained 5xx (> 5% error rate for > 15 min).
3. Data integrity concern: incorrect data displayed, missing records, or corruption suspected.
4. Performance degradation: p95 latency > 2 seconds sustained for > 15 minutes.

### 19.4 Week-1 review

After the first week post-launch:

- Review all incident logs (if any).
- Check key metrics against SLO targets (see `docs/maintenance/SLO.md`).
- Verify backup restore drill is still passing (run quarterly drill per section 9).
- Plan any hotfixes or minor improvements for the first update release.
- Archive the cutover checklist and update this runbook with any lessons learned.
