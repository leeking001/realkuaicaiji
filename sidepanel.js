// ==========================================
// 1. 全局配置
// ==========================================
const ICONS = {
    add: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
    send: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`,
    clear: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
    copy: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
    retry: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
    delete: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
    chat: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`,
    type_text: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
    type_image: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
    type_link: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`
};

let currentIdeaId = null;
let activeIdeaContext = null; // 用于存储当前引用的灵感上下文
let currentFilter = 'all'; // 当前灵感筛选类型

// ==========================================
// 2. 初始化
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
        .filter-chip {
            font-size: 12px;
            padding: 4px 12px;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.1); /* Dark mode default */
            color: var(--text-sub);
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid transparent;
        }
        @media (prefers-color-scheme: light) {
            .filter-chip {
                background: #f0f0f0;
                color: #666;
            }
        }
        .filter-chip:hover {
            background: rgba(255, 255, 255, 0.2);
            color: var(--text-main);
        }
        @media (prefers-color-scheme: light) {
            .filter-chip:hover {
                background: #e6e6e6;
                color: #333;
            }
        }
        .filter-chip.active {
            background: rgba(24, 144, 255, 0.2);
            color: #40a9ff;
            border-color: rgba(24, 144, 255, 0.3);
            font-weight: 500;
        }
        @media (prefers-color-scheme: light) {
            .filter-chip.active {
                background: #e6f7ff;
                color: #1890ff;
                border-color: #91d5ff;
            }
        }
    `;
    document.head.appendChild(style);

    // 初始化图标
    const btnAdd = document.getElementById('btnAdd');
    if (btnAdd) btnAdd.innerHTML = ICONS.add;
    
    const btnSendChat = document.getElementById('btnSendChat');
    if (btnSendChat) btnSendChat.innerHTML = ICONS.send;
    
    const btnClearChat = document.getElementById('btnClearChat');
    if (btnClearChat) btnClearChat.innerHTML = ICONS.clear;

    // 初始化登录界面
    initLoginPanel();

    // 检查登录状态
    const isLoggedIn = await checkLoginStatus();
    if (isLoggedIn) {
        showMainPanel();
        loadIdeas();
    } else {
        showLoginPanel();
    }
    setupTabs();
    setupFilters();
  setupAddPanel();
    setupChat();
    setupHelp();
});

// ==========================================
// 2.5. 设置逻辑
// ==========================================
function setupSettings() {
    // 设置功能已移除，使用硬编码 Key
}

// ==========================================
// 2.6. 帮助逻辑
// ==========================================
function setupHelp() {
    // 帮助按钮现在是 Tab 之一，逻辑已由 setupTabs 接管
    // 这里如果需要额外处理（如 iframe 刷新），可以在这里添加
    // 目前不需要做任何事，保留空函数或移除
}

// ==========================================
// 3. Tab 切换逻辑
// ==========================================
function setupTabs() {
    const tabs = document.querySelectorAll('.tab-item');
    const views = document.querySelectorAll('.view-container');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 切换 Tab 样式
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // 切换视图
            const targetId = tab.dataset.tab;
            views.forEach(view => {
                if (view.id === targetId) {
                    view.style.display = 'flex';
                } else if (view.id !== 'view-login') { // 保持 login 逻辑独立
                    view.style.display = 'none';
                }
            });
        });
    });
}

// 筛选器逻辑
function setupFilters() {
    const chips = document.querySelectorAll('.filter-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            // 更新 UI
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            
            // 更新状态
            currentFilter = chip.dataset.type;
            
            // 重新渲染列表
            loadIdeas();
        });
    });
}

// ==========================================
// 4. 灵感列表管理
// ==========================================
function loadIdeas() {
    chrome.storage.local.get(['ideas'], (result) => {
        const ideas = result.ideas || [];

        // 过滤灵感
        const filteredIdeas = currentFilter === 'all' 
            ? ideas 
            : ideas.filter(idea => {
                // 兼容性处理：部分老数据可能没有 type
                const type = idea.type || 'text';
                return type === currentFilter;
            });

        renderIdeas(filteredIdeas);
    });
}

