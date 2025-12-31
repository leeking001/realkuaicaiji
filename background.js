// ==========================================
// 0. 安装引导
// ==========================================
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.tabs.create({ url: "welcome.html" });
    } else if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
        // Optional: show update notes or just ignore
    }
});

// ==========================================
// 1. 配置区域
// ==========================================
const API_CONFIG = {
  url: "http://ai.leeking001.com/chat",
  imgUrl: "http://ai.leeking001.com/image", 
  
  // 文本模型
  model: "volcengine/doubao-seed-1-6-flash-disable-thinking", 
  
  // 生图模型
  imgModel: "volcengine/doubao-seedream-4.5"
};

// ==========================================
// 1.5. 点击插件图标打开侧边栏
// ==========================================
// 设置侧边栏行为：点击图标时打开侧边栏
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// 辅助函数：提取指定类名的 DIV 内容 (支持嵌套)
function extractContentByClass(html, classNameRegexStr) {
    try {
        const regex = new RegExp(`<div[^>]*class=["'][^"']*(?:${classNameRegexStr})[^"']*["'][^>]*>`, 'i');
        const match = html.match(regex);
        if (!match) return null;
        
        let startIndex = match.index;
        let openCount = 1;
        let currentIndex = startIndex + match[0].length;
        
        // 简单的栈平衡算法
        while (openCount > 0 && currentIndex < html.length) {
            const nextOpen = html.indexOf('<div', currentIndex);
            const nextClose = html.indexOf('</div>', currentIndex);
            
            if (nextClose === -1) break; // 结构不完整
            
            if (nextOpen !== -1 && nextOpen < nextClose) {
                openCount++;
                currentIndex = nextOpen + 4;
            } else {
                openCount--;
                currentIndex = nextClose + 6;
            }
        }
        
        return html.substring(startIndex, currentIndex);
    } catch(e) {
        console.error("Extract content error", e);
        return null;
    }
}

// ==========================================
// 2. 消息监听
// ==========================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'saveAndAnalyze') {
    // 自动打开侧边栏
    if (sender.tab && sender.tab.windowId) {
        chrome.sidePanel.open({ windowId: sender.tab.windowId }).catch(err => console.error("自动打开侧边栏失败:", err));
    }
    handleSaveAndAnalyze(message.data);
  } else if (message.action === 'openSidePanel') {
    // 优先使用 sender.tab.windowId，如果没有（比如来自 popup），则获取当前窗口
    if (sender.tab && sender.tab.windowId) {
      chrome.sidePanel.open({ windowId: sender.tab.windowId }).catch(err => console.error("无法打开侧边栏:", err));
    } else {
        // 尝试获取当前活动窗口
        chrome.windows.getCurrent((win) => {
            if (win && win.id) {
                chrome.sidePanel.open({ windowId: win.id }).catch(err => console.error("无法打开侧边栏:", err));
            }
        });
  }
} else if (message.action === 'openChat') {
    // 打开侧边栏并切换到对话 Tab
    const winId = sender.tab?.windowId;
    if (winId) {
      chrome.sidePanel.open({ windowId: winId }).catch(console.error);
    } else {
      chrome.windows.getCurrent((win) => {
          if (win && win.id) chrome.sidePanel.open({ windowId: win.id }).catch(console.error);
      });
    }
    
    // 延时发送切换消息，确保侧边栏已加载
    setTimeout(() => {
      chrome.runtime.sendMessage({ action: 'switchTab', tab: 'chat' }).catch(()=>{});
    }, 500);

  } else if (message.action === 'openChatWithContext') {
    // 1. 打开侧边栏
    const winId = sender.tab?.windowId;
    if (winId) {
      chrome.sidePanel.open({ windowId: winId }).catch(console.error);
    } else {
      chrome.windows.getCurrent((win) => {
          if (win && win.id) chrome.sidePanel.open({ windowId: win.id }).catch(console.error);
      });
    }

    // 2. 延时发送上下文给 sidepanel
    setTimeout(() => {
        // 先切换 Tab
        chrome.runtime.sendMessage({ action: 'switchTab', tab: 'chat' }).catch(()=>{});
        // 再发送 Context
        chrome.runtime.sendMessage({ action: 'setChatContext', context: message.context }).catch(()=>{});
    }, 800);

  } else if (message.action === 'openHelp') {
    // 打开侧边栏并切换到帮助 Tab
    const winId = sender.tab?.windowId;
    if (winId) {
      chrome.sidePanel.open({ windowId: winId }).catch(console.error);
    } else {
      chrome.windows.getCurrent((win) => {
          if (win && win.id) chrome.sidePanel.open({ windowId: win.id }).catch(console.error);
      });
    }
    
    // 延时发送切换消息
    setTimeout(() => {
      chrome.runtime.sendMessage({ action: 'switchTab', tab: 'help' }).catch(()=>{});
    }, 500);

  } else if (message.action === 'chatWithAI') {
    handleChatStream(message.messages);
  } else if (message.action === 'generateImage') {
    // 处理生图请求 (异步)
    handleImageGeneration(message.prompt).then(res => sendResponse(res));
    return true; 
  } else if (message.action === 'translateBatch') {
    handleTranslateBatch(message.texts).then(res => sendResponse(res));
    return true;
  }
});

