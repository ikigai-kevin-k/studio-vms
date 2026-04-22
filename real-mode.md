# Frigate VMS Docker Compose (Real Mode) Runbook

## Goal

Validate the real end-to-end flow for:

- Frigate backend startup (real runtime, not fake service)
- MQTT manual recording control (`start_recording` / `end_recording`)
- Event callback confirmation (`frigate/camera/event_id`)
- Export artifact creation on host storage

---

## Environment

- Repo: `/home/rnd/studio-vms/frigate`
- Compose service names:
  - `devcontainer` (container name: `frigate`)
  - `mqtt`
- MQTT exposed host port: `1884` -> container `1883`
- Camera input under test:
  - `rtmp://192.168.20.10:1935/test/Zcam_17_lo.flv`

---

## Issues Encountered and Fixes

### 1) MQTT port 1883 conflict on host

**Symptom**
- Compose failed to start mqtt with `address already in use` on `0.0.0.0:1883`.

**Fix**
- Update `compose.yaml`:
  - from `1883:1883`
  - to `1884:1883`

**Verification**
- `docker compose ps` shows `0.0.0.0:1884->1883/tcp`.

---

### 2) Running fake mode instead of real mode

**Symptom**
- Logs showed `The fake Frigate service is running...`.
- MQTT transport worked, but no real recording processing.

**Root Cause**
- Build target was using a devcontainer/fake-service path.

**Fix**
- Set build target to `frigate` in `compose.yaml`:
  - `build.target: frigate`

---

### 3) Real mode startup failed with `npm: command not found`

**Symptom**
- Container exited from `/entrypoint.sh` at `npm i`.

**Root Cause**
- Real runtime image does not include npm/node, but entrypoint still tried to start frontend dev server.

**Fix**
- Update `entrypoint.sh` to:
  - always start backend: `python3 -m frigate`
  - only run frontend dev server if `npm` exists
  - otherwise run backend-only mode

**Expected Log After Fix**
- `[entrypoint] npm not found, running backend only (real/runtime mode).`

---

### 4) Camera stream unreadable by Frigate (`ffmpeg process is not running`)

**Symptom**
- `Unable to read frames from ffmpeg process`
- `ffmpeg process is not running. exiting capture thread...`

**Debug Findings**
- Host-side stream probe succeeded.
- Stream/args needed adjustment for stable RTMP ingest in Frigate.

**Fix**
- Update `config/config.yml` camera input:
  - Use RTMP URL
  - Add RTMP-friendly `input_args`
  - Enable `record` role and `record.enabled: true`

Current tested config:

```yaml
mqtt:
  host: mqtt

cameras:
  test:
    ffmpeg:
      inputs:
        - path: rtmp://192.168.20.10:1935/test/Zcam_17_lo.flv
          input_args: -rtmp_live live -fflags +genpts+discardcorrupt -flags low_delay
          roles:
            - detect
            - record
    detect:
      height: 1080
      width: 1920
      fps: 5
    record:
      enabled: true
version: 0.17-0
```

---

### 5) False negative when checking exported files on host

**Symptom**
- Host path `/media/frigate/exports/...` looked empty/not found.

**Root Cause**
- Container `/media/frigate` is bind-mounted to host `/mnt/nas_vms` (effective mount).

**Fix**
- Check host files under:
  - `/mnt/nas_vms/exports`
  - not `/media/frigate/exports`

---

## Step-by-Step Execution (Real Mode)

### Step 1: Build and start services

```bash
cd /home/rnd/studio-vms/frigate
docker compose down
docker compose up -d --build
docker compose ps
```

### Step 2: Confirm real runtime startup

```bash
docker compose logs --tail=200 devcontainer
```

Expect:

- `Starting Frigate (dev)`
- `FastAPI started`
- no `The fake Frigate service is running...`

### Step 3: Subscribe for event callbacks

```bash
mosquitto_sub -h 127.0.0.1 -p 1884 -t "frigate/camera/event_id" -v
```

### Step 4: Start manual recording

```bash
mosquitto_pub -h 127.0.0.1 -p 1884 \
  -t "frigate/test/start_recording/set" \
  -m '{"label":"manual","duration":null,"include_recording":true,"round_id":"round-12345"}'
```

Expected callback example:

```json
{"event_id":"1776849713.817798-fcku5v","round_id":"round-12345"}
```

### Step 5: End manual recording with the real event_id

```bash
mosquitto_pub -h 127.0.0.1 -p 1884 \
  -t "frigate/test/end_recording/set" \
  -m '{"event_id":"1776849713.817798-fcku5v","end_time":null,"round_id":"round-12345"}'
```

Expected callback:

```json
{"msg":"success"}
```

### Step 6: Verify output artifacts

Inside container:

```bash
docker exec -it frigate sh -lc 'ls -la /media/frigate/exports | tail -n 20'
```

On host:

```bash
ls -la /mnt/nas_vms/exports
ls -la /mnt/nas_vms/exports/$(date +%F)
```

### Step 7: Safety guard to prevent disk growth

When testing is done, explicitly turn recordings off:

```bash
mosquitto_pub -h 127.0.0.1 -p 1884 -t "frigate/test/recordings/set" -m "OFF"
mosquitto_sub -h 127.0.0.1 -p 1884 -t "frigate/test/recordings/state" -C 1 -W 3 -v
```

Expected:

- `frigate/test/recordings/state OFF`

### Step 8: Periodic storage monitoring (every few minutes)

Run this command every few minutes to ensure storage is not increasing unexpectedly:

```bash
du -sh /mnt/nas_vms/recordings /mnt/nas_vms/exports /mnt/nas_vms/clips
```

Recommended quick checks:

```bash
find /mnt/nas_vms/recordings -type f | wc -l
find /mnt/nas_vms/exports -type f | wc -l
```

---

## Validation Result (Current)

Real mode has been validated for:

- Frigate backend startup in runtime mode
- MQTT `start_recording` -> callback with `event_id`
- MQTT `end_recording` -> callback `{"msg":"success"}`
- Export folder creation under `/media/frigate/exports` (container) and `/mnt/nas_vms/exports` (host mapping)

---

## Common Pitfalls Checklist

- Do not use placeholder `"<REAL_EVENT_ID>"`; use the actual callback value.
- Seeing your own topic in `frigate/#` only proves broker transport, not business success.
- If host check path is wrong (`/media/frigate/...`), you may think exports are missing while they actually exist in `/mnt/nas_vms/...`.
- If you forget to send `recordings/set OFF` after testing, long-running recording behavior may continue and consume disk space over time.