function renderIdeas(ideas) {
    const list = document.getElementById('ideasList');
    if (!list) return;
    
    list.innerHTML = '';

    if (ideas.length === 0) {
        list.innerHTML = `<div class="empty-state">
            <p>还没有采集任何灵感</p>
            <p style="font-size: 12px; color: #999; margin-top: 8px;">选中文字/图片/视频，或点击右上角按钮添加</p>
        </div>`;
        updateCount(0);
        return;
    }

    updateCount(ideas.length);

    // 按时间倒序
    ideas.sort((a, b) => b.id - a.id).forEach(idea => {
        const card = document.createElement('div');
        card.className = 'idea-card';
        card.dataset.id = idea.id;
        
        // 1. 顶部 Note (来源图标/文本 + 时间)
        let typeText = '灵感笔记';
        if (idea.type === 'link_grab') typeText = '网页采集';
        if (idea.type === 'image') typeText = '图片素材';
        if (idea.type === 'video') typeText = '视频素材';
        
        const topNoteHtml = `
            <div class="card-top-note">
               <span style="font-weight:600">${typeText}</span>
               <span>•</span>
               <span>${formatDate(idea.id)}</span>
            </div>
        `;

        // 2. 标题区域 (标题 + 打开按钮 -> 标题即链接)
        // 如果是链接，标题显示链接标题；如果是笔记，显示摘要
        const titleText = idea.title || (idea.content ? idea.content.substring(0, 30) + '...' : '无标题灵感');
        
        // 构建标题 HTML，如果是链接则添加点击事件和样式
        let titleHtml = '';
        if (idea.url) {
            // 使用 a 标签，target="_blank" 确保新标签页打开
            titleHtml = `<a href="${idea.url}" target="_blank" class="card-title-pill clickable" title="点击打开: ${idea.url}" style="text-decoration:none; display:block;">${titleText} <svg style="width:12px;height:12px;margin-left:4px;display:inline-block;vertical-align:middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>`;
        } else {
            titleHtml = `<div class="card-title-pill">${titleText}</div>`;
        }

        const headerRowHtml = `
            <div class="card-header-row">
                ${titleHtml}
            </div>
        `;

        // 3. 内容区域 (模拟 Chaos 风格的时间轴/Bracket 布局)
        let contentBodyHtml = '';
        
        // (A) 原始内容摘要 (作为第一个 Bracket 块 - 蓝色)
        const rawContent = idea.content ? idea.content.substring(0, 100) + (idea.content.length > 100 ? '...' : '') : '暂无内容';
        
        let mediaHtml = '';
        if (idea.base64) {
            mediaHtml = `<img src="${idea.base64}" class="card-image" />`;
        } else if (idea.type === 'video') {
            // 视频素材增强展示
            // 尝试从 content 中提取链接 (如果是纯链接)
            const urlMatch = idea.content.match(/(https?:\/\/[^\s]+)/);
            const videoUrl = idea.url || (urlMatch ? urlMatch[0] : null);
            
            // 占位封面或 iframe (这里用简单的封面占位)
            // 修正点击事件：使用 addEventListener 或在 onclick 中正确引用全局变量不可行，
            // 必须内联完整的 chrome.tabs.create 调用，或者使用 data-url 绑定事件。
            // 之前的 onclick="${videoUrl ? `chrome.tabs.create({url:'${videoUrl}'})` : ''}" 在 CSP 限制下可能不安全或不工作，
            // 但在 extension pages 通常允许。不过更稳健的方式是绑定 data-url。
            
            mediaHtml = `
                <div class="video-placeholder" data-url="${videoUrl || ''}" style="margin-top:8px; background:#000; border-radius:8px; height:120px; display:flex; align-items:center; justify-content:center; cursor:pointer; position:relative;">
                    <span style="font-size:24px;">▶️</span>
                    <span style="position:absolute; bottom:8px; right:8px; font-size:10px; color:#fff; background:rgba(0,0,0,0.5); padding:2px 4px; border-radius:4px;">视频素材</span>
                </div>
            `;
        }

        contentBodyHtml += `
            <div class="timeline-section">
                <div class="timeline-line blue"></div>
                <div class="timeline-item">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content" style="flex:1">
                        <div style="font-weight:600; color:var(--text-main); margin-bottom:4px;">原始内容</div>
                        ${rawContent}
                        ${mediaHtml}
                    </div>
                </div>
            </div>
        `;

        // (B) AI 分析结果 (作为第二个 Bracket 块 - 紫色)
        if (idea.aiAnalysis === 'analyzing') {
            contentBodyHtml += `
                <div class="timeline-section">
                    <div class="timeline-line purple"></div>
                    <div class="timeline-item">
                        <div class="timeline-dot"></div>
                        <div style="flex:1; color:var(--accent); font-style:italic;">
                            ✨ AI 正在深度拆解灵感...
                        </div>
                    </div>
                </div>
            `;
        } else if (idea.aiAnalysis) {
            // 解析 AI 结果，尝试识别 "核心观点" 和 "独特价值" 结构
            // 简单处理：将换行符视为列表项
            const analysisLines = idea.aiAnalysis.split('\n').filter(line => line.trim());
            
            let analysisItemsHtml = '';
            analysisLines.forEach(line => {
                // 移除 markdown 符号
                const cleanLine = line.replace(/^[-*]\s*/, '').replace(/\*\*/g, ''); 
                if (cleanLine.includes('核心观点') || cleanLine.includes('流量密码') || cleanLine.includes('二创思路') || cleanLine.includes('独特价值')) {
                     // 作为小标题
                     analysisItemsHtml += `<div class="section-title">${cleanLine}</div>`;
                } else {
                     // 作为列表项
                     analysisItemsHtml += `
                        <div class="timeline-item">
                            <div class="timeline-dot"></div>
                            <div style="flex:1">${cleanLine}</div>
                        </div>
                     `;
                }
            });

            contentBodyHtml += `
                <div class="timeline-section">
                    <div class="timeline-line purple"></div>
                    <div style="padding-top:2px;"> <!-- Container for items sharing this line -->
                        ${analysisItemsHtml}
                    </div>
                </div>
            `;
        }

        // 4. 底部工具栏 (图标)
        const bottomBarHtml = `
            <div class="card-bottom-bar">
                <button class="icon-action btn-chat" title="创作">${ICONS.chat}加入对话</button>
                <button class="icon-action btn-copy" title="复制">${ICONS.copy}</button>
                <button class="icon-action btn-retry" title="重试">${ICONS.retry}</button>
                <button class="icon-action btn-delete" title="删除" style="margin-left:auto;">${ICONS.delete}</button>
            </div>
        `;

        card.innerHTML = topNoteHtml + headerRowHtml + contentBodyHtml + bottomBarHtml;

        // 绑定事件
        card.querySelector('.btn-copy').addEventListener('click', (e) => {
            e.stopPropagation();
            copyToClipboard(idea.content + '\n\n' + (idea.aiAnalysis || ''));
            showToast('内容已复制');
        });

        card.querySelector('.btn-chat').addEventListener('click', (e) => {
            e.stopPropagation();
            insertIdeaToChat(idea);
        });

        card.querySelector('.btn-retry').addEventListener('click', (e) => {
            e.stopPropagation();
            retryAnalysis(idea.id);
        });

        card.querySelector('.btn-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            // 直接删除，轻交互
            deleteIdea(idea.id);
        });

        // 绑定视频封面点击事件
        const videoPlaceholder = card.querySelector('.video-placeholder');
        if (videoPlaceholder) {
            videoPlaceholder.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = videoPlaceholder.dataset.url;
                if (url) {
                    chrome.tabs.create({ url: url });
                }
            });
        }

        list.appendChild(card);
    });
}

