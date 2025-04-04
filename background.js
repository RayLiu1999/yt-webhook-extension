// ==============================================
// Service Worker Keep-Alive 機制
// 確保 Service Worker 不會休眠，避免跳轉問題
// ==============================================

// 設定唤醒間隔時間（毫秒）
// 注意：不要設置太短，以避免使用過多系統資源
// 25 秒是一個更平衡的選擇，這比大多數 Service Worker 的休眠間隔短
// (通常為 30 秒左右)
const KEEP_ALIVE_INTERVAL = 25000;

// Keep-Alive 函數
function keepServiceWorkerAlive() {
  // 記錄唤醒時間戳記
  const now = new Date();
  const timestamp = now.toISOString();
  
  // 將時間存入 chrome.storage
  chrome.storage.local.set({ 'serviceWorkerLastWakeup': timestamp }, function() {
    // 進行一個簡單讀取操作來保持 Service Worker 活躍
    chrome.storage.local.get(['serviceWorkerLastWakeup'], function(data) {
      console.log('服務工作器唤醒成功，時間：', data.serviceWorkerLastWakeup);
    });
  });
}

// 啟動定期唤醒

// 1. 使用 setInterval 進行定期唤醒
const keepAliveInterval = setInterval(keepServiceWorkerAlive, KEEP_ALIVE_INTERVAL);

// 2. 初始化時立即執行一次
keepServiceWorkerAlive();

// 3. 使用備用的定時喚醒機制
// 每 40 秒再次執行一次喚醒，以防主要機制失效
setTimeout(function backupWakeup() {
  console.log('備用定時器喚醒 Service Worker');
  keepServiceWorkerAlive();
  
  // 過一段時間後再次執行
  setTimeout(backupWakeup, 40000);
}, 40000);

// ==============================================
// 默認設置
// ==============================================
let defaultSettings = {
  quality: 'highest',  // 默認品質
  format: 'mp4',       // 默認格式
  apiKey: '',          // OpenAI API Key
  // 初始 URL 會被 loadSettings 操作替換
  webhookUrl: '',      // 初始化時會根據模式設置
  bearerToken: '',     // 從設定檔載入
  downloadUrl: '',     // 從設定檔載入
  isOnlineMode: true   // 默認使用線上模式
};

// 配置變數
let CONFIG = {
  WEBHOOK_URLS: {
    online: '',
    local: ''
  },
  DOWNLOAD_URL: '',
  BEARER_TOKEN: ''
};

// 載入配置檔案
function loadConfig() {
  return fetch('config.json')
    .then(response => response.json())
    .then(data => {
      CONFIG = data;
      console.log('配置檔案載入成功');
      // 更新默認設置
      defaultSettings.bearerToken = CONFIG.BEARER_TOKEN;
      defaultSettings.downloadUrl = CONFIG.DOWNLOAD_URL;
      return CONFIG;
    })
    .catch(error => {
      console.error('載入配置檔案失敗:', error);
    });
}

// 更新 webhook URL 根據當前模式
function updateWebhookUrl() {
  defaultSettings.webhookUrl = defaultSettings.isOnlineMode ? 
    CONFIG.WEBHOOK_URLS.online : CONFIG.WEBHOOK_URLS.local;
  return defaultSettings.webhookUrl;
}

// 初始化時載入配置
loadConfig();

// 創建品質和格式選項的定義
const QUALITY_OPTIONS = [
  { id: 'highest', title: '最高品質' }, 
  { id: 'high', title: '高品質' }, 
  { id: 'medium', title: '中品質' }, 
  { id: 'low', title: '低品質' }
];

const FORMAT_OPTIONS = [
  { id: 'mp4', title: 'MP4 (影片)' }, 
  { id: 'mp3', title: 'MP3 (只有音訊)' }
];

// ===== 輔助函數 =====

/**
 * 檢查 URL 是否為有效的 YouTube 影片 URL
 * @param {string} url - 要檢查的 URL
 * @returns {boolean} - URL 是否有效
 */
function isValidYouTubeUrl(url) {
  return url && url.includes('youtube.com/watch?v=');
}

/**
 * 從 Chrome 儲存空間載入設定
 * @returns {Promise} - 表示載入操作完成的 Promise
 */
