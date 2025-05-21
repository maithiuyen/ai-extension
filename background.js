chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "VIDEO_INFO") {
    console.log("YouTube video info:", message.payload);
    // Gửi đến API tóm tắt ở đây nếu muốn
  }
});