// 更新计数
function updateCount(count) {
    const badge = document.getElementById('ideaCount');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

// 格式化时间戳
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// 复制功能
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(err => {
        console.error('Copy failed', err);
    });
}

// 删除灵感
function deleteIdea(id) {
    chrome.storage.local.get(['ideas'], (result) => {
        const ideas = result.ideas || [];
        const newIdeas = ideas.filter(i => i.id !== id);
        chrome.storage.local.set({ ideas: newIdeas }, () => {
            loadIdeas(); // 重新渲染
            showToast('已删除');
        });
    });
}

// 重试分析 (优化：更新现有条目)
function retryAnalysis(id) {
    chrome.storage.local.get(['ideas'], (result) => {
        const ideas = result.ideas || [];
        const idea = ideas.find(i => i.id === id);
        if (idea) {
            // 更新状态为分析中
            idea.aiAnalysis = 'analyzing';
            chrome.storage.local.set({ ideas: ideas }, () => {
                loadIdeas(); // 更新 UI
                
                // 发送给 background 重新分析
                chrome.runtime.sendMessage({ 
                    action: 'saveAndAnalyze', 
                    data: idea 
                });
                
                showToast('正在重新分析...');
            });
        }
    });
}

// ==========================================
// 5. 手动添加灵感
// ==========================================
function setupAddPanel() {
    const btnAdd = document.getElementById('btnAdd');
    const inputArea = document.getElementById('add-input-area');
    const input = document.getElementById('manualInput');
    const btnSubmit = document.getElementById('btnManualSubmit');

    if (!btnAdd || !inputArea) return;

    btnAdd.addEventListener('click', () => {
        // 切换显示输入框
        if (inputArea.style.display === 'none' || !inputArea.style.display) {
            inputArea.style.display = 'flex';
            input.focus();
        } else {
            inputArea.style.display = 'none';
        }
    });

    btnSubmit.addEventListener('click', () => {
        const content = input.value.trim();
        if (!content) return;

        // Check if it's a URL
        const urlRegex = /^(http|https):\/\/[^ "]+$/;
        const isUrl = urlRegex.test(content);

        const newIdea = {
            id: Date.now(),
            title: isUrl ? '正在抓取...' : '随手记',
            type: isUrl ? 'link_grab' : 'text',
            url: isUrl ? content : undefined,
            content: content,
            date: new Date().toLocaleDateString(),
            aiAnalysis: 'analyzing'
        };

        chrome.runtime.sendMessage({ action: 'saveAndAnalyze', data: newIdea });
        
        input.value = '';
        inputArea.style.display = 'none';
        
        // 切换到列表 Tab
        document.querySelector('[data-tab="view-ideas"]').click();
        showToast('已添加并开始分析');
    });
}

// ==========================================
// 6. 对话功能
// ==========================================
function setupChat() {
    const input = document.getElementById('chatInput');
    const btnSend = document.getElementById('btnSendChat');
    const suggestions = document.getElementById('chat-suggestions');

    // 绑定发送按钮
    if (btnSend) {
        btnSend.onclick = sendMessage;
    }

    // 绑定回车发送
    if (input) {
        input.onkeypress = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        };
    }

    // 快捷指令 (Event Delegation)
    if (suggestions) {
        // 清空现有内容，重新渲染完整列表
        suggestions.innerHTML = '';
        suggestions.onclick = (e) => {
            if (e.target.classList.contains('chip')) {
                const cmd = e.target.dataset.cmd;
                const label = e.target.textContent;
                if (cmd) {
                    sendQuickCommand(label, cmd);
                }
            }
        };
        
        // 定义常用快捷指令
        const quickActions = [
            { label: '选题建议', cmd: '你是一名**资深内容策划**。请根据当前内容生成 **5个高潜力的爆款选题建议**。要求：\n1. 选题要有吸引力，直击用户痛点或爽点\n2. 覆盖不同角度（如：干货、情感、争议、盘点等）\n3. 每个选题附带一句话的简短推荐理由' },
            { label: '总结摘要', cmd: '你是一名**资深信息分析师**。请总结这篇文章的**核心内容**，要求：\n1. 提取3-5个关键信息点\n2. 语言简洁有力，逻辑清晰\n3. 保留原文的重要数据或结论' },
            { label: '提取金句', cmd: '你是一名**金句捕手**。请从文中提取**3-5条最具传播力的金句**，要求：\n1. 观点犀利，引发共鸣\n2. 适合做海报或朋友圈文案\n3. 如果原文没有明显的金句，请基于原文核心观点进行润色升华' },
            { label: '生成封面图', cmd: '请为这段内容设计一张**封面图**。请生成一张 16:9 的宽屏图片，画面要精美，构图具有设计感，能够概括文章主题。' },
            { label: '快传号文章', cmd: '请将这段内容扩写成一篇**深度快传号文章**。要求：\n1. 标题要具有点击欲\n2. 结构清晰（引入-分析-结论）\n3. 语言通顺流畅，排版优美\n4. 适当增加案例或论据支撑观点\n5. 根据文章需要配图并插在文章中间\n6. 文章最后列出引入的出处' },
            { label: '短视频脚本', cmd: '请将这段内容改编成**短视频拍摄脚本**。要求：\n1. 包含【画面描述】和【口播台词】两部分\n2. 开头前3秒要有黄金3秒钩子，吸引注意力\n3. 时长控制在1分钟以内' },
            { label: '小红书文案', cmd: '请将这段内容改写成**小红书爆款文案**风格。要求：\n1. 标题要吸引眼球（使用二极管标题法）\n2. 正文分段，多使用Emoji表情\n3. 语气亲切活泼，像闺蜜聊天\n4. 文末添加相关的热门Hashtag' }
        ];
        
        // 批量渲染
        quickActions.forEach(action => {
             const chip = document.createElement('span');
             chip.className = 'chip';
             chip.dataset.cmd = action.cmd;
             chip.textContent = action.label;
             suggestions.appendChild(chip);
        });
    }
}