function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['apiKey', 'isOnlineMode'], function(items) {
      console.log('從儲存空間載入設定:', items);
      
      if (items.apiKey) {
        defaultSettings.apiKey = items.apiKey;
      }
      
      // 優先處理模式設定
      if (items.isOnlineMode !== undefined) {
        // 確保設定規劃成布林值
        defaultSettings.isOnlineMode = items.isOnlineMode === true;
        console.log('從儲存空間載入模式設定:', defaultSettings.isOnlineMode);
      } else {
        console.log('未在儲存空間找到模式設定，使用默認值:', defaultSettings.isOnlineMode);
      }
      
      // 根據模式更新 webhookUrl
      updateWebhookUrl();
      
      console.log('載入設定後狀態:');
      console.log('API Key ' + (defaultSettings.apiKey ? '已設定' : '未設定'));
      console.log('當前模式: ' + (defaultSettings.isOnlineMode ? '線上' : '本地'));
      console.log('Webhook URL: ' + defaultSettings.webhookUrl);
      
      resolve(defaultSettings);
    });
  });
}

/**
 * 構建 Webhook URL
 * @param {string} videoUrl - YouTube 影片 URL
 * @param {string} quality - 品質設定
 * @param {string} format - 格式設定
 * @param {boolean} summarize - 是否為總結請求
 * @param {string} title - 影片標題（選填）
 * @returns {string} - 構建好的 Webhook URL
 */
function buildWebhookUrl(videoUrl, quality, format, summarize = false, title = '') {
  // 使用設定中的 webhook URL
  const baseWebhookUrl = defaultSettings.webhookUrl;
  
  // 建立含參數的 webhook URL
  let webhookUrl = `${baseWebhookUrl}?url=${encodeURIComponent(videoUrl)}&quality=${quality}&format=${format}`;
  
  // 如果是總結請求，添加 summarize 參數
  if (summarize) {
    webhookUrl += '&summarize=1';
  }
  
  // 如果提供了影片標題，清理並添加到 URL 中
  if (title && title.trim() !== '') {
    // 使用清理函數處理標題
    let cleanTitle = cleanYouTubeTitle(title);
    
    webhookUrl += `&title=${encodeURIComponent(cleanTitle)}`;
    console.log('已添加影片標題到請求 URL');
  }
    
  // 如果有設定 API Key，添加為 token 參數
  if (defaultSettings.apiKey) {
    webhookUrl += `&token=${encodeURIComponent(defaultSettings.apiKey)}`;
    console.log('已添加 API Key 作為 token 參數');
  } else {
    console.warn('未設定 API Key，請求將不包含授權參數');
  }
  
  return webhookUrl;
}

/**
 * 清理 YouTube 標題，移除前面的通知數字和" - YouTube"
 * @param {string} title - 原始 YouTube 標題
 * @returns {string} - 清理後的標題
 */
function cleanYouTubeTitle(title) {
  if (!title) return '';
  
  // 移除標題前面的通知數字，如 "(2) "，"(10) "等
  let cleanedTitle = title.replace(/^\([0-9]+\)\s+/, '');
  
  // 移除標題後面的" - YouTube"
  cleanedTitle = cleanedTitle.replace(/ - YouTube$/, '');
  
  if (cleanedTitle !== title) {
    console.log('已清理 YouTube 標題，從', title, '到', cleanedTitle);
  }
  
  return cleanedTitle;
}

/**
 * 構建 HTTP 請求標頭
 * @returns {Object} - 請求標頭物件
 */
function buildRequestHeaders() {
  const headers = {
    'Accept': 'application/json, text/plain, */*'
  };

  // 添加 Authorization 標頭
  headers['Authorization'] = `Bearer ${defaultSettings.bearerToken}`;
  
  return headers;
}

/**
 * 顯示錯誤頁面
 * @param {string} message - 錯誤訊息
 */
function showErrorPage(message) {
  chrome.tabs.create({ url: 'error.html?message=' + encodeURIComponent(message) });
}

/**
 * 處理 webhook 響應
 * @param {Object} jsonData - 響應的 JSON 資料
 * @param {Function} sendResponse - 用於回傳訊息的函數
 */
function handleDownloadResponse(jsonData, sendResponse) {
  // 檢查是否有線上檔案可下載
  if (jsonData.data && parseInt(jsonData.data.online) === 1 && jsonData.data.download_file_name) {
    console.log('檢測到可下載檔案:', jsonData.data.download_file_name);
    
    // 構建完整的下載 URL
    const downloadFileUrl = `${defaultSettings.downloadUrl}${jsonData.data.download_file_name}`;
    console.log('下載檔案 URL:', downloadFileUrl);
    
    // 使用 Chrome 下載 API 下載檔案
    chrome.downloads.download({
      url: downloadFileUrl,
      filename: jsonData.data.download_file_name,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('下載檔案錯誤:', chrome.runtime.lastError);
        if (sendResponse) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        }
      } else {
        console.log('檔案下載已開始，下載 ID:', downloadId);
        if (sendResponse) {
          sendResponse({ success: true, downloadId });
        }
      }
    });
  }
  
  if (sendResponse) {
    sendResponse({ success: true, data: jsonData });
  }
}

