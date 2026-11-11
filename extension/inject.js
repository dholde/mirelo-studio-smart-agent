fetch(chrome.runtime.getURL("content.js"))
  .then((response) => response.text())
  .then((code) => {
    const script = document.createElement("script");
    script.textContent = code;
    document.documentElement.append(script);
    script.remove();
  });