// ==========================================
// 修正后的 sendMessage
// ==========================================
function sendMessage() {
    const input = document.getElementById('chatInput');
    const btnClear = document.getElementById('btnClearInput');
    const text = input.value.trim();
    if (!text) return;

    appendMessage('user', text);
    input.value = '';
    
    // 重置状态
    if (btnClear) btnClear.style.display = 'none';
    input.style.height = '24px';

    sendToBackground(text);
}

// ==========================================
// 修正后的 sendQuickCommand
// ==========================================
function sendQuickCommand(label, cmd) {
    // 界面显示 Label (短文本)
    appendMessage('user', label);
    // 后台发送 Command (长 Prompt)
    sendToBackground(cmd);
}

// ==========================================
// 统一的发送逻辑 (带历史记录)
// ==========================================
function sendToBackground(currentText) {
    const messages = [];

    // 1. 上下文
    // (已移除：不再单独添加 System 消息，而是将上下文合并到最后一条 User 消息中，避免多 System 消息导致 API 报错)
    /*
    if (activeIdeaContext) {
        messages.push({ 
            role: "system", 
            content: `用户正在引用以下灵感素材...` 
        });
    }
    */

    // 2. 历史记录 (从 DOM 获取)
    const historyWrappers = document.querySelectorAll('.message-wrapper');
    const domMsgs = [];
    historyWrappers.forEach(wrapper => {
        const bubble = wrapper.querySelector('.message-bubble');
        if (!bubble || bubble.classList.contains('loading-message')) return;
        
        const role = wrapper.classList.contains('user') ? 'user' : 'assistant';
        let content = bubble.innerText; 
        
        // 过滤掉 context-message (它是特殊的 message 类型，不是 wrapper.user/ai ?)
        // insertIdeaToChat 插入的是 .message.context-message，没有 wrapper user/ai 类
        // 所以上面的 querySelectorAll('.message-wrapper') 已经过滤掉了 context-message
        // 这是对的，context 已经通过 activeIdeaContext 传了，不需要在 history 里重复
        
        domMsgs.push({ role, content });
    });
    
    // 3. 截取并合并
    // 确保最后一条是当前消息 (domMsgs 应该已经包含了 appendMessage 加进去的那条)
    // 如果 domMsgs 为空 (第一条)，或者最后一条不是当前文本 (异常情况)，补上
    const lastMsg = domMsgs[domMsgs.length - 1];
    if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content.trim() !== currentText.trim()) {
        domMsgs.push({ role: 'user', content: currentText });
    }
    
    // 取最近 10 条
    const recentMsgs = domMsgs.slice(-10);
    
    // 关键修复：确保 activeIdeaContext 始终作为最新的系统指令插入
    // 之前是把 context 放在开头，但如果历史记录很长，AI 可能会忘记开头的 context，
    // 或者被历史记录中旧的 context 干扰。
    // 策略：
    // 1. 保留开头的 context (作为背景)
    // 2. 如果 activeIdeaContext 存在，在 history 之后再次强化强调当前正在讨论这个素材
    // 但不能直接加在 messages 数组末尾，因为末尾必须是 user 消息（对于某些严格模型）。
    // 所以我们把 context 信息拼接到最后一条 User 消息中。
    
    if (activeIdeaContext) {
        // 找到最后一条 user 消息
        const lastUserMsgIndex = recentMsgs.findLastIndex(m => m.role === 'user');
        if (lastUserMsgIndex !== -1) {
            const originalContent = recentMsgs[lastUserMsgIndex].content;
            // 只有当这条消息没有包含 context 信息时才添加 (简单判断长度或关键词)
            // 或者无脑添加，因为这是最新的指令
            const contextContent = (activeIdeaContext.content || '').substring(0, 3000) + (activeIdeaContext.content?.length > 3000 ? '...' : '');
            recentMsgs[lastUserMsgIndex].content = `【当前引用的灵感素材】：\n标题：${activeIdeaContext.title || '无标题'}\n内容：${contextContent}\nAI分析：${activeIdeaContext.aiAnalysis || '暂无'}\n\n基于以上素材，请执行指令：${originalContent}`;
        }
    }
    
    messages.push(...recentMsgs);

    appendMessage('ai', 'loading...');
    chrome.runtime.sendMessage({ action: 'chatWithAI', messages: messages });
}

