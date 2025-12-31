// ==========================================
// 灵感采集器 Content Script
// 功能：悬浮球、划词采集、图片采集
// ==========================================

// ==========================================
// 1. 创建悬浮球
// ==========================================
function createFloatingBall() {
    const container = document.createElement('div');
    container.id = 'kc-fab-container';
    
    // 主按钮
    const fab = document.createElement('div');
    fab.id = 'kc-fab-main';
    fab.title = '灵感采集器'; // Tooltip on main button
    
    // 使用单色心形 SVG (与采集按钮一致)
    fab.innerHTML = `<svg viewBox="0 0 24 24" fill="white" style="width: 20px; height: 20px;"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>`;
    
    // 菜单项：灵感库 (打开侧边栏)
    const btnIdeas = createFabItem('灵感库', 
        `<svg viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"></path></svg>`, 
        () => chrome.runtime.sendMessage({ action: 'openSidePanel' })
    );

    // 菜单项：对话 (打开侧边栏并切换到对话 Tab，附带当前页内容)
    const btnChat = createFabItem('对话创作', 
        `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"></path></svg>`, 
        () => {
            const meta = getPageMetadata();
            // 抓取正文：移除噪音标签，获取纯文本，并限制长度
            let pageContent = "";
            
            // 克隆 body 以免修改原页面
            const clone = document.body.cloneNode(true);
            
            // 移除干扰元素
            const selectorsToRemove = [
                'script', 'style', 'noscript', 'iframe', 'svg', 
                'nav', 'header', 'footer', 'aside',
                '.nav', '.header', '.footer', '.sidebar', '.menu', '.ads', '.comment',
                '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]'
            ];
            
            selectorsToRemove.forEach(sel => {
                const elements = clone.querySelectorAll(sel);
                elements.forEach(el => el.remove());
            });
            
            // 尝试获取主要内容容器
            const article = clone.querySelector('article') || 
                            clone.querySelector('[role="main"]') || 
                            clone.querySelector('.post-content') || 
                            clone.querySelector('.article-content') || 
                            clone.querySelector('#content') ||
                            clone; // 兜底使用清洗后的 body
                            
            // 获取文本并规范化空白
            pageContent = article.innerText
                .replace(/\s+/g, ' ')
                .trim();
                
            // 截取前 2000 字
            if (pageContent.length > 2000) {
                pageContent = pageContent.substring(0, 2000) + "...(已截断)";
            }
            
            chrome.runtime.sendMessage({ 
                action: 'openChatWithContext', 
                context: {
                    title: meta.title,
                    url: window.location.href,
                    content: pageContent
                }
            });
        }
    );

    // 菜单项：采集本页 (图标改为采集灵感的图标)
    const btnCollect = createFabItem('采集本页', 
        `<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>`, 
        () => {
            // 采集当前 URL
            const meta = getPageMetadata();
            saveIdea('link_grab', window.location.href, {
                title: meta.title,
                desc: meta.desc
            });
        }
    );

    // 添加到容器 (注意顺序，因为 CSS 是 column-reverse，所以 DOM 顺序是从下往上的)
    // 实际显示顺序(从下到上): Main -> Ideas -> Chat -> Collect
    container.appendChild(fab);
    container.appendChild(btnIdeas);
    container.appendChild(btnChat);
    container.appendChild(btnCollect);
    
    document.body.appendChild(container);
    
    // 拖拽逻辑
    let isDragging = false;
    let startY, startBottom;
    
    // 绑定在 fab 上，拖拽整个容器位置
    fab.addEventListener('mousedown', (e) => {
        // Left click only
        if (e.button !== 0) return;
        
        isDragging = true;
        fab.dataset.dragging = 'false';
        startY = e.clientY;
        const rect = container.getBoundingClientRect();
        startBottom = window.innerHeight - rect.bottom;
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dy = startY - e.clientY; // 向上拖动 dy > 0
        if (Math.abs(dy) > 5) fab.dataset.dragging = 'true';
        
        let newBottom = startBottom + dy;
        newBottom = Math.max(20, Math.min(window.innerHeight - 150, newBottom)); // Adjust max height for expanded menu
        container.style.bottom = `${newBottom}px`;
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    // 点击主按钮逻辑
    fab.addEventListener('click', (e) => {
        if (fab.dataset.dragging === 'true') return;
        e.stopPropagation();
        
        // 1. 点击切换展开/收起 (通过 class)
        container.classList.toggle('expanded');
        
        // 2. 如果已经展开，再次点击可以跳转到帮助页 (用户需求：点击悬浮球打开右侧栏，切到？页)
        // 但为了交互一致性，我们可以在未展开时点击展开，展开时点击关闭？
        // 用户说："点击悬浮球打开右侧栏，切到？页"，这可能指的主按钮的功能。
        // 但同时又要求"鼠标划过悬浮球展开，直到点击球以外的地方收起"。
        // 这两个需求有点冲突：点击主球是展开还是跳转？
        // 结合"点击悬浮球打开右侧栏，切到？页"，可能是在未展开状态下点击？
        // 让我们稍微调整：主球点击始终是打开 Help 页，而展开逻辑改为 Hover 触发？
        // 不，用户第一点说："鼠标划过悬浮球展开，直到点击球以外的其他地方再收起"。
        // 这意味着 Hover 触发展开。
        // 那点击主球呢？"点击悬浮球打开右侧栏，切到？页"。
        // 所以：Hover -> 展开；Click -> 打开Help。
        // 但是 Hover 展开后，点击主球很难不触发 Click。
        // 让我们实现：
        // 1. Hover 触发 container.classList.add('expanded')
        // 2. Click 触发 openHelp
        // 3. Click outside -> remove 'expanded'
        
        // 修正逻辑：
        // 1. 悬浮球默认不展开，Hover 时展开。
        // 2. 点击主球打开 Help。
        // 3. 点击外部收起。
        
        // 实现 Hover 展开：
        // container.addEventListener('mouseenter', () => container.classList.add('expanded'));
        // 但用户说"直到点击球以外的地方再收起"，这暗示展开后会保持状态，不像纯 Hover 那样移出就收起。
        // 这更像是一个"触发式 Hover"。
        
        // 方案：
        // MouseEnter -> Add 'expanded'
        // Click Main -> Open Help
        // Document Click (outside) -> Remove 'expanded'
        
        chrome.runtime.sendMessage({ action: 'openHelp' });
    });
    
    // 鼠标划入展开
    container.addEventListener('mouseenter', () => {
        container.classList.add('expanded');
    });

    // 点击外部收起
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            container.classList.remove('expanded');
        }
    });
}

