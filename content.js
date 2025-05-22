function getVideoInfo() {
  const title = document.querySelector('h1.title')?.innerText || '';
  const url = window.location.href;

  chrome.runtime.sendMessage({
    type: "VIDEO_INFO",
    payload: { title, url }
  });
}
window.addEventListener("yt-navigate-finish", getVideoInfo); // SPA navigation
getVideoInfo(); // fallback


chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "extract_main_content") {
    try {
      const article = new Readability(document.cloneNode(true)).parse();
      sendResponse({ content: article?.textContent || "Không tìm thấy nội dung chính." });
    } catch (e) {
      sendResponse({ content: "Lỗi khi trích xuất nội dung: " + e.message });
    }
  }
  return true; // Đảm bảo sendResponse async hoạt động
});

// Show chatbox on all pages
// Tạo nút chính
const floatingBtn = document.createElement('div');
floatingBtn.id = 'floating-ai-button';
floatingBtn.innerHTML = `<img src="${chrome.runtime.getURL('icons/icon.png')}" />`;

document.body.appendChild(floatingBtn);

// Tạo thanh công cụ
const toolbar = document.createElement('div');
toolbar.id = 'floating-toolbar';
toolbar.innerHTML = `
  <img src="${chrome.runtime.getURL('icons/summarize.png')}" title="Tóm tắt" id="btn-summary"/>
  <img src="${chrome.runtime.getURL('icons/chat.png')}" title="Chat AI" id="btn-chat"/>
`;
document.body.appendChild(toolbar);

// Hiện toolbar khi hover
floatingBtn.addEventListener('mouseenter', () => {
  toolbar.style.display = 'flex';
});
toolbar.addEventListener('mouseleave', () => {
  toolbar.style.display = 'none';
});

// Click: chạy chức năng
document.getElementById('btn-summary').addEventListener('click', () => {
  const result = extractMainContent();
  debugger
});

document.getElementById('btn-chat').addEventListener('click', () => {
  alert('Chat AI sẽ được tích hợp ở đây');
});


// Ensure Readability is loaded (add it before this script in manifest)
function extractMainContent() {
  const documentClone = document.cloneNode(true); // Không phá vỡ trang
  const article = new Readability(documentClone).parse();

  if (!article) {
    return { title: "", content: "", textContent: "Không trích xuất được nội dung." };
  }

  return {
    title: article.title,
    content: article.content,         // HTML content
    textContent: article.textContent  // Plain text content
  };
}



// Bôi đen nội dung
// Tạo DOM cho toolbar
const aiToolbar = document.createElement("div");
aiToolbar.id = "ai-selection-toolbar";
aiToolbar.innerHTML = `
  <button id="ai-summarize-btn">🔍 Tóm tắt</button>
  <button id="ai-translate-btn">🌐 Dịch</button>
`;
aiToolbar.style.display = "none";
document.body.appendChild(aiToolbar);

// Lắng nghe khi người dùng bôi đen văn bản
document.addEventListener("mouseup", (e) => {
  const selection = window.getSelection();
  const text = selection.toString().trim();

  if (text.length > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Đặt vị trí toolbar gần vùng được bôi đen
    aiToolbar.style.top = `${window.scrollY + rect.top - 40}px`;
    aiToolbar.style.left = `${window.scrollX + rect.left}px`;
    aiToolbar.style.display = "flex";
    aiToolbar.setAttribute("data-selected-text", text);
  } else {
    aiToolbar.style.display = "none";
  }
});

// Khi click vào nút "Tóm tắt"
document.getElementById("ai-summarize-btn").addEventListener("click", () => {
  const selectedText = aiToolbar.getAttribute("data-selected-text");
  if (selectedText) {
    console.log("Tóm tắt đoạn:", selectedText);
    createChatBox(selectedText);
    // Gửi đến background / popup / AI xử lý
  }
});

// Khi click vào nút "Dịch"
document.getElementById("ai-translate-btn").addEventListener("click", () => {
  const selectedText = aiToolbar.getAttribute("data-selected-text");
  if (selectedText) {
    console.log("Dịch đoạn:", selectedText);
    // Gửi đến background / xử lý dịch
  }
});


// Chatbox

// === Chatbox ===
function createChatBox(initialMessage = "") {
  if (document.getElementById("ai-chatbox")) return;

  const chat = document.createElement("div");
  chat.id = "ai-chatbox";
  chat.innerHTML = `
    <div id="ai-chatbox-header">🤖 AI Chat</div>
    <div id="ai-chatbox-messages"></div>
    <div id="ai-chatbox-input">
      <textarea rows="2" placeholder="Nhập câu hỏi..."></textarea>
      <button>Gửi</button>
    </div>
  `;
  document.body.appendChild(chat);

  const messages = chat.querySelector("#ai-chatbox-messages");
  const input = chat.querySelector("textarea");
  const button = chat.querySelector("button");

  function appendMessage(sender, text) {
    const div = document.createElement("div");
    div.className = "chat-message";
    div.innerHTML = `<b>${sender}:</b> <span class="msg-text">${text}</span>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div.querySelector(".msg-text");
  }

  // Gửi nội dung ban đầu
  const userSpan = appendMessage("Người dùng", initialMessage);
  const aiSpan = appendMessage("AI", "");

  fetchAndStream(initialMessage, chunk => {
    aiSpan.textContent += chunk;
  });

  button.addEventListener("click", () => {
    const userText = input.value.trim();
    if (!userText) return;
    input.value = "";

    const userSpan2 = appendMessage("Người dùng", userText);
    const aiSpan2 = appendMessage("AI", "");
    fetchAndStream(userText, chunk => {
      aiSpan2.textContent += chunk;
    });
  });
}


// Fetch and stream
async function fetchAndStream(content, appendFn) {
  const response = await fetch("https://dev.qccoccocmedia.vn/hackathon/summary", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      content: content,
      stream: true
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    // Cắt theo dòng hoặc dấu ngắt logic, tùy server bạn trả về
    appendFn(buffer); // hoặc appendFn(chunk) nếu bạn tách từng dòng
    buffer = "";
  }
}