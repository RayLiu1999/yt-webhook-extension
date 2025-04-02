// 當頁面載入完成後執行
document.addEventListener('DOMContentLoaded', function() {
  // 獲取頁面元素
  const apiKeyDisplay = document.getElementById('api-key-display');
  const webhookUrlDisplay = document.getElementById('webhook-url-display');
  const qualityDisplay = document.getElementById('quality-display');
  const formatDisplay = document.getElementById('format-display');
  const apiKeyStatus = document.getElementById('api-key-status');
  const openOptionsLink = document.getElementById('open-options');
  
  // 從 Chrome 儲存空間載入設定
  chrome.storage.sync.get(['apiKey', 'webhookUrl'], function(items) {
    // 顯示 API Key 狀態
    if (items.apiKey) {
      apiKeyDisplay.textContent = '已設定 (' + maskApiKey(items.apiKey) + ')';
      apiKeyStatus.textContent = 'API Key 已設定，可以正常使用擴充功能。';
      apiKeyStatus.className = 'status success';
    } else {
      apiKeyDisplay.textContent = '未設定';
      apiKeyStatus.textContent = '請先設定 OpenAI API Key 才能使用完整功能。';
      apiKeyStatus.className = 'status warning';
    }
    
    // 顯示 Webhook URL
    if (items.webhookUrl) {
      webhookUrlDisplay.textContent = items.webhookUrl;
    } else {
      webhookUrlDisplay.textContent = '未設定';
    }
  });
  
  // 從 Chrome 儲存空間載入下載設定
  chrome.runtime.sendMessage({ action: 'getSettings' }, function(response) {
    if (response && response.success && response.settings) {
      const settings = response.settings;
      
      // 顯示品質設定
      const qualityNames = {
        'highest': '最高品質',
        'high': '高品質',
        'medium': '中品質',
        'low': '低品質'
      };
      qualityDisplay.textContent = qualityNames[settings.quality] || settings.quality;
      
      // 顯示格式設定
      const formatNames = {
        'mp4': 'MP4 (影片)',
        'mp3': 'MP3 (音訊)'
      };
      formatDisplay.textContent = formatNames[settings.format] || settings.format;
    }
  });
  
  // 開啟設定頁面
  openOptionsLink.addEventListener('click', function(e) {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
  
  // 遮罩 API Key 只顯示前4個和後4個字符
  function maskApiKey(apiKey) {
    if (apiKey.length <= 8) {
      return apiKey;
    }
    return apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4);
  }
});
