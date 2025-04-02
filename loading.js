// loading 頁面的腳本
document.addEventListener('DOMContentLoaded', function() {
  // 顯示處理時間
  let seconds = 0;
  const statusElement = document.querySelector('.status');
  
  setInterval(() => {
    seconds++;
    if (seconds < 60) {
      statusElement.textContent = `已處理 ${seconds} 秒，請耐心等待...`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      statusElement.textContent = `已處理 ${minutes} 分 ${remainingSeconds} 秒，請耐心等待...`;
    }
  }, 1000);
});
