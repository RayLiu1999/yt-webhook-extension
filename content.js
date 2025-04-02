// 全局變數，用於追蹤按鈕是否已添加
let downloadButton = null;

// 按鈕狀態記錄
let buttonIsHidden = false;

// 当前設置
let currentSettings = {
  quality: 'highest',
  format: 'mp4'
};

// 獲取當前設置
function getSettings() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
      if (response && response.success && response.settings) {
        currentSettings = response.settings;
        console.log('獲取當前設置:', currentSettings);
      }
      resolve(currentSettings);
    });
  });
}

// 繪製設置標籤
function createSettingsLabel() {
  const formatNames = {
    'mp4': 'MP4',
    'mp3': 'MP3'
  };
  
  const qualityNames = {
    'highest': '最高',
    'high': '高',
    'medium': '中',
    'low': '低'
  };
  
  const formatText = formatNames[currentSettings.format] || currentSettings.format;
  const qualityText = qualityNames[currentSettings.quality] || currentSettings.quality;
  
  return `${qualityText}品質 | ${formatText}`;
}

// 創建下載按鈕的函數
async function createDownloadButton() {
  // 先獲取最新設置
  await getSettings();
  
  // 如果按鈕已存在，先移除它
  if (downloadButton && downloadButton.parentNode) {
    downloadButton.parentNode.removeChild(downloadButton);
  }

  // 提取當前頁面 URL
  const videoUrl = window.location.href;
  const videoTitle = document.title.replace(' - YouTube', '');
  
  // 創建一個新按鈕
  downloadButton = document.createElement('button');
  
  // 設置按鈕內容（圖標+文字）
  downloadButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
    <span>影片下載</span>
    <span style="font-size: 11px; opacity: 0.8; margin-left: 8px; font-weight: normal; background: rgba(0,0,0,0.2); padding: 2px 5px; border-radius: 3px;">${createSettingsLabel()}</span>
  `;
  
  // 設置按鈕樣式
  downloadButton.style.position = 'fixed';
  downloadButton.style.top = '70px';
  downloadButton.style.right = '20px';
  downloadButton.style.zIndex = '9999';
  downloadButton.style.padding = '10px 15px';
  downloadButton.style.backgroundColor = '#ff0000';
  downloadButton.style.color = '#fff';
  downloadButton.style.border = 'none';
  downloadButton.style.borderRadius = '8px';
  downloadButton.style.cursor = 'pointer';
  downloadButton.style.display = 'flex';
  downloadButton.style.alignItems = 'center';
  downloadButton.style.fontWeight = 'bold';
  downloadButton.style.fontSize = '14px';
  downloadButton.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  downloadButton.style.transition = 'all 0.3s ease';
  
  // 添加懸停效果
  downloadButton.addEventListener('mouseover', () => {
    downloadButton.style.backgroundColor = '#cc0000';
    downloadButton.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.2)';
    downloadButton.style.transform = 'translateY(-2px)';
  });
  
  downloadButton.addEventListener('mouseout', () => {
    downloadButton.style.backgroundColor = '#ff0000';
    downloadButton.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    downloadButton.style.transform = 'translateY(0)';
  });
  
  // 添加點擊效果
  downloadButton.addEventListener('mousedown', () => {
    downloadButton.style.transform = 'translateY(1px)';
    downloadButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
  });
  
  downloadButton.addEventListener('mouseup', () => {
    downloadButton.style.transform = 'translateY(-2px)';
    downloadButton.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.2)';
  });
  
  // 設置按鈕 ID
  downloadButton.id = 'youtube-download-button';
  
  // 添加右鍵選單提示
  downloadButton.title = '右鍵點擊修改下載設置 | 按中鍵可以隱藏按鈕';
  
  // 將按鈕添加到頁面
  document.body.appendChild(downloadButton);
  
  // 檢查是否處於全螢幕模式
  const isFullscreen = document.fullscreenElement || 
                     document.webkitFullscreenElement || 
                     document.mozFullScreenElement || 
                     document.msFullscreenElement;
  if (isFullscreen) {
    downloadButton.style.display = 'none';
  }
  
  // 添加右鍵選單事件
  downloadButton.addEventListener('contextmenu', (event) => {
    // 可以在按鈕右鍵選單進行操作，讓默認選單顯示
    console.log('按鈕右鍵選單已顯示');
  });
  
  // 添加中鍵點擊事件(滾輪點擊) - 新實現
  const middleClickHandler = (event) => {
    if (event.button === 1) {
      event.preventDefault();
      event.stopPropagation();
      console.log('中鍵點擊觸發，隱藏按鈕');
      
      try {
        // 直接設置全局變量並儲存狀態
        buttonIsHidden = true;
        localStorage.setItem('youtube_download_button_hidden', 'true');
        
        // 手動隱藏按鈕
        downloadButton.style.display = 'none';
        
        // 顯示辽回按鈕
        showRestoreButton();
        
        console.log('按鈕成功隱藏！');
      } catch (error) {
        console.error('隱藏按鈕時發生錯誤:', error);
      }
      
      return false;
    }
  };
  
  // 同時監聽下列事件
  downloadButton.addEventListener('mousedown', middleClickHandler, true);
  downloadButton.addEventListener('auxclick', middleClickHandler, true);
  downloadButton.addEventListener('mouseup', (event) => {
    if (event.button === 1) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
  
  // 按鈕點擊事件
  downloadButton.addEventListener('click', () => {
    // 在點擊前先獲取最新設置，確保與右鍵選單同步
    chrome.runtime.sendMessage({ action: 'getSettings' }, (settingsResponse) => {
      if (settingsResponse && settingsResponse.success && settingsResponse.settings) {
        // 更新當前設置
        currentSettings = settingsResponse.settings;
        console.log('點擊前獲取的最新設置:', currentSettings);
        
        // 更新按鈕標籤
        const settingsLabel = downloadButton.querySelector('span:last-child');
        if (settingsLabel) {
          settingsLabel.textContent = createSettingsLabel();
        }
      }
      
      // 繼續處理下載點擊
      // 添加確認對話框
      const confirmMessage = `確定要下載這個影片嗎？\n\n標題: ${videoTitle}\nURL: ${videoUrl}\n\n品質: ${createSettingsLabel()}`;
      
      if (confirm(confirmMessage)) {
        console.log('Button clicked, triggering Webhook for URL:', videoUrl);
        downloadButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;" class="loading-icon">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v6l4 2"></path>
          </svg>
          <span>處理中...</span>
        `;
        
        // 添加旋轉動畫
        const loadingIcon = downloadButton.querySelector('.loading-icon');
        if (loadingIcon) {
          loadingIcon.style.animation = 'spin 2s linear infinite';
        }
        
        // 添加 CSS 動畫
        if (!document.getElementById('download-button-styles')) {
          const styleEl = document.createElement('style');
          styleEl.id = 'download-button-styles';
          styleEl.textContent = `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `;
          document.head.appendChild(styleEl);
        }
        downloadButton.disabled = true;
        
        chrome.runtime.sendMessage({ 
          action: 'triggerWebhook', 
          url: videoUrl,
          quality: currentSettings.quality,
          format: currentSettings.format
        }, (response) => {
          if (response && response.success) {
            console.log('Webhook triggered successfully:', response.data);
            downloadButton.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span>成功！</span>
            `;
            
            // 變更按鈕顏色為綠色
            downloadButton.style.backgroundColor = '#4CAF50';
          } else {
            console.error('Webhook failed:', response ? response.error : 'No response');
            downloadButton.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              <span>失敗</span>
            `;
            
            // 變更按鈕顏色為紅色
            downloadButton.style.backgroundColor = '#f44336';
          }
          // 3 秒後恢復按鈕
          setTimeout(() => {
            downloadButton.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>影片下載</span>
            `;
            
            // 恢復原始按鈕顏色
            downloadButton.style.backgroundColor = '#ff0000';
            downloadButton.disabled = false;
            
            // 更新設置標籤
            const settingsLabel = downloadButton.querySelector('span:last-child');
            if (settingsLabel) {
              settingsLabel.textContent = createSettingsLabel();
            }
          }, 3000);
        });
      }
    });
  });
}

// 隱藏按鈕函數
function hideButton() {
  console.log('執行 hideButton 函數');
  if (downloadButton) {
    console.log('隱藏按鈕:', downloadButton);
    buttonIsHidden = true;
    downloadButton.style.display = 'none';
    
    // 將狀態儲存到本地儲存中
    localStorage.setItem('youtube_download_button_hidden', 'true');
    
    // 顯示辽回按鈕
    showRestoreButton();
    
    // 偵測隱藏按鈕後的狀態
    setTimeout(() => {
      if (downloadButton.style.display !== 'none') {
        console.log('警告: 按鈕應該被隱藏但仍然可見');
        // 強制再次設置為隱藏
        downloadButton.style.display = 'none';
      }
    }, 100);
  } else {
    console.log('錯誤: downloadButton 不存在');
  }
}

// 顯示輕微的辽回按鈕
function showRestoreButton() {
  // 移除現有的辽回按鈕（如果存在）
  const existingRestoreButton = document.getElementById('youtube-restore-button');
  if (existingRestoreButton) {
    existingRestoreButton.remove();
  }
  
  // 創建小按鈕來辽回下載按鈕
  const restoreButton = document.createElement('div');
  restoreButton.id = 'youtube-restore-button';
  restoreButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 12h18"/>
      <path d="M12 3v18"/>
    </svg>
  `;
  
  // 設置辽回按鈕樣式
  restoreButton.style.cssText = `
    position: fixed;
    right: 10px;
    bottom: 10px;
    background-color: rgba(255, 0, 0, 0.3);
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 9999;
    opacity: 0.7;
    transition: opacity 0.3s, transform 0.3s, background-color 0.3s;
  `;
  
  // 添加懸停效果
  restoreButton.addEventListener('mouseenter', () => {
    restoreButton.style.opacity = '1';
    restoreButton.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
    restoreButton.style.transform = 'scale(1.1)';
  });
  
  restoreButton.addEventListener('mouseleave', () => {
    restoreButton.style.opacity = '0.7';
    restoreButton.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
    restoreButton.style.transform = 'scale(1)';
  });
  
  // 添加點擊事件來辽回下載按鈕
  restoreButton.addEventListener('click', () => {
    restoreButton.remove();
    buttonIsHidden = false;
    localStorage.removeItem('youtube_download_button_hidden');
    
    // 如果目前處於全螢幕模式，不要顯示按鈕
    const isFullscreen = document.fullscreenElement || 
                       document.webkitFullscreenElement || 
                       document.mozFullScreenElement || 
                       document.msFullscreenElement;
                       
    if (!isFullscreen) {
      if (downloadButton) {
        downloadButton.style.display = 'flex';
      } else {
        createDownloadButton();
      }
    }
  });
  
  // 添加到頁面
  document.body.appendChild(restoreButton);
}

// 檢查是否為 YouTube 影片頁面
function isYouTubeVideoPage() {
  return window.location.href.includes('youtube.com/watch?v=');
}

// 創建樣式元素
function createStyles() {
  if (!document.getElementById('youtube-download-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'youtube-download-styles';
    styleEl.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      
      /* 辽回按鈕鼠標懸停提示 */
      #youtube-restore-button:hover::after {
        content: '顯示下載按鈕';
        position: absolute;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        bottom: 30px;
        right: 0;
      }
      
      /* 全螢幕時隱藏按鈕 */
      :fullscreen ~ #youtube-download-button,
      :-webkit-full-screen ~ #youtube-download-button,
      :-moz-full-screen ~ #youtube-download-button,
      :-ms-fullscreen ~ #youtube-download-button,
      :fullscreen ~ #youtube-restore-button,
      :-webkit-full-screen ~ #youtube-restore-button,
      :-moz-full-screen ~ #youtube-restore-button,
      :-ms-fullscreen ~ #youtube-restore-button {
        display: none !important;
      }
    `;
    document.head.appendChild(styleEl);
  }
}

// 監視全螢幕狀態變化
function initFullscreenObserver() {
  // 監聽全螢幕變化事件
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);
  document.addEventListener('MSFullscreenChange', handleFullscreenChange);
}

// 處理全螢幕狀態變化
function handleFullscreenChange() {
  // 檢查是否處於全螢幕模式
  const isFullscreen = document.fullscreenElement || 
                       document.webkitFullscreenElement || 
                       document.mozFullScreenElement || 
                       document.msFullscreenElement;
  
  // 檢查小加號按鈕
  const restoreButton = document.getElementById('youtube-restore-button');
  
  if (isFullscreen) {
    // 如果是全螢幕，隱藏所有按鈕
    console.log('全螢幕模式，隱藏按鈕');
    if (downloadButton) downloadButton.style.display = 'none';
    if (restoreButton) restoreButton.style.display = 'none';
  } else {
    // 如果不是全螢幕，根據用戶偏好顯示相應按鈕
    console.log('非全螢幕模式');
    
    if (buttonIsHidden) {
      // 如果按鈕被設置為隱藏，則顯示小加號按鈕
      console.log('按鈕被用戶隱藏，顯示辽回按鈕');
      if (downloadButton) downloadButton.style.display = 'none';
      if (!restoreButton) showRestoreButton();
      else if (restoreButton) restoreButton.style.display = 'flex';
    } else {
      // 如果按鈕沒有被隱藏，則顯示主按鈕
      console.log('按鈕未被隱藏，顯示主按鈕');
      if (downloadButton) downloadButton.style.display = 'flex';
      if (restoreButton) restoreButton.style.display = 'none';
    }
  }
}

// 監聽設置更新
function initSettingsListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.action === 'settingsUpdated' && message.settings) {
      console.log('收到設置更新:', message.settings);
      
      // 更新全局設置
      currentSettings = message.settings;
      console.log('更新後的設置:', currentSettings);
      
      // 如果按鈕存在，更新設置標籤
      if (downloadButton) {
        const settingsLabel = downloadButton.querySelector('span:last-child');
        if (settingsLabel) {
          const newLabel = createSettingsLabel();
          console.log('更新按鈕標籤為:', newLabel);
          settingsLabel.textContent = newLabel;
        } else {
          console.warn('找不到設置標籤元素');
        }
      } else {
        console.log('按鈕不存在，無法更新標籤');
      }
    }
    
    return true; // 保持消息通道開放
  });
}

// 初始化 MutationObserver 來監視 URL 變化
function initUrlChangeObserver() {
  let lastUrl = window.location.href;
  
  // 創建一個觀察者來監視 DOM 變化
  const observer = new MutationObserver(() => {
    // 如果 URL 已更改（YouTube 的 SPA 導航）
    if (lastUrl !== window.location.href) {
      lastUrl = window.location.href;
      console.log('URL changed to:', lastUrl);
      
      // 檢查按鈕隱藏狀態
      buttonIsHidden = localStorage.getItem('youtube_download_button_hidden') === 'true';
      
      // 檢查新 URL 是否為影片頁面
      if (isYouTubeVideoPage()) {
        console.log('YouTube video page detected');
        // 給 YouTube 一點時間來更新 DOM
        setTimeout(() => {
          if (buttonIsHidden) {
            console.log('Button should be hidden, showing restore button');
            
            // 清除現有按鈕
            if (downloadButton && downloadButton.parentNode) {
              downloadButton.parentNode.removeChild(downloadButton);
              downloadButton = null;
            }
            
            showRestoreButton();
          } else {
            console.log('Button should be visible, creating download button');
            createDownloadButton();
          }
        }, 1000);
      } else {
        // 如果不是影片頁面，移除所有按鈕
        if (downloadButton && downloadButton.parentNode) {
          downloadButton.parentNode.removeChild(downloadButton);
          downloadButton = null;
        }
        
        const restoreButton = document.getElementById('youtube-restore-button');
        if (restoreButton && restoreButton.parentNode) {
          restoreButton.parentNode.removeChild(restoreButton);
        }
      }
    }
    
    // 檢查是否處於全螢幕模式
    const isFullscreen = document.fullscreenElement || 
                       document.webkitFullscreenElement || 
                       document.mozFullScreenElement || 
                       document.msFullscreenElement;
                       
    // 調用全屏狀態變化處理函數
    handleFullscreenChange();
  });
  
  // 開始觀察整個文檔的變化
  observer.observe(document.body, { childList: true, subtree: true });
}

// 主要初始化函數
async function initialize() {
  console.log('YouTube to n8n Downloader initializing...');
  
  // 創建全局樣式
  createStyles();
  
  // 獲取當前設置
  await getSettings();
  
  // 檢查按鈕隱藏狀態
  buttonIsHidden = localStorage.getItem('youtube_download_button_hidden') === 'true';
  
  // 檢查當前是否為 YouTube 影片頁面
  if (isYouTubeVideoPage()) {
    console.log('YouTube video page detected');
    
    if (buttonIsHidden) {
      console.log('Button is hidden by user preference, showing restore button');
      showRestoreButton();
    } else {
      console.log('Adding download button');
      createDownloadButton();
    }
  }
  
  // 初始化 URL 變化觀察者
  initUrlChangeObserver();
  
  // 初始化全螢幕觀察者
  initFullscreenObserver();
  
  // 初始化設置監聽器
  initSettingsListener();
  
  // 檢查初始狀態是否為全螢幕
  const isFullscreen = document.fullscreenElement || 
                     document.webkitFullscreenElement || 
                     document.mozFullScreenElement || 
                     document.msFullscreenElement;
  if (isFullscreen && downloadButton) {
    downloadButton.style.display = 'none';
  }
}

// 當頁面載入時執行初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  // 如果 DOMContentLoaded 已經觸發，直接初始化
  initialize();
}

// 為了確保在頁面完全載入後按鈕也能正確顯示
window.addEventListener('load', () => {
  if (isYouTubeVideoPage() && (!downloadButton || !downloadButton.parentNode)) {
    console.log('Window loaded, ensuring button is present');
    createDownloadButton();
  }
});