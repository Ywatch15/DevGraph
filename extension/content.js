// Content script — extracts data from web pages when requested
// This runs in the context of the web page

(function () {
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extractPage") {
      const data = {
        title: document.title,
        url: window.location.href,
        selectedText: window.getSelection()?.toString() || "",
        codeBlocks: [],
        metaDescription:
          document.querySelector('meta[name="description"]')?.content || "",
      };

      // Extract code blocks
      document.querySelectorAll("pre code, pre, code").forEach((el) => {
        const text = el.textContent?.trim();
        if (text && text.length > 10 && text.length < 10000) {
          // Try to detect language from class
          const langClass = el.className.match(/language-(\w+)/);
          data.codeBlocks.push({
            code: text,
            language: langClass ? langClass[1] : "plaintext",
          });
        }
      });

      // Deduplicate by code content
      const seen = new Set();
      data.codeBlocks = data.codeBlocks
        .filter((b) => {
          if (seen.has(b.code)) return false;
          seen.add(b.code);
          return true;
        })
        .slice(0, 10);

      sendResponse(data);
    }
  });
})();
