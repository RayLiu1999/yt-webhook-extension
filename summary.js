// 總結頁面的腳本
document.addEventListener('DOMContentLoaded', function() {
  // 顯示載入中訊息
  const summaryContent = document.getElementById('summary-content');
  summaryContent.textContent = '正在載入總結內容...';
  
  // 從 Chrome storage 讀取總結內容
  chrome.storage.local.get(['currentSummary'], function(result) {
    if (result.currentSummary) {
      try {
        const summaryData = result.currentSummary;
        
        // 顯示總結內容
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
    } else {
      summaryContent.innerHTML = '<p>未找到總結數據。請先在 YouTube 頁面上使用「總結影片」功能。</p>';
    }
  });
  
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