// ==========================================
// 3. 聊天流式逻辑 (自动配图版)
// ==========================================
// 辅助函数：获取或生成 UserID
async function getUserId() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['userId'], (result) => {
      if (result.userId) {
        resolve(result.userId);
      } else {
        // 生成 UUID v4 (简单实现)
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
        chrome.storage.local.set({ userId: uuid }, () => {
          resolve(uuid);
        });
      }
    });
  });
}

// 辅助函数：处理流式响应 (Robust SSE Parser + Throttling)
class StreamPacer {
    constructor(onChunk, minDelay = 30) {
        this.onChunk = onChunk;
        this.minDelay = minDelay;
        this.queue = [];
        this.isProcessing = false;
    }

    push(chunk) {
        // 如果 chunk 太长，拆分它以确保平滑
        const maxChunkSize = 10;
        for (let i = 0; i < chunk.length; i += maxChunkSize) {
            this.queue.push(chunk.substring(i, i + maxChunkSize));
        }
        this.process();
    }

    async process() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        while (this.queue.length > 0) {
            const chunk = this.queue.shift();
            this.onChunk(chunk);
            await new Promise(r => setTimeout(r, this.minDelay));
        }

        this.isProcessing = false;
    }
}

async function readSSEResponse(reader, onChunk) {
    const decoder = new TextDecoder("utf-8");
    let buffer = '';
    let isStream = false;
    let fullText = '';
    
    // 初始化节流器
    const pacer = new StreamPacer(onChunk);

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop(); 
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            
            if (trimmedLine.startsWith('data:')) {
                isStream = true;
                const jsonStr = trimmedLine.replace('data: ', '').trim();
                
                if (jsonStr === '[DONE]') continue;
                
                try {
                    const json = JSON.parse(jsonStr);
                    const content = json.choices?.[0]?.delta?.content || 
                                  json.choices?.[0]?.text || '';
                    if (content) {
                        // 使用 Pacer 发送
                        pacer.push(content);
                        fullText += content;
                    }
                } catch (e) {}
            } else {
                 try {
                     fullText += trimmedLine;
                 } catch(e) {}
            }
        }
    }
    
    // 等待队列清空
    while (pacer.isProcessing || pacer.queue.length > 0) {
        await new Promise(r => setTimeout(r, 50));
    }
    
    if (buffer && buffer.startsWith('data:')) {
        try {
             const jsonStr = buffer.replace('data: ', '').trim();
             const json = JSON.parse(jsonStr);
             const content = json.choices?.[0]?.delta?.content || '';
             if (content) {
                 pacer.push(content); // Push last chunk
                 fullText += content;
             }
        } catch(e) {}
    } else if (buffer) {
        fullText += buffer;
    }

    return { isStream, fullText };
}

