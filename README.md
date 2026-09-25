# Roman OS - 四合一整合版 v1.2.0-mapping-d1 | 2025-09-26

## 📌 v1.2 最新對應表 (已更正)

| OS 裡顯示 | 原系統名稱 | GitHub Repo | 子路徑 | 說明 |
| :--- | :--- | :--- | :--- | :--- |
| **美容師班表** (原預約系統) | 空檔推薦+快速回覆 | `dick12339-arch/beautician-schedule` | `/booking/index.html` | 來源 `index_5.html` |
| **美容師業績** | 業績熱力圖 | `dick12339-arch/beautician-system` | `/performance/index.html` | 來源 `index_4.html` |
| **同仁班表** | 月班表雲端版 | `dick12339-arch/shift-schedule` | `/schedule/index.html` | 來源 `index_6.html` `shift-scheduler:cache-v4` |
| **羅曼資料區** | 羅曼多分店 | `dick12339-arch/roman-schedule` | `/roman/index.html` | 來源 `index_3.html` `roman_schedule_raw` |

## 結構
```
/ (根)              -> 整合版 v1.2.0-mapping-d1 | 2025-09-26 (四卡 iframe 原版保留)
/bridge/            -> 整合版 v2.1.0-bridge (第二階段連動橋接)
/booking/           -> 原版 beautician-schedule 原封不動 (美容師班表)
/performance/       -> 原版 beautician-system 原封不動 (美容師業績)
/schedule/          -> 原版 shift-schedule 原封不動 (同仁班表)
/roman/             -> 原版 roman-schedule 原封不動 (羅曼資料區)
/functions/api/roman.js -> D1 同步 API
/wrangler.toml      -> D1 綁定設定
```

## 佈署到 Cloudflare Pages
1. 建 D1: `npx wrangler d1 create roman-os-db`
2. 把 database_id 填到 wrangler.toml
3. 建表: `npx wrangler d1 execute roman-os-db --command="CREATE TABLE IF NOT EXISTS roman_data (id TEXT PRIMARY KEY, raw TEXT, site TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);"`
4. Push 到 GitHub，Pages 自動部署，會自動吃到 functions/

## 修改流程
- 改 **美容師班表**: 改 `beautician-schedule` repo -> 複製到 `roman-os/booking/index.html` -> 重建根目錄
- 改 **同仁班表**: 改 `shift-schedule` repo -> 複製到 `roman-os/schedule/index.html` -> 重建根目錄
- 改 **美容師業績**: 改 `beautician-system` -> `roman-os/performance/`
- 改 **羅曼資料區**: 改 `roman-schedule` -> `roman-os/roman/`

## D1 同步
羅曼資料區現在會透過 `/api/roman` 同步到 D1，解決原本無法同步問題。
