document.addEventListener('DOMContentLoaded', () => {
  // 获取当前标签页信息
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    document.getElementById('pageTitle').textContent = currentTab.title;
    
    // 绑定保存按钮
    document.getElementById('saveBtn').addEventListener('click', () => {
      const note = document.getElementById('noteInput').value;
      
      const newIdea = {
        id: Date.now(),
        title: "正在抓取: " + currentTab.title, // Indicate loading
        url: currentTab.url,
        content: "", // Content will be fetched by AI
        note: note,
        status: "pending",
        type: "link_grab", // Force type to link_grab to trigger AI crawl
        date: new Date().toLocaleDateString()
      };

      // Send to background for analysis immediately
      chrome.runtime.sendMessage({ action: 'saveAndAnalyze', data: newIdea });

      // Also save to storage for UI to pick up (although background will also save, 
      // but this ensures immediate feedback if background is slow, 
      // actually background saves it too, so maybe just close?)
      // Let's just close and let background handle the saving/notification via storage listener if needed.
      // But for better UX, we might want to just close.
      
      window.close(); 
    });
  });

  // 打开管理页面
  document.getElementById('openDashboard').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
});