/**
 * 執行 YouTube 影片總結
 * @param {string} videoUrl - YouTube 影片 URL
 * @param {string} videoTitle - 影片標題
 */
function summarizeVideo(videoUrl, videoTitle) {
  // 確保 URL 有效
  if (!isValidYouTubeUrl(videoUrl)) {
    console.error('Invalid YouTube URL for summarize:', videoUrl);
    showErrorPage('無效的 YouTube URL');
    return;
  }
  
  // 取得影片 ID
  const videoId = new URL(videoUrl).searchParams.get('v');
  if (!videoId) {
    console.error('無法從 URL 提取影片 ID:', videoUrl);
    showErrorPage('無法識別影片 ID');
    return;
  }
  
  // 清除舊的總結數據，避免顯示舊數據
  console.log('清除舊總結數據，準備處理新影片:', videoId);
  chrome.storage.local.remove(['currentSummary', 'summaryReady'], function() {
    // 存儲當前正在處理的影片 ID，用於後續驗證
    chrome.storage.local.set({ 'currentProcessingVideoId': videoId });
    
    // 先從儲存空間重新獲取最新的設定
    loadSettings().then(() => {
      // 建立含參數的 webhook URL (固定使用mp3格式並添加summarize=1參數及影片標題)
      const webhookUrl = buildWebhookUrl(videoUrl, defaultSettings.quality, 'mp3', true, videoTitle);
      
      console.log('發送總結請求至:', webhookUrl);
      
      // 準備請求標頭
      const headers = buildRequestHeaders();
      
      // 先創建一個新分頁並直接開啟 summary.html
      chrome.tabs.create({ url: 'summary.html' }, (newTab) => {
      // 先嘗試正常模式，如果失敗則回退到 no-cors 模式
      fetch(webhookUrl, {
        method: 'GET',
        headers: headers,
        // 添加逾時設定
        signal: AbortSignal.timeout(300000) // 5 分逾時
      })
      .catch(error => {
        console.log('正常模式請求失敗，嘗試使用 no-cors 模式:', error);
        // 如果是 CORS 錯誤，嘗試使用 no-cors 模式
        if (error.toString().includes('CORS') || error.toString().includes('Failed to fetch')) {
          return fetch(webhookUrl, {
            method: 'GET',
            headers: headers,
            mode: 'no-cors' // 使用 no-cors 模式
          });
        }
        throw error;
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
      })
      .then(data => {
          console.log('總結回應:', data);
          const jsonData = JSON.parse(data);
          if (jsonData.status !== 'success') {
            throw new Error(jsonData.message || '總結失敗');
          }
          
        console.log('總結回應:', jsonData.data.content);
        
        // 將總結內容存入 Chrome storage
        const summaryData = {
          content: jsonData.data.content,
          videoTitle,
          videoUrl,
          timestamp: new Date().toISOString(),
          videoId: new URL(videoUrl).searchParams.get('v') // 存儲影片 ID 以便驗證
        };

        console.log('總結資料:', summaryData);
        
        // 存入總結資料並設置 summaryReady 標記
        chrome.storage.local.set({ 
          'currentSummary': summaryData,
          'summaryReady': true, // 標記總結已準備好可顯示
          'pendingSummaryTabId': newTab.id, // 存儲分頁 ID
          'lastUpdated': Date.now() // 添加時間戳以助判斷新舊
        }, function() {
          console.log('總結已存入 storage，summaryReady 已設置為 true');
          // 將回應內容顯示在新分頁中
          chrome.tabs.update(newTab.id, { 
            url: 'summary.html' // 不再傳遞參數
          });
        });
      })
      .catch(error => {
        console.error('總結影片錯誤:', error);
          chrome.tabs.update(newTab.id, { 
            url: 'error.html?message=' + encodeURIComponent('總結影片失敗: ' + error.message) 
          });
      });
    });
  });
  });
}

/**
 * 處理影片下載請求
 * @param {string} videoUrl - YouTube 影片 URL
 * @param {string} quality - 品質設定
 * @param {string} format - 格式設定
 * @param {boolean} summarize - 是否為總結請求
 * @param {Function} sendResponse - 用於回傳訊息的函數
 */
