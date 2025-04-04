// 總結頁面的腳本 - 整合載入功能
document.addEventListener('DOMContentLoaded', function() {
  // 取得頁面元素
  const loadingView = document.getElementById('loading-view');
  const summaryView = document.getElementById('summary-view');
  const summaryContent = document.getElementById('summary-content');
  const processTimeEl = document.getElementById('process-time');
  let seconds = 0;
  let checkInterval;
  let timerInterval;
  
  // 初始化頁面 - 預設顯示載入視圖
  loadingView.classList.remove('hidden');
  summaryView.classList.add('hidden');
  
  // 顯示總結視圖函數
  function showSummaryView(summaryData) {
    // 清除載入定時器
    if (checkInterval) clearInterval(checkInterval);
    if (timerInterval) clearInterval(timerInterval);
    
    // 切換視圖
    loadingView.classList.add('hidden');
    summaryView.classList.remove('hidden');
    
    try {
      // 填充總結內容
      if (summaryData.content) {
        summaryContent.textContent = summaryData.content;
      } else {
        summaryContent.innerHTML = '<p>無法解析總結內容。</p>';
      }
      
      // 填充影片資訊
      const videoInfo = document.getElementById('video-info');
      if (summaryData.videoUrl) {
        videoInfo.innerHTML = `
          <p><strong>標題：</strong> ${summaryData.videoTitle}</p>
          <p><strong>URL：</strong> <a href="${summaryData.videoUrl}" target="_blank">${summaryData.videoUrl}</a></p>
        `;
      } else {
        videoInfo.innerHTML = '<p>未提供影片資訊</p>';
      }
      
      // 設置生成時間
      const timestamp = summaryData.timestamp 
        ? new Date(summaryData.timestamp).toLocaleString('zh-TW')
        : new Date().toLocaleString('zh-TW');
      document.getElementById('gen-time').textContent = timestamp;
    } catch (error) {
      console.error('解析數據時出錯:', error);
      summaryContent.innerHTML = `<p>處理總結時發生錯誤：${error.message}</p>`;
    }
  }
  
  // 檢查總結是否已就緒 - 加強版
  function checkSummaryStatus() {
    // 使用提示訊息讓用戶知道正在檢查
    console.log('檢查總結狀態，當前時間：', seconds, '秒');
    
    // 取得更完整的存儲數據資訊
    chrome.storage.local.get(null, function(data) {
      console.log('當前存儲資料：', data);
      
      // 如果已有總結數據，則顯示總結視圖
      if (data.summaryReady === true || (data.currentSummary && Object.keys(data.currentSummary).length > 0)) {
        console.log('已找到總結數據，顯示總結視圖');
        showSummaryView(data.currentSummary);
        return;
      }
      // 如果發生錯誤，顯示錯誤訊息
      else if (data.summaryError) {
        console.log('發現錯誤：', data.summaryError);
        summaryContent.innerHTML = `<p>總結影片時發生錯誤：${data.summaryError}</p>`;
        showSummaryView({ content: `總結影片時發生錯誤：${data.summaryError}` });
        return;
      }
      
      // 特別檢測：直接檢查 chrome.storage.local 中的所有數據
      // 如果發現任何總結相關的數據，則嘗試顯示
      if (seconds > 60) { // 超過 60 秒後嘗試使用混雜檢查模式
        console.log('啟動混雜檢查模式，尋找任何總結相關數據');
        // 嘗試從任何屬性找到總結數據
        for (const key in data) {
          if (key.includes('ummary') && typeof data[key] === 'object' && data[key] !== null) {
            console.log('從', key, '發現數據，嘗試顯示');
            showSummaryView(data[key]);
            return;
          }
        }
      }
    });
  }
  
  // 開始計時
  timerInterval = setInterval(() => {
    seconds++;
    processTimeEl.textContent = seconds;
    
    // 每 15 秒強制清除快取並重新檢查一次
    if (seconds % 15 === 0) {
      console.log('強制清除快取並重新檢查');
      chrome.storage.local.get(null, function(allData) {
        console.log('完整存儲資料(強制檢查):', allData);
        if (allData.currentSummary) {
          showSummaryView(allData.currentSummary);
        }
      });
    }
  }, 1000);
  
  // 定期檢查總結狀態
  checkSummaryStatus(); // 立即檢查一次
  checkInterval = setInterval(checkSummaryStatus, 2000);
  
  // 加入一個安全的自動跳轉機制，確保各種情況下都能正確切換
  setTimeout(() => {
    console.log('安全備用檢查：5秒後重新檢查');
    // 取得完整存儲資訊
    chrome.storage.local.get(null, function(allData) {
      console.log('安全檢查結果：', allData);
      // 如果有任何總結相關的數據，嘗試顯示
      if (allData.summaryReady === true || (allData.currentSummary && Object.keys(allData.currentSummary).length > 0)) {
        showSummaryView(allData.currentSummary);
      }
    });
  }, 5000); // 5 秒後再檢查一次
  
  // 複製按鈕功能
  document.getElementById('copy-btn').addEventListener('click', function() {
    const summaryText = document.getElementById('summary-content').textContent.trim();
    navigator.clipboard.writeText(summaryText)
      .then(() => {
        this.textContent = '已複製！';
        setTimeout(() => {
          this.textContent = '複製總結內容';
        }, 2000);
      })
      .catch(err => {
        console.error('複製失敗:', err);
        this.textContent = '複製失敗';
        setTimeout(() => {
          this.textContent = '複製總結內容';
        }, 2000);
      });
  });
});
