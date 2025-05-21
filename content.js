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
  alert('Tóm tắt nội dung sẽ xử lý ở đây');
  // Gửi message tới background để xử lý (nếu có)
});

document.getElementById('btn-chat').addEventListener('click', () => {
  alert('Chat AI sẽ được tích hợp ở đây');
});
