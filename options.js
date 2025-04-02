// 默認設定
const DEFAULT_SETTINGS = {
  // 在此設定默認值
  isOnlineMode: true  // 默認使用線上模式
};

// 配置變數
let CONFIG = {
  WEBHOOK_URLS: {
    online: '',
    local: ''
  }
};

// 載入配置檔案
function loadConfig() {
  return fetch('config.json')
    .then(response => response.json())
    .then(data => {
      CONFIG = data;
      console.log('配置檔案載入成功');
      return CONFIG;
    })
    .catch(error => {
      console.error('載入配置檔案失敗:', error);
    });
}

// 產生當前的 webhook URL
function getCurrentWebhookUrl() {
  return DEFAULT_SETTINGS.isOnlineMode ? CONFIG.WEBHOOK_URLS.online : CONFIG.WEBHOOK_URLS.local;
}

// 初始化時載入配置
loadConfig();

// 當頁面載入完成後執行
document.addEventListener('DOMContentLoaded', function() {
  // 獲取頁面元素
  const apiKeyInput = document.getElementById('api-key');
  const saveButton = document.getElementById('save-button');
  const statusMessage = document.getElementById('status-message');
  const toggleApiKey = document.getElementById('toggle-api-key');
  
  // 添加一個顯示當前模式的元素
  const modeDisplay = document.createElement('div');
  modeDisplay.style.marginTop = '15px';
  modeDisplay.style.fontSize = '13px';
  modeDisplay.style.color = '#666';
  modeDisplay.innerHTML = `
    <span>目前使用 <strong id="mode-text">載入中...</strong> 模式</span>
    <span id="current-url" style="display: block; margin-top: 5px; font-size: 12px; color: #999;"></span>
  `;
  saveButton.parentNode.insertBefore(modeDisplay, saveButton.nextSibling);
  
  // 更新顯示
  function updateModeDisplay() {
    document.getElementById('mode-text').textContent = DEFAULT_SETTINGS.isOnlineMode ? '線上' : '本地';
    document.getElementById('current-url').textContent = 'URL: ' + getCurrentWebhookUrl();
  }
  
  // 從 Chrome 儲存空間載入設定
  chrome.storage.sync.get(['apiKey', 'webhookUrl', 'isOnlineMode'], function(items) {
    console.log('從儲存空間載入設定:', items);
    
    if (items.apiKey) {
      apiKeyInput.value = items.apiKey;
    }
    
    if (items.isOnlineMode !== undefined) {
      // 確保設定規劃成布林值
      DEFAULT_SETTINGS.isOnlineMode = items.isOnlineMode === true;
      console.log('設定模式為: ' + (DEFAULT_SETTINGS.isOnlineMode ? '線上' : '本地') + 
                 ', URL: ' + getCurrentWebhookUrl());
    }
    
    // 在載入設定後更新顯示
    updateModeDisplay();
  });
  
  // 監聽儲存空間變更
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'sync') {
      // 如果 isOnlineMode 變更了
      if (changes.isOnlineMode) {
        console.log('模式已切換，更新選項頁面顯示');
        DEFAULT_SETTINGS.isOnlineMode = changes.isOnlineMode.newValue;
        updateModeDisplay();
      }
    }
  });
  
  // 切換 API Key 的可見性
  toggleApiKey.addEventListener('click', function() {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleApiKey.textContent = '隱藏 API Key';
    } else {
      apiKeyInput.type = 'password';
      toggleApiKey.textContent = '顯示 API Key';
    }
  });
  
  // 儲存設定按鈕點擊事件
  saveButton.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    const webhookUrl = getCurrentWebhookUrl(); // 使用當前模式產生 URL
    
    // 基本驗證
    if (!apiKey) {
      showStatus('請輸入 OpenAI API Key', 'error');
      return;
    }
    
    // 儲存設定到 Chrome 儲存空間
    chrome.storage.sync.set({
      apiKey: apiKey,
      webhookUrl: webhookUrl,
      isOnlineMode: DEFAULT_SETTINGS.isOnlineMode // 保存當前模式
    }, function() {
      // 顯示成功訊息
      showStatus('設定已成功儲存！', 'success');
      
      // 通知 background script 設定已更新
      chrome.runtime.sendMessage({ 
        action: 'settingsUpdated', 
        settings: { 
          apiKey, 
          webhookUrl,
          isOnlineMode: DEFAULT_SETTINGS.isOnlineMode 
        }
      });
      
      // 更新模式顯示
      updateModeDisplay();
    });
  });
  
  // 顯示狀態訊息
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = 'status ' + type;
    statusMessage.style.display = 'block';
    
    // 3秒後自動隱藏訊息
    setTimeout(function() {
      statusMessage.style.display = 'none';
    }, 3000);
  }
});