async function handleChatStream(messages) {
  const userId = await getUserId();
  const systemPrompt = `
    你是一个专业的自媒体文章创作助手。
    
    【任务】：
    1. 根据用户提供的素材和需求创作文章。
    2. **按需配图**：只有当用户明确要求"配图"、"生成图片"时，才在合适的位置插入图片。
    3. 如果需要配图，请使用标记 \`[IMAGE: 具体的画面描述]\`。画面描述要具体（包含主体、环境、风格），方便生图模型理解。
    4. **禁止使用Markdown格式**：
       - 绝对不要使用 # 标题、**加粗**、*斜体*、> 引用、- 列表等 Markdown 符号。
       - **标题必须是纯文本，独占一行，不要使用 # 符号**。
       - 使用自然段落和空行分隔，确保用户可以直接复制粘贴到富媒体编辑器（如微信公众号后台）。
       - 如果需要强调，可以使用【】或“”。
    
    【示例】：
    (用户要求配图时)
    ...随着科技的发展，AI已经渗透到生活的方方面面。

    [IMAGE: 一个充满未来感的智慧城市街道，霓虹灯闪烁，机器人与人类和谐共处，赛博朋克风格]

    首先，在教育领域...
  `;

  // 构建完整的消息列表
  const apiMessages = [
    { role: "user", content: systemPrompt + "\n\n" + (messages[0]?.content || "") },
    // 过滤掉所有非 standard 属性的消息对象，防止 API 拒绝
    ...messages.slice(1).map(m => ({ role: m.role, content: m.content })).slice(-10) 
  ];

  try {
    console.log("Starting chat request...");

    const response = await sendLLMRequest(apiMessages);
    
    if (!response.ok) {
        // Handle 502/504 Bad Gateway / Gateway Timeout specifically
        const errorText = await response.text();
        
        // Attempt to salvage stream data from error text
        if ((response.status === 504 || response.status === 502) && errorText.includes('data:')) {
             console.log("Attempting to recover stream from 502/504 error body...");
             const lines = errorText.split('\n');
             for (const line of lines) {
                if (line.startsWith('data:')) {
                    const jsonStr = line.replace('data: ', '').trim();
                    if (jsonStr === '[DONE]') break;
                    try {
                        const json = JSON.parse(jsonStr);
                        const content = json.choices[0]?.delta?.content || '';
                        if (content) {
                             chrome.runtime.sendMessage({ action: 'chatStream', status: 'process', chunk: content }).catch(()=>{});
                        }
                    } catch (e) {}
                }
             }
             chrome.runtime.sendMessage({ action: 'chatStream', status: 'end' }).catch(()=>{});
             return; 
        }

        if (response.status === 504) {
            throw new Error("服务器响应超时 (504)。\n请务必更新后端 Node.js 代码（修复 Content-Type 问题），并检查函数超时设置。");
        }
        throw new Error(`API Error ${response.status}: ${errorText.substring(0, 100)}`); 
    }
    
    const reader = response.body.getReader();

    // 通知前端：开始
    chrome.runtime.sendMessage({ action: 'chatStream', status: 'start' }).catch(()=>{});

    // 使用新的 SSE Parser
    const { isStream, fullText } = await readSSEResponse(reader, (chunk) => {
         chrome.runtime.sendMessage({ action: 'chatStream', status: 'process', chunk: chunk }).catch(()=>{});
    });

    // 如果未检测到流式（说明返回的是一次性 JSON），则使用伪流式输出
    if (!isStream && fullText.trim().startsWith('{')) {
        try {
            const json = JSON.parse(fullText);
            if (json.error) throw new Error(json.error.message || JSON.stringify(json.error));

            const content = json.choices?.[0]?.message?.content || json.choices?.[0]?.text || '';
            if (content) {
                // 使用伪流式输出
                const pacer = new StreamPacer((chunk) => {
                    chrome.runtime.sendMessage({ action: 'chatStream', status: 'process', chunk: chunk }).catch(()=>{});
                });
                pacer.push(content);
                while (pacer.isProcessing || pacer.queue.length > 0) {
                    await new Promise(r => setTimeout(r, 50));
                }
            }
        } catch (e) {
             if (e.message && e.message.includes('JSON syntax error')) throw e; 
        }
    }
    
    // 通知前端：结束
    chrome.runtime.sendMessage({ action: 'chatStream', status: 'end' }).catch(()=>{});

  } catch (error) {
    chrome.runtime.sendMessage({ action: 'chatStream', status: 'error', error: error.message }).catch(()=>{});
  }
}