function appendMessage(role, text) {
    const history = document.getElementById('chatHistory');
    
    // 移除欢迎语
    const welcome = document.getElementById('chatWelcome');
    if (welcome) welcome.style.display = 'none';

    // 创建消息 Wrapper
    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${role}`; // user or ai
    
    // 消息气泡
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${role}-message`;
    
    if (role === 'ai') {
        if (text === 'loading...') {
            bubble.classList.add('loading-message');
            bubble.innerHTML = '<span class="loading-dots">思考中</span>';
        } else {
            bubble.classList.add('ai-message');
            bubble.innerHTML = text.replace(/\n/g, '<br>');
        }
    } else {
        bubble.textContent = text;
    }
    
    wrapper.appendChild(bubble);
    history.appendChild(wrapper);
    history.scrollTop = history.scrollHeight;
    
    // 返回 bubble 供流式更新
    return bubble; 
}

// 将灵感插入对话
function insertIdeaToChat(idea) {
    // 切换到对话 Tab
    document.querySelector('[data-tab="view-chat"]').click();
    
    // 不再填充输入框，而是直接在聊天记录中展示引用
    const history = document.getElementById('chatHistory');
    const contextDiv = document.createElement('div');
    contextDiv.className = 'message context-message';
    
    // 截取部分内容展示
    const previewContent = idea.content || (idea.type === 'image' ? '[图片素材]' : '暂无内容');
    const preview = previewContent.length > 80 ? previewContent.substring(0, 80) + '...' : previewContent;
    
    contextDiv.innerHTML = `
        <div class="context-header"><strong>📖 引用灵感素材</strong></div>
        <div class="context-body">${preview}</div>
        <div class="context-tip">已添加引用，请直接在下方输入指令...</div>
    `;
    
    history.appendChild(contextDiv);
    history.scrollTop = history.scrollHeight;

    // 设置全局上下文，供下一次发送使用
    activeIdeaContext = idea;
    
    // 聚焦输入框
    document.getElementById('chatInput').focus();
}

