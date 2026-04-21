# Frigate VMS Docker Compose（Fake Mode）跑通手冊

## 目標

在本機先驗證 **SDP -> MQTT Broker -> VMS Topic Transport** 已可用。  
本文件只針對 **Fake Mode 跑通**，不包含 Real Frigate 錄影落地驗證。

---

## 環境與前提

- 專案路徑：`/home/rnd/studio-vms/frigate`
- 服務：
  - `devcontainer`（container name: `frigate`）
  - `mqtt`（image: `eclipse-mosquitto:2.0`）
- MQTT 對外連線：`127.0.0.1:1884`
- MQTT topic prefix：`frigate`

---

## 問題與解法整理

### 1) MQTT 1883 Port 被占用，broker 啟動失敗

**錯誤訊息**
- `failed to bind host port ... 0.0.0.0:1883 ... address already in use`

**解法**
- 修改 `compose.yaml` 的 mqtt port mapping：
  - 從 `1883:1883`
  - 改成 `1884:1883`

**驗證**
- `docker compose ps` 應顯示：`0.0.0.0:1884->1883/tcp`

---

### 2) 只看到 publish topic，不代表 VMS 業務邏輯處理成功

**現象**
- 監聽 `frigate/#` 可看到：
  - `frigate/test/start_recording/set ...`
  - `frigate/test/end_recording/set ...`

**容易誤解**
- 這只代表訊息已進 broker，不等於 VMS 已回覆成功。

**正確做法**
- 額外監聽：
  - `frigate/camera/event_id`（看是否有 event_id / success）
  - `frigate/test/recordings/state`（看狀態有無更新）

---

### 3) `end_recording` 使用 placeholder 導致流程無效

**錯誤示例**
- `-m "<event_id>"`
- `{"event_id":"<REAL_EVENT_ID>"}`

**原因**
- placeholder 是字串，不是真實事件 ID。

**解法**
- 必須先收到真實 `event_id`，再送 `end_recording/set`。

---

### 4) 目前運行在 Fake Mode，不是 Real Recording Pipeline

**關鍵 Log**
- `The fake Frigate service is running...`

**結論**
- 目前可宣告：Fake Mode 的 MQTT transport 驗證通過。  
- 目前不可宣告：錄影檔成功產出或 end-to-end 錄影流程完成。

---

## Fake Mode 跑通執行步驟（逐條命令）

### Step 1: 啟動與確認服務

```bash
cd /home/rnd/studio-vms/frigate
docker compose up -d --build
docker compose up -d --force-recreate mqtt
docker compose ps
```

**預期**
- `frigate` 與 `mqtt` 皆為 `Up`
- `mqtt` port 顯示 `1884->1883`

### Step 2: 確認 Fake Mode Log

```bash
docker compose logs --tail=100 devcontainer
```

**預期**
- 可看到 `The fake Frigate service is running...`

### Step 3: 監聽所有 MQTT topic（觀察 transport）

```bash
mosquitto_sub -h 127.0.0.1 -p 1884 -t "frigate/#" -v
```

### Step 4: 發送 start / end 指令（Fake transport 驗證）

```bash
mosquitto_pub -h 127.0.0.1 -p 1884 -t "frigate/test/start_recording/set" -m "ON"
mosquitto_pub -h 127.0.0.1 -p 1884 -t "frigate/test/end_recording/set" -m "<event_id>"
```

**預期**
- 在 Step 3 視窗看到上述 topic payload。

### Step 5: 做最小安全保護（關閉錄影開關）

```bash
mosquitto_pub -h 127.0.0.1 -p 1884 -t "frigate/test/recordings/set" -m "OFF"
```

**預期**
- 在 Step 3 視窗看到 `frigate/test/recordings/set OFF`

---

## 驗證結果定義（本次可對外說法）

### 可說

- `Fake mode MQTT transport is validated.`
- `Commands can be published and observed via frigate/# topics.`

### 不可說

- `Real recording pipeline is validated.`
- `Recording files are generated successfully.`
- `end_recording success response is confirmed.`

---

## 後續要做（進入 Real Mode 前）

1. 切換到 Real Frigate 程式流程（非 fake service）。
2. 跑一次完整驗證：
   - 收到 `event_id`
   - 收到 `{"msg":"success"}`
   - 檔案落地於 `/media/frigate/recordings` 或 `/media/frigate/exports`
