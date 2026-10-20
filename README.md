# 數獨 Sudoku (iOS 原生質感小遊戲 - 零廣告純淨版)

一款專為 iOS 質感精心打造的經典數獨（Sudoku）小遊戲。**100% 無廣告、支援離線遊玩、多種難度選擇、Apple Human Interface Guidelines 設計語言**。

本專案同時支援：
1. **iOS PWA / Web App**：直接在 iPhone Safari 開啟並「加入主畫面」，獲得與原生 App 完全一致的全螢幕無邊框體驗。
2. **Capacitor 跨平台原生打包**：已配置 Capacitor，可一鍵生成 Xcode 原生 iOS 專案打包 `.ipa` 或發布至 TestFlight / App Store。

---

## 🌟 遊戲特色

- **純淨無廣告**：全遊戲無任何橫幅廣告、無插頁影片、無彈出廣告，專注純粹的思考推理。
- **4 種難度等級**：
  - 🟢 **簡單 (Easy)**：提示數約 40 個，適合放鬆與數獨入門新手。
  - 🔵 **中等 (Medium)**：提示數約 32 個，需要基本排除邏輯。
  - 🟠 **困難 (Hard)**：提示數約 27 個，挑戰進階推論技巧。
  - 🔴 **大師 (Expert)**：提示數約 23 個，極少預置線索，數獨高手專屬。
- **iOS 原生極致美學**：
  - Apple SF Pro 字體設計、毛玻璃模糊（Frosted Glass Backdrop Filter）。
  - iOS 分段控制器（Segmented Control）切換難度。
  - 支援 iOS 系統深色模式（Dark Mode）與淺色模式（Light Mode）動態自動跟隨。
  - 適配 iPhone 頂部 Dynamic Island / 瀏海與底部 Home Bar 安全區域（Safe Area Insets）。
- **完整數獨輔助功能**：
  - ✏️ **鉛筆筆記 (Pencil Notes)**：3x3 微型候選數草稿，填入正確數字時自動消除關聯候選數。
  - 💡 **智慧提示 (Smart Hint)**：智慧偵測最可能突破的單元格並給予解析。
  - ↩️ **多步復原 (Undo)**：支援多步撤銷操作。
  - 🧹 **橡皮擦 (Erase)**：快速清除填入數字或筆記。
  - 🎯 **智慧高亮**：點擊數字時高亮全盤相同數字，同行/同列/同九宮格輕柔透亮。
  - ⚠️ **即時衝突警示**：若輸入重複數字，提供即時微幅震動與紅色警告（可選開啟 3 次錯誤上限挑戰）。
- **觸覺與音效體驗**：
  - 使用 Web Audio API 即時合成 Apple 敲擊音、筆記音與勝利和弦，零外置音檔延遲。
  - 支援 iOS 觸覺震動回饋（可隨時於設定中關閉）。
- **統計與進度保存**：
  - 自動存檔（Auto-Save）：隨時退出 Safari 或 App，下次打開無縫繼續。
  - 各難度詳細統計（勝率、已玩場次、最佳過關時間、平均時間）。

---

## 🚀 方式一：在 iPhone 上以 PWA 體驗（推薦，最便捷）

只需將網頁加入 iPhone 桌面，即刻享受無廣告全螢幕原生體驗：

### 1. 啟動本機伺服器
在專案目錄下執行：
```bash
npm start
```
終端機將顯示本機網址與局域網 IP，例如：
`http://192.168.1.100:3000`

### 2. 在 iPhone 上開啟並安裝
1. 確保 iPhone 與電腦連線至同一個 Wi-Fi 網絡。
2. 在 iPhone 上開啟 **Safari 瀏覽器**，網址列輸入電腦的局域網網址（例如 `http://192.168.1.100:3000`）。
3. 點擊 Safari 底部工具列正中間的 **「分享 (Share)」圖示**（一個方框向上箭頭）。
4. 向下滑動並點選 **「加入主畫面 (Add to Home Screen)」**。
5. 點擊右上角「新增」。

> 💡 **完成！** iPhone 桌面上會出現「數獨」專屬 App 圖示，點擊打開即為全螢幕、無 Safari 網址列、無廣告、支援完全離線遊玩的 App！

*(若要遠端隨時隨地開啟，您亦可將此專案免費部署至 Vercel、Cloudflare Pages 或 GitHub Pages，隨時隨處在 iPhone 安裝)*

---

## 📱 方式二：使用 Capacitor 打包為 iOS 原生 App

本專案已完整配置 Capacitor (`@capacitor/core`, `@capacitor/ios`, `@capacitor/cli`)。

### 1. 編譯前端資源
```bash
npm run build
```
此步驟會將網頁資源自動同步打包至 `www/` 目錄。

### 2. 添加 iOS 平台 (需在 Mac 上進行)
```bash
npm run cap:add
```
此命令會在根目錄生成原生 Xcode 專案 `ios/`。

### 3. 同步最新程式碼至 Xcode
每當您修改了網頁代碼後執行：
```bash
npm run cap:sync
```

### 4. 開啟 Xcode
```bash
npm run cap:open
```
Xcode 開啟後，選擇您的 iPhone 真機或 iOS 模擬器，點擊 Run 即可編譯安裝，亦可打包 `.ipa` 發布至 TestFlight。

---

## ⌨️ 鍵盤快捷鍵支援 (電腦瀏覽器遊玩時)

| 按鍵 | 功能說明 |
| :--- | :--- |
| **1 ~ 9** | 填入數字 / 填寫鉛筆筆記 |
| **方向鍵 (↑ ↓ ← →)** | 移動選取九宮格單元格 |
| **N** | 切換 鉛筆筆記 模式 (Notes Mode) |
| **H** | 使用 智慧提示 (Hint) |
| **U** 或 **Ctrl + Z** | 復原上一步 (Undo) |
| **Backspace / Delete** | 擦除目前單元格 (Erase) |
| **P** 或 **Space** | 暫停 / 繼續遊戲 (Pause) |

---

## 📂 專案目錄結構

```text
├── index.html           # 主遊戲頁面 (包含 iOS PWA 標籤、安全邊界佈局)
├── css/
│   ├── ios-theme.css    # Apple HIG 設計系統 (SF Pro、毛玻璃、深淺色色彩變數)
│   └── sudoku.css       # 數獨 9x9 網盤、鍵盤、工具欄與彈窗動畫
├── js/
│   ├── sudoku-engine.js # 數獨生成演算法、求解器、衝突判定與提示引擎
│   ├── audio.js         # iOS Web Audio API 音效與觸覺震動合成模組
│   ├── game.js          # 遊戲狀態機、計時器、多步撤銷、本地儲存與統計
│   └── app.js           # 前端 UI 控制器、鍵盤事件監聽、彈窗與彩帶特效
├── icons/
│   └── app-icon.jpg     # iOS App 專屬精緻應用圖示
├── capacitor.config.json# Capacitor iOS 原生專案配置
├── package.json         # 專案依賴與腳本定義
├── build.js             # Capacitor 打包構建腳本
├── server.js            # 零依賴極速本地預覽伺服器 (含手機局域網 IP 自動檢測)
├── sw.js                # Service Worker 離線快取支援
└── manifest.json        # PWA 安裝配置清單
```

---

## 📄 授權條款
MIT License - 自由使用與修改。