// ==========================================
// 4. 生图逻辑 (优先搜索，兜底生成)
// ==========================================
async function handleImageGeneration(prompt) {
  // 直接调用生图模型
  return await callImageGenerationApi(prompt);
}

async function callImageGenerationApi(prompt) {
  const userId = await getUserId();
  try {
    const response = await fetch(API_CONFIG.imgUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userId,
        'X-Ca-Nonce': crypto.randomUUID(),
        'X-Ca-Timestamp': Date.now().toString()
      },
      body: JSON.stringify({
        model: API_CONFIG.imgModel,
        prompt: prompt,
        size: "1024x768", // 4:3 比例
        n: 1
      })
    });
    
    // 增加 robust parsing
    const data = await response.json();
    
    // 1. 标准 OpenAI 格式 { data: [{ url: "..." }] }
    if (data.data && data.data[0] && data.data[0].url) {
      return { success: true, url: data.data[0].url, source: 'generation' };
    } 
    // 2. Base64 格式 { data: [{ b64_json: "..." }] }
    else if (data.data && data.data[0] && data.data[0].b64_json) {
        return { success: true, url: "data:image/png;base64," + data.data[0].b64_json, source: 'generation' };
    }
    // 3. 扁平格式 (某些代理) { url: "..." }
    else if (data.url) {
        return { success: true, url: data.url, source: 'generation' };
    }
    // 4. 嵌套 output 格式 { output: { url: "..." } }
    else if (data.output && data.output.url) {
        return { success: true, url: data.output.url, source: 'generation' };
    }
    else {
      // 包含原始响应以便调试
      throw new Error("格式无法解析: " + JSON.stringify(data).substring(0, 200));
    }
  } catch (error) {
    console.error("Image Gen Error:", error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// 5. 保存与分析 (保持不变)
// ==========================================
async function handleSaveAndAnalyze(ideaData) {
  ideaData.aiAnalysis = "analyzing";

  // 1. 立即保存占位数据，让前端立刻显示（优化交互）
  await saveToStorage(ideaData);
  
  // Force AI crawl for link_grab type, ignoring any pre-fetched content or local extraction.
  // This satisfies the requirement: "采集本网页和手动添加链接，全部使用AI抓取逻辑，去掉普通的页面内容提取方式"
  if (ideaData.type === 'link_grab') {
      try {
           // Fallback to local fetch if AI fails
           const localData = await fetchPageContent(ideaData.url);
           if (localData && localData.content && localData.content.length > 50) {
               ideaData.content = localData.content;
               // 强制更新标题，覆盖默认的 "正在抓取..."
               if (localData.title) ideaData.title = localData.title;
               ideaData.note = (ideaData.note ? ideaData.note + "\n" : "") + "(已使用本地提取)";
           } else if (ideaData.desc) {
               // Fallback to meta description
               ideaData.content = ideaData.desc;
               ideaData.note = (ideaData.note ? ideaData.note + "\n" : "") + "(抓取失败，仅使用页面简介)";
           } else {
               ideaData.content = "AI 抓取失败，请检查链接或稍后重试。";
           }
      } catch (e) { 
          ideaData.content = "抓取异常: " + e.message; 
      }
  } else if (ideaData.type === 'image') { 
      try { ideaData.base64 = await fetchImageAsBase64(ideaData.content); } catch (e) {} 
  }
  
  // 2. 更新数据 (覆盖之前的占位符)
  await saveToStorage(ideaData);
  
  try {
    await callAI_Stream(ideaData);
  } catch (error) { 
    updateIdeaAIResult(ideaData.id, `❌ 失败: ${error.message}`); 
    chrome.runtime.sendMessage({ 
        action: 'analysisStream', 
        id: ideaData.id, 
        status: 'error', 
        error: error.message 
    }).catch(()=>{});
  }
}

async function saveToStorage(idea) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['ideas'], (result) => {
      let ideas = result.ideas || [];
      // 检查是否存在相同 ID 的灵感
      const index = ideas.findIndex(i => i.id === idea.id);
      
      if (index !== -1) {
        // 更新现有灵感 (保持原有位置或置顶？通常重试应保持原位或置顶，这里选择置顶以反馈更新)
        // 用户反馈：点击重试在原有内容上重新生成，不要产生一条新的
        // 所以我们更新原位置
        ideas[index] = idea;
      } else {
        // 新增灵感
        ideas.unshift(idea);
      }
      
      // 限制最大存储数量，例如 100 条
      if (ideas.length > 100) {
        ideas = ideas.slice(0, 100);
      }
      
      chrome.storage.local.set({ ideas: ideas }, resolve);
    });
  });
}