function handleVideoDownload(videoUrl, quality, format, summarize, sendResponse) {
  // 確保 URL 有效
  if (!isValidYouTubeUrl(videoUrl)) {
    console.error('Invalid YouTube URL:', videoUrl);
    if (sendResponse) {
      sendResponse({ success: false, error: '無效的 YouTube URL' });
    }
    return;
  }
  
  // 建立含參數的 webhook URL
  const webhookUrl = buildWebhookUrl(videoUrl, quality, format, summarize);
  
  console.log('Sending Webhook request to:', webhookUrl);
  
  // 準備請求標頭
  const headers = buildRequestHeaders();

  fetch(webhookUrl, {
    method: 'GET',
    headers: headers
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.text();
    })
    .then(data => {
      console.log('Webhook response:', data);
      
      // 檢查回應是否為空或空白字符
      if (!data || data.trim() === '') {
        console.log('伺服器返回空回應');
        if (sendResponse) {
          sendResponse({ success: true, message: '下載請求已發送' });
        }
        return;
      }
      
      // 如果回應以 // 或 /* 開頭，可能是 JavaScript 而不是 JSON
      if (data.trim().startsWith('//') || data.trim().startsWith('/*')) {
        console.log('伺服器回應不是 JSON 格式，可能是 JS 代碼');
        if (sendResponse) {
          sendResponse({ success: true, message: '下載請求已處理' });
        }
        return;
      }
      
      try {
        const jsonData = JSON.parse(data);
        handleDownloadResponse(jsonData, sendResponse);
      } catch (error) {
        console.error('解析 JSON 回應錯誤:', error);
        console.log('回應內容:', data.substring(0, 100) + (data.length > 100 ? '...' : ''));
        
        // 返回非 JSON 回應
        if (sendResponse) {
          sendResponse({ 
            success: true, 
            message: '伺服器回應已收到，但不是 JSON 格式', 
            rawData: data.substring(0, 100) // 只返回前 100 個字符
          });
        }
      }
    })
    .catch(error => {
      console.error('Error triggering Webhook:', error);
      if (sendResponse) {
        sendResponse({ success: false, error: error.message });
      }
    });
}

// ===== 事件處理 =====

/**
 * 創建右鍵選單
 */
function createContextMenus() {
  // 先刪除現有的選單
  chrome.contextMenus.removeAll(() => {
    // 創建主選單
    chrome.contextMenus.create({
      id: 'youtube-download-options',
      title: '影片下載選項',
      contexts: ['page', 'link', 'video']
    });
    
    // 創建影片總結選項
    chrome.contextMenus.create({
      id: 'youtube-summarize',
      title: '總結影片',
      contexts: ['page', 'link', 'video']
    });
    
    // 創建品質選項選單
    chrome.contextMenus.create({
      id: 'youtube-download-quality',
      parentId: 'youtube-download-options',
      title: '品質',
      contexts: ['page', 'link', 'video']
    });
    
    // 創建格式選項選單
    chrome.contextMenus.create({
      id: 'youtube-download-format',
      parentId: 'youtube-download-options',
      title: '格式',
      contexts: ['page', 'link', 'video']
    });
    
    // 創建品質選項
    QUALITY_OPTIONS.forEach(quality => {
      chrome.contextMenus.create({
        id: `quality-${quality.id}`,
        parentId: 'youtube-download-quality',
        title: quality.title,
        type: 'radio',
        checked: defaultSettings.quality === quality.id,
        contexts: ['page', 'link', 'video']
      });
    });
    
    // 創建格式選項
    FORMAT_OPTIONS.forEach(format => {
      chrome.contextMenus.create({
        id: `format-${format.id}`,
        parentId: 'youtube-download-format',
        title: format.title,
        type: 'radio',
        checked: defaultSettings.format === format.id,
        contexts: ['page', 'link', 'video']
      });
    });
  });
}

// 處理右鍵選單點擊事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId.startsWith('quality-')) {
    const quality = info.menuItemId.replace('quality-', '');
    defaultSettings.quality = quality;
    console.log(`品質已設置為: ${quality}`);
    // 通知內容腳本設置已更改
    chrome.tabs.sendMessage(tab.id, { action: 'settingsUpdated', settings: defaultSettings });
  } else if (info.menuItemId.startsWith('format-')) {
    const format = info.menuItemId.replace('format-', '');
    defaultSettings.format = format;
    console.log(`格式已設置為: ${format}`);
    // 通知內容腳本設置已更改
    chrome.tabs.sendMessage(tab.id, { action: 'settingsUpdated', settings: defaultSettings });
  } else if (info.menuItemId === 'youtube-summarize') {
    // 獲取當前影片URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      summarizeVideo(tabs[0].url, cleanYouTubeTitle(tabs[0].title));
    });
  }
});

