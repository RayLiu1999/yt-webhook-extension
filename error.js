// error 頁面的腳本
document.addEventListener('DOMContentLoaded', function() {
  // 從 URL 獲取錯誤訊息
  const urlParams = new URLSearchParams(window.location.search);
  const errorMessage = urlParams.get('message');
  
  const errorContainer = document.getElementById('error-message');
  if (errorMessage) {
    errorContainer.textContent = decodeURIComponent(errorMessage);
  } else {
    errorContainer.textContent = '未知錯誤，請重試。';
  }
  
  // 設置時間戳
  document.getElementById('timestamp').textContent = new Date().toLocaleString('zh-TW');
});

// 返回上一頁功能
function goBack() {
  window.history.back();
}