function updateIdeaAIResult(id, resultText) {
  chrome.storage.local.get(['ideas'], (data) => {
    const ideas = data.ideas || [];
    const idea = ideas.find(i => i.id === id);
    if (idea) {
      idea.aiAnalysis = resultText;
      chrome.storage.local.set({ ideas: ideas });
    }
  });
}

// ==========================================
// 6. AI 核心逻辑 (灵感分析)
// ==========================================
async function sendLLMRequest(messages, retryCount = 0) {
    const userId = await getUserId();
    try {
        const response = await fetch(API_CONFIG.url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-User-ID': userId,
                'X-Ca-Nonce': crypto.randomUUID(),
                'X-Ca-Timestamp': Date.now().toString()
            },
            body: JSON.stringify({ 
                model: API_CONFIG.model, 
                messages: messages, 
                stream: true 
            })
        });
        return response;
    } catch (error) {
        console.error(`Fetch failed (attempt ${retryCount + 1}):`, error);
        if (retryCount < 1) { // Retry once
             await new Promise(r => setTimeout(r, 1000));
             return sendLLMRequest(messages, retryCount + 1);
        }
        throw error;
    }
}

async function callAI_Stream(idea) {
  const userId = await getUserId();
  const promptBase = `
    你是一名**资深自媒体内容操盘手**。请以**专业、犀利**的视角，对以下素材进行深度拆解。
    
    【任务】：
    1. **核心观点**：提炼一句**金句式**总结，直击本质，具有传播力。
    2. **流量密码**：分析该素材为何能火？用一句话总结（如：情绪共鸣、认知反差、实用干货等），并指出其受众心理。
    3. **二创思路**：给出1个**爆款选题切入点**，适合发在快传号，用一句话总结。
    
    【输出格式】（严格遵守，不要废话）：
    **灵感拆解**：
    - 核心观点：...
    - 流量密码：...
    - 二创思路：...
  `;

  let messages = [];

  // 支持图片识别 (Multimodal)
  if (idea.type === 'image' && idea.base64) {
      messages = [{
          role: "user",
          content: [
              { type: "text", text: promptBase + "\n\n【素材内容】：(见附图)" },
              { type: "image_url", image_url: { url: idea.base64 } }
          ]
      }];
  } else if (idea.type === 'video') {
      // 视频处理逻辑：优先使用采集到的标题和简介，如果没内容再用 title 兜底
      const videoInfo = `【视频素材】\n标题：${idea.title || '未知'}\n简介/内容：${idea.desc || idea.content || '暂无详细内容'}`;
      messages = [{ role: "user", content: promptBase + `\n\n${videoInfo}` }];
  } else {
      const fullPrompt = promptBase + `\n\n【素材内容】：\n${idea.content ? idea.content.substring(0, 2000) : ''}`;
      messages = [{ role: "user", content: fullPrompt }];
  }

  const response = await fetch(API_CONFIG.url, {
    method: 'POST',
    headers: { 
        'Content-Type': 'application/json',
        'X-User-ID': userId,
        'X-Ca-Nonce': crypto.randomUUID(),
        'X-Ca-Timestamp': Date.now().toString()
    },
    body: JSON.stringify({ model: API_CONFIG.model, messages: messages, stream: true })
  });
  
  if (!response.ok) {
      const errorText = await response.text();
      
      // Attempt to salvage stream data from error text (502/504 specific)
      if ((response.status === 504 || response.status === 502) && errorText.includes('data:')) {
           console.log("Attempting to recover stream from 502/504 error body...");
           const lines = errorText.split('\n');
           let recoveredText = '';
           for (const line of lines) {
              if (line.startsWith('data:')) {
                  const jsonStr = line.replace('data: ', '').trim();
                  if (jsonStr === '[DONE]') break;
                  try {
                      const json = JSON.parse(jsonStr);
                      const content = json.choices[0]?.delta?.content || '';
                      if (content) {
                           recoveredText += content;
                           chrome.runtime.sendMessage({ action: 'analysisStream', id: idea.id, status: 'process', chunk: content }).catch(()=>{});
                      }
                  } catch (e) {}
              }
           }
           chrome.runtime.sendMessage({ action: 'analysisStream', id: idea.id, status: 'end' }).catch(()=>{});
           updateIdeaAIResult(idea.id, recoveredText || "❌ 分析部分失败：超时截断");
           return; // Successfully recovered
      }

      throw new Error(`API Error ${response.status}: ${errorText}`);
  }
  
  const reader = response.body.getReader();
  
  chrome.runtime.sendMessage({ action: 'analysisStream', id: idea.id, status: 'start' }).catch(()=>{});
  
  // 使用新的 SSE Parser (复用 robust logic)
  const { isStream, fullText } = await readSSEResponse(reader, (chunk) => {
       chrome.runtime.sendMessage({ action: 'analysisStream', id: idea.id, status: 'process', chunk: chunk }).catch(()=>{});
  });

  // If not identified as stream, try to parse fullText as JSON response
  if (!isStream && fullText.trim().startsWith('{')) {
      try {
          const json = JSON.parse(fullText);
          if (json.error) {
               throw new Error(json.error.message || JSON.stringify(json.error));
          }

          const content = json.choices?.[0]?.message?.content || json.choices?.[0]?.text || '';
          if (content) {
              // Send it as one big chunk (via Pacer for simulation)
              const pacer = new StreamPacer((chunk) => {
                  chrome.runtime.sendMessage({ action: 'analysisStream', id: idea.id, status: 'process', chunk: chunk }).catch(()=>{});
              });
              pacer.push(content);
              // Wait for simulation to finish
              while (pacer.isProcessing || pacer.queue.length > 0) {
                  await new Promise(r => setTimeout(r, 50));
              }
          }
      } catch (e) {
          if (e.message && e.message.includes('JSON syntax error')) throw e; 
      }
  }
  
  chrome.runtime.sendMessage({ action: 'analysisStream', id: idea.id, status: 'end' }).catch(()=>{});
  
  if (!fullText) {
       updateIdeaAIResult(idea.id, "❌ 分析失败：AI 未返回任何内容");
  } else {
       updateIdeaAIResult(idea.id, fullText);
  }
}

