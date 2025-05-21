document.getElementById("summarizeBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => {
        const title = document.querySelector('h1.title')?.innerText || '';
        return title;
      }
    }, (results) => {
      const title = results[0].result;
      // Gọi API tóm tắt với title
      fetch('https://api.your-ai.com/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      })
        .then(res => res.json())
        .then(data => {
          document.getElementById("summary").innerText = data.summary;
        })
        .catch(err => {
          document.getElementById("summary").innerText = "Lỗi khi gọi AI.";
        });
    });
  });
});