function createFabItem(title, svgContent, onClick) {
    const item = document.createElement('div');
    item.className = 'kc-fab-item';
    item.dataset.title = title;
    item.innerHTML = svgContent;
    item.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick();
    });
    return item;
}

// ==========================================
// 3. 划词采集
// ==========================================
let collectBtn = null;
let currentSelection = null;
let currentImage = null;
let currentVideo = null;

// 辅助：获取页面元数据
function getPageMetadata() {
    const title = document.title || '';
    const descMeta = document.querySelector('meta[name="description"]');
    const desc = descMeta ? descMeta.content : '';
    return { title, desc };
}

function createCollectBtn() {
    collectBtn = document.createElement('button');
    collectBtn.id = 'kc-collect-btn';
    // 初始不设文本，由 CSS 控制显示 icon
    document.body.appendChild(collectBtn);
    
    collectBtn.addEventListener('mousedown', (e) => {
        e.preventDefault(); // 防止点击按钮导致选区消失
        e.stopPropagation();
        
        // 添加采集中的动画状态
        collectBtn.classList.add('collecting');
        
        // 模拟一小段延时，让用户感知到点击反馈
        setTimeout(() => {
            if (currentSelection) {
                // 采集文本
                const text = currentSelection.toString().trim();
                if (text) {
                    saveIdea('text', text);
                }
                // 成功后由 saveIdea 处理后续 UI
                window.getSelection().removeAllRanges();
            } else if (currentImage) {
                // 采集图片
                saveIdea('image', currentImage.src);
            } else if (currentVideo) {
                // 采集视频
                const meta = getPageMetadata();
                // 优先尝试获取视频特定信息
                const vidTitle = currentVideo.getAttribute('title') || currentVideo.getAttribute('aria-label') || meta.title;
                
                saveIdea('video', currentVideo.src || window.location.href, {
                    title: vidTitle,
                    desc: meta.desc
                });
            }
        }, 300);
    });
}

function showCollectBtn(x, y, type) {
    if (!collectBtn) createCollectBtn();
    
    // 重置状态
    collectBtn.classList.remove('collecting', 'success');
    collectBtn.style.display = 'flex'; // Flex 布局以居中 icon
    
    // 设置 Hover 时的文本 (通过 data 属性或直接 textContent，CSS 处理显隐)
    // 但我们的 CSS 是 font-size: 0; hover -> font-size: 13px;
    // 所以这里直接设置 textContent 是安全的，默认看不见
    
    let label = '采集灵感';
    if (type === 'image') label = '采集图片';
    if (type === 'video') label = '采集视频';
    
    // 技巧：为了保持 ::before 的 icon 不受 textContent 影响，
    // 最好将 icon 和 text 分离，或者依靠 flex 布局
    // 我们的 CSS 是 textContent 会被显示出来
    collectBtn.innerText = label;
    
    collectBtn.style.left = `${x}px`;
    collectBtn.style.top = `${y}px`;
}

