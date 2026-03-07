/* eslint-disable no-undef */

let token = null;
let apiUrl = "http://localhost:5000/api";

// Elements
const loginSection = document.getElementById("login-section");
const captureSection = document.getElementById("capture-section");
const loginBtn = document.getElementById("login-btn");
const captureBtn = document.getElementById("capture-btn");
const saveBtn = document.getElementById("save-btn");
const logoutBtn = document.getElementById("logout-btn");
const loginError = document.getElementById("login-error");
const statusEl = document.getElementById("status");

// Init — check for saved session
chrome.storage.local.get(
  ["devgraph_token", "devgraph_user", "devgraph_api"],
  (result) => {
    if (result.devgraph_token && result.devgraph_user) {
      token = result.devgraph_token;
      if (result.devgraph_api) apiUrl = result.devgraph_api;
      document.getElementById("user-name").textContent = result.devgraph_user;
      loginSection.classList.add("hidden");
      captureSection.classList.remove("hidden");
    }
  },
);

// Login
loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  apiUrl = document.getElementById("api-url").value || apiUrl;

  loginError.textContent = "";

  try {
    const res = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      loginError.textContent = data.error || "Login failed";
      return;
    }

    token = data.token;
    chrome.storage.local.set({
      devgraph_token: data.token,
      devgraph_user: data.user.name,
      devgraph_api: apiUrl,
    });

    document.getElementById("user-name").textContent = data.user.name;
    loginSection.classList.add("hidden");
    captureSection.classList.remove("hidden");
  } catch (err) {
    loginError.textContent = "Connection failed. Check API URL.";
  }
});

// Capture page
captureBtn.addEventListener("click", async () => {
  statusEl.textContent = "Capturing...";

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Extract page data
        const title = document.title;
        const selectedText = window.getSelection()?.toString() || "";

        // Extract code blocks
        const codeBlocks = [];
        document.querySelectorAll("pre code, pre, code").forEach((el) => {
          const text = el.textContent?.trim();
          if (text && text.length > 10 && text.length < 10000) {
            codeBlocks.push(text);
          }
        });

        // Deduplicate
        const uniqueBlocks = [...new Set(codeBlocks)];

        return {
          title,
          url: window.location.href,
          selectedText,
          codeBlocks: uniqueBlocks.slice(0, 10),
        };
      },
    });

    const pageData = results[0]?.result;
    if (pageData) {
      document.getElementById("title").value = pageData.title || "";
      document.getElementById("description").value =
        pageData.selectedText || "";

      // Render snippets
      const container = document.getElementById("snippets-container");
      container.innerHTML = "";

      if (pageData.codeBlocks.length > 0) {
        pageData.codeBlocks.forEach((code, i) => {
          const div = document.createElement("div");
          div.className = "snippet-item" + (i === 0 ? " selected" : "");
          div.textContent = code.slice(0, 200);
          div.dataset.code = code;
          div.addEventListener("click", () => {
            container
              .querySelectorAll(".snippet-item")
              .forEach((el) => el.classList.remove("selected"));
            div.classList.add("selected");
          });
          container.appendChild(div);
        });
      } else {
        container.innerHTML =
          '<p class="muted">No code blocks found on page</p>';
      }

      statusEl.textContent = `Captured: ${pageData.codeBlocks.length} code blocks found`;
    }
  } catch (err) {
    statusEl.textContent = "Failed to capture page";
  }
});

// Save to DevGraph
saveBtn.addEventListener("click", async () => {
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const tagsRaw = document.getElementById("tags").value;
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  // Get selected snippet
  const selectedSnippet = document.querySelector(".snippet-item.selected");
  const codeSnippet = selectedSnippet?.dataset?.code || "";

  if (!title) {
    statusEl.textContent = "Title is required";
    return;
  }

  statusEl.textContent = "Saving...";

  try {
    const res = await fetch(`${apiUrl}/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        description,
        codeSnippet,
        tags,
        sourceUrl: "",
        visibility: "private",
        category: codeSnippet ? "snippet" : "learning",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      statusEl.textContent = data.error || "Save failed";
      return;
    }

    statusEl.textContent = "✅ Saved to DevGraph!";
    setTimeout(() => {
      statusEl.textContent = "";
    }, 3000);
  } catch (err) {
    statusEl.textContent = "Failed to save. Check connection.";
  }
});

// Logout
logoutBtn.addEventListener("click", () => {
  chrome.storage.local.remove([
    "devgraph_token",
    "devgraph_user",
    "devgraph_api",
  ]);
  token = null;
  loginSection.classList.remove("hidden");
  captureSection.classList.add("hidden");
});