// ==========================================
// 7. 消息监听 (更新 UI)
// ==========================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'analysisStream') {
        // 更新灵感卡片状态
        if (message.status === 'start') {
            // 已经在 renderIdeas 处理了 analyzing 状态，这里可以忽略或做动画
        } else if (message.status === 'error') {
            loadIdeas(); // 重新加载以显示错误
        } else if (message.status === 'process') {
            // 实时流式更新 DOM
            const ideaId = message.id;
            const chunk = message.chunk;
            
            // 找到对应的卡片
            const card = document.querySelector(`.idea-card[data-id="${ideaId}"]`);
            if (card) {
                // 找到分析结果区域
                let analysisSection = card.querySelector('.timeline-line.purple')?.parentNode;
                
                // 如果还没有分析区域（第一次收到 chunk），或者还在显示 "analyzing..."
                if (!analysisSection || analysisSection.textContent.includes('AI 正在深度拆解')) {
                    // 清空或创建容器
                    // 注意：renderIdeas 中如果 aiAnalysis='analyzing' 会渲染占位符
                    // 我们需要替换它
                    
                    // 查找占位符容器
                    const placeholder = card.querySelector('.timeline-item .timeline-content .italic') || // 假设有 italic 类? 
                                      card.querySelector('.timeline-line.purple + .timeline-item'); // 更好的定位
                    
                    if (placeholder) {
                        // 替换整个 timeline-item 内容为新的容器
                        placeholder.innerHTML = `
                            <div class="timeline-dot"></div>
                            <div class="timeline-content ai-result-stream" style="flex:1; white-space: pre-wrap;"></div>
                        `;
                        // 缓存当前内容到 DOM 属性，避免频繁读取
                        placeholder.querySelector('.ai-result-stream').textContent = chunk;
                    } else {
                        // 如果连占位符都没找到（极其罕见），可能需要重新 render
                        // 但为了性能，尝试追加
                    }
                } else {
                    // 已有内容，追加
                    const streamDiv = card.querySelector('.ai-result-stream');
                    if (streamDiv) {
                        streamDiv.textContent += chunk;
                    } else {
                        // 如果之前已经是静态内容（比如刷新页面后），可能没有 .ai-result-stream 类
                        // 这里可以不做处理，或者尝试查找文本节点追加
                        // 简单起见，仅支持当前会话的流式更新
                    }
                }
            }
        } else if (message.status === 'end') {
            // 流式结束，可以触发一次保存后的刷新，或者保持当前状态
            // 由于 background 已经保存了完整内容，这里不需要做太多
            // 但为了格式化（比如把纯文本变成 Core View/Unique Value 结构），
            // 可以重新 loadIdeas()，但这会导致闪烁。
            // 更好的做法是：在 process 阶段只显示纯文本，end 阶段解析 markdown 并美化
            
            // 暂时保持纯文本，或延迟刷新
            // loadIdeas(); // 可选：刷新以应用格式化渲染
        }
    } else if (message.action === 'switchTab') {
        if (message.tab === 'chat') {
            document.querySelector('[data-tab="view-chat"]').click();
        } else if (message.tab === 'help') {
            document.querySelector('[data-tab="view-help"]').click();
        }
    } else if (message.action === 'setChatContext') {
        // 设置上下文并显示
        const context = message.context;
        // 复用 insertIdeaToChat 逻辑，但不需要 idea ID
        // 构造一个临时 idea 对象
        const tempIdea = {
            title: context.title,
            content: context.content,
            url: context.url,
            type: 'link_grab',
            aiAnalysis: '暂无'
        };
        insertIdeaToChat(tempIdea);
    }
});

// 优化后的流式消息处理
let currentAiMsgDiv = null;
let currentAiMsgContent = '';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'chatStream') {
        if (message.status === 'start') {
            // 移除之前的 loading 消息
            const loaders = document.querySelectorAll('.loading-message');
            loaders.forEach(el => {
                const wrapper = el.closest('.message-wrapper');
                if (wrapper) wrapper.remove();
            });

            currentAiMsgContent = '';
            currentAiMsgDiv = appendMessage('ai', ''); // 创建空消息容器
        } else if (message.status === 'process') {
            if (currentAiMsgDiv) {
                const chunk = message.chunk;
                currentAiMsgContent += chunk;
                
                // 实时渲染文本 (处理 Markdown)
                // 简单处理：将换行转 <br>
                // 高级处理：检测 [IMAGE: ...] 标签
                
                // 1. 临时移除 IMAGE 标签以纯文本显示，或者保留
                let displayHtml = currentAiMsgContent
                    .replace(/\n/g, '<br>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                
                // 2. 检测完整的 IMAGE 标签并替换为占位符
                // 修复：使用 [\s\S] 支持跨行匹配，防止 AI 输出换行导致匹配失败
                const imgTagRegex = /\[IMAGE:\s*([\s\S]*?)\]/g;
                
                // 修改 regex replace 逻辑：
                displayHtml = displayHtml.replace(imgTagRegex, (match, prompt) => {
                     // 去除首尾空白，避免换行符影响
                     prompt = prompt.trim();
                     if (!prompt) return match; // 空描述不处理

                     // 为 prompt 生成确定性 ID (base64 or hash)，或者简单使用 prompt 本身做 key
                     // 这里为了简单，用 prompt 的简单 hash
                     const promptHash = Array.from(prompt).reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0);
                     // 使用 data-prompt 作为唯一标识，不需要 ID
                     
                     // 如果已经有生成的图片 URL (缓存)，直接显示
                     if (window.generatedImages && window.generatedImages[prompt]) {
                         return `<img src="${window.generatedImages[prompt]}" style="max-width:100%; border-radius:8px; margin: 8px 0;">`;
                     }

                     return `<div class="image-generating" data-prompt="${prompt.replace(/"/g, '&quot;')}">
                        <span class="loading-dots">🎨 正在根据描述绘图...</span>
                        <span style="font-size:10px; opacity:0.7; display:block; margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:200px;">"${prompt}"</span>
                    </div>`;
                });

                currentAiMsgDiv.innerHTML = displayHtml;
                
                // 扫描所有 .image-generating 元素并触发
                const placeHolders = currentAiMsgDiv.querySelectorAll('.image-generating');
                placeHolders.forEach(div => {
                    const prompt = div.dataset.prompt;
                    if (!prompt) return;
                    
                    if (!window.generatingImages) window.generatingImages = {};
                    if (!window.generatedImages) window.generatedImages = {};
                    
                    // 避免重复触发
                    if (window.generatingImages[prompt]) return;
                    
                    window.generatingImages[prompt] = true;
                    
                    // 调用后台生图
                    chrome.runtime.sendMessage({ action: 'generateImage', prompt: prompt }, (response) => {
                        if (response && response.success) {
                            window.generatedImages[prompt] = response.url;
                            
                            // 查找当前 DOM 中的所有该 prompt 的占位符并替换
                            const currentDivs = document.querySelectorAll(`.image-generating[data-prompt="${prompt.replace(/"/g, '\\"')}"]`);
                            currentDivs.forEach(d => {
                                d.outerHTML = `<img src="${response.url}" style="max-width:100%; border-radius:8px;">`;
                            });
                        } else {
                             const currentDivs = document.querySelectorAll(`.image-generating[data-prompt="${prompt.replace(/"/g, '\\"')}"]`);
                             currentDivs.forEach(d => {
                                 d.innerHTML = `<span style="color:red">图片生成失败</span>`;
                             });
                             delete window.generatingImages[prompt]; // 允许重试
                        }
                    });
                });
                
                // 滚动到底部
                const history = document.getElementById('chatHistory');
                history.scrollTop = history.scrollHeight;
            }
        } else if (message.status === 'end') {
            // 结束时添加交互按钮
            if (currentAiMsgDiv) {
                addMessageActions(currentAiMsgDiv, currentAiMsgContent);
            }
            currentAiMsgDiv = null;
            window.generatingImages = {}; // 重置生图锁
        } else if (message.status === 'error') {
             // 移除 loading 消息
             const loaders = document.querySelectorAll('.loading-message');
             loaders.forEach(el => {
                const wrapper = el.closest('.message-wrapper');
                if (wrapper) wrapper.remove();
             });

             if (currentAiMsgDiv) {
                 currentAiMsgDiv.innerHTML += `<br><span style="color:red">❌ ${message.error}</span>`;
             } else {
                 // 如果还没开始就报错（例如 API 400/401），直接显示错误气泡
                 appendMessage('ai', `<span style="color:red">❌ ${message.error}</span>`);
             }
        }
    } else if (message.action === 'switchTab') {
        if (message.tab === 'chat') {
            document.querySelector('[data-tab="view-chat"]').click();
        }
    }
});