// 操作初始化
chrome.runtime.onInstalled.addListener(() => {
  createContextMenus();
  
  // 從儲存空間載入設定
  loadSettings();
});

// 處理來自 content script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  
  if (message && message.action === 'getSettings') {
    // 先確保 URL 與當前模式一致
    updateWebhookUrl();
    
    // 返回當前設置 (不包含 API Key)
    const safeSettings = {
      quality: defaultSettings.quality,
      format: defaultSettings.format,
      webhookUrl: defaultSettings.webhookUrl,
      bearerToken: defaultSettings.bearerToken,
      isOnlineMode: defaultSettings.isOnlineMode,
      hasApiKey: !!defaultSettings.apiKey // 只傳遞是否有 API Key 的狀態，不傳遞 Key 本身
    };
    sendResponse({ success: true, settings: safeSettings });
    return true;
  }
  else if (message && message.action === 'settingsUpdated' && message.settings) {
    console.log('收到設定更新消息:', message.settings);
    
    // 更新 API Key
    if (message.settings.apiKey !== undefined) {
      defaultSettings.apiKey = message.settings.apiKey;
    }
    
    // 處理模式設定
    if (message.settings.isOnlineMode !== undefined) {
      defaultSettings.isOnlineMode = message.settings.isOnlineMode === true;
      console.log('模式設定已更新為: ' + (defaultSettings.isOnlineMode ? '線上' : '本地'));
      
      // 更新 URL
      updateWebhookUrl();
    }
    
    console.log('設定已更新:');
    console.log('API Key: ' + (defaultSettings.apiKey ? '已設定' : '未設定'));
    console.log('當前模式: ' + (defaultSettings.isOnlineMode ? '線上' : '本地'));
    console.log('Webhook URL: ' + defaultSettings.webhookUrl);
    return true;
  }
  else if (message && message.action === 'triggerWebhook' && message.url) {
    // 取得品質和格式參數
    const quality = message.quality || defaultSettings.quality;
    const format = message.format || defaultSettings.format;
    const summarize = message.summarize ? 1 : 0;
    
    handleVideoDownload(message.url, quality, format, summarize, sendResponse);
    return true; // 保持消息通道開放以進行異步回應
  } else {
    console.error('Invalid message format or missing data');
    sendResponse({ success: false, error: '無效的消息格式或缺少數據' });
    return true;
  }
});

// 處理鍵盤快捷鍵
chrome.commands.onCommand.addListener((command) => {
  // 處理切換 webhook URL 的命令
  if (command === "toggle-webhook-url") {
    // 切換線上/本地模式
    defaultSettings.isOnlineMode = !defaultSettings.isOnlineMode;
    
    // 更新 webhook URL
    updateWebhookUrl();
    
    console.log('快捷鍵已切換模式為: ' + (defaultSettings.isOnlineMode ? '線上' : '本地'));
    console.log('新的 Webhook URL: ' + defaultSettings.webhookUrl);
    
    // 儲存設定到 Chrome 儲存空間 (只儲存模式, 不儲存 URL)
    chrome.storage.sync.set({
      isOnlineMode: defaultSettings.isOnlineMode
    }, function() {
      console.log('模式已儲存到儲存空間: ' + (defaultSettings.isOnlineMode ? '線上' : '本地'));
      
      // 顯示通知
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon128.png',
        title: 'Webhook 模式已切換',
        message: `已切換到${defaultSettings.isOnlineMode ? '線上' : '本地'}模式\nURL: ${defaultSettings.webhookUrl}`,
        priority: 2
      });
    });
  }
  // 處理下載影片的命令
  else if (command === "trigger-download") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const videoUrl = tabs[0].url;
      const videoTitle = cleanYouTubeTitle(tabs[0].title);
      
      // 確保 URL 有效
      if (!isValidYouTubeUrl(videoUrl)) {
        console.error('無效的 YouTube URL:', videoUrl);
        return;
      }
      
      // 顯示通知，讓用戶知道快捷鍵已觸發
      if (command === "trigger-download") {
        // 顯示正在下載的通知
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon128.png',
          title: '正在下載影片',
          message: `標題: ${videoTitle}\n品質: ${defaultSettings.quality}\n格式: ${defaultSettings.format}`,
          priority: 2
        });
      }
      
      // 觸發下載
      handleVideoDownload(videoUrl, defaultSettings.quality, defaultSettings.format, false, (response) => {
        console.log('下載已觸發:', response);
        // 快捷鍵下載不顯示通知，只記錄到日誌
      });
    });
  }
});