function hideCollectBtn() {
    if (collectBtn) collectBtn.style.display = 'none';
    currentSelection = null;
    currentImage = null;
    currentVideo = null;
}

// 监听文本选择
document.addEventListener('mouseup', (e) => {
    // 忽略点击采集按钮本身
    if (e.target.id === 'kc-collect-btn') return;
    
    // 延时处理，确保选区状态稳定
    setTimeout(() => {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        
        if (text.length > 0) {
            currentSelection = selection;
            currentImage = null;
            currentVideo = null;
            
            // 获取选区位置
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            // 显示在选区上方或下方
            const x = rect.left + window.scrollX;
            const y = rect.bottom + window.scrollY + 5;
            
            showCollectBtn(x, y, 'text');
        } else {
            // 如果不是在点击图片/视频，则隐藏按钮
            if (!currentImage && !currentVideo) hideCollectBtn();
        }
    }, 10);
});

// 监听图片/视频 Hover
document.addEventListener('mouseover', (e) => {
    const target = e.target;
    
    // 图片采集
    if (target.tagName === 'IMG') {
        // 过滤小图标
        if (target.width < 100 || target.height < 100) return;
        
        currentImage = target;
        currentVideo = null;
        currentSelection = null;
        
        const rect = target.getBoundingClientRect();
        const x = rect.right + window.scrollX - 80;
        const y = rect.top + window.scrollY + 10;
        
        showCollectBtn(x, y, 'image');
    }
    // 视频采集
    else if (target.tagName === 'VIDEO') {
        if (target.clientWidth < 100 || target.clientHeight < 100) return;
        
        currentVideo = target;
        currentImage = null;
        currentSelection = null;
        
        const rect = target.getBoundingClientRect();
        const x = rect.right + window.scrollX - 80;
        const y = rect.top + window.scrollY + 10;
        
        showCollectBtn(x, y, 'video');
    }
}, true);

// 鼠标离开时隐藏
document.addEventListener('mouseout', (e) => {
    if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') {
        setTimeout(() => {
            if (!collectBtn || collectBtn.matches(':hover')) return;
            if (!currentSelection) {
                currentImage = null;
                currentVideo = null;
                hideCollectBtn();
            }
        }, 100);
    }
});

// ==========================================
// 4. 数据保存
// ==========================================
function saveIdea(type, content, extraData = {}) {
    let title = '划词采集';
    if (type === 'image') title = '图片采集';
    if (type === 'video') title = '视频采集';
    if (type === 'link_grab') title = '网页采集';
    
    // 如果有额外标题信息，优先使用
    if (extraData.title) title = extraData.title;

    const idea = {
        id: Date.now(),
        title: title,
        type: type,
        content: content,
        desc: extraData.desc, // 额外描述
        url: window.location.href, 
        date: new Date().toLocaleDateString()
    };
    
    // 发送给 background 进行保存和分析
    chrome.runtime.sendMessage({
        action: 'saveAndAnalyze',
        data: idea
    });
    
    // 简单的动画反馈
    const btn = document.getElementById('kc-collect-btn');
    if (btn) {
        // 先确保 width 动画完成，再切换 class
        // 或者直接切换，让 CSS transition 处理
        
        btn.classList.remove('collecting');
        
        // 强制重绘以触发新的 transition
        void btn.offsetWidth;
        
        btn.classList.add('success');
        
        // 成功文案
        btn.innerText = '已采集';
        
        // 动画播放完毕后隐藏
        setTimeout(() => {
            btn.classList.remove('success');
            hideCollectBtn();
        }, 1500); // 稍微延长展示时间
    }
}

// 初始化
createFloatingBall();
createCollectBtn();

// 更新采集本页按钮逻辑
function updateFabCollectLogic() {
    // 找到之前的 createFabItem 调用并注入新逻辑不太容易，
    // 但我们可以依赖 createFloatingBall 重新执行或在初始化时正确定义
    // 这里其实不需要额外函数，只需要上面的 createFloatingBall 里的 btnCollect 正确即可。
    // 为了确保生效，我们直接修改 createFloatingBall 中的 btnCollect 定义：
    /*
    const btnCollect = createFabItem('采集本页', 
        `<svg ...></svg>`, 
        () => {
            const meta = getPageMetadata();
            saveIdea('link_grab', window.location.href, {
                title: meta.title,
                desc: meta.desc
            });
        }
    );
    */
}