function addMessageActions(msgDiv, content) {
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-actions';
    
    // 复制 (增强：处理图片)
    const btnCopy = document.createElement('button');
    btnCopy.className = 'msg-action-btn';
    btnCopy.innerHTML = ICONS.copy; // 使用已有图标
    btnCopy.title = '复制内容（含图片）';
    btnCopy.onclick = async () => {
        try {
            // 1. 尝试查找生成的图片
            const img = msgDiv.parentElement.querySelector('img');
            if (img && img.src) {
                // 如果有图片，尝试复制图片
                // 注意：跨域图片或普通 URL 复制到剪贴板比较复杂
                // 方案 A: 仅复制图片 URL
                // 方案 B: 尝试 Fetch blob 并写入 clipboard
                
                try {
                    const response = await fetch(img.src);
                    const blob = await response.blob();
                    await navigator.clipboard.write([
                        new ClipboardItem({
                            [blob.type]: blob
                        })
                    ]);
                    showToast('图片已复制到剪贴板');
                    return;
                } catch (e) {
                    console.error("Image copy failed", e);
                    // 降级：仅复制文本
                }
            }

            // 2. 复制纯文本 (去除 IMAGE 标签)
            const cleanText = content.replace(/\[IMAGE:.*?\]/g, '');
            await navigator.clipboard.writeText(cleanText);
            showToast('文本已复制');
        } catch (err) {
            showToast('复制失败: ' + err.message);
        }
    };
    
    // 重试 (重新发送上一条用户消息)
    const btnRetry = document.createElement('button');
    btnRetry.className = 'msg-action-btn';
    btnRetry.innerHTML = ICONS.retry;
    btnRetry.title = '重试';
    btnRetry.onclick = () => {
        // 查找最近一条用户消息内容
        const userMsgs = document.querySelectorAll('.message-wrapper.user .message-bubble');
        if (userMsgs.length > 0) {
            const lastMsgText = userMsgs[userMsgs.length - 1].textContent;
            // 重新填入并发送
            const input = document.getElementById('chatInput');
            input.value = lastMsgText;
            document.getElementById('btnSendChat').click();
        } else {
             showToast('未找到历史指令');
        }
    };
    
    // 发布 (Mock -> Real Link)
    const btnPublish = document.createElement('button');
    btnPublish.className = 'msg-action-btn';
    btnPublish.innerHTML = ICONS.send; 
    btnPublish.title = '发布到快传号';
    btnPublish.onclick = () => {
        showToast('正在跳转发布页面...');
        chrome.tabs.create({ url: 'https://kuaichuan.360kuai.com/#/console/publish/article' });
    };

    actionsDiv.appendChild(btnCopy);
    actionsDiv.appendChild(btnRetry);
    actionsDiv.appendChild(btnPublish);
    
    msgDiv.parentNode.insertBefore(actionsDiv, msgDiv.nextSibling);
    // 注意：msgDiv 是 .message 元素，我们把 actions 放在它下面
    // 更好的结构是：message wrapper 包含 bubble 和 actions
    // 这里简单处理：直接插在 message div 后面 (作为独立行)
}

