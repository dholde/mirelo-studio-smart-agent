const PAGE_SOURCE = "mirelo-knowledge-page";
const EXTENSION_SOURCE = "mirelo-knowledge-extension";

window.addEventListener("message", (event) => {
  if (event.source !== window || event.origin !== "https://mirelo.ai") return;
  const data = event.data;
  if (!data || data.source !== PAGE_SOURCE) return;
  if (data.type === "open-options") {
    chrome.runtime.openOptionsPage();
    return;
  }
  if (data.type !== "optimize") return;
  const requestId = data.requestId;
  chrome.runtime.sendMessage({ type: "optimize", text: data.text, field: data.field }, (response) => {
    const failed = chrome.runtime.lastError;
    window.postMessage({
      source: EXTENSION_SOURCE,
      type: "optimize-result",
      requestId,
      ok: !failed && response?.ok === true,
      improvements: typeof response?.improvements === "string" ? response.improvements : "",
      prompt: typeof response?.prompt === "string" ? response.prompt : "",
      error: failed ? "failed" : (typeof response?.error === "string" ? response.error : "failed"),
    }, "https://mirelo.ai");
  });
});

const script = document.createElement("script");
script.src = chrome.runtime.getURL("content.js");
script.onload = () => script.remove();
document.documentElement.append(script);
