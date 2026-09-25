# Roman OS - 四合一整合版

## 結構
```
/ (根)              -> 整合版 v1.1.0-preserved-renamed (美容師班表 / 美容師業績 / 同仁班表 / 羅曼資料區)
/bridge/            -> 整合版 v2.1.0-bridge (加上第二階段連動橋接)
/booking/           -> 原版 booking-system 原封不動
/performance/       -> 原版 beautician-system 原封不動
/schedule/          -> 原版 beautician-schedule 原封不動
/roman/             -> 原版 roman-schedule 原封不動
```

## 佈署到 Cloudflare Pages
1. GitHub 新建 repo: roman-os
2. 把此資料夾全部 push
3. Cloudflare Pages -> Connect GitHub -> 選 roman-os
   - Build command: (留空)
   - Output directory: /
4. 部署後網址:
   - https://roman-os.pages.dev/ (整合版)
   - https://roman-os.pages.dev/booking/ (舊預約)
   - https://roman-os.pages.dev/performance/ (舊業績)
   - https://roman-os.pages.dev/schedule/ (舊班表)
   - https://roman-os.pages.dev/roman/ (舊羅曼)

## localStorage 遷移
舊站資料在 github.io 網域，新站在 pages.dev 看不到。
請在舊站匯出 JSON，在新站橋接控制台匯入。