// 监听存储变化，自动刷新列表
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.ideas) {
        // 只有当不在输入状态或拖拽状态时才刷新，避免打断用户
        // 简单处理：直接刷新
        loadIdeas();
    }
    if (namespace === 'local' && changes.userInfo) {
        // 登录状态变化
        const newStatus = changes.userInfo.newValue?.status;
        if (newStatus === 'logged_in') {
            showMainPanel();
        } else {
            showLoginPanel();
        }
    }
});

// 简单的 Toast 提示
function showToast(msg) {
    // 移除已存在的 toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    
    // 动画结束自动移除
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// ==========================================
// 8. 登录与权限控制
// ==========================================
function initLoginPanel() {
    // 绑定事件
    const btnJump = document.getElementById('btnLoginJump');
    const btnCheck = document.getElementById('btnCheckLogin');
    
    if (btnJump) {
        btnJump.addEventListener('click', () => {
            chrome.tabs.create({ url: 'https://kuaichuan.360kuai.com' });
        });
    }

    if (btnCheck) {
        btnCheck.addEventListener('click', async () => {
            const msg = document.getElementById('loginMsg');
            
            btnCheck.disabled = true;
            btnCheck.textContent = '正在检查...';
            msg.textContent = '';
            
            const isLogged = await checkLoginStatus();
            
            if (isLogged) {
                msg.style.color = '#52c41a';
                msg.textContent = '登录成功！正在进入...';
                setTimeout(() => {
                    showMainPanel();
                }, 800);
            } else {
                msg.style.color = '#f5222d';
                msg.textContent = '未检测到登录状态，请先在快传号登录。';
                btnCheck.disabled = false;
                btnCheck.textContent = '🔄 我已登录，同步状态';
            }
        });
    }
}

async function checkLoginStatus() {
    let isLoggedIn = false;
    
    // 1. Try Fetch (Most accurate but might fail due to CORS/Network)
    // 访问 /console/home 接口，如果返回 200 则说明已登录，重定向(302)通常意味着未登录
    try {
        const response = await fetch('https://kuaichuan.360kuai.com/console/home', {
            method: 'HEAD',
            redirect: 'manual' // 禁止自动重定向，以便捕获 302
        });
        // 登录成功通常是 200；如果是 302 跳转到 login 页则说明未登录
        if (response.status === 200) {
            isLoggedIn = true;
        }
    } catch (e) {
        console.warn("Login fetch check failed, falling back to cookies", e);
    }

    // 2. Fallback to Cookies if fetch failed or returned false (double check)
    if (!isLoggedIn) {
        try {
            // Check cookies for both main domain and subdomain
            // 快传号的关键 Cookie 可能在 .360kuai.com 或 kuaichuan.360kuai.com 下
            // 常见的登录态 Cookie 如 "Q", "T", "login" 等，这里只要有任意 Cookie 就假设可能已登录
            // 更严谨的做法是检查特定 Key
            const cookiesMain = await chrome.cookies.getAll({ domain: '360kuai.com' });
            const cookiesSub = await chrome.cookies.getAll({ domain: '.360kuai.com' });
            
            // 简单判断：是否有相关域名的 Cookie
            if (cookiesMain.length > 0 || cookiesSub.length > 0) {
                // 这里做一个假设：如果有 Cookie 但 Fetch 失败（可能是 403/302），则 Fetch 结果更准
                // 但如果 Fetch 是因为网络错误 (TypeError)，则 Cookie 可能是有效的兜底
                // 鉴于 fetch 已经 try-catch 了，如果 fetch 明确返回了非 200，isLoggedIn 就是 false
                // 所以这里只在 fetch 抛出异常（网络不通等）且 isLoggedIn 仍为 false 时，才考虑 Cookie
                // 但为了保险，如果 fetch 没成功 (例如 CORS 限制)，我们还是信任 Cookie 存在即可能登录
                
                // 实际上，为了用户体验，宁可误判已登录（进去后接口报错），也不要误判未登录（死活进不去）
                // 除非 fetch 明确返回了 302/401/403
                
                isLoggedIn = true;
            }
        } catch (e) {
             console.error("Cookie check failed", e);
        }
    }

    await setLoginState(isLoggedIn);
    return isLoggedIn;
}

async function setLoginState(isLoggedIn) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ userInfo: isLoggedIn ? { status: 'logged_in' } : null }, resolve);
    });
}

function showLoginPanel() {
    const loginView = document.getElementById('view-login');
    if (loginView) loginView.style.display = 'flex';
    
    // 隐藏其他
    document.querySelector('.tab-bar').style.display = 'none';
    document.querySelectorAll('.view-container').forEach(el => {
        if (el.id !== 'view-login') el.style.display = 'none';
    });
}

function showMainPanel() {
    const loginView = document.getElementById('view-login');
    if (loginView) loginView.style.display = 'none';
    
    document.querySelector('.tab-bar').style.display = 'flex';
    
    // 恢复之前的 Tab 或默认 Ideas
    const activeTab = document.querySelector('.tab-item.active');
    if (activeTab) {
        const targetId = activeTab.dataset.tab;
        document.getElementById(targetId).classList.add('active');
    } else {
        document.querySelector('[data-tab="view-ideas"]').click();
    }
}
