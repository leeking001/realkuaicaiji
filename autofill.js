// 监听页面加载
window.addEventListener('load', () => {
  // 解析 URL 参数 (兼容 Search 和 Hash 模式)
  const getParam = (name) => {
    // 1. 尝试从 search 获取 (?key=value)
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has(name)) return searchParams.get(name);
    
    // 2. 尝试从 hash 获取 (#/path?key=value)
    const hash = window.location.hash;
    if (hash.includes('?')) {
        const hashQuery = hash.split('?')[1];
        const hashParams = new URLSearchParams(hashQuery);
        if (hashParams.has(name)) return hashParams.get(name);
    }
    return null;
  };

  const autoTitle = getParam('autoTitle');

  if (autoTitle) {
    console.log("检测到自动填充标题任务:", autoTitle);
    tryFillTitle(autoTitle);
  }
});

function tryFillTitle(title) {
  // 360 快传可能是 SPA (单页应用)，输入框可能延迟加载
  // 我们使用轮询尝试查找输入框
  let attempts = 0;
  const maxAttempts = 40; // 延长到 20 秒

  const interval = setInterval(() => {
    attempts++;
    // 尝试查找常见的标题输入框选择器
    // 1. 根据 placeholder (最准确)
    // 2. 根据 class (el-input__inner 是 ElementUI 常见类名，需要结合上下文)
    // 3. 根据属性 (如 name="title")
    const input = document.querySelector('input[placeholder*="标题"]') || 
                  document.querySelector('textarea[placeholder*="标题"]') ||
                  document.querySelector('input[name="title"]') ||
                  // 尝试查找第一个可见的文本输入框，通常标题在最上面
                  Array.from(document.querySelectorAll('input[type="text"].el-input__inner')).find(el => {
                      const rect = el.getBoundingClientRect();
                      return rect.top > 0 && rect.height > 20; // 简单的可见性检查
                  });

    if (input) {
      clearInterval(interval);
      console.log("找到输入框，正在填充...", input);
      
      // 聚焦
      input.focus();
      
      // 模拟输入 (兼容 Vue/React)
      setNativeValue(input, title);
      
      // 触发事件
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      
    } else if (attempts >= maxAttempts) {
      clearInterval(interval);
      console.log("未找到标题输入框，请手动粘贴。");
      // 兜底：写入剪贴板
      navigator.clipboard.writeText(title).then(() => {
        // 使用自定义样式的 Toast 提示，而不是 alert (alert 会打断用户)
        showToast(`标题已复制，请手动粘贴`);
      }).catch(err => {
          console.error("复制失败", err);
      });
    }
  }, 500);
}

// 辅助函数：设置原生值 (绕过框架的 setter 拦截)
function setNativeValue(element, value) {
    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
    
    if (valueSetter && valueSetter !== prototypeValueSetter) {
        prototypeValueSetter.call(element, value);
    } else {
        valueSetter.call(element, value);
    }
    element.value = value;
}

function showToast(msg) {
    const div = document.createElement('div');
    div.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        background: rgba(0,0,0,0.8); color: white; padding: 10px 20px;
        border-radius: 4px; z-index: 99999; font-size: 14px;
    `;
    div.innerText = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}