// ==========================================
// 7. 辅助工具
// ==========================================
async function fetchImageAsBase64(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

async function fetchPageContent(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': url // 增加 Referer 模拟正常访问
      }
    });
    const html = await res.text();
    
    // 提取标题
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : null;
    
    // 预处理：移除明显噪音
    let cleanHtml = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
      .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '');

    // 提取正文区域：优先 article > main > body
    let contentHtml = cleanHtml;
    
    // 1. 尝试通过类名智能提取 (支持 article-content, news_txt 等常见正文类名)
    const specificContent = extractContentByClass(cleanHtml, "article-content|news_txt|main-text|rich_media_content|entry-content|post-content|article-body|content|art_content|article_content");
    if (specificContent && specificContent.length > 100) {
        contentHtml = specificContent;
    } else {
        // 2. 否则使用 Readability 核心逻辑 (简化版)
        // 移除多余标签
        cleanHtml = cleanHtml.replace(/<[^>]+>/g, '\n');
    }
    
    // 3. 清洗文本
    let text = contentHtml
        .replace(/<[^>]+>/g, '\n') // 再次确保移除标签
        .replace(/\n\s*\n/g, '\n')
        .trim();
        
    // 4. 如果提取内容太少 (可能因为 JS 渲染)，尝试获取 meta description
    if (!text || text.length < 50) {
        const metaDescMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
        if (metaDescMatch) {
             text = metaDescMatch[1].trim();
        }
    }

    return { title, content: text };
  } catch (error) {
    console.error("Fetch Page Error:", error);
    return null; // 不抛出错误，由调用方处理
  }
}


// 翻译逻辑
async function handleTranslateBatch(texts) {
  // 简单的 Mock 翻译，实际请对接 LLM 或翻译 API
  // 这里为了演示，直接返回原文加 " (已翻译)"
  return texts.map(t => t + " (已翻译)");
}


