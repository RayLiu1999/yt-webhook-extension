# YouTube 下載擴充功能 | YouTube Download Extension

[繁體中文](#繁體中文) | [English](#english)

## 繁體中文

### 簡介

這是一個 Chrome 擴充功能，可以幫助用戶下載 YouTube 影片並提供影片總結功能。擴充功能支援選擇不同的品質和格式進行下載。

### 版本更新

#### v1.3.0
- 改進了影片總結功能，提供更穩定的使用體驗
- 新增 Service Worker Keep-Alive 機制，確保擴充功能定期喪醒不值休眠
- 整合了載入和總結頁面，簡化了使用流程
- 改善了跳轉動態，避免跳轉到載入頁後卡住的問題

### 功能

- 下載 YouTube 影片
- 支援選擇不同的品質（最高、高、中、低）
- 支援不同的格式（MP4、MP3）
- 影片總結功能（改進版）
  - 整合式總結頁面設計，提供更流暢的使用體驗
  - 自動在影片總結完成後顯示結果
  - 英文影片自動轉為中文總結
- 支援線上和本地模式切換
- 後台服務持續運行機制，確保擴充功能穩定運作

### 安裝步驟

1. 下載或克隆此代碼庫
2. 複製 `config.example.json` 為 `config.json` 並填入您的實際配置參數
3. 在 Chrome 瀏覽器中，前往 `chrome://extensions/`
4. 開啟「開發者模式」
5. 點擊「載入未封裝項目」，選擇擴充功能資料夾

### 使用方法

1. 在 YouTube 影片頁面上，會出現一個紅色的下載按鈕
2. 點擊按鈕下載當前影片
3. 右鍵點擊按鈕可以選擇不同的品質和格式
4. 使用快捷鍵 `Command+Shift+6`（Mac）或 `Ctrl+Shift+6`（Windows/Linux）快速下載當前影片
5. 使用快捷鍵 `Command+Shift+9`（Mac）或 `Ctrl+Shift+9`（Windows/Linux）切換線上/本地模式

### 配置

在 `config.json` 中設置以下參數：

```json
{
  "WEBHOOK_URLS": {
    "online": "https://your-online-webhook-url.com/webhook/download-video",
    "local": "http://localhost:5678/webhook/download-video"
  },
  "DOWNLOAD_URL": "https://your-download-base-url.com/",
  "BEARER_TOKEN": "your-bearer-token-here"
}
```

### 開發

1. 修改代碼後，重新載入擴充功能以應用更改
2. 請確保不要將 `config.json` 推送到公共代碼庫

---

## English

### Introduction

This is a Chrome extension that helps users download YouTube videos and provides video summarization functionality. The extension supports selecting different quality and format options for downloads.

### Features

- Download YouTube videos
- Support for different quality options (highest, high, medium, low)
- Support for different formats (MP4, MP3)
- Video summarization functionality
- Support for switching between online and local modes

### Installation

1. Download or clone this repository
2. Copy `config.example.json` to `config.json` and fill in your actual configuration parameters
3. In Chrome browser, go to `chrome://extensions/`
4. Enable "Developer mode"
5. Click "Load unpacked" and select the extension folder

### Usage

1. On a YouTube video page, a red download button will appear
2. Click the button to download the current video
3. Right-click the button to select different quality and format options
4. Use the shortcut `Command+Shift+6` (Mac) or `Ctrl+Shift+6` (Windows/Linux) to quickly download the current video
5. Use the shortcut `Command+Shift+9` (Mac) or `Ctrl+Shift+9` (Windows/Linux) to toggle between online/local modes

### Configuration

Set the following parameters in `config.json`:

```json
{
  "WEBHOOK_URLS": {
    "online": "https://your-online-webhook-url.com/webhook/download-video",
    "local": "http://localhost:5678/webhook/download-video"
  },
  "DOWNLOAD_URL": "https://your-download-base-url.com/",
  "BEARER_TOKEN": "your-bearer-token-here"
}
```

### Development

1. After modifying the code, reload the extension to apply changes
2. Make sure not to push `config.json` to public repositories
